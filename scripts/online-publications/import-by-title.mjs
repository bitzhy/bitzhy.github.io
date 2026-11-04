import { appendFile, lstat, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { importBibtex, listPublications, makeSlug, normalizePaper, readOwner } from '../publication-manager/publication.mjs';
import { lookupCasRank } from './cas-ranks.mjs';
import { lookupCcfRank } from './ccf-ranks.mjs';

const defaultRoot = fileURLToPath(new URL('../..', import.meta.url));
const sourceDirectory = 'data/online_publications';
const crossrefWorks = 'https://api.crossref.org/works';
const doiPattern = /^10\.\d{4,9}\/[^\s\u0000-\u001f\u007f]+$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const publicationTypes = new Map([['journal-article', 'article-journal'], ['proceedings-article', 'paper-conference']]);
const metadataFields = ['DOI', 'title', 'author', 'type', 'container-title', 'short-container-title', 'published', 'published-print', 'published-online', 'issued', 'volume', 'issue', 'page', 'article-number', 'event', 'abstract', 'license', 'ISSN', 'issn-type'];

const clean = value => typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
const normalizeDoi = value => clean(value).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
const plainText = value => clean(clean(value).replace(/<\/?[A-Za-z][^<>]*>/g, '').replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g, (_, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" })[name]));
const titleKey = value => plainText(value).normalize('NFKC').toLowerCase()
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[‐‑‒–—]/g, '-').replace(/\.$/, '');
const duplicateTitleKey = value => titleKey(value).replace(/[^\p{L}\p{N}]/gu, '');
const doiPath = doi => doi.split('/').map(encodeURIComponent).join('/');

function abstractLicense(record) {
  for (const entry of Array.isArray(record.license) ? record.license : []) {
    const start = Date.parse(entry?.start?.['date-time']);
    if (entry?.['content-version'] !== 'vor' || !Number.isFinite(start) || start > Date.now()) continue;
    const license = /^https?:\/\/creativecommons\.org\/(?:licenses\/by\/(1\.0|2\.0|2\.5|3\.0|4\.0)|publicdomain\/zero\/1\.0)\/?$/i.exec(clean(entry.URL));
    if (license) {
      const version = license[1];
      return version
        ? { label: `CC BY ${version}`, url: `https://creativecommons.org/licenses/by/${version}/` }
        : { label: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' };
    }
  }
  return null;
}

function licensedAbstract(record, doi) {
  if (typeof record.abstract !== 'string' || record.abstract.length > 50_000) return '';
  const license = abstractLicense(record);
  if (!license) return '';
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  const markdownEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '{': '&#123;', '}': '&#125;' };
  const paragraphs = record.abstract
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)\s*>/gi, '')
    .replace(/<\/?(?:[\w.-]+:)?(?:p|sec|title|br|break|list-item)\b[^<>]*>/gi, '\n\n')
    .replace(/<\/?[A-Za-z][^<>]*>/g, '')
    .replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key) => {
      if (key[0] !== '#') return entities[key.toLowerCase()] ?? entity;
      const hex = key[1].toLowerCase() === 'x';
      const code = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      return code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : entity;
    })
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .split(/\r?\n\s*\r?\n/)
    .map(clean).filter(Boolean)
    .map(text => text.replace(/[\\`*_[\]#!|~$]/g, '\\$&')
      .replace(/[&<>{}]/g, char => markdownEntities[char])
      .replace(/^([+-])(?=\s|[+-])/g, '\\$1')
      .replace(/^(\d+)([.)])(?=\s)/, '$1\\$2'));
  if (!paragraphs.length) return '';
  const abstract = `${paragraphs.join('\n\n')}\n\n*Abstract from the [original publication](<https://doi.org/${doiPath(doi)}>) via Crossref, [${license.label}](${license.url}). Formatting adapted.*`;
  return abstract.length <= 200_000 ? abstract : '';
}

function openAccessPdf(location) {
  const value = location?.pdf_url;
  if (location?.is_oa !== true || typeof value !== 'string' || value.length > 2000 ||
      !/^https:\/\//i.test(value) || /[\\\s\u0000-\u001f\u007f]/u.test(value)) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

async function lookupOpenAccessPdf(doi, fetcher) {
  const url = new URL(`https://api.openalex.org/works/https://doi.org/${doiPath(doi)}`);
  url.searchParams.set('select', 'doi,best_oa_location,locations');
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return '';
    const work = await response.json();
    if (normalizeDoi(work?.doi) !== doi) return '';
    const best = openAccessPdf(work.best_oa_location);
    if (best) return best;
    return (Array.isArray(work.locations) ? work.locations : []).map(openAccessPdf).find(Boolean) || '';
  } catch { return ''; }
}

function publicationDate(record) {
  let year = '';
  for (const key of ['published', 'published-print', 'published-online', 'issued']) {
    const [y, m, d] = record[key]?.['date-parts']?.[0] || [];
    if (!Number.isInteger(y) || y < 1000 || y > 9999) continue;
    year ||= String(y);
    if (!Number.isInteger(m) || !Number.isInteger(d)) continue;
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date) return { date, year: String(y) };
  }
  return { date: '', year };
}

async function lookupCrossref(title, doi, fetcher) {
  const url = new URL(doi ? `${crossrefWorks}/${encodeURIComponent(doi)}` : crossrefWorks);
  if (!doi) {
    url.searchParams.set('query.title', title);
    url.searchParams.set('filter', [...publicationTypes.keys()].map(type => `type:${type}`).join(','));
    url.searchParams.set('rows', '20');
    url.searchParams.set('select', metadataFields.join(','));
  }
  let response;
  try { response = await fetcher(url, { signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error('暂时无法连接 Crossref，请稍后重试。'); }
  if (response.status === 404 && doi) throw new Error('Crossref 中没有找到这个 DOI，请核对后重试。');
  if (!response.ok) throw new Error(`Crossref 查询未成功（HTTP ${response.status}），请稍后重试。`);
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Crossref 返回了无法读取的数据，请稍后重试。'); }
  const message = result?.message;
  if (doi) {
    if (normalizeDoi(message?.DOI) !== doi || !plainText(message?.title?.[0]) || !publicationTypes.has(message.type)) {
      throw new Error('这个 DOI 在 Crossref 中没有可导入的期刊或会议论文记录。');
    }
    return message;
  }
  const matches = new Map();
  if (!Array.isArray(message?.items)) throw new Error('Crossref 返回了无法读取的查询结果，请稍后重试。');
  for (const record of message.items) {
    const recordDoi = normalizeDoi(record?.DOI);
    if (doiPattern.test(recordDoi) && publicationTypes.has(record.type) && titleKey(record.title?.[0]) === titleKey(title)) matches.set(recordDoi, record);
  }
  if (!matches.size) throw new Error('Crossref 未找到标题完全匹配的期刊或会议论文，请核对完整标题、改用 DOI 或手动填写。');
  if (matches.size > 1) {
    const candidates = [...matches].slice(0, 4).map(([recordDoi, record]) => {
      const details = [plainText(record['container-title']?.[0] || record.event?.name).slice(0, 45), publicationDate(record).year].filter(Boolean);
      return `${recordDoi}${details.length ? `（${details.join('，')}）` : ''}`;
    });
    throw new Error(`Crossref 找到多篇同名论文，请核对后使用 DOI 导入。候选为 ${candidates.join('、')}。`);
  }
  return matches.values().next().value;
}

async function realDirectory(root, segments, { optional = false } = {}) {
  let directory = root;
  for (const name of segments) {
    directory = path.join(directory, name);
    try {
      if (!(await lstat(directory)).isDirectory()) throw new Error(`目录不可用：${path.relative(root, directory)}。`);
    } catch (error) {
      if (optional && error.code === 'ENOENT') return null;
      throw error;
    }
  }
  return directory;
}

async function rejectDuplicates(root, directory, draft, slug, explicitDoi, owner) {
  const existing = [];
  if (await realDirectory(root, ['content', 'publications'], { optional: true })) existing.push(...await listPublications(root));
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.name.endsWith('.json')) continue;
    if (!entry.isFile()) throw new Error('在线论文目录中有非普通 JSON 文件，无法安全检查重复记录。');
    const filename = path.join(directory, entry.name);
    if ((await lstat(filename)).size > 1_000_000) throw new Error('在线论文目录中有超过 1 MB 的记录，无法检查重复。');
    const saved = JSON.parse(await readFile(filename, 'utf8'));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('在线论文目录中有无效记录，无法检查重复。');
    let imported;
    if (typeof saved.bibtex === 'string' && saved.bibtex.trim()) {
      try { imported = importBibtex(saved.bibtex, owner).paper; }
      catch { /* A work-in-progress draft may contain incomplete BibTeX. */ }
    }
    existing.push({ slug: entry.name.slice(0, -5), title: clean(saved.title) || imported?.title, doi: normalizeDoi(saved.doi || imported?.doi) });
  }
  for (const paper of existing) {
    const existingDoi = normalizeDoi(paper.doi);
    if (existingDoi === draft.doi) throw new Error('这个 DOI 已经存在于论文列表或草稿中，未创建重复记录。');
    if (duplicateTitleKey(paper.title) === duplicateTitleKey(draft.title) && (!explicitDoi || !doiPattern.test(existingDoi))) {
      throw new Error('已有同标题的论文或草稿，请先检查后台记录；确为另一篇时请使用 DOI 导入。');
    }
    if (paper.slug === slug) throw new Error('拟用的文件名已被占用，请检查已有记录或使用手动添加。');
  }
}

export async function importPublicationDraft(inputs, { root = defaultRoot, fetcher = fetch } = {}) {
  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs) ||
    [inputs.title, inputs.doi].some(value => value != null && typeof value !== 'string')) throw new Error('请输入论文标题或 DOI。');
  const title = clean(inputs.title);
  const enteredDoi = normalizeDoi(inputs.doi);
  const doi = enteredDoi || (doiPattern.test(normalizeDoi(title)) ? normalizeDoi(title) : '');
  if (enteredDoi && !doiPattern.test(enteredDoi)) throw new Error('DOI 格式无效，例如 10.1109/infocom.2020.9155539。');
  if (!doi && !duplicateTitleKey(title)) throw new Error('请输入论文标题或 DOI。');
  if (title.length > 1000 || doi.length > 500) throw new Error('论文标题或 DOI 过长。');

  const record = await lookupCrossref(title, doi, fetcher);
  const { date, year } = publicationDate(record);
  const draft = {
    title: plainText(record.title[0]),
    draft: true,
    date,
    type: publicationTypes.get(record.type),
    authors: (Array.isArray(record.author) ? record.author : []).map(author => ({
      name: plainText(author?.name || [author?.given, author?.family].filter(Boolean).join(' ')),
    })).filter(author => author.name),
    venue: plainText(record['container-title']?.[0] || record.event?.name),
    venueShort: plainText(record['short-container-title']?.[0]),
    volume: clean(record.volume),
    issue: clean(record.issue),
    pages: clean(record.page),
    articleNumber: clean(record['article-number']),
    location: plainText(record.event?.location),
    doi: normalizeDoi(record.DOI),
  };
  if (Object.values(draft).some(value => typeof value === 'string' && (value.length > 2000 || /[\u0000-\u001f\u007f]/.test(value))) ||
    draft.authors.length > 100 || draft.authors.some(author => author.name.length > 200 || /[\u0000-\u001f\u007f]/.test(author.name))) {
    throw new Error('Crossref 返回的数据超过了表单限制，请手动添加。');
  }
  const slug = makeSlug(draft.title, year || '0000').replace(/^0000-/, '');
  if (!slugPattern.test(slug) || slug.length > 180) throw new Error('无法为该论文生成有效的文件名。');
  root = await realpath(root);
  const directory = await realDirectory(root, sourceDirectory.split('/'));
  const owner = await readOwner(root);
  if (draft.date && draft.venue && draft.authors.length) {
    draft.authors = normalizePaper({ ...draft, slug }, owner).authors.map(({ name }) => ({ name }));
  }
  await rejectDuplicates(root, directory, draft, slug, Boolean(doi), owner);
  const ccf = lookupCcfRank(record);
  const [cas, externalPdfUrl] = await Promise.all([
    lookupCasRank(root, record),
    lookupOpenAccessPdf(draft.doi, fetcher),
  ]);
  draft.ccfRank = ccf?.rank || '';
  draft.casRank = cas?.rank || '';
  const conferenceNote = draft.type === 'paper-conference' ? '（发布前请确认该论文是主会场正式长文）' : '';
  draft.rankingBasis = [
    ccf && `${ccf.rank} · CCF 第七版（2026） · ${ccf.venue}${conferenceNote}\n${ccf.source}`,
    cas && `${cas.rank} · 2025 版大类 · ${cas.venue}\n${cas.source}`,
  ].filter(Boolean).join('\n\n');
  draft.abstract = licensedAbstract(record, draft.doi);
  draft.externalPdfUrl = externalPdfUrl;
  const filename = `${slug}.json`;
  const populated = Object.fromEntries(Object.entries(draft).filter(([key, value]) => key === 'date' || (Array.isArray(value) ? value.length : value !== '')));
  await writeFile(path.join(directory, filename), `${JSON.stringify(populated, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  return { path: `${sourceDirectory}/${filename}`, title: draft.title, doi: draft.doi };
}

const summary = message => process.env.GITHUB_STEP_SUMMARY ? appendFile(process.env.GITHUB_STEP_SUMMARY, `${message}\n`, 'utf8') : Promise.resolve();

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (!process.env.GITHUB_EVENT_PATH) throw new Error('缺少 GitHub Actions 事件文件。');
    const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const payload = event?.inputs?.payload;
    if (typeof payload !== 'string' || payload.length > 65_535) throw new Error('导入操作缺少有效的输入。');
    const result = await importPublicationDraft(JSON.parse(payload)?.inputs);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `path=${result.path}\n`, 'utf8');
    await summary(`已查到论文资料并生成草稿 \`${result.path}\`。操作成功后，返回「在线论文管理」刷新列表，打开草稿核对后再发布。`);
    console.log(JSON.stringify(result));
  } catch (error) {
    const reason = clean(error.message).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 500);
    console.error(`论文导入失败：${reason}`);
    await summary(`论文导入失败。${reason.replace(/[\\\x60*_{}\[\]()<>#+\-.!|]/g, '\\$&')}`).catch(() => {});
    process.exitCode = 1;
  }
}
