/**
 * Fair, transparent esports ranking & time-window filtering for Team Matrix.
 * Default ranking uses Average Points per Scrim (Total / Scrims) with a
 * minimum 3-scrim qualification rule when the pool has >= 3 active teams
 * holding 3+ sessions (prevents scrim-spamming AND 1-match luck exploits).
 */

const MONTH_SHORT_MY = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];

export function parseScrimTimestamp(dateStr) {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const ts = Date.parse(`${raw.slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(ts) ? null : ts;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getScrimMonthKey(dateStr) {
  const raw = String(dateStr || '').trim();
  if (/^\d{4}-\d{2}/.test(raw)) {
    return raw.slice(0, 7);
  }
  const ts = parseScrimTimestamp(raw);
  if (!ts) return '';
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function buildMonthOptions(scrims = []) {
  const monthKeys = new Set();
  (scrims || []).forEach((s) => {
    const mk = getScrimMonthKey(s?.date);
    if (mk) monthKeys.add(mk);
  });

  const sortedMonths = Array.from(monthKeys)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const [yearStr, monthStr] = key.split('-');
      const monthIdx = Math.max(0, Math.min(11, Number(monthStr) - 1));
      return {
        value: key,
        label: `${MONTH_SHORT_MY[monthIdx]} ${yearStr}`
      };
    });

  return [
    { value: 'ALL', label: 'Semua Masa' },
    { value: '30D', label: '30 Hari Terkini' },
    ...sortedMonths
  ];
}

export function matchesPeriodFilter(dateStr, periodKey = 'ALL', nowMs = Date.now()) {
  if (!periodKey || periodKey === 'ALL') return true;
  if (periodKey === '30D') {
    const ts = parseScrimTimestamp(dateStr);
    if (!ts) return false;
    return ts >= nowMs - 30 * 86_400_000;
  }
  return getScrimMonthKey(dateStr) === periodKey;
}

/**
 * Ranks teams either by Average Points/Scrim (default 'AVG', requiring Min 3 Scrims
 * when at least 3 teams qualify) or by Cumulative Total Points ('TOTAL').
 */
export function scoreAndRankTeams(teamRows = [], rankMode = 'AVG') {
  if (!Array.isArray(teamRows) || teamRows.length === 0) {
    return { ranked: [], minQualifyingEvents: 1 };
  }

  const enriched = teamRows.map((row) => {
    const pts = Number(row.scopedPoints ?? row.totalPoints ?? 0) || 0;
    const kills = Number(row.scopedKills ?? row.totalKills ?? 0) || 0;
    const wwcd = Number(row.scopedWWCD ?? row.totalWWCD ?? 0) || 0;
    const matches = Math.max(1, Number(row.scopedMatches ?? row.matchesCount ?? 1) || 1);
    const events = Math.max(1, Number(row.scopedEvents ?? row.scrimResults?.length ?? 1) || 1);
    const avgPts = pts / events;
    const avgPerMatch = pts / matches;
    return {
      ...row,
      scopedPoints: pts,
      scopedKills: kills,
      scopedWWCD: wwcd,
      scopedMatches: matches,
      scopedEvents: events,
      avgPts,
      avgPerMatch
    };
  });

  const qualifiedCount = enriched.filter((r) => r.scopedEvents >= 3).length;
  // Require minimum 3 scrims for Top Ranking when >= 3 teams meet the threshold; otherwise keep 1 (e.g. single Final).
  const minQualifyingEvents = rankMode === 'AVG' && qualifiedCount >= 3 ? 3 : 1;

  const withQualification = enriched.map((r) => ({
    ...r,
    isQualified: r.scopedEvents >= minQualifyingEvents
  }));

  const ranked = [...withQualification].sort((a, b) => {
    if (rankMode === 'TOTAL') {
      return (
        b.scopedPoints - a.scopedPoints ||
        b.scopedWWCD - a.scopedWWCD ||
        b.scopedKills - a.scopedKills
      );
    }
    if (a.isQualified !== b.isQualified) {
      return a.isQualified ? -1 : 1;
    }
    return (
      b.avgPts - a.avgPts ||
      b.scopedWWCD - a.scopedWWCD ||
      b.scopedKills - a.scopedKills ||
      b.scopedPoints - a.scopedPoints
    );
  });

  return {
    ranked,
    minQualifyingEvents
  };
}
