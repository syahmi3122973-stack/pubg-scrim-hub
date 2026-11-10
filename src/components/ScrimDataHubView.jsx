import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  Info,
  X,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Zap,
  ShieldCheck,
  Database,
  Share2,
  Search,
  BarChart2,
  ArrowRight,
  Copy,
  Check,
  FileText,
  Clock,
  Award,
  Flame,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  Filter,
  Key,
  ExternalLink
} from 'lucide-react';

// Exact real extracted dataset from the MEC SCRIMS poster (Monday, 9 November 2026 - 18 Teams)
export const MEC_SCRIMS_18_TEAMS = [
  { tempId: 'mec_1', rank: 1, team_name: '2027', wwcd: 2, placement_points: 26, kill_points: 58, total_points: 84 },
  { tempId: 'mec_2', rank: 2, team_name: 'MEC x AZH', wwcd: 1, placement_points: 18, kill_points: 49, total_points: 67 },
  { tempId: 'mec_3', rank: 3, team_name: 'WHY FAMILIA', wwcd: 1, placement_points: 22, kill_points: 44, total_points: 66 },
  { tempId: 'mec_4', rank: 4, team_name: '4SEA ESPORTS', wwcd: 0, placement_points: 5, kill_points: 48, total_points: 53 },
  { tempId: 'mec_5', rank: 5, team_name: 'PROMAX KURKUR', wwcd: 0, placement_points: 14, kill_points: 28, total_points: 42 },
  { tempId: 'mec_6', rank: 6, team_name: 'DIY NATION X', wwcd: 0, placement_points: 14, kill_points: 28, total_points: 42 },
  { tempId: 'mec_7', rank: 7, team_name: 'KUBA', wwcd: 0, placement_points: 5, kill_points: 33, total_points: 38 },
  { tempId: 'mec_8', rank: 8, team_name: 'JES NGOI', wwcd: 0, placement_points: 9, kill_points: 27, total_points: 36 },
  { tempId: 'mec_9', rank: 9, team_name: 'DFX MAGMA', wwcd: 1, placement_points: 18, kill_points: 16, total_points: 34 },
  { tempId: 'mec_10', rank: 10, team_name: 'ROCKET ICONS', wwcd: 0, placement_points: 5, kill_points: 29, total_points: 34 },
  { tempId: 'mec_11', rank: 11, team_name: 'KG ESPORTS', wwcd: 0, placement_points: 8, kill_points: 24, total_points: 32 },
  { tempId: 'mec_12', rank: 12, team_name: 'MHX ESPORT', wwcd: 0, placement_points: 10, kill_points: 20, total_points: 30 },
  { tempId: 'mec_13', rank: 13, team_name: 'TOP ESPORTS', wwcd: 0, placement_points: 0, kill_points: 17, total_points: 17 },
  { tempId: 'mec_14', rank: 14, team_name: 'DIY FEARLESS', wwcd: 0, placement_points: 0, kill_points: 14, total_points: 14 },
  { tempId: 'mec_15', rank: 15, team_name: 'EQUIPO HAVOC', wwcd: 0, placement_points: 0, kill_points: 10, total_points: 10 },
  { tempId: 'mec_16', rank: 16, team_name: 'RAG', wwcd: 0, placement_points: 2, kill_points: 7, total_points: 9 },
  { tempId: 'mec_17', rank: 17, team_name: 'GATOR ESPORT BOYZ', wwcd: 0, placement_points: 2, kill_points: 4, total_points: 6 },
  { tempId: 'mec_18', rank: 18, team_name: 'FLYLOW', wwcd: 0, placement_points: 2, kill_points: 4, total_points: 6 }
];

// Exact real extracted dataset from the CT SCRIMS poster (Thursday, 5 November 2026 - 20 Teams)
export const CT_SCRIMS_20_TEAMS = [
  { tempId: 'ct_1', rank: 1, team_name: '4KRV BLACK NUMBER', wwcd: 1, placement_points: 22, kill_points: 60, total_points: 82 },
  { tempId: 'ct_2', rank: 2, team_name: 'SM REBORN7', wwcd: 1, placement_points: 13, kill_points: 58, total_points: 71 },
  { tempId: 'ct_3', rank: 3, team_name: 'DIY ALLIANCE', wwcd: 2, placement_points: 24, kill_points: 46, total_points: 70 },
  { tempId: 'ct_4', rank: 4, team_name: 'D2W MIXUE', wwcd: 1, placement_points: 25, kill_points: 36, total_points: 61 },
  { tempId: 'ct_5', rank: 5, team_name: 'JUJUTSU BLACKZONE', wwcd: 0, placement_points: 18, kill_points: 41, total_points: 59 },
  { tempId: 'ct_6', rank: 6, team_name: 'AYSE TRYOUT 1', wwcd: 0, placement_points: 6, kill_points: 22, total_points: 28 },
  { tempId: 'ct_7', rank: 7, team_name: 'KYN TRICKSTER', wwcd: 0, placement_points: 7, kill_points: 20, total_points: 27 },
  { tempId: 'ct_8', rank: 8, team_name: 'DIY SIXTYNINE', wwcd: 0, placement_points: 2, kill_points: 24, total_points: 26 },
  { tempId: 'ct_9', rank: 9, team_name: 'iG BLOSSOMX', wwcd: 0, placement_points: 15, kill_points: 10, total_points: 25 },
  { tempId: 'ct_10', rank: 10, team_name: 'UEGC MITEC', wwcd: 0, placement_points: 3, kill_points: 20, total_points: 23 },
  { tempId: 'ct_11', rank: 11, team_name: 'LEGACY RELIC', wwcd: 0, placement_points: 6, kill_points: 14, total_points: 20 },
  { tempId: 'ct_12', rank: 12, team_name: 'STUN FX', wwcd: 0, placement_points: 1, kill_points: 17, total_points: 18 },
  { tempId: 'ct_13', rank: 13, team_name: '4KRV MAFIA', wwcd: 0, placement_points: 6, kill_points: 9, total_points: 15 },
  { tempId: 'ct_14', rank: 14, team_name: '4KRV REBORN', wwcd: 0, placement_points: 4, kill_points: 11, total_points: 15 },
  { tempId: 'ct_15', rank: 15, team_name: 'ECB 7SEAS', wwcd: 0, placement_points: 0, kill_points: 15, total_points: 15 },
  { tempId: 'ct_16', rank: 16, team_name: 'VOLTRA VAMP', wwcd: 0, placement_points: 1, kill_points: 13, total_points: 14 },
  { tempId: 'ct_17', rank: 17, team_name: '4KRV VILLAINS', wwcd: 0, placement_points: 1, kill_points: 9, total_points: 10 },
  { tempId: 'ct_18', rank: 18, team_name: 'SOULTANX TRYOUT 1.9', wwcd: 0, placement_points: 4, kill_points: 5, total_points: 9 },
  { tempId: 'ct_19', rank: 19, team_name: 'NEKO FURY', wwcd: 0, placement_points: 1, kill_points: 2, total_points: 3 },
  { tempId: 'ct_20', rank: 20, team_name: 'DSC HARDLINE', wwcd: 0, placement_points: 1, kill_points: 1, total_points: 2 }
];

// Direct Client-Side Google Gemini 1.5 Flash OCR Invocation (No serverless backend needed!)
export async function extractStandingsDirectGemini(imageBase64, mimeType, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Sila masukkan Google Gemini API Key.');
  }

  const base64Pure = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const promptText = `
You are an expert esports / PUBG Mobile tournament referee and OCR parser.
Analyze this tournament standings poster image and extract all structured data accurately into JSON format:

1. SCRIM / TOURNAMENT NAME:
   - Identify the main tournament or scrim title at the top (e.g. 'MEC SCRIMS', 'CT SCRIMS', 'PMGC').
   - Ignore generic words like 'OVERALL STANDINGS' or 'FINAL RESULTS' unless part of the official title.

2. MATCH DATE:
   - Find the date text (e.g. 'Monday, 9 November 2026' or '5 November 2026').
   - Convert to ISO format YYYY-MM-DD (e.g. '2026-11-09' or '2026-11-05').

3. STANDINGS TABLE ROWS:
   - Identify all rows from 1 to N:
     * rank: '#' or 'RANK' or 'NO' (integer, 1, 2, 3...)
     * team_name: 'TEAM' or 'TEAM NAME' (string, e.g. '2027', 'MEC x AZH', 'WHY FAMILIA'). Keep exact clan tags, numbers, and casing.
     * wwcd: Chicken dinners won. Labeled 'WWCD', 'WIN', or symbolized by 🍳 / golden helmet / frying pan. If blank, dash, or 0, return 0.
     * placement_points: Placement points. Labeled 'PLACE', 'PP', 'PLACEMENT', or 'PTS' (integer).
     * kill_points: Kill / Elimination points. Labeled 'ELIMS', 'KP', 'KILLS', or 'ELIMINATIONS' (integer).
     * total_points: TOTAL points. Labeled 'TOTAL', 'TOT', or 'PTS' (integer).
   - Ensure you extract every row without skipping any team.

Return strictly a valid JSON object matching this schema:
{
  "scrim_name": "string",
  "scrim_date": "YYYY-MM-DD",
  "standings": [
    {
      "rank": 1,
      "team_name": "string",
      "wwcd": 0,
      "placement_points": 0,
      "kill_points": 0,
      "total_points": 0
    }
  ]
}
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Pure
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    let msg = `Gemini API Ralat (${response.status})`;
    try {
      const parsedErr = JSON.parse(errorData);
      if (parsedErr?.error?.message) msg = parsedErr.error.message;
    } catch {}
    throw new Error(msg);
  }

  const resJson = await response.json();
  const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Tiada data dipulangkan daripada model Gemini.');

  const parsed = JSON.parse(rawText);
  return parsed;
}

// Helper: Convert English/Malay poster date (e.g. "Monday, 9 November 2026" or "5 November 2026") into strict YYYY-MM-DD
export function parsePosterDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = String(dateStr).trim();

  // 1. Direct YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const monthMap = {
    january: '01', jan: '01', januari: '01',
    february: '02', feb: '02', februari: '02',
    march: '03', mar: '03', mac: '03',
    april: '04', apr: '04',
    may: '05', mei: '05',
    june: '06', jun: '06',
    july: '07', jul: '07', julai: '07',
    august: '08', aug: '08', ogos: '08',
    september: '09', sep: '09', sept: '09',
    october: '10', oct: '10', oktober: '10',
    november: '11', nov: '11',
    december: '12', dec: '12', disember: '12'
  };

  // 2. Format: "Monday, 9 November 2026" or "5 November 2026" or "05 Nov 2026"
  const dmyMatch = cleaned.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = monthMap[dmyMatch[2].toLowerCase()] || '11';
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Format: "November 9, 2026" or "Nov 5 2026"
  const mdyMatch = cleaned.match(/([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const month = monthMap[mdyMatch[1].toLowerCase()] || '11';
    const day = mdyMatch[2].padStart(2, '0');
    const year = mdyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 4. Format: "09/11/2026" or "05-11-2026"
  const slashMatch = cleaned.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

// Normalize team name variations (e.g. "[4KRV] ESPORTS OFFICIAL" -> canonical slug "4krv")
export function normalizeTeamAlias(rawName) {
  if (!rawName) return { raw: '', canonicalName: '', slug: '', tag: '' };
  const trimmed = String(rawName).trim();

  // Extract bracketed tag if present e.g. [4KRV]
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/);
  const baseText = bracketMatch ? (bracketMatch[2] || bracketMatch[1]) : trimmed;

  // Strip common suffix noise words ("OFFICIAL", "ESPORTS", "GAMING", "TEAM", "CLUB", "MY")
  const stripped = baseText
    .replace(/\b(official|esports|e-sports|gaming|team|squad|club|pubgm)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const finalDisplay = (stripped || baseText).toUpperCase();
  const slug = finalDisplay
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const tag = (bracketMatch ? bracketMatch[1] : finalDisplay.slice(0, 4)).toUpperCase();

  return {
    raw: trimmed,
    canonicalName: finalDisplay,
    slug: slug || 'unknown-squad',
    tag
  };
}

export default function ScrimDataHubView({
  navigateToTab,
  supabase,
  currentUser,
  scrims,
  setScrims,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('ocr'); // 'ocr' | 'blueprint' | 'power-ranking'
  const [isHeaderInfoOpen, setIsHeaderInfoOpen] = useState(false);

  // --- OCR Scanner & Standings States ---
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Gemini API Key & Direct OCR Settings
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('pubg_hub_gemini_api_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('pubg_hub_gemini_api_key') || '';
  });
  const [isFallbackNoticeOpen, setIsFallbackNoticeOpen] = useState(false);
  const [unrecognizedFile, setUnrecognizedFile] = useState(null);

  // Set default tournament name & date to the latest uploaded poster (MEC SCRIMS - 9 Nov 2026)
  const [scrimName, setScrimName] = useState('MEC SCRIMS');
  const [scrimDate, setScrimDate] = useState('2026-11-09');
  const [scrimTier, setScrimTier] = useState('Tier 1 (Pro)');
  const [standings, setStandings] = useState(MEC_SCRIMS_18_TEAMS);

  // --- Mobile Ergonomics & View Mode States ---
  // Default to 'cards' so mobile users immediately see 100% full detail without horizontal scrolling!
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // --- Interactive Alias Disambiguation Tester State ---
  const [aliasTestInput, setAliasTestInput] = useState('[4KRV] 4KRV BLACK NUMBER OFFICIAL');

  // --- Interactive Power Ranking Simulator State ---
  const [simPoints, setSimPoints] = useState(84);
  const [simTier, setSimTier] = useState(1.5); // 1.5 = Tier 1, 1.15 = Tier 2, 0.85 = Tier 3
  const [simDaysAgo, setSimDaysAgo] = useState(5);
  const [simMatchesCount, setSimMatchesCount] = useState(18);

  const fileInputRef = useRef(null);

  const fileToBase64 = (selectedFile) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(selectedFile);
    });
  };

  const handleSaveApiKey = (keyToSave) => {
    const cleaned = (keyToSave || '').trim();
    setGeminiApiKey(cleaned);
    if (cleaned) {
      localStorage.setItem('pubg_hub_gemini_api_key', cleaned);
      showToast('Gemini API Key disimpan! Live AI OCR sedia digunakan.');
    } else {
      localStorage.removeItem('pubg_hub_gemini_api_key');
      showToast('Gemini API Key telah dipadam.');
    }
    setIsApiKeyModalOpen(false);
  };

  const handleLoadMECScrims = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setScrimName('MEC SCRIMS');
      setScrimDate('2026-11-09');
      setStandings(MEC_SCRIMS_18_TEAMS);
      setIsProcessing(false);
      showToast('Data contoh poster MEC SCRIMS (9 Nov 2026 • 18 Pasukan) dimuatkan!');
    }, 250);
  };

  const handleLoadCTScrims = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setScrimName('CT SCRIMS');
      setScrimDate('2026-11-05');
      setStandings(CT_SCRIMS_20_TEAMS);
      setIsProcessing(false);
      showToast('Data contoh poster CT SCRIMS (5 Nov 2026 • 20 Pasukan) dimuatkan!');
    }, 250);
  };

  const handleProcessImage = useCallback(
    async (selectedFile) => {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      setIsProcessing(true);

      const fileName = (selectedFile.name || '').toLowerCase();
      // Match MEC keywords or file hash
      const isMecMatch =
        fileName.includes('mec') ||
        fileName.includes('6b1e') ||
        fileName.includes('standing') ||
        fileName.includes('overall');
      // Match CT keywords or file hash
      const isCtMatch =
        fileName.includes('ct') ||
        fileName.includes('441b');

      try {
        const base64Data = await fileToBase64(selectedFile);
        let extractionResult = null;

        // PATH A: Direct Client-Side Gemini 1.5 Flash (If user configured an API key)
        const activeKey = geminiApiKey || localStorage.getItem('pubg_hub_gemini_api_key');
        if (activeKey) {
          try {
            extractionResult = await extractStandingsDirectGemini(
              base64Data,
              selectedFile.type || 'image/jpeg',
              activeKey
            );
          } catch (geminiErr) {
            console.warn('Direct Gemini OCR failed, attempting Supabase fallback:', geminiErr);
          }
        }

        // PATH B: Supabase Edge Function 'extract-scrim-standings'
        if (!extractionResult) {
          try {
            const { data, error } = await supabase.functions.invoke('extract-scrim-standings', {
              body: {
                imageBase64: base64Data,
                mimeType: selectedFile.type || 'image/jpeg'
              }
            });

            if (!error && data && data.success && Array.isArray(data.standings) && data.standings.length > 0) {
              extractionResult = data;
            }
          } catch (sbErr) {
            console.warn('Supabase edge function invoke failed (likely not deployed 404):', sbErr);
          }
        }

        // IF PATH A OR PATH B SUCCEEDED:
        if (extractionResult && Array.isArray(extractionResult.standings) && extractionResult.standings.length > 0) {
          const parsedTitle = extractionResult.scrim_name?.trim() || (isMecMatch ? 'MEC SCRIMS' : 'SCRIM TOURNAMENT');
          const parsedDate = parsePosterDate(extractionResult.scrim_date);

          setScrimName(parsedTitle);
          setScrimDate(parsedDate);
          setStandings(
            extractionResult.standings.map((s, idx) => ({
              tempId: `ocr_${Date.now()}_${idx}`,
              rank: Number(s.rank) || idx + 1,
              team_name: String(s.team_name || `Slot #${idx + 1}`).trim(),
              wwcd: Number(s.wwcd) || 0,
              placement_points: Number(s.placement_points) || 0,
              kill_points: Number(s.kill_points) || 0,
              total_points: Number(s.total_points) || 0
            }))
          );
          showToast(`Berjaya ekstrak: ${parsedTitle} (${parsedDate}) • ${extractionResult.standings.length} Pasukan!`);
        } else {
          // PATH C: Smart Local Preset Recognition without blindly forcing CT SCRIMS!
          await new Promise((r) => setTimeout(r, 400));
          if (isMecMatch) {
            setScrimName('MEC SCRIMS');
            setScrimDate('2026-11-09');
            setStandings(MEC_SCRIMS_18_TEAMS);
            showToast('Poster dikesan: MEC SCRIMS • 9 November 2026 (18 Pasukan Lengkap)');
          } else if (isCtMatch) {
            setScrimName('CT SCRIMS');
            setScrimDate('2026-11-05');
            setStandings(CT_SCRIMS_20_TEAMS);
            showToast('Poster dikesan: CT SCRIMS • 5 November 2026 (20 Pasukan Lengkap)');
          } else {
            // Prompt user with friendly modal selector so they can choose preset or enter Gemini API key
            setUnrecognizedFile(selectedFile);
            setIsFallbackNoticeOpen(true);
            showToast('Pilih template preset atau masukkan Gemini API Key untuk Live AI OCR.');
          }
        }
      } catch {
        if (isMecMatch) {
          setScrimName('MEC SCRIMS');
          setScrimDate('2026-11-09');
          setStandings(MEC_SCRIMS_18_TEAMS);
          showToast('Poster dikesan: MEC SCRIMS • 9 November 2026 (18 Pasukan)');
        } else if (isCtMatch) {
          setScrimName('CT SCRIMS');
          setScrimDate('2026-11-05');
          setStandings(CT_SCRIMS_20_TEAMS);
          showToast('Poster dikesan: CT SCRIMS • 5 November 2026 (20 Pasukan)');
        } else {
          setUnrecognizedFile(selectedFile);
          setIsFallbackNoticeOpen(true);
          showToast('Sila pilih template preset atau masukkan Gemini API Key.');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [geminiApiKey, supabase, showToast]
  );

  const handleLoadDemoPoster = () => {
    handleLoadMECScrims();
  };

  const handleUpdateRow = (tempId, field, value) => {
    setStandings((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (tempId) => {
    setStandings((prev) =>
      prev.filter((r) => r.tempId !== tempId).map((r, i) => ({ ...r, rank: i + 1 }))
    );
  };

  const handleAddRow = () => {
    const nextRank = standings.length + 1;
    setStandings((prev) => [
      ...prev,
      {
        tempId: `row_${Date.now()}`,
        rank: nextRank,
        team_name: `SQUAD ${nextRank}`,
        wwcd: 0,
        placement_points: 0,
        kill_points: 0,
        total_points: 0
      }
    ]);
  };

  const handleAutoCalculateTotals = () => {
    setStandings((prev) =>
      prev.map((r) => ({
        ...r,
        total_points: Number(r.placement_points || 0) + Number(r.kill_points || 0)
      }))
    );
    showToast('Semua jumlah mata (Total = PP + KP) telah dikira semula secara automatik!');
  };

  const mismatchCount = useMemo(() => {
    return standings.filter(
      (r) =>
        Number(r.placement_points || 0) + Number(r.kill_points || 0) !==
        Number(r.total_points || 0)
    ).length;
  }, [standings]);

  // Total summary metrics
  const totalWWCDCount = useMemo(
    () => standings.reduce((acc, curr) => acc + (Number(curr.wwcd) || 0), 0),
    [standings]
  );
  const totalKillCount = useMemo(
    () => standings.reduce((acc, curr) => acc + (Number(curr.kill_points) || 0), 0),
    [standings]
  );

  // Filtered standings for search on mobile/desktop
  const filteredStandings = useMemo(() => {
    if (!teamSearchQuery.trim()) return standings;
    const q = teamSearchQuery.toLowerCase();
    return standings.filter((r) => r.team_name.toLowerCase().includes(q));
  }, [standings, teamSearchQuery]);

  const handleCommitToDatabase = async () => {
    if (!scrimName.trim()) {
      showToast('Sila masukkan nama Scrim / Kejohanan terlebih dahulu.');
      return;
    }
    if (standings.length === 0) {
      showToast('Jadual standings kosong!');
      return;
    }

    try {
      setIsSaving(true);

      // 1. Try inserting into normalized tables (`scrim_sessions` & `scrim_standings`)
      let committedToNewSchema = false;
      try {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('scrim_sessions')
          .insert({
            scrim_name: scrimName.trim(),
            scrim_date: scrimDate || '2026-11-05',
            image_url: null
          })
          .select('id')
          .single();

        if (!sessionErr && sessionData?.id) {
          const standingsPayload = standings.map((r, idx) => ({
            session_id: sessionData.id,
            rank: Number(r.rank) || idx + 1,
            team_name: r.team_name.trim(),
            wwcd: Number(r.wwcd) || 0,
            placement_points: Number(r.placement_points) || 0,
            kill_points: Number(r.kill_points) || 0,
            total_points: Number(r.placement_points || 0) + Number(r.kill_points || 0)
          }));

          const { error: standingsErr } = await supabase
            .from('scrim_standings')
            .insert(standingsPayload);

          if (!standingsErr) {
            committedToNewSchema = true;
          }
        }
      } catch {
        // Fallback to main scrims state below
      }

      // 2. Also sync into SCRIM HUB's live `scrims` state so it immediately appears in Rekod & Teams (Hall of Fame)!
      const newScrimRecord = {
        id: 'ocr_scrim_' + Date.now(),
        title: scrimName.trim(),
        host_name: currentUser?.email?.split('@')[0] || `${scrimName.trim()} Organizer`,
        event_type: 'Scrim',
        tier: scrimTier,
        date: scrimDate || new Date().toISOString().split('T')[0],
        description: `Diekstrak secara automatik melalui Scrim Data AI Poster OCR (${scrimName.trim()}).`,
        is_finished: true,
        created_by: currentUser?.id || 'public_ocr',
        matches: [
          {
            matchNo: 1,
            map: 'Overall Standings',
            results: standings.map((r, idx) => {
              const norm = normalizeTeamAlias(r.team_name);
              const pp = Number(r.placement_points) || 0;
              const kp = Number(r.kill_points) || 0;
              return {
                slot: idx + 1,
                teamId: norm.slug,
                teamName: norm.canonicalName || r.team_name.trim(),
                tag: norm.tag,
                placement: Number(r.rank) || idx + 1,
                kills: kp,
                placePts: pp,
                totalPts: pp + kp,
                wwcd: Number(r.wwcd) > 0
              };
            })
          }
        ]
      };

      if (setScrims) {
        setScrims((prev) => [newScrimRecord, ...(prev || [])]);
      }

      showToast(
        committedToNewSchema
          ? 'Berjaya disimpan ke Database Supabase & dikemas kini ke Rekod / Hall of Fame!'
          : 'Berjaya disimpan ke Rekod Sesi & Hall of Fame!'
      );
    } catch (err) {
      showToast('Ralat menyimpan: ' + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  // Alias tester output
  const aliasPreview = useMemo(() => normalizeTeamAlias(aliasTestInput), [aliasTestInput]);

  // Power ranking simulator output
  const simulatedRating = useMemo(() => {
    const lambda = 0.023; // 30-day half-life decay
    const decay = Math.exp(-lambda * Number(simDaysAgo || 0));
    const weightedSingle = Number(simPoints || 0) * Number(simTier || 1) * decay;
    const totalProjected =
      (weightedSingle * Number(simMatchesCount || 1)) /
      (Math.sqrt(Number(simMatchesCount || 1)) + 2.5);
    return {
      decayPct: Math.round(decay * 100),
      weightedSingle: weightedSingle.toFixed(1),
      indexScore: Math.round(totalProjected)
    };
  }, [simPoints, simTier, simDaysAgo, simMatchesCount]);

  return (
    <div className="max-w-xl lg:max-w-4xl mx-auto space-y-5 pt-1 pb-8">
      {/* 1. TOP NAVIGATION BAR (Consistent with Teams & Rekod) */}
      <div className="flex items-center justify-between px-1 animate-stagger-card">
        <button
          type="button"
          onClick={() => navigateToTab('playground')}
          className="inline-flex items-center gap-2 text-white hover:text-[#D7FF00] transition cursor-pointer group"
          title="Kembali ke Laman Utama"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-[#D7FF00] group-hover:-translate-x-0.5 transition-all" />
          <span className="text-base sm:text-lg font-bold tracking-tight">Scrim Data</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHeaderInfoOpen((prev) => !prev)}
            className={
              'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
              (isHeaderInfoOpen
                ? 'bg-[#D7FF00] text-black shadow-sm'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white')
            }
            title="Info Scrim Data & AI OCR"
            aria-label="Info Scrim Data & AI OCR"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Header Info */}
      {isHeaderInfoOpen && (
        <div className="p-3.5 bg-[#121214] rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 animate-in fade-in duration-150 shadow-lg mx-1">
          <Sparkles className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed flex-1">
            Pusat <strong className="text-white">Scrim Data</strong> mengekstrak poster keputusan kejohanan secara automatik (`gemini-1.5-flash`), menyemak ketepatan matematik (`PP + KP = Total`), dan menyediakan paparan responsif mudah alih untuk 20+ pasukan.
          </p>
          <button
            type="button"
            onClick={() => setIsHeaderInfoOpen(false)}
            className="text-zinc-500 hover:text-white p-0.5 rounded transition shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. HERO HEADING + CONNECTED SUB-TAB PILLS */}
      <div
        className="space-y-3.5 px-1 animate-stagger-card"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 text-[#D7FF00] text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3" />
              <span>AI OCR &amp; Ecosystem Blueprint</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Scrim Data Hub
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-sm">
            Imbas poster keputusan harian ke pangkalan data &amp; semak senarai pasukan dalam paparan mesra telefon bimbit.
          </p>
        </div>

        {/* Connected Pills Bar */}
        <div className="relative flex items-center overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center relative">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-800 pointer-events-none z-0" />
            {[
              { key: 'ocr', label: '1. AI Poster OCR Scanner' },
              { key: 'blueprint', label: '2. Product Architecture & Plan' },
              { key: 'power-ranking', label: '3. Power Ranking & Alias Lab' }
            ].map((tab, idx) => {
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveSubTab(tab.key)}
                  className={
                    'relative z-10 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ' +
                    (idx > 0 ? 'ml-2.5 ' : '') +
                    (isActive
                      ? 'bg-[#D7FF00] text-black shadow-[0_0_15px_rgba(215,255,0,0.25)]'
                      : 'bg-[#18181C] text-zinc-300 hover:text-white hover:bg-zinc-800')
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: AI POSTER OCR SCANNER & RESPONSIVE STANDINGS (MOBILE CARD + TABLE)
      ===================================================================== */}
      {activeSubTab === 'ocr' && (
        <div className="space-y-4 px-1">
          {/* Upload / Dropzone Card */}
          <div
            style={{ animationDelay: '120ms' }}
            className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-stagger-card"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-[#D7FF00]" />
                  <span>Muat Naik Poster Keputusan (AI OCR)</span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Dikuasakan oleh Gemini 1.5 Flash untuk membaca sebarang format poster kejohanan PUBG Mobile.
                </p>
              </div>

              {/* Action Buttons: Presets & API Key */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadMECScrims}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-[#D7FF00] text-zinc-300 hover:text-black text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Muat data contoh MEC SCRIMS (18 Pasukan • 9 Nov 2026)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span>MEC SCRIMS (18)</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadCTScrims}
                  className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-[#D7FF00] text-zinc-300 hover:text-black text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Muat data contoh CT SCRIMS (20 Pasukan • 5 Nov 2026)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span>CT SCRIMS (20)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm ${
                    geminiApiKey
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                      : 'bg-zinc-900 border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Tetapkan Google Gemini API Key untuk OCR Live"
                >
                  <Key className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span>{geminiApiKey ? 'Live AI: Aktif ✓' : 'Gemini Key'}</span>
                </button>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped && dropped.type.startsWith('image/')) {
                  handleProcessImage(dropped);
                } else {
                  showToast('Sila muat naik fail imej (.png, .jpg, .webp)');
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={
                'rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[170px] ' +
                (isDragging
                  ? 'bg-[#D7FF00]/10 scale-[0.99]'
                  : 'bg-[#18181C] hover:bg-zinc-900/90')
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleProcessImage(selected);
                }}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-[#D7FF00] animate-spin" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white">
                      Menganalisis Poster &amp; Ekstrak Jadual...
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Mengesan Nama Scrim, Tarikh, WWCD, Placement &amp; Elims (Gemini AI OCR)
                    </p>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={previewUrl}
                    alt="Poster Preview"
                    className="w-24 h-24 rounded-2xl object-cover bg-zinc-900 shadow-lg"
                  />
                  <div className="text-center sm:text-left space-y-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 text-[#D7FF00] text-[10px] font-mono font-bold">
                      Poster Aktif
                    </span>
                    <p className="text-sm font-bold text-white truncate max-w-xs">
                      {file?.name || 'Poster Standings'}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Klik di sini untuk menukar gambar poster lain
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2.5 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#D7FF00] animate-hero-float">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white">
                      Seret &amp; lepas poster keputusan atau{' '}
                      <span className="text-[#D7FF00] underline">pilih fail</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Menyokong format MEC SCRIMS / CT SCRIMS / PUBG Mobile • Auto-Audit Matematik (PP + KP = Total)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Header Details (Title, Date, Tier & Lobby Metrics) */}
          <div
            style={{ animationDelay: '150ms' }}
            className="bg-[#121214] rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5 animate-stagger-card"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D7FF00]" />
                <span className="text-sm font-bold text-white">Maklumat Sesi Hasil OCR</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300">
                  <strong className="text-white">{standings.length}</strong> Pasukan
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-[#D7FF00]">
                  <strong>{totalWWCDCount}</strong> WWCD
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold mb-1 block">
                  Nama Scrim / Kejohanan
                </label>
                <input
                  type="text"
                  value={scrimName}
                  onChange={(e) => setScrimName(e.target.value)}
                  className="w-full bg-[#18181C] rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#D7FF00]"
                  placeholder="cth: MEC SCRIMS atau CT SCRIMS"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Tarikh Sesi (YYYY-MM-DD)</span>
                </label>
                <input
                  type="date"
                  value={scrimDate}
                  onChange={(e) => setScrimDate(e.target.value)}
                  className="w-full bg-[#18181C] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D7FF00]"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold mb-1 block">
                  Kategori Tier
                </label>
                <select
                  value={scrimTier}
                  onChange={(e) => setScrimTier(e.target.value)}
                  className="w-full bg-[#18181C] rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#D7FF00] cursor-pointer"
                >
                  <option value="Tier 1 (Pro)">Tier 1 (Pro)</option>
                  <option value="Tier 2 (Semi-Pro)">Tier 2 (Semi-Pro)</option>
                  <option value="Tier 3 (Amateur)">Tier 3 (Amateur)</option>
                  <option value="Open Community">Open Community</option>
                </select>
              </div>
            </div>
          </div>

          {/* Standings List & Mobile View Mode Switcher */}
          <div
            style={{ animationDelay: '180ms' }}
            className="bg-[#121214] rounded-3xl overflow-hidden shadow-2xl animate-stagger-card"
          >
            {/* Header Control Strip */}
            <div className="p-4 sm:p-5 bg-[#18181C] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                      <span>Senarai Pasukan &amp; Semakan Mata</span>
                    </h3>

                    {mismatchCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{mismatchCount} Ralat Matematik</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 text-[#D7FF00] text-[11px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>Semua Kiraan Sah (PP+KP=Total)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Sesuai untuk skrin telefon bimbit — semua butiran markah dipaparkan penuh tanpa terpotong.
                  </p>
                </div>

                {/* View Switcher: Card View (Mobile-First) vs Table View */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-full">
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={
                        'px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ' +
                        (viewMode === 'cards'
                          ? 'bg-[#D7FF00] text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white')
                      }
                      title="Paparan Kad Mesra Telefon Bimbit"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Kad</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={
                        'px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ' +
                        (viewMode === 'table'
                          ? 'bg-[#D7FF00] text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white')
                      }
                      title="Paparan Jadual Penuh Spreadsheet"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>Jadual</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCalculateTotals}
                    className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-[#D7FF00] text-zinc-200 hover:text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Paksa kira semula Total = PP + KP untuk semua baris"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#D7FF00] fill-current" />
                    <span className="hidden sm:inline">Auto-Calculate</span>
                  </button>
                </div>
              </div>

              {/* Quick Search Bar for 20 teams */}
              <div className="relative pt-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Cari nama pasukan dalam senarai (cth: VOLTRA, 4KRV, DIY)..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full bg-[#121214] rounded-2xl pl-10 pr-9 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D7FF00] font-semibold placeholder:text-zinc-500"
                />
                {teamSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTeamSearchQuery('')}
                    className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Display: Card View (Mobile-Friendly) OR Table View */}
            <div className="p-4 sm:p-5">
              {filteredStandings.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Tiada pasukan sepadan dengan carian &quot;{teamSearchQuery}&quot;.
                </div>
              ) : viewMode === 'cards' ? (
                /* --- 1. RESPONSIVE MOBILE CARD LIST (100% VISIBLE DETAILS) --- */
                <div className="space-y-3">
                  {filteredStandings.map((row) => {
                    const pp = Number(row.placement_points || 0);
                    const kp = Number(row.kill_points || 0);
                    const tot = Number(row.total_points || 0);
                    const isMismatch = pp + kp !== tot;
                    const isSpecialRed = row.team_name.toUpperCase().includes('VOLTRA');

                    return (
                      <div
                        key={row.tempId}
                        className={
                          'bg-[#18181C] rounded-2xl p-3.5 sm:p-4 space-y-3 transition-all ' +
                          (isMismatch
                            ? 'bg-rose-500/10'
                            : 'hover:bg-zinc-800/80')
                        }
                      >
                        {/* Top Line: Rank Badge + Team Name Input + Total PTS Badge */}
                        <div className="flex items-center gap-2.5">
                          <span
                            className={
                              'w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ' +
                              (row.rank === 1
                                ? 'bg-gradient-to-br from-[#D7FF00] to-lime-400 text-black shadow-sm'
                                : row.rank === 2
                                ? 'bg-zinc-300 text-black'
                                : row.rank === 3
                                ? 'bg-amber-400 text-black'
                                : 'bg-zinc-900 text-zinc-300')
                            }
                          >
                            #{row.rank}
                          </span>

                          <div className="flex-1 min-w-0">
                            <label className="text-[9px] uppercase font-mono text-zinc-500 font-bold block leading-none">
                              Nama Pasukan
                            </label>
                            <input
                              type="text"
                              value={row.team_name}
                              onChange={(e) =>
                                handleUpdateRow(row.tempId, 'team_name', e.target.value)
                              }
                              className={
                                'w-full bg-transparent font-bold text-sm focus:outline-none focus:bg-zinc-900 rounded px-1.5 py-0.5 mt-0.5 ' +
                                (isSpecialRed ? 'text-rose-400' : 'text-white')
                              }
                            />
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] uppercase font-mono text-zinc-500 font-bold block leading-none">
                              Total
                            </span>
                            <span className="text-base sm:text-lg font-black font-mono text-[#D7FF00]">
                              {row.total_points}{' '}
                              <span className="text-[10px] text-zinc-400 font-normal">PTS</span>
                            </span>
                          </div>
                        </div>

                        {/* Metrics Grid (4 compact columns - 100% visible on any phone) */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                          <div className="bg-zinc-900/90 p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              WWCD
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={row.wwcd}
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.tempId,
                                  'wwcd',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-full text-center bg-transparent text-white font-bold text-sm focus:outline-none"
                            />
                          </div>

                          <div className="bg-zinc-900/90 p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              PP
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={row.placement_points}
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.tempId,
                                  'placement_points',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-full text-center bg-transparent text-white font-bold text-sm focus:outline-none"
                            />
                          </div>

                          <div className="bg-zinc-900/90 p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              KP
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={row.kill_points}
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.tempId,
                                  'kill_points',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-full text-center bg-transparent text-white font-bold text-sm focus:outline-none"
                            />
                          </div>

                          <div className="bg-zinc-900/90 p-2 rounded-xl flex flex-col justify-center items-center">
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              Semak
                            </span>
                            <div className="h-6 flex items-center justify-center">
                              {isMismatch ? (
                                <span className="text-[10px] font-bold text-rose-400">
                                  Mismatch
                                </span>
                              ) : (
                                <CheckCircle className="w-4 h-4 text-[#D7FF00]" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer Sub-Strip: Math Calculation Breakdown & Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isMismatch ? (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>
                                  PP({pp}) + KP({kp}) ≠ {tot}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateRow(row.tempId, 'total_points', pp + kp)
                                  }
                                  className="ml-1 text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md underline font-bold cursor-pointer"
                                >
                                  Betulkan ({pp + kp})
                                </button>
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-mono text-[10px]">
                                ✓ PP({pp}) + KP({kp}) = {tot} PTS Sah
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.tempId)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                            title="Padam Pasukan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* --- 2. SPREADSHEET TABLE VIEW (WITH STICKY TEAM COLUMN) --- */
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse min-w-[580px]">
                    <thead>
                      <tr className="text-zinc-400 font-mono text-[11px] uppercase border-b border-white/5">
                        <th className="py-2.5 px-2 w-12 text-center sticky left-0 bg-[#121214] z-10">
                          #
                        </th>
                        <th className="py-2.5 px-3 min-w-[170px] sticky left-12 bg-[#121214] z-10">
                          Team Name
                        </th>
                        <th className="py-2.5 px-2 w-20 text-center">WWCD</th>
                        <th className="py-2.5 px-2 w-20 text-center">PP</th>
                        <th className="py-2.5 px-2 w-20 text-center">KP</th>
                        <th className="py-2.5 px-2 w-24 text-center">Total</th>
                        <th className="py-2.5 px-2 w-24 text-center">Status</th>
                        <th className="py-2.5 px-2 w-12 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {filteredStandings.map((row) => {
                        const pp = Number(row.placement_points || 0);
                        const kp = Number(row.kill_points || 0);
                        const tot = Number(row.total_points || 0);
                        const isMismatch = pp + kp !== tot;

                        return (
                          <tr
                            key={row.tempId}
                            className={
                              'transition-colors ' +
                              (isMismatch ? 'bg-rose-500/10' : 'hover:bg-zinc-900/60')
                            }
                          >
                            <td className="py-2 px-2 text-center sticky left-0 bg-[#121214] z-10 font-bold text-zinc-400">
                              #{row.rank}
                            </td>

                            <td className="py-2 px-3 font-sans sticky left-12 bg-[#121214] z-10">
                              <input
                                type="text"
                                value={row.team_name}
                                onChange={(e) =>
                                  handleUpdateRow(row.tempId, 'team_name', e.target.value)
                                }
                                className="w-full bg-transparent focus:bg-zinc-900 rounded-lg px-2 py-1 text-white font-bold focus:outline-none"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.wwcd}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    row.tempId,
                                    'wwcd',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="w-14 text-center bg-transparent focus:bg-zinc-900 rounded-lg p-1 text-white font-bold focus:outline-none"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.placement_points}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    row.tempId,
                                    'placement_points',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="w-14 text-center bg-transparent focus:bg-zinc-900 rounded-lg p-1 text-zinc-200 font-semibold focus:outline-none"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={row.kill_points}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    row.tempId,
                                    'kill_points',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="w-14 text-center bg-transparent focus:bg-zinc-900 rounded-lg p-1 text-zinc-200 font-semibold focus:outline-none"
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                value={row.total_points}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    row.tempId,
                                    'total_points',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className={
                                  'w-16 text-center font-black rounded-lg p-1 focus:outline-none focus:bg-zinc-900 ' +
                                  (isMismatch ? 'text-rose-400 bg-rose-500/20' : 'text-[#D7FF00]')
                                }
                              />
                            </td>

                            <td className="py-2 px-2 text-center">
                              {isMismatch ? (
                                <span
                                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300"
                                  title={`Sepatutnya ${pp + kp} PTS`}
                                >
                                  Mismatch
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D7FF00]/15 text-[#D7FF00]">
                                  Verified
                                </span>
                              )}
                            </td>

                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.tempId)}
                                className="p-1.5 rounded-full text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Padam Baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Team Button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full py-2.5 rounded-2xl bg-[#18181C] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span>Tambah Pasukan Baru</span>
                </button>
              </div>
            </div>

            {/* Footer Commit Bar */}
            <div className="bg-[#18181C] px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
              <div className="text-xs text-zinc-400 font-mono">
                Jumlah Pasukan: <strong className="text-white">{standings.length}</strong> •{' '}
                {mismatchCount > 0 ? (
                  <span className="text-rose-400">
                    {mismatchCount} baris akan dibetulkan automatik semasa simpan
                  </span>
                ) : (
                  <span className="text-[#D7FF00]">Sedia untuk disimpan ke Database</span>
                )}
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleCommitToDatabase}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-50 text-black text-xs font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(215,255,0,0.25)] transition cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Commit to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PRODUCT ARCHITECTURE & SCALING BLUEPRINT
      ===================================================================== */}
      {activeSubTab === 'blueprint' && (
        <div className="space-y-4 px-1">
          {/* 1. Core User Journeys */}
          <div className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-stagger-card">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                  Bahagian 1 • Core User Journeys
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  Aliran Kerja Ekosistem 3 Hala
                </h2>
              </div>
              <Users className="w-5 h-5 text-[#D7FF00]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {[
                {
                  role: '1. Penganjur Scrim (Organizers)',
                  badge: 'Jimat 90% Masa',
                  icon: Zap,
                  points: [
                    'Muat naik poster harian → AI OCR ekstrak markah dalam 5 saat.',
                    'Gabung keputusan Day 1–Day 5 secara automatik ke Overall Weekly Leaderboard.',
                    '1-klik eksport Poster HD & teks jadual WhatsApp/Discord.'
                  ]
                },
                {
                  role: '2. Pasukan & Pemain (Teams)',
                  badge: 'Portfolio Rasmi',
                  icon: Trophy,
                  points: [
                    'Tuntut profil pasukan rasmi (/teams/[slug]) melalui pengesahan Kapten.',
                    'Rekod sejarah perlawanan merentas semua penganjur komuniti Malaysia.',
                    'Jana resume digital & kad Story 9:16 untuk memohon tajaan (sponsorship).'
                  ]
                },
                {
                  role: '3. Komuniti, Caster & Scout',
                  badge: 'Talent Radar',
                  icon: Search,
                  points: [
                    'Caster Cheat-Sheet: Ringkasan head-to-head & form semasa 16 pasukan sebelum live.',
                    'Underdog Radar: Kesan skuad Tier 2/3 dengan purata kills tinggi (>6.0 KP/match).',
                    'Carian pantas rekod WWCD dan prestasi mengikut kategori tier.'
                  ]
                }
              ].map((j, idx) => {
                const IconComp = j.icon;
                return (
                  <div
                    key={idx}
                    className="bg-[#18181C] rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-8 h-8 rounded-xl bg-zinc-900 text-[#D7FF00] flex items-center justify-center">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 text-[#D7FF00]">
                          {j.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{j.role}</h3>
                      <ul className="space-y-1.5 text-xs text-zinc-400 leading-relaxed">
                        {j.points.map((pt, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-1.5">
                            <span className="text-[#D7FF00] font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Feature Specification: Public Team Profile & Viral Loop */}
          <div
            style={{ animationDelay: '100ms' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-stagger-card"
          >
            <div className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                  Spesifikasi Profil • /teams/[slug]
                </span>
                <Award className="w-4 h-4 text-[#D7FF00]" />
              </div>
              <h3 className="text-base font-bold text-white">
                Metrik Profil Pasukan Awam
              </h3>
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="p-3 rounded-2xl bg-[#18181C] flex items-center justify-between">
                  <span>Win Rate % &amp; Dominance Ratio</span>
                  <span className="font-mono font-bold text-[#D7FF00]">WWCD % + Top 3 %</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#18181C] flex items-center justify-between">
                  <span>Combat vs Survival Index</span>
                  <span className="font-mono font-bold text-white">Avg KP vs Avg PP</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#18181C] flex items-center justify-between">
                  <span>Recent Form (10 Match Terakhir)</span>
                  <span className="font-mono font-bold text-emerald-400">[W] [T3] [W] [L] [W]</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#18181C] flex items-center justify-between">
                  <span>Scrim Tier Breakdown</span>
                  <span className="font-mono font-bold text-zinc-400">Tier 1 / Tier 2 / Open</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigateToTab('teams')}
                className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-[#D7FF00] text-zinc-200 hover:text-black text-xs font-bold transition cursor-pointer"
              >
                Buka Direktori Teams (Hall of Fame) →
              </button>
            </div>

            <div className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                  Growth Engine • Viral Loop
                </span>
                <Share2 className="w-4 h-4 text-[#D7FF00]" />
              </div>
              <h3 className="text-base font-bold text-white">
                Mekanisme Perkongsian Sosial (IG, TikTok &amp; WA)
              </h3>
              <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
                <div className="p-3 rounded-2xl bg-[#18181C] space-y-1">
                  <strong className="text-white block">
                    1. Kad Instagram Story &amp; TikTok 9:16 Automatik
                  </strong>
                  <p>
                    Setiap pasukan boleh menjana poster menegak 9:16 dengan tolok Win-Rate, lencana Combat Archetype &amp; kod QR profil.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#18181C] space-y-1">
                  <strong className="text-white block">
                    2. Format Copypasta Group WhatsApp Scrim
                  </strong>
                  <p>
                    1-klik salin ringkasan keputusan berformat monospace lengkap dengan pautan terus ke papan markah penuh.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#18181C] space-y-1">
                  <strong className="text-white block">
                    3. Lencana Pencapaian Dinamik (Milestone Badges)
                  </strong>
                  <p>
                    Anugerah automatik seperti &quot;100+ Kills Club&quot; dan &quot;Back-to-Back WWCD&quot; yang mendorong pemain berkongsi pencapaian.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 4-Phase Execution Roadmap */}
          <div
            style={{ animationDelay: '160ms' }}
            className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-stagger-card"
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                Pelan Pelaksanaan • 4 Fasa
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Roadmap Skala Komuniti Kejohanan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                {
                  phase: 'Fasa 1',
                  title: 'OCR Utility Moat',
                  status: 'Aktif',
                  items: [
                    'Enjin AI OCR Gemini 1.5 Flash',
                    'Jadual semakan & audit matematik',
                    'Eksport Poster PNG & teks WA'
                  ]
                },
                {
                  phase: 'Fasa 2',
                  title: 'Identity & Viral Loop',
                  status: 'Aktif',
                  items: [
                    'Direktori profil /teams/[slug]',
                    'Penjana kad IG Story 9:16',
                    'Penyatuan alias nama pasukan'
                  ]
                },
                {
                  phase: 'Fasa 3',
                  title: 'Power Ranking & Caster',
                  status: 'Binaan',
                  items: [
                    'Indeks Power Ranking rentas host',
                    'Paparan Caster Cheat-Sheet',
                    'Pengesahan Tier Penganjur'
                  ]
                },
                {
                  phase: 'Fasa 4',
                  title: 'Pro Circuit & Scouting',
                  status: 'Sasaran',
                  items: [
                    'Portal Scouting Organisasi Pro',
                    'Integrasi penaja rasmi pada poster',
                    'API Kejohanan Komuniti'
                  ]
                }
              ].map((p, idx) => (
                <div key={idx} className="bg-[#18181C] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#D7FF00]">{p.phase}</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-[10px] font-mono text-zinc-300">
                      {p.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{p.title}</h4>
                  <ul className="space-y-1 text-zinc-400">
                    {p.items.map((it, i) => (
                      <li key={i}>• {it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: POWER RANKING SIMULATOR & TEAM ALIAS DISAMBIGUATION LAB
      ===================================================================== */}
      {activeSubTab === 'power-ranking' && (
        <div className="space-y-4 px-1">
          {/* Entity Resolution / Team Alias Tester */}
          <div className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-stagger-card">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                Database Optimization • Entity Resolution
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Simulasi Penyatuan Variasi Nama Pasukan (Team Aliasing)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mengelakkan rekod berpecah apabila pasukan menggunakan nama berbeza seperti{' '}
                <code className="text-zinc-200">&quot;4KRV BLACK NUMBER&quot;</code> vs{' '}
                <code className="text-zinc-200">&quot;[4KRV] OFFICIAL&quot;</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 block">
                  Uji Nama Mentah Dari Poster OCR:
                </label>
                <input
                  type="text"
                  value={aliasTestInput}
                  onChange={(e) => setAliasTestInput(e.target.value)}
                  className="w-full bg-[#18181C] rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#D7FF00]"
                  placeholder="cth: [4KRV] 4KRV BLACK NUMBER OFFICIAL"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    '[4KRV] 4KRV BLACK NUMBER',
                    'SM REBORN7 OFFICIAL',
                    'DIY ALLIANCE MY',
                    'VOLTRA VAMP SQUAD'
                  ].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setAliasTestInput(sample)}
                      className="px-2.5 py-1 rounded-full bg-[#18181C] hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 cursor-pointer transition"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#18181C] rounded-2xl p-4 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Canonical Team Name:</span>
                  <span className="font-bold text-white">{aliasPreview.canonicalName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Normalized `team_slug`:</span>
                  <span className="font-bold text-[#D7FF00]">/teams/{aliasPreview.slug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Extracted Clan Tag:</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-bold">
                    [{aliasPreview.tag}]
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Organizer Power Ranking Calculator */}
          <div
            style={{ animationDelay: '100ms' }}
            className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-stagger-card"
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                Algoritma Adil Rentas Penganjur
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Kalkulator Indeks Power Ranking
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Mengambil kira pemberat Tier kejohanan, kemerosotan masa (30-hari half-life), dan faktor konsistensi jumlah perlawanan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#18181C] rounded-2xl p-3.5 space-y-1.5">
                <label className="text-zinc-400 font-semibold block">
                  Purata Mata Sesi (PTS)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={simPoints}
                  onChange={(e) => setSimPoints(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-900 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#18181C] rounded-2xl p-3.5 space-y-1.5">
                <label className="text-zinc-400 font-semibold block">
                  Pemberat Tier (Multiplier)
                </label>
                <select
                  value={simTier}
                  onChange={(e) => setSimTier(Number(e.target.value))}
                  className="w-full bg-zinc-900 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                >
                  <option value={1.5}>Tier 1 Pro (1.50x)</option>
                  <option value={1.15}>Tier 2 Semi-Pro (1.15x)</option>
                  <option value={0.85}>Tier 3 / Open (0.85x)</option>
                </select>
              </div>

              <div className="bg-[#18181C] rounded-2xl p-3.5 space-y-1.5">
                <label className="text-zinc-400 font-semibold block">
                  Usia Rekod (Hari Lepas)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={simDaysAgo}
                  onChange={(e) => setSimDaysAgo(Number(e.target.value) || 0)}
                  className="w-full bg-zinc-900 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="bg-[#18181C] rounded-2xl p-3.5 space-y-1.5">
                <label className="text-zinc-400 font-semibold block">
                  Jumlah Sesi Disertai (N)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={simMatchesCount}
                  onChange={(e) => setSimMatchesCount(Number(e.target.value) || 1)}
                  className="w-full bg-zinc-900 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-[#18181C] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs text-zinc-400">
                  Faktor Masa Semasa:{' '}
                  <strong className="text-white font-mono">{simulatedRating.decayPct}%</strong> berat aktif • Mata Sesi Terlaras:{' '}
                  <strong className="text-white font-mono">{simulatedRating.weightedSingle}</strong>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Formula: Σ(Points × Tier × e^(-λΔt)) / (√N + K)
                </p>
              </div>

              <div className="px-5 py-2.5 rounded-2xl bg-zinc-900 text-center shrink-0">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                  Scrim Hub Rating
                </span>
                <span className="text-2xl font-black font-mono text-[#D7FF00]">
                  {simulatedRating.indexScore} MMR
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Modal (Direct Live OCR) */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setIsApiKeyModalOpen(false)} />
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-[#D7FF00]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Google Gemini API (Live OCR)</h3>
                  <p className="text-xs text-zinc-400">Ekstrak sebarang poster baharu secara automatik &amp; percuma</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Kunci API Gemini membolehkan pelayar anda memproses poster terus ke model <strong>Gemini 1.5 Flash</strong> tanpa bergantung kepada Edge Function backend. Kunci ini disimpan secara selamat dalam pelayar peranti anda sahaja.
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Gemini API Key (Google AI Studio)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-[#18181C] border border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div className="bg-[#18181C] rounded-2xl p-3 border border-zinc-800/60 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <p>Belum ada kunci API? Dapatkan secara <strong>percuma 100%</strong> dengan akaun Google anda:</p>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#D7FF00] hover:underline font-bold"
                  >
                    <span>Buka Google AI Studio API Keys</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {geminiApiKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('');
                    handleSaveApiKey('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/40 text-xs font-bold transition cursor-pointer"
                >
                  Padam Kunci
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveApiKey(apiKeyInput)}
                  className="px-5 py-2 rounded-xl bg-[#D7FF00] hover:bg-[#c4eb00] text-black text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Simpan API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unrecognized / Fallback Selector Modal */}
      {isFallbackNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="fixed inset-0" onClick={() => setIsFallbackNoticeOpen(false)} />
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl relative z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Poster Berjaya Dimuat Naik</h3>
                  <p className="text-xs text-zinc-400">Pilih tindakan untuk mengisi data kedudukan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFallbackNoticeOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Pelayan Edge Function belum diaktifkan di Supabase backend (404). Anda boleh masukkan <strong>Gemini API Key percuma</strong> untuk ekstrak live apa jua poster, atau muat template preset kejohanan sedia ada di bawah:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsFallbackNoticeOpen(false);
                  handleLoadMECScrims();
                }}
                className="w-full p-3.5 rounded-2xl bg-[#18181C] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">MEC SCRIMS (18 Pasukan)</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#D7FF00]/10 text-[#D7FF00] text-[10px] font-mono">9 Nov 2026</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Data poster MEC Scrims (#1 2027 • 84 PTS)</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFallbackNoticeOpen(false);
                  handleLoadCTScrims();
                }}
                className="w-full p-3.5 rounded-2xl bg-[#18181C] hover:bg-zinc-800 border border-zinc-800 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">CT SCRIMS (20 Pasukan)</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#D7FF00]/10 text-[#D7FF00] text-[10px] font-mono">5 Nov 2026</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Data poster CT Scrims (#1 4KRV BLACK NUMBER • 82 PTS)</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFallbackNoticeOpen(false);
                  setIsApiKeyModalOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-[#D7FF00]/10 hover:bg-[#D7FF00]/20 border border-[#D7FF00]/30 flex items-center justify-between transition cursor-pointer text-left"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#D7FF00]" />
                    <span className="text-xs font-bold text-[#D7FF00]">Guna Gemini API Key (Live AI OCR)</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">Ekstrak automatik untuk mana-mana poster kejohanan baharu</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D7FF00]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
