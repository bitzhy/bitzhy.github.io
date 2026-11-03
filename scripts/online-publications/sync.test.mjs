import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { syncPublications } from './sync.mjs';
import { normalizePaper, generateMarkdown, generateBibtex, importBibtex } from '../publication-manager/publication.mjs';

const bibtex = '@article{online2026, title={An Online {3D} Study}, author={Smith, Alex and Duan, Chunhui}, journal={Journal of Online Tests}, year={2026}, month=oct, pages={1--12}, doi={10.1234/online.test}}';
const sourceDirectory = 'data/online_publications';
const outputDirectory = 'content/publications/online';
const markerName = '.generated-by-online-publications.json';
const paper = overrides => ({ draft: false, title: 'An Online Study', authors: [{ name: 'Alex Smith', note: '' }, { name: 'Chunhui Duan', note: 'Corresponding author' }], date: '2026-10-30', type: 'article-journal', venue: 'Journal of Online Tests', venueShort: 'Online Tests', doi: '10.1234/online.test', tags: ['CCF-A', '中科院一区'], ...overrides });
async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'online-publications-test-'));
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
