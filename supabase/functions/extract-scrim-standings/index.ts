// supabase/functions/extract-scrim-standings/index.ts

import { GoogleGenerativeAI, SchemaType } from "npm:@google/generative-ai@^0.21.0";

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

  // 1. Direct YYYY-MM-DD
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

  // 2. Format: "Thursday, 5 November 2026" or "5 November 2026" or "05 Nov 2026"
  const dmyMatch = cleaned.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = monthMap[dmyMatch[2].toLowerCase()] || "11";
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Format: "November 5, 2026" or "Nov 5 2026"
  const mdyMatch = cleaned.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const month = monthMap[mdyMatch[1].toLowerCase()] || "11";
    const day = mdyMatch[2].padStart(2, "0");
    const year = mdyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 4. Format: "05/11/2026" or "05-11-2026"
  const slashMatch = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
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
  type: SchemaType.OBJECT,
  properties: {
    scrim_name: {
      type: SchemaType.STRING,
      description: "Primary tournament or scrim title header (e.g. 'MEC SCRIMS', 'CT SCRIMS', 'RYKHOR SCRIMS').",
    },
    scrim_date: {
      type: SchemaType.STRING,
      description: "Date of match converted to YYYY-MM-DD (e.g. 'Monday, 9 November 2026' -> '2026-11-09', 'Thursday, 5 November 2026' -> '2026-11-05').",
    },
    standings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          rank: { type: SchemaType.INTEGER, description: "Rank number (#, RANK, or NO column)" },
          team_name: {
            type: SchemaType.STRING,
            description: "Full team name from TEAM / TEAM NAME / T E A M column (e.g. '2027', 'MEC x AZH', '4KRV BLACK NUMBER').",
          },
          wwcd: {
            type: SchemaType.INTEGER,
            description: "Number of WWCD chicken dinners won (labeled 'WWCD', 'WIN', or symbolized by 🍳 / golden helmet / frying pan). Output 0 if the cell is blank, empty or dash.",
          },
          placement_points: { type: SchemaType.INTEGER, description: "Placement points (labeled 'PLACE', 'PP', 'PLACEMENT', or 'PTS')" },
          kill_points: { type: SchemaType.INTEGER, description: "Kill / Elimination points (labeled 'ELIMS', 'KP', 'KILLS', or 'ELIMINATIONS')" },
          total_points: { type: SchemaType.INTEGER, description: "TOTAL points (labeled 'TOTAL', 'TOT', or 'PTS')" },
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.1,
      },
    });

    const prompt = `
You are an expert esports / PUBG Mobile tournament referee and OCR parser.
Analyze this tournament standings poster image and extract all structured data accurately:

1. SCRIM / TOURNAMENT NAME:
   - Identify the main tournament or scrim title at the top (e.g., 'MEC SCRIMS', 'CT SCRIMS', 'RYKHOR SCRIMS').
   - Do NOT abbreviate. Ignore generic subtext like 'OVERALL STANDINGS', 'FINAL RESULTS', or sponsor logos unless it's part of the title.

2. MATCH DATE:
   - Find the date text, typically above or below the title (e.g., 'Monday, 9 November 2026' or 'Thursday, 5 November 2026').
   - Convert it into strict ISO format YYYY-MM-DD. For example:
     * 'Monday, 9 November 2026' -> '2026-11-09'
     * 'Thursday, 5 November 2026' -> '2026-11-05'
     * '5 Nov 2026' -> '2026-11-05'
     * '09/11/2026' -> '2026-11-09'

3. STANDINGS TABLE ROWS:
   - Identify and map the columns:
     * Rank column: '#' or 'RANK' or 'NO' -> rank (1, 2, 3...)
     * Team column: 'T E A M', 'TEAM', 'TEAM NAME' -> team_name (e.g., '2027', 'MEC x AZH', '4KRV BLACK NUMBER', 'VOLTRA VAMP').
       Keep exact spelling, spaces, numbers, and casing. Do not cut off names even if text is colored red, gold, or white.
     * WWCD column: Labeled 'WWCD', 'WIN', or symbolized by an icon like a frying pan, chicken, or golden helmet 🍳.
       VERY IMPORTANT: If the cell is empty, blank, has a dash or no number, output 0. Do NOT shift columns!
     * Placement Points column: Labeled 'PLACE', 'PP', 'PLACEMENT', or 'PTS' -> placement_points (integer).
     * Kill Points column: Labeled 'ELIMS', 'KP', 'KILLS', or 'ELIMINATIONS' -> kill_points (integer).
     * Total Points column: Labeled 'TOTAL', 'TOT', or 'PTS' -> total_points (integer).
   - Extract ALL rows in order without skipping (e.g., if there are 18 rows from #1 to #18, or 20 rows from #1 to #20, return every single item).
`;

    let result;
    try {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: sanitizedBase64,
            mimeType: mimeType,
          },
        },
      ]);
    } catch (aiError: any) {
      const errorMessage = aiError?.message || String(aiError);

      if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.toLowerCase().includes("quota")
      ) {
        return new Response(
          JSON.stringify({ error: "Gemini API rate limit exceeded. Please retry shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Gemini extraction failed", details: errorMessage }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawResponseText = result.response.text();
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
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err?.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

