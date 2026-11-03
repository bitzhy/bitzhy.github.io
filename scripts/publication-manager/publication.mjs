import { readFile, readdir, mkdir, open, unlink, rmdir, lstat } from 'node:fs/promises';
import path from 'node:path';

export class PublicationError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const fail = (message, status) => { throw new PublicationError(message, status); };
const clean = (value = '') => String(value ?? '').trim();
const quote = value => JSON.stringify(value);
export const DEFAULT_OWNER = { display: 'Chunhui Duan', given: 'Chunhui', family: 'Duan' };
const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };

export async function readOwner(root) {
  try {
    const yaml = await readFile(path.join(root, 'data/authors/me.yaml'), 'utf8');
    const nameBlock = yaml.match(/^name:\s*\r?\n((?:[ \t]+.*\r?\n)+)/m)?.[1] || '';
    const result = { ...DEFAULT_OWNER };
    for (const field of ['display', 'given', 'family']) {
      const value = nameBlock.match(new RegExp(`^\\s+${field}:\\s*(.+?)\\s*$`, 'm'))?.[1];
      if (value) result[field] = value.startsWith('"') ? JSON.parse(value) : value.replace(/^'|'$/g, '');
    }
    return result;
  } catch { return DEFAULT_OWNER; }
}

function texText(value) {
  const accents = { '"': '\u0308', "'": '\u0301', '`': '\u0300', '^': '\u0302', '~': '\u0303', '=': '\u0304', '.': '\u0307', u: '\u0306', v: '\u030c', H: '\u030b', c: '\u0327', k: '\u0328', b: '\u0331', r: '\u030a', d: '\u0323' };
  const letters = { ss: 'ß', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', o: 'ø', O: 'Ø', l: 'ł', L: 'Ł', i: 'ı', j: 'ȷ' };
  const accent = (command, letter) => (letter + accents[command]).normalize('NFC');
  return value.replace(/\\(?:textit|textbf|emph|textrm|textsc)\s*/g, '')
    .replace(/\\(["'`^~=.])\s*\{?\\?([A-Za-z])\}?/g, (_, command, letter) => accent(command, letter))
    .replace(/\\([uvHckbrd])(?:\s*\{\\?([A-Za-z])\}|\s+\\?([A-Za-z]))/g, (_, command, braced, plain) => accent(command, braced || plain))
    .replace(/\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i|j)(?![A-Za-z])(?:\{\})?/g, (_, command) => letters[command])
    .replace(/\\([&%_#$])/g, '$1').replace(/~/g, ' ').replace(/[{}]/g, '')
    .replace(/\s+/g, ' ').trim();
}

// Read one balanced BibTeX entry rather than splitting fields at commas: titles,
// corporate names, and nested case-protection braces commonly contain commas.
export function parseBibtex(source) {
  source = clean(source);
  if (!source || source.length > 200_000) fail('请粘贴一条 BibTeX 记录（最多 200 KB）。');
  let cursor = 0;
  const skip = () => {
    while (cursor < source.length) {
      if (/\s/.test(source[cursor])) cursor++;
      else if (source[cursor] === '%') { while (cursor < source.length && source[cursor] !== '\n') cursor++; }
      else break;
    }
  };
  skip();
  const start = source.slice(cursor).match(/^@(article|inproceedings|conference)\s*([{(])/i);
  if (!start) fail('目前支持单条 @article 或 @inproceedings BibTeX；请删除其他记录后再导入。');
  const kind = start[1].toLowerCase();
  const close = start[2] === '{' ? '}' : ')';
  cursor += start[0].length;
  skip();
  const key = source.slice(cursor).match(/^([^\s,{}()]+)\s*,/)?.[1];
  if (!key || !/^[\w:./+-]+$/.test(key)) fail('BibTeX 的引用键无效。');
  cursor += source.slice(cursor).indexOf(',') + 1;
  const fields = {};
  const warnings = [];
  const readPart = () => {
    skip();
    const opener = source[cursor];
    if (opener === '{') {
      cursor++;
      const begin = cursor;
      let depth = 1;
      while (cursor < source.length) {
        if (source[cursor] === '\\') { cursor += 2; continue; }
        if (source[cursor] === '{') depth++;
        if (source[cursor] === '}') {
          depth--;
          if (depth === 0) { const value = source.slice(begin, cursor); cursor++; return value; }
        }
        cursor++;
      }
      fail('BibTeX 花括号没有闭合。');
    }
    if (opener === '"') {
      cursor++;
      const begin = cursor;
      let depth = 0;
      while (cursor < source.length) {
        if (source[cursor] === '\\') { cursor += 2; continue; }
        if (source[cursor] === '{') depth++;
        if (source[cursor] === '}') depth--;
        if (source[cursor] === '"' && depth === 0) { const value = source.slice(begin, cursor); cursor++; return value; }
        cursor++;
      }
      fail('BibTeX 引号没有闭合。');
    }
    const value = source.slice(cursor).match(/^[A-Za-z0-9_.:+/-]+/)?.[0];
    if (!value) fail('无法读取 BibTeX 字段值，请检查花括号和逗号。');
    cursor += value.length;
    if (!/^\d+$/.test(value) && !months[value.toLowerCase()]) fail(`BibTeX 使用了未展开的宏 ${value}，请用花括号包住具体内容。`);
    return value;
  };
  while (cursor < source.length) {
    skip();
    if (source[cursor] === close) { cursor++; break; }
    const name = source.slice(cursor).match(/^([A-Za-z][\w-]*)\s*=/);
    if (!name) fail('BibTeX 字段格式有误，应为 title = {...}。');
    cursor += name[0].length;
    let value = readPart();
    skip();
    while (source[cursor] === '#') { cursor++; value += readPart(); skip(); }
    fields[name[1].toLowerCase()] = value;
    if (cursor >= source.length) fail('BibTeX 记录没有闭合。');
    if (source[cursor] === ',') cursor++;
    else if (source[cursor] !== close) fail('BibTeX 字段之间缺少逗号。');
  }
  if (source[cursor - 1] !== close) fail('BibTeX 记录没有闭合。');
  skip();
  if (cursor !== source.length) fail('每次只能导入一条 BibTeX，请删除后面的记录或文本。');
  return { kind, key, fields, warnings };
}

function splitAuthorTokens(raw) {
  const parts = [];
  let depth = 0;
  let begin = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\') { i++; continue; }
    if (raw[i] === '{') depth++;
    if (raw[i] === '}') depth--;
    const separator = depth === 0 && raw.slice(i).match(/^\s+and\s+/i);
    if (separator) { parts.push(raw.slice(begin, i)); i += separator[0].length - 1; begin = i + 1; }
  }
  parts.push(raw.slice(begin));
  return parts.map(clean).filter(Boolean);
}

function splitAuthors(raw) {
  return splitAuthorTokens(raw).map(author => {
    if (/^\s*\{.*\}\s*$/.test(author)) return texText(author);
    const chunks = author.split(',').map(texText);
    if (chunks.length === 1) return chunks[0];
    return `${chunks.at(-1)} ${chunks[0]}${chunks.length > 2 ? `, ${chunks.slice(1, -1).join(', ')}` : ''}`.trim();
  }).filter(Boolean);
}

export function importBibtex(source, owner = DEFAULT_OWNER) {
  const { kind, fields, warnings } = parseBibtex(source);
  const year = texText(fields.year || '');
  let month = months[clean(fields.month).toLowerCase()] || clean(fields.month).padStart(2, '0');
  if (!/^\d{2}$/.test(month) || +month < 1 || +month > 12) month = '01';
  let date = texText(fields.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    date = /^\d{4}$/.test(year) ? `${year}-${month}-01` : '';
    if (date) warnings.push('BibTeX 没有完整发表日期，已暂用该月 1 日，请核对。');
  }
  const authors = splitAuthors(fields.author || '').map(name => ({ name: isOwner(name, owner) ? owner.display : name, note: '' }));
  if (splitAuthorTokens(fields.author || '').some(author => author.split(',').length > 2)) warnings.push('BibTeX 包含带姓名后缀的作者，请核对作者显示及自动引用。');
  if (!fields.title || !authors.length || !fields.journal && !fields.booktitle || !date) warnings.push('导入的信息不完整，请补全标题、作者、发表日期和期刊 / 会议名称。');
  return { paper: { title: texText(fields.title || ''), authors, date,
    type: kind === 'article' ? 'article-journal' : 'paper-conference',
    venue: texText(fields.journal || fields.booktitle || ''), venueShort: '',
    volume: texText(fields.volume || ''), issue: texText(fields.number || ''),
    pages: texText(fields.pages || '').replace(/--/g, '-'), articleNumber: texText(fields.articleno || fields.eid || ''),
    location: texText(fields.address || fields.location || ''), doi: normalizeDoi(fields.doi || ''),
    abstract: texText(fields.abstract || ''), tags: [], featured: false, openAccess: false,
    citationEnglish: '', citationChinese: '', pdfUrl: '', slidesUrl: '', codeUrl: '',
    projectUrl: fields.url && !/^https?:\/\/(?:dx\.)?doi\.org\//i.test(fields.url) ? texText(fields.url) : '',
    videoUrl: '', bibtex: source, slug: '' }, warnings };
}

const fold = text => clean(text).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
function isOwner(name, owner) { return ['me', owner.display, `${owner.family}, ${owner.given}`].some(value => fold(value) === fold(name)); }
function normalizeDoi(value) { return clean(value).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, ''); }
export function makeSlug(title, date) {
  const words = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140).replace(/-$/, '');
  return `${date.slice(0, 4)}-${words || 'publication'}`;
}

export function normalizePaper(input, owner = DEFAULT_OWNER) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('论文信息格式无效。');
  const paper = {};
  const textFields = ['title', 'date', 'type', 'venue', 'venueShort', 'volume', 'issue', 'pages', 'articleNumber', 'location', 'doi', 'abstract', 'citationEnglish', 'citationChinese', 'pdfUrl', 'slidesUrl', 'codeUrl', 'projectUrl', 'videoUrl', 'bibtex', 'slug'];
  for (const field of textFields) {
    if (input[field] != null && typeof input[field] !== 'string') fail(`${field} 必须是文字。`);
    paper[field] = clean(input[field]);
    if (paper[field].length > (['abstract', 'bibtex', 'citationEnglish', 'citationChinese'].includes(field) ? 200_000 : 2000)) fail(`${field} 内容过长。`);
    if (paper[field].includes('\u0000')) fail('内容中含有不支持的空字符。');
  }
  if (!paper.title) fail('请填写论文标题。');
  const parsedDate = new Date(`${paper.date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paper.date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== paper.date) fail('请填写有效的发表日期（YYYY-MM-DD）。');
  if (!['article-journal', 'paper-conference'].includes(paper.type)) fail('请选择期刊论文或会议论文。');
  if (!paper.venue) fail('请填写期刊或会议名称。');
  if (!Array.isArray(input.authors) || !input.authors.length || input.authors.length > 100) fail('请至少填写一位作者（最多 100 位）。');
  paper.authors = input.authors.map(author => {
    if (!author || typeof author.name !== 'string' || author.note != null && typeof author.note !== 'string') fail('作者格式无效。');
    const name = clean(author.name);
    const note = clean(author.note);
    if (!name || name.length > 200 || note.length > 300 || /[\r\n\u0000]/.test(name + note)) fail('请填写有效的作者姓名和备注。');
    return { name: isOwner(name, owner) ? owner.display : name, note };
  });
  if (input.tags != null && (!Array.isArray(input.tags) || input.tags.some(tag => typeof tag !== 'string'))) fail('标签应为文字列表。');
  paper.tags = [...new Set((input.tags || []).map(clean).filter(Boolean))];
  if (paper.tags.length > 20 || paper.tags.some(tag => tag.length > 100 || /[\r\n\u0000]/.test(tag))) fail('标签过长或过多。');
  for (const field of ['featured', 'openAccess']) {
    if (input[field] != null && typeof input[field] !== 'boolean') fail(`${field} 必须为 true 或 false。`);
    paper[field] = input[field] === true;
  }
  paper.doi = normalizeDoi(paper.doi);
  if (paper.doi && !/^10\.\d{4,9}\/\S+$/i.test(paper.doi)) fail('DOI 格式无效，例如 10.1145/3832013。');
  for (const field of ['pdfUrl', 'slidesUrl', 'codeUrl', 'projectUrl', 'videoUrl']) {
    if (!paper[field]) continue;
    if (/^\/(?!\/)/.test(paper[field]) && !/[\\\s\u0000-\u001f]/.test(paper[field])) continue;
    let url;
    try { url = new URL(paper[field]); } catch { fail(`${field} 请填写完整的 https:// 地址或以 / 开头的站内路径。`); }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) fail(`${field} 只支持 http(s) 地址或站内路径。`);
  }
  paper.slug ||= makeSlug(paper.title, paper.date);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(paper.slug) || paper.slug.length > 180) fail('目录名只能包含小写英文字母、数字和连字符，长度最多 180。');
  if (paper.bibtex) parseBibtex(paper.bibtex);
  return paper;
}

function authorParts(name) {
  const names = name.split(/\s+/);
  const suffix = /^(?:Jr\.?|Sr\.?|II|III|IV)$/i.test(names.at(-1)) ? names.pop() : '';
  const family = (names.pop() || '').replace(/,$/, '') + (suffix ? `, ${suffix}` : '');
  const initials = names.map(part => part[0] ? `${part[0].toUpperCase()}.` : '').join(' ');
  return { family, initials, compact: initials.replace(/[. ]/g, '') };
}
const texEscape = value => value.replace(/[\\{}&%_#$]/g, char => char === '\\' ? '\\textbackslash{}' : `\\${char}`);

export function generateBibtex(paper) {
  const parsed = paper.bibtex ? parseBibtex(paper.bibtex) : null;
  const originalAuthors = splitAuthorTokens(parsed?.fields.author || '').map(raw => ({ raw, name: splitAuthors(raw)[0] }));
  const first = authorParts(paper.authors[0].name).family.toLowerCase().replace(/[^a-z]/g, '') || 'author';
  const key = parsed?.key || `${first}${paper.date.slice(0, 4)}${paper.slug.replace(/^\d{4}-/, '').split('-').slice(0, 2).join('')}`;
  const values = {
    title: parsed?.fields.title && texText(parsed.fields.title) === paper.title ? parsed.fields.title : texEscape(paper.title),
    author: paper.authors.map(author => {
      const original = originalAuthors.find(candidate => candidate.name === author.name);
      return original ? original.raw : /\s+and\s+/i.test(author.name) ? `{${texEscape(author.name)}}` : texEscape(author.name);
    }).join(' and '),
    [paper.type === 'article-journal' ? 'journal' : 'booktitle']: texEscape(paper.venue),
    year: paper.date.slice(0, 4), month: paper.date.slice(5, 7),
  };
  for (const [field, value] of Object.entries({ volume: paper.volume, number: paper.issue, pages: paper.pages.replace(/(?<!-)-(?!-)/g, '--'), articleno: paper.articleNumber, address: paper.location, doi: paper.doi, url: paper.doi ? `https://doi.org/${paper.doi}` : paper.projectUrl })) if (value) values[field] = texEscape(value);
  const standard = new Set(['title', 'author', 'journal', 'booktitle', 'year', 'month', 'date', 'volume', 'number', 'pages', 'articleno', 'eid', 'address', 'location', 'doi', 'url', 'abstract']);
  for (const [field, value] of Object.entries(parsed?.fields || {})) if (!standard.has(field)) values[field] = value;
  if (paper.abstract) values.abstract = texEscape(paper.abstract);
  return `@${paper.type === 'article-journal' ? 'article' : 'inproceedings'}{${key},\n${Object.entries(values).map(([field, value]) => `  ${field} = {${value}}`).join(',\n')}\n}\n`;
}

export function generateMarkdown(paper, owner = DEFAULT_OWNER) {
  const lines = ['---', `title: ${quote(paper.title)}`, 'authors:', ...paper.authors.map(author => `  - ${quote(isOwner(author.name, owner) ? 'me' : author.name)}`)];
  if (paper.authors.some(author => author.note)) lines.push('author_notes:', ...paper.authors.map(author => `  - ${quote(author.note)}`));
  lines.push(`date: ${quote(`${paper.date}T00:00:00Z`)}`, `publication_types: [${quote(paper.type)}]`, 'publication:', `  name: ${quote(paper.venue)}`);
  for (const [key, value] of Object.entries({ short_name: paper.venueShort, volume: paper.volume, issue: paper.issue, pages: paper.pages, article_number: paper.articleNumber, location: paper.location })) if (value) lines.push(`  ${key}: ${quote(value)}`);
  lines.push('peer_reviewed: true', `featured: ${paper.featured}`, `open_access: ${paper.openAccess}`);
  if (paper.tags.length) lines.push('tags:', ...paper.tags.map(tag => `  - ${quote(tag)}`));
  const links = Object.entries({ pdf: paper.pdfUrl, slides: paper.slidesUrl, code: paper.codeUrl, project: paper.projectUrl, video: paper.videoUrl }).filter(([, value]) => value);
  if (links.length) lines.push('links:', ...links.flatMap(([type, value]) => [`  - type: ${type}`, `    url: ${quote(value)}`]));
  if (paper.doi) lines.push('hugoblox:', '  ids:', `    doi: ${quote(paper.doi)}`);
  lines.push('---', '');
  if (paper.abstract) lines.push('## Abstract', '', paper.abstract, '');
  const year = paper.date.slice(0, 4);
  const englishAuthors = paper.authors.map(author => { const name = authorParts(author.name); return `${name.initials} ${name.family}`.trim(); }).join(', ');
  const englishDetails = [paper.volume && `vol. ${paper.volume}`, paper.issue && `no. ${paper.issue}`, paper.articleNumber && `Art. no. ${paper.articleNumber}`, paper.pages && `pp. ${paper.pages}`, year, paper.doi && `doi: ${paper.doi}`].filter(Boolean).join(', ');
  const chineseAuthors = paper.authors.slice(0, 3).map(author => { const name = authorParts(author.name); return `${name.family} ${name.compact}`.trim(); }).join(', ') + (paper.authors.length > 3 ? ', et al' : '');
  const chineseDetails = `${year}${paper.volume ? `, ${paper.volume}` : ''}${paper.issue ? `(${paper.issue})` : ''}${paper.pages ? `: ${paper.pages}` : ''}`;
  const english = paper.citationEnglish || `${englishAuthors}, “${paper.title},” ${paper.venue}, ${englishDetails}.`;
  const chinese = paper.citationChinese || `${chineseAuthors}. ${paper.title}[${paper.type === 'article-journal' ? 'J' : 'C'}]. ${paper.venue}, ${chineseDetails}.${paper.doi ? ` DOI: ${paper.doi}.` : ''}`;
  lines.push('## Citation', '', english, '', '## 中文引用（GB/T 7714）', '', chinese, '');
  return lines.join('\n');
}

function yamlScalar(text, key) {
  const value = text.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'm'))?.[1] || '';
  try { return value.startsWith('"') ? JSON.parse(value) : value.replace(/^'|'$/g, ''); } catch { return value; }
}

export async function listPublications(root) {
  const directory = path.join(root, 'content/publications');
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const publications = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    let markdown;
    try { markdown = await readFile(path.join(directory, entry.name, 'index.md'), 'utf8'); } catch { continue; }
    const front = markdown.split(/^---\s*$/m)[1] || '';
    publications.push({ slug: entry.name, title: yamlScalar(front, 'title'), date: yamlScalar(front, 'date').slice(0, 10), type: front.includes('paper-conference') ? 'paper-conference' : 'article-journal', venue: yamlScalar(front, 'short_name') || yamlScalar(front, 'name'), doi: normalizeDoi(yamlScalar(front, 'doi')) });
  }
  return publications.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

function attachmentPlan(paper, attachments = {}, decode = false) {
  if (!attachments || typeof attachments !== 'object' || Array.isArray(attachments)) fail('附件格式无效。');
  const plans = [];
  for (const type of ['pdf', 'slides']) {
    const file = attachments[type];
    if (!file) continue;
    if (!file.name || typeof file.name !== 'string') fail('附件缺少文件名。');
    const extension = path.extname(file.name).toLowerCase();
    if (!((type === 'pdf' && extension === '.pdf') || (type === 'slides' && ['.pdf', '.ppt', '.pptx'].includes(extension)))) fail(type === 'pdf' ? '论文附件只支持 PDF。' : '幻灯片只支持 PDF、PPT 或 PPTX。');
    const relative = `static/${type === 'pdf' ? 'papers' : 'slides'}/${paper.slug}${extension}`;
    paper[`${type}Url`] = `/${type === 'pdf' ? 'papers' : 'slides'}/${paper.slug}${extension}`;
    const plan = { relative };
    if (decode) {
      if (typeof file.data !== 'string' || file.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)) fail('附件内容不是有效的 Base64。');
      plan.buffer = Buffer.from(file.data, 'base64');
      if (plan.buffer.toString('base64') !== file.data) fail('附件内容不是有效的 Base64。');
      if (!plan.buffer.length || plan.buffer.length > 25 * 1024 * 1024) fail('单个附件须为 1 字节到 25 MB。');
      const valid = extension === '.pdf' ? plan.buffer.subarray(0, 1024).includes(Buffer.from('%PDF-')) : extension === '.pptx' ? plan.buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) : plan.buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
      if (!valid) fail(`${file.name} 内容与扩展名不符，请选择有效的 ${extension} 文件。`);
    }
    plans.push(plan);
  }
  return plans;
}

async function checkDestination(root, relative) {
  const parts = relative.split('/');
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) fail('保存目录中存在符号链接，无法安全保存。');
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}

export async function previewPublication(root, input, attachments = {}, owner = DEFAULT_OWNER) {
  const paper = normalizePaper(input, owner);
  const uploads = attachmentPlan(paper, attachments);
  const files = [`content/publications/${paper.slug}/index.md`, `content/publications/${paper.slug}/cite.bib`, ...uploads.map(item => item.relative)];
  const publications = await listPublications(root);
  const duplicate = publications.find(existing => existing.slug === paper.slug || fold(existing.title) === fold(paper.title) || paper.doi && existing.doi.toLowerCase() === paper.doi.toLowerCase());
  let existing = Boolean(duplicate);
  for (const relative of [`content/publications/${paper.slug}`, ...uploads.map(item => item.relative)]) {
    const destination = await checkDestination(root, relative);
    try { await lstat(destination); existing = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const warnings = [];
  if (existing) warnings.push(`已存在相同目录、标题或 DOI 的论文${duplicate ? `：${duplicate.title}` : ''}，不会覆盖已有文件。`);
  if (!paper.pdfUrl) warnings.push('尚未提供 PDF，可先保存论文信息，之后再补充。');
  if (!paper.venueShort) warnings.push('未填写简称，论文列表将显示期刊 / 会议全名。');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (paper.date > today) warnings.push('发表日期在未来，Hugo 默认会隐藏这篇论文，届时才会显示；请核对日期。');
  warnings.push('自动引用为初稿，请核对姓名缩写、卷期页码及引用格式。');
  return { slug: paper.slug, indexMarkdown: generateMarkdown(paper, owner), bibtex: generateBibtex(paper), files, warnings, existing };
}

export async function savePublication(root, input, attachments = {}, owner = DEFAULT_OWNER) {
  const paper = normalizePaper(input, owner);
  const uploads = attachmentPlan(paper, attachments, true);
  const preview = await previewPublication(root, paper, attachments, owner);
  if (preview.existing) fail(preview.warnings[0], 409);
  const directory = path.join(root, 'content/publications', paper.slug);
  const created = [];
  let ownedDirectory = false;
  const writeOwned = async (destination, data) => {
    const file = await open(destination, 'wx');
    created.push(destination);
    try { await file.writeFile(data); } finally { await file.close(); }
  };
  try {
    await mkdir(path.join(root, 'content/publications'), { recursive: true });
    await mkdir(directory);
    ownedDirectory = true;
    for (const file of uploads) {
      const destination = await checkDestination(root, file.relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeOwned(destination, file.buffer);
    }
    for (const [name, text] of [['index.md', preview.indexMarkdown], ['cite.bib', preview.bibtex]]) {
      const destination = path.join(directory, name);
      await writeOwned(destination, text);
    }
  } catch (error) {
    for (const file of created.reverse()) await unlink(file).catch(() => {});
    if (ownedDirectory) await rmdir(directory).catch(() => {});
    if (error.code === 'EEXIST') fail('同名论文目录或附件已存在，没有覆盖任何文件。', 409);
    throw error;
  }
  return { slug: paper.slug, files: preview.files, url: `/publications/${paper.slug}/`, warnings: preview.warnings };
}
