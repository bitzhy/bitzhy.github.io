import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { syncPublications } from './sync.mjs';
import { normalizePaper, generateMarkdown, generateBibtex, importBibtex } from '../publication-manager/publication.mjs';
import { isMigratedBackup } from './migration.mjs';

const bibtex = '@article{online2026, title={An Online {3D} Study}, author={Smith, Alex and Duan, Chunhui}, journal={Journal of Online Tests}, year={2026}, month=oct, pages={1--12}, doi={10.1234/online.test}}';
const sourceDirectory = 'data/online_publications';
const outputDirectory = 'content/publications/online';
const markerName = '.generated-by-online-publications.json';
const paper = overrides => ({ draft: false, title: 'An Online Study', authors: [{ name: 'Alex Smith', note: '' }, { name: 'Chunhui Duan', note: 'Corresponding author' }], date: '2026-10-30', type: 'article-journal', venue: 'Journal of Online Tests', venueShort: 'Online Tests', doi: '10.1234/online.test', tags: ['CCF-A', '中科院一区'], ...overrides });
async function fixture(t) {
  const testDirectory = process.env.PUBLICATION_TEST_TMPDIR ? path.resolve(process.env.PUBLICATION_TEST_TMPDIR) : os.tmpdir();
  await mkdir(testDirectory, { recursive: true });
  const root = await mkdtemp(path.join(testDirectory, 'online-publications-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, sourceDirectory), { recursive: true });
  return root;
}
const writeSource = (root, name, value) => writeFile(path.join(root, sourceDirectory, `${name}.json`), JSON.stringify(value));
const readGenerated = (root, name, file = 'index.md') => readFile(path.join(root, outputDirectory, name, file), 'utf8');
async function absent(filename) { await assert.rejects(readFile(filename), error => error.code === 'ENOENT'); }
async function snapshot(directory) {
  const output = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) for (const [name, value] of Object.entries(await snapshot(path.join(directory, entry.name)))) output[`${entry.name}/${name}`] = value;
    else output[entry.name] = await readFile(path.join(directory, entry.name), 'utf8');
  }
  return output;
}

test('BibTeX-first sources and manual overrides share the existing generator output', async t => {
  const root = await fixture(t);
  const submission = { draft: false, bibtex, title: '', date: '2026-10-30', venueShort: 'Online Tests', authors: [], type: '' };
  await writeSource(root, 'stable-paper', submission);
  const result = await syncPublications({ root });
  assert.equal(result.published, 1);
  assert.ok(result.warnings.every(warning => !warning.includes('已暂用该月 1 日')));
  const expected = normalizePaper({ ...importBibtex(bibtex).paper, date: submission.date, venueShort: submission.venueShort, slug: 'stable-paper' });
  assert.equal(await readGenerated(root, 'stable-paper', 'cite.bib'), generateBibtex(expected));
  const markdown = await readGenerated(root, 'stable-paper');
  assert.equal(markdown, generateMarkdown(expected).replace(/^---\n/, '---\nurl: "/publications/stable-paper/"\ndraft: false\n'));
  assert.match(markdown, /  - "me"/);
  assert.match(await readGenerated(root, 'stable-paper', 'cite.bib'), /\{3D\}/);
  await writeSource(root, 'stable-paper', { ...submission, title: 'An Explicit Edited Title', authors: [{ name: 'me', note: 'Corresponding author' }], volume: '12' });
  await syncPublications({ root });
  assert.match(await readGenerated(root, 'stable-paper'), /title: "An Explicit Edited Title"/);
  assert.match(await readGenerated(root, 'stable-paper', 'cite.bib'), /volume = \{12\}/);
  await writeSource(root, 'stable-paper', { ...submission, date: '' });
  const inferred = await syncPublications({ root });
  assert.ok(inferred.warnings.some(warning => warning.includes('已暂用该月 1 日')));
});

test('incomplete drafts and records with no explicit publish choice are skipped safely', async t => {
  const root = await fixture(t);
  await writeSource(root, 'draft', { draft: true, title: 'Draft', date: 'bad', authors: 'not an array', bibtex: 'unfinished text' });
  await writeSource(root, 'default-draft', { title: 'Draft by default' });
  const result = await syncPublications({ root });
  assert.equal(result.published, 0);
  assert.equal(result.skippedDrafts, 2);
  await absent(path.join(root, outputDirectory, markerName));
});

test('single-select ranking fields replace or clear corresponding tags and reject unknown ranks', async t => {
  const root = await fixture(t);
  const submission = paper({ tags: ['CCF-B', '中科院二区', 'Wireless Sensing'], ccfRank: 'CCF-A', casRank: '中科院一区' });
  await writeSource(root, 'ranked-paper', submission);
  await syncPublications({ root });
  let markdown = await readGenerated(root, 'ranked-paper');
  assert.match(markdown, /  - "CCF-A"/);
  assert.match(markdown, /  - "中科院一区"/);
  assert.doesNotMatch(markdown, /CCF-B|中科院二区/);
  await writeSource(root, 'ranked-paper', { ...submission, ccfRank: '', casRank: '' });
  await syncPublications({ root });
  markdown = await readGenerated(root, 'ranked-paper');
  assert.match(markdown, /  - "Wireless Sensing"/);
  assert.doesNotMatch(markdown, /CCF-|中科院/);
  await writeSource(root, 'ranked-paper', { ...submission, ccfRank: 'CCF-D' });
  await assert.rejects(syncPublications({ root }), /CCF 等级无效/);
  assert.equal(await readGenerated(root, 'ranked-paper'), markdown);
  await writeSource(root, 'ranked-paper', { ...submission, casRank: '一区' });
  await assert.rejects(syncPublications({ root }), /中科院分区无效/);
  assert.equal(await readGenerated(root, 'ranked-paper'), markdown);
});

test('editing a title preserves filename-derived public URL and replaces owned output', async t => {
  const root = await fixture(t);
  await writeSource(root, 'stable-paper', paper());
  await syncPublications({ root });
  await writeSource(root, 'stable-paper', paper({ title: 'A Revised Paper Title' }));
  const result = await syncPublications({ root });
  assert.deepEqual(result.publications, [{ source: 'stable-paper.json', slug: 'stable-paper', url: '/publications/stable-paper/' }]);
  assert.match(await readGenerated(root, 'stable-paper'), /url: "\/publications\/stable-paper\/"/);
  assert.match(await readGenerated(root, 'stable-paper'), /title: "A Revised Paper Title"/);
  const parentEntries = await readdir(path.join(root, 'content/publications'));
  assert.deepEqual(parentEntries, ['online']);
});

test('published duplicate or invalid records leave all existing generated output unchanged', async t => {
  const root = await fixture(t);
  await writeSource(root, 'valid-paper', paper());
  await syncPublications({ root });
  const before = await snapshot(path.join(root, outputDirectory));
  await writeSource(root, 'second-paper', paper({ title: 'Different title' }));
  await assert.rejects(syncPublications({ root }), /重复/);
  assert.deepEqual(await snapshot(path.join(root, outputDirectory)), before);
  await writeSource(root, 'second-paper', paper({ title: 'Different title', doi: '10.1234/different', date: '2026-02-30' }));
  await assert.rejects(syncPublications({ root }), /日期/);
  assert.deepEqual(await snapshot(path.join(root, outputDirectory)), before);
  await writeSource(root, 'second-paper', paper({ title: 'Different title', doi: '', tags: ['CCF-A', 'CCF-B'] }));
  await assert.rejects(syncPublications({ root }), /一个 CCF/);
  assert.deepEqual(await snapshot(path.join(root, outputDirectory)), before);
});

test('original bundle slug, title and DOI conflicts are rejected and originals retained', async t => {
  const root = await fixture(t);
  const directory = path.join(root, 'content/publications/existing-paper');
  await mkdir(directory, { recursive: true });
  const original = generateMarkdown(normalizePaper({ ...paper(), slug: 'existing-paper' }));
  await writeFile(path.join(directory, 'index.md'), original);
  for (const [name, submission] of [
    ['existing-paper', paper({ title: 'Another title', doi: '' })],
    ['another-paper', paper({ title: 'An Online Study', doi: '' })],
    ['another-paper', paper({ title: 'Another title' })],
  ]) {
    await writeSource(root, name, submission);
    await assert.rejects(syncPublications({ root }), /重复/);
    await rm(path.join(root, sourceDirectory, `${name}.json`));
    assert.equal(await readFile(path.join(directory, 'index.md'), 'utf8'), original);
  }
});

test('uploaded media links, owner alias and aligned author notes render without copying media', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'static/papers'), { recursive: true });
  await mkdir(path.join(root, 'static/slides'), { recursive: true });
  const pdf = Buffer.from('%PDF-1.4\nfixture\n%%EOF');
  await writeFile(path.join(root, 'static/papers/uploaded paper.pdf'), pdf);
  await writeFile(path.join(root, 'static/slides/deck.pptx'), Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0]));
  await writeSource(root, 'media-paper', paper({ pdfUrl: '/papers/uploaded%20paper.pdf', slidesUrl: '/slides/deck.pptx', projectUrl: 'https://example.com/project' }));
  await syncPublications({ root });
  const markdown = await readGenerated(root, 'media-paper');
  assert.match(markdown, /authors:\n  - "Alex Smith"\n  - "me"\nauthor_notes:\n  - ""\n  - "Corresponding author"/);
  assert.match(markdown, /type: pdf\n    url: "\/papers\/uploaded%20paper.pdf"/);
  assert.match(markdown, /type: slides\n    url: "\/slides\/deck.pptx"/);
  assert.match(markdown, /type: project\n    url: "https:\/\/example.com\/project"/);
  assert.deepEqual(await readFile(path.join(root, 'static/papers/uploaded paper.pdf')), pdf);
});

test('external HTTPS PDF renders when no uploaded PDF is selected', async t => {
  const root = await fixture(t);
  const localPdf = '/papers/original.pdf';
  const externalPdfUrl = 'https://example.org/download?id=42';
  await mkdir(path.join(root, 'static/papers'), { recursive: true });
  await writeFile(path.join(root, 'static', localPdf), '%PDF-1.4\nfixture\n%%EOF');
  await writeSource(root, 'local-paper', paper({ pdfUrl: localPdf }));
  await syncPublications({ root });
  const original = await readGenerated(root, 'local-paper');
  await writeSource(root, 'local-paper', paper({ pdfUrl: localPdf, externalPdfUrl }));
  await syncPublications({ root });
  assert.equal(await readGenerated(root, 'local-paper'), original);
  await writeSource(root, 'local-paper', paper({ externalPdfUrl }));
  const result = await syncPublications({ root });
  const markdown = await readGenerated(root, 'local-paper');
  assert.ok(markdown.includes(`type: pdf\n    url: "${externalPdfUrl}"`));
  assert.ok(!result.warnings.some(warning => warning.includes('未提供 PDF')));
  for (const invalid of ['http://example.org/file.pdf', 'https://user:secret@example.org/file.pdf', '/papers/original.pdf']) {
    await writeSource(root, 'local-paper', paper({ externalPdfUrl: invalid }));
    await assert.rejects(syncPublications({ root }), /外部 PDF 链接必须是完整的 HTTPS 地址/);
    assert.equal(await readGenerated(root, 'local-paper'), markdown);
  }
});

test('missing, mismatched and escaping local media fail before replacing prior generated output', async t => {
  const root = await fixture(t);
  await writeSource(root, 'valid-paper', paper());
  await syncPublications({ root });
  const before = await snapshot(path.join(root, outputDirectory));
  for (const pdfUrl of ['/papers/missing.pdf', '/%2e%2e/secret.pdf', '/papers/../../secret.pdf', '/papers/%5csecret.pdf']) {
    await writeSource(root, 'valid-paper', paper({ pdfUrl }));
    await assert.rejects(syncPublications({ root }), /附件|路径/);
    assert.deepEqual(await snapshot(path.join(root, outputDirectory)), before);
  }
  await mkdir(path.join(root, 'static/papers'), { recursive: true });
  await writeFile(path.join(root, 'static/papers/wrong.pdf'), 'not a PDF');
  await writeSource(root, 'valid-paper', paper({ pdfUrl: '/papers/wrong.pdf' }));
  await assert.rejects(syncPublications({ root }), /内容与扩展名/);
  assert.deepEqual(await snapshot(path.join(root, outputDirectory)), before);
  await writeSource(root, 'valid-paper', paper({ pdfUrl: 'https://example.com/paper.pdf' }));
  assert.equal((await syncPublications({ root })).published, 1);
});

test('deleted sources and reverted drafts prune only previously generated bundles', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'content/publications/original'), { recursive: true });
  await writeFile(path.join(root, 'content/publications/original/index.md'), 'original content');
  await writeSource(root, 'first', paper());
  await writeSource(root, 'second', paper({ title: 'Second Study', doi: '10.1234/second' }));
  await syncPublications({ root });
  await rm(path.join(root, sourceDirectory, 'first.json'));
  let result = await syncPublications({ root });
  assert.deepEqual(result.removed, ['first']);
  await absent(path.join(root, outputDirectory, 'first/index.md'));
  await writeSource(root, 'second', { title: 'Back to draft', draft: true });
  result = await syncPublications({ root });
  assert.equal(result.published, 0);
  assert.deepEqual(result.removed, ['second']);
  await absent(path.join(root, outputDirectory, markerName));
  assert.equal(await readFile(path.join(root, 'content/publications/original/index.md'), 'utf8'), 'original content');
  assert.deepEqual(await readdir(path.join(root, 'content/publications')), ['original']);
});

test('an unmarked or mismatched output directory is never replaced or recursively deleted', async t => {
  const root = await fixture(t);
  await mkdir(path.join(root, outputDirectory), { recursive: true });
  const keep = path.join(root, outputDirectory, 'keep.txt');
  await writeFile(keep, 'user-owned content');
  await writeSource(root, 'valid-paper', paper());
  await assert.rejects(syncPublications({ root }), /生成器标记/);
  assert.equal(await readFile(keep, 'utf8'), 'user-owned content');
  await writeFile(path.join(root, outputDirectory, markerName), JSON.stringify({ generator: 'some-other-tool', version: 1, sources: [] }));
  await assert.rejects(syncPublications({ root }), /标记无效/);
  assert.equal(await readFile(keep, 'utf8'), 'user-owned content');
});

async function migratedFixture(t, overrides = {}) {
  const root = await fixture(t);
  const slug = '2026-migrated-paper';
  const attribution = 'Abstract from the [ACM publication](https://dl.acm.org/doi/10.1234/online.test), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).';
  const baseline = paper({ slug, bibtex: `${bibtex}\r\n`, volume: '0', issue: '0', pages: '1-12', articleNumber: '185', abstract: 'Original abstract with {3D} data.', citationEnglish: 'Exact original English citation.', citationChinese: '原始中文引用。', openAccess: true });
  const originalFrontmatter = { title: baseline.title, authors: ['Alex Smith', 'me'], author_notes: ['', 'Corresponding author'], date: `${baseline.date}T00:00:00Z`, publication_types: ['article-journal'], publication: { name: baseline.venue, short_name: baseline.venueShort, volume: '0', issue: '0', pages: '1-12', article_number: '185', custom_publisher_key: 'retain me' }, tags: baseline.tags, peer_reviewed: true, featured: false, open_access: true, hugoblox: { ids: { doi: baseline.doi, arbitrary_id: 'keep-id' }, extra: { keep: true } }, arbitrary_metadata: { nested: ['one', 'two'] } };
  const body = `\r\n## Abstract\r\n\r\n${baseline.abstract}\r\n\r\n${attribution}\r\n\r\n## Citation\r\n\r\n${baseline.citationEnglish}\r\n\r\n## 中文引用（GB/T 7714）\r\n\r\n${baseline.citationChinese}\r\n`;
  const migration = { version: 1, originalPath: `content/publications/${slug}/index.md`, originalUrl: `/publications/${slug}/`, frontmatter: originalFrontmatter, body, bibtex: baseline.bibtex, baseline, attribution };
  const archive = `${JSON.stringify({ ...originalFrontmatter, cms_migrated: true, build: { render: 'never', list: 'never', publishResources: false } }, null, 2)}\n${body}`;
  await mkdir(path.join(root, 'content/publications', slug), { recursive: true });
  await writeFile(path.join(root, migration.originalPath), archive);
  await writeFile(path.join(root, 'content/publications', slug, 'cite.bib'), migration.bibtex);
  const submission = { ...baseline, migration, ...overrides };
  await writeSource(root, slug, submission);
  return { root, slug, submission, migration, archive };
}

function parseGeneratedJson(markdown, body) {
  return JSON.parse(markdown.slice(0, markdown.length - body.length).trim());
}

test('migrated papers preserve raw body, raw BibTeX, unknown metadata, zero strings and aligned notes', async t => {
  const { root, slug, migration, archive } = await migratedFixture(t);
  assert.equal((await syncPublications({ root })).published, 1);
  const markdown = await readGenerated(root, slug);
  assert.ok(markdown.endsWith(migration.body));
  assert.equal(await readGenerated(root, slug, 'cite.bib'), migration.bibtex);
  const front = parseGeneratedJson(markdown, migration.body);
  assert.equal(front.publication.volume, '0');
  assert.equal(front.publication.issue, '0');
  assert.equal(front.publication.article_number, '185');
  assert.equal(front.publication.custom_publisher_key, 'retain me');
  assert.deepEqual(front.author_notes, ['', 'Corresponding author']);
  assert.deepEqual(front.arbitrary_metadata, migration.frontmatter.arbitrary_metadata);
  assert.equal(front.hugoblox.ids.arbitrary_id, 'keep-id');
  assert.equal(front.url, `/publications/${slug}/`);
  assert.equal(front.cms_migrated, undefined);
  assert.equal(await readFile(path.join(root, migration.originalPath), 'utf8'), archive);
});

test('opaque migration payload survives recursive CMS empty-value sanitization losslessly', async t => {
  const { root, slug, submission, migration } = await migratedFixture(t);
  const empty = value => value == null || value === '' || Array.isArray(value) && !value.length || value && typeof value === 'object' && !Object.keys(value).length;
  const sanitize = value => {
    if (Array.isArray(value)) return value.map(sanitize).filter(value => !empty(value));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, sanitize(value)]).filter(([, value]) => !empty(value)));
    return value;
  };
  const payload = JSON.stringify(migration);
  const sanitized = sanitize({ ...submission, migration: { version: 1, payload } });
  assert.equal(sanitized.migration.payload, payload);
  // Demonstrate why the old nested-object form is unsafe in a live CMS save.
  assert.deepEqual(sanitize(migration).frontmatter.author_notes, ['Corresponding author']);
  await writeSource(root, slug, sanitized);
  assert.equal((await syncPublications({ root })).published, 1);
  const markdown = await readGenerated(root, slug);
  assert.ok(markdown.endsWith(migration.body));
  const front = parseGeneratedJson(markdown, migration.body);
  assert.deepEqual(front, { ...migration.frontmatter, url: migration.originalUrl, draft: false });
  assert.deepEqual(front.author_notes, ['', 'Corresponding author']);
  assert.equal(await readGenerated(root, slug, 'cite.bib'), migration.bibtex);
  for (const wrapper of [{ version: 1, payload: '' }, { version: 1, payload: '{broken' }, { version: 1, payload: 'x'.repeat(800_001) }]) {
    await writeSource(root, slug, { ...submission, migration: wrapper });
    await assert.rejects(syncPublications({ root }), /迁移保护载荷/);
  }
});

test('migrated edits update metadata, references and bibliography while preserving abstract attribution', async t => {
  const { root, slug, submission, migration } = await migratedFixture(t);
  await syncPublications({ root });
  await writeSource(root, slug, { ...submission, title: 'A revised migrated title', abstract: 'Replacement scientific abstract.', volume: '', authors: [{ name: 'Chunhui Duan', note: 'Corresponding author' }, { name: 'Alex Smith', note: 'Corresponding author' }] });
  await syncPublications({ root });
  const markdown = await readGenerated(root, slug);
  assert.match(markdown, /"title": "A revised migrated title"/);
  assert.match(markdown, /Replacement scientific abstract\./);
  assert.equal(markdown.split(migration.attribution).length - 1, 1);
  assert.doesNotMatch(markdown, /Exact original English citation|原始中文引用/);
  assert.match(markdown, /“A revised migrated title,”/);
  const bibliography = await readGenerated(root, slug, 'cite.bib');
  assert.match(bibliography, /title = \{A revised migrated title\}/);
  assert.match(bibliography, /abstract = \{Replacement scientific abstract\.\}/);
  assert.doesNotMatch(bibliography, /licensed|creativecommons|volume =/);
  assert.ok(markdown.includes('"author_notes": [\n    "Corresponding author",\n    "Corresponding author"'));
  assert.match(markdown, /"url": "\/publications\/2026-migrated-paper\/"/);
  assert.equal(submission.migration.body, migration.body);
});

test('migrated explicit custom citation edits win, cosmetic edits retain raw bibliography', async t => {
  const { root, slug, submission, migration } = await migratedFixture(t);
  await writeSource(root, slug, { ...submission, venueShort: 'Changed abbreviation', ccfRank: 'CCF-C', citationEnglish: 'My carefully edited citation.' });
  await syncPublications({ root });
  const markdown = await readGenerated(root, slug);
  assert.match(markdown, /My carefully edited citation/);
  assert.match(markdown, /原始中文引用/);
  assert.equal(await readGenerated(root, slug, 'cite.bib'), migration.bibtex);
  // Pages CMS removes empty scalar/array controls on serialization. Real
  // migrated sources keep only unrelated topic tags, so omission must clear
  // the removed CCF selection while retaining the still-selected CAS rank.
  const sanitized = { ...submission, casRank: '中科院一区' };
  delete sanitized.tags;
  delete sanitized.ccfRank;
  await writeSource(root, slug, sanitized);
  await syncPublications({ root });
  const cleared = await readGenerated(root, slug);
  assert.doesNotMatch(cleared, /"CCF-/);
  assert.match(cleared, /"中科院一区"/);
});

test('only fully hidden marked backups bypass conflicts and path-forged migrations are rejected', async t => {
  const { root, slug, submission, migration } = await migratedFixture(t);
  const archivePath = path.join(root, migration.originalPath);
  const incomplete = { ...migration.frontmatter, cms_migrated: true, build: { render: 'never', list: 'never', publishResources: true } };
  await writeFile(archivePath, `${JSON.stringify(incomplete)}\n${migration.body}`);
  await assert.rejects(syncPublications({ root }), /原始论文备份/);
  await writeSource(root, slug, { ...submission, migration: undefined });
  await assert.rejects(syncPublications({ root }), /重复/);
  const markedYaml = '---\ncms_migrated: true\nbuild:\n  render: never\n  list: never\n  publishResources: false\n---\n';
  assert.equal(isMigratedBackup(markedYaml), true);
  assert.equal(isMigratedBackup(markedYaml.replace('publishResources: false', 'publishResources: true')), false);
  assert.equal(isMigratedBackup(markedYaml.replace('cms_migrated: true', 'cms_migrated: false')), false);
  for (const alteration of [{ originalPath: '../other/index.md' }, { originalPath: 'content/publications/another/index.md' }, { originalUrl: '/elsewhere/' }, { version: 2 }]) {
    await writeSource(root, slug, { ...submission, migration: { ...migration, ...alteration } });
    await assert.rejects(syncPublications({ root }), /迁移信息无效/);
  }
  assert.equal(await readFile(archivePath, 'utf8'), `${JSON.stringify(incomplete)}\n${migration.body}`);
});

test('identical titles with distinct valid DOIs coexist, missing or duplicate DOI remains ambiguous', async t => {
  const root = await fixture(t);
  await writeSource(root, 'rosense-journal', paper({ title: 'RoSense: Same title', doi: '10.1234/journal' }));
  await writeSource(root, 'rosense-review', paper({ title: 'RoSense: Same title', doi: '10.1234/review' }));
  assert.equal((await syncPublications({ root })).published, 2);
  for (const doi of ['', '10.1234/journal']) {
    await writeSource(root, 'rosense-third', paper({ title: 'RoSense: Same title', doi }));
    await assert.rejects(syncPublications({ root }), /重复/);
  }
});

test('drafting and deleting migrated sources removes generated pages without reviving archived originals', async t => {
  const { root, slug, submission, migration, archive } = await migratedFixture(t);
  await syncPublications({ root });
  await writeSource(root, slug, { ...submission, draft: true });
  assert.equal((await syncPublications({ root })).published, 0);
  await absent(path.join(root, outputDirectory, slug, 'index.md'));
  assert.equal(isMigratedBackup(await readFile(path.join(root, migration.originalPath), 'utf8')), true);
  await writeSource(root, slug, submission);
  await syncPublications({ root });
  await rm(path.join(root, sourceDirectory, `${slug}.json`));
  assert.equal((await syncPublications({ root })).published, 0);
  await absent(path.join(root, outputDirectory, slug, 'index.md'));
  assert.equal(await readFile(path.join(root, migration.originalPath), 'utf8'), archive);
  assert.equal(await readFile(path.join(root, 'content/publications', slug, 'cite.bib'), 'utf8'), migration.bibtex);
});
