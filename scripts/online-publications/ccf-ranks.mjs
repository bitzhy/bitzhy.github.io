const source = 'https://www.ccf.org.cn/Academic_Evaluation/By_category/2026-03-31/870181.shtml';

// Selected entries checked against the formal seventh-edition catalog,
// released 2026-03-31 and corrected 2026-04-09. Page numbers refer to its PDF.
const journals = [
  { rank: 'CCF-A', venue: 'IEEE Transactions on Mobile Computing', issns: ['1536-1233', '1558-0660', '2161-9875'] }, // p. 10
  { rank: 'CCF-A', venue: 'IEEE Transactions on Networking', aliases: ['IEEE/ACM Transactions on Networking'], issns: ['1063-6692', '1558-2566'] }, // p. 10
  { rank: 'CCF-A', venue: 'IEEE Journal on Selected Areas in Communications' }, // p. 10
  { rank: 'CCF-B', venue: 'ACM Transactions on Sensor Networks' }, // p. 11
  { rank: 'CCF-B', venue: 'IEEE Transactions on Wireless Communications' }, // p. 11
  { rank: 'CCF-B', venue: 'IEEE Transactions on Communications' }, // p. 11
  { rank: 'CCF-C', venue: 'IEEE Internet of Things Journal', issns: ['2327-4662', '2372-2541'] }, // p. 12
  { rank: 'CCF-C', venue: 'ACM Transactions on Internet of Things' }, // p. 12
  { rank: 'CCF-A', venue: 'IEEE Transactions on Image Processing' }, // p. 44
  { rank: 'CCF-B', venue: 'IEEE Transactions on Circuits and Systems for Video Technology', issns: ['1051-8215', '1558-2205'] }, // p. 45
  { rank: 'CCF-A', venue: 'IEEE Transactions on Pattern Analysis and Machine Intelligence' }, // p. 52
  { rank: 'CCF-A', venue: 'International Journal of Computer Vision', issns: ['0920-5691', '1573-1405'] }, // p. 52
];

const conferences = [
  { rank: 'CCF-B', acronym: 'ICDCS', venue: 'IEEE International Conference on Distributed Computing Systems' }, // p. 6
  { rank: 'CCF-C', acronym: 'ICPADS', venue: 'IEEE International Conference on Parallel and Distributed Systems' }, // p. 8
  { rank: 'CCF-A', acronym: 'SIGCOMM', venue: 'ACM International Conference on Applications, Technologies, Architectures, and Protocols for Computer Communication', aliases: ['ACM SIGCOMM Conference'] }, // p. 13
  { rank: 'CCF-A', acronym: 'MobiCom', venue: 'ACM International Conference on Mobile Computing and Networking', aliases: ['International Conference on Mobile Computing and Networking'] }, // p. 13
  { rank: 'CCF-A', acronym: 'INFOCOM', venue: 'IEEE International Conference on Computer Communications', aliases: ['IEEE Conference on Computer Communications', 'IEEE INFOCOM'] }, // p. 13
  { rank: 'CCF-A', acronym: 'NSDI', venue: 'USENIX Symposium on Networked Systems Design and Implementation', aliases: ['Symposium on Networked Systems Design and Implementation', 'Symposium on Network System Design and Implementation'] }, // p. 13
  { rank: 'CCF-B', acronym: 'SenSys', venue: 'ACM Conference on Embedded Networked Sensor Systems', aliases: ['Conference on Embedded Networked Sensor Systems'] }, // p. 14
  { rank: 'CCF-B', acronym: 'CoNEXT', venue: 'ACM International Conference on Emerging Networking Experiments and Technologies', aliases: ['International Conference on Emerging Networking Experiments and Technologies'] }, // p. 14
  { rank: 'CCF-B', acronym: 'SECON', venue: 'IEEE International Conference on Sensing, Communication, and Networking' }, // p. 14
  { rank: 'CCF-B', acronym: 'MobiSys', venue: 'ACM International Conference on Mobile Systems, Applications, and Services', aliases: ['International Conference on Mobile Systems, Applications, and Services'] }, // p. 14
  { rank: 'CCF-A', acronym: 'CVPR', venue: 'IEEE/CVF Computer Vision and Pattern Recognition Conference', aliases: ['IEEE/CVF Conference on Computer Vision and Pattern Recognition', 'IEEE Conference on Computer Vision and Pattern Recognition'] }, // p. 57
  { rank: 'CCF-A', acronym: 'ICCV', venue: 'IEEE International Conference on Computer Vision', aliases: ['IEEE/CVF International Conference on Computer Vision', 'International Conference on Computer Vision'] }, // p. 57
  { rank: 'CCF-A', acronym: 'UbiComp', venue: 'ACM International Joint Conference on Pervasive and Ubiquitous Computing', aliases: ['International Joint Conference on Pervasive and Ubiquitous Computing'] }, // p. 64
  { rank: 'CCF-B', acronym: 'PerCom', venue: 'IEEE International Conference on Pervasive Computing and Communications' }, // p. 65
];

function key(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').toLowerCase().replace(/&amp;|&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    : '';
}

const editions = /^(?:(?:19|20)\d{2}|\d+(?:st|nd|rd|th)|annual|the) +/;
const publisher = /^(?:ieee(?: cvf| acm)?|acm(?: ieee)?|usenix) +/;
const nonMainVenue = /\b(?:workshops?|wkshps?|companion|posters?|demos?|short papers?|findings|technical briefs?|summar(?:y|ies)|extended abstracts?|adjunct|doctoral (?:consortium|symposium)|affiliated events?)\b/;
const nonFullPaper = /^(?:(?:demo|poster)(?: abstract| paper)?|short paper|technical brief|summary|findings)(?:\s*[:\-–—]|\s*$)|\((?:demo|poster|short paper|technical brief)\)\s*$/i;

function stripEditions(name) {
  let previous;
  do {
    previous = name;
    name = name.replace(editions, '');
  } while (previous !== name);
  return name;
}

function conferenceKey(value, acronym) {
  let name = key(value).replace(/^proceedings of +/, '');
  name = stripEditions(name);
  // The full name must still match after stripping the publisher's date,
  // edition number and known acronym wrappers.
  const prefix = new RegExp(`^(?:(?:acm|ieee|usenix) )?${acronym}(?: (?:19|20)?\\d{2})? +(?=(?:the |\\d|annual |(?:acm |ieee |usenix )?(?:international |symposium |conference )))`);
  const suffix = new RegExp(` +${acronym}(?: (?:19|20)?\\d{2})?$`);
  name = stripEditions(name.replace(prefix, '')).replace(suffix, '');
  const organization = publisher.exec(name)?.[0];
  if (organization) name = organization + stripEditions(name.slice(organization.length));
  return name;
}

function journalMatch(record, containers) {
  const supplied = [
    ...(Array.isArray(record.ISSN) ? record.ISSN : []),
    ...(Array.isArray(record['issn-type']) ? record['issn-type'].map(item => item?.value) : []),
  ].filter(value => typeof value === 'string' && /^\d{4}-\d{3}[\dX]$/i.test(value)).map(value => value.toUpperCase());
  const names = containers.map(key);
  const matched = journals.filter(entry =>
    [entry.venue, ...(entry.aliases || [])].some(name => names.includes(key(name))) ||
    entry.issns?.some(issn => supplied.includes(issn)));
  if (matched.length !== 1) return null;
  const entry = matched[0];
  if (supplied.length && entry.issns && !entry.issns.some(issn => supplied.includes(issn))) return null;
  return entry;
}

function conferenceMatch(record, containers) {
  const names = [...containers, record.event?.name].filter(value => typeof value === 'string' && value.trim());
  if (names.some(name => nonMainVenue.test(key(name))) ||
      (Array.isArray(record.title) && record.title.some(title => typeof title === 'string' && nonFullPaper.test(title.trim())))) return null;
  const matched = conferences.filter(entry => {
    const knownNames = [entry.venue, ...(entry.aliases || [])].map(key);
    const acronym = key(entry.acronym);
    return names.some(name => knownNames.includes(key(name)) || knownNames.includes(conferenceKey(name, acronym)));
  });
  return matched.length === 1 ? matched[0] : null;
}

export function lookupCcfRank(record) {
  const containers = Array.isArray(record?.['container-title']) ? record['container-title'] : [];
  const entry = record?.type === 'journal-article' ? journalMatch(record, containers)
    : record?.type === 'proceedings-article' ? conferenceMatch(record, containers)
      : null;
  return entry ? { rank: entry.rank, venue: entry.venue, source } : null;
}
