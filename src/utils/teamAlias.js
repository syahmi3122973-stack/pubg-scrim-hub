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
  ben: 'ben'
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
 * Computes a deterministic canonical grouping key for a team name so split
 * variants such as "Sentry Symphony" + "Sentry Symphony Esports" or
 * "Ben" + "Ben Esports" aggregate into one team entry.
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
 * fuller official variants (e.g., "Ben Esports" over "Ben", "Sentry Symphony Esports"
 * over "Sentry Symphony") and higher frequency.
 * @param {Iterable<string>|Map<string, number>} candidatesOrCounts
 * @param {string|null} registeredName
 * @returns {string}
 */
export function pickPreferredTeamDisplayName(candidatesOrCounts, registeredName = null) {
  const regClean = cleanTeamDisplayName(registeredName);
  if (regClean) return regClean;

  const entries =
    candidatesOrCounts instanceof Map
      ? Array.from(candidatesOrCounts.entries())
      : Array.from(candidatesOrCounts || []).map((name) => [name, 1]);

  if (entries.length === 0) return '';

  const scoreCandidate = (name, count) => {
    const clean = cleanTeamDisplayName(name);
    const hasOfficialSuffix = /\b(?:esports|esport|e-sports|e-sport|gaming|official)\b/i.test(clean) ? 1 : 0;
    const isMixedCase = /[a-z]/.test(clean) && /[A-Z]/.test(clean) ? 1 : 0;
    return { clean, hasOfficialSuffix, count, isMixedCase, len: clean.length };
  };

  return entries
    .map(([name, count]) => scoreCandidate(name, count))
    .filter((item) => Boolean(item.clean))
    .sort((a, b) => {
      if (b.hasOfficialSuffix !== a.hasOfficialSuffix) return b.hasOfficialSuffix - a.hasOfficialSuffix;
      if (b.count !== a.count) return b.count - a.count;
      if (b.len !== a.len) return b.len - a.len;
      if (b.isMixedCase !== a.isMixedCase) return b.isMixedCase - a.isMixedCase;
      return a.clean.localeCompare(b.clean);
    })[0]?.clean || '';
}
