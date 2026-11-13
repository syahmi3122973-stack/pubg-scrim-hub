// @ts-nocheck
/* eslint-disable */
// supabase/functions/extract-scrim-standings/index.ts

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

const MODEL_CANDIDATES: ModelCandidate[] = [
  { name: "gemini-3.5-flash-lite", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-3.5-flash", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-3-flash-preview", thinkingConfig: { thinkingLevel: "MINIMAL" } },
  { name: "gemini-flash-latest" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY configuration in environment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Both 'imageBase64' and 'mimeType' are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sanitizedBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

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
     * WWCD column: 'WWCD', 'WIN', or icon header (frying pan, chicken, helmet, spider icon). VERY IMPORTANT: Blank/empty cells mean 0. Do NOT shift PLACE into WWCD when WWCD is blank!
     * Placement column: 'PLACE.', 'PLACE', 'PP', 'PLACEMENT' -> placement_points.
     * Elims/Kills column: 'ELIMS.', 'ELIMS', 'KP', 'KILLS' -> kill_points.
     * Total column: 'TOTAL', 'TOT', 'PTS' -> total_points.
`;

    let rawResponseText: string | null = null;
    let lastError = "";
    const modelErrors: string[] = [];

    for (const candidate of MODEL_CANDIDATES) {
      try {
        const generationConfig: Record<string, unknown> = {
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
          temperature: 0.1,
        };
        if (candidate.thinkingConfig) {
          generationConfig.thinkingConfig = candidate.thinkingConfig;
        }

        const restRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${candidate.name}:generateContent`,
          {
            method: "POST",
            signal: AbortSignal.timeout(22000),
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey.trim(),
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
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
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            rawResponseText = text;
            break;
          }
          lastError = `Empty response from ${candidate.name}`;
          modelErrors.push(`${candidate.name}: empty`);
        } else {
          const errJson = await restRes.json().catch(() => ({}));
          lastError = errJson?.error?.message || `HTTP ${restRes.status}`;
          modelErrors.push(`${candidate.name}: ${restRes.status} ${lastError}`);
          if (
            restRes.status === 401 ||
            restRes.status === 403 ||
            restRes.status === 429 ||
            lastError.includes("RESOURCE_EXHAUSTED")
          ) {
            break;
          }
        }
      } catch (fetchErr) {
        lastError = (fetchErr as any)?.message || String(fetchErr);
        modelErrors.push(`${candidate.name}: ${lastError}`);
      }
    }

    if (!rawResponseText) {
      if (
        lastError.includes("429") ||
        lastError.includes("RESOURCE_EXHAUSTED") ||
        lastError.toLowerCase().includes("quota")
      ) {
        return new Response(
          JSON.stringify({ error: "Gemini API rate limit exceeded. Please retry shortly." }),
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
            details:
              "Kunci Google AI Studio belum aktifkan servis Generative Language API di Google Cloud.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Gemini extraction failed",
          details: modelErrors.join(" | ") || lastError,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: ExtractionResponse;
    try {
      parsed = JSON.parse(rawResponseText);
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to parse structured JSON from model response",
          raw: rawResponseText,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let hasGlobalMismatch = false;
    const validatedStandings: ValidatedStandingItem[] = (parsed.standings || []).map((row) => {
      const rank = Number(row.rank) || 0;
      const team_name = String(row.team_name || "").trim();
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
        scrim_name: parsed.scrim_name?.trim() || "Untitled Scrim",
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
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: (err as any)?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
