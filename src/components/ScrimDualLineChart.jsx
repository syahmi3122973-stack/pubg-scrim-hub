import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * Format a scrim title into a compact, readable axis label without overflowing.
 */
export const formatScrimAxisLabel = (name) => {
  const raw = String(name || 'SCRIM')
    .replace(/\b(SCRIMS?|TOURNAMENT|OFFICIAL)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  const base = raw || String(name || 'SCRIM').trim().toUpperCase();
  return base.length > 9 ? `${base.slice(0, 8)}..` : base;
};

/**
 * Format YYYY-MM-DD (or date string) to concise DD/MM for chart axis & callouts.
 */
export const formatShortScrimDate = (dateStr) => {
  if (!dateStr) return '';
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}`;
  return String(dateStr).slice(0, 6);
};

/**
 * Build chronological (oldest -> newest) dual-series chart data for Kills and Placement Points (PP).
 */
export const buildScrimTrendSeries = (results = [], maxPoints = 0) => {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      items: [],
      avgKills: '0.0',
      avgPp: '0.0',
      peakKills: 0,
      peakPp: 0,
      peakKillsIdx: -1,
      peakPpIdx: -1,
      bestScrim: null,
      yMax: 20
    };
  }

  // Sort chronologically oldest -> newest; fallback preserves reversed original order (scrims are newest-first)
  const sorted = [...results]
    .map((item, origIdx) => ({ ...item, _origIdx: origIdx }))
    .sort((a, b) => {
      const da = Date.parse(a.date || '');
      const db = Date.parse(b.date || '');
      if (!Number.isNaN(da) && !Number.isNaN(db) && da !== db) {
        return da - db;
      }
      return b._origIdx - a._origIdx;
    });

  const sliced = maxPoints > 0 && sorted.length > maxPoints ? sorted.slice(-maxPoints) : sorted;

  const items = sliced.map((item, idx) => {
    const kills = Math.max(0, Number(item.kills) || 0);
    const points = Math.max(0, Number(item.points) || 0);
    const pp = Math.max(0, points - kills);
    return {
      index: idx,
      scrimName: item.scrimName || `Scrim ${idx + 1}`,
      shortLabel: formatScrimAxisLabel(item.scrimName || `S${idx + 1}`),
      shortDate: formatShortScrimDate(item.date),
      date: item.date || '',
      eventType: item.eventType || 'Scrim',
      ranking: item.ranking || '-',
      kills,
      pp,
      points,
      wwcd: Number(item.wwcd) || 0
    };
  });

  const count = items.length;
  const sumKills = items.reduce((acc, c) => acc + c.kills, 0);
  const sumPp = items.reduce((acc, c) => acc + c.pp, 0);

  let peakKills = -1;
  let peakKillsIdx = 0;
  let peakPp = -1;
  let peakPpIdx = 0;
  let bestScrim = items[0];

  items.forEach((item, idx) => {
    if (item.kills > peakKills) {
      peakKills = item.kills;
      peakKillsIdx = idx;
    }
    if (item.pp > peakPp) {
      peakPp = item.pp;
      peakPpIdx = idx;
    }
    if (
      item.points > bestScrim.points ||
      (item.points === bestScrim.points && item.kills > bestScrim.kills)
    ) {
      bestScrim = item;
    }
  });

  const rawMax = Math.max(peakKills, peakPp, 5);
  const yMax = Math.max(10, Math.ceil((rawMax * 1.18) / 5) * 5);

  return {
    items,
    avgKills: (sumKills / count).toFixed(1),
    avgPp: (sumPp / count).toFixed(1),
    peakKills: Math.max(0, peakKills),
    peakPp: Math.max(0, peakPp),
    peakKillsIdx,
    peakPpIdx,
    bestScrim,
    yMax
  };
};

/**
 * Compute smooth Catmull-Rom cubic Bezier segments clamped strictly within [minY, maxY]
 * so curves never overshoot below zero or above the top gridline.
 */
export const computeSmoothBezierSegments = (points, minY, maxY, tension = 0.2) => {
  if (!points || points.length < 2) return [];
  const clampY = (y) => Math.min(maxY, Math.max(minY, y));
  const segments = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const isFlatSegment = Math.abs(p2.y - p1.y) < 0.01;
    const cp1y = isFlatSegment ? p1.y : clampY(p1.y + (p2.y - p0.y) * tension);
    const cp2y = isFlatSegment ? p2.y : clampY(p2.y - (p3.y - p1.y) * tension);

    segments.push({ cp1x, cp1y, cp2x, cp2y, x: p2.x, y: p2.y });
  }

  return segments;
};

const buildSvgLinePath = (points, segments) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const parts = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  segments.forEach((seg) => {
    parts.push(
      `C ${seg.cp1x.toFixed(2)} ${seg.cp1y.toFixed(2)}, ${seg.cp2x.toFixed(2)} ${seg.cp2y.toFixed(2)}, ${seg.x.toFixed(2)} ${seg.y.toFixed(2)}`
    );
  });
  return parts.join(' ');
};

const buildSvgAreaPath = (points, segments, plotBottom) => {
  if (!points || points.length < 2) return '';
  const line = buildSvgLinePath(points, segments);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last.x.toFixed(2)} ${plotBottom.toFixed(2)} L ${first.x.toFixed(2)} ${plotBottom.toFixed(2)} Z`;
};

export default function ScrimDualLineChart({ results = [], compact = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const series = useMemo(() => buildScrimTrendSeries(results, 0), [results]);
  const { items, avgKills, avgPp, peakKills, peakPp, peakKillsIdx, peakPpIdx, bestScrim, yMax } = series;

  const svgW = 500;
  const svgH = compact ? 185 : 210;
  const padLeft = 22;
  const padRight = 32;
  const padTop = 24;
  const padBottom = 38;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;
  const plotBottom = padTop + plotH;

  const coords = useMemo(() => {
    const n = items.length;
    if (n === 0) return { killsPts: [], ppPts: [] };

    const getX = (i) => (n === 1 ? padLeft + plotW / 2 : padLeft + (i / (n - 1)) * plotW);
    const getY = (val) => plotBottom - (Math.max(0, val) / yMax) * plotH;

    return {
      killsPts: items.map((d, i) => ({ x: getX(i), y: getY(d.kills), data: d })),
      ppPts: items.map((d, i) => ({ x: getX(i), y: getY(d.pp), data: d }))
    };
  }, [items, padLeft, plotW, plotBottom, plotH, yMax]);

  const killsSegs = useMemo(
    () => computeSmoothBezierSegments(coords.killsPts, padTop, plotBottom, 0.2),
    [coords.killsPts, padTop, plotBottom]
  );
  const ppSegs = useMemo(
    () => computeSmoothBezierSegments(coords.ppPts, padTop, plotBottom, 0.2),
    [coords.ppPts, padTop, plotBottom]
  );

  const activePoint =
    hoveredIdx !== null && items[hoveredIdx]
      ? items[hoveredIdx]
      : null;

  const axisStep = items.length > 7 ? Math.ceil(items.length / 6) : 1;

  if (items.length === 0) {
    return (
      <div className="bg-[#121216] rounded-2xl p-5 text-center text-xs text-zinc-500">
        Tiada rekod scrim untuk memaparkan graf prestasi Kills &amp; Placement Points.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#121216] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg">
      {/* Subtle Ambient Corner Glow */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-48 h-48 bg-[#D7FF00]/8 rounded-full blur-3xl pointer-events-none"
      />

      {/* LEVEL 1: Header & Unified Legend */}
      <div className="flex flex-wrap items-start justify-between gap-2 relative z-10">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#D7FF00]" />
            <span>Tren Prestasi Per Scrim</span>
          </span>
          <h3 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
            Kills vs Placement Points
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D7FF00]/12 text-[#D7FF00]">
            <span className="w-2 h-2 rounded-full bg-[#D7FF00] shadow-[0_0_6px_#D7FF00]" />
            <span>Kills</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/12 text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_6px_#2dd4bf]" />
            <span>PP</span>
          </span>
        </div>
      </div>

      {/* LEVEL 2: Hierarchy Insight Strip (Averages & Peak Callout) */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <div className="bg-zinc-900/75 rounded-xl px-2.5 py-2">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block truncate">Purata Kills</span>
          <span className="text-xs sm:text-sm font-black font-mono text-[#D7FF00]">
            {avgKills} <span className="text-[10px] text-zinc-400 font-semibold">/ scrim</span>
          </span>
        </div>

        <div className="bg-zinc-900/75 rounded-xl px-2.5 py-2">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block truncate">Purata PP</span>
          <span className="text-xs sm:text-sm font-black font-mono text-teal-300">
            {avgPp} <span className="text-[10px] text-zinc-400 font-semibold">/ scrim</span>
          </span>
        </div>

        <div className="bg-zinc-900/75 rounded-xl px-2.5 py-2">
          <span className="text-[9px] font-mono uppercase text-zinc-500 block truncate">Puncak Terbaik</span>
          <span className="text-xs sm:text-sm font-black font-mono text-white truncate block">
            {bestScrim ? `${bestScrim.points} PTS` : '-'}
          </span>
        </div>
      </div>

      {/* Interactive Inspector Strip on Hover / Tap */}
      <div className="min-h-[28px] flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 text-[11px] relative z-10">
        {activePoint ? (
          <>
            <span className="font-bold text-white truncate">
              {activePoint.scrimName}{' '}
              <span className="text-zinc-500 font-mono text-[10px]">(#{activePoint.ranking})</span>
            </span>
            <div className="flex items-center gap-2.5 font-mono font-bold shrink-0">
              <span className="text-[#D7FF00]">{activePoint.kills} K</span>
              <span className="text-teal-300">{activePoint.pp} PP</span>
              <span className="text-white">{activePoint.points} PTS</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-zinc-400 truncate">
              {items.length === 1
                ? `${items[0].scrimName} — ${items[0].kills} Kills • ${items[0].pp} PP`
                : 'Sentuh atau hover titik scrim untuk lihat butiran'}
            </span>
            {bestScrim && (
              <span className="font-mono text-[10px] text-zinc-400 shrink-0">
                Max: <strong className="text-[#D7FF00]">{peakKills}K</strong> •{' '}
                <strong className="text-teal-300">{peakPp}PP</strong>
              </span>
            )}
          </>
        )}
      </div>

      {/* LEVEL 3: Smooth Merged 2-Line Area Chart */}
      <div className="relative z-10 select-none">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label="Smooth chart comparing Kills and Placement Points by scrim"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="scrimKillsArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D7FF00" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#D7FF00" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="scrimPpArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowLime" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#D7FF00" floodOpacity="0.45" />
            </filter>
            <filter id="glowTeal" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#2DD4BF" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Horizontal Gridlines + Y-Axis Scale Ticks */}
          {[0, 0.5, 1].map((ratio) => {
            const val = Math.round(yMax * ratio);
            const gy = plotBottom - ratio * plotH;
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={gy}
                  x2={svgW - padRight}
                  y2={gy}
                  stroke={ratio === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}
                  strokeDasharray={ratio === 0 ? undefined : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={svgW - padRight + 6}
                  y={gy + 3.5}
                  fill="#71717a"
                  fontSize="9.5"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Single-Scrim Smooth Guide Ribbons */}
          {items.length === 1 && coords.killsPts[0] && coords.ppPts[0] && (
            <g>
              <line
                x1={padLeft}
                y1={coords.killsPts[0].y}
                x2={svgW - padRight}
                y2={coords.killsPts[0].y}
                stroke="#D7FF00"
                strokeOpacity="0.35"
                strokeDasharray="5 5"
                strokeWidth="2"
              />
              <line
                x1={padLeft}
                y1={coords.ppPts[0].y}
                x2={svgW - padRight}
                y2={coords.ppPts[0].y}
                stroke="#2DD4BF"
                strokeOpacity="0.35"
                strokeDasharray="5 5"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Smooth Gradient Area Fills (PP first, Kills on top) */}
          {items.length >= 2 && (
            <>
              <path
                d={buildSvgAreaPath(coords.ppPts, ppSegs, plotBottom)}
                fill="url(#scrimPpArea)"
              />
              <path
                d={buildSvgAreaPath(coords.killsPts, killsSegs, plotBottom)}
                fill="url(#scrimKillsArea)"
              />
            </>
          )}

          {/* Active Hovered Vertical Crosshair */}
          {hoveredIdx !== null && coords.killsPts[hoveredIdx] && (
            <line
              x1={coords.killsPts[hoveredIdx].x}
              y1={padTop}
              x2={coords.killsPts[hoveredIdx].x}
              y2={plotBottom}
              stroke="rgba(255,255,255,0.22)"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
          )}

          {/* Smooth Bezier Curves */}
          {items.length >= 2 && (
            <>
              <path
                d={buildSvgLinePath(coords.ppPts, ppSegs)}
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="2.6"
                strokeLinecap="round"
                filter="url(#glowTeal)"
              />
              <path
                d={buildSvgLinePath(coords.killsPts, killsSegs)}
                fill="none"
                stroke="#D7FF00"
                strokeWidth="2.8"
                strokeLinecap="round"
                filter="url(#glowLime)"
              />
            </>
          )}

          {/* Data Nodes, Peak Badges & Interactive Hit Targets */}
          {items.map((d, i) => {
            const kPt = coords.killsPts[i];
            const pPt = coords.ppPts[i];
            const isHovered = hoveredIdx === i;
            const isPeakK = i === peakKillsIdx && items.length > 0;
            const isPeakP = i === peakPpIdx && items.length > 0;
            const showAxisLabel =
              i === 0 || i === items.length - 1 || i % axisStep === 0;

            return (
              <g
                key={`${d.scrimName}_${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onClick={() => setHoveredIdx(isHovered ? null : i)}
              >
                {/* Invisible wide column hit zone for effortless mobile tap/hover */}
                <rect
                  x={kPt.x - Math.max(16, plotW / Math.max(items.length * 2, 2))}
                  y={padTop - 8}
                  width={Math.max(32, plotW / Math.max(items.length, 1))}
                  height={plotH + 34}
                  fill="transparent"
                />

                {/* PP Node */}
                <circle
                  cx={pPt.x}
                  cy={pPt.y}
                  r={isHovered || isPeakP ? 5.5 : 4}
                  fill="#09090b"
                  stroke="#2DD4BF"
                  strokeWidth={isHovered || isPeakP ? 2.5 : 2}
                />

                {/* Kills Node */}
                <circle
                  cx={kPt.x}
                  cy={kPt.y}
                  r={isHovered || isPeakK ? 6 : 4.2}
                  fill="#09090b"
                  stroke="#D7FF00"
                  strokeWidth={isHovered || isPeakK ? 2.6 : 2}
                />

                {/* Peak / Selected Numeric Value Callout */}
                {(isPeakK || isHovered) && (
                  <text
                    x={kPt.x}
                    y={Math.max(12, kPt.y - 10)}
                    textAnchor="middle"
                    fill="#D7FF00"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {d.kills}K
                  </text>
                )}
                {(isPeakP || isHovered) && (
                  <text
                    x={pPt.x}
                    y={
                      Math.abs(kPt.y - pPt.y) < 16 && pPt.y >= kPt.y
                        ? Math.min(plotBottom - 4, pPt.y + 15)
                        : Math.max(12, pPt.y - 10)
                    }
                    textAnchor="middle"
                    fill="#2DD4BF"
                    fontSize="10"
                    fontWeight="800"
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                  >
                    {d.pp}PP
                  </text>
                )}

                {/* X-Axis Scrim Label & Short Date */}
                {showAxisLabel && (
                  <g>
                    <text
                      x={kPt.x}
                      y={plotBottom + 15}
                      textAnchor="middle"
                      fill={isHovered ? '#ffffff' : '#a1a1aa'}
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                    >
                      {d.shortLabel}
                    </text>
                    {d.shortDate && (
                      <text
                        x={kPt.x}
                        y={plotBottom + 27}
                        textAnchor="middle"
                        fill="#52525b"
                        fontSize="8"
                        fontFamily="ui-monospace, SFMono-Regular, monospace"
                      >
                        {d.shortDate}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* LEVEL 4: Chronological Footnote */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1.5 relative z-10">
        <span>Kronologi: Lama → Terkini</span>
        <span>{items.length} Sesi Dianalisis</span>
      </div>
    </div>
  );
}
