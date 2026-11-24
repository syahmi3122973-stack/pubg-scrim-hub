/**
 * Fair esports ranking & time-window filtering helpers for Team Matrix.
 * Uses Bayesian confidence shrinkage (Power Rating) so teams cannot exploit
 * cumulative points by spamming low-tier scrims, nor steal #1 off 1 lucky match.
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
 * Computes Bayesian Power Rating + Avg/Session + Cumulative Total and returns sorted rows.
 * Formula: Power = (v * R + m * C) / (v + m)
 *   R = avgPts/session, v = events played, C = cohort mean avgPts, m = confidence prior.
 */
export function scoreAndRankTeams(teamRows = [], rankMode = 'POWER') {
  if (!Array.isArray(teamRows) || teamRows.length === 0) {
    return { ranked: [], baselineAvg: 0, confidenceWeight: 0, maxEvents: 0 };
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

  const eventCounts = enriched.map((r) => r.scopedEvents).sort((a, b) => a - b);
  const sortedAvgs = enriched.map((r) => r.avgPts).sort((a, b) => a - b);
  const maxEvents = eventCounts[eventCounts.length - 1] || 1;
  const medianEvents = eventCounts[Math.floor(eventCounts.length / 2)] || 1;
  const p35Avg = sortedAvgs[Math.floor(sortedAvgs.length * 0.35)] ?? sortedAvgs[0];
  const meanAvg = enriched.reduce((sum, r) => sum + r.avgPts, 0) / enriched.length;
  // Conservative baseline prior prevents small high-scoring subsets from letting 1-match flukes beat proven squads
  const baselineAvg = Math.min(meanAvg, p35Avg > 0 ? p35Avg : meanAvg) * 0.9;

  // Single-event finals/stages keep exact placement order (m = 0); multi-scrim pools apply m up to 5.
  const confidenceWeight = maxEvents <= 2 ? 0 : Math.min(5, Math.max(3, Math.round(medianEvents)));

  const withPower = enriched.map((r) => {
    const powerRating =
      confidenceWeight === 0
        ? r.avgPts
        : (r.scopedEvents * r.avgPts + confidenceWeight * baselineAvg) /
          (r.scopedEvents + confidenceWeight);
    return {
      ...r,
      powerRating
    };
  });

  const ranked = [...withPower].sort((a, b) => {
    if (rankMode === 'TOTAL') {
      return (
        b.scopedPoints - a.scopedPoints ||
        b.scopedWWCD - a.scopedWWCD ||
        b.scopedKills - a.scopedKills
      );
    }
    if (rankMode === 'AVG') {
      return (
        b.avgPts - a.avgPts ||
        b.scopedEvents - a.scopedEvents ||
        b.scopedWWCD - a.scopedWWCD ||
        b.scopedKills - a.scopedKills
      );
    }
    return (
      b.powerRating - a.powerRating ||
      b.scopedWWCD - a.scopedWWCD ||
      b.scopedKills - a.scopedKills ||
      b.scopedPoints - a.scopedPoints
    );
  });

  return {
    ranked,
    baselineAvg,
    confidenceWeight,
    maxEvents
  };
}
