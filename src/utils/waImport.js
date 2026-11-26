import { sanitizeTextInput } from './security.js';

const KEYCAP_MAP = {
  '0️⃣': '0.', '1️⃣': '1.', '2️⃣': '2.', '3️⃣': '3.', '4️⃣': '4.',
  '5️⃣': '5.', '6️⃣': '6.', '7️⃣': '7.', '8️⃣': '8.', '9️⃣': '9.', '🔟': '10.'
};

const PLACEHOLDER_RE = /^(?:open|empty|kosong|available|avail|tba|tbd|free|slot\s*kosong|reserved|booked|none|n\/a|observer|obs|caster|-+|\.+)$/i;
const META_HEADER_RE = /^(?:tarikh|date|masa|waktu|time|map|maps|host|organizer|penganjur|room|room\s*id|id|pass|password|pw|link|fee|yuran|prize|hadiah|format|mode|tier|server|lobby|start|pukul|jam|rules|peraturan|group|kumpulan|match|round|day|week|list\s*team|team\s*list|list)\s*(?:[:=-]|$)/i;
const STANDALONE_HEADER_RE = /^(?:slot\s*(?:list|scrim|tour|tournament|open|kosong).*|slot|senarai\s*(?:pasukan|team|slot).*|daftar\s*(?:pasukan|team).*|list\s*(?:team|pasukan|slot).*|pubg\s*mobile.*|scrim\s*(?:list|schedule|malam|petang|pagi|hub)?.*|jadual\s*.*|maps?\s+[a-z]{2,8}|(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,\s*\d{1,2}\s+[a-z]+.*|group\s*[a-z0-9]?|match\s*\d*)$/i;
const ROSTER_LINE_RE = /^(?:ign|roster|players?|line\s*up|lineup|anggota|ahli)\s*[:=\-–—>]\s*(.+)$/i;

/**
 * Splits optional trailing roster/IGN list from a team line, e.g.:
 * - "NEKO REAPERS (Kira, Sora, LynX, Vex)"
 * - "NEKO REAPERS | IGN: Kira / Sora / LynX / Vex"
 * - "NEKO REAPERS - IGN: Kira, Sora"
 */
function extractTeamAndRoster(rawPart) {
  let teamPart = String(rawPart || '').trim();
  let rosterPart = '';

  // Strip trailing phone numbers first
  teamPart = teamPart.replace(/\s*[-–—(|]?\s*(?:\+?6?0\d{8,11}|\+\d{9,15})\s*\)?$/, '').trim();

  // Check explicit delimiter + IGN/Roster keyword: "Team - IGN: a, b, c" or "Team | a, b, c"
  const labeledMatch = teamPart.match(/^(.*?)\s*(?:\||[-–—])\s*(?:ign|roster|players?|line\s*up|lineup)\s*[:=]?\s*(.+)$/i);
  if (labeledMatch && labeledMatch[1].trim()) {
    teamPart = labeledMatch[1].trim();
    rosterPart = labeledMatch[2].trim();
  } else {
    const pipeMultiMatch = teamPart.match(/^(.*?)\s*\|\s*([^|]+[,/][^|]+)$/);
    if (pipeMultiMatch && pipeMultiMatch[1].trim()) {
      teamPart = pipeMultiMatch[1].trim();
      rosterPart = pipeMultiMatch[2].trim();
    } else {
      // Check trailing bracketed list: "Team (Kira, Sora, LynX, Vex)" or "Team [IGN: a, b]"
      const parenMatch = teamPart.match(/^(.*?)\s*(?:\(([^()]{3,160})\)|\[([^\[\]]{3,160})\])$/);
      if (parenMatch && parenMatch[1].trim()) {
        const inner = (parenMatch[2] || parenMatch[3] || '').trim();
        const hasIgnPrefix = /^(?:ign|roster|players?|lineup)\s*[:=]/i.test(inner);
        const hasMultiNames = /[,/&]/.test(inner);
        if (hasIgnPrefix || hasMultiNames) {
          teamPart = parenMatch[1].trim();
          rosterPart = inner.replace(/^(?:ign|roster|players?|lineup)\s*[:=]\s*/i, '').trim();
        }
      }
    }
  }

  return {
    teamName: sanitizeTextInput(teamPart, 60),
    players: sanitizeTextInput(rosterPart, 160)
  };
}

/**
 * Parses a pasted WhatsApp/Telegram PUBG room list while preserving explicit slot numbers (1..25)
 * and optional player IGN rosters per team.
 */
export function parseWhatsAppTeamImport(rawText) {
  const lines = String(rawText || '').split(/\r?\n/);
  const numberedSlots = new Map();
  const numberedRosters = new Map();
  const unnumbered = [];
  let sawExplicitSlotLine = false;
  let lastSlotNo = null;
  let lastUnnumberedIdx = -1;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      lastSlotNo = null;
      lastUnnumberedIdx = -1;
      continue;
    }

    // Normalize WhatsApp markdown & keycap emojis
    line = line.replace(/[*_~`]/g, '').trim();
    for (const [emoji, num] of Object.entries(KEYCAP_MAP)) {
      if (line.includes(emoji)) {
        line = line.split(emoji).join(num);
      }
    }

    // Strip leading decorative bullets/emojis (keep trailing country flags intact)
    line = line
      .replace(/\uFE0F/g, '')
      .replace(/^[\u2022\u2023\u25AA\u25AB\u25B8\u25BA\u27A4\u2705\u2611\p{Extended_Pictographic}\s]+/u, '')
      .trim();

    if (!line || /^[-=_|+/.\\\s]+$/.test(line) || /^https?:\/\//i.test(line)) continue;

    // Strip trailing Telegram/WhatsApp message timestamp (e.g. "7:58 pm" / "20:00")
    line = line.replace(/\s+\d{1,2}:\d{2}\s*(?:am|pm)?$/i, '').trim();
    if (!line) continue;

    // Ignore clock/timezone lines like "— 8:00 PM (UTC+8)"
    if (/^[—–-]?\s*\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*\(UTC[^)]*\))?$/i.test(line)) continue;

    // Multi-line roster directly under the previous team line (e.g. "IGN: Kira, Sora, LynX, Vex")
    const rosterLineMatch = line.match(ROSTER_LINE_RE);
    if (rosterLineMatch) {
      const cleanPlayers = sanitizeTextInput(rosterLineMatch[1], 160);
      if (cleanPlayers) {
        if (lastSlotNo !== null) {
          const prev = numberedRosters.get(lastSlotNo);
          numberedRosters.set(lastSlotNo, prev ? `${prev}, ${cleanPlayers}` : cleanPlayers);
        } else if (lastUnnumberedIdx >= 0 && unnumbered[lastUnnumberedIdx]) {
          const prev = unnumbered[lastUnnumberedIdx].players;
          unnumbered[lastUnnumberedIdx].players = prev ? `${prev}, ${cleanPlayers}` : cleanPlayers;
        }
      }
      continue;
    }

    // Match explicit room slot number: "6\tYANGON", "Slot 4: Vampire", "03) Squad", "#7 Team", "S8 - BTR"
    const numberedMatch = line.match(
      /^(?:(?:slot|sl|s|no|team|squad)\s*#?(\d{1,2})|#?(\d{1,2}))\s*(?:[:.)\-–—|>]|\s+)\s*(.*)$/i
    );

    if (numberedMatch) {
      const parsedNum = Number(numberedMatch[1] || numberedMatch[2]);
      if (parsedNum >= 1 && parsedNum <= 25) {
        sawExplicitSlotLine = true;
        const { teamName, players } = extractTeamAndRoster(numberedMatch[3] || '');
        if (!teamName || PLACEHOLDER_RE.test(teamName)) {
          numberedSlots.delete(parsedNum);
          numberedRosters.delete(parsedNum);
          lastSlotNo = null;
        } else if (teamName.length >= 2 || /^[A-Za-z0-9]$/.test(teamName)) {
          numberedSlots.set(parsedNum, teamName);
          if (players) {
            numberedRosters.set(parsedNum, players);
          } else {
            numberedRosters.delete(parsedNum);
          }
          lastSlotNo = parsedNum;
          lastUnnumberedIdx = -1;
        }
        continue;
      }
    }

    if (META_HEADER_RE.test(line) || STANDALONE_HEADER_RE.test(line)) {
      lastSlotNo = null;
      lastUnnumberedIdx = -1;
      continue;
    }

    const plainRaw = line.replace(/^[-*•–—]\s*/, '').trim();
    const { teamName, players } = extractTeamAndRoster(plainRaw);
    if (!teamName || PLACEHOLDER_RE.test(teamName)) {
      lastSlotNo = null;
      lastUnnumberedIdx = -1;
      continue;
    }
    if (teamName.length >= 2 || /^[A-Za-z0-9]$/.test(teamName)) {
      unnumbered.push({ teamName, players });
      lastUnnumberedIdx = unnumbered.length - 1;
      lastSlotNo = null;
    }
  }

  // If the pasted message used numbered room slots (e.g. #6..#25), preserve exact slot numbers
  // and ignore unnumbered header lines above the list.
  if (sawExplicitSlotLine && numberedSlots.size >= 2) {
    const maxSlot = Math.min(25, Math.max(...numberedSlots.keys()));
    const minSlot = Math.min(...numberedSlots.keys());
    return {
      mode: 'EXPLICIT_SLOTS',
      slotMap: numberedSlots,
      rosterMap: numberedRosters,
      teamCount: numberedSlots.size,
      minSlot,
      maxSlot
    };
  }

  // Fallback: unnumbered team list maps sequentially to slots 1..N (max 25)
  const seqMap = new Map();
  const seqRosterMap = new Map();
  const sliced = unnumbered.slice(0, 25);
  sliced.forEach((entry, idx) => {
    seqMap.set(idx + 1, entry.teamName);
    if (entry.players) {
      seqRosterMap.set(idx + 1, entry.players);
    }
  });

  return {
    mode: 'SEQUENTIAL',
    slotMap: seqMap,
    rosterMap: seqRosterMap,
    teamCount: sliced.length,
    minSlot: sliced.length > 0 ? 1 : 0,
    maxSlot: sliced.length
  };
}
