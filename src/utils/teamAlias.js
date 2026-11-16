/**
 * Utilities for cleaning, matching, and merging PUBG team names that differ
 * only by trailing organizational suffixes (e.g., Esports, Gaming, Official),
 * casing, flag emojis, or extra punctuation/whitespace.
 */

const FLAG_AND_ZW_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}|[\u200B-\u200D\uFEFF]/gu;
const TRAILING_NOISE_WORD_REGEX =
  /(?:\s*[-–—|/.,:;]*\s*\(?\b(?:official|esports|esport|e-sports|e-sport|gaming|team|squad|club|pubgm|org)\b\)?)+$/i;

// Explicit canonical keys for teams whose aliases cannot be resolved by trailing suffix alone.
const EXPLICIT_TEAM_KEY_ALIASES = {
  'sentry symphony esports': 'sentry symphony',
  'sentry symphony esport': 'sentry symphony',
  'sentry symphony': 'sentry symphony',
  'ben esports': 'ben',
  'ben esport': 'ben',
  ben: 'ben',
  // MAQNA is MEC (merged canonical mapping)
  maqna: 'mec',
  'maqna esports': 'mec',
  'maqna esport': 'mec',
  'maqna gaming': 'mec',
  'maqna team': 'mec',
  'team maqna': 'mec',
  'team maqna esports': 'mec',
  'maqna squad': 'mec',
  'maqna official': 'mec',
  'maqna my': 'mec',
  'maqna malaysia': 'mec',
  mqn: 'mec',
  'mqn esports': 'mec',
  'mqn esport': 'mec',
  'mqn gaming': 'mec',
  'team mqn': 'mec',
  mec: 'mec',
  'mec esports': 'mec',
  'mec esport': 'mec',
  'mec gaming': 'mec',
  'mec team': 'mec',
  'team mec': 'mec',
  'team mec esports': 'mec',
  'mec squad': 'mec',
  'mec official': 'mec',
  'mec my': 'mec',
  'mec malaysia': 'mec'
};

/**
 * Strips flag emojis, invisible unicode markers, and collapses repeated whitespace.
 * @param {string} rawName
 * @returns {string}
 */
export function cleanTeamDisplayName(rawName) {
  if (!rawName) return '';
  return String(rawName)
    .replace(FLAG_AND_ZW_REGEX, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes legacy or re-branded team names to their canonical display version.
 * e.g., converts 'MAQNA' or 'MQN' variants into 'MEC' or 'MEC Esports'.
 * @param {string} rawName
 * @returns {string}
 */
export function resolveTeamDisplayName(rawName) {
  const cleaned = cleanTeamDisplayName(rawName);
  if (!cleaned) return '';

  if (/\b(?:maqna|mqn)\b/i.test(cleaned)) {
    return cleaned.replace(/\bmaqna\b/gi, 'MEC').replace(/\bmqn\b/gi, 'MEC');
  }

  return cleaned;
}

/**
 * Computes a deterministic canonical grouping key for a team name so split
 * variants such as "Sentry Symphony" + "Sentry Symphony Esports",
 * "Ben" + "Ben Esports", or "MAQNA" + "MEC" aggregate into one team entry.
 * @param {string} rawName
 * @returns {string}
 */
export function getCanonicalTeamKey(rawName) {
  const cleaned = cleanTeamDisplayName(rawName);
  if (!cleaned) return '';

  const lowerCleaned = cleaned.toLowerCase();
  if (EXPLICIT_TEAM_KEY_ALIASES[lowerCleaned]) {
    return EXPLICIT_TEAM_KEY_ALIASES[lowerCleaned];
  }

  // Handle "[TAG] Team Name" prefixes safely without discarding TAG if Name is only noise.
  const bracketMatch = cleaned.match(/^\[([^\]]+)\]\s*(.*)$/);
  let stem = cleaned;
  if (bracketMatch) {
    const tagPart = cleanTeamDisplayName(bracketMatch[1]);
    const restPart = cleanTeamDisplayName(bracketMatch[2]);
    const restStripped = restPart.replace(TRAILING_NOISE_WORD_REGEX, '').trim();
    stem = restStripped || tagPart || restPart;
  }

  let normalized = stem
    .toLowerCase()
    .replace(/[-–—|/.,:;]+$/g, '')
    .trim();

  // Handle MAQNA / MQN variations explicitly
  if (
    normalized === 'maqna' ||
    normalized === 'mqn' ||
    /^(?:team\s+)?(?:maqna|mqn)(?:\s+(?:esports?|gaming|squad|official|my|malaysia))?$/i.test(stem)
  ) {
    return 'mec';
  }

  // Strip trailing suffix tokens while preserving non-empty core names (e.g., "Team Secret" stays intact).
  let prev;
  do {
    prev = normalized;
    const withoutSuffix = normalized
      .replace(TRAILING_NOISE_WORD_REGEX, '')
      .replace(/[-–—|/.,:;]+$/g, '')
      .trim();
    if (withoutSuffix) {
      normalized = withoutSuffix;
    }
  } while (normalized !== prev);

  const finalKey = normalized.replace(/\s+/g, ' ').trim();
  return EXPLICIT_TEAM_KEY_ALIASES[finalKey] || finalKey;
}

/**
 * Selects the cleanest display name for a merged canonical team group.
 * Registered teams from the Team Manager always take priority; otherwise prefers
 * fuller official variants (e.g., "MEC" / "MEC Esports", "Ben Esports" over "Ben",
 * "Sentry Symphony Esports" over "Sentry Symphony") and higher frequency.
 * @param {Iterable<string>|Map<string, number>} candidatesOrCounts
 * @param {string|null} registeredName
 * @param {string|null} canonicalKey
 * @returns {string}
 */
export function pickPreferredTeamDisplayName(candidatesOrCounts, registeredName = null, canonicalKey = null) {
  const regClean = cleanTeamDisplayName(registeredName);
  if (regClean) {
    return resolveTeamDisplayName(regClean);
  }

  const entries =
    candidatesOrCounts instanceof Map
      ? Array.from(candidatesOrCounts.entries())
      : Array.from(candidatesOrCounts || []).map((name) => [name, 1]);

  if (entries.length === 0) {
    if (canonicalKey === 'mec') return 'MEC';
    return '';
  }

  const scoreCandidate = (name, count) => {
    const resolved = resolveTeamDisplayName(name);
    const clean = cleanTeamDisplayName(resolved);
    const hasOfficialSuffix = /\b(?:esports|esport|e-sports|e-sport|gaming|official)\b/i.test(clean) ? 1 : 0;
    const isMixedCase = /[a-z]/.test(clean) && /[A-Z]/.test(clean) ? 1 : 0;
    const isCanonicalBrand = /\bmec\b/i.test(clean) ? 1 : 0;
    return { clean, hasOfficialSuffix, count, isMixedCase, isCanonicalBrand, len: clean.length };
  };

  // Group counts by resolved name so MAQNA and MEC counts aggregate together
  const aggregatedCounts = new Map();
  entries.forEach(([name, count]) => {
    const resolved = resolveTeamDisplayName(name);
    if (!resolved) return;
    aggregatedCounts.set(resolved, (aggregatedCounts.get(resolved) || 0) + count);
  });

  return Array.from(aggregatedCounts.entries())
    .map(([name, count]) => scoreCandidate(name, count))
    .filter((item) => Boolean(item.clean))
    .sort((a, b) => {
      if (b.isCanonicalBrand !== a.isCanonicalBrand) return b.isCanonicalBrand - a.isCanonicalBrand;
      if (b.hasOfficialSuffix !== a.hasOfficialSuffix) return b.hasOfficialSuffix - a.hasOfficialSuffix;
      if (b.count !== a.count) return b.count - a.count;
      if (b.len !== a.len) return b.len - a.len;
      if (b.isMixedCase !== a.isMixedCase) return b.isMixedCase - a.isMixedCase;
      return a.clean.localeCompare(b.clean);
    })[0]?.clean || '';
}
