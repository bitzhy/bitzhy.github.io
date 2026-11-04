import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ranks = new Set(['中科院一区', '中科院二区', '中科院三区', '中科院四区']);

function normalizeIssn(value) {
  if (typeof value !== 'string') return '';
  const issn = value.trim().toUpperCase();
  return /^\d{4}-?\d{3}[\dX]$/.test(issn) ? issn.replace('-', '') : '';
}

function hasSource(source) {
  if (typeof source !== 'string' || !/^https:\/\/[^/]/i.test(source) || /[\s\\]/.test(source)) return false;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

// The small, editable catalogue uses 2025 CAS major-category partitions only.
export async function lookupCasRank(root, record) {
  if (record?.type !== 'journal-article' || !Array.isArray(record.ISSN)) return null;
  const issns = new Set(record.ISSN.map(normalizeIssn).filter(Boolean));
  if (!issns.size) return null;

  let catalogue;
  try {
    catalogue = JSON.parse(await readFile(path.join(root, 'data', 'ranking', 'cas-journals.json'), 'utf8'));
  } catch {
    // Ranking data is optional. An unavailable catalogue should not block a draft.
    return null;
  }
  if (!Array.isArray(catalogue?.journals)) return null;
  const matches = catalogue.journals.filter(row => Array.isArray(row?.issns) &&
    row.issns.some(issn => issns.has(normalizeIssn(issn))));
  if (matches.length !== 1) return null;

  const { title, rank, source } = matches[0];
  if (typeof title !== 'string' || !title.trim() || !ranks.has(rank) || !hasSource(source)) return null;
  return { rank, venue: title.trim(), source };
}
