/**
 * Utilities for cleaning, matching, and merging PUBG team names that differ
 * by trailing organizational suffixes (e.g., Esports, Gaming, Official),
 * spacing ("DACS XVICTIM" vs "DACS X VICTIM"), Unicode/punctuation variations,
 * or user-defined team merges.
 */

const FLAG_AND_ZW_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}|[\u200B-\u200D\uFEFF]/gu;
const TRAILING_NOISE_WORD_REGEX =
  /(?:\s*[-–—|/.,:;]*\s*\(?\b(?:official|esports|esport|e-sports|e-sport|gaming|team|squad|club|pubgm|org)\b\)?)+$/i;

export const CUSTOM_TEAM_ALIASES_STORAGE_KEY = 'pubg_hub_team_aliases';

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
  'mec malaysia': 'mec',
  // DACS XVICTIM is DACS X VICTIM (merged canonical mapping)
  'dacs x victim': 'dacs x victim',
  'dacs xvictim': 'dacs x victim',
  dacsxvictim: 'dacs x victim',
  'dacs-x-victim': 'dacs x victim',
  'dacs-xvictim': 'dacs x victim',
  'dacs x-victim': 'dacs x victim'
};

/**
 * Reads user-merged team aliases persisted in localStorage.
 * Maps canonical key or compact signature -> target canonical display name.
 * @returns {Record<string, string>}
 */
export function getCustomTeamAliases() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(CUSTOM_TEAM_ALIASES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Persists a user-triggered team merge alias (source -> target display name),
 * updating any transitive mappings so chained merges resolve cleanly.
 * @param {string} sourceName
 * @param {string} targetName
 */
export function saveCustomTeamAlias(sourceName, targetName) {
  const cleanTarget = cleanTeamDisplayName(targetName);
  const cleanSource = cleanTeamDisplayName(sourceName);
  if (!cleanSource || !cleanTarget) return;

  const sourceKey = cleanSource.toLowerCase();
  const sourceSig = sourceKey.replace(/[^a-z0-9]/g, '');
  const targetKey = cleanTarget.toLowerCase();
  const targetSig = targetKey.replace(/[^a-z0-9]/g, '');
  if (!sourceSig || sourceSig === targetSig) return;

  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const current = getCustomTeamAliases();
    const next = { ...current };

    // Repoint existing chained entries that used to target sourceName
    Object.keys(next).forEach((k) => {
      const val = cleanTeamDisplayName(next[k]).toLowerCase();
      if (val === sourceKey || val.replace(/[^a-z0-9]/g, '') === sourceSig) {
        next[k] = cleanTarget;
      }
    });

    next[sourceKey] = cleanTarget;
    if (sourceSig) {
      next[sourceSig] = cleanTarget;
    }

    window.localStorage.setItem(CUSTOM_TEAM_ALIASES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write errors in restricted environments
  }
}

/**
 * Strips flag emojis, invisible unicode markers, normalizes Unicode compatibility
 * glyphs (e.g. fullwidth letters, curly quotes, multiplication sign), and collapses spaces.
 * @param {string} rawName
 * @returns {string}
 */
export function cleanTeamDisplayName(rawName) {
  if (!rawName) return '';
  return String(rawName)
    .normalize('NFKC')
    .replace(FLAG_AND_ZW_REGEX, '')
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00D7/g, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes legacy or re-branded team names to their canonical display version.
 * Handles MAQNA -> MEC, DACS XVICTIM -> DACS X VICTIM, plus user custom merges.
 * @param {string} rawName
 * @returns {string}
 */
export function resolveTeamDisplayName(rawName) {
  const cleaned = cleanTeamDisplayName(rawName);
  if (!cleaned) return '';

  const customAliases = getCustomTeamAliases();
  const lower = cleaned.toLowerCase();
  const compact = lower.replace(/[^a-z0-9]/g, '');
  if (customAliases[lower]) {
    return customAliases[lower];
  }
  if (compact && customAliases[compact]) {
    return customAliases[compact];
  }

  if (/\b(?:maqna|mqn)\b/i.test(cleaned)) {
    return cleaned.replace(/\bmaqna\b/gi, 'MEC').replace(/\bmqn\b/gi, 'MEC');
  }

  if (/^dacs[\s._-]*x[\s._-]*victim$/i.test(cleaned)) {
    return 'DACS X VICTIM';
  }

  return cleaned;
}

/**
 * Computes a deterministic canonical grouping key for a team name so split
 * variants such as "Sentry Symphony" + "Sentry Symphony Esports",
 * "Ben" + "Ben Esports", "MAQNA" + "MEC", or "DACS XVICTIM" + "DACS X VICTIM"
 * aggregate into one team entry.
 * @param {string} rawName
 * @returns {string}
 */
export function getCanonicalTeamKey(rawName) {
  const cleaned = cleanTeamDisplayName(rawName);
  if (!cleaned) return '';

  const lowerCleaned = cleaned.toLowerCase();
  const customAliases = getCustomTeamAliases();
  if (customAliases[lowerCleaned]) {
    const targetClean = cleanTeamDisplayName(customAliases[lowerCleaned]).toLowerCase();
    if (targetClean && targetClean !== lowerCleaned) {
      return getCanonicalTeamKey(customAliases[lowerCleaned]);
    }
  }

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
  const finalCompact = finalKey.replace(/[^a-z0-9]/g, '');

  if (finalCompact && customAliases[finalCompact]) {
    const targetLower = cleanTeamDisplayName(customAliases[finalCompact]).toLowerCase();
    if (targetLower && targetLower.replace(/[^a-z0-9]/g, '') !== finalCompact) {
      return getCanonicalTeamKey(customAliases[finalCompact]);
    }
  }

  if (EXPLICIT_TEAM_KEY_ALIASES[finalKey]) {
    return EXPLICIT_TEAM_KEY_ALIASES[finalKey];
  }
  if (finalCompact && EXPLICIT_TEAM_KEY_ALIASES[finalCompact]) {
    return EXPLICIT_TEAM_KEY_ALIASES[finalCompact];
  }

  return finalKey;
}

/**
 * Produces a space-and-punctuation-free alphanumeric signature for automatic
 * deduplication of merged letters or character variations (e.g. "TRIPLE X" === "TRIPLEX",
 * "ALLSTRMY" === "ALLSTR MY", "DACS-X-VICTIM" === "DACS XVICTIM").
 * @param {string} rawName
 * @returns {string}
 */
export function getCompactTeamSignature(rawName) {
  const key = getCanonicalTeamKey(rawName);
  return key ? key.replace(/[^a-z0-9]/g, '') : '';
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);

  for (let i = 0; i < a.length; i++) {
    curr[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j];
    }
  }
  return prev[b.length];
}

/**
 * Inspects a list of teams and surfaces near-duplicate pairs (e.g. "52" vs "TEAM 52",
 * "GOLDEN SPEAR" vs "GOLDEN SPEARS", or 1-character OCR typos) for 1-click user merging.
 * @param {Array<{id?: string, name: string, tag?: string, logo_url?: string}>} teamEntries
 * @returns {Array<{source: object, target: object, reason: string}>}
 */
export function findPotentialDuplicatePairs(teamEntries = []) {
  if (!Array.isArray(teamEntries) || teamEntries.length < 2) return [];

  const enriched = teamEntries
    .filter((t) => t && t.name)
    .map((t) => {
      const key = getCanonicalTeamKey(t.name);
      const sig = getCompactTeamSignature(t.name);
      const withoutTeamPrefix = key.replace(/^team\s+/i, '').replace(/[^a-z0-9]/g, '');
      return { team: t, key, sig, withoutTeamPrefix };
    })
    .filter((item) => item.sig.length >= 2);

  const pairs = [];
  const seenPairs = new Set();

  for (let i = 0; i < enriched.length; i++) {
    for (let j = i + 1; j < enriched.length; j++) {
      const a = enriched[i];
      const b = enriched[j];
      if (a.key === b.key) continue;

      let reason = '';
      if (a.sig === b.sig) {
        reason = 'Jarak atau aksara berbeza';
      } else if (a.withoutTeamPrefix && a.withoutTeamPrefix === b.withoutTeamPrefix) {
        reason = 'Sama dengan/tanpa perkataan "TEAM"';
      } else if (a.sig.length >= 5 && b.sig.length >= 5) {
        if (`${a.sig}s` === b.sig || `${b.sig}s` === a.sig) {
          reason = 'Hampir sama (huruf S di hujung)';
        } else if (Math.abs(a.sig.length - b.sig.length) <= 1 && levenshteinDistance(a.sig, b.sig) === 1) {
          reason = 'Ejaan hampir sama (1 aksara berbeza)';
        }
      }

      if (!reason) continue;

      const pairId = [a.key, b.key].sort().join('::');
      if (seenPairs.has(pairId)) continue;
      seenPairs.add(pairId);

      // Prefer the team with a logo, or longer/spaced cleaner name as target
      const scoreTarget = (item) => {
        const hasLogo = item.team.logo_url ? 10 : 0;
        const hasSpace = /\s/.test(item.team.name) ? 2 : 0;
        return hasLogo + hasSpace + item.team.name.length * 0.01;
      };
      const aWins = scoreTarget(a) >= scoreTarget(b);
      pairs.push({
        source: aWins ? b.team : a.team,
        target: aWins ? a.team : b.team,
        reason
      });
    }
  }

  return pairs;
}

/**
 * Matches a raw scanned/typed team name against existing registered teams.
 * Returns exact compact matches (safe to auto-snap) or near matches (suggestion pill).
 * @param {string} rawName
 * @param {Array<{name: string, tag?: string, logo_url?: string}>} knownTeams
 * @returns {{team: object, matchType: 'exact_compact'|'suggestion'}|null}
 */
export function findClosestKnownTeamMatch(rawName, knownTeams = []) {
  const cleaned = cleanTeamDisplayName(rawName);
  if (!cleaned || !Array.isArray(knownTeams) || knownTeams.length === 0) return null;

  const rawKey = getCanonicalTeamKey(cleaned);
  const rawSig = getCompactTeamSignature(cleaned);
  const rawNoTeam = rawKey.replace(/^team\s+/i, '').replace(/[^a-z0-9]/g, '');
  if (!rawSig) return null;

  // 1. Exact canonical key or compact signature match (e.g. DACS XVICTIM -> DACS X VICTIM)
  for (const kt of knownTeams) {
    if (!kt || !kt.name) continue;
    const kKey = getCanonicalTeamKey(kt.name);
    const kSig = getCompactTeamSignature(kt.name);
    if (kKey === rawKey || (rawSig && kSig === rawSig)) {
      return { team: kt, matchType: 'exact_compact' };
    }
  }

  // 2. Near match suggestion (TEAM prefix diff or 1-char typo)
  for (const kt of knownTeams) {
    if (!kt || !kt.name) continue;
    const kKey = getCanonicalTeamKey(kt.name);
    const kSig = getCompactTeamSignature(kt.name);
    const kNoTeam = kKey.replace(/^team\s+/i, '').replace(/[^a-z0-9]/g, '');
    if (rawNoTeam && rawNoTeam === kNoTeam) {
      return { team: kt, matchType: 'suggestion' };
    }
    if (rawSig.length >= 6 && kSig.length >= 6 && Math.abs(rawSig.length - kSig.length) <= 1) {
      if (levenshteinDistance(rawSig, kSig) === 1) {
        return { team: kt, matchType: 'suggestion' };
      }
    }
  }

  return null;
}

/**
 * Selects the cleanest display name for a merged canonical team group.
 * Registered teams from the Team Manager always take priority; otherwise prefers
 * fuller official variants (e.g., "MEC", "DACS X VICTIM", "Sentry Symphony Esports")
 * and properly spaced names over merged-letter variants.
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
    if (canonicalKey === 'dacs x victim') return 'DACS X VICTIM';
    return '';
  }

  const scoreCandidate = (name, count) => {
    const resolved = resolveTeamDisplayName(name);
    const clean = cleanTeamDisplayName(resolved);
    const hasOfficialSuffix = /\b(?:esports|esport|e-sports|e-sport|gaming|official)\b/i.test(clean) ? 1 : 0;
    const isMixedCase = /[a-z]/.test(clean) && /[A-Z]/.test(clean) ? 1 : 0;
    const isCanonicalBrand = /\bmec\b/i.test(clean) || /^dacs x victim$/i.test(clean) ? 1 : 0;
    const hasCleanSpacing = /\s/.test(clean) ? 1 : 0;
    return { clean, hasOfficialSuffix, count, isMixedCase, isCanonicalBrand, hasCleanSpacing, len: clean.length };
  };

  // Group counts by resolved name so aliases aggregate together
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
      if (b.hasCleanSpacing !== a.hasCleanSpacing) return b.hasCleanSpacing - a.hasCleanSpacing;
      if (b.count !== a.count) return b.count - a.count;
      if (b.len !== a.len) return b.len - a.len;
      if (b.isMixedCase !== a.isMixedCase) return b.isMixedCase - a.isMixedCase;
      return a.clean.localeCompare(b.clean);
    })[0]?.clean || '';
}
