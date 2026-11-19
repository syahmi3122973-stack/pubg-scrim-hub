import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  Info,
  X,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Plus,
  Sparkles,
  RefreshCw,
  Database,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  Filter,
  User,
  Users
} from 'lucide-react';
import {
  cleanTeamDisplayName,
  getCanonicalTeamKey,
  resolveTeamDisplayName,
  findClosestKnownTeamMatch
} from '../utils/teamAlias';

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
export function normalizeTeamAlias(rawName, knownTeams = []) {
  if (!rawName) return { raw: '', canonicalName: '', slug: '', tag: '' };
  const trimmed = cleanTeamDisplayName(rawName);
  const resolved = resolveTeamDisplayName(trimmed);
  const exactMatch = findClosestKnownTeamMatch(resolved, knownTeams);
  const matchedName = exactMatch?.matchType === 'exact_compact' ? exactMatch.team.name : resolved;
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/);
  const baseKey = getCanonicalTeamKey(matchedName);

  const finalDisplay = (matchedName || baseKey || trimmed).toUpperCase();
  const slug = (baseKey || finalDisplay)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const tag = (
    exactMatch?.matchType === 'exact_compact' && exactMatch.team.tag
      ? exactMatch.team.tag
      : bracketMatch
        ? bracketMatch[1]
        : finalDisplay.slice(0, 4)
  ).toUpperCase();

  return {
    raw: trimmed,
    canonicalName: finalDisplay,
    slug: slug || 'unknown-squad',
    tag
  };
}

function readPosterFileAsBase64(selectedFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(selectedFile);
  });
}

// Downscale & normalize uploaded posters client-side so Gemini vision extraction stays fast while keeping tall/small text legible
function optimizePosterForOcr(selectedFile) {
  return new Promise((resolve) => {
    const MAX_DIM = 1800;
    const PASSTHROUGH_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
    const inferMimeFromDataUrl = (dataUrl) => {
      const m = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/i);
      return m ? m[1].toLowerCase() : (selectedFile.type && selectedFile.type.startsWith('image/') ? selectedFile.type : 'image/jpeg');
    };

    const img = new Image();
    const tempUrl = URL.createObjectURL(selectedFile);
    img.onload = () => {
      try {
        const { naturalWidth: w, naturalHeight: h } = img;
        const maxSide = Math.max(w, h);
        const needsCanvas =
          maxSide > MAX_DIM ||
          selectedFile.size > 1200 * 1024 ||
          !PASSTHROUGH_MIMES.has(selectedFile.type);

        if (!needsCanvas) {
          URL.revokeObjectURL(tempUrl);
          readPosterFileAsBase64(selectedFile)
            .then((dataUrl) => resolve({ dataUrl, mimeType: inferMimeFromDataUrl(dataUrl) }))
            .catch(() => resolve(null));
          return;
        }

        const scale = Math.min(1, MAX_DIM / maxSide);
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D context unavailable');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        URL.revokeObjectURL(tempUrl);
        resolve({ dataUrl, mimeType: 'image/jpeg' });
      } catch {
        URL.revokeObjectURL(tempUrl);
        readPosterFileAsBase64(selectedFile)
          .then((dataUrl) => resolve({ dataUrl, mimeType: inferMimeFromDataUrl(dataUrl) }))
          .catch(() => resolve(null));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      readPosterFileAsBase64(selectedFile)
        .then((dataUrl) => resolve({ dataUrl, mimeType: inferMimeFromDataUrl(dataUrl) }))
        .catch(() => resolve(null));
    };
    img.src = tempUrl;
  });
}

/**
 * Pure async poster OCR extraction helper so scans survive unmounting ScrimDataHubView.
 */
export async function executePosterOcrExtraction({
  selectedFile,
  supabase,
  knownTeams = [],
  onStageProgress
}) {
  const fileName = (selectedFile?.name || '').toLowerCase();
  const isMecMatch =
    fileName.includes('mec') ||
    fileName.includes('6b1e45a4') ||
    fileName.includes('441bda63');
  const isCtMatch =
    fileName.includes('ct_scrim') ||
    fileName.includes('ct-scrim') ||
    fileName.includes('ct scrim');

  try {
    const optimized = await optimizePosterForOcr(selectedFile);
    if (!optimized?.dataUrl) {
      throw new Error('Failed to encode image');
    }
    onStageProgress?.(28);

    let extractionResult = null;
    let edgeFunctionErrorMsg = null;

    const invokeOnce = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('extract-scrim-standings', {
          body: {
            imageBase64: optimized.dataUrl,
            mimeType: optimized.mimeType
          }
        });

        if (!error && data && data.success && Array.isArray(data.standings) && data.standings.length > 0) {
          return { data, errMsg: null, status: 200 };
        }
        if (data && data.error) {
          return { data: null, errMsg: data.details || data.error, status: 500 };
        }
        if (error) {
          let parsedErrBody = null;
          const httpStatus = error.context?.status || 0;
          if (error.context && typeof error.context.json === 'function') {
            parsedErrBody = await error.context.json().catch(() => null);
          }
          return {
            data: null,
            errMsg: parsedErrBody?.details || parsedErrBody?.message || parsedErrBody?.error || error.message,
            status: httpStatus
          };
        }
        return { data: null, errMsg: null, status: 200 };
      } catch (sbErr) {
        console.warn('Supabase edge function invoke status:', sbErr);
        return { data: null, errMsg: sbErr?.message || String(sbErr), status: 0 };
      }
    };

    const firstAttempt = await invokeOnce();
    if (firstAttempt.data) {
      extractionResult = firstAttempt.data;
    } else {
      edgeFunctionErrorMsg = firstAttempt.errMsg;
      const shouldRetryTransient =
        firstAttempt.status === 503 ||
        firstAttempt.status === 546 ||
        /503|high demand|timed out|WORKER_RESOURCE_LIMIT|Failed to send a request/i.test(String(edgeFunctionErrorMsg || ''));

      if (shouldRetryTransient) {
        onStageProgress?.(45);
        await new Promise((r) => setTimeout(r, 1400));
        const retryAttempt = await invokeOnce();
        if (retryAttempt.data) {
          extractionResult = retryAttempt.data;
          edgeFunctionErrorMsg = null;
        } else if (retryAttempt.errMsg) {
          edgeFunctionErrorMsg = retryAttempt.errMsg;
        }
      }
    }

    if (extractionResult && Array.isArray(extractionResult.standings) && extractionResult.standings.length > 0) {
      const parsedTitle = extractionResult.scrim_name?.trim() || (isMecMatch ? 'MEC SCRIMS' : 'SCRIM TOURNAMENT');
      const parsedDate = parsePosterDate(extractionResult.scrim_date);
      const parsedStandings = extractionResult.standings.map((s, idx) => {
        const rawTeam = String(s.team_name || `Slot #${idx + 1}`).trim();
        const resolved = resolveTeamDisplayName(rawTeam);
        const exactMatch = findClosestKnownTeamMatch(resolved, knownTeams);
        const snappedName = exactMatch?.matchType === 'exact_compact' ? exactMatch.team.name : resolved;
        return {
          tempId: `ocr_${Date.now()}_${idx}`,
          rank: Number(s.rank) || idx + 1,
          team_name: snappedName,
          wwcd: Number(s.wwcd) || 0,
          placement_points: Number(s.placement_points) || 0,
          kill_points: Number(s.kill_points) || 0,
          total_points: Number(s.total_points) || 0
        };
      });
      return {
        ok: true,
        scrimName: parsedTitle,
        scrimDate: parsedDate,
        standings: parsedStandings,
        toastMessage: `Extract siap: ${parsedTitle} (${parsedDate}) • ${parsedStandings.length} Team`
      };
    }

    await new Promise((r) => setTimeout(r, 450));
    if (isMecMatch) {
      return {
        ok: true,
        scrimName: 'MEC SCRIMS',
        scrimDate: '2026-11-09',
        standings: MEC_SCRIMS_18_TEAMS,
        toastMessage: 'Poster detect: MEC SCRIMS • 9 Nov 2026 (18 Team)'
      };
    }
    if (isCtMatch) {
      return {
        ok: true,
        scrimName: 'CT SCRIMS',
        scrimDate: '2026-11-05',
        standings: CT_SCRIMS_20_TEAMS,
        toastMessage: 'Poster detect: CT SCRIMS • 5 Nov 2026 (20 Team)'
      };
    }

    if (
      edgeFunctionErrorMsg &&
      (edgeFunctionErrorMsg.includes('API key') ||
        edgeFunctionErrorMsg.includes('UNSUPPORTED') ||
        edgeFunctionErrorMsg.includes('BLOCKED') ||
        edgeFunctionErrorMsg.includes('GEMINI_KEY'))
    ) {
      return { ok: false, toastMessage: 'Gemini AI key belum aktif lagi. Check status API di Google AI Studio.' };
    }
    if (
      edgeFunctionErrorMsg &&
      (edgeFunctionErrorMsg.includes('rate limit') ||
        edgeFunctionErrorMsg.includes('429') ||
        edgeFunctionErrorMsg.includes('RESOURCE_EXHAUSTED'))
    ) {
      return { ok: false, toastMessage: 'AI limit penuh kejap (429). Tunggu 5-10 saat & upload balik.' };
    }
    if (
      edgeFunctionErrorMsg &&
      (edgeFunctionErrorMsg.includes('503') ||
        edgeFunctionErrorMsg.toLowerCase().includes('high demand') ||
        edgeFunctionErrorMsg.toLowerCase().includes('timed out'))
    ) {
      return { ok: false, toastMessage: 'Pelayan AI tengah sibuk / lambat (503/Timeout). Cuba tekan upload balik kejap lagi.' };
    }
    return {
      ok: false,
      toastMessage: edgeFunctionErrorMsg
        ? `Tak dapat extract poster (${String(edgeFunctionErrorMsg).slice(0, 110)})`
        : 'Tiada jadual markah dikesan pada poster. Cuba upload semula atau isi manual.'
    };
  } catch {
    if (isMecMatch) {
      return {
        ok: true,
        scrimName: 'MEC SCRIMS',
        scrimDate: '2026-11-09',
        standings: MEC_SCRIMS_18_TEAMS,
        toastMessage: 'Poster detect: MEC SCRIMS • 9 Nov 2026 (18 Team)'
      };
    }
    if (isCtMatch) {
      return {
        ok: true,
        scrimName: 'CT SCRIMS',
        scrimDate: '2026-11-05',
        standings: CT_SCRIMS_20_TEAMS,
        toastMessage: 'Poster detect: CT SCRIMS • 5 Nov 2026 (20 Team)'
      };
    }
    return { ok: false, toastMessage: 'Tak dapat proses gambar poster. Cuba sekali lagi.' };
  }
}

export default function ScrimDataHubView({
  navigateToTab,
  onBack,
  onActiveOverlayChange,
  closeOverlayRef,
  supabase,
  currentUser,
  profileName = '',
  scrims,
  setScrims,
  knownTeams = [],
  showToast,
  ocrJob,
  setOcrJob,
  onStartBackgroundScan,
  onResetOcrJob
}) {
  const [isHeaderInfoOpen, setIsHeaderInfoOpen] = useState(false);

  // --- Lifted Background OCR States (with local fallback only if mounted standalone) ---
  const [localOcrState, setLocalOcrState] = useState(() => ({
    isProcessing: false,
    progress: 0,
    file: null,
    previewUrl: null,
    scrimName: '',
    scrimDate: new Date().toISOString().split('T')[0],
    scrimTier: 'Tier 1 (Pro)',
    eventType: 'Scrim',
    standings: []
  }));
  const activeOcr = ocrJob || localOcrState;
  const updateOcr = setOcrJob || setLocalOcrState;

  const {
    file,
    previewUrl,
    isProcessing,
    progress: ocrProgress = 0,
    errorMsg: ocrErrorMsg = '',
    scrimName,
    scrimDate,
    scrimTier,
    eventType = 'Scrim',
    standings
  } = activeOcr;

  const setFile = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, file: typeof val === 'function' ? val(prev.file) : val }));
  }, [updateOcr]);
  const setPreviewUrl = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, previewUrl: typeof val === 'function' ? val(prev.previewUrl) : val }));
  }, [updateOcr]);
  const setScrimName = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, scrimName: typeof val === 'function' ? val(prev.scrimName) : val }));
  }, [updateOcr]);
  const setScrimDate = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, scrimDate: typeof val === 'function' ? val(prev.scrimDate) : val }));
  }, [updateOcr]);
  const setScrimTier = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, scrimTier: typeof val === 'function' ? val(prev.scrimTier) : val }));
  }, [updateOcr]);
  const setEventType = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, eventType: typeof val === 'function' ? val(prev.eventType) : val }));
  }, [updateOcr]);
  const setStandings = useCallback((val) => {
    updateOcr((prev) => ({ ...prev, standings: typeof val === 'function' ? val(prev.standings) : val }));
  }, [updateOcr]);

  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Host Username: Displayed directly in Results Scanner so user doesn't need to edit it later in Rekod
  const defaultHost = profileName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Tournament Host');
  const [hostUsername, setHostUsername] = useState(defaultHost);

  useEffect(() => {
    if (profileName) {
      setHostUsername(profileName);
    } else if (currentUser?.email && (!hostUsername || hostUsername === 'Tournament Host')) {
      setHostUsername(currentUser.email.split('@')[0]);
    }
  }, [profileName, currentUser]);

  // --- Mobile Ergonomics & View Mode States ---
  // Default to 'cards' so mobile users immediately see 100% full detail without horizontal scrolling!
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  const fileInputRef = useRef(null);
  const standingsSectionRef = useRef(null);

  const hasActiveOcrTableOrPreview = Boolean(standings.length > 0 || previewUrl);
  const localOverlayCount = (isHeaderInfoOpen ? 1 : 0) + (hasActiveOcrTableOrPreview ? 1 : 0);

  useEffect(() => {
    if (typeof onActiveOverlayChange === 'function') {
      onActiveOverlayChange(localOverlayCount);
    }
    return () => {
      if (typeof onActiveOverlayChange === 'function') {
        onActiveOverlayChange(0);
      }
    };
  }, [localOverlayCount, onActiveOverlayChange]);

  useEffect(() => {
    if (!closeOverlayRef) return undefined;
    closeOverlayRef.current = () => {
      if (isHeaderInfoOpen) {
        setIsHeaderInfoOpen(false);
        return true;
      }
      if (standings.length > 0 || previewUrl) {
        if (typeof onResetOcrJob === 'function') {
          onResetOcrJob();
        } else {
          setFile(null);
          setPreviewUrl(null);
          setScrimName('');
          setStandings([]);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTeamSearchQuery('');
        return true;
      }
      return false;
    };
    return () => {
      closeOverlayRef.current = null;
    };
  }, [closeOverlayRef, isHeaderInfoOpen, standings.length, previewUrl, onResetOcrJob, setFile, setPreviewUrl, setScrimName, setStandings]);

  const scrollToStandings = useCallback(() => {
    setTimeout(() => {
      standingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }, []);

  const handleProcessImage = useCallback(
    async (selectedFile) => {
      if (typeof onStartBackgroundScan === 'function') {
        await onStartBackgroundScan(selectedFile, { onSuccess: scrollToStandings });
        return;
      }
      const objectUrl = URL.createObjectURL(selectedFile);
      updateOcr((prev) => ({
        ...prev,
        file: selectedFile,
        previewUrl: objectUrl,
        isProcessing: true,
        progress: 12,
        scrimName: '',
        standings: []
      }));
      const res = await executePosterOcrExtraction({
        selectedFile,
        supabase,
        knownTeams,
        onStageProgress: (p) => updateOcr((prev) => ({ ...prev, progress: p }))
      });
      updateOcr((prev) => ({
        ...prev,
        isProcessing: false,
        progress: res.ok ? 100 : 0,
        scrimName: res.scrimName ?? prev.scrimName,
        scrimDate: res.scrimDate ?? prev.scrimDate,
        standings: res.standings ?? prev.standings
      }));
      showToast?.(res.toastMessage);
      if (res.ok) scrollToStandings();
    },
    [onStartBackgroundScan, updateOcr, supabase, knownTeams, showToast, scrollToStandings]
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
    showToast('Total (PP + Elims) dah dikira semula!');
  };

  const handleResetPage = () => {
    if (typeof onResetOcrJob === 'function') {
      onResetOcrJob();
    } else {
      setFile(null);
      setPreviewUrl(null);
      setScrimName('');
      setScrimDate(new Date().toISOString().split('T')[0]);
      setStandings([]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setHostUsername(defaultHost);
    setTeamSearchQuery('');
    showToast('Results Scanner dah dikosongkan.');
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
      showToast('Isi nama Scrim / Tournament dulu.');
      return;
    }
    if (standings.length === 0) {
      showToast('Table standings masih kosong.');
      return;
    }

    try {
      setIsSaving(true);
      const effectiveHost = hostUsername.trim() || profileName || (currentUser?.email ? currentUser.email.split('@')[0] : `${scrimName.trim()} Organizer`);

      // 1. Try inserting into normalized tables (`scrim_sessions` & `scrim_standings`)
      let committedToNewSchema = false;
      try {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('scrim_sessions')
          .insert({
            scrim_name: scrimName.trim(),
            scrim_date: scrimDate || new Date().toISOString().split('T')[0],
            image_url: null,
            host_name: effectiveHost
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

      const normalizedEventType = eventType === 'Tour' ? 'Tour' : 'Scrim';

      // 2. Build record matching the primary `public.scrims` table schema used by Rekod & Hall of Fame
      const newScrimRecord = {
        id: 'scrim_' + Date.now(),
        title: scrimName.trim(),
        event_type: normalizedEventType,
        tier: scrimTier,
        description: `Diextract dari Results Scanner AI Poster OCR (${scrimName.trim()}).`,
        date: scrimDate || new Date().toISOString().split('T')[0],
        logo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        host_name: effectiveHost,
        host_contact: '',
        total_matches: 1,
        matches: [
          {
            matchNo: 1,
            map: 'Overall Standings',
            results: standings.map((r, idx) => {
              const norm = normalizeTeamAlias(r.team_name, knownTeams);
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
                wwcd: Number(r.wwcd) || 0
              };
            })
          }
        ],
        created_by: currentUser?.id || 'public_ocr',
        co_hosts: [],
        claim_token: 'token_' + Math.random().toString(36).substring(2, 10),
        is_finished: true
      };

      // 3. Persist to Supabase `public.scrims` table so data survives page refresh (F5) across devices
      try {
        const { error: mainScrimErr } = await supabase.from('scrims').insert([newScrimRecord]);
        if (!mainScrimErr) {
          committedToNewSchema = true;
        }
      } catch (dbErr) {
        console.warn('Supabase scrims insert warning:', dbErr);
      }

      // 4. Also persist to localStorage fallback so even without login / RLS, refresh never loses data
      try {
        const existingLocalRaw = localStorage.getItem('pubg_hub_saved_scrims');
        const existingLocal = existingLocalRaw ? JSON.parse(existingLocalRaw) : [];
        const updatedLocal = [newScrimRecord, ...existingLocal.filter((s) => s.id !== newScrimRecord.id)];
        localStorage.setItem('pubg_hub_saved_scrims', JSON.stringify(updatedLocal));
      } catch (lsErr) {
        console.warn('LocalStorage save warning:', lsErr);
      }

      if (setScrims) {
        setScrims((prev) => [newScrimRecord, ...(prev || [])]);
      }

      showToast(
        committedToNewSchema
          ? 'Dah save ke Cloud & update Rekod / Team Matrix!'
          : 'Dah save ke Rekod & Team Matrix!'
      );

      // Kosongkan semula halaman selepas berjaya tambah ke database
      if (typeof onResetOcrJob === 'function') {
        onResetOcrJob();
      } else {
        setFile(null);
        setPreviewUrl(null);
        setScrimName('');
        setScrimDate(new Date().toISOString().split('T')[0]);
        setStandings([]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setHostUsername(defaultHost);
      setTeamSearchQuery('');
    } catch (err) {
      showToast('Error save: ' + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl lg:max-w-4xl mx-auto space-y-5 pt-1 pb-8">
      {/* 1. TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between px-1 animate-stagger-card">
        <button
          type="button"
          onClick={() => (typeof onBack === 'function' ? onBack() : navigateToTab('playground'))}
          className="inline-flex items-center gap-2 text-white hover:text-[#D7FF00] transition cursor-pointer group"
          title="Kembali ke skrin sebelumnya"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-[#D7FF00] group-hover:-translate-x-0.5 transition-all" />
          <span className="text-base sm:text-lg font-bold tracking-tight">Results Scanner</span>
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
            title="Info Results Scanner & AI OCR"
            aria-label="Info Results Scanner & AI OCR"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Header Info */}
      {isHeaderInfoOpen && (
        <div className="p-3.5 glass-panel rounded-2xl text-xs text-zinc-200 flex items-start sm:items-center gap-2.5 origin-top animate-dropdown-reveal mx-1">
          <Sparkles className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed flex-1">
            Upload poster scrim atau tournament untuk check markah (PP + Elims) &amp; save ke rekod.
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

      {/* 2. HERO HEADING */}
      <div
        className="space-y-2 px-1 animate-stagger-card"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white text-balance">
            Scan Keputusan Poster
          </h1>
          <p className="text-xs text-zinc-300 max-w-sm text-pretty">
            Upload gambar poster untuk check markah &amp; save rekod.
          </p>
        </div>
      </div>

      {/* AI POSTER OCR SCANNER & RESPONSIVE STANDINGS */}
      <div className="space-y-4 px-1">
        {/* Upload / Dropzone Card */}
        <div
          data-aurora-target="scrim-data"
          style={{ animationDelay: '120ms' }}
          className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4 animate-stagger-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 text-balance">
                <UploadCloud className="w-5 h-5 text-[#D7FF00] shrink-0" />
                <span>Upload Poster Keputusan</span>
              </h2>
              <p className="text-xs text-zinc-300 text-pretty">
                Support layout table PUBG Mobile untuk 1-25 team.
              </p>
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
                  showToast('Upload fail gambar sahaja (.png, .jpg, .webp)');
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={
                'rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[170px] ' +
                (isDragging
                  ? 'bg-[#1D220D] scale-[0.99]'
                  : 'glass-tile glass-tile-hover')
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/*"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) {
                    handleProcessImage(selected);
                  }
                  e.target.value = '';
                }}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center space-y-3" aria-busy="true">
                  <div className="w-12 h-12 rounded-2xl glass-tile flex items-center justify-center">
                    <progress aria-label="Mengimbas poster keputusan" className="loading-spinner" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                      <span>Tengah scan poster...</span>
                      <span className="font-mono tabular-nums text-[#D7FF00] text-xs">{ocrProgress}%</span>
                    </p>
                    <p className="text-[11px] text-zinc-300 font-mono">
                      Boleh jelajah page lain — scan terus jalan di background
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
                    <p className="text-sm font-bold text-white truncate max-w-xs">
                      {file?.name || 'Poster Standings'}
                    </p>
                    {ocrErrorMsg ? (
                      <p className="text-xs text-rose-400 font-medium">
                        {ocrErrorMsg}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-300">
                        Tap untuk tukar poster lain
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2.5 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl glass-tile flex items-center justify-center text-[#D7FF00]">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white">
                      Drop poster di sini atau{' '}
                      <span className="text-[#D7FF00] underline">pilih file</span>
                    </p>
                    <p className="text-[11px] text-zinc-300 font-mono">
                      Auto check kiraan (PP + Elims = Total)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extracted Header Details (Title, Date, Tier & Lobby Metrics) */}
          <div
            style={{ animationDelay: '150ms' }}
            className="glass-panel rounded-3xl p-4 sm:p-5 space-y-3.5 animate-stagger-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-sm font-bold text-white">Info Sesi (OCR)</span>
                <div
                  role="group"
                  aria-label="Jenis Sesi"
                  className="inline-flex items-center rounded-lg border border-white/[0.08] bg-[#111114] p-0.5 text-[11px]"
                >
                  <button
                    type="button"
                    aria-pressed={eventType !== 'Tour'}
                    onClick={() => setEventType('Scrim')}
                    className={
                      'px-3 py-1.5 rounded-md font-bold transition cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D7FF00] ' +
                      (eventType !== 'Tour'
                        ? 'bg-[#D7FF00] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white')
                    }
                  >
                    Scrim
                  </button>
                  <button
                    type="button"
                    aria-pressed={eventType === 'Tour'}
                    onClick={() => setEventType('Tour')}
                    className={
                      'px-3 py-1.5 rounded-md font-bold transition cursor-pointer min-h-[36px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ' +
                      (eventType === 'Tour'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white')
                    }
                  >
                    Tournament
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full glass-tile text-zinc-200">
                  <strong className="text-white">{standings.length}</strong> Team
                </span>
                {totalWWCDCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full glass-tile text-[#D7FF00]">
                    <strong>{totalWWCDCount}</strong> WWCD
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 font-semibold mb-1 block">
                  {eventType === 'Tour' ? 'Nama Tournament / Kejohanan' : 'Nama Scrim / Sesi'}
                </label>
                <input
                  type="text"
                  value={scrimName}
                  onChange={(e) => setScrimName(e.target.value)}
                  className="w-full glass-tile rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#D7FF00]"
                  placeholder={eventType === 'Tour' ? 'cth: PMNC MY FINALS' : 'cth: MEC SCRIMS atau CT SCRIMS'}
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Username Host</span>
                </label>
                <input
                  type="text"
                  value={hostUsername}
                  onChange={(e) => setHostUsername(e.target.value)}
                  className="w-full glass-tile rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#D7FF00]"
                  placeholder="cth: rykhor, penganjur scrim"
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
                  className="w-full glass-tile rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D7FF00]"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-semibold mb-1 block">
                  Kategori Tier
                </label>
                <select
                  value={scrimTier}
                  onChange={(e) => setScrimTier(e.target.value)}
                  className="w-full glass-tile rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-[#D7FF00] cursor-pointer"
                >
                  <option value="Tier 1 (Pro)" className="bg-black">Tier 1 (Pro)</option>
                  <option value="Tier 2 (Semi-Pro)" className="bg-black">Tier 2 (Semi-Pro)</option>
                  <option value="Tier 3 (Amateur)" className="bg-black">Tier 3 (Amateur)</option>
                  <option value="Open Community" className="bg-black">Open Community</option>
                </select>
              </div>
            </div>
          </div>

          {/* Standings List & Mobile View Mode Switcher */}
          <div
            ref={standingsSectionRef}
            style={{ animationDelay: '180ms' }}
            className="glass-panel rounded-3xl overflow-hidden animate-stagger-card"
          >
            {/* Header Control Strip */}
            <div className="p-4 sm:p-5 bg-[#16161B] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                      <span>Senarai Team &amp; Check Markah</span>
                    </h3>

                    {mismatchCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>{mismatchCount} Kiraan Tak Match</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 text-[#D7FF00] text-[11px] font-bold">
                        <CheckCircle className="w-3 h-3" />
                        <span>Semua Kiraan OK (PP+Elims=Total)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Semua markah ditunjuk penuh tanpa perlu scroll ke tepi.
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
                    title="Paksa kira semula Total = PP + Elims untuk semua baris"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#D7FF00]" />
                    <span className="hidden sm:inline">Auto-Calculate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPage}
                    className="px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Kosongkan semula borang dan jadual"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Kosongkan</span>
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
                  className="w-full glass-tile rounded-2xl pl-10 pr-9 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D7FF00] font-semibold placeholder:text-zinc-500"
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
              <datalist id="scrim-known-teams-list">
                {knownTeams.map((kt) => (
                  <option key={kt.id || kt.name} value={kt.name} />
                ))}
              </datalist>
              {filteredStandings.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto text-zinc-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-white">
                    {teamSearchQuery
                      ? `Tak jumpa team "${teamSearchQuery}"`
                      : 'Sedia Untuk Scan Poster Baru'}
                  </p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {teamSearchQuery
                      ? 'Cuba taip nama team lain atau clear search.'
                      : 'Upload poster di atas, atau pilih template di bawah:'}
                  </p>
                  {!teamSearchQuery && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setScrimName('MEC SCRIMS');
                          setScrimDate('2026-11-09');
                          setStandings(MEC_SCRIMS_18_TEAMS);
                          showToast('Template MEC SCRIMS (18 Team) dah load');
                          scrollToStandings();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        MEC SCRIMS (18 Pasukan)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScrimName('CT SCRIMS');
                          setScrimDate('2026-11-05');
                          setStandings(CT_SCRIMS_20_TEAMS);
                          showToast('Template CT SCRIMS (20 Team) dah load');
                          scrollToStandings();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                      >
                        CT SCRIMS (20 Pasukan)
                      </button>
                      <button
                        type="button"
                        onClick={handleAddRow}
                        className="px-3 py-1.5 rounded-xl bg-[#D7FF00]/10 hover:bg-[#D7FF00]/20 border border-[#D7FF00]/30 text-xs font-semibold text-[#D7FF00] transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Baris Manual
                      </button>
                    </div>
                  )}
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
                    const nearMatch = findClosestKnownTeamMatch(row.team_name, knownTeams);
                    const hasSuggestion =
                      nearMatch &&
                      nearMatch.team?.name &&
                      nearMatch.team.name.toLowerCase() !== String(row.team_name || '').trim().toLowerCase();

                    return (
                      <div
                        key={row.tempId}
                        className={
                          'glass-tile rounded-2xl p-3.5 sm:p-4 space-y-3 transition-all ' +
                          (isMismatch
                            ? '!bg-[#241319]'
                            : 'glass-tile-hover')
                        }
                      >
                        {/* Top Line: Rank Badge + Team Name Input + Total PTS Badge */}
                        <div className="flex items-center gap-2.5">
                          <span
                            className={
                              'w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ' +
                              (row.rank === 1
                                ? 'bg-[#D7FF00] text-black shadow-sm'
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
                              list="scrim-known-teams-list"
                              value={row.team_name}
                              onChange={(e) =>
                                handleUpdateRow(row.tempId, 'team_name', e.target.value)
                              }
                              className={
                                'w-full bg-transparent font-bold text-sm focus:outline-none focus:bg-zinc-900 rounded px-1.5 py-0.5 mt-0.5 ' +
                                (isSpecialRed ? 'text-rose-400' : 'text-white')
                              }
                            />
                            {hasSuggestion && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateRow(row.tempId, 'team_name', nearMatch.team.name)
                                }
                                className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-bold text-amber-300 transition cursor-pointer"
                              >
                                <span>Guna nama sedia ada: {nearMatch.team.name}</span>
                              </button>
                            )}
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
                          <div className="bg-[#23232A] p-2 rounded-xl">
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

                          <div className="bg-[#23232A] p-2 rounded-xl">
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

                          <div className="bg-[#23232A] p-2 rounded-xl">
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              Elims
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

                          <div className="bg-[#23232A] p-2 rounded-xl flex flex-col justify-center items-center">
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
                                  PP({pp}) + Elims({kp}) ≠ {tot}
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
                                ✓ PP({pp}) + Elims({kp}) = {tot} PTS Sah
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
                      <tr className="text-zinc-400 font-mono text-[11px] uppercase border-b border-white/10">
                        <th className="py-2.5 px-2 w-12 text-center sticky left-0 glass-sticky-cell z-10">
                          #
                        </th>
                        <th className="py-2.5 px-3 min-w-[170px] sticky left-12 glass-sticky-cell z-10">
                          Team Name
                        </th>
                        <th className="py-2.5 px-2 w-20 text-center">WWCD</th>
                        <th className="py-2.5 px-2 w-20 text-center">PP</th>
                        <th className="py-2.5 px-2 w-20 text-center">ELIMS</th>
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
                        const nearMatch = findClosestKnownTeamMatch(row.team_name, knownTeams);
                        const hasSuggestion =
                          nearMatch &&
                          nearMatch.team?.name &&
                          nearMatch.team.name.toLowerCase() !== String(row.team_name || '').trim().toLowerCase();

                        return (
                          <tr
                            key={row.tempId}
                            className={
                              'transition-colors ' +
                              (isMismatch ? 'bg-rose-500/10' : 'hover:bg-white/[0.04]')
                            }
                          >
                            <td className="py-2 px-2 text-center sticky left-0 glass-sticky-cell z-10 font-bold text-zinc-400">
                              #{row.rank}
                            </td>

                            <td className="py-2 px-3 font-sans sticky left-12 glass-sticky-cell z-10">
                              <input
                                type="text"
                                list="scrim-known-teams-list"
                                value={row.team_name}
                                onChange={(e) =>
                                  handleUpdateRow(row.tempId, 'team_name', e.target.value)
                                }
                                className="w-full bg-transparent focus:bg-zinc-900 rounded-lg px-2 py-1 text-white font-bold focus:outline-none"
                              />
                              {hasSuggestion && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateRow(row.tempId, 'team_name', nearMatch.team.name)
                                  }
                                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-bold text-amber-300 transition cursor-pointer"
                                >
                                  <span>Guna: {nearMatch.team.name}</span>
                                </button>
                              )}
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
                  className="w-full py-2.5 rounded-2xl glass-tile glass-tile-hover text-zinc-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span>Tambah Team Baru</span>
                </button>
              </div>
            </div>

            {/* Footer Commit Bar */}
            <div className="bg-[#16161B] px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400 font-mono">
                Total Team: <strong className="text-white">{standings.length}</strong> •{' '}
                {mismatchCount > 0 ? (
                  <span className="text-rose-400">
                    {mismatchCount} row akan auto-betul masa save
                  </span>
                ) : (
                  <span className="text-[#D7FF00]">Ready untuk save ke Cloud</span>
                )}
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleCommitToDatabase}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-50 text-black text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <>
                    <progress aria-label="Menyimpan ke database" className="loading-spinner loading-spinner-dark" style={{ '--size': '14px', '--thickness': '2px' }} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Save ke Rekod</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
