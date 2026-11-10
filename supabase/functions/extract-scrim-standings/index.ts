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

const extractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scrim_name: {
      type: SchemaType.STRING,
      description: "Tournament or scrim title (e.g. 'CT SCRIMS', 'PMGC WEEKLY').",
    },
    scrim_date: {
      type: SchemaType.STRING,
      description: "Date of match in YYYY-MM-DD format. If year is missing, use current year.",
    },
    standings: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          rank: { type: SchemaType.INTEGER },
          team_name: {
            type: SchemaType.STRING,
            description: "Full team name including clan prefixes or tags (e.g., '[BTR] Bigetron').",
          },
          wwcd: {
            type: SchemaType.INTEGER,
            description: "Number of WWCD / Chicken Dinners won. If empty, dash, or blank, return 0.",
          },
          placement_points: { type: SchemaType.INTEGER },
          kill_points: { type: SchemaType.INTEGER },
          total_points: { type: SchemaType.INTEGER },
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
Extract the esports / PUBG Mobile tournament standings table from this poster image.
- Preserve exact clan tags, bracket symbols, and team names without abbreviation.
- If WWCD column has blank, dash (-), or empty values, output 0.
- Ensure ranks are sorted in sequential ascending order starting from 1.
- Output valid ISO date YYYY-MM-DD. If only day and month are present, assume current year ${new Date().getFullYear()}.
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

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const safeDate = dateRegex.test(parsed.scrim_date)
      ? parsed.scrim_date
      : new Date().toISOString().split("T")[0];

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

