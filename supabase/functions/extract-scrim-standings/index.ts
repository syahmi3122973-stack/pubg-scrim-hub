// @ts-nocheck
/* eslint-disable */
// supabase/functions/extract-scrim-standings/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};
declare const EdgeRuntime: {
  waitUntil?: (promise: Promise<unknown>) => void;
} | undefined;

const ALLOWED_EXACT_ORIGINS = new Set([
  "https://scrim.rykhor.my",
  "https://www.scrim.rykhor.my",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Non-browser clients without Origin header
  if (ALLOWED_EXACT_ORIGINS.has(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+-syahmi3122973-stack[a-z0-9-]*\.vercel\.app$/i.test(origin)) return true;
  if (/^https:\/\/pubg-[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : "https://scrim.rykhor.my";
  const reqHeaders = req.headers.get("access-control-request-headers");
  const allowHeaders =
    reqHeaders && /^[a-z0-9_,\s-]+$/i.test(reqHeaders)
      ? reqHeaders
      : "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-region";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers",
  };
}

interface RateBucket {
  minuteStart: number;
  minuteCount: number;
  hourStart: number;
  hourCount: number;
}

const rateBuckets = new Map<string, RateBucket>();
const MAX_RATE_BUCKETS = 1000;
const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_BASE64_CHARS = 5_000_000; // ~3.7MB image payload ceiling

function hasAuthenticatedBearer(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return false;
  const token = auth.slice(7).trim();
  // Publishable / anon keys are either sb_publishable_* or JWT with role=anon
  if (!token || token.startsWith("sb_publishable_")) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.role === "authenticated" && typeof payload?.sub === "string";
  } catch {
    return false;
  }
}

function checkRateLimit(req: Request): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const isAuthed = hasAuthenticatedBearer(req);
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const key = `${isAuthed ? "auth" : "anon"}:${ip}`;
  const minLimit = isAuthed ? 12 : 5;
  const hourLimit = isAuthed ? 60 : 20;

  if (rateBuckets.size >= MAX_RATE_BUCKETS) {
    for (const [k, b] of rateBuckets) {
      if (now - b.hourStart > 3_600_000) rateBuckets.delete(k);
    }
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      rateBuckets.clear();
    }
  }

  let bucket = rateBuckets.get(key);
  if (!bucket) {
    bucket = { minuteStart: now, minuteCount: 0, hourStart: now, hourCount: 0 };
    rateBuckets.set(key, bucket);
  }
  if (now - bucket.minuteStart >= 60_000) {
    bucket.minuteStart = now;
    bucket.minuteCount = 0;
  }
  if (now - bucket.hourStart >= 3_600_000) {
    bucket.hourStart = now;
    bucket.hourCount = 0;
  }

  if (bucket.minuteCount >= minLimit) {
    const retryAfterSec = Math.max(1, Math.ceil((60_000 - (now - bucket.minuteStart)) / 1000));
    return { allowed: false, retryAfterSec };
  }
  if (bucket.hourCount >= hourLimit) {
    const retryAfterSec = Math.max(5, Math.ceil((3_600_000 - (now - bucket.hourStart)) / 1000));
    return { allowed: false, retryAfterSec };
  }

  bucket.minuteCount += 1;
  bucket.hourCount += 1;
  return { allowed: true, retryAfterSec: 0 };
}

interface ExtractionRequest {
  imageBase64: string;
  mimeType: string;
  uploaderName?: string;
  fileName?: string;
}

function formatMytFolderTimestamp(date = new Date()): string {
  // Malaysia Time is fixed UTC+8 with no DST
  const myt = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${myt.getUTCFullYear()}-${pad(myt.getUTCMonth() + 1)}-${pad(myt.getUTCDate())} ${pad(myt.getUTCHours())}-${pad(myt.getUTCMinutes())}-${pad(myt.getUTCSeconds())} MYT`;
}

function sanitizeDriveLabel(raw: unknown, fallback: string): string {
  const cleaned = String(raw || "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}

function extractJwtEmail(req: Request): string {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  const token = auth.slice(7).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return "";
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.email === "string" ? payload.email : "";
  } catch {
    return "";
  }
}

interface DriveArchiveResult {
  ok: boolean;
  fileId?: string;
  downloadUrl?: string;
  status: string;
}

async function archivePosterToGoogleDrive(params: {
  imageBase64: string;
  mimeType: string;
  uploaderName: string;
  fileName: string;
}): Promise<DriveArchiveResult> {
  const webhookUrl = Deno.env.get("GDRIVE_WEBHOOK_URL")?.trim();
  const webhookSecret = Deno.env.get("GDRIVE_WEBHOOK_SECRET")?.trim();
  if (!webhookUrl || !webhookSecret || !/^https:\/\//i.test(webhookUrl)) {
    return { ok: false, status: "unconfigured" };
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: webhookSecret,
        imageBase64: params.imageBase64,
        mimeType: params.mimeType,
        uploaderName: params.uploaderName,
        uploadedAtMyt: formatMytFolderTimestamp(),
        fileName: params.fileName,
      }),
    });
    if (!res.ok) return { ok: false, status: `http_${res.status}` };
    const json = await res.json().catch(() => null);
    if (!json) return { ok: false, status: "invalid_json" };
    if (!json.ok) return { ok: false, status: `webhook_err_${String(json.error || "failed").slice(0, 40)}` };
    const fileId = typeof json.fileId === "string" ? json.fileId.trim() : "";
    const downloadUrl =
      typeof json.downloadUrl === "string" && /^https:\/\//i.test(json.downloadUrl)
        ? json.downloadUrl.trim()
        : fileId
          ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`
          : "";
    return downloadUrl
      ? { ok: true, fileId, downloadUrl, status: "ok" }
      : { ok: false, status: "missing_file_id" };
  } catch (err) {
    // Archiving must never block or break OCR extraction
    return { ok: false, status: `exception_${String((err as Error)?.name || "err")}` };
  }
}

interface RawStandingItem {
  rank: number;
  team_name: string;
  wwcd: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
}

interface ExtractionResponse {
  scrim_name: string;
  scrim_date: string;
  standings: RawStandingItem[];
}

interface ValidatedStandingItem extends RawStandingItem {
  has_math_mismatch: boolean;
  ocr_reported_total?: number;
}

// Helper: Flexible date parser supporting textual dates (e.g. "Thursday, 5 November 2026" -> "2026-11-05")
function parseFlexibleDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const cleaned = String(dateStr).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const monthMap: Record<string, string> = {
    january: "01", jan: "01", januari: "01",
    february: "02", feb: "02", februari: "02",
    march: "03", mar: "03", mac: "03",
    april: "04", apr: "04",
    may: "05", mei: "05",
    june: "06", jun: "06",
    july: "07", jul: "07", julai: "07",
    august: "08", aug: "08", ogos: "08",
    september: "09", sep: "09", sept: "09",
    october: "10", oct: "10", oktober: "10",
    november: "11", nov: "11",
    december: "12", dec: "12", disember: "12",
  };

  const dmyMatch = cleaned.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = monthMap[dmyMatch[2].toLowerCase()] || "11";
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const mdyMatch = cleaned.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const month = monthMap[mdyMatch[1].toLowerCase()] || "11";
    const day = mdyMatch[2].padStart(2, "0");
    const year = mdyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const slashMatch = cleaned.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsedTs = Date.parse(cleaned);
  if (!isNaN(parsedTs)) {
    return new Date(parsedTs).toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

const extractionSchema = {
  type: "OBJECT",
  properties: {
    scrim_name: {
      type: "STRING",
      description:
        "Main tournament or scrim title plus season/stage badge if shown (e.g. 'MEC SCRIMS', 'SSS SEASON 10 - SEMI FINALS', 'CT SCRIMS').",
    },
    scrim_date: {
      type: "STRING",
      description:
        "Date of match converted to YYYY-MM-DD if printed on the poster (e.g. 'Monday, 9 November 2026' -> '2026-11-09'). Return empty string '' if no date appears anywhere on the poster.",
    },
    standings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          rank: { type: "INTEGER", description: "Rank number (#, RANK, or NO column, e.g. 1..18)" },
          team_name: {
            type: "STRING",
            description:
              "Full team name from TEAMS / TEAM / TEAM NAME column (ignore circular/square team logo next to it; keep exact spelling and spacing; do not include WWCD star/bunny icons from the adjacent column).",
          },
          wwcd: {
            type: "INTEGER",
            description:
              "Win/WWCD count (column labeled 'WWCD', 'WIN', 'CHICKEN', or an icon/mascot header like bunny 🐰, star ⭐, ribbon 🎀, chicken 🍗, crown 👑, trophy 🏆, helmet, pan, spider). Cells may show a digit (0, 1, 2) OR ANY visual sticker/emoji/badge (including ribbons/bows 🎀, stars ⭐, bunnies 🐰, hearts 💖, flowers 🌸, crowns 👑, trophies 🏆, chickens 🍗, skulls, checkmarks) — even subtle stickers over dark maroon or colored row backgrounds! COUNT how many stickers/icons appear inside that row's WWCD cell (1 icon = 1, 2 icons = 2, etc.). Do NOT count country flags inside team_name (🇲🇲, 🇹🇼). Output 0 ONLY if the cell has nothing inside it.",
          },
          placement_points: {
            type: "INTEGER",
            description: "Placement points (labeled 'PLACE.', 'PLACE', 'PP', or 'PLACEMENT').",
          },
          kill_points: {
            type: "INTEGER",
            description: "Kill / Elimination points (labeled 'ELIMS.', 'ELIMS', 'KP', or 'KILLS').",
          },
          total_points: {
            type: "INTEGER",
            description: "TOTAL points (labeled 'TOTAL', 'TOT', or 'PTS').",
          },
        },
        required: [
          "rank",
          "team_name",
          "wwcd",
          "placement_points",
          "kill_points",
          "total_points",
        ],
      },
    },
  },
  required: ["scrim_name", "scrim_date", "standings"],
};

interface ModelCandidate {
  name: string;
  thinkingConfig?: { thinkingLevel?: "MINIMAL" | "LOW"; thinkingBudget?: number };
}

const WAVE_1_CANDIDATES: ModelCandidate[] = [
  { name: "gemini-3.5-flash-lite", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-3.8-flash" },
];

const WAVE_2_CANDIDATES: ModelCandidate[] = [
  { name: "gemini-3.5-flash-lite", thinkingConfig: { thinkingLevel: "LOW" } },
  { name: "gemma-4-31b-it" },
  { name: "gemma-3-27b-it" },
  { name: "gemini-3.6-flash", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-3-flash-preview", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-flash-latest" },
];

// In-memory 45s cooldown per congested/throttled model so back-to-back scans avoid dead models
const modelCooldownUntil = new Map<string, number>();

interface OpenAiCompatProvider {
  name: string;
  endpoint: string;
  apiKey: string;
  models: string[];
  extraHeaders?: Record<string, string>;
}

function getConfiguredBackupProviders(): OpenAiCompatProvider[] {
  const providers: OpenAiCompatProvider[] = [];

  // 1. Groq Vision (Free tier, ~2.8s inference via Qwen 3.8 Vision)
  const groqKey = Deno.env.get("GROQ_API_KEY")?.trim();
  if (groqKey) {
    providers.push({
      name: "groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      models: [
        "qwen/qwen3.8-27b",
      ],
    });
  }

  // 2. OpenRouter Free Vision (only non-reasoning / reliable vision models; nemotron reasoning burns 45s)
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
  if (openRouterKey) {
    providers.push({
      name: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterKey,
      models: [
        "google/gemma-4-31b-it:free",
        "particle-ai/particle-1:free",
        "google/gemma-4-26b-a4b-it:free",
        "inclusionai/ling-3.2-flash:free",
      ],
      extraHeaders: {
        "HTTP-Referer": "https://scrim.rykhor.my",
        "X-Title": "ScrimHub OCR",
      },
    });
  }

  // 3. Mistral Pixtral (Free experiment tier)
  const mistralKey = Deno.env.get("MISTRAL_API_KEY")?.trim();
  if (mistralKey) {
    providers.push({
      name: "mistral",
      endpoint: "https://api.mistral.ai/v1/chat/completions",
      apiKey: mistralKey,
      models: ["pixtral-12b-2409", "mistral-small-latest"],
    });
  }

  // 4. Optional Self-Hosted FreeLLMAPI / OpenAI-Compatible Gateway
  const customUrl = Deno.env.get("FREELLM_API_URL")?.trim();
  const customKey = Deno.env.get("FREELLM_API_KEY")?.trim();
  if (customUrl && /^https:\/\//i.test(customUrl)) {
    const normalizedEndpoint = customUrl.endsWith("/chat/completions")
      ? customUrl
      : `${customUrl.replace(/\/+$/, "")}/chat/completions`;
    providers.push({
      name: "freellmapi",
      endpoint: normalizedEndpoint,
      apiKey: customKey || "freellmapi",
      models: [Deno.env.get("FREELLM_MODEL")?.trim() || "auto"],
    });
  }

  return providers;
}

function normalizeCompactExtraction(obj: any): ExtractionResponse | null {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj.standings)) return obj as ExtractionResponse;
  if (Array.isArray(obj.r)) {
    const standings: RawStandingItem[] = obj.r
      .filter((row: unknown) => Array.isArray(row) && row.length >= 6)
      .map((row: unknown[], idx: number) => ({
        rank: Number(row[0]) || idx + 1,
        team_name: String(row[1] ?? "").trim(),
        wwcd: Number(row[2]) || 0,
        placement_points: Number(row[3]) || 0,
        kill_points: Number(row[4]) || 0,
        total_points: Number(row[5]) || 0,
      }));
    return {
      scrim_name: String(obj.n || obj.scrim_name || "").trim(),
      scrim_date: String(obj.d || obj.scrim_date || "").trim(),
      standings,
    };
  }
  return null;
}

function extractJsonObject(raw: string): ExtractionResponse | null {
  const cleaned = String(raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return normalizeCompactExtraction(JSON.parse(cleaned));
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return normalizeCompactExtraction(JSON.parse(cleaned.slice(start, end + 1)));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function countWwcdIcons(tok: string, allowAsterisk = false): number {
  const cleaned = String(tok || "")
    .replace(/[\uFE0E\uFE0F\u200D\s]/g, "")
    .trim();
  if (!cleaned) return 0;
  const iconPattern = allowAsterisk
    ? /^[⭐🌟★☆✦✧✪✫✬✭✮✯🐰🐇🎀🎗️🌸🌺🌷🌼🦋💖💗❤️🩷💜💙👑🏆🥇🍗🍳🔥⚡🎯🛡️⚔️💀✓✔*]+$/u
    : /^[⭐🌟★☆✦✧✪✫✬✭✮✯🐰🐇🎀🎗️🌸🌺🌷🌼🦋💖💗❤️🩷💜💙👑🏆🥇🍗🍳🔥⚡🎯🛡️⚔️💀✓✔]+$/u;
  if (!iconPattern.test(cleaned)) return 0;
  return Array.from(cleaned).length;
}

function cleanOcrNum(tok: string): number | null {
  const s = String(tok || "")
    .trim()
    .replace(/[,.;:]+$/g, "")
    .replace(/[OoQqDd]/g, "0")
    .replace(/[Il|!]/g, "1")
    .replace(/[Zz]/g, "2")
    .replace(/[З]/g, "3")
    .replace(/[Ss]/g, "5")
    .replace(/[Gb]/g, "6")
    .replace(/[B]/g, "8");
  return /^\d{1,3}$/.test(s) ? Number(s) : null;
}

function mergeOcrStandings(
  primary: ExtractionResponse | null,
  secondary: ExtractionResponse | null
): ExtractionResponse | null {
  if (!primary) return secondary;
  if (!secondary) return primary;

  const byRank = new Map<number, StandingRow>();
  const addRows = (rows: StandingRow[] = []) => {
    for (const r of rows) {
      const rk = Number(r.rank) || 0;
      if (rk < 1 || rk > 25) continue;
      const existing = byRank.get(rk);
      const rMathOk = r.placement_points + r.kill_points === r.total_points;
      if (!existing) {
        byRank.set(rk, r);
      } else {
        const exMathOk = existing.placement_points + existing.kill_points === existing.total_points;
        if ((!exMathOk && rMathOk) || (exMathOk === rMathOk && r.wwcd > existing.wwcd)) {
          byRank.set(rk, r);
        }
      }
    }
  };
  addRows(primary.standings);
  addRows(secondary.standings);

  const merged = Array.from(byRank.values()).sort((a, b) => a.rank - b.rank);
  if (merged.length === 0) return null;
  const pickName =
    primary.scrim_name && primary.scrim_name !== "Untitled Scrim"
      ? primary.scrim_name
      : secondary.scrim_name || "Untitled Scrim";
  const pickDate = primary.scrim_date || secondary.scrim_date || "";
  return { scrim_name: pickName, scrim_date: pickDate, standings: merged };
}

function parseStandingsFromOcrText(rawText: string): ExtractionResponse | null {
  const rawLines = String(rawText || "")
    .replace(/#З/g, "#3")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (rawLines.length === 0) return null;

  let scrimName = "Untitled Scrim";
  let scrimDate = "";
  const segments: string[] = [];
  for (const line of rawLines) {
    // Split dual-column lines where a second rank token (#10..#25) appears after a tab
    const parts = line.split(/\t+(?=#\d{1,2}\b)/);
    for (const p of parts) {
      const t = p.trim();
      if (t) segments.push(t);
    }
  }

  const rows: StandingRow[] = [];
  for (const seg of segments) {
    if (
      !scrimDate &&
      /\b(?:jan|feb|mar|mac|apr|may|mei|jun|jul|aug|ogos|sep|oct|okt|nov|dec|dis)[a-z]*[\s,]+\d{4}\b/i.test(seg)
    ) {
      scrimDate = seg.replace(/\t+/g, " ").trim();
      continue;
    }
    if (
      rows.length === 0 &&
      scrimName === "Untitled Scrim" &&
      !/^(?:#?\d+|rank|team|wwcd|place|elims?|kills?|total|powered\s+by|since\s+\d|overall)/i.test(seg) &&
      seg.length >= 3 &&
      seg.length <= 80
    ) {
      scrimName = seg.replace(/\t+/g, " ").trim();
      continue;
    }
    if (/^(?:rank|team|wwcd|place|elims?|kills?|total|#\s+team|krafton|powered\s+by)/i.test(seg)) {
      continue;
    }

    let rank = 0;
    let teamName = "";
    let iconWwcd = 0;
    const nums: number[] = [];

    if (seg.includes("\t")) {
      const cols = seg.split(/\t+/).map((c) => c.trim()).filter(Boolean);
      if (cols.length < 3) continue;
      const parsedRank = cleanOcrNum(cols[0].replace(/^#/, "").replace(/[.)]$/, ""));
      if (!parsedRank || parsedRank < 1 || parsedRank > 25) continue;
      rank = parsedRank;

      let numStart = cols.length;
      const trailing: number[] = [];
      while (numStart > 2 && trailing.length < 4) {
        const val = cleanOcrNum(cols[numStart - 1]);
        if (val === null) break;
        trailing.unshift(val);
        numStart -= 1;
      }
      if (trailing.length < 2 || trailing.length > 4) continue;
      if (trailing.length === 3 && numStart > 2) {
        const wwcdFromIcons = countWwcdIcons(cols[numStart - 1], true);
        if (wwcdFromIcons > 0) {
          iconWwcd = wwcdFromIcons;
          numStart -= 1;
        }
      }
      teamName = cols.slice(1, numStart).join(" ").trim();
      nums.push(...trailing);
    } else {
      const toks = seg.split(/\s+/);
      if (toks.length < 4) continue;
      const parsedRank = cleanOcrNum(toks[0].replace(/^#/, "").replace(/[.)]$/, ""));
      if (!parsedRank || parsedRank < 1 || parsedRank > 25) continue;
      rank = parsedRank;

      let numStart = toks.length;
      const trailing: number[] = [];
      while (numStart > 2 && trailing.length < 4) {
        const val = cleanOcrNum(toks[numStart - 1]);
        if (val === null) break;
        trailing.unshift(val);
        numStart -= 1;
      }
      if (trailing.length < 2) continue;
      if (trailing.length === 3) {
        // Consume consecutive win-icon tokens right before [place, kills, total] (e.g. "⭐ ⭐")
        while (numStart > 2) {
          const wwcdFromIcons = countWwcdIcons(toks[numStart - 1], false);
          if (wwcdFromIcons === 0) break;
          iconWwcd += wwcdFromIcons;
          numStart -= 1;
        }
      }
      teamName = toks.slice(1, numStart).join(" ").trim();
      nums.push(...trailing);
    }

    let wwcd = iconWwcd;
    let place = 0;
    let kills = 0;
    let total = 0;

    if (nums.length === 4) {
      [wwcd, place, kills, total] = nums;
    } else if (nums.length === 3) {
      [place, kills, total] = nums;
    } else if (nums.length === 2) {
      // Missing placement cell (e.g. obscured by dark art): infer place = max(0, total - kills)
      const [a, b] = nums;
      if (b >= a) {
        kills = a;
        total = b;
        place = Math.max(0, b - a);
      } else {
        place = a;
        kills = b;
        total = a + b;
      }
    }

    if (rank >= 1 && rank <= 25 && teamName.length >= 1) {
      rows.push({
        rank,
        team_name: teamName,
        wwcd,
        placement_points: place,
        kill_points: kills,
        total_points: total,
      });
    }
  }

  rows.sort((a, b) => a.rank - b.rank);
  if (rows.length < 3) return null;
  return { scrim_name: scrimName, scrim_date: scrimDate, standings: rows };
}

async function extractTextWithOcrSpace(
  sanitizedBase64: string,
  normalizedMime: string,
  ocrSpaceKey: string,
  timeoutMs: number
): Promise<string | null> {
  // OCR.Space free plan limits uploads to ~1MB binary (~1.33M base64 chars)
  if (!ocrSpaceKey || sanitizedBase64.length > 1_320_000) return null;
  try {
    const fd = new FormData();
    fd.append("base64Image", `data:${normalizedMime};base64,${sanitizedBase64}`);
    fd.append("isTable", "true");
    fd.append("OCREngine", "2");
    fd.append("scale", "true");
    fd.append("detectOrientation", "true");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { apikey: ocrSpaceKey },
      body: fd,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const parsedText = json?.ParsedResults?.[0]?.ParsedText;
    return typeof parsedText === "string" && parsedText.trim().length > 10 ? parsedText : null;
  } catch {
    return null;
  }
}

async function extractTextWithApiNinjas(
  sanitizedBase64: string,
  normalizedMime: string,
  apiNinjasKey: string,
  timeoutMs: number
): Promise<string | null> {
  if (!apiNinjasKey) return null;
  try {
    const binStr = atob(sanitizedBase64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i += 1) {
      bytes[i] = binStr.charCodeAt(i);
    }
    const ext = normalizedMime.includes("png") ? "png" : "jpg";
    const fd = new FormData();
    fd.append("image", new Blob([bytes], { type: normalizedMime }), `poster.${ext}`);

    const res = await fetch("https://api.api-ninjas.com/v1/imagetotext", {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "X-Api-Key": apiNinjasKey },
      body: fd,
    });
    if (!res.ok) return null;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return null;

    // Group words into horizontal rows sorted by y1 then x1
    const sorted = [...items]
      .filter((it: any) => it?.text && it?.bounding_box)
      .sort((a: any, b: any) => (a.bounding_box.y1 - b.bounding_box.y1) || (a.bounding_box.x1 - b.bounding_box.x1));

    const lines: Array<{ y: number; tokens: Array<{ x: number; text: string }> }> = [];
    for (const item of sorted) {
      const y = Number(item.bounding_box.y1) || 0;
      const x = Number(item.bounding_box.x1) || 0;
      const band = lines.find((ln) => Math.abs(ln.y - y) <= 14);
      if (band) {
        band.tokens.push({ x, text: String(item.text) });
      } else {
        lines.push({ y, tokens: [{ x, text: String(item.text) }] });
      }
    }

    return lines
      .map((ln) => ln.tokens.sort((a, b) => a.x - b.x).map((t) => t.text).join("\t"))
      .join("\n");
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const origin = req.headers.get("origin");

  if (!isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rate = checkRateLimit(req);
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded (429). Please retry shortly." }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rate.retryAfterSec),
        },
      }
    );
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim() || "";
    const ocrSpaceKey = Deno.env.get("OCR_SPACE_API_KEY")?.trim() || "";
    const apiNinjasKey = Deno.env.get("API_NINJAS_KEY")?.trim() || "";
    const backupProviders = getConfiguredBackupProviders();
    if (!apiKey && backupProviders.length === 0 && !ocrSpaceKey && !apiNinjasKey) {
      return new Response(
        JSON.stringify({ error: "Service configuration unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 5_500_000) {
      return new Response(
        JSON.stringify({ error: "Payload too large (max ~3.7MB image)." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload: ExtractionRequest;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, mimeType, uploaderName, fileName, archiveOnly } = payload as ExtractionRequest & { archiveOnly?: boolean };
    if (!imageBase64 || !mimeType || typeof imageBase64 !== "string" || typeof mimeType !== "string") {
      return new Response(
        JSON.stringify({ error: "Both 'imageBase64' and 'mimeType' are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedMime = mimeType.trim().toLowerCase();
    if (!ALLOWED_IMAGE_MIMES.has(normalizedMime)) {
      return new Response(
        JSON.stringify({ error: "Unsupported image format." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedBase64 = (
      imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64
    ).replace(/\s+/g, "");

    if (
      sanitizedBase64.length === 0 ||
      sanitizedBase64.length > MAX_BASE64_CHARS ||
      !/^[A-Za-z0-9+/=]+$/.test(sanitizedBase64)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid or oversized image data." }),
        { status: sanitizedBase64.length > MAX_BASE64_CHARS ? 413 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Archive original uploaded poster to Google Drive in the background (non-blocking)
    const jwtEmail = extractJwtEmail(req);
    const resolvedUploader = sanitizeDriveLabel(
      uploaderName || (jwtEmail ? jwtEmail.split("@")[0] : ""),
      "Guest"
    );
    const ext = normalizedMime.includes("png") ? "png" : normalizedMime.includes("webp") ? "webp" : "jpg";
    const resolvedFileName = sanitizeDriveLabel(fileName, `poster_${Date.now()}.${ext}`);
    const archiveTask = archivePosterToGoogleDrive({
      imageBase64: sanitizedBase64,
      mimeType: normalizedMime,
      uploaderName: resolvedUploader,
      fileName: resolvedFileName,
    });
    if (typeof EdgeRuntime !== "undefined" && typeof EdgeRuntime?.waitUntil === "function") {
      EdgeRuntime.waitUntil(archiveTask);
    } else {
      archiveTask.catch(() => {});
    }

    if (archiveOnly) {
      const archiveOnlyRes = await Promise.race([
        archiveTask,
        new Promise<DriveArchiveResult>((resolve) =>
          setTimeout(() => resolve({ ok: false, status: "timeout_12s" }), 12000)
        ),
      ]);
      return new Response(
        JSON.stringify({
          success: archiveOnlyRes.ok,
          poster_url: archiveOnlyRes.downloadUrl || null,
          poster_file_name: archiveOnlyRes.downloadUrl ? resolvedFileName : null,
          poster_status: archiveOnlyRes.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `
You are an expert esports / PUBG Mobile tournament referee and OCR parser.
Extract every single row accurately from this tournament standings poster:

1. SCRIM / TOURNAMENT NAME:
   - Identify the organizer/tournament title (logo or header, e.g. 'SSS', 'MEC SCRIMS', 'CT SCRIMS') plus any Season/Stage pill (e.g. 'SEASON 10 - SEMI FINALS' -> 'SSS Season 10 - Semi Finals').
   - Ignore generic headings like 'OVERALL STANDINGS' or 'POWERED BY' sponsor text unless needed.

2. MATCH DATE:
   - If a date is printed on the poster, convert it to YYYY-MM-DD.
   - If NO date is printed anywhere on the poster, return "".

3. STANDINGS TABLE ROWS (SINGLE OR DUAL-COLUMN):
   - Many posters split standings into two side-by-side tables (e.g. Left: #1 to #9, Right: #10 to #18). Extract ALL rows in exact rank order (#1..#18 or #1..#20).
   - Map columns strictly by column header alignment:
     * Rank column: '#', '#1', 'RANK', 'NO' -> rank (integer).
     * Team column: 'TEAMS', 'TEAM', 'TEAM NAME' -> exact team_name string (ignore small logo icon left of the name; keep exact text, and do not swallow win icons from the adjacent WWCD column).
     * WWCD column: 'WWCD', 'WIN', 'CHICKEN', or ANY icon/mascot header (bunny 🐰/🐇, ribbon/bow 🎀, star ⭐, pan, chicken 🍗, helmet, spider, crown 👑, trophy 🏆). VERY IMPORTANT:
       - Organizers use ANY small decorative sticker, graphic, badge, or emoji inside a team's WWCD cell to mark wins — e.g. pink ribbons/bows 🎀 (Stella Scrims), stars ⭐, bunnies 🐰, hearts 💖, flowers 🌸, crowns 👑, trophies 🏆, chickens 🍗, bullets/icons, or digits.
       - Scan EVERY row's WWCD cell carefully (including dark red/maroon or shaded top-3 rows where small pink/pastel stickers like ribbons 🎀 can blend in).
       - If ANY sticker/icon/badge is inside that cell, COUNT how many distinct icons appear (1 icon => wwcd = 1, 2 icons => wwcd = 2, etc.). Note: ONE ribbon bow 🎀, ONE flower 🌸, or ONE star ⭐ counts as 1 icon (never count two loops of a single ribbon bow as 2).
       - Do NOT confuse country flags inside TEAM NAME (e.g. 🇲🇲, 🇹🇼) with WWCD icons.
       - Output 0 ONLY when the WWCD cell is completely blank/empty (or no WWCD column exists). Do NOT shift PLACE into WWCD when WWCD is blank!
     * Placement column: 'PLACE.', 'PLACE', 'PP', 'PLACEMENT' -> placement_points.
     * Elims/Kills column: 'ELIMS.', 'ELIMS', 'KP', 'KILLS' -> kill_points.
     * Total column: 'TOTAL', 'TOT', 'PTS' -> total_points.
`;

    let parsed: ExtractionResponse | null = null;
    let lastError = "";
    const modelErrors: string[] = [];
    const attemptCodes: string[] = [];
    const reqStartedAt = Date.now();
    const TOTAL_BUDGET_MS = 38000;

    interface ExtractionQuality {
      rowCount: number;
      mathMismatchCount: number;
      missingRanks: number;
      maxPlace: number;
      totalWwcd: number;
      isVerifiedClean: boolean;
      qualityScore: number;
    }

    const scoreExtractionQuality = (data: ExtractionResponse | null): ExtractionQuality => {
      const rows = Array.isArray(data?.standings) ? data.standings : [];
      const rowCount = rows.length;
      if (rowCount === 0) {
        return { rowCount: 0, mathMismatchCount: 0, missingRanks: 0, maxPlace: 0, totalWwcd: 0, isVerifiedClean: false, qualityScore: -9999 };
      }
      let mathMismatchCount = 0;
      let wwcdPlaceConflictCount = 0;
      let maxPlace = 0;
      let totalWwcd = 0;
      let maxRank = 0;
      const rankSet = new Set<number>();

      for (const r of rows) {
        const pp = Number(r.placement_points) || 0;
        const kp = Number(r.kill_points) || 0;
        const tot = Number(r.total_points) || 0;
        const w = Number(r.wwcd) || 0;
        const rk = Number(String(r.rank ?? "").replace(/[^\d]/g, "")) || 0;
        if (pp + kp !== tot) mathMismatchCount += 1;
        if (w > 0 && pp > 0 && w * 10 > pp) wwcdPlaceConflictCount += 1;
        if (pp > maxPlace) maxPlace = pp;
        totalWwcd += w;
        if (rk >= 1 && rk <= 30) {
          rankSet.add(rk);
          if (rk > maxRank) maxRank = rk;
        }
      }

      const missingRanks = Math.max(0, maxRank - rankSet.size);
      const isVerifiedClean =
        rowCount >= 14 &&
        mathMismatchCount === 0 &&
        missingRanks === 0 &&
        wwcdPlaceConflictCount === 0 &&
        (maxPlace < 10 || totalWwcd > 0);
      const qualityScore =
        rowCount * 100 -
        mathMismatchCount * 250 -
        missingRanks * 150 -
        wwcdPlaceConflictCount * 60 +
        (maxPlace >= 10 && totalWwcd === 0 ? -120 : 120);

      return { rowCount, mathMismatchCount, missingRanks, maxPlace, totalWwcd, isVerifiedClean, qualityScore };
    };

    let bestPartialParsed: ExtractionResponse | null = null;
    let bestPartialProvider = "";
    let bestQualityScore = -99999;

    const rememberCandidate = (data: ExtractionResponse | null, provider: string): ExtractionQuality => {
      const q = scoreExtractionQuality(data);
      if (!data || q.rowCount === 0) return q;
      if (!bestPartialParsed || q.qualityScore > bestQualityScore) {
        bestPartialParsed = data;
        bestPartialProvider = provider;
        bestQualityScore = q.qualityScore;
      }
      return q;
    };

    const tryCandidate = async (
      candidate: ModelCandidate,
      timeoutMs: number,
      waveController: AbortController,
      providerTag: string
    ): Promise<ExtractionResponse> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const onWaveAbort = () => controller.abort();
      waveController.signal.addEventListener("abort", onWaveAbort, { once: true });

      try {
        const isGemma = candidate.name.toLowerCase().startsWith("gemma");
        const generationConfig: Record<string, unknown> = isGemma
          ? {
              temperature: 0.1,
              maxOutputTokens: 8192,
            }
          : {
              responseMimeType: "application/json",
              responseSchema: extractionSchema,
              temperature: 0.1,
              maxOutputTokens: 8192,
            };
        if (!isGemma && candidate.thinkingConfig) {
          generationConfig.thinkingConfig = candidate.thinkingConfig;
        }

        const promptForModel = isGemma
          ? `${prompt}\n\nReturn ONLY raw valid JSON matching {"scrim_name": string, "scrim_date": string, "standings": [{"rank": number, "team_name": string, "wwcd": number, "placement_points": number, "kill_points": number, "total_points": number}]}. No markdown fences.`
          : prompt;

        const restRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidate.name}:generateContent`,
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey.trim(),
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: promptForModel },
                    {
                      inlineData: {
                        mimeType: normalizedMime,
                        data: sanitizedBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig,
            }),
          }
        );

        if (restRes.ok) {
          const data = await restRes.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          const text = rawText
            ? String(rawText).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
            : "";
          if (!text) {
            const finishReason = data?.candidates?.[0]?.finishReason || "EMPTY";
            lastError = `Empty response from ${candidate.name} (${finishReason})`;
            modelErrors.push(`${candidate.name}: ${finishReason}`);
            attemptCodes.push(`${candidate.name}:${finishReason}`);
            throw new Error(lastError);
          }
          const candidateParsed = JSON.parse(text) as ExtractionResponse;
          if (Array.isArray(candidateParsed?.standings) && candidateParsed.standings.length > 0) {
            const q = rememberCandidate(candidateParsed, providerTag);
            if (q.isVerifiedClean) {
              waveController.abort();
              return candidateParsed;
            }
            lastError = `${candidate.name} quality check held (${q.rowCount}r, ${q.mathMismatchCount}err, ${q.missingRanks}gap, w=${q.totalWwcd})`;
            modelErrors.push(`${candidate.name}: unverified_${q.rowCount}r_${q.mathMismatchCount}err`);
            attemptCodes.push(`${candidate.name}:held`);
            throw new Error(lastError);
          }
          lastError = `${candidate.name} returned 0 standings`;
          modelErrors.push(`${candidate.name}: 0_standings`);
          attemptCodes.push(`${candidate.name}:0_rows`);
          throw new Error(lastError);
        } else {
          const errJson = await restRes.json().catch(() => ({}));
          lastError = errJson?.error?.message || `HTTP ${restRes.status}`;
          modelErrors.push(`${candidate.name}: ${restRes.status} ${lastError}`);
          attemptCodes.push(`${candidate.name}:${restRes.status}`);
          if (restRes.status === 429 || restRes.status === 503) {
            modelCooldownUntil.set(candidate.name, Date.now() + 45_000);
          }
          throw new Error(lastError);
        }
      } catch (err) {
        const msg = (err as any)?.message || String(err);
        if (!waveController.signal.aborted && !attemptCodes.some((a) => a.startsWith(`${candidate.name}:`))) {
          lastError = msg;
          modelErrors.push(`${candidate.name}: ${msg}`);
          attemptCodes.push(`${candidate.name}:timeout`);
        }
        throw err;
      } finally {
        clearTimeout(timer);
        waveController.signal.removeEventListener("abort", onWaveAbort);
      }
    };

    const runWave = async (
      candidates: ModelCandidate[],
      timeoutMs: number,
      providerTag = "gemini",
      externalSignal?: AbortSignal
    ): Promise<ExtractionResponse | null> => {
      if (!apiKey || candidates.length === 0) return null;
      const now = Date.now();
      const healthy = candidates.filter((c) => (modelCooldownUntil.get(c.name) || 0) <= now);
      const activeList = healthy.length > 0 ? healthy : candidates;
      const waveController = new AbortController();
      const onExtAbort = () => waveController.abort();
      if (externalSignal) {
        if (externalSignal.aborted) return null;
        externalSignal.addEventListener("abort", onExtAbort, { once: true });
      }
      try {
        return await Promise.any(activeList.map((c) => tryCandidate(c, timeoutMs, waveController, providerTag)));
      } catch {
        return null;
      } finally {
        externalSignal?.removeEventListener("abort", onExtAbort);
      }
    };

    const callOpenAiCompatBackup = async (
      provider: OpenAiCompatProvider,
      timeoutMs: number,
      externalSignal?: AbortSignal
    ): Promise<ExtractionResponse | null> => {
      const isGroq = provider.name === "groq";
      // Groq free tier enforces 1000 OTPM on qwen3.8; single-line compact JSON with 550 max_tokens allows back-to-back scans per minute
      const jsonInstruction = isGroq
        ? `${prompt}\n\nReturn SINGLE-LINE minified JSON with NO newlines or extra spaces: {"n":scrim_name,"d":"YYYY-MM-DD","r":[[rank,team_name,wwcd,placement_points,kill_points,total_points],...]}`
        : `${prompt}\n\nReturn ONLY raw valid JSON matching {"scrim_name": string, "scrim_date": string, "standings": [{"rank": number, "team_name": string, "wwcd": number, "placement_points": number, "kill_points": number, "total_points": number}]}. No markdown fences or extra commentary.`;
      const dataUri = `data:${normalizedMime};base64,${sanitizedBase64}`;

      for (const modelName of provider.models) {
        if (externalSignal?.aborted) break;
        const remainingMs = TOTAL_BUDGET_MS - (Date.now() - reqStartedAt);
        if (remainingMs < 4000) break;
        const perTryTimeout = Math.min(timeoutMs, remainingMs);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), perTryTimeout);
        const onExtAbort = () => controller.abort();
        externalSignal?.addEventListener("abort", onExtAbort, { once: true });
        try {
          const res = await fetch(provider.endpoint, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${provider.apiKey}`,
              ...(provider.extraHeaders || {}),
            },
            body: JSON.stringify({
              model: modelName,
              temperature: 0.1,
              max_tokens: isGroq ? 550 : 4096,
              ...(isGroq ? { response_format: { type: "json_object" } } : {}),
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: jsonInstruction },
                    { type: "image_url", image_url: { url: dataUri } },
                  ],
                },
              ],
            }),
          });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            lastError = errBody?.error?.message || `${provider.name} HTTP ${res.status}`;
            modelErrors.push(`${provider.name}/${modelName}: ${res.status}`);
            continue;
          }
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content;
          const textContent = Array.isArray(content)
            ? content.map((c: any) => c?.text || "").join("")
            : String(content || "");
          const candidateParsed = extractJsonObject(textContent);
          if (candidateParsed && Array.isArray(candidateParsed.standings) && candidateParsed.standings.length > 0) {
            return candidateParsed;
          }
          modelErrors.push(`${provider.name}/${modelName}: 0_standings`);
        } catch (err) {
          lastError = (err as any)?.message || String(err);
          modelErrors.push(`${provider.name}/${modelName}: timeout`);
        } finally {
          clearTimeout(timer);
          externalSignal?.removeEventListener("abort", onExtAbort);
        }
      }
      return null;
    };

    let providerUsed = "gemini";

    // Phase 1 (0-9s): Primary Gemini Wave 1 (saves Groq daily TPD quota for when Gemini misses or hits limits)
    if (apiKey) {
      const hasBackups = backupProviders.length > 0 || Boolean(ocrSpaceKey) || Boolean(apiNinjasKey);
      const wave1Timeout = hasBackups ? 9000 : 25000;
      parsed = await runWave(WAVE_1_CANDIDATES, wave1Timeout, "gemini");
      if (parsed) providerUsed = "gemini";
    }

    // If Phase 1 already yielded a solid table with 0 math errors & >=12 rows, accept it without spending Groq quota!
    if (!parsed && bestPartialParsed) {
      const qBest = scoreExtractionQuality(bestPartialParsed);
      if (qBest.rowCount >= 12 && qBest.mathMismatchCount === 0 && qBest.missingRanks === 0 && (qBest.maxPlace < 10 || qBest.totalWwcd > 0)) {
        parsed = bestPartialParsed;
        providerUsed = bestPartialProvider || "gemini";
      }
    }

    // Phase 2: Race Gemini Wave 2 + Vision Backups (Groq/Mistral/OpenRouter) + parallel Text OCR (OCR.Space + API Ninjas).
    // Vision AI always takes priority; if all Vision AI fail, merge OCR.Space & API Ninjas so missed rows are filled!
    if (!parsed) {
      const remainingMs = TOTAL_BUDGET_MS - (Date.now() - reqStartedAt);
      if (remainingMs >= 4500) {
        const fastLlmProviders = backupProviders.filter((p) => p.name === "groq" || p.name === "mistral" || p.name === "freellmapi");
        const openRouterProv = backupProviders.find((p) => p.name === "openrouter");

        const ocrSpacePromise = ocrSpaceKey
          ? extractTextWithOcrSpace(sanitizedBase64, normalizedMime, ocrSpaceKey, Math.min(8500, remainingMs))
              .then((txt) => (txt ? parseStandingsFromOcrText(txt) : null))
              .catch(() => null)
          : Promise.resolve(null);

        const apiNinjasPromise = apiNinjasKey
          ? extractTextWithApiNinjas(sanitizedBase64, normalizedMime, apiNinjasKey, Math.min(8500, remainingMs))
              .then((txt) => (txt ? parseStandingsFromOcrText(txt) : null))
              .catch(() => null)
          : Promise.resolve(null);

        const wave2Promise = apiKey
          ? runWave(WAVE_2_CANDIDATES, Math.min(9500, remainingMs), "gemini_w2").catch(() => null)
          : Promise.resolve(null);

        const fastBackupPromise = fastLlmProviders.length > 0
          ? (async () => {
              for (const prov of fastLlmProviders) {
                const res = await callOpenAiCompatBackup(prov, Math.min(9000, remainingMs));
                if (res) return { res, name: prov.name };
              }
              return null;
            })()
          : Promise.resolve(null);

        const openRouterPromise = openRouterProv
          ? callOpenAiCompatBackup(openRouterProv, Math.min(9500, remainingMs)).catch(() => null)
          : Promise.resolve(null);

        const [wave2Res, fastBackupRes, openRouterRes, ocrSpaceRes, apiNinjasRes] = await Promise.all([
          wave2Promise,
          fastBackupPromise,
          openRouterPromise,
          ocrSpacePromise,
          apiNinjasPromise,
        ]);

        if (wave2Res) rememberCandidate(wave2Res, "gemini_w2");
        if (fastBackupRes?.res) rememberCandidate(fastBackupRes.res, fastBackupRes.name);
        if (openRouterRes) rememberCandidate(openRouterRes, "openrouter");

        const mergedTextRes = mergeOcrStandings(ocrSpaceRes, apiNinjasRes);
        const textProviderLabel =
          ocrSpaceRes && apiNinjasRes
            ? "ocr_space"
            : apiNinjasRes
              ? "api_ninjas"
              : "ocr_space";

        if (bestPartialParsed) {
          const qBest = scoreExtractionQuality(bestPartialParsed);
          const qText = scoreExtractionQuality(mergedTextRes);
          if (mergedTextRes && qBest.rowCount < 12 && qText.rowCount >= qBest.rowCount + 4) {
            parsed = mergedTextRes;
            providerUsed = textProviderLabel;
          } else {
            parsed = bestPartialParsed;
            providerUsed = bestPartialProvider || "gemini";
          }
        } else if (mergedTextRes) {
          parsed = mergedTextRes;
          providerUsed = textProviderLabel;
        }
      }
    }

    if (!parsed && bestPartialParsed) {
      parsed = bestPartialParsed;
      providerUsed = bestPartialProvider || "gemini";
    }

    if (!parsed) {
      if (
        lastError.includes("429") ||
        lastError.includes("RESOURCE_EXHAUSTED") ||
        lastError.toLowerCase().includes("quota")
      ) {
        return new Response(
          JSON.stringify({
            error: "Gemini API rate limit exceeded (429). Please retry shortly.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (
        lastError.includes("401") ||
        lastError.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
        lastError.includes("API_KEY_SERVICE_BLOCKED") ||
        lastError.includes("API key not valid")
      ) {
        return new Response(
          JSON.stringify({
            error: "GEMINI_KEY_RESTRICTED",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allErrorsText = modelErrors.join(" | ") || lastError;
      const isTransientBusy =
        allErrorsText.includes("503") ||
        allErrorsText.toLowerCase().includes("high demand") ||
        allErrorsText.toLowerCase().includes("timed out") ||
        allErrorsText.toLowerCase().includes("timeout") ||
        allErrorsText.toLowerCase().includes("aborted");

      return new Response(
        JSON.stringify({
          error: isTransientBusy ? "AI OCR temporary high demand (503/Timeout)" : "Poster extraction failed",
        }),
        { status: isTransientBusy ? 503 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let hasGlobalMismatch = false;
    const validatedStandings: ValidatedStandingItem[] = (parsed.standings || []).slice(0, 30).map((row, idx) => {
      const rank = Number(String(row.rank ?? "").replace(/[^\d]/g, "")) || idx + 1;
      const team_name = String(row.team_name || "").trim().slice(0, 80);
      const wwcd = Number(row.wwcd) || 0;
      const placement_points = Number(row.placement_points) || 0;
      const kill_points = Number(row.kill_points) || 0;
      const ocrTotal = Number(row.total_points) || 0;

      const calculatedTotal = placement_points + kill_points;
      const mismatch = calculatedTotal !== ocrTotal;

      if (mismatch) {
        hasGlobalMismatch = true;
      }

      return {
        rank,
        team_name,
        wwcd,
        placement_points,
        kill_points,
        total_points: mismatch ? calculatedTotal : ocrTotal,
        has_math_mismatch: mismatch,
        ...(mismatch ? { ocr_reported_total: ocrTotal } : {}),
      };
    });

    const safeDate = parseFlexibleDate(parsed.scrim_date);
    const remainingForArchive = Math.max(2500, Math.min(8000, TOTAL_BUDGET_MS - (Date.now() - reqStartedAt) - 1000));
    const archiveResult = await Promise.race([
      archiveTask,
      new Promise<DriveArchiveResult>((resolve) =>
        setTimeout(() => resolve({ ok: false, status: "timeout_wait" }), remainingForArchive)
      ),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        provider_used: providerUsed,
        scrim_name: (parsed.scrim_name?.trim() || "Untitled Scrim").slice(0, 120),
        scrim_date: safeDate,
        poster_url: archiveResult?.downloadUrl || null,
        poster_file_name: archiveResult?.downloadUrl ? resolvedFileName : null,
        poster_status: archiveResult?.status || "unknown",
        has_math_mismatch: hasGlobalMismatch,
        total_teams_extracted: validatedStandings.length,
        standings: validatedStandings,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
