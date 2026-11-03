import { normalizePaper, generateMarkdown, generateBibtex, parseBibtex, DEFAULT_OWNER } from '../publication-manager/publication.mjs';

const fail = message => { throw new Error(`迁移信息无效：${message}`); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const copy = value => JSON.parse(JSON.stringify(value));
const fold = value => String(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const sectionNames = ['Abstract', 'Citation', '中文引用（GB/T 7714）'];

function sections(body) {
  const headings = [...body.matchAll(/^##[ \t]+([^\r\n]+)[ \t]*\r?\n/gm)];
  return new Map(headings.map((heading, index) => [heading[1].trim(), {
    start: heading.index + heading[0].length,
    end: headings[index + 1]?.index ?? body.length,
  }]));
}

function jsonFrontmatter(markdown) {
  const text = markdown.replace(/^\uFEFF/, '');
  if (!text.startsWith('{')) return null;
  let depth = 0;
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '\\') index++;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) {
      try { return JSON.parse(text.slice(0, index + 1)); } catch { return null; }
    }
  }
  return null;
}

/** A marker alone never exempts an ordinary, still-rendered paper from conflicts. */
export function isMigratedBackup(markdown) {
  const json = jsonFrontmatter(markdown);
  if (json) {
    const build = json.build || json._build;
    return json.cms_migrated === true && object(build) && build.render === 'never' && build.list === 'never' && build.publishResources === false;
  }
  const front = markdown.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)?.[1];
  if (!front || !/^cms_migrated:[ \t]*true[ \t]*$/m.test(front)) return false;
  const block = front.match(/^(?:build|_build):[ \t]*\r?\n((?:[ \t]+[^\r\n]*(?:\r?\n|$))*)/m)?.[1];
  return Boolean(block && /^[ ]{2}render:[ \t]*["']?never["']?[ \t]*$/m.test(block)
    && /^[ ]{2}list:[ \t]*["']?never["']?[ \t]*$/m.test(block)
    && /^[ ]{2}publishResources:[ \t]*false[ \t]*$/m.test(block));
}

export function validateMigration(value, slug, owner = DEFAULT_OWNER) {
  // CMS recursively removes empty values from objects and arrays on save.
  // A JSON string keeps positional author-note blanks and all archived source
  // bytes opaque to that sanitizer. Older unsaved object records still work.
  if (object(value) && Object.hasOwn(value, 'payload')) {
    if (value.version !== 1) fail('不支持的迁移包装版本。');
    if (typeof value.payload !== 'string' || !value.payload.trim()) fail('迁移保护载荷必须是非空 JSON 文字。');
    if (Buffer.byteLength(value.payload, 'utf8') > 800_000) fail('迁移保护载荷超过 800 KB。');
    try { value = JSON.parse(value.payload); }
    catch { fail('迁移保护载荷不是有效的 JSON。'); }
  }
  if (!object(value) || value.version !== 1) fail('不支持的迁移版本。');
  if (value.originalPath !== `content/publications/${slug}/index.md` || value.originalUrl !== `/publications/${slug}/`) fail('原始目录和页面地址必须与记录文件名一致。');
  if (!object(value.frontmatter) || !object(value.baseline)) fail('缺少原始元数据或字段基线。');
  for (const field of ['body', 'bibtex']) {
    if (typeof value[field] !== 'string' || !value[field] || value[field].length > 300_000 || value[field].includes('\u0000')) fail(`原始 ${field} 内容无效。`);
  }
  if (value.attribution != null && (typeof value.attribution !== 'string' || value.attribution.length > 20_000 || value.attribution.includes('\u0000'))) fail('来源说明格式无效。');
  if (value.attribution && !value.body.includes(value.attribution)) fail('受保护的来源说明不在原始正文中。');
  const originalSections = sections(value.body);
  if (originalSections.size !== 3 || sectionNames.some(name => !originalSections.has(name))) fail('原始正文必须包含完整的摘要和两种引用。');
  parseBibtex(value.bibtex);
  const baseline = normalizePaper({ ...value.baseline, slug }, owner);
  return { ...value, baseline };
}

function projection(paper, keys) {
  return keys.map(key => key === 'authors' ? paper.authors.map(author => author.name) : paper[key]);
}

const citationKeys = ['title', 'authors', 'date', 'type', 'venue', 'volume', 'issue', 'pages', 'articleNumber', 'location', 'doi'];
const bibliographyKeys = [...citationKeys, 'projectUrl', 'abstract', 'bibtex'];

function withoutAttribution(abstract, attribution) {
  return attribution ? abstract.replace(attribution, '').trim() : abstract;
}

function rewriteBody(paper, migration, owner) {
  const baseline = migration.baseline;
  const citationMetadataChanged = !same(projection(paper, citationKeys), projection(baseline, citationKeys));
  const citationPaper = { ...paper };
  // Original custom references remain exact until their bibliographic facts
  // change. Then refresh untouched baseline references rather than publishing
  // the old title/year with newly edited metadata; explicit edits still win.
  if (citationMetadataChanged) {
    for (const key of ['citationEnglish', 'citationChinese']) if (paper[key] === baseline[key]) citationPaper[key] = '';
  }
  const generatedBody = generateMarkdown(citationPaper, owner).split(/^---\s*$/m).slice(2).join('---');
  const generatedSections = sections(generatedBody);
  const generated = name => {
    const section = generatedSections.get(name);
    return generatedBody.slice(section.start, section.end).trim();
  };
  const changes = new Map();
  if (paper.abstract !== baseline.abstract) {
    const abstract = migration.attribution && !paper.abstract.includes(migration.attribution)
      ? [paper.abstract, migration.attribution].filter(Boolean).join('\n\n') : paper.abstract;
    changes.set('Abstract', abstract);
  }
  if (paper.citationEnglish !== baseline.citationEnglish || citationMetadataChanged) changes.set('Citation', generated('Citation'));
  if (paper.citationChinese !== baseline.citationChinese || citationMetadataChanged) changes.set('中文引用（GB/T 7714）', generated('中文引用（GB/T 7714）'));
  let result = migration.body;
  const positions = sections(migration.body);
  // Replace from the end so offsets and all surrounding headings/whitespace
  // remain untouched, including CRLF line endings in older source files.
  for (const [name, content] of [...changes].sort((a, b) => positions.get(b[0]).start - positions.get(a[0]).start)) {
    const section = positions.get(name);
    const old = result.slice(section.start, section.end);
    const prefix = old.match(/^\s*/)?.[0] || '';
    const suffix = old.match(/\s*$/)?.[0] || '';
    const newline = old.includes('\r\n') ? '\r\n' : '\n';
    result = result.slice(0, section.start) + prefix + content.replace(/\r?\n/g, newline) + suffix + result.slice(section.end);
  }
  return result;
}

function overlayFrontmatter(paper, migration, owner) {
  const front = copy(migration.frontmatter);
  const ownerNames = ['me', owner.display, `${owner.family}, ${owner.given}`].map(fold);
  front.title = paper.title;
  front.authors = paper.authors.map(author => ownerNames.includes(fold(author.name)) ? 'me' : author.name);
  if (Object.hasOwn(front, 'author_notes') || paper.authors.some(author => author.note)) front.author_notes = paper.authors.map(author => author.note);
  front.date = `${paper.date}T00:00:00Z`;
  front.publication_types = [paper.type];
  front.publication = object(front.publication) ? front.publication : {};
  front.publication.name = paper.venue;
  for (const [field, value] of Object.entries({ short_name: paper.venueShort, volume: paper.volume, issue: paper.issue, pages: paper.pages, article_number: paper.articleNumber, location: paper.location })) {
    if (value) front.publication[field] = value;
    else delete front.publication[field];
  }
  front.peer_reviewed ??= true;
  front.featured = paper.featured;
  if (Object.hasOwn(front, 'open_access') || paper.openAccess) front.open_access = paper.openAccess;
  if (Object.hasOwn(front, 'tags') || paper.tags.length) front.tags = paper.tags;
  const managedLinks = { pdf: paper.pdfUrl, slides: paper.slidesUrl, code: paper.codeUrl, project: paper.projectUrl, video: paper.videoUrl };
  const links = Array.isArray(front.links) ? front.links : [];
  const retained = links.filter(link => !Object.hasOwn(managedLinks, link.type));
  for (const [type, url] of Object.entries(managedLinks)) if (url) retained.push({ ...links.find(link => link.type === type), type, url });
  if (Object.hasOwn(front, 'links') || retained.length) front.links = retained;
  if (paper.doi || object(front.hugoblox)) {
    front.hugoblox = object(front.hugoblox) ? front.hugoblox : {};
    front.hugoblox.ids = object(front.hugoblox.ids) ? front.hugoblox.ids : {};
    if (paper.doi) front.hugoblox.ids.doi = paper.doi;
    else delete front.hugoblox.ids.doi;
  }
  delete front.cms_migrated;
  front.url = migration.originalUrl;
  front.draft = false;
  return front;
}

export function renderMigratedPublication(paper, migration, owner = DEFAULT_OWNER) {
  const frontmatter = overlayFrontmatter(paper, migration, owner);
  const body = rewriteBody(paper, migration, owner);
  const originalBibliography = same(projection(paper, bibliographyKeys), projection(migration.baseline, bibliographyKeys));
  const bibtex = originalBibliography ? migration.bibtex : generateBibtex({ ...paper, abstract: withoutAttribution(paper.abstract, migration.attribution) });
  return { indexMarkdown: `${JSON.stringify(frontmatter, null, 2)}\n${body}`, bibtex };
}
