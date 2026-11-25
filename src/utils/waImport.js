import { sanitizeTextInput } from './security.js';

const KEYCAP_MAP = {
  '0️⃣': '0.', '1️⃣': '1.', '2️⃣': '2.', '3️⃣': '3.', '4️⃣': '4.',
  '5️⃣': '5.', '6️⃣': '6.', '7️⃣': '7.', '8️⃣': '8.', '9️⃣': '9.', '🔟': '10.'
};

const PLACEHOLDER_RE = /^(?:open|empty|kosong|available|avail|tba|tbd|free|slot\s*kosong|reserved|booked|none|n\/a|observer|obs|caster|-+|\.+)$/i;
const META_HEADER_RE = /^(?:tarikh|date|masa|waktu|time|map|maps|host|organizer|penganjur|room|room\s*id|id|pass|password|pw|link|fee|yuran|prize|hadiah|format|mode|tier|server|lobby|start|pukul|jam|rules|peraturan|group|kumpulan|match|round|day|week|list\s*team|team\s*list|list)\s*(?:[:=-]|$)/i;
const STANDALONE_HEADER_RE = /^(?:slot\s*(?:list|scrim|tour|tournament|open|kosong).*|slot|senarai\s*(?:pasukan|team|slot).*|daftar\s*(?:pasukan|team).*|list\s*(?:team|pasukan|slot).*|pubg\s*mobile.*|scrim\s*(?:list|schedule|malam|petang|pagi|hub)?.*|jadual\s*.*|maps?\s+[a-z]{2,8}|(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,\s*\d{1,2}\s+[a-z]+.*|group\s*[a-z0-9]?|match\s*\d*)$/i;

/**
 * Parses a pasted WhatsApp/Telegram PUBG room list while preserving explicit slot numbers (1..25).
 * When explicit numbered slots exist (e.g., slots 6..25 with 1..5 empty for observers),
 * non-numbered header lines (scrim title, date, maps, "List Team:") are automatically ignored.
 */
export function parseWhatsAppTeamImport(rawText) {
  const lines = String(rawText || '').split(/\r?\n/);
  const numberedSlots = new Map();
  const unnumbered = [];
  let sawExplicitSlotLine = false;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

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

    // Match explicit room slot number: "6\tYANGON", "Slot 4: Vampire", "03) Squad", "#7 Team", "S8 - BTR"
    const numberedMatch = line.match(
      /^(?:(?:slot|sl|s|no|team|squad)\s*#?(\d{1,2})|#?(\d{1,2}))\s*(?:[:.)\-–—|>]|\s+)\s*(.*)$/i
    );

    if (numberedMatch) {
      const parsedNum = Number(numberedMatch[1] || numberedMatch[2]);
      if (parsedNum >= 1 && parsedNum <= 25) {
        sawExplicitSlotLine = true;
        let teamPart = (numberedMatch[3] || '').trim();
        teamPart = teamPart.replace(/\s*[-–—(|]?\s*(?:\+?6?0\d{8,11}|\+\d{9,15})\s*\)?$/, '').trim();
        teamPart = sanitizeTextInput(teamPart, 60);
        if (!teamPart || PLACEHOLDER_RE.test(teamPart)) {
          numberedSlots.delete(parsedNum);
        } else if (teamPart.length >= 2 || /^[A-Za-z0-9]$/.test(teamPart)) {
          numberedSlots.set(parsedNum, teamPart);
        }
        continue;
      }
    }

    if (META_HEADER_RE.test(line) || STANDALONE_HEADER_RE.test(line)) {
      continue;
    }

    let plain = line.replace(/^[-*•–—]\s*/, '').trim();
    plain = plain.replace(/\s*[-–—(|]?\s*(?:\+?6?0\d{8,11}|\+\d{9,15})\s*\)?$/, '').trim();
    plain = sanitizeTextInput(plain, 60);
    if (!plain || PLACEHOLDER_RE.test(plain)) continue;
    if (plain.length >= 2 || /^[A-Za-z0-9]$/.test(plain)) {
      unnumbered.push(plain);
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
      teamCount: numberedSlots.size,
      minSlot,
      maxSlot
    };
  }

  // Fallback: unnumbered team list maps sequentially to slots 1..N (max 25)
  const seqMap = new Map();
  const sliced = unnumbered.slice(0, 25);
  sliced.forEach((name, idx) => {
    seqMap.set(idx + 1, name);
  });

  return {
    mode: 'SEQUENTIAL',
    slotMap: seqMap,
    teamCount: sliced.length,
    minSlot: sliced.length > 0 ? 1 : 0,
    maxSlot: sliced.length
  };
}
