import { readFile, readdir, mkdir, writeFile, lstat, realpath, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readOwner, importBibtex, normalizePaper, generateMarkdown, generateBibtex, listPublications } from '../publication-manager/publication.mjs';
import { validateMigration, isMigratedBackup, renderMigratedPublication } from './migration.mjs';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRelative = 'data/online_publications';
const outputRelative = 'content/publications/online';
const markerName = '.generated-by-online-publications.json';
const generator = 'online-publications';
const fold = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const fail = message => { throw new Error(message); };

function inside(root, filename) {
  const relative = path.relative(root, filename);
  if (relative === '' || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) fail(`路径越出了允许目录：${filename}`);
  return filename;
}

// Reject links/junctions on source, media, and generated paths. A CMS submission
// may contain URLs, but it must never redirect a filesystem operation outside root.
async function safePath(root, relative) {
  const destination = inside(root, path.resolve(root, relative));
  let current = root;
  for (const component of path.relative(root, destination).split(path.sep)) {
    current = path.join(current, component);
    try {
      if ((await lstat(current)).isSymbolicLink()) fail(`目录中含有符号链接，无法继续：${path.relative(root, current)}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return destination;
}

async function exists(filename) {
  try { return await lstat(filename); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function ownership(root, directory) {
  inside(path.join(root, 'content/publications'), directory);
  const information = await exists(directory);
  if (!information) return null;
  if (!information.isDirectory() || information.isSymbolicLink()) fail('在线论文输出位置不是普通目录，未进行修改。');
  const markerPath = await safePath(root, path.relative(root, path.join(directory, markerName)));
  let marker;
  try { marker = JSON.parse(await readFile(markerPath, 'utf8')); }
  catch { fail('在线论文输出目录没有有效的生成器标记；为保护已有文件，未进行修改。'); }
  if (marker.generator !== generator || marker.version !== 1 || marker.sourceDirectory !== sourceRelative || !Array.isArray(marker.sources) || marker.sources.some(source => typeof source !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(source))) {
    fail('在线论文输出目录的所有权标记无效，未进行修改。');
  }
  return marker;
}

async function removeOwned(root, directory) {
  // Recursive removal is limited to a checked, marked child of publications/.
  await safePath(root, path.relative(root, directory));
  if (await ownership(root, directory)) await rm(directory, { recursive: true });
}

async function validateMedia(root, url, type) {
  if (!url || /^https?:\/\//i.test(url)) return;
  const withoutSuffix = url.split(/[?#]/, 1)[0];
  let decoded;
  try { decoded = decodeURIComponent(withoutSuffix); }
  catch { fail(`${type} 附件路径含有无效的转义字符。`); }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\\\u0000-\u001f]/.test(decoded) || decoded.split('/').some(component => ['.', '..'].includes(component))) fail(`${type} 附件路径必须指向 static/ 内的文件。`);
  const staticRoot = await safePath(root, 'static');
  const filename = inside(staticRoot, path.resolve(staticRoot, decoded.slice(1)));
  await safePath(root, path.relative(root, filename));
  const information = await exists(filename);
  if (!information?.isFile() || !information.size) fail(`${type} 附件不存在或为空：${url}。请先上传附件，或填写外部链接。`);
  const extension = path.extname(filename).toLowerCase();
  if (type === 'PDF' ? extension !== '.pdf' : !['.pdf', '.ppt', '.pptx'].includes(extension)) fail(`${type} 附件扩展名无效：${url}`);
  const contents = await readFile(filename);
  const valid = extension === '.pdf'
    ? contents.subarray(0, 1024).includes(Buffer.from('%PDF-'))
    : extension === '.pptx'
      ? contents.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
      : contents.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (!valid) fail(`${type} 附件内容与扩展名不符：${url}`);
}

function mergeSubmission(input, stem, owner) {
  const migration = input.migration == null ? null : validateMigration(input.migration, stem, owner);
  let imported = {};
  const warnings = [];
  if (input.bibtex != null && typeof input.bibtex !== 'string') fail('BibTeX 必须是文字。');
  if (input.bibtex?.trim()) {
    const result = importBibtex(input.bibtex, owner);
    imported = result.paper;
    const explicitDate = typeof input.date === 'string' && input.date.trim();
    warnings.push(...result.warnings.filter(warning => !explicitDate || warning !== 'BibTeX 没有完整发表日期，已暂用该月 1 日，请核对。'));
  }
  const merged = { ...imported };
  for (const [key, value] of Object.entries(input)) {
    // Empty CMS controls mean "use the imported citation". Explicit booleans
    // remain meaningful, and nonempty arrays replace imported ordered authors.
    if (!migration && (value == null || typeof value === 'string' && !value.trim() || Array.isArray(value) && !value.length)) continue;
    merged[key] = value;
  }
  if (input.externalPdfUrl != null && typeof input.externalPdfUrl !== 'string') fail('外部 PDF 链接必须是文字。');
  const externalPdfUrl = input.externalPdfUrl?.trim();
  if (externalPdfUrl) {
    const invalidExternalPdf = () => fail('外部 PDF 链接必须是完整的 HTTPS 地址，且不能包含登录信息。');
    if (!/^https:\/\/[^/]/i.test(externalPdfUrl) || /[\s\\\u0000-\u001f\u007f]/u.test(externalPdfUrl)) invalidExternalPdf();
    let url;
    try { url = new URL(externalPdfUrl); } catch { invalidExternalPdf(); }
    if (url.username || url.password) invalidExternalPdf();
    if (merged.pdfUrl == null || (typeof merged.pdfUrl === 'string' && !merged.pdfUrl.trim())) merged.pdfUrl = externalPdfUrl;
  }
  merged.type ||= imported.type || 'article-journal';
  merged.slug = stem;
  const paper = normalizePaper(merged, owner);
  for (const [field, label, prefix, allowed] of [
    ['ccfRank', 'CCF 等级', 'CCF-', ['CCF-A', 'CCF-B', 'CCF-C']],
    ['casRank', '中科院分区', '中科院', ['中科院一区', '中科院二区', '中科院三区', '中科院四区']],
  ]) {
    if (!Object.hasOwn(input, field)) continue;
    if (input[field] != null && typeof input[field] !== 'string') fail(`${label}必须为文字。`);
    const rank = (input[field] || '').trim();
    if (rank && !allowed.includes(rank)) fail(`${label}无效，请从下拉选项中选择。`);
    // The dedicated single-select controls supersede older raw tags. An empty
    // control deliberately clears that rank; unrelated topic tags are retained.
    paper.tags = paper.tags.filter(tag => !tag.startsWith(prefix));
    if (rank) paper.tags.push(rank);
  }
  if (paper.tags.filter(tag => tag.startsWith('CCF-')).length > 1) fail('每篇论文只能选择一个 CCF 等级。');
  if (paper.tags.filter(tag => tag.startsWith('中科院')).length > 1) fail('每篇论文只能选择一个中科院分区。');
  return { paper, warnings, migration };
}

async function readSubmissions(root, owner) {
  const directory = await safePath(root, sourceRelative);
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return { records: [], skippedDrafts: 0, warnings: [] }; throw error; }
  const records = [];
  const warnings = [];
  let skippedDrafts = 0;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.name.endsWith('.json')) continue;
    const stem = entry.name.slice(0, -5);
    try {
      if (!entry.isFile() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stem) || stem.length > 180) fail('文件名只能包含小写英文字母、数字和连字符，最多 180 字符。');
      const filename = await safePath(root, `${sourceRelative}/${entry.name}`);
      if ((await lstat(filename)).size > 1_000_000) fail('论文信息文件超过 1 MB。');
      let input;
      try { input = JSON.parse(await readFile(filename, 'utf8')); }
      catch { fail('论文信息不是有效的 JSON。'); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) fail('论文信息应为 JSON 对象。');
      if (input.draft !== false) { skippedDrafts++; continue; }
      const result = mergeSubmission(input, stem, owner);
      if (result.migration) {
        const archive = await safePath(root, result.migration.originalPath);
        let archived;
        try { archived = await readFile(archive, 'utf8'); } catch { fail('找不到受保护的原始论文备份。'); }
        if (!isMigratedBackup(archived)) fail('原始论文备份必须标记迁移，并禁止页面、列表与资源输出。');
      }
      await validateMedia(root, result.paper.pdfUrl, 'PDF');
      await validateMedia(root, result.paper.slidesUrl, '幻灯片');
      const paperWarnings = [...result.warnings];
      if (!result.paper.pdfUrl) paperWarnings.push('未提供 PDF，仅生成论文信息。');
      if (!result.paper.venueShort) paperWarnings.push('未填写期刊 / 会议简称，将显示全名。');
      if (result.paper.date > today) paperWarnings.push('发表日期在未来，Hugo 默认会暂时隐藏这篇论文。');
      if (!result.paper.citationEnglish || !result.paper.citationChinese) paperWarnings.push('自动引用为初稿，请核对作者缩写、卷期页码及引用格式。');
      warnings.push(...paperWarnings.map(warning => `${entry.name}：${warning}`));
      records.push({ source: entry.name, paper: result.paper, migration: result.migration });
    } catch (error) { fail(`${entry.name}：${error.message}`); }
  }
  return { records, skippedDrafts, warnings };
}

function checkDuplicates(records, existing) {
  const titles = new Map();
  const addTitle = paper => { const key = fold(paper.title); titles.set(key, [...titles.get(key) || [], paper]); };
  existing.forEach(addTitle);
  const dois = new Map(existing.filter(paper => paper.doi).map(paper => [paper.doi.toLowerCase(), paper]));
  const slugs = new Map(existing.map(paper => [paper.slug, paper]));
  for (const { source, paper } of records) {
    const validDoi = value => /^10\.\d{4,9}\/\S+$/i.test(value || '');
    const titleConflict = (titles.get(fold(paper.title)) || []).find(other => !validDoi(paper.doi) || !validDoi(other.doi) || paper.doi.toLowerCase() === other.doi.toLowerCase());
    const duplicate = slugs.get(paper.slug) || titleConflict || paper.doi && dois.get(paper.doi.toLowerCase());
    if (duplicate) fail(`${source}：目录名、标题或 DOI 与已有论文重复（${duplicate.title || duplicate.slug}），未更新生成文件。`);
    addTitle(paper);
    if (paper.doi) dois.set(paper.doi.toLowerCase(), paper);
    slugs.set(paper.slug, paper);
  }
}

async function replaceGenerated(root, records, owner, previous, warnings) {
  const destination = await safePath(root, outputRelative);
  if (!records.length && !previous) return;
  const parent = await safePath(root, 'content/publications');
  const suffix = randomUUID();
  const stage = path.join(parent, `.online-stage-${suffix}`);
  const backup = path.join(parent, `.online-backup-${suffix}`);
  let staged = false;
  let backedUp = false;
  let committed = false;
  try {
    if (records.length) {
      await mkdir(parent, { recursive: true });
      await mkdir(stage);
      staged = true;
      const marker = { generator, version: 1, sourceDirectory: sourceRelative, sources: records.map(record => record.source) };
      await writeFile(path.join(stage, markerName), `${JSON.stringify(marker, null, 2)}\n`, { flag: 'wx' });
      // Keep this a plain folder: an _index.md would create a nested Hugo
      // section, hiding these pages from the Publications list and sidebar.
      for (const { paper, migration } of records) {
        const bundle = path.join(stage, paper.slug);
        await mkdir(bundle);
        const rendered = migration ? renderMigratedPublication(paper, migration, owner) : {
          indexMarkdown: generateMarkdown(paper, owner).replace(/^---\n/, `---\nurl: ${JSON.stringify(`/publications/${paper.slug}/`)}\ndraft: false\n`),
          bibtex: generateBibtex(paper),
        };
        await writeFile(path.join(bundle, 'index.md'), rendered.indexMarkdown, { flag: 'wx' });
        await writeFile(path.join(bundle, 'cite.bib'), rendered.bibtex, { flag: 'wx' });
      }
    }
    const current = await ownership(root, destination);
    if (Boolean(current) !== Boolean(previous)) fail('生成目录在校验后发生变化，请重试。');
    if (current) { await rename(destination, backup); backedUp = true; }
    if (staged) { await rename(stage, destination); staged = false; }
    committed = true;
  } catch (error) {
    if (backedUp && !committed) {
      try { await rename(backup, destination); backedUp = false; }
      catch { error.message += `；旧生成文件保留在 ${path.relative(root, backup)}，请勿删除。`; }
    }
    throw error;
  } finally {
    if (staged) await removeOwned(root, stage).catch(error => warnings.push(`临时生成目录清理失败：${error.message}`));
    if (backedUp && committed) await removeOwned(root, backup).catch(error => warnings.push(`旧生成目录清理失败：${error.message}`));
  }
}

/** Generate only the dedicated ignored online/ subtree, after full validation. */
export async function syncPublications({ root = defaultRoot } = {}) {
  root = await realpath(root);
  const owner = await readOwner(root);
  const destination = await safePath(root, outputRelative);
  const previous = await ownership(root, destination);
  const { records, skippedDrafts, warnings } = await readSubmissions(root, owner);
  const existing = [];
  for (const paper of await listPublications(root)) {
    const source = await safePath(root, `content/publications/${paper.slug}/index.md`);
    if (!isMigratedBackup(await readFile(source, 'utf8'))) existing.push(paper);
  }
  checkDuplicates(records, existing);
  await replaceGenerated(root, records, owner, previous, warnings);
  const sources = new Set(records.map(record => record.source));
  return {
    published: records.length,
    skippedDrafts,
    removed: (previous?.sources || []).filter(source => !sources.has(source)).map(source => source.slice(0, -5)),
    files: records.flatMap(({ paper }) => [`${outputRelative}/${paper.slug}/index.md`, `${outputRelative}/${paper.slug}/cite.bib`]),
    publications: records.map(({ source, paper }) => ({ source, slug: paper.slug, url: `/publications/${paper.slug}/` })),
    warnings,
  };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const args = process.argv.slice(2);
    const rootIndex = args.indexOf('--root');
    if (rootIndex >= 0 && !args[rootIndex + 1]) fail('--root 需要指定项目目录。');
    const result = await syncPublications({ root: rootIndex >= 0 ? path.resolve(args[rootIndex + 1]) : defaultRoot });
    console.log(`在线论文：已生成 ${result.published} 篇，跳过 ${result.skippedDrafts} 篇草稿，移除 ${result.removed.length} 篇旧生成内容。`);
    for (const warning of result.warnings) console.warn(warning);
  } catch (error) { console.error(`在线论文处理失败：${error.message}`); process.exitCode = 1; }
}
