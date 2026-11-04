import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { importPublicationDraft } from './import-by-title.mjs';
import { lookupCcfRank } from './ccf-ranks.mjs';

const source = 'data/online_publications';
const record = {
  DOI: '10.1234/test.1',
  title: ['C++ for Wireless Sensing'],
  type: 'proceedings-article',
  author: [{ given: 'Alex', family: 'Smith' }, { given: 'Chunhui', family: 'Duan' }],
  published: { 'date-parts': [[2026, 8]] },
  'container-title': ['Test Conference'],
  'article-number': '10',
  page: '12-19',
  abstract: 'Abstract supplied by the publisher',
};
const reply = message => new Response(JSON.stringify({ message }), { status: 200 });
const openAlexReply = work => Response.json(work);

async function fixture(t) {
  const parent = path.resolve(process.env.PUBLICATION_TEST_TMPDIR || os.tmpdir());
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, 'publication-title-test-'));
  assert.equal(path.dirname(root), parent);
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, source), { recursive: true });
  return root;
}

test('a unique title creates a filled draft without guessing the publication day', async t => {
  const root = await fixture(t);
  const hosts = [];
  const result = await importPublicationDraft({ title: 'c++  for wireless sensing' }, { root, fetcher: async url => {
    hosts.push(url.hostname);
    if (url.hostname === 'api.openalex.org') return new Response(null, { status: 429 });
    assert.equal(url.searchParams.get('query.title'), 'c++ for wireless sensing');
    assert.equal(url.searchParams.get('filter'), 'type:journal-article,type:proceedings-article');
    const fields = url.searchParams.get('select').split(',');
    for (const field of ['abstract', 'license', 'ISSN']) assert(fields.includes(field));
    return reply({ items: [{ ...record, DOI: '10.1234/c', title: ['C for Wireless Sensing'] }, record] });
  } });
  assert.deepEqual(hosts, ['api.crossref.org', 'api.openalex.org']);
  const draft = JSON.parse(await readFile(path.join(root, result.path), 'utf8'));
  assert.deepEqual(draft, {
    title: 'C++ for Wireless Sensing', draft: true, date: '', type: 'paper-conference',
    authors: [{ name: 'Alex Smith' }, { name: 'Chunhui Duan' }], venue: 'Test Conference',
    pages: '12-19', articleNumber: '10', doi: '10.1234/test.1',
  });
  assert.match(result.path, /^data\/online_publications\/2026-/);
});

test('similar and ambiguous titles never create records', async t => {
  const root = await fixture(t);
  await assert.rejects(importPublicationDraft({ title: 'C for Wireless Sensing' }, { root, fetcher: async () => reply({ items: [record] }) }), /未找到标题完全匹配/);
  await assert.rejects(importPublicationDraft({ title: record.title[0] }, { root, fetcher: async () => reply({ items: [record, { ...record, DOI: '10.1234/test.2' }] }) }), /多篇同名论文.*10\.1234\/test\.1.*Test Conference.*2026.*10\.1234\/test\.2/);
  assert.deepEqual(await readdir(path.join(root, source)), []);
});

test('DOI lookup keeps exact dates and refuses duplicates across both content sources', async t => {
  const root = await fixture(t);
  const fetcher = async url => {
    if (url.hostname === 'api.openalex.org') throw new Error('Network unavailable');
    assert.equal(decodeURIComponent(url.pathname), '/works/10.1234/test.1');
    return reply({ ...record, published: { 'date-parts': [[2026, 8, 19]] } });
  };
  const legacy = path.join(root, 'content/publications/older-paper');
  await mkdir(legacy, { recursive: true });
  const legacyFile = path.join(legacy, 'index.md');
  await writeFile(legacyFile, '---\ntitle: "Legacy title"\ndoi: "10.1234/TEST.1"\n---\n');
  const inputs = { title: 'https://doi.org/10.1234/TEST.1' };
  await assert.rejects(importPublicationDraft(inputs, { root, fetcher }), /DOI 已经存在/);
  assert.deepEqual(await readdir(path.join(root, source)), []);

  await writeFile(legacyFile, '---\ntitle: "Unrelated paper"\ndoi: "10.1234/unrelated"\n---\n');
  const result = await importPublicationDraft(inputs, { root, fetcher });
  const filename = path.join(root, result.path);
  const before = await readFile(filename, 'utf8');
  assert.equal(JSON.parse(before).date, '2026-08-19');
  assert.equal(JSON.parse(before).externalPdfUrl, undefined);
  await assert.rejects(importPublicationDraft(inputs, { root, fetcher }), /DOI 已经存在/);
  assert.equal(await readFile(filename, 'utf8'), before);
});

test('an imported journal receives the venue rank and an ISSN-matched CAS entry with their sources', async t => {
  const root = await fixture(t);
  const rankDir = path.join(root, 'data/ranking');
  await mkdir(rankDir, { recursive: true });
  const title = 'IEEE Transactions on Mobile Computing';
  const sourceUrl = 'https://example.org/2025-major-category';
  const journals = [{ title, issns: ['1536-1233'], rank: '中科院一区', source: sourceUrl }];
  const rankFile = path.join(rankDir, 'cas-journals.json');
  await writeFile(rankFile, JSON.stringify({ journals }));
  const result = await importPublicationDraft({ title: record.title[0] }, {
    root,
    fetcher: async url => {
      if (url.hostname !== 'api.crossref.org') return new Response('', { status: 404 });
      assert(url.searchParams.get('select').split(',').includes('ISSN'));
      return reply({ items: [{ ...record, type: 'journal-article', 'container-title': [title], ISSN: ['1536-1233'] }] });
    },
  });
  const draft = JSON.parse(await readFile(path.join(root, result.path), 'utf8'));
  assert.equal(draft.ccfRank, 'CCF-A');
  assert.equal(draft.casRank, '中科院一区');
  assert.match(draft.rankingBasis, /CCF 第七版（2026）/);
  assert.match(draft.rankingBasis, /2025 版大类/);
  assert(draft.rankingBasis.includes(sourceUrl));
});

test('a CCF main conference rank does not carry over to workshops or posters', () => {
  const infoCom = {
    type: 'proceedings-article',
    'container-title': ['IEEE INFOCOM 2024 - IEEE Conference on Computer Communications'],
    title: ['A regular conference article'],
  };
  assert.equal(lookupCcfRank(infoCom)?.rank, 'CCF-A');
  assert.equal(lookupCcfRank({ ...infoCom, event: { name: 'IEEE INFOCOM 2024 Workshops' } }), null);
  assert.equal(lookupCcfRank({ ...infoCom, title: ['Poster: A conference poster'] }), null);
});

const ccBy = {
  URL: 'http://creativecommons.org/licenses/by/4.0/',
  'content-version': 'vor',
  start: { 'date-time': '2020-01-01T00:00:00Z' },
};

test('imports a licensed abstract with attribution and an exact-DOI OA PDF link', async t => {
  const root = await fixture(t);
  const requested = [];
  const { path: draftPath } = await importPublicationDraft({ title: record.title[0] }, {
    root,
    fetcher: async url => {
      requested.push(url);
      if (url.hostname === 'api.crossref.org') return reply({ items: [{
        ...record,
        license: [ccBy],
        abstract: '<jats:abstract><jats:p>A &amp; B &#x3B1;.</jats:p><jats:p>&lt;img&gt; {{% code %}} [test](javascript:alert(1))</jats:p></jats:abstract>',
      }] });
      return openAlexReply({
        doi: 'https://doi.org/10.1234/TEST.1',
        best_oa_location: { is_oa: true, pdf_url: 'https://person:password@publisher.example/article.pdf' },
        locations: [
          { is_oa: false, pdf_url: 'https://publisher.example/paid.pdf' },
          { is_oa: true, pdf_url: 'http://publisher.example/insecure.pdf' },
          { is_oa: true, pdf_url: 'https://repository.example/open.pdf' },
        ],
      });
    },
  });
  assert.equal(requested.length, 2);
  assert.equal(requested[1].hostname, 'api.openalex.org');
  assert.equal(requested[1].pathname, '/works/https://doi.org/10.1234/test.1');
  const draft = JSON.parse(await readFile(path.join(root, draftPath), 'utf8'));
  assert.equal(draft.draft, true);
  assert.equal(draft.pdfUrl, undefined);
  assert.equal(draft.externalPdfUrl, 'https://repository.example/open.pdf');
  assert.equal(draft.abstract, 'A &amp; B α.\n\n&lt;img&gt; &#123;&#123;% code %&#125;&#125; \\[test\\](javascript:alert(1))\n\n*Abstract from the [original publication](<https://doi.org/10.1234/test.1>) via Crossref, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Formatting adapted.*');
});

test('leaves optional fields empty for unverified licenses and mismatched PDF records', async t => {
  const root = await fixture(t);
  const { path: draftPath } = await importPublicationDraft({ title: record.DOI }, {
    root,
    fetcher: async url => url.hostname === 'api.crossref.org'
      ? reply({ ...record, license: [
        { ...ccBy, 'content-version': 'tdm' },
        { ...ccBy, start: { 'date-time': '2999-01-01T00:00:00Z' } },
        { ...ccBy, URL: 'https://creativecommons.org.evil.example/licenses/by/4.0/' },
      ] })
      : openAlexReply({
        doi: 'https://doi.org/10.1234/unrelated',
        best_oa_location: { is_oa: true, pdf_url: 'https://publisher.example/wrong.pdf' },
      }),
  });
  const draft = JSON.parse(await readFile(path.join(root, draftPath), 'utf8'));
  assert.equal(draft.draft, true);
  assert.equal(draft.abstract, undefined);
  assert.equal(draft.externalPdfUrl, undefined);
});
