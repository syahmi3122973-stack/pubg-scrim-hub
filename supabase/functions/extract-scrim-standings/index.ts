// @ts-nocheck
/* eslint-disable */
// supabase/functions/extract-scrim-standings/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

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
              "Full team name from TEAMS / TEAM / TEAM NAME column (ignore circular/square team logo next to it; keep exact spelling and spacing).",
          },
          wwcd: {
            type: "INTEGER",
            description:
              "Win/WWCD column (labeled 'WWCD', 'WIN', or shown only as an icon like chicken/pan/helmet/spider). Output 0 if the cell is blank, empty, or covered only by background art.",
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
  { name: "gemini-3.6-flash", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-3-flash-preview", thinkingConfig: { thinkingLevel: "MINIMAL" } },
];

const WAVE_2_CANDIDATES: ModelCandidate[] = [
  { name: "gemini-3.5-flash", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-omni-flash-preview" },
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

  // 1. Groq Vision (Free tier, ~1-3s inference)
  const groqKey = Deno.env.get("GROQ_API_KEY")?.trim();
  if (groqKey) {
    providers.push({
      name: "groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      models: [
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "meta-llama/llama-4-maverick-17b-128e-instruct",
      ],
    });
  }

  // 2. OpenRouter Free Vision (:free models)
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
  if (openRouterKey) {
    providers.push({
      name: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterKey,
      models: [
        "qwen/qwen2.5-vl-72b-instruct:free",
        "meta-llama/llama-4-scout:free",
        "google/gemma-3-27b-it:free",
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

function extractJsonObject(raw: string): ExtractionResponse | null {
  const cleaned = String(raw || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as ExtractionResponse;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as ExtractionResponse;
      } catch {
        return null;
      }
    }
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
    const backupProviders = getConfiguredBackupProviders();
    if (!apiKey && backupProviders.length === 0) {
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

    const { imageBase64, mimeType } = payload;
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
     * Team column: 'TEAMS', 'TEAM', 'TEAM NAME' -> exact team_name string (ignore small logo icon left of the name).
     * WWCD column: 'WWCD', 'WIN', or icon header (frying pan, chicken, helmet, spider icon). VERY IMPORTANT: Blank/empty cells (or if no WWCD column exists) mean 0. Do NOT shift PLACE into WWCD when WWCD is blank!
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

    const tryCandidate = async (
      candidate: ModelCandidate,
      timeoutMs: number,
      waveController: AbortController
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
            waveController.abort();
            return candidateParsed;
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
      timeoutMs: number
    ): Promise<ExtractionResponse | null> => {
      if (!apiKey || candidates.length === 0) return null;
      const now = Date.now();
      const healthy = candidates.filter((c) => (modelCooldownUntil.get(c.name) || 0) <= now);
      const activeList = healthy.length > 0 ? healthy : candidates;
      const waveController = new AbortController();
      try {
        return await Promise.any(activeList.map((c) => tryCandidate(c, timeoutMs, waveController)));
      } catch {
        return null;
      }
    };

    const callOpenAiCompatBackup = async (
      provider: OpenAiCompatProvider,
      timeoutMs: number
    ): Promise<ExtractionResponse | null> => {
      const jsonInstruction = `${prompt}\n\nReturn ONLY raw valid JSON matching {"scrim_name": string, "scrim_date": string, "standings": [{"rank": number, "team_name": string, "wwcd": number, "placement_points": number, "kill_points": number, "total_points": number}]}. No markdown fences or extra commentary.`;
      const dataUri = `data:${normalizedMime};base64,${sanitizedBase64}`;

      for (const modelName of provider.models) {
        const remainingMs = TOTAL_BUDGET_MS - (Date.now() - reqStartedAt);
        if (remainingMs < 4000) break;
        const perTryTimeout = Math.min(timeoutMs, remainingMs);
        try {
          const res = await fetch(provider.endpoint, {
            method: "POST",
            signal: AbortSignal.timeout(perTryTimeout),
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${provider.apiKey}`,
              ...(provider.extraHeaders || {}),
            },
            body: JSON.stringify({
              model: modelName,
              temperature: 0.1,
              max_tokens: 4096,
              response_format: { type: "json_object" },
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
        }
      }
      return null;
    };

    // Wave 1: 2 primary Gemini models (50% less RPM burn than 4 parallel calls)
    if (apiKey) {
      const wave1Timeout = backupProviders.length > 0 ? 18000 : 25000;
      parsed = await runWave(WAVE_1_CANDIDATES, wave1Timeout);
    }

    // Backup providers (Groq / OpenRouter / Mistral / FreeLLMAPI) kick in immediately if Gemini Wave 1 fails
    if (!parsed && backupProviders.length > 0) {
      for (const provider of backupProviders) {
        const remainingMs = TOTAL_BUDGET_MS - (Date.now() - reqStartedAt);
        if (remainingMs < 5000) break;
        parsed = await callOpenAiCompatBackup(provider, Math.min(12000, remainingMs));
        if (parsed) break;
      }
    }

    // Wave 2: Secondary Gemini fallback models if still unresolved and budget remains
    if (!parsed && apiKey) {
      const remainingMs = TOTAL_BUDGET_MS - (Date.now() - reqStartedAt);
      if (remainingMs >= 6000) {
        parsed = await runWave(WAVE_2_CANDIDATES, Math.min(12000, remainingMs));
      }
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
        allErrorsText.toLowerCase().includes("timed out");

      return new Response(
        JSON.stringify({
          error: isTransientBusy ? "Gemini temporary high demand (503)" : "Gemini extraction failed",
        }),
        { status: isTransientBusy ? 503 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let hasGlobalMismatch = false;
    const validatedStandings: ValidatedStandingItem[] = (parsed.standings || []).slice(0, 30).map((row) => {
      const rank = Number(row.rank) || 0;
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

    return new Response(
      JSON.stringify({
        success: true,
        scrim_name: (parsed.scrim_name?.trim() || "Untitled Scrim").slice(0, 120),
        scrim_date: safeDate,
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
