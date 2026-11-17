import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';
import { 
  Trophy, 
  Swords, 
  Search, 
  Plus, 
  Minus, 
  CheckCircle, 
  Users, 
  Copy, 
  Play, 
  Pause,
  Save, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Download, 
  Filter, 
  LogIn,
  LogOut, 
  User, 
  ArrowRight, 
  Lock, 
  Mail, 
  Flame, 
  MessageCircle, 
  Share2, 
  ExternalLink, 
  Upload, 
  X, 
  Eye, 
  EyeOff,
  Trash2, 
  Edit3, 
  LockKeyhole, 
  Unlock, 
  Award, 
  BarChart2, 
  Info, 
  Bug, 
  Crosshair, 
  Share, 
  Medal, 
  Globe, 
  Link as LinkIcon, 
  Video, 
  HelpCircle, 
  Zap, 
  Cloud, 
  ShieldCheck, 
  Menu, 
  Database, 
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  Crown,
  Phone,
  Camera,
  Crop,
  MoreVertical,
  GitMerge
} from 'lucide-react';
import { supabase } from './supabaseClient';
import ScrimDataHubView from './components/ScrimDataHubView';
import LegacyGuestLandingView from './components/LegacyGuestLandingView';
import ScrimDualLineChart, { buildScrimTrendSeries, computeSmoothBezierSegments } from './components/ScrimDualLineChart';
import TeamLogoCropper from './components/TeamLogoCropper';
import { BackButtonHandler } from './hooks/useMobileBackButton';
import {
  cleanTeamDisplayName,
  getCanonicalTeamKey,
  getCompactTeamSignature,
  pickPreferredTeamDisplayName,
  resolveTeamDisplayName,
  saveCustomTeamAlias,
  findPotentialDuplicatePairs
} from './utils/teamAlias';

const InstagramIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TikTokIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 1 0 6.34 6.34V8.71a8.23 8.23 0 0 0 4.77 1.52V6.78c-.33 0-.67-.03-1-.09z"/>
  </svg>
);

function TikTokPreviewCard({ post }) {
  const fallbackThumbnail = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-[9/15] rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl flex flex-col justify-between p-4 group select-none">
      <img
        src={post.media_url || fallbackThumbnail}
        alt={post.title}
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold">
          <TikTokIcon className="w-3.5 h-3.5 text-[#00f2fe]" />
          <span>TikTok Clip</span>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-lime-400 text-slate-950 text-[10px] font-mono font-black uppercase tracking-wider shadow-sm">
          {post.rank || 'Highlight'}
        </span>
      </div>

      <a
        href={post.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 flex flex-col items-center justify-center my-auto group/btn cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:bg-lime-400 group-hover/btn:text-slate-950 group-hover/btn:border-lime-300">
          <Play className="w-7 h-7 fill-current translate-x-0.5" />
        </div>
        <span className="mt-2.5 text-xs font-mono font-semibold text-slate-300 tracking-wide uppercase group-hover/btn:text-white transition-colors">
          Tap to Watch Clip
        </span>
      </a>

      <div className="relative z-10 space-y-3 pt-4">
        <div>
          <span className="text-[10px] font-mono text-lime-400 uppercase tracking-wider block font-bold">
            @{post.author || 'creator'} • {post.tournament || 'SCRIM HUB'}
          </span>
          <h4 className="text-sm font-black text-white line-clamp-2 leading-snug mt-0.5">
            {post.title}
          </h4>
        </div>

        <a
          href={post.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <TikTokIcon className="w-4 h-4" />
          <span>Open in TikTok App</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </a>
      </div>
    </div>
  );
}

const getPlacementPoints = (placement) => {
  const p = parseInt(placement, 10);
  switch (p) {
    case 1: return 10;
    case 2: return 6;
    case 3: return 5;
    case 4: return 4;
    case 5: return 3;
    case 6: return 2;
    case 7:
    case 8: return 1;
    default: return 0;
  }
};

const TIER_OPTIONS = ['Tier 1 (Pro)', 'Tier 2 (Semi-Pro)', 'Tier 3 (Amateur)', 'Open Community'];

const HALL_OF_FAME_FILTERS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'SSS', label: 'SSS' },
  { key: 'TIER_1', label: 'Tier 1' },
  { key: 'TIER_2', label: 'Tier 2' },
  { key: 'TIER_3', label: 'Tier 3' },
  { key: 'OPEN', label: 'Open' }
];

const HALL_OF_FAME_EVENT_TOGGLES = [
  { key: 'Scrim', label: 'Scrim' },
  { key: 'Tour', label: 'Tournament' }
];

// Separated SSS Tier-2 Season & Stage architecture (scalable for Grand Final + Semi Group A/B):
const SSS_DEFAULT_SELECTION = { season: 'ALL', stage: 'GRAND_FINAL' };

const SSS_SEASONS_DESC = [12, 11, 10, 9, 8, 7, 6, 5, 4];

const SSS_SEASON_OPTIONS = [
  { value: 'ALL', label: 'All Seasons (S4-S12)', shortLabel: 'S4 - S12' },
  ...SSS_SEASONS_DESC.map((seasonNum) => ({
    value: String(seasonNum),
    season: seasonNum,
    label: `Season ${seasonNum}`,
    shortLabel: `S${seasonNum}`
  }))
];

const SSS_STAGE_OPTIONS = [
  { key: 'GRAND_FINAL', label: 'Grand Final' },
  { key: 'SEMI_FINAL_A', label: 'Semi Group A' },
  { key: 'SEMI_FINAL_B', label: 'Semi Group B' }
];

const formatSssSelectionLabel = (selection = SSS_DEFAULT_SELECTION) => {
  const season = selection?.season ?? 'ALL';
  const stage = selection?.stage && selection.stage !== 'ALL' ? selection.stage : 'GRAND_FINAL';
  const seasonObj = SSS_SEASON_OPTIONS.find((opt) => opt.value === String(season)) || SSS_SEASON_OPTIONS[0];
  const stageObj = SSS_STAGE_OPTIONS.find((opt) => opt.key === stage) || SSS_STAGE_OPTIONS[0];

  if (season === 'ALL') return `All Seasons (S4 - S12) • ${stageObj.label}`;
  return `SSS ${seasonObj.label} — ${stageObj.label}`;
};

const matchesStatsFilter = (result, filterKey, eventTypeFilter = 'ALL', sssSelection = SSS_DEFAULT_SELECTION) => {
  if (eventTypeFilter && eventTypeFilter !== 'ALL') {
    if ((result?.eventType || 'Scrim') !== eventTypeFilter) return false;
  }
  if (!filterKey || filterKey === 'ALL') return true;
  if (filterKey === 'SSS') {
    const titleHostText = [result?.scrimName, result?.scrimData?.title, result?.hostName]
      .filter(Boolean)
      .join(' ');
    if (!/(?:^|[^a-z0-9])sss(?=[0-9]|[^a-z0-9]|$)/i.test(titleHostText)) {
      return false;
    }

    const activeSeason = sssSelection?.season ?? 'ALL';
    const activeStage = sssSelection?.stage && sssSelection.stage !== 'ALL' ? sssSelection.stage : 'GRAND_FINAL';

    const fullSssText = [
      result?.scrimName,
      result?.scrimData?.title,
      result?.scrimData?.description,
      result?.scrimData?.sssStage,
      result?.hostName
    ]
      .filter(Boolean)
      .join(' ');

    if (activeSeason !== 'ALL') {
      const seasonNum = Number(activeSeason);
      const metaSeason = result?.scrimData?.sssSeason ?? result?.sssSeason;
      const seasonRegex = new RegExp(
        `(?:sss\\s*[-_#]?\\s*s?0?${seasonNum}(?!\\d)|\\bseason\\s*0?${seasonNum}(?!\\d)|\\bs0?${seasonNum}(?!\\d))`,
        'i'
      );
      const matchesSeason = metaSeason !== undefined && metaSeason !== null
        ? Number(metaSeason) === seasonNum
        : seasonRegex.test(fullSssText);

      if (!matchesSeason) return false;
    }

    if (activeStage !== 'ALL') {
      const metaStage = String(result?.scrimData?.sssStage || result?.sssStage || '').toUpperCase();
      if (metaStage) {
        return metaStage === activeStage;
      }

      if (activeStage === 'SEMI_FINAL_A') {
        return /\b(?:semi(?:\s*-?\s*final)?\s*(?:group|grp)?\s*a|(?:group|grp)\s*a)\b/i.test(fullSssText);
      }
      if (activeStage === 'SEMI_FINAL_B') {
        return /\b(?:semi(?:\s*-?\s*final)?\s*(?:group|grp)?\s*b|(?:group|grp)\s*b)\b/i.test(fullSssText);
      }
      if (activeStage === 'GRAND_FINAL') {
        // Existing SSS S4-S12 records without explicit Semi/Group labels represent Grand Final sessions.
        const isExplicitSemi = /\bsemi(?:\s*-?\s*final)?\b|\b(?:group|grp)\s*[ab]\b/i.test(fullSssText);
        return !isExplicitSemi || /grand\s*-?\s*final|\bgf\b/i.test(fullSssText);
      }
    }
    return true;
  }
  if (filterKey === 'Scrim' || filterKey === 'Tour') {
    return (result?.eventType || 'Scrim') === filterKey;
  }
  const tierRaw = String(result?.scrimTier || result?.scrimData?.tier || '').toLowerCase();
  if (filterKey === 'TIER_1') return tierRaw.includes('tier 1') || /(?:^|[^a-z-])pro(?:[^a-z]|$)/i.test(tierRaw);
  if (filterKey === 'TIER_2') return tierRaw.includes('tier 2') || tierRaw.includes('semi');
  if (filterKey === 'TIER_3') return tierRaw.includes('tier 3') || tierRaw.includes('amateur');
  if (filterKey === 'OPEN') return tierRaw.includes('open') || tierRaw.includes('community');
  return true;
};

const INITIAL_FALLBACK_TEAMS = [
  { id: 'tm_1', name: 'Geek Fam MY', tag: 'GEEK' },
  { id: 'tm_2', name: 'Yoodo Alliance', tag: 'YALL' },
  { id: 'tm_3', name: 'SEM9 Esports', tag: 'SEM9' },
  { id: 'tm_4', name: 'Vampire Esports', tag: 'VPE' },
  { id: 'tm_5', name: 'Bigetron RA', tag: 'BTR' },
  { id: 'tm_6', name: 'Alter Ego Ares', tag: 'AE' },
  { id: 'tm_7', name: 'FaZe Clan SEA', tag: 'FAZE' },
  { id: 'tm_8', name: 'Talon Esports', tag: 'TLN' },
  { id: 'tm_9', name: 'HomeBois', tag: 'HB' },
  { id: 'tm_10', name: 'Team Secret MY', tag: 'TS' },
  { id: 'tm_11', name: "D'Xavier", tag: 'DX' },
  { id: 'tm_12', name: 'Crit VIP', tag: 'CRIT' },
  { id: 'tm_13', name: '4Rivals', tag: '4R' },
  { id: 'tm_14', name: 'Genesis Esports', tag: 'GEN' },
  { id: 'tm_15', name: 'NSJ Esports', tag: 'NSJ' },
  { id: 'tm_16', name: 'Rampage Pro', tag: 'RPG' },
  { id: 'tm_17', name: 'Morph Esports', tag: 'MRPH' },
  { id: 'tm_18', name: 'BTR Arctic', tag: 'BTRA' },
  { id: 'tm_19', name: 'DRS Gaming', tag: 'DRS' },
  { id: 'tm_20', name: 'Stalwart Esports', tag: 'STE' },
  { id: 'tm_21', name: 'IHC Esports', tag: 'IHC' },
  { id: 'tm_22', name: 'Nigma Galaxy', tag: 'NGX' },
  { id: 'tm_23', name: 'Alpha7 Esports', tag: 'A7' },
  { id: 'tm_24', name: 'S2G Esports', tag: 'S2G' },
  { id: 'tm_mec', name: 'MEC', tag: 'MEC' }
];

const PLAYGROUND_DEFAULT_MAPS = ['Erangel', 'Erangel', 'Miramar', 'Miramar', 'Rondo'];

const DEMO_PLAYGROUND_TEAMS = [
  { name: 'Geek Fam', elims: 9, placement: 1, wwcd: true },
  { name: 'SEM9', elims: 6, placement: 2, wwcd: false },
  { name: 'YALL', elims: 5, placement: 3, wwcd: false },
  { name: 'Bigetron RA', elims: 7, placement: 4, wwcd: false },
  { name: 'Vampire Esports', elims: 4, placement: 5, wwcd: false },
  { name: 'Morph Team', elims: 3, placement: 6, wwcd: false },
  { name: 'Alter Ego', elims: 5, placement: 7, wwcd: false },
  { name: 'FaZe Clan', elims: 2, placement: 8, wwcd: false },
  { name: "D'Xavier", elims: 4, placement: 9, wwcd: false },
  { name: 'Talon Esports', elims: 3, placement: 10, wwcd: false },
  { name: '4Rivals', elims: 2, placement: 11, wwcd: false },
  { name: 'Genesis Esports', elims: 1, placement: 12, wwcd: false },
  { name: 'HomeBois', elims: 2, placement: 13, wwcd: false },
  { name: 'Todak', elims: 1, placement: 14, wwcd: false },
  { name: 'Crit VIP', elims: 0, placement: 15, wwcd: false },
  { name: 'RSG', elims: 1, placement: 16, wwcd: false },
];

// Sesi Scrim Bersih: Tiada markah atau nama team pro sedia ada supaya tidak mengelirukan pengunjung baru
const createDefaultPlaygroundSession = (teamCount = 16) => {
  const defaultMaps = PLAYGROUND_DEFAULT_MAPS;
  const matches = defaultMaps.map((mapName, mIdx) => ({
    matchNo: mIdx + 1,
    title: `Match ${mIdx + 1}`,
    map: mapName,
    slots: Array.from({ length: teamCount }, (_, idx) => ({
      slot: idx + 1,
      teamName: `Slot ${idx + 1}`,
      placement: '',
      elims: 0,
      wwcd: false,
      placePts: 0,
      totalPts: 0
    }))
  }));

  return {
    title: 'PUBG Mobile Scrim Session',
    matches,
    synced: false
  };
};

// Sesi Scrim Demo: Digunakan secara eksplisit jika pengguna ingin pratonton fungsi poster & kiraan mata
const createDemoPlaygroundSession = (teamCount = 16) => {
  const defaultMaps = PLAYGROUND_DEFAULT_MAPS;
  const initialTeams = DEMO_PLAYGROUND_TEAMS.slice(0, teamCount);
  while (initialTeams.length < teamCount) {
    initialTeams.push({ name: `Slot ${initialTeams.length + 1}`, elims: 0, placement: '', wwcd: false });
  }

  const matches = defaultMaps.map((mapName, mIdx) => ({
    matchNo: mIdx + 1,
    title: `Match ${mIdx + 1}`,
    map: mapName,
    slots: initialTeams.map((t, idx) => {
      const placement = mIdx === 0 ? t.placement : '';
      const elims = mIdx === 0 ? t.elims : 0;
      const wwcd = mIdx === 0 ? Boolean(t.wwcd) : false;
      const placePts = placement !== '' ? getPlacementPoints(placement) : 0;
      return {
        slot: idx + 1,
        teamName: t.name,
        placement,
        elims,
        wwcd,
        placePts,
        totalPts: placePts + elims
      };
    })
  }));

  return {
    title: 'PUBG Mobile Scrim Demo',
    matches,
    synced: false
  };
};

const uploadMediaToSupabase = async (file, folder = 'uploads') => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('scrim-assets')
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('scrim-assets')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

const WHY_SWITCH_FAQS = [
  {
    id: 'sheet-vs-scrimhub',
    badge: 'Formula Kebal Ralat',
    question: 'Kenapa penganjur tak patut lagi guna Google Sheet atau Excel?',
    answer: 'Formula Google Sheet mudah rosak atau terpadam bila ramai orang edit. Di samping itu, spreadsheet tidak menyusun tiebreaker automatik dan perlukan Canva asing untuk lukis poster. Di sini, kiraan PMGC dan rekaan poster Standings HD siap serentak dalam beberapa saat.',
    highlights: ['Formula PMGC kebal ralat', 'Auto-jana poster HD', 'Mesra skrin telefon bimbit']
  },
  {
    id: 'import-whatsapp-discord',
    badge: 'Pendaftaran 1-Klik',
    question: 'Bagaimana cara susun 16 slot pasukan dalam masa 2 saat?',
    answer: 'Gunakan fungsi "Import WA". Hanya salin mesej pendaftaran pasukan daripada WhatsApp atau Discord, tekan butang Import, dan sistem akan mengesan serta mengisi 16 slot pasukan secara tersusun tanpa perlu taip satu per satu.',
    highlights: ['Salin & tampal teks mesej', 'Tapis nombor dan simbol automatik', 'Jimat 90% masa persediaan match']
  },
  {
    id: 'pmgc-scoring-standard',
    badge: 'Format Rasmi PMGC',
    question: 'Adakah kiraan mata dan kedudukan mengikut peraturan rasmi PMGC?',
    answer: 'Ya, 100% mematuhi sistem mata rasmi PMGC (WWCD = 10 mata, Tempat Ke-2 = 6 mata, setiap Elimination = 1 mata). Sistem turut mengira pemecah seri (Tiebreaker) automatik mengikut keutamaan: Jumlah Mata > Mata Penempatan > Jumlah Elims > Kemenangan WWCD.',
    highlights: ['Standard PMGC 10-Point System', 'Auto-tiebreaker rasmi', 'Keputusan adil & telus']
  },
  {
    id: 'mobile-hd-posters',
    badge: 'Eksport Segera',
    question: 'Bolehkah poster Overall Standings dijana terus dari telefon bimbit?',
    answer: 'Ya. Bila markah selesai diisi, tekan satu butang "Export PNG". Poster Overall Standings resolusi HD sedia dimuat turun terus ke galeri telefon bimbit anda untuk dikongsi ke WhatsApp Status & Instagram Story tanpa watermark.',
    highlights: ['1-Klik Export PNG', 'Resolusi HD tajam', 'Sesuai untuk WhatsApp & IG']
  },
  {
    id: 'collective-database-ecosystem',
    badge: 'Portfolio Pasukan & Penaja',
    question: 'Bagaimana rekod kejohanan membantu pasukan dapatkan tajaan & scouting?',
    answer: 'Setiap perlawanan yang dianjurkan oleh mana-mana admin di seluruh Malaysia disimpan secara kolektif. Pasukan boleh menggunakan rekod konsistensi ini sebagai portfolio rasmi untuk pitching tajaan, manakala pasukan profesional luar boleh merujuk database ini untuk scouting bakat baharu.',
    highlights: ['Portfolio rasmi tajaan', 'Rujukan scouting pro team', 'Data kolektif seluruh Malaysia']
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['playground', 'home', 'standings', 'leaderboard', 'history', 'teams', 'database', 'hosts', 'showcase', 'about', 'privacy', 'terms', 'admin', 'scrim-data'].includes(hash)) {
        if (hash === 'standings' || hash === 'leaderboard') return 'history';
        if (hash === 'database') return 'teams';
        if (hash === 'home') return 'playground';
        return hash;
      }
    } catch {
      // ignore
    }
    return 'playground';
  });

  // Page / Tab History Stack & OCR Inner Overlay State for Mobile Back-Button Navigation
  const [tabHistory, setTabHistory] = useState([]);
  const [navDirection, setNavDirection] = useState('forward');
  const [tabBlurStage, setTabBlurStage] = useState('idle');
  const tabTransitionTimerRef = useRef(null);
  const activeTabRef = useRef(activeTab);
  const [ocrOverlayCount, setOcrOverlayCount] = useState(0);
  const closeOcrOverlayRef = useRef(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (tabTransitionTimerRef.current) {
        window.clearTimeout(tabTransitionTimerRef.current);
      }
    };
  }, []);

  // Top Right Hamburger 3-Line Menu State
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [activeHeaderInfo, setActiveHeaderInfo] = useState(null);
  const toggleHeaderInfo = (key) => setActiveHeaderInfo(prev => prev === key ? null : key);

  // Guide Presentation Modal State (Auto-buka jika URL ada #guide atau #panduan)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      return hash === 'guide' || hash === 'panduan' || hash === 'tutorial';
    } catch {
      return false;
    }
  });
  const [currentGuideSlide, setCurrentGuideSlide] = useState(0);

  // Admin Live Leaderboard Poster Ref & State
  const adminPosterRef = useRef(null);
  const [adminPosterViewMode, setAdminPosterViewMode] = useState('overall'); // 'overall' or 'match'
  const [isDownloadingAdminPoster, setIsDownloadingAdminPoster] = useState(false);
  const [isCreateScrimOpen, setIsCreateScrimOpen] = useState(false);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  
  // Playground Local-First State & Poster Ref
  const posterRef = useRef(null);
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);
  const [isSavingCloudMatch, setIsSavingCloudMatch] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingCloudSync, setPendingCloudSync] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState(() => {
    try {
      const raw = localStorage.getItem('pubg_saved_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved accounts:', e);
    }
    return [];
  });

  const [currentPlaygroundMatchIdx, setCurrentPlaygroundMatchIdx] = useState(0);
  const [posterViewMode, setPosterViewMode] = useState('overall'); // 'overall' (default) or 'match'

  // Quick WhatsApp / Discord Text Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');

  // Mobile Scorer View Scroll Tracking
  const [isScrolledToPoster, setIsScrolledToPoster] = useState(false);
  const [expandedWhyIdx, setExpandedWhyIdx] = useState(0);
  const [isHallOfFameSearchOpen, setIsHallOfFameSearchOpen] = useState(false);
  const [isHallOfFameFullView, setIsHallOfFameFullView] = useState(false);
  const [isHistorySearchOpen, setIsHistorySearchOpen] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');

  // Homepage Interactive Card Slider State (5 cards + 2 clones for seamless forward loop)
  const HOME_SLIDER_TOTAL = 5;
  const [homeSlideTrackIdx, setHomeSlideTrackIdx] = useState(0);
  const [isHomeSliderAnimating, setIsHomeSliderAnimating] = useState(true);
  const [isHomeSliderPaused, setIsHomeSliderPaused] = useState(false);
  const homeSliderTouchStartX = useRef(null);

  const activeHomeSlide = homeSlideTrackIdx % HOME_SLIDER_TOTAL;

  const advanceHomeSlider = useCallback(() => {
    setIsHomeSliderAnimating(true);
    setHomeSlideTrackIdx(prev => (prev >= HOME_SLIDER_TOTAL ? 1 : prev + 1));
  }, []);

  const prevHomeSlider = useCallback(() => {
    setIsHomeSliderAnimating(true);
    setHomeSlideTrackIdx(prev => (prev <= 0 ? HOME_SLIDER_TOTAL - 1 : prev - 1));
  }, []);

  const goToHomeSlide = useCallback((targetIdx) => {
    setIsHomeSliderAnimating(true);
    setHomeSlideTrackIdx(targetIdx);
  }, []);

  useEffect(() => {
    if (homeSlideTrackIdx === HOME_SLIDER_TOTAL) {
      const resetTimer = setTimeout(() => {
        setIsHomeSliderAnimating(false);
        setHomeSlideTrackIdx(0);
      }, 700);
      return () => clearTimeout(resetTimer);
    }
    if (!isHomeSliderAnimating && homeSlideTrackIdx === 0) {
      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setIsHomeSliderAnimating(true);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
  }, [homeSlideTrackIdx, isHomeSliderAnimating]);

  useEffect(() => {
    if (activeTab !== 'playground' && activeTab !== 'home') return;
    if (isHomeSliderPaused) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      advanceHomeSlider();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab, isHomeSliderPaused, advanceHomeSlider, homeSlideTrackIdx]);

  const [playgroundSession, setPlaygroundSession] = useState(() => {
    try {
      const saved = localStorage.getItem('scrim_active_match');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
          // Migrasi: Jika cache menyimpan mock default lama (Geek Fam & SEM9), gantikan dengan format bersih
          const firstTeam = parsed.matches[0]?.slots?.[0]?.teamName;
          const secondTeam = parsed.matches[0]?.slots?.[1]?.teamName;
          if (firstTeam === 'Geek Fam' && secondTeam === 'SEM9') {
            return createDefaultPlaygroundSession(16);
          }
          return parsed;
        }
        if (parsed && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
          const m1Slots = parsed.slots;
          const defaultMaps = PLAYGROUND_DEFAULT_MAPS;
          const matches = defaultMaps.map((mapName, mIdx) => ({
            matchNo: mIdx + 1,
            title: `Match ${mIdx + 1}`,
            map: mIdx === 0 ? (parsed.map || mapName) : mapName,
            slots: m1Slots.map(s => ({
              slot: s.slot,
              teamName: s.teamName,
              placement: mIdx === 0 ? s.placement : '',
              elims: mIdx === 0 ? s.elims : 0,
              wwcd: mIdx === 0 ? Boolean(s.wwcd) : false,
              placePts: mIdx === 0 ? s.placePts : 0,
              totalPts: mIdx === 0 ? s.totalPts : 0
            }))
          }));
          return {
            title: parsed.title || 'PUBG Mobile Scrim Season',
            matches,
            synced: false
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage scrim_active_match:', e);
    }
    return createDefaultPlaygroundSession(16);
  });

  useEffect(() => {
    try {
      localStorage.setItem('scrim_active_match', JSON.stringify(playgroundSession));
    } catch (e) {
      console.warn('Failed to sync scrim_active_match to localStorage:', e);
    }
  }, [playgroundSession]);

  // Pastikan skrin sentiasa kembali ke atas (scroll to top) apabila bertukar tab/feature
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 20);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Kesan sama ada pengguna sedang berada di bahagian poster untuk navigasi pantas mobile
  useEffect(() => {
    if (activeTab !== 'scorer' && activeTab !== 'admin') return;
    const targetId = activeTab === 'admin' ? 'admin-leaderboard-preview' : 'quick-scorer-leaderboard';
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolledToPoster(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeTab]);

  // Keyboard navigation untuk slide presentation panduan
  useEffect(() => {
    if (!isGuideModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentGuideSlide(prev => Math.min(prev + 1, 3));
      } else if (e.key === 'ArrowLeft') {
        setCurrentGuideSlide(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setIsGuideModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuideModalOpen]);

  // Dengar perubahan URL hash untuk buka panduan jika pelawat tekan pautan #guide
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'guide' || hash === 'panduan' || hash === 'tutorial') {
        setIsGuideModalOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const currentMatch = useMemo(() => {
    return playgroundSession.matches[currentPlaygroundMatchIdx] || playgroundSession.matches[0];
  }, [playgroundSession, currentPlaygroundMatchIdx]);

  // Overall Standings across all 5 matches
  const sortedOverallLeaderboard = useMemo(() => {
    if (!playgroundSession || !playgroundSession.matches || playgroundSession.matches.length === 0) return [];
    const firstMatchSlots = playgroundSession.matches[0]?.slots || [];
    const slotCount = firstMatchSlots.length;
    
    const aggregated = [];
    for (let i = 0; i < slotCount; i++) {
      const slotNum = i + 1;
      const teamName = firstMatchSlots[i]?.teamName || `Squad ${slotNum}`;
      let totalWWCD = 0;
      let totalPlacePts = 0;
      let totalElims = 0;
      let bestPlacement = 999;
      let matchesPlayed = 0;

      playgroundSession.matches.forEach(m => {
        const slotData = m.slots?.[i];
        if (slotData) {
          const elims = Number(slotData.elims) || 0;
          const placePts = Number(slotData.placePts) || 0;
          const isWWCD = slotData.wwcd || Number(slotData.placement) === 1;
          if (isWWCD) totalWWCD += 1;
          totalElims += elims;
          totalPlacePts += placePts;

          if (slotData.placement !== '' && !isNaN(Number(slotData.placement))) {
            const p = Number(slotData.placement);
            if (p < bestPlacement) bestPlacement = p;
            matchesPlayed += 1;
          }
        }
      });

      const totalPts = totalPlacePts + totalElims;
      aggregated.push({
        slot: slotNum,
        teamName,
        totalWWCD,
        totalPlacePts,
        totalElims,
        totalPts,
        bestPlacement,
        matchesPlayed
      });
    }

    return aggregated.sort((a, b) => {
      // 1. Total Points (descending)
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      // 2. Placement Points (descending, tiebreaker 1: Placement Points First!)
      if (b.totalPlacePts !== a.totalPlacePts) return b.totalPlacePts - a.totalPlacePts;
      // 3. Total Elims (descending, tiebreaker 2)
      if (b.totalElims !== a.totalElims) return b.totalElims - a.totalElims;
      // 4. Total WWCD (descending, tiebreaker 3)
      if (b.totalWWCD !== a.totalWWCD) return b.totalWWCD - a.totalWWCD;
      // 5. Best single match placement (ascending, tiebreaker 4)
      if (a.bestPlacement !== b.bestPlacement) return a.bestPlacement - b.bestPlacement;
      // 6. Slot # ascending
      return a.slot - b.slot;
    });
  }, [playgroundSession]);

  const hasAnyPlaygroundScores = useMemo(() => {
    return sortedOverallLeaderboard.some(r => r.totalPts > 0 || r.matchesPlayed > 0);
  }, [sortedOverallLeaderboard]);

  // Current single match sorted leaderboard
  const sortedCurrentMatchLeaderboard = useMemo(() => {
    if (!currentMatch || !currentMatch.slots) return [];
    return [...currentMatch.slots].sort((a, b) => {
      // 1. Total Points (descending)
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      // 2. Placement Points (descending, tiebreaker 1: Placement Points First!)
      if (b.placePts !== a.placePts) return b.placePts - a.placePts;
      // 3. Elims (descending, tiebreaker 2)
      if (b.elims !== a.elims) return b.elims - a.elims;
      // 4. Placement (ascending)
      const placeA = Number(a.placement) || 999;
      const placeB = Number(b.placement) || 999;
      if (placeA !== placeB) return placeA - placeB;
      return a.slot - b.slot;
    });
  }, [currentMatch]);

  const handlePlaygroundSlotChange = (slotIndex, field, value) => {
    setPlaygroundSession(prev => {
      const updatedMatches = prev.matches.map((m, mIdx) => {
        // If teamName changes, keep team names in sync across all matches!
        if (field === 'teamName') {
          const updatedSlots = [...m.slots];
          if (updatedSlots[slotIndex]) {
            updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], teamName: value };
          }
          return { ...m, slots: updatedSlots };
        }

        // Other fields apply ONLY to the currently selected match
        if (mIdx !== currentPlaygroundMatchIdx) return m;

        const updatedSlots = [...m.slots];
        const row = { ...updatedSlots[slotIndex] };

        if (field === 'elims') {
          const e = Math.max(0, parseInt(value, 10) || 0);
          row.elims = e;
          row.totalPts = row.placePts + e;
          updatedSlots[slotIndex] = row;
        } else if (field === 'placement') {
          const newPlace = value === '' ? '' : parseInt(value, 10);
          const oldPlace = row.placement !== '' && !isNaN(parseInt(row.placement, 10)) ? parseInt(row.placement, 10) : '';

          if (newPlace === '' || isNaN(newPlace)) {
            row.placement = '';
            row.placePts = 0;
            row.wwcd = false;
            row.totalPts = row.elims;
            updatedSlots[slotIndex] = row;
          } else {
            const conflictIdx = updatedSlots.findIndex((s, i) => i !== slotIndex && Number(s.placement) === newPlace);
            row.placement = newPlace;
            row.placePts = getPlacementPoints(newPlace);
            row.wwcd = newPlace === 1;
            row.totalPts = row.placePts + row.elims;
            updatedSlots[slotIndex] = row;

            if (conflictIdx !== -1) {
              const conflicting = { ...updatedSlots[conflictIdx] };
              conflicting.placement = oldPlace !== '' ? oldPlace : '';
              conflicting.placePts = conflicting.placement !== '' ? getPlacementPoints(conflicting.placement) : 0;
              conflicting.wwcd = conflicting.placement === 1;
              conflicting.totalPts = conflicting.placePts + conflicting.elims;
              updatedSlots[conflictIdx] = conflicting;
            }
          }
        } else if (field === 'wwcd') {
          const isNowWWCD = Boolean(value);
          if (isNowWWCD) {
            const existingChampIdx = updatedSlots.findIndex((s, i) => i !== slotIndex && Number(s.placement) === 1);
            const oldPlace = row.placement !== '' && !isNaN(parseInt(row.placement, 10)) ? parseInt(row.placement, 10) : '';
            row.placement = 1;
            row.placePts = 10;
            row.wwcd = true;
            row.totalPts = 10 + row.elims;
            updatedSlots[slotIndex] = row;

            if (existingChampIdx !== -1) {
              const prevChamp = { ...updatedSlots[existingChampIdx] };
              prevChamp.placement = oldPlace !== '' ? oldPlace : '';
              prevChamp.placePts = prevChamp.placement !== '' ? getPlacementPoints(prevChamp.placement) : 0;
              prevChamp.wwcd = false;
              prevChamp.totalPts = prevChamp.placePts + prevChamp.elims;
              updatedSlots[existingChampIdx] = prevChamp;
            }
          } else {
            row.wwcd = false;
            row.placement = '';
            row.placePts = 0;
            row.totalPts = row.elims;
            updatedSlots[slotIndex] = row;
          }
        }

        return { ...m, slots: updatedSlots };
      });

      return { ...prev, matches: updatedMatches, synced: false };
    });
  };

  const handleAddPlaygroundTeam = () => {
    setPlaygroundSession(prev => {
      const currentCount = prev.matches[0]?.slots?.length || 16;
      if (currentCount >= 24) {
        showToast('Limit 24 team dah penuh.');
        return prev;
      }
      const newSlotNo = currentCount + 1;
      const defaultName = `Squad ${newSlotNo}`;

      const updatedMatches = prev.matches.map(m => ({
        ...m,
        slots: [
          ...m.slots,
          {
            slot: newSlotNo,
            teamName: defaultName,
            placement: '',
            elims: 0,
            wwcd: false,
            placePts: 0,
            totalPts: 0
          }
        ]
      }));

      showToast(`Slot #${newSlotNo} ditambah (${newSlotNo} team).`);
      return { ...prev, matches: updatedMatches, synced: false };
    });
  };

  const handleRemovePlaygroundTeam = () => {
    setPlaygroundSession(prev => {
      const currentCount = prev.matches[0]?.slots?.length || 16;
      if (currentCount <= 2) {
        showToast('Perlu sekurang-kurangnya 2 team.');
        return prev;
      }
      const updatedMatches = prev.matches.map(m => ({
        ...m,
        slots: m.slots.slice(0, -1)
      }));

      showToast(`Slot #${currentCount} dibuang (${currentCount - 1} team).`);
      return { ...prev, matches: updatedMatches, synced: false };
    });
  };



  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);
  const [inputMap, setInputMap] = useState('Erangel');


  
  // Dynamic Match Slots
  const [matchSlots, setMatchSlots] = useState(() => {
    return Array.from({ length: 16 }, (_, idx) => ({
      slot: idx + 1,
      teamId: '',
      teamName: '',
      tag: '',
      placement: '',
      kills: 0,
      placePts: 0,
      totalPts: 0
    }));
  });

  
  const handleParseAndImportTeams = () => {
    if (!importRawText.trim()) return;

    const lines = importRawText.split(/\r?\n/);
    const extracted = [];

    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (!line) continue;

      // Abaikan header umum seperti "SLOT SCRIM", "SENARAI PASUKAN", etc.
      if (/^(slot|team|squad|scrim|pubg|senarai|daftar|match|jadual|format|waktu|time|date|tarikh|host|group)/i.test(line) && !/^\d+/.test(line)) {
        continue;
      }

      // Buang prefix seperti "1.", "Slot 1:", "01)", "- ", "#1 "
      line = line.replace(/^(?:slot\s*\d+[\s:.-]*|#?\d+[\s:.)-]*|[-*•]\s*)/i, '').trim();

      // Buang nombor telefon atau nota tambahan di hujung jika ada
      line = line.replace(/\s*-\s*\+?\d{8,}.*$/, '').trim();

      if (line.length >= 2) {
        extracted.push(line);
      }
    }

    if (extracted.length === 0) {
      showToast('Tak jumpa nama team dalam teks ni.');
      return;
    }

    if (activeTab === 'admin') {
      const targetCount = Math.min(24, Math.max(matchSlots.length || 16, extracted.length));
      setMatchSlots(prev => {
        return Array.from({ length: targetCount }, (_, idx) => {
          const existingSlot = prev[idx];
          const newTeamName = extracted[idx] || existingSlot?.teamName || `Slot ${idx + 1}`;
          return {
            slot: idx + 1,
            teamId: existingSlot?.teamId || '',
            teamName: newTeamName,
            tag: existingSlot?.tag || '',
            placement: existingSlot?.placement ?? '',
            kills: existingSlot?.kills ?? 0,
            placePts: existingSlot?.placePts ?? 0,
            totalPts: existingSlot?.totalPts ?? 0,
            wwcd: existingSlot?.wwcd ?? false
          };
        });
      });
      showToast(`${extracted.length} team dah masuk ke sesi Host.`);
      setIsImportModalOpen(false);
      setImportRawText('');
      return;
    }

    // Kemaskini playgroundSession dengan nama-nama yang diimport
    setPlaygroundSession(prev => {
      const targetCount = Math.min(24, Math.max(prev.matches[0]?.slots?.length || 16, extracted.length));

      const updatedMatches = prev.matches.map((m) => {
        const slots = Array.from({ length: targetCount }, (_, idx) => {
          const existingSlot = m.slots?.[idx];
          const newTeamName = extracted[idx] || existingSlot?.teamName || `Slot ${idx + 1}`;
          return {
            slot: idx + 1,
            teamName: newTeamName,
            placement: existingSlot?.placement ?? '',
            elims: existingSlot?.elims ?? 0,
            wwcd: existingSlot?.wwcd ?? false,
            placePts: existingSlot?.placePts ?? 0,
            totalPts: existingSlot?.totalPts ?? 0
          };
        });
        return { ...m, slots };
      });

      return { ...prev, matches: updatedMatches, synced: false };
    });

    showToast(`${extracted.length} team dah masuk ke semua 5 match.`);
    setIsImportModalOpen(false);
    setImportRawText('');
  };

  const handleSetPlaygroundTitle = (newTitle) => {
    setPlaygroundSession(prev => ({
      ...prev,
      title: newTitle,
      synced: false
    }));
  };

  const handleCellKeyDown = (e, rowIdx, colName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (colName === 'teamName') {
        const nextInput = document.querySelector(`[data-cell="teamName-${rowIdx + 1}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      } else if (colName === 'elims') {
        const nextInput = document.querySelector(`[data-cell="elims-${rowIdx + 1}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      } else if (colName === 'placement') {
        const nextInput = document.querySelector(`[data-cell="placement-${rowIdx + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'ArrowDown') {
      const nextInput = document.querySelector(`[data-cell="${colName}-${rowIdx + 1}"]`);
      if (nextInput) {
        e.preventDefault();
        nextInput.focus();
        nextInput.select?.();
      }
    } else if (e.key === 'ArrowUp') {
      const prevInput = document.querySelector(`[data-cell="${colName}-${rowIdx - 1}"]`);
      if (prevInput) {
        e.preventDefault();
        prevInput.focus();
        prevInput.select?.();
      }
    }
  };

  const handleClearPlaygroundForm = () => {
    if (!window.confirm('Clear semua markah untuk 5 match? Nama team masih kekal.')) return;
    setPlaygroundSession(prev => {
      const updatedMatches = prev.matches.map(m => ({
        ...m,
        slots: m.slots.map(s => ({
          ...s,
          placement: '',
          elims: 0,
          wwcd: false,
          placePts: 0,
          totalPts: 0
        }))
      }));
      return { ...prev, matches: updatedMatches, synced: false };
    });
    showToast('Markah dah clear.');
  };

  const handleResetPlaygroundToDefault = () => {
    if (!window.confirm('Reset balik form ke 16 slot kosong?')) return;
    setPlaygroundSession(createDefaultPlaygroundSession(16));
    setCurrentPlaygroundMatchIdx(0);
    showToast('Form dah reset ke 16 slot.');
  };

  const handleLoadDemoPlaygroundData = () => {
    setPlaygroundSession(createDemoPlaygroundSession(16));
    setCurrentPlaygroundMatchIdx(0);
    showToast('Data demo dah load.');
    setTimeout(() => {
      const el = document.getElementById('quick-scorer-workspace');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleCopyGuideLink = () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#guide`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link panduan dah copy.');
        }).catch(() => {
          showToast(`Link panduan: ${url}`);
        });
      } else {
        showToast(`Link panduan: ${url}`);
      }
    } catch {
      showToast('Link: ' + window.location.href);
    }
  };

  const handleDownloadPlaygroundPoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsDownloadingPoster(true);
      const dataUrl = await toPng(posterRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#0D0D0D'
      });
      const link = document.createElement('a');
      const cleanTitle = (playgroundSession.title || 'pubg-scrim-results')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const suffix = posterViewMode === 'overall' 
        ? 'overall-standings-5-matches' 
        : `match-${currentPlaygroundMatchIdx + 1}-${currentMatch.map.toLowerCase()}`;
      link.download = `${cleanTitle}-${suffix}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Poster Leaderboard PNG dah download.');
    } catch (err) {
      console.error('Error generating poster:', err);
      showToast('Tak dapat download poster: ' + err.message);
    } finally {
      setIsDownloadingPoster(false);
    }
  };

  const handleDownloadAdminPoster = async () => {
    if (!adminPosterRef.current || !activeAdminScrim) return;
    try {
      setIsDownloadingAdminPoster(true);
      const dataUrl = await toPng(adminPosterRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#0D0D0D'
      });
      const link = document.createElement('a');
      const cleanTitle = (activeAdminScrim.title || 'scrim-hub')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const suffix = adminPosterViewMode === 'overall' 
        ? 'overall-standings' 
        : `match-${selectedMatchIdx + 1}-${(inputMap || 'map').toLowerCase()}`;
      link.download = `${cleanTitle}-${suffix}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Poster Standings PNG dah download.');
    } catch (err) {
      console.error('Error generating poster:', err);
      showToast('Tak dapat download poster: ' + err.message);
    } finally {
      setIsDownloadingAdminPoster(false);
    }
  };

  const syncMatchToCloud = async (user, sessionToSync) => {
    if (!user || !sessionToSync) return;
    try {
      setIsSavingCloudMatch(true);
      const sessionId = 'scrim_' + Date.now();

      // Compile all matches
      const compiledMatches = sessionToSync.matches.map((m, mIdx) => ({
        matchNo: mIdx + 1,
        map: m.map,
        results: m.slots.map(s => {
          const cleanName = s.teamName ? s.teamName.trim() : `Slot #${s.slot}`;
          return {
            teamId: 'tm_' + cleanName.replace(/\s+/g, '_').toLowerCase(),
            teamName: cleanName,
            tag: cleanName.slice(0, 4).toUpperCase(),
            placement: Number(s.placement) || s.slot,
            kills: Number(s.elims) || 0,
            placePts: Number(s.placePts) || 0,
            totalPts: Number(s.totalPts) || 0,
            wwcd: s.wwcd ? 1 : (Number(s.placement) === 1 ? 1 : 0)
          };
        })
      }));

      // Register any new teams into teams directory & database so they feed into Team Performance Info
      const sessionTeamNames = [...new Set(sessionToSync.matches.flatMap(m => m.slots.map(s => s.teamName ? s.teamName.trim() : `Slot #${s.slot}`)))];
      const newTeamsToRegister = [];
      sessionTeamNames.forEach(tName => {
        const cleanTName = resolveTeamDisplayName(cleanTeamDisplayName(tName)) || tName;
        const key = getCanonicalTeamKey(cleanTName);
        if (!teams.some(t => getCanonicalTeamKey(t.name) === key)) {
          const isMec = key === 'mec';
          const finalName = isMec ? 'MEC' : cleanTName;
          const finalTag = isMec ? 'MEC' : finalName.slice(0, 4).toUpperCase();
          newTeamsToRegister.push({
            id: isMec ? 'tm_mec' : ('tm_' + finalName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36)),
            name: finalName,
            tag: finalTag
          });
        }
      });

      if (newTeamsToRegister.length > 0) {
        setTeams(prev => [...prev, ...newTeamsToRegister]);
        try {
          await supabase.from('teams').insert(newTeamsToRegister);
        } catch (tErr) {
          console.info('Teams table sync note:', tErr);
        }
      }

      const newSession = {
        id: sessionId,
        title: sessionToSync.title || 'PUBG Mobile Scrim Season',
        event_type: 'Scrim',
        tier: 'Tier 1 (Pro)',
        description: `Official 5-Match Scrim: Erangel, Erangel, Miramar, Miramar, Rondo.`,
        date: new Date().toISOString().split('T')[0],
        logo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        host_name: profileName || user.email.split('@')[0],
        host_contact: profileContact || '',
        total_matches: sessionToSync.matches.length,
        matches: compiledMatches,
        created_by: user.id,
        co_hosts: [],
        claim_token: 'token_' + Math.random().toString(36).substring(2, 10),
        is_finished: true
      };

      const { error } = await supabase.from('scrims').insert([newSession]);
      if (!error) {
        setScrims(prev => [newSession, ...prev]);
        setAdminSelectedScrimId(newSession.id);
        setSelectedScrimId(newSession.id);
      }

      setPlaygroundSession(prev => ({ ...prev, synced: true }));
      try {
        localStorage.setItem('scrim_active_match', JSON.stringify({ ...sessionToSync, synced: true }));
      } catch {
        // ignore
      }

      showToast('5 Match dah save ke Dashboard & Team Matrix.');
      setIsAuthModalOpen(false);
      setPendingCloudSync(false);
    } catch (err) {
      console.error('Error syncing match to cloud:', err);
      showToast('Match sync note: ' + err.message);
    } finally {
      setIsSavingCloudMatch(false);
    }
  };

  const handleSaveMatchClick = () => {
    if (!currentUser) {
      setPendingCloudSync(true);
      setIsAuthModalOpen(true);
    } else {
      syncMatchToCloud(currentUser, playgroundSession);
    }
  };
  
  const [teams, setTeams] = useState(() => {
    try {
      const raw = localStorage.getItem('pubg_hub_custom_teams');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(INITIAL_FALLBACK_TEAMS.map(t => [t.name.toLowerCase(), t]));
          parsed.forEach(t => {
            if (t && t.name) {
              map.set(t.name.toLowerCase(), { ...map.get(t.name.toLowerCase()), ...t });
            }
          });
          return Array.from(map.values());
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_FALLBACK_TEAMS;
  });
  const [scrims, setScrims] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedScrimId, setSelectedScrimId] = useState('');
  const [adminSelectedScrimId, setAdminSelectedScrimId] = useState('');
  const [isSessionPickerOpen, setIsSessionPickerOpen] = useState(false);
  const [sessionPickerQuery, setSessionPickerQuery] = useState('');
  const [sessionPickerFilter, setSessionPickerFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  
  const [tierFilter, setTierFilter] = useState('All');
  const [searchScrimQuery, setSearchScrimQuery] = useState('');
  const [leaderboardEventTypeFilter, setLeaderboardEventTypeFilter] = useState('All');
  const [teamStatsCategory, setTeamStatsCategory] = useState('ALL');
  const [teamStatsEventType, setTeamStatsEventType] = useState('ALL');
  const [sssFilterSelection, setSssFilterSelection] = useState(() => ({ ...SSS_DEFAULT_SELECTION }));

  const activeSssOptionId = `${sssFilterSelection.season}_${sssFilterSelection.stage}`;

  const activeSssSummaryLabel = useMemo(
    () => formatSssSelectionLabel(sssFilterSelection),
    [sssFilterSelection]
  );

  // Combined filter state object connected to Team Matrix Supabase aggregation
  const teamMatrixFilterState = useMemo(() => ({
    category: teamStatsCategory,
    eventType: teamStatsEventType,
    season: teamStatsCategory === 'SSS' ? sssFilterSelection.season : 'ALL',
    stage: teamStatsCategory === 'SSS' ? sssFilterSelection.stage : 'ALL'
  }), [teamStatsCategory, teamStatsEventType, sssFilterSelection]);

  const handleSelectTeamStatsCategory = (nextCategory) => {
    setTeamStatsCategory(nextCategory);
    if (nextCategory === 'SSS') {
      if (teamStatsCategory !== 'SSS') {
        setSssFilterSelection({ ...SSS_DEFAULT_SELECTION });
      }
    } else {
      setSssFilterSelection({ ...SSS_DEFAULT_SELECTION });
    }
  };

  const handleSelectSssSeason = (seasonValue) => {
    setSssFilterSelection((prev) => ({
      ...prev,
      season: seasonValue === 'ALL' ? 'ALL' : Number(seasonValue)
    }));
  };

  const handleSelectSssStage = (stageKey) => {
    setSssFilterSelection((prev) => ({
      ...prev,
      stage: stageKey || 'GRAND_FINAL'
    }));
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Master Admin (Kuasa Mutlak) State - syahmi3122973@gmail.com
  const isMasterAdmin = useMemo(() => {
    if (!currentUser || !currentUser.email) return false;
    return currentUser.email.trim().toLowerCase() === 'syahmi3122973@gmail.com';
  }, [currentUser]);

  const [isTeamManagerModalOpen, setIsTeamManagerModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [mergeTeamDraft, setMergeTeamDraft] = useState(null);
  const [teamAliasVersion, setTeamAliasVersion] = useState(0);
  const [teamManagerSearch, setTeamManagerSearch] = useState('');
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isUploadingTeamLogo, setIsUploadingTeamLogo] = useState(false);
  const [logoCropSource, setLogoCropSource] = useState(null);
  const logoFileInputRef = useRef(null);

  // Modals & Popovers
  const [inspectedScrim, setInspectedScrim] = useState(null);
  const [inspectedPost, setInspectedPost] = useState(null);
  const [isEditScrimModalOpen, setIsEditScrimModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileMode, setIsEditProfileMode] = useState(false);
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = useState(false);
  const [isScorerActionsMenuOpen, setIsScorerActionsMenuOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceTeam, setPerformanceTeam] = useState(null);
  const [selectedPerformanceHost, setSelectedPerformanceHost] = useState('ALL');
  const [performanceModalCategory, setPerformanceModalCategory] = useState('ALL');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Clear any legacy hardcoded organization entries from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('scrim_hub_user_orgs');
      localStorage.removeItem('scrim_hub_active_org');
    } catch {
      // ignore
    }
  }, []);

  // Feedback Modal
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Bug Report');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const [searchHostQuery, setSearchHostQuery] = useState('');
  const [homeHofSlide, setHomeHofSlide] = useState(0);
  const [isHomeHofPaused, setIsHomeHofPaused] = useState(false);
  const [isHomeHofInteracting, setIsHomeHofInteracting] = useState(false);
  const [homeContendersCategory, setHomeContendersCategory] = useState('ALL');

  useEffect(() => {
    if (activeTab !== 'playground' || isHomeHofPaused || isHomeHofInteracting) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setTimeout(() => {
      setHomeHofSlide((prev) => (prev === 0 ? 1 : 0));
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [activeTab, isHomeHofPaused, isHomeHofInteracting, homeHofSlide]);

  // User Profile States
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const avatarDisplaySrc = useMemo(() => {
    if (avatarFile) {
      try {
        return URL.createObjectURL(avatarFile);
      } catch {
        return null;
      }
    }
    return profileAvatarUrl || null;
  }, [avatarFile, profileAvatarUrl]);

  // New Scrim Modal States
  const [newScrimTitle, setNewScrimTitle] = useState('');
  const [newHostName, setNewHostName] = useState('');
  const [newEventType, setNewEventType] = useState('Scrim');
  const [newScrimTier, setNewScrimTier] = useState('Tier 1 (Pro)');
  const [newScrimDesc, setNewScrimDesc] = useState('');
  const [newScrimDate, setNewScrimDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHostContact, setNewHostContact] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function initApp() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user || null;
        setCurrentUser(user);
        if (user && session) {
          const acc = {
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0],
            avatarUrl: '',
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token
            },
            lastActive: Date.now()
          };
          setSavedAccounts(prev => {
            const idx = prev.findIndex(a => a.email.toLowerCase() === acc.email.toLowerCase());
            let nextList;
            if (idx !== -1) {
              nextList = [...prev];
              nextList[idx] = { ...prev[idx], session: acc.session, lastActive: Date.now() };
            } else {
              nextList = [acc, ...prev];
            }
            try {
              localStorage.setItem('pubg_saved_accounts', JSON.stringify(nextList));
            } catch {}
            return nextList;
          });
        }
      } catch (err) {
        console.warn('Auth session check note:', err);
      } finally {
        setIsAuthChecking(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const u = session?.user || null;
        setCurrentUser(u);
        setIsAuthChecking(false);
        if (!u || event === 'SIGNED_OUT') {
          setProfileName('');
          setProfileContact('');
          setProfileBio('');
          setProfileAvatarUrl('');
          setAvatarFile(null);
          setNewHostName('');
          setNewHostContact('');
          setNewScrimTitle('');
          setAdminSelectedScrimId('');
          setIsOrgPopoverOpen(false);
          setIsProfileModalOpen(false);
        }
      });

      try {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: true });

        if (teamsData && teamsData.length > 0) {
          setTeams(prevTeams => {
            const map = new Map(teamsData.map(t => [(t.name || '').trim().toLowerCase(), t]));
            try {
              const raw = localStorage.getItem('pubg_hub_custom_teams');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  parsed.forEach(pt => {
                    if (pt && pt.name) {
                      const key = pt.name.trim().toLowerCase();
                      const existing = map.get(key);
                      map.set(key, { ...existing, ...pt });
                    }
                  });
                }
              }
            } catch {}
            return Array.from(map.values());
          });
        }

        const { data: scrimData } = await supabase
          .from('scrims')
          .select('*')
          .order('date', { ascending: false });

        let localSavedScrims = [];
        try {
          const rawLocal = localStorage.getItem('pubg_hub_saved_scrims');
          if (rawLocal) {
            const parsedLocal = JSON.parse(rawLocal);
            if (Array.isArray(parsedLocal)) {
              localSavedScrims = parsedLocal;
            }
          }
        } catch (e) {
          console.warn('Failed to read local saved scrims:', e);
        }

        const dbList = Array.isArray(scrimData) ? scrimData : [];
        const dbIds = new Set(dbList.map((s) => s.id));
        const mergedScrims = [
          ...dbList,
          ...localSavedScrims.filter((s) => s && s.id && !dbIds.has(s.id))
        ];

        if (mergedScrims.length > 0) {
          const sorted = [...mergedScrims].sort((a, b) => {
            const timeA = parseInt(String(a.id).replace(/\D+/g, ''), 10) || 0;
            const timeB = parseInt(String(b.id).replace(/\D+/g, ''), 10) || 0;
            return timeB - timeA;
          });

          setScrims(sorted);
          setSelectedScrimId(sorted[0].id);
          setAdminSelectedScrimId(sorted[0].id);
        }

        const { data: postData } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postData && postData.length > 0) {
          setPosts(postData);
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*');

        if (profileData) {
          setProfiles(profileData);
        }
      } finally {
        setIsDataLoading(false);
      }

      return () => subscription.unsubscribe();
    }

    initApp();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    if (isRegisterMode) {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        showToast('Daftar gagal: ' + error.message);
      } else {
        showToast('Akaun siap! Boleh log masuk sekarang.');
        setIsRegisterMode(false);
        if (data?.user) {
          setCurrentUser(data.user);
          setIsAuthModalOpen(false);
          if (pendingCloudSync) {
            await syncMatchToCloud(data.user, playgroundSession);
          }
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        showToast('Log masuk gagal: ' + error.message);
      } else {
        setCurrentUser(data.user);
        showToast('Welcome back, ' + data.user.email);
        setAuthPassword('');
        setIsAuthModalOpen(false);
        if (data?.user && data?.session) {
          const acc = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email.split('@')[0],
            avatarUrl: '',
            session: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            },
            lastActive: Date.now()
          };
          setSavedAccounts(prev => {
            const filtered = prev.filter(a => a.email.toLowerCase() !== acc.email.toLowerCase());
            const nextList = [acc, ...filtered];
            try {
              localStorage.setItem('pubg_saved_accounts', JSON.stringify(nextList));
            } catch {}
            return nextList;
          });
        }
        if (pendingCloudSync) {
          await syncMatchToCloud(data.user, playgroundSession);
        }
      }
    }
    setAuthLoading(false);
  };

  const handleSwitchAccount = async (targetAccount) => {
    if (!targetAccount) return;
    if (currentUser?.email?.toLowerCase() === targetAccount.email?.toLowerCase()) {
      setIsOrgPopoverOpen(false);
      return;
    }
    if (!targetAccount.session?.access_token || !targetAccount.session?.refresh_token) {
      setAuthEmail(targetAccount.email || '');
      setAuthPassword('');
      setIsAuthModalOpen(true);
      setIsOrgPopoverOpen(false);
      return;
    }
    setIsOrgPopoverOpen(false);
    showToast(`Tukar ke ${targetAccount.name || targetAccount.email}...`);
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: targetAccount.session.access_token,
        refresh_token: targetAccount.session.refresh_token
      });
      if (error) {
        showToast('Sesi dah expired. Log masuk semula.');
        setAuthEmail(targetAccount.email);
        setAuthPassword('');
        setIsAuthModalOpen(true);
      } else if (data?.user) {
        setCurrentUser(data.user);
        showToast(`Dah tukar ke ${targetAccount.name || data.user.email}`);
      }
    } catch (err) {
      showToast('Error tukar akaun: ' + err.message);
    }
  };

  const handleRemoveSavedAccount = (e, emailToRemove) => {
    e.stopPropagation();
    const nextList = savedAccounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    setSavedAccounts(nextList);
    try {
      localStorage.setItem('pubg_saved_accounts', JSON.stringify(nextList));
    } catch {}
    showToast(`${emailToRemove} dibuang dari device ni.`);
    if (currentUser?.email?.toLowerCase() === emailToRemove.toLowerCase()) {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProfileName('');
    setProfileContact('');
    setProfileBio('');
    setProfileAvatarUrl('');
    setAvatarFile(null);
    setNewHostName('');
    setNewHostContact('');
    setNewScrimTitle('');
    setAdminSelectedScrimId('');
    showToast('Dah log keluar.');
  };

  const isAuthorizedAdmin = useCallback((scrim) => {
    if (!currentUser || !scrim) return false;
    if (currentUser.email && currentUser.email.trim().toLowerCase() === 'syahmi3122973@gmail.com') {
      return true;
    }
    const isOwner = scrim.created_by === currentUser.id || scrim.created_by === currentUser.email;
    const isCoHost = scrim.co_hosts && scrim.co_hosts.includes(currentUser.id);
    return isOwner || isCoHost;
  }, [currentUser]);

  const adminHostedScrims = useMemo(() => {
    if (!currentUser) return [];
    return scrims.filter(s => isAuthorizedAdmin(s));
  }, [scrims, currentUser, isAuthorizedAdmin]);

  const formattedDateJoined = useMemo(() => {
    if (currentUser?.created_at) {
      try {
        const d = new Date(currentUser.created_at);
        if (!isNaN(d.getTime())) {
          return `Joined ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        }
      } catch {
        // ignore
      }
    }
    return 'Joined Aug 2026';
  }, [currentUser]);

  const profileHostStats = useMemo(() => {
    const total = adminHostedScrims.length;
    const finished = adminHostedScrims.filter(s => s.is_finished).length;
    const completionRate = total > 0 ? (finished > 0 ? Math.round((finished / total) * 100) : 85) : 100;
    const fillRate = 94;
    const auditRate = 100;
    return { completionRate, fillRate, auditRate, total, active: total - finished };
  }, [adminHostedScrims]);

  const primaryAccountName = useMemo(() => {
    return profileName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Host Admin');
  }, [profileName, currentUser]);

  const activeOrganizationName = primaryAccountName;

  useEffect(() => {
    if (adminHostedScrims.length > 0 && !adminHostedScrims.some(s => s.id === adminSelectedScrimId)) {
      setAdminSelectedScrimId(adminHostedScrims[0].id);
    }
  }, [adminHostedScrims, adminSelectedScrimId]);

  const fallbackDraftScrim = useMemo(() => {
    if (!currentUser) return null;
    const hostDisplayName = profileName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Host Admin');
    const defaultMatches = PLAYGROUND_DEFAULT_MAPS.map((mapName, mIdx) => ({
      matchNo: mIdx + 1,
      map: mapName,
      results: []
    }));
    return {
      id: 'scrim_draft_' + currentUser.id,
      title: 'Official Scrim - Session 1',
      event_type: 'Scrim',
      tier: 'Tier 1 (Pro)',
      description: 'Official PUBG Mobile Scrim Session.',
      date: new Date().toISOString().split('T')[0],
      logo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      host_name: hostDisplayName,
      host_contact: profileContact || '',
      total_matches: defaultMatches.length,
      matches: defaultMatches,
      created_by: currentUser.id,
      co_hosts: [],
      claim_token: 'token_' + (currentUser.id ? currentUser.id.slice(0, 8) : 'admin'),
      is_finished: false,
      is_draft: true
    };
  }, [currentUser, profileName, profileContact]);

  const activeAdminScrim = useMemo(() => {
    const found = adminHostedScrims.find(s => s.id === adminSelectedScrimId);
    if (found) return found;
    if (adminHostedScrims.length > 0) return adminHostedScrims[0];
    return fallbackDraftScrim;
  }, [adminHostedScrims, adminSelectedScrimId, fallbackDraftScrim]);

  // Normalized reactive matches array for activeAdminScrim
  const adminMatchesList = useMemo(() => {
    if (!activeAdminScrim) return [];
    if (Array.isArray(activeAdminScrim.matches) && activeAdminScrim.matches.length > 0) {
      return activeAdminScrim.matches;
    }
    const count = (activeAdminScrim.total_matches && activeAdminScrim.total_matches > 0) ? activeAdminScrim.total_matches : 5;
    return Array.from({ length: count }, (_, mIdx) => ({
      matchNo: mIdx + 1,
      map: PLAYGROUND_DEFAULT_MAPS[mIdx % 5] || 'Erangel',
      results: []
    }));
  }, [activeAdminScrim]);

  const adminMatchCount = adminMatchesList.length;

  useEffect(() => {
    if (adminMatchCount > 0 && selectedMatchIdx >= adminMatchCount) {
      setSelectedMatchIdx(adminMatchCount - 1);
    }
  }, [adminMatchCount, selectedMatchIdx]);

  const handleQuickNewSession = useCallback(() => {
    if (!currentUser) return;
    const hostDisplayName = profileName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Host Admin');
    const sessionNum = adminHostedScrims.length + 1;
    const defaultMatches = PLAYGROUND_DEFAULT_MAPS.map((mapName, mIdx) => ({
      matchNo: mIdx + 1,
      map: mapName,
      results: []
    }));
    const newSession = {
      id: 'scrim_' + Date.now(),
      title: `Official Scrim - Session ${sessionNum}`,
      event_type: 'Scrim',
      tier: 'Tier 1 (Pro)',
      description: 'Official PUBG Mobile Scrim Session.',
      date: new Date().toISOString().split('T')[0],
      logo_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      host_name: hostDisplayName,
      host_contact: profileContact || '',
      total_matches: defaultMatches.length,
      matches: defaultMatches,
      created_by: currentUser.id,
      co_hosts: [],
      claim_token: 'token_' + Math.random().toString(36).substring(2, 10),
      is_finished: false,
      is_draft: true
    };
    setScrims(prev => [newSession, ...prev]);
    setAdminSelectedScrimId(newSession.id);
    setSelectedMatchIdx(0);
    setInputMap('Erangel');
    setMatchSlots(Array.from({ length: 16 }, (_, idx) => ({
      slot: idx + 1,
      teamId: '',
      teamName: '',
      tag: '',
      placement: '',
      kills: 0,
      placePts: 0,
      totalPts: 0,
      wwcd: false
    })));
    showToast(`Sesi baru "${newSession.title}" dah ready!`);
  }, [currentUser, profileName, profileContact, adminHostedScrims.length]);

  useEffect(() => {
    let isMounted = true;

    async function syncUserProfile() {
      if (!currentUser) {
        setProfileName('');
        setProfileContact('');
        setProfileBio('');
        setProfileAvatarUrl('');
        setAvatarFile(null);
        return;
      }

      const cached = profiles.find(p => p.id === currentUser.id);
      if (cached) {
        setProfileName(cached.display_name || '');
        setProfileContact(cached.contact || '');
        setProfileBio(cached.bio || '');
        setProfileAvatarUrl(cached.avatar_url || '');
      } else {
        setProfileName('');
        setProfileContact('');
        setProfileBio('');
        setProfileAvatarUrl('');
      }

      try {
        const { data: userProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (isMounted) {
          if (userProf) {
            setProfileName(userProf.display_name || '');
            setProfileContact(userProf.contact || '');
            setProfileBio(userProf.bio || '');
            setProfileAvatarUrl(userProf.avatar_url || '');
            setProfiles(prev => {
              const filtered = prev.filter(p => p.id !== userProf.id);
              return [...filtered, userProf];
            });
          } else {
            setProfileName('');
            setProfileContact('');
            setProfileBio('');
            setProfileAvatarUrl('');
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }

    syncUserProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser, profiles]);

  const toggleEditProfileMode = useCallback(() => {
    setIsEditProfileMode((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          document.getElementById('profile-drawer-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }
      return next;
    });
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setIsSavingProfile(true);
      let newAvatarUrl = profileAvatarUrl;

      if (avatarFile) {
        newAvatarUrl = await uploadMediaToSupabase(avatarFile, 'avatars');
      }

      const payload = {
        id: currentUser.id,
        display_name: profileName.trim() || currentUser.email.split('@')[0],
        contact: profileContact.trim(),
        bio: profileBio.trim(),
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').upsert(payload);

      if (error) {
        showToast('Profile error: ' + error.message);
      } else {
        setProfiles(prev => {
          const filtered = prev.filter(p => p.id !== currentUser.id);
          return [...filtered, payload];
        });
        setProfileAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        setIsEditProfileMode(false);
        setIsProfileModalOpen(false);
        showToast('Profile dah update!');
      }
    } catch (err) {
      showToast('Tak dapat upload gambar: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    try {
      setIsSendingFeedback(true);
      const payload = {
        id: 'fb_' + Date.now(),
        user_email: feedbackEmail.trim() || currentUser?.email || 'Anonymous Public User',
        category: feedbackCategory,
        message: feedbackMessage.trim(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('feedbacks').insert([payload]);

      if (error) {
        showToast('Error: ' + error.message);
      } else {
        showToast('Feedback dah hantar ke ry.khor. Thank you!');
        setFeedbackMessage('');
        setIsFeedbackModalOpen(false);
      }
    } catch (err) {
      showToast('Tak dapat hantar: ' + err.message);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const [editTargetScrim, setEditTargetScrim] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHostName, setEditHostName] = useState('');
  const [editEventType, setEditEventType] = useState('Scrim');
  const [editTier, setEditTier] = useState('Tier 1 (Pro)');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (activeAdminScrim && activeAdminScrim.matches && activeAdminScrim.matches[selectedMatchIdx]) {
      const saved = activeAdminScrim.matches[selectedMatchIdx];
      setInputMap(saved.map || PLAYGROUND_DEFAULT_MAPS[selectedMatchIdx % 5] || 'Erangel');
      if (saved.results && saved.results.length > 0) {
        setMatchSlots(saved.results.map((r, i) => ({
          slot: i + 1,
          teamId: r.teamId || '',
          teamName: r.teamName || '',
          tag: r.tag || '',
          placement: r.placement !== undefined && r.placement !== null && r.placement !== '' ? r.placement : '',
          kills: Number(r.kills) || 0,
          placePts: Number(r.placePts) || 0,
          totalPts: Number(r.totalPts) || 0,
          wwcd: Boolean(r.wwcd || Number(r.placement) === 1)
        })));
        return;
      }
    } else {
      setInputMap(PLAYGROUND_DEFAULT_MAPS[selectedMatchIdx % 5] || 'Erangel');
    }

    setMatchSlots(prev => {
      const currentCount = prev.length || 16;
      return Array.from({ length: currentCount }, (_, idx) => {
        const carryTeam = prev[idx]?.teamName || activeAdminScrim?.matches?.[0]?.results?.[idx]?.teamName || '';
        const carryId = prev[idx]?.teamId || activeAdminScrim?.matches?.[0]?.results?.[idx]?.teamId || '';
        const carryTag = prev[idx]?.tag || activeAdminScrim?.matches?.[0]?.results?.[idx]?.tag || '';
        return {
          slot: idx + 1,
          teamId: carryId,
          teamName: carryTeam,
          tag: carryTag,
          placement: '',
          kills: 0,
          placePts: 0,
          totalPts: 0,
          wwcd: false
        };
      });
    });
  }, [activeAdminScrim, selectedMatchIdx]);

  // Rekod Scrim: semua pelawat boleh tengok maklumat & leaderboard, tapi akses edit dikawal ketat
  const filteredScrims = useMemo(() => {
    return scrims.filter(s => {
      const matchTier = tierFilter === 'All' || s.tier === tierFilter;
      const matchType = leaderboardEventTypeFilter === 'All' || (s.event_type || 'Scrim') === leaderboardEventTypeFilter;
      const matchStatus =
        historyStatusFilter === 'ALL'
          ? true
          : historyStatusFilter === 'Completed'
          ? Boolean(s.is_finished)
          : !s.is_finished;
      const q = searchScrimQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.tier && s.tier.toLowerCase().includes(q)) ||
        (s.host_name && s.host_name.toLowerCase().includes(q));
      return matchTier && matchType && matchStatus && matchSearch;
    });
  }, [scrims, tierFilter, leaderboardEventTypeFilter, historyStatusFilter, searchScrimQuery]);

  const activePublicScrim = useMemo(() => {
    if (!filteredScrims.length) return null;
    return filteredScrims.find(s => s.id === selectedScrimId) || filteredScrims[0] || null;
  }, [filteredScrims, selectedScrimId]);

  useEffect(() => {
    if (filteredScrims.length > 0 && !filteredScrims.some(s => s.id === selectedScrimId)) {
      setSelectedScrimId(filteredScrims[0].id);
    }
  }, [filteredScrims, selectedScrimId]);

  const handleDeleteScrim = async (scrimId) => {
    if (!currentUser) return;
    const target = scrims.find(s => s.id === scrimId);
    if (!target || !isAuthorizedAdmin(target)) {
      showToast('Awak tak ada akses untuk padam sesi ni.');
      return;
    }

    if (!window.confirm(`Confirm nak padam "${target.title}"? Semua rekod match akan hilang sekali.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('scrims').delete().eq('id', scrimId);
      if (error) throw error;

      try {
        const rawLocal = localStorage.getItem('pubg_hub_saved_scrims');
        if (rawLocal) {
          const parsedLocal = JSON.parse(rawLocal);
          if (Array.isArray(parsedLocal)) {
            localStorage.setItem(
              'pubg_hub_saved_scrims',
              JSON.stringify(parsedLocal.filter((s) => s && s.id !== scrimId))
            );
          }
        }
      } catch {
        // ignore localStorage cleanup errors
      }

      const updated = scrims.filter(s => s.id !== scrimId);
      setScrims(updated);

      if (adminSelectedScrimId === scrimId) {
        setAdminSelectedScrimId(updated[0]?.id || '');
      }
      if (selectedScrimId === scrimId) {
        setSelectedScrimId(updated[0]?.id || '');
      }

      showToast('Sesi dah padam.');
    } catch (err) {
      showToast('Tak dapat padam sesi: ' + err.message);
    }
  };

  const openEditScrimModal = (scrimOverride = null) => {
    const targetScrim = scrimOverride && scrimOverride.id ? scrimOverride : activeAdminScrim;
    if (!targetScrim) return;
    if (!isAuthorizedAdmin(targetScrim)) {
      showToast('Host sesi ini sahaja boleh edit info.');
      return;
    }
    setEditTargetScrim(targetScrim);
    setEditTitle(targetScrim.title || '');
    setEditHostName(targetScrim.host_name || '');
    setEditEventType(targetScrim.event_type || 'Scrim');
    setEditTier(targetScrim.tier || 'Tier 1 (Pro)');
    setEditDate(targetScrim.date || new Date().toISOString().split('T')[0]);
    setEditDesc(targetScrim.description || '');
    setEditContact(targetScrim.host_contact || '');
    setEditLogoFile(null);
    setIsEditScrimModalOpen(true);
  };

  const handleUpdateScrimSettings = async (e) => {
    e.preventDefault();
    const editingScrim = editTargetScrim || activeAdminScrim;
    if (!editingScrim || !isAuthorizedAdmin(editingScrim)) {
      showToast('Akses tak dibenarkan.');
      return;
    }

    try {
      setIsSavingEdit(true);
      let updatedLogoUrl = editingScrim.logo_url;

      if (editLogoFile) {
        updatedLogoUrl = await uploadMediaToSupabase(editLogoFile, 'logos');
      }

      const updatedData = {
        title: editTitle.trim(),
        host_name: editHostName.trim() || editingScrim.host_name || 'Tournament Organizer',
        event_type: editEventType,
        tier: editTier,
        date: editDate || editingScrim.date || new Date().toISOString().split('T')[0],
        description: editDesc.trim(),
        host_contact: editContact.trim(),
        logo_url: updatedLogoUrl
      };

      const { error } = await supabase
        .from('scrims')
        .update(updatedData)
        .eq('id', editingScrim.id);

      if (error) {
        showToast('Update gagal: ' + error.message);
      } else {
        const merged = { ...editingScrim, ...updatedData };
        setScrims(prev => {
          const exists = prev.some(s => s.id === editingScrim.id);
          if (exists) {
            return prev.map(s => s.id === editingScrim.id ? merged : s);
          } else {
            return [merged, ...prev];
          }
        });
        try {
          const rawLocal = localStorage.getItem('pubg_hub_saved_scrims');
          if (rawLocal) {
            const parsedLocal = JSON.parse(rawLocal);
            if (Array.isArray(parsedLocal) && parsedLocal.some((s) => s && s.id === editingScrim.id)) {
              localStorage.setItem(
                'pubg_hub_saved_scrims',
                JSON.stringify(parsedLocal.map((s) => (s && s.id === editingScrim.id ? merged : s)))
              );
            }
          }
        } catch {
          // ignore localStorage sync errors
        }
        setInspectedScrim(prev => (prev && prev.id === editingScrim.id ? merged : prev));
        setIsEditScrimModalOpen(false);
        setEditTargetScrim(null);
        showToast('Setting sesi dah save.');
      }
    } catch (err) {
      showToast('Tak dapat upload logo: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleFinishScrim = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Host sesi ni sahaja boleh lock atau unlock.');
      return;
    }

    const nextState = !activeAdminScrim.is_finished;
    const { error } = await supabase
      .from('scrims')
      .update({ is_finished: nextState })
      .eq('id', activeAdminScrim.id);

    if (error) {
      showToast('Tak dapat update status: ' + error.message);
    } else {
      const updated = { ...activeAdminScrim, is_finished: nextState };
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updated : s));
      setSelectedScrimId(activeAdminScrim.id);
      showToast(nextState ? 'Sesi dah lock (tamat).' : 'Sesi dibuka balik untuk kira markah.');
    }
  };

  const handleAddNewMatch = async () => {
    if (!activeAdminScrim) {
      showToast('Pilih atau buat sesi dulu.');
      return;
    }
    if (activeAdminScrim.is_finished) {
      showToast('Sesi dah lock, tak boleh tambah match.');
      return;
    }

    const currentMatches = adminMatchesList.length > 0 ? [...adminMatchesList] : [];
    const nextMatchNo = currentMatches.length + 1;
    const defaultMap = PLAYGROUND_DEFAULT_MAPS[(nextMatchNo - 1) % 5] || 'Erangel';

    // Roster carry-over: pre-populate team names and tags from existing matches or slots
    const carrySlots = (currentMatches[0]?.results?.length > 0)
      ? currentMatches[0].results.map((r, i) => ({
          slot: i + 1,
          teamId: r.teamId || `tm_${i + 1}`,
          teamName: r.teamName || `Slot ${i + 1}`,
          tag: r.tag || '',
          placement: '',
          kills: 0,
          placePts: 0,
          totalPts: 0,
          wwcd: 0
        }))
      : matchSlots.map((s, i) => ({
          slot: i + 1,
          teamId: s.teamId || `tm_${i + 1}`,
          teamName: s.teamName || `Slot ${i + 1}`,
          tag: s.tag || '',
          placement: '',
          kills: 0,
          placePts: 0,
          totalPts: 0,
          wwcd: 0
        }));

    const newMatch = {
      matchNo: nextMatchNo,
      map: defaultMap,
      results: carrySlots
    };

    const updatedMatches = [...currentMatches, newMatch];
    const updatedScrim = {
      ...activeAdminScrim,
      matches: updatedMatches,
      total_matches: updatedMatches.length
    };

    setScrims(prev => {
      const exists = prev.some(s => s.id === activeAdminScrim.id);
      if (exists) {
        return prev.map(s => s.id === activeAdminScrim.id ? updatedScrim : s);
      } else {
        return [updatedScrim, ...prev];
      }
    });
    setSelectedMatchIdx(updatedMatches.length - 1);
    setInputMap(defaultMap);
    showToast(`Match ${nextMatchNo} (${defaultMap}) dah tambah.`);

    try {
      await supabase.from('scrims').upsert(updatedScrim);
    } catch (err) {
      console.error('Error persisting new round:', err);
    }
  };

  const handleRemoveLastMatch = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) return;
    if (activeAdminScrim.is_finished) {
      showToast('Sesi dah lock, tak boleh padam match.');
      return;
    }

    const currentMatches = adminMatchesList.length > 0 ? [...adminMatchesList] : [];
    if (currentMatches.length <= 1) {
      showToast('Perlu sekurang-kurangnya 1 match.');
      return;
    }

    const lastMatchIndex = currentMatches.length - 1;
    const lastMatch = currentMatches[lastMatchIndex];
    const hasRecordedScores = Boolean(lastMatch?.results?.some(
      r => Number(r.totalPts) > 0 || Number(r.kills) > 0 || (r.placement !== '' && r.placement !== null && r.placement !== undefined)
    ));

    // Confirm only if this match already has saved scores
    if (hasRecordedScores) {
      if (!window.confirm(`Match ${lastMatchIndex + 1} dah ada markah. Confirm nak padam?`)) {
        return;
      }
    }

    const trimmed = currentMatches.slice(0, -1);
    const updatedScrim = {
      ...activeAdminScrim,
      matches: trimmed,
      total_matches: trimmed.length
    };

    setScrims(prev => {
      const exists = prev.some(s => s.id === activeAdminScrim.id);
      if (exists) {
        return prev.map(s => s.id === activeAdminScrim.id ? updatedScrim : s);
      } else {
        return [updatedScrim, ...prev];
      }
    });
    
    // Maintain current index unless it exceeds remaining matches
    if (selectedMatchIdx >= trimmed.length) {
      setSelectedMatchIdx(trimmed.length - 1);
    }

    showToast(`Match ${lastMatchIndex + 1} dah padam.`);

    try {
      await supabase.from('scrims').upsert(updatedScrim);
    } catch (err) {
      console.error('Error removing round:', err);
    }
  };

  const handleAddTeamSlot = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Sesi dah lock, markah tak boleh ubah.');
      return;
    }
    if (matchSlots.length >= 24) {
      showToast('Limit 24 team dah penuh.');
      return;
    }

    setMatchSlots(prev => {
      const nextSlotNum = prev.length + 1;
      const newSlot = {
        slot: nextSlotNum,
        teamId: '',
        teamName: '',
        tag: '',
        placement: '',
        kills: 0,
        placePts: 0,
        totalPts: 0,
        wwcd: false
      };

      return [...prev, newSlot];
    });

    showToast(`Slot #${matchSlots.length + 1} dah tambah.`);
  };

  const handleRemoveTeamSlot = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Sesi dah lock, markah tak boleh ubah.');
      return;
    }
    if (matchSlots.length <= 2) {
      showToast('Perlu sekurang-kurangnya 2 team.');
      return;
    }

    setMatchSlots(prev => prev.slice(0, -1));
    showToast(`Slot #${matchSlots.length} dah buang.`);
  };

  const handleClearAdminForm = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Markah dah lock.');
      return;
    }
    setMatchSlots(prev => prev.map(s => ({
      ...s,
      placement: '',
      kills: 0,
      placePts: 0,
      totalPts: 0,
      wwcd: false
    })));
    showToast(`Markah Match ${selectedMatchIdx + 1} dah clear.`);
  };

  const handleAdminCellKeyDown = (e, rowIdx, colName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (colName === 'teamName') {
        const nextInput = document.querySelector(`[data-cell="admin-teamName-${rowIdx + 1}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      } else if (colName === 'elims') {
        const nextInput = document.querySelector(`[data-cell="admin-elims-${rowIdx + 1}"]`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select?.();
        }
      } else if (colName === 'placement') {
        const nextInput = document.querySelector(`[data-cell="admin-placement-${rowIdx + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'ArrowDown') {
      const nextInput = document.querySelector(`[data-cell="admin-${colName}-${rowIdx + 1}"]`);
      if (nextInput) {
        e.preventDefault();
        nextInput.focus();
        nextInput.select?.();
      }
    } else if (e.key === 'ArrowUp') {
      const prevInput = document.querySelector(`[data-cell="admin-${colName}-${rowIdx - 1}"]`);
      if (prevInput) {
        e.preventDefault();
        prevInput.focus();
        prevInput.select?.();
      }
    }
  };

  const handleSlotChange = (index, field, value) => {
    if (activeAdminScrim?.is_finished) {
      showToast('Sesi dah lock, markah tak boleh ubah.');
      return;
    }

    setMatchSlots(prev => {
      const updated = [...prev];
      const currentRow = { ...updated[index] };

      if (field === 'placement') {
        const newPlacement = value === '' ? '' : parseInt(value, 10);
        const oldPlacement = currentRow.placement !== '' && !isNaN(parseInt(currentRow.placement, 10))
          ? parseInt(currentRow.placement, 10)
          : '';

        if (newPlacement === '' || isNaN(newPlacement)) {
          currentRow.placement = '';
          currentRow.placePts = 0;
          currentRow.wwcd = false;
          currentRow.totalPts = currentRow.kills;
          updated[index] = currentRow;
        } else {
          // Check if another slot currently has this placement
          const conflictIdx = updated.findIndex((r, i) => i !== index && Number(r.placement) === newPlacement);

          currentRow.placement = newPlacement;
          currentRow.placePts = getPlacementPoints(newPlacement);
          currentRow.wwcd = newPlacement === 1;
          currentRow.totalPts = currentRow.placePts + currentRow.kills;
          updated[index] = currentRow;

          // If another team already had this rank, swap cleanly!
          if (conflictIdx !== -1) {
            const conflictingRow = { ...updated[conflictIdx] };
            conflictingRow.placement = oldPlacement !== '' ? oldPlacement : '';
            conflictingRow.placePts = conflictingRow.placement !== '' ? getPlacementPoints(conflictingRow.placement) : 0;
            conflictingRow.wwcd = conflictingRow.placement === 1;
            conflictingRow.totalPts = conflictingRow.placePts + conflictingRow.kills;
            updated[conflictIdx] = conflictingRow;
          }
        }
      } else if (field === 'wwcd') {
        const isNowWWCD = Boolean(value);
        if (isNowWWCD) {
          const existingChampIdx = updated.findIndex((s, i) => i !== index && Number(s.placement) === 1);
          const oldPlace = currentRow.placement !== '' && !isNaN(parseInt(currentRow.placement, 10)) ? parseInt(currentRow.placement, 10) : '';
          currentRow.placement = 1;
          currentRow.placePts = 10;
          currentRow.wwcd = true;
          currentRow.totalPts = 10 + currentRow.kills;
          updated[index] = currentRow;

          if (existingChampIdx !== -1) {
            const prevChamp = { ...updated[existingChampIdx] };
            prevChamp.placement = oldPlace !== '' ? oldPlace : '';
            prevChamp.placePts = prevChamp.placement !== '' ? getPlacementPoints(prevChamp.placement) : 0;
            prevChamp.wwcd = false;
            prevChamp.totalPts = prevChamp.placePts + prevChamp.kills;
            updated[existingChampIdx] = prevChamp;
          }
        } else {
          currentRow.wwcd = false;
          currentRow.placement = '';
          currentRow.placePts = 0;
          currentRow.totalPts = currentRow.kills;
          updated[index] = currentRow;
        }
      } else if (field === 'kills') {
        const kills = Math.max(0, parseInt(value, 10) || 0);
        currentRow.kills = kills;
        currentRow.totalPts = currentRow.placePts + kills;
        updated[index] = currentRow;
      } else if (field === 'teamName') {
        currentRow.teamName = value;
        const cleanVal = value.trim();
        const matched = teams.find(t => 
          t.name.toLowerCase() === cleanVal.toLowerCase() || 
          t.tag.toLowerCase() === cleanVal.toLowerCase()
        );
        if (matched) {
          currentRow.teamId = matched.id;
          currentRow.tag = matched.tag;
        } else {
          currentRow.teamId = cleanVal ? ('tm_' + cleanVal.replace(/\s+/g, '_').toLowerCase()) : '';
          currentRow.tag = cleanVal ? cleanVal.slice(0, 4).toUpperCase() : '';
        }
        updated[index] = currentRow;
      }

      return updated;
    });

    // When teamName is changed, propagate teamName across other matches in activeAdminScrim so admin only enters once!
    if (field === 'teamName' && activeAdminScrim && activeAdminScrim.matches) {
      setScrims(prevScrims => prevScrims.map(scrim => {
        if (scrim.id !== activeAdminScrim.id) return scrim;
        const updatedMatches = (scrim.matches || []).map(m => {
          if (!m.results) return m;
          const updatedResults = [...m.results];
          if (updatedResults[index]) {
            updatedResults[index] = { ...updatedResults[index], teamName: value };
          }
          return { ...m, results: updatedResults };
        });
        return { ...scrim, matches: updatedMatches };
      }));
    }
  };

  const handleAdjustKills = (index, delta) => {
    if (activeAdminScrim?.is_finished) {
      showToast('Markah dah lock.');
      return;
    }
    const current = matchSlots[index].kills;
    handleSlotChange(index, 'kills', Math.max(0, current + delta));
  };

  const handleRandomizeTestData = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Sesi ni dah lock.');
      return;
    }
    const count = matchSlots.length;
    const placements = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setMatchSlots(prev => {
      return prev.map((row, idx) => {
        const place = placements[idx];
        const kills = Math.floor(Math.random() * 12);
        const placePts = getPlacementPoints(place);
        return {
          ...row,
          placement: place,
          kills: kills,
          placePts: placePts,
          totalPts: placePts + kills,
          wwcd: place === 1
        };
      });
    });
    showToast('Data demo dah masuk.');
  };

  const handleSaveMatchScore = async () => {
    if (!currentUser) {
      showToast('Log masuk dulu untuk save markah.');
      return;
    }
    if (!activeAdminScrim) {
      showToast('Pilih atau buat sesi dulu.');
      return;
    }
    if (activeAdminScrim.is_finished) {
      showToast('Sesi dah tamat & markah dah lock.');
      return;
    }

    const compiledResults = matchSlots.map((s, idx) => {
      const p = parseInt(s.placement, 10);
      const validPlacement = !isNaN(p) && p > 0 ? p : idx + 1;
      const placePoints = getPlacementPoints(validPlacement);
      const kills = Number(s.kills) || 0;
      const cleanName = s.teamName && s.teamName.trim() ? s.teamName.trim() : `Team ${s.slot}`;
      const tag = s.tag || cleanName.slice(0, 4).toUpperCase();
      const teamId = s.teamId || ('tm_' + cleanName.replace(/\s+/g, '_').toLowerCase());

      return {
        teamId,
        teamName: cleanName,
        tag,
        placement: validPlacement,
        kills,
        placePts: placePoints,
        totalPts: placePoints + kills,
        wwcd: validPlacement === 1 || Boolean(s.wwcd) ? 1 : 0
      };
    });

    // Register any new teams into teams directory & database so they feed into Team Performance Info
    const sessionTeamNames = [...new Set(compiledResults.map(r => r.teamName))];
    const newTeamsToRegister = [];
    sessionTeamNames.forEach(tName => {
      const cleanTName = resolveTeamDisplayName(cleanTeamDisplayName(tName)) || tName;
      const key = getCanonicalTeamKey(cleanTName);
      if (!teams.some(t => getCanonicalTeamKey(t.name) === key)) {
        const isMec = key === 'mec';
        const finalName = isMec ? 'MEC' : cleanTName;
        const finalTag = isMec ? 'MEC' : finalName.slice(0, 4).toUpperCase();
        newTeamsToRegister.push({
          id: isMec ? 'tm_mec' : ('tm_' + finalName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36)),
          name: finalName,
          tag: finalTag
        });
      }
    });

    if (newTeamsToRegister.length > 0) {
      setTeams(prev => [...prev, ...newTeamsToRegister]);
      try {
        await supabase.from('teams').insert(newTeamsToRegister);
      } catch (tErr) {
        console.info('Teams table sync note:', tErr);
      }
    }

    const existingMatches = adminMatchesList.length > 0 ? [...adminMatchesList] : [];
    while (existingMatches.length <= selectedMatchIdx) {
      const idx = existingMatches.length;
      existingMatches.push({
        matchNo: idx + 1,
        map: PLAYGROUND_DEFAULT_MAPS[idx % 5] || 'Erangel',
        results: []
      });
    }

    const matchData = {
      matchNo: selectedMatchIdx + 1,
      map: inputMap || existingMatches[selectedMatchIdx]?.map || 'Erangel',
      results: compiledResults
    };

    existingMatches[selectedMatchIdx] = matchData;

    const targetId = (activeAdminScrim.id && !activeAdminScrim.id.startsWith('scrim_draft_'))
      ? activeAdminScrim.id
      : 'scrim_' + Date.now();

    const updatedScrim = {
      ...activeAdminScrim,
      id: targetId,
      matches: existingMatches,
      total_matches: existingMatches.length,
      is_draft: false
    };

    const { error } = await supabase.from('scrims').upsert(updatedScrim);

    if (error) {
      showToast('Error: ' + error.message);
    } else {
      setScrims(prev => {
        const filtered = prev.filter(s => s.id !== activeAdminScrim.id && s.id !== targetId);
        return [updatedScrim, ...filtered];
      });
      setAdminSelectedScrimId(targetId);
      setSelectedScrimId(targetId);
      showToast(`Match ${selectedMatchIdx + 1} dah save ke Cloud!`);
    }
  };

  const handleCreateNewScrim = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Log masuk sebagai host dulu untuk buat sesi.');
      return;
    }
    if (!newScrimTitle.trim()) return;

    try {
      setIsUploadingLogo(true);
      let uploadedLogoUrl = '';

      if (logoFile) {
        uploadedLogoUrl = await uploadMediaToSupabase(logoFile, 'logos');
      }

      const generatedToken = 'token_' + Math.random().toString(36).substring(2, 10);
      const hostDisplayName = newHostName.trim() || profileName || currentUser.email.split('@')[0];

      const defaultMatches = PLAYGROUND_DEFAULT_MAPS.map((mapName, mIdx) => ({
        matchNo: mIdx + 1,
        map: mapName,
        results: []
      }));

      const newSession = {
        id: 'scrim_' + Date.now(),
        title: newScrimTitle.trim(),
        event_type: newEventType,
        tier: newScrimTier,
        description: newScrimDesc.trim() || `Official PUBG Mobile ${newEventType === 'Tour' ? 'Tournament' : 'Scrim'} Session.`,
        date: newScrimDate || new Date().toISOString().split('T')[0],
        logo_url: uploadedLogoUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
        host_name: hostDisplayName,
        host_contact: newHostContact.trim() || profileContact || '',
        total_matches: defaultMatches.length,
        matches: defaultMatches,
        created_by: currentUser.id,
        co_hosts: [],
        claim_token: generatedToken,
        is_finished: false
      };

      const { error } = await supabase.from('scrims').insert([newSession]);

      if (error) {
        showToast('Error: ' + error.message);
      } else {
        setScrims([newSession, ...scrims]);
        setAdminSelectedScrimId(newSession.id);
        setSelectedScrimId(newSession.id);
        setSelectedMatchIdx(0);
        setNewScrimTitle('');
        setNewHostName('');
        setNewScrimDesc('');
        setNewHostContact('');
        setLogoFile(null);
        setIsCreateScrimOpen(false);
        showToast(`Sesi ${newEventType === 'Tour' ? 'Tournament' : 'Scrim'} dah siap!`);
      }
    } catch (err) {
      showToast('Upload gagal: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCopyHostShareLink = () => {
    if (!activeAdminScrim) return;
    const shareUrl = `${window.location.origin}?claim_scrim=${activeAdminScrim.id}&token=${activeAdminScrim.claim_token || 'shared'}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Link invite Co-Host dah copy!');
    });
  };

  const [copyFeedback, setCopyFeedback] = useState(false);

  const calculateLeaderboard = (targetScrim, filterType) => {
    if (!targetScrim || !targetScrim.matches || targetScrim.matches.length === 0) {
      return [];
    }

    if (filterType === 'overall') {
      const summaryMap = {};
      const sigToSummaryKey = {};

      targetScrim.matches.forEach((m) => {
        if (!m) return;
        (m.results || []).forEach(r => {
          if (!r || !r.teamId) return;
          const cleanName = cleanTeamDisplayName(r.teamName);
          const isPlaceholder = !cleanName || /^(?:slot\s+\d+|squad\s+#\d+)$/i.test(cleanName);
          const rawKey = (!isPlaceholder && getCanonicalTeamKey(cleanName)) || r.teamId;
          const sig = !isPlaceholder ? getCompactTeamSignature(cleanName) : '';
          let summaryKey = rawKey;
          if (sig) {
            if (sigToSummaryKey[sig]) {
              summaryKey = sigToSummaryKey[sig];
            } else {
              sigToSummaryKey[sig] = rawKey;
            }
          }
          const isMec = summaryKey === 'mec';
          const isDacsVictim = summaryKey === 'dacs x victim';
          const resolvedDisplayName = resolveTeamDisplayName(cleanName);
          const displayTeamName = isMec ? 'MEC' : isDacsVictim ? 'DACS X VICTIM' : (resolvedDisplayName || cleanName || r.teamName);
          const displayTag = isMec ? 'MEC' : isDacsVictim ? 'DACS' : r.tag;
          if (!summaryMap[summaryKey]) {
            summaryMap[summaryKey] = {
              teamId: isMec ? 'tm_mec' : r.teamId,
              teamName: displayTeamName,
              tag: displayTag,
              matchesPlayed: 0,
              wwcd: 0,
              placePts: 0,
              killPts: 0,
              totalPts: 0
            };
          } else if (resolvedDisplayName && resolvedDisplayName.length > (summaryMap[summaryKey].teamName || '').length && (/\b(?:esports?|gaming|official)\b/i.test(resolvedDisplayName) || /\s/.test(resolvedDisplayName))) {
            summaryMap[summaryKey].teamName = resolvedDisplayName;
          }
          const hasScore = (r.placement !== '' && r.placement !== null && r.placement !== undefined) || Number(r.kills) > 0 || Number(r.totalPts) > 0;
          if (hasScore) {
            summaryMap[summaryKey].matchesPlayed += 1;
            summaryMap[summaryKey].wwcd += (typeof r.wwcd === 'number' ? r.wwcd : (r.wwcd ? 1 : (Number(r.placement) === 1 ? 1 : 0)));
            summaryMap[summaryKey].placePts += (Number(r.placePts) || 0);
            summaryMap[summaryKey].killPts += (Number(r.kills) || 0);
            summaryMap[summaryKey].totalPts += (Number(r.totalPts) || 0);
          }
        });
      });

      const list = Object.values(summaryMap);
      list.sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.placePts !== a.placePts) return b.placePts - a.placePts;
        if (b.killPts !== a.killPts) return b.killPts - a.killPts;
        return b.wwcd - a.wwcd;
      });

      return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
    } else {
      const mIdx = parseInt(filterType, 10);
      const match = targetScrim.matches[mIdx];
      if (!match) return [];

      const list = [...(match.results || [])].sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.placePts !== a.placePts) return b.placePts - a.placePts;
        return b.kills - a.kills;
      });

      return list.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        matchesPlayed: 1,
        killPts: item.kills
      }));
    }
  };

  // Admin Live Standings (Overall or Live Match Slots)
  const adminLiveStandings = useMemo(() => {
    if (!activeAdminScrim) return [];
    if (adminPosterViewMode === 'match') {
      return [...matchSlots].sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.placePts !== a.placePts) return b.placePts - a.placePts;
        if (b.kills !== a.kills) return b.kills - a.kills;
        const pA = Number(a.placement) || 999;
        const pB = Number(b.placement) || 999;
        return pA - pB;
      }).map((row, idx) => ({
        rank: idx + 1,
        teamName: row.teamName || `Squad #${row.slot}`,
        matchesPlayed: 1,
        wwcd: Number(row.placement) === 1 ? 1 : 0,
        placePts: row.placePts || 0,
        killPts: row.kills || 0,
        totalPts: row.totalPts || 0,
        slot: row.slot
      }));
    } else {
      const calculated = calculateLeaderboard(activeAdminScrim, 'overall');
      if (calculated.length > 0) return calculated;
      return [...matchSlots].sort((a, b) => {
        if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
        if (b.placePts !== a.placePts) return b.placePts - a.placePts;
        if (b.kills !== a.kills) return b.kills - a.kills;
        return a.slot - b.slot;
      }).map((row, idx) => ({
        rank: idx + 1,
        teamName: row.teamName || `Squad #${row.slot}`,
        matchesPlayed: row.placement ? 1 : 0,
        wwcd: Number(row.placement) === 1 ? 1 : 0,
        placePts: row.placePts || 0,
        killPts: row.kills || 0,
        totalPts: row.totalPts || 0,
        slot: row.slot
      }));
    }
  }, [activeAdminScrim, adminPosterViewMode, matchSlots]);

  const handleCopyDiscordText = (targetSession = activeAdminScrim || activePublicScrim) => {
    if (!targetSession) return;
    const dataToUse = calculateLeaderboard(targetSession, 'overall');
    if (!dataToUse.length) {
      showToast('Belum ada markah untuk copy.');
      return;
    }

    const eventLabel = (targetSession?.event_type === 'Tour' ? 'TOURNAMENT' : 'SCRIM');
    let output = '**' + (targetSession?.title || eventLabel).toUpperCase() + '**\n';
    output += `Type: ${eventLabel} | Tier: ${targetSession?.tier || 'Tier 1'} | Date: ${targetSession?.date || ''}\n`;
    if (targetSession?.is_finished) output += 'STATUS: COMPLETED (FINAL STANDINGS)\n';
    if (targetSession?.host_contact) output += `Contact Host: ${targetSession.host_contact}\n`;
    output += '============================\n';
    output += '# | TEAM | MATCH | WWCD | ELIMS | TOTAL\n';
    output += '============================\n';
    dataToUse.forEach(r => {
      output += `${r.rank}. ${r.teamName} | ${r.matchesPlayed || 1}M | ${r.wwcd || 0}W | ${r.killPts || 0} Elims | ${r.totalPts || 0}PTS\n`;
    });
    output += '============================\n';
    output += 'Generated by scrim.rykhor.my';

    navigator.clipboard.writeText(output).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
      showToast('Teks standings dah copy.');
    }).catch(() => {
      showToast('Tak dapat copy teks standings.');
    });
  };

  // INSTAGRAM STORY INFOGRAPHIC ENGINE
  const handleShareToInstagramStory = async (team, stats, hostFilterName, eventTypeLabel) => {
    if (!team || !stats) {
      showToast('Belum ada statistik untuk buat kad.');
      return;
    }

    const drawRoundRect = (ctx, x, y, w, h, r) => {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };

    const truncateText = (ctx, text, maxWidth) => {
      const str = String(text || '');
      if (ctx.measureText(str).width <= maxWidth) return str;
      let truncated = str;
      while (truncated.length > 1 && ctx.measureText(truncated + '...').width > maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      return truncated + '...';
    };

    const loadCorsImage = (url) => new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => resolve(null), 4000);
      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      img.src = url;
    });

    try {
      setIsGeneratingStory(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const fontSans = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const fontMono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

      // 1. Matte dark solid background matching in-app Team Profile mood
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 1080, 1920);

      // Subtle hairline grid overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let gx = 64; gx < 1080; gx += 95) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, 1920);
        ctx.stroke();
      }

      const padX = 64;
      const contentW = 1080 - padX * 2; // 952

      // Top Header Bar
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 22px ${fontSans}`;
      ctx.fillText('SCRIM HUB', padX, 102);

      ctx.fillStyle = '#71717a';
      ctx.font = `700 18px ${fontMono}`;
      ctx.fillText('•  TEAM ANALYTICS', padX + ctx.measureText('SCRIM HUB').width + 16, 101);

      const scopeTopLabel = `${(eventTypeLabel || 'OFFICIAL SCRIM & TOUR').toUpperCase()} • ${hostFilterName === 'ALL' ? 'ALL HOSTS' : String(hostFilterName || '').toUpperCase()}`;
      ctx.font = `700 16px ${fontMono}`;
      const clampedScopeTop = truncateText(ctx, scopeTopLabel, 460);
      const scopePillW = Math.min(480, ctx.measureText(clampedScopeTop).width + 36);
      drawRoundRect(ctx, 1080 - padX - scopePillW, 72, scopePillW, 42, 21);
      ctx.fillStyle = '#141418';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#a1a1aa';
      ctx.textAlign = 'center';
      ctx.fillText(clampedScopeTop, 1080 - padX - scopePillW / 2, 99);

      // 2. Team Identity Hero Card
      const heroY = 128;
      const heroH = 248;
      drawRoundRect(ctx, padX, heroY, contentW, heroH, 34);
      ctx.fillStyle = '#141418';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Team Avatar (logo_url or solid lime tag box)
      const avatarX = padX + 36;
      const avatarY = heroY + 28;
      const avatarSize = 126;
      const teamLogoImg = await loadCorsImage(team.logo_url);

      if (teamLogoImg) {
        ctx.save();
        drawRoundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 28);
        ctx.clip();
        ctx.fillStyle = '#09090b';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        const scale = Math.max(avatarSize / teamLogoImg.width, avatarSize / teamLogoImg.height);
        const drawW = teamLogoImg.width * scale;
        const drawH = teamLogoImg.height * scale;
        ctx.drawImage(
          teamLogoImg,
          avatarX + (avatarSize - drawW) / 2,
          avatarY + (avatarSize - drawH) / 2,
          drawW,
          drawH
        );
        ctx.restore();
        drawRoundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 28);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        drawRoundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 28);
        ctx.fillStyle = '#D7FF00';
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = `900 36px ${fontSans}`;
        ctx.textAlign = 'center';
        ctx.fillText(truncateText(ctx, team.tag || 'TM', avatarSize - 20), avatarX + avatarSize / 2, avatarY + 76);
      }

      // Compute overall rank matching Team Matrix (#rank without 'Global')
      const targetTeamKey = getCanonicalTeamKey(team.name);
      const rankIdx = Array.isArray(validTeamList)
        ? validTeamList.findIndex(t => getCanonicalTeamKey(t.name) === targetTeamKey)
        : -1;
      const overallRank = rankIdx >= 0 ? rankIdx + 1 : null;

      // Team Name + #Rank pill
      const infoX = avatarX + avatarSize + 30;
      const rightEdgeHero = padX + contentW - 36;
      const sessionCount = stats.results ? stats.results.length : 0;

      ctx.font = `900 42px ${fontSans}`;
      const rankText = overallRank ? `#${overallRank}` : '';
      let rankPillW = 0;
      if (rankText) {
        ctx.font = `900 22px ${fontSans}`;
        rankPillW = ctx.measureText(rankText).width + 30;
      }

      ctx.font = `900 42px ${fontSans}`;
      const maxNameW = rightEdgeHero - infoX - (rankPillW ? rankPillW + 16 : 0);
      const displayTeamName = truncateText(ctx, team.name || 'UNKNOWN TEAM', maxNameW);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(displayTeamName, infoX, avatarY + 52);

      if (rankText) {
        const nameW = ctx.measureText(displayTeamName).width;
        const rPillX = infoX + nameW + 14;
        const rPillY = avatarY + 20;
        drawRoundRect(ctx, rPillX, rPillY, rankPillW, 38, 19);
        ctx.fillStyle = 'rgba(215, 255, 0, 0.14)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(215, 255, 0, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#D7FF00';
        ctx.font = `900 22px ${fontSans}`;
        ctx.textAlign = 'center';
        ctx.fillText(rankText, rPillX + rankPillW / 2, rPillY + 26);
      }

      // Team subtitle
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `600 20px ${fontSans}`;
      ctx.fillText(`Tag: [${team.tag || '---'}]  •  ${sessionCount} Sesi Berdaftar`, infoX, avatarY + 96);

      // Divider & Scope Pills inside Hero Card
      const scopeRowY = heroY + 178;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX + 36, scopeRowY);
      ctx.lineTo(padX + contentW - 36, scopeRowY);
      ctx.stroke();

      ctx.fillStyle = '#71717a';
      ctx.font = `800 17px ${fontSans}`;
      ctx.textAlign = 'left';
      ctx.fillText('SKOP:', padX + 36, scopeRowY + 42);

      const activeScopeText = eventTypeLabel === 'Tournament'
        ? 'Tournament Sahaja'
        : (eventTypeLabel === 'Scrim' ? 'Scrim Sahaja' : 'Semua Rekod');
      ctx.font = `800 18px ${fontSans}`;
      const activePillW = ctx.measureText(activeScopeText).width + 36;
      const scopePillStartX = padX + 106;
      drawRoundRect(ctx, scopePillStartX, scopeRowY + 16, activePillW, 38, 12);
      ctx.fillStyle = '#D7FF00';
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(activeScopeText, scopePillStartX + activePillW / 2, scopeRowY + 41);

      if (hostFilterName && hostFilterName !== 'ALL') {
        const hostTagText = truncateText(ctx, `Host: ${hostFilterName}`, 420);
        ctx.font = `700 17px ${fontSans}`;
        const hostPillW = ctx.measureText(hostTagText).width + 32;
        const hostPillX = scopePillStartX + activePillW + 12;
        drawRoundRect(ctx, hostPillX, scopeRowY + 16, hostPillW, 38, 12);
        ctx.fillStyle = '#18181b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#d4d4d8';
        ctx.fillText(hostTagText, hostPillX + hostPillW / 2, scopeRowY + 41);
      }

      // 3. 4 Bento Stats Cards (2x2 Grid matching Team Profile UI)
      const gridY = 398;
      const gridGap = 18;
      const cardW = (contentW - gridGap) / 2; // 467
      const cardH = 160;
      const matchesCount = stats.matchesCount || 0;
      const avgKillsPerMatch = matchesCount > 0
        ? (Number(stats.totalKills || 0) / matchesCount).toFixed(1)
        : '0.0';

      const bentoCards = [
        {
          x: padX,
          y: gridY,
          label: 'TOTAL POINTS',
          value: String(stats.totalPts || 0),
          valueColor: '#D7FF00',
          sub: `~${stats.avgPts || '0.0'} pts / sesi`,
          glow: 'rgba(215, 255, 0, 0.08)'
        },
        {
          x: padX + cardW + gridGap,
          y: gridY,
          label: 'ELIMINATIONS',
          value: String(stats.totalKills || 0),
          valueColor: '#ffffff',
          sub: `~${avgKillsPerMatch} Elims / match`,
          glow: 'rgba(255, 255, 255, 0.04)'
        },
        {
          x: padX,
          y: gridY + cardH + gridGap,
          label: 'WWCD DINNERS',
          value: String(stats.totalWwcd || 0),
          valueColor: '#D7FF00',
          sub: `${stats.winRate || '0%'} Win Rate`,
          glow: 'rgba(245, 158, 11, 0.07)'
        },
        {
          x: padX + cardW + gridGap,
          y: gridY + cardH + gridGap,
          label: 'SESI / MATCH',
          value: String(sessionCount),
          valueColor: '#ffffff',
          sub: `${matchesCount} match beraksi`,
          glow: 'rgba(16, 185, 129, 0.06)'
        }
      ];

      bentoCards.forEach((c) => {
        drawRoundRect(ctx, c.x, c.y, cardW, cardH, 28);
        ctx.fillStyle = '#121216';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#a1a1aa';
        ctx.font = `800 16px ${fontSans}`;
        ctx.fillText(c.label, c.x + cardW / 2, c.y + 38);

        ctx.fillStyle = c.valueColor;
        ctx.font = `900 62px ${fontSans}`;
        ctx.fillText(c.value, c.x + cardW / 2, c.y + 102);

        ctx.fillStyle = '#71717a';
        ctx.font = `600 17px ${fontMono}`;
        ctx.fillText(c.sub, c.x + cardW / 2, c.y + 138);
      });

      // 4. Profil Gaya Permainan Card (KP vs PP Split Bar)
      const ratioY = gridY + cardH * 2 + gridGap + 22; // 758
      const ratioH = 172;
      const totalPtsNum = Number(stats.totalPts || 0);
      const totalKillsNum = Number(stats.totalKills || 0);
      const placementPtsNum = Math.max(0, totalPtsNum - totalKillsNum);
      const kpPercent = totalPtsNum > 0 ? Math.round((totalKillsNum / totalPtsNum) * 100) : 0;
      const ppPercent = totalPtsNum > 0 ? Math.max(0, 100 - kpPercent) : 0;

      drawRoundRect(ctx, padX, ratioY, contentW, ratioH, 28);
      ctx.fillStyle = '#121216';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `800 16px ${fontSans}`;
      ctx.fillText('PROFIL GAYA PERMAINAN', padX + 36, ratioY + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 22px ${fontSans}`;
      ctx.fillText('Taburan Mata Pasukan', padX + 36, ratioY + 72);

      // Elims / PP percentage readout on right
      const ppText = `PP: ${ppPercent}%`;
      const kpText = `Elims: ${kpPercent}%`;
      ctx.font = `900 22px ${fontMono}`;
      const ppW = ctx.measureText(ppText).width;
      const dotSep = '  •  ';
      const sepW = ctx.measureText(dotSep).width;
      const rightEdgeRatio = padX + contentW - 36;

      ctx.textAlign = 'right';
      ctx.fillStyle = '#2dd4bf';
      ctx.fillText(ppText, rightEdgeRatio, ratioY + 62);

      ctx.fillStyle = '#52525b';
      ctx.fillText(dotSep, rightEdgeRatio - ppW, ratioY + 62);

      ctx.fillStyle = '#D7FF00';
      ctx.fillText(kpText, rightEdgeRatio - ppW - sepW, ratioY + 62);

      // Segmented Progress Bar
      const barX = padX + 36;
      const barY = ratioY + 94;
      const barW = contentW - 72;
      const barH = 20;

      drawRoundRect(ctx, barX, barY, barW, barH, 10);
      ctx.fillStyle = '#27272a';
      ctx.fill();

      ctx.save();
      drawRoundRect(ctx, barX, barY, barW, barH, 10);
      ctx.clip();
      const kpFillW = (barW * kpPercent) / 100;
      if (kpFillW > 0) {
        ctx.fillStyle = '#D7FF00';
        ctx.fillRect(barX, barY, kpFillW, barH);
      }
      if (barW - kpFillW > 0) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(barX + kpFillW, barY, barW - kpFillW, barH);
      }
      ctx.restore();

      // Legend Row
      const legendY = ratioY + 148;
      ctx.fillStyle = '#D7FF00';
      ctx.beginPath();
      ctx.arc(barX + 7, legendY - 6, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#d4d4d8';
      ctx.font = `600 18px ${fontSans}`;
      ctx.fillText(`Elimination Points (${totalKillsNum} pts)`, barX + 22, legendY);

      const rightLegendText = `Placement Points (${placementPtsNum} pts)`;
      ctx.textAlign = 'right';
      ctx.fillText(rightLegendText, barX + barW, legendY);
      const rightLegendW = ctx.measureText(rightLegendText).width;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(barX + barW - rightLegendW - 16, legendY - 6, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. Merged Smooth Dual-Line Chart (Elims vs PP per Scrim)
      const chartY = ratioY + ratioH + 22; // 952
      const chartH = 424;
      const trendSeries = buildScrimTrendSeries(stats.results || [], 8);

      drawRoundRect(ctx, padX, chartY, contentW, chartH, 28);
      ctx.fillStyle = '#121216';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Chart Header & Dual Legend Pills
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a1a1aa';
      ctx.font = `800 16px ${fontSans}`;
      ctx.fillText('TREN PRESTASI PER SCRIM', padX + 36, chartY + 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 24px ${fontSans}`;
      ctx.fillText('Elims vs Placement Points (PP)', padX + 36, chartY + 74);

      const drawLegendPill = (px, py, label, dotColor, bgTint, borderTint, textColor) => {
        ctx.font = `800 16px ${fontMono}`;
        const pw = ctx.measureText(label).width + 46;
        drawRoundRect(ctx, px, py, pw, 34, 17);
        ctx.fillStyle = bgTint;
        ctx.fill();
        ctx.strokeStyle = borderTint;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(px + 18, py + 17, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(label, px + 32, py + 23);
        return pw;
      };

      const ppPillLabel = 'PP';
      ctx.font = `800 16px ${fontMono}`;
      const ppPillW = ctx.measureText(ppPillLabel).width + 46;
      const killsPillLabel = 'Elims';
      const killsPillW = ctx.measureText(killsPillLabel).width + 46;
      const pillRightEdge = padX + contentW - 36;
      drawLegendPill(pillRightEdge - ppPillW, chartY + 34, ppPillLabel, '#2DD4BF', 'rgba(45, 212, 191, 0.12)', 'rgba(45, 212, 191, 0.35)', '#5eead4');
      drawLegendPill(pillRightEdge - ppPillW - 12 - killsPillW, chartY + 34, killsPillLabel, '#D7FF00', 'rgba(215, 255, 0, 0.12)', 'rgba(215, 255, 0, 0.35)', '#D7FF00');

      // Chart Insight KPI Strip
      const stripY = chartY + 96;
      const stripGap = 14;
      const stripCardW = (contentW - 72 - stripGap * 2) / 3;
      const insightCards = [
        {
          label: 'PURATA ELIMS',
          val: `${trendSeries.avgKills} / sesi`,
          color: '#D7FF00'
        },
        {
          label: 'PURATA PP',
          val: `${trendSeries.avgPp} / sesi`,
          color: '#2DD4BF'
        },
        {
          label: 'PUNCAK TERBAIK',
          val: trendSeries.bestScrim ? `${trendSeries.bestScrim.points} PTS` : '-',
          color: '#ffffff'
        }
      ];

      insightCards.forEach((ic, idx) => {
        const ix = padX + 36 + idx * (stripCardW + stripGap);
        drawRoundRect(ctx, ix, stripY, stripCardW, 52, 14);
        ctx.fillStyle = '#0d0d11';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = `700 12px ${fontMono}`;
        ctx.fillText(ic.label, ix + 16, stripY + 20);

        ctx.fillStyle = ic.color;
        ctx.font = `900 19px ${fontMono}`;
        ctx.fillText(truncateText(ctx, ic.val, stripCardW - 32), ix + 16, stripY + 43);
      });

      // Plot Area
      const plotLeft = padX + 42;
      const plotRight = padX + contentW - 64;
      const plotW = plotRight - plotLeft;
      const plotTop = chartY + 186;
      const plotBottom = chartY + 354;
      const plotH = plotBottom - plotTop;

      // Gridlines & Y Scale
      [0, 0.5, 1].forEach((ratio) => {
        const gy = plotBottom - ratio * plotH;
        const yVal = Math.round(trendSeries.yMax * ratio);
        ctx.save();
        ctx.strokeStyle = ratio === 0 ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1.2;
        if (ratio !== 0) ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(plotLeft, gy);
        ctx.lineTo(plotRight, gy);
        ctx.stroke();
        ctx.restore();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#71717a';
        ctx.font = `700 15px ${fontMono}`;
        ctx.fillText(String(yVal), plotRight + 12, gy + 5);
      });

      const tItems = trendSeries.items;
      if (tItems.length === 0) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#71717a';
        ctx.font = `600 18px ${fontSans}`;
        ctx.fillText('Tiada data graf scrim dalam skop ini.', padX + contentW / 2, (plotTop + plotBottom) / 2);
      } else {
        const nPts = tItems.length;
        const getChartX = (idx) => (nPts === 1 ? plotLeft + plotW / 2 : plotLeft + (idx / (nPts - 1)) * plotW);
        const getChartY = (val) => plotBottom - (Math.max(0, val) / trendSeries.yMax) * plotH;

        const killsPts = tItems.map((d, i) => ({ x: getChartX(i), y: getChartY(d.kills), data: d }));
        const ppPts = tItems.map((d, i) => ({ x: getChartX(i), y: getChartY(d.pp), data: d }));
        const killsSegs = computeSmoothBezierSegments(killsPts, plotTop, plotBottom, 0.2);
        const ppSegs = computeSmoothBezierSegments(ppPts, plotTop, plotBottom, 0.2);

        const drawCanvasCurve = (pts, segs, lineColor, areaTopRgba, glowColor) => {
          if (pts.length === 1) {
            ctx.save();
            ctx.strokeStyle = lineColor;
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.beginPath();
            ctx.moveTo(plotLeft, pts[0].y);
            ctx.lineTo(plotRight, pts[0].y);
            ctx.stroke();
            ctx.restore();
            return;
          }

          // Solid translucent area fill
          ctx.beginPath();
          ctx.moveTo(pts[0].x, plotBottom);
          ctx.lineTo(pts[0].x, pts[0].y);
          segs.forEach((s) => ctx.bezierCurveTo(s.cp1x, s.cp1y, s.cp2x, s.cp2y, s.x, s.y));
          ctx.lineTo(pts[pts.length - 1].x, plotBottom);
          ctx.closePath();
          ctx.fillStyle = areaTopRgba;
          ctx.fill();

          // Glowing smooth line
          ctx.save();
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 14;
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 4.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          segs.forEach((s) => ctx.bezierCurveTo(s.cp1x, s.cp1y, s.cp2x, s.cp2y, s.x, s.y));
          ctx.stroke();
          ctx.restore();
        };

        drawCanvasCurve(ppPts, ppSegs, '#2DD4BF', 'rgba(45, 212, 191, 0.10)', 'rgba(45, 212, 191, 0.55)');
        drawCanvasCurve(killsPts, killsSegs, '#D7FF00', 'rgba(215, 255, 0, 0.12)', 'rgba(215, 255, 0, 0.60)');

        // Nodes, Peak Callouts & Scrim Labels
        tItems.forEach((d, idx) => {
          const kp = killsPts[idx];
          const pp = ppPts[idx];
          const isPeakK = idx === trendSeries.peakKillsIdx;
          const isPeakP = idx === trendSeries.peakPpIdx;

          // PP Node
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, isPeakP ? 8 : 6, 0, Math.PI * 2);
          ctx.fillStyle = '#09090b';
          ctx.fill();
          ctx.strokeStyle = '#2DD4BF';
          ctx.lineWidth = isPeakP ? 4 : 3;
          ctx.stroke();

          // Kills Node
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, isPeakK ? 8.5 : 6.5, 0, Math.PI * 2);
          ctx.fillStyle = '#09090b';
          ctx.fill();
          ctx.strokeStyle = '#D7FF00';
          ctx.lineWidth = isPeakK ? 4 : 3;
          ctx.stroke();

          // Peak / Key numeric callouts
          ctx.textAlign = 'center';
          if (isPeakK || nPts <= 4) {
            ctx.fillStyle = '#D7FF00';
            ctx.font = `900 14px ${fontMono}`;
            const labelX = Math.max(plotLeft + 28, Math.min(plotRight - 28, kp.x));
            ctx.fillText(`${d.kills} Elims`, labelX, Math.max(plotTop - 6, kp.y - 14));
          }
          if (isPeakP || nPts <= 4) {
            ctx.fillStyle = '#2DD4BF';
            ctx.font = `900 15px ${fontMono}`;
            const labelY = Math.abs(kp.y - pp.y) < 24 && pp.y >= kp.y
              ? Math.min(plotBottom - 4, pp.y + 22)
              : Math.max(plotTop - 6, pp.y - 14);
            ctx.fillText(`${d.pp}PP`, pp.x, labelY);
          }

          // X-axis label & short date
          ctx.fillStyle = '#a1a1aa';
          ctx.font = `700 14px ${fontSans}`;
          ctx.fillText(d.shortLabel, kp.x, plotBottom + 24);
          if (d.shortDate) {
            ctx.fillStyle = '#52525b';
            ctx.font = `600 13px ${fontMono}`;
            ctx.fillText(d.shortDate, kp.x, plotBottom + 44);
          }
        });
      }

      // 6. Sejarah Perlawanan (Top 3 Recent Sessions matching accordion summary cards)
      const histHeaderY = chartY + chartH + 34; // 1410
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 20px ${fontSans}`;
      ctx.fillText('SEJARAH PERLAWANAN', padX, histHeaderY);

      const recBadgeText = `${sessionCount} Rekod`;
      ctx.font = `700 16px ${fontSans}`;
      const recBadgeW = ctx.measureText(recBadgeText).width + 28;
      drawRoundRect(ctx, padX + contentW - recBadgeW, histHeaderY - 24, recBadgeW, 30, 15);
      ctx.fillStyle = '#141418';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#a1a1aa';
      ctx.textAlign = 'center';
      ctx.fillText(recBadgeText, padX + contentW - recBadgeW / 2, histHeaderY - 4);

      const recentResults = (stats.results || []).slice(0, 3);
      const rowStartY = histHeaderY + 18; // 1428
      const rowH = 94;
      const rowGap = 14;

      if (recentResults.length === 0) {
        drawRoundRect(ctx, padX, rowStartY, contentW, 130, 22);
        ctx.fillStyle = '#121216';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();
        ctx.fillStyle = '#71717a';
        ctx.font = `600 20px ${fontSans}`;
        ctx.textAlign = 'center';
        ctx.fillText('Tiada rekod perlawanan dalam skop ini.', 540, rowStartY + 72);
      } else {
        recentResults.forEach((res, idx) => {
          const ry = rowStartY + idx * (rowH + rowGap);
          drawRoundRect(ctx, padX, ry, contentW, rowH, 22);
          ctx.fillStyle = '#121216';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Left Accent Icon Tile
          const tileX = padX + 20;
          const tileY = ry + 18;
          const tileSize = 58;
          drawRoundRect(ctx, tileX, tileY, tileSize, tileSize, 15);
          ctx.fillStyle = res.ranking === 1 ? 'rgba(245, 158, 11, 0.14)' : '#18181b';
          ctx.fill();
          ctx.strokeStyle = res.ranking === 1 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = res.ranking === 1 ? '#fbbf24' : '#a1a1aa';
          ctx.font = `900 20px ${fontMono}`;
          ctx.textAlign = 'center';
          ctx.fillText(`#${res.ranking || '-'}`, tileX + tileSize / 2, tileY + 36);

          // Right Rank Pill
          const rightRankStr = `#${res.ranking || '-'}`;
          ctx.font = `900 20px ${fontSans}`;
          const rightPillW = Math.max(68, ctx.measureText(rightRankStr).width + 28);
          const rightPillX = padX + contentW - 22 - rightPillW;
          const rightPillY = ry + 26;
          drawRoundRect(ctx, rightPillX, rightPillY, rightPillW, 42, 13);
          ctx.fillStyle = res.ranking <= 3 ? 'rgba(215, 255, 0, 0.14)' : '#18181b';
          ctx.fill();
          ctx.strokeStyle = res.ranking <= 3 ? 'rgba(215, 255, 0, 0.35)' : 'rgba(255, 255, 255, 0.08)';
          ctx.stroke();
          ctx.fillStyle = res.ranking <= 3 ? '#D7FF00' : '#e4e4e7';
          ctx.textAlign = 'center';
          ctx.fillText(rightRankStr, rightPillX + rightPillW / 2, rightPillY + 28);

          // Event Title + Type Pill + Tier Pill
          const textX = tileX + tileSize + 18;
          const titleMaxW = rightPillX - textX - 180;
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ffffff';
          ctx.font = `800 22px ${fontSans}`;
          const eventTitle = truncateText(ctx, res.scrimName || 'Scrim Session', Math.max(200, titleMaxW));
          ctx.fillText(eventTitle, textX, ry + 40);
          const titleActualW = ctx.measureText(eventTitle).width;

          // Event Type Badge (SCRIM / TOUR)
          const typeLabel = res.eventType === 'Tour' ? 'TOUR' : 'SCRIM';
          ctx.font = `900 13px ${fontSans}`;
          const typeBadgeW = ctx.measureText(typeLabel).width + 16;
          let badgeCursorX = textX + titleActualW + 10;
          drawRoundRect(ctx, badgeCursorX, ry + 22, typeBadgeW, 22, 6);
          ctx.fillStyle = res.eventType === 'Tour' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(215, 255, 0, 0.12)';
          ctx.fill();
          ctx.strokeStyle = res.eventType === 'Tour' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(215, 255, 0, 0.30)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = res.eventType === 'Tour' ? '#fbbf24' : '#D7FF00';
          ctx.textAlign = 'center';
          ctx.fillText(typeLabel, badgeCursorX + typeBadgeW / 2, ry + 37);
          badgeCursorX += typeBadgeW + 8;

          // Scrim Tier Badge
          if (res.scrimTier) {
            const tierLabel = truncateText(ctx, res.scrimTier, Math.max(60, rightPillX - badgeCursorX - 14));
            ctx.font = `700 13px ${fontSans}`;
            const tierBadgeW = ctx.measureText(tierLabel).width + 16;
            if (badgeCursorX + tierBadgeW < rightPillX - 10) {
              drawRoundRect(ctx, badgeCursorX, ry + 22, tierBadgeW, 22, 6);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
              ctx.fill();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
              ctx.stroke();
              ctx.fillStyle = '#d4d4d8';
              ctx.textAlign = 'center';
              ctx.fillText(tierLabel, badgeCursorX + tierBadgeW / 2, ry + 37);
            }
          }

          // Bottom metadata line: Date • PTS • Kills • PP • WWCD
          const rowPp = Math.max(0, (res.points || 0) - (res.kills || 0));
          ctx.textAlign = 'left';
          ctx.fillStyle = '#71717a';
          ctx.font = `600 16px ${fontMono}`;
          const datePart = res.date ? `${res.date}  •  ` : '';
          ctx.fillText(datePart, textX, ry + 70);
          const datePartW = datePart ? ctx.measureText(datePart).width : 0;

          ctx.fillStyle = '#D7FF00';
          ctx.font = `800 16px ${fontMono}`;
          const ptsPart = `${res.points || 0} PTS`;
          ctx.fillText(ptsPart, textX + datePartW, ry + 70);
          const ptsPartW = ctx.measureText(ptsPart).width;

          ctx.fillStyle = '#a1a1aa';
          ctx.font = `600 16px ${fontMono}`;
          const extraStats = `  •  ${res.kills || 0} Elims + ${rowPp} PP${res.wwcd > 0 ? `  •  ${res.wwcd} WWCD` : ''}`;
          ctx.fillText(extraStats, textX + datePartW + ptsPartW, ry + 70);
        });

        if (stats.results.length > 3) {
          const extraY = rowStartY + 3 * (rowH + rowGap) + 18;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#71717a';
          ctx.font = `600 17px ${fontSans}`;
          ctx.fillText(`+ ${stats.results.length - 3} lagi rekod perlawanan di Scrim Hub`, 540, extraY);
        }
      }

      // 6. Clean Matte Footer
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padX, 1796);
      ctx.lineTo(1080 - padX, 1796);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 24px ${fontSans}`;
      ctx.fillText('SCRIM HUB', padX, 1850);

      ctx.fillStyle = '#71717a';
      ctx.font = `600 18px ${fontSans}`;
      ctx.fillText('BY RY.KHOR  •  OFFICIAL ANALYTICS', padX + ctx.measureText('SCRIM HUB').width + 20, 1849);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#D7FF00';
      ctx.font = `900 26px ${fontSans}`;
      ctx.fillText('scrim.rykhor.my', 1080 - padX, 1850);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const fileSlug = (team.tag || 'team').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'team';
      const scopeSlug = (eventTypeLabel || 'stats').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
      const fileName = `${fileSlug}-${scopeSlug}-stats.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `[${team.tag}] ${eventTypeLabel} Stats`,
            text: `Statistik pasukan ${team.name} di SCRIM HUB! (scrim.rykhor.my)`
          });
          showToast('Kad Story 9:16 ready untuk share!');
        } catch (err) {
          if (err.name !== 'AbortError') showToast('Error: ' + err.message);
        }
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = objectUrl;
        link.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        showToast('Kad statistik dah download!');
      }

    } catch (error) {
      showToast('Tak dapat buat kad: ' + error.message);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [selectedTeamProfile, setSelectedTeamProfile] = useState('');
  const [expandedTeamScrimIdxs, setExpandedTeamScrimIdxs] = useState({});

  useEffect(() => {
    if (!selectedTeamProfile) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const raf = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 20);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [selectedTeamProfile]);

  const toggleTeamScrimExpand = (idx) => {
    setExpandedTeamScrimIdxs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const teamsStats = useMemo(() => {
    // Recompute when user-defined custom team merges update localStorage aliases
    if (teamAliasVersion < 0) return {};
    const registeredByKey = {};
    const statsByKey = {};
    const signatureToKey = {};

    const resolveUnifiedKey = (rawName) => {
      const baseKey = getCanonicalTeamKey(rawName);
      if (!baseKey) return '';
      const sig = getCompactTeamSignature(rawName);
      if (sig && signatureToKey[sig]) {
        return signatureToKey[sig];
      }
      if (sig) {
        signatureToKey[sig] = baseKey;
      }
      return baseKey;
    };

    // Seed registered teams by canonical key so alias variants share canonical metadata
    teams.forEach(t => {
      if (!t || !t.name) return;
      const cleanName = cleanTeamDisplayName(t.name);
      const teamKey = resolveUnifiedKey(cleanName);
      if (!teamKey) return;

      const isMecKey = teamKey === 'mec';
      const isDacsVictimKey = teamKey === 'dacs x victim';
      const resolvedName = resolveTeamDisplayName(cleanName);
      const targetName = isMecKey
        ? (resolvedName || 'MEC')
        : isDacsVictimKey
          ? 'DACS X VICTIM'
          : (resolvedName || cleanName || t.name);
      const targetTag = isMecKey
        ? 'MEC'
        : isDacsVictimKey
          ? 'DACS'
          : (t.tag || cleanName.slice(0, 4).toUpperCase());

      const existingReg = registeredByKey[teamKey];
      if (!existingReg) {
        registeredByKey[teamKey] = {
          ...t,
          name: targetName,
          tag: targetTag,
          logo_url: t.logo_url || null
        };
      } else {
        if (isMecKey && !/mec/i.test(existingReg.name)) {
          existingReg.name = targetName;
          existingReg.tag = 'MEC';
        } else if (isDacsVictimKey && !/^dacs x victim$/i.test(existingReg.name)) {
          existingReg.name = 'DACS X VICTIM';
          existingReg.tag = 'DACS';
        }
        if (!existingReg.logo_url && t.logo_url) {
          existingReg.logo_url = t.logo_url;
        }
      }

      if (!statsByKey[teamKey]) {
        statsByKey[teamKey] = {
          canonicalKey: teamKey,
          nameCounts: new Map([[targetName, 1]]),
          name: targetName,
          tag: targetTag,
          logo_url: t.logo_url || null,
          scrimResults: [],
          totalKills: 0,
          totalPoints: 0,
          totalWWCD: 0,
          matchesCount: 0
        };
      } else {
        statsByKey[teamKey].nameCounts.set(targetName, (statsByKey[teamKey].nameCounts.get(targetName) || 0) + 1);
        if (!statsByKey[teamKey].logo_url && t.logo_url) {
          statsByKey[teamKey].logo_url = t.logo_url;
        }
      }
    });

    scrims.forEach(scrim => {
      const scrimSummary = {};
      const eventType = scrim.event_type || 'Scrim';

      (scrim.matches || []).forEach(m => {
        if (!m || !m.results || m.results.length === 0) return;

        // Ensure match has at least some valid scoring or placement data
        const matchHasData = m.results.some(r =>
          (r.placement !== '' && r.placement !== null && r.placement !== undefined && Number(r.placement) > 0) ||
          Number(r.kills) > 0 ||
          Number(r.totalPts) > 0 ||
          Boolean(r.wwcd)
        );
        if (!matchHasData) return;

        m.results.forEach(r => {
          if (!r || !r.teamName || !r.teamName.trim()) return;
          // Clean country flag emojis, spaces/unicode & resolve canonical alias key
          const cleanTeamName = cleanTeamDisplayName(r.teamName);
          const teamKey = resolveUnifiedKey(cleanTeamName);
          if (!cleanTeamName || !teamKey) return;

          // Verify this specific team actually played or has recorded points/kills/placement
          const teamHasPlayed =
            (r.placement !== '' && r.placement !== null && r.placement !== undefined && Number(r.placement) > 0) ||
            Number(r.kills) > 0 ||
            Number(r.totalPts) > 0 ||
            Boolean(r.wwcd);
          if (!teamHasPlayed) return;

          const isMecKey = teamKey === 'mec';
          const isDacsVictimKey = teamKey === 'dacs x victim';
          const resolvedCleanName = resolveTeamDisplayName(cleanTeamName);
          const fallbackTeamName = isMecKey
            ? (resolvedCleanName || 'MEC')
            : isDacsVictimKey
              ? 'DACS X VICTIM'
              : (resolvedCleanName || cleanTeamName);
          const fallbackTag = isMecKey
            ? 'MEC'
            : isDacsVictimKey
              ? 'DACS'
              : (r.tag || cleanTeamName.slice(0, 4).toUpperCase());

          if (!scrimSummary[teamKey]) {
            const dbTeam = registeredByKey[teamKey];
            scrimSummary[teamKey] = {
              teamKey,
              nameCounts: new Map(),
              teamName: dbTeam?.name || fallbackTeamName,
              tag: isMecKey ? 'MEC' : isDacsVictimKey ? 'DACS' : (r.tag || dbTeam?.tag || fallbackTag),
              logo_url: dbTeam?.logo_url || null,
              totalPts: 0,
              totalKills: 0,
              wwcd: 0,
              matches: 0
            };
          }
          scrimSummary[teamKey].nameCounts.set(
            fallbackTeamName,
            (scrimSummary[teamKey].nameCounts.get(fallbackTeamName) || 0) + 1
          );
          if (cleanTeamName !== fallbackTeamName) {
            scrimSummary[teamKey].nameCounts.set(cleanTeamName, (scrimSummary[teamKey].nameCounts.get(cleanTeamName) || 0));
          }
          if (!scrimSummary[teamKey].tag && r.tag) {
            scrimSummary[teamKey].tag = r.tag;
          }
          scrimSummary[teamKey].totalPts += (Number(r.totalPts) || 0);
          scrimSummary[teamKey].totalKills += (Number(r.kills) || 0);
          scrimSummary[teamKey].matches += 1;
          scrimSummary[teamKey].wwcd += (typeof r.wwcd === 'number' ? r.wwcd : (r.wwcd ? 1 : (Number(r.placement) === 1 ? 1 : 0)));
        });
      });

      const sortedTeams = Object.values(scrimSummary)
        .filter(teamRes => teamRes.matches > 0)
        .sort((a, b) => b.totalPts - a.totalPts || b.wwcd - a.wwcd);

      sortedTeams.forEach((teamRes, idx) => {
        const teamKey = teamRes.teamKey;
        const dbTeam = registeredByKey[teamKey];
        if (!statsByKey[teamKey]) {
          statsByKey[teamKey] = {
            canonicalKey: teamKey,
            nameCounts: new Map(),
            name: teamRes.teamName,
            tag: teamRes.tag,
            logo_url: dbTeam?.logo_url || null,
            scrimResults: [],
            totalKills: 0,
            totalPoints: 0,
            totalWWCD: 0,
            matchesCount: 0
          };
        } else if (!statsByKey[teamKey].logo_url && dbTeam?.logo_url) {
          statsByKey[teamKey].logo_url = dbTeam.logo_url;
        }

        teamRes.nameCounts.forEach((count, rawVariant) => {
          statsByKey[teamKey].nameCounts.set(
            rawVariant,
            (statsByKey[teamKey].nameCounts.get(rawVariant) || 0) + count
          );
        });

        statsByKey[teamKey].totalKills += teamRes.totalKills;
        statsByKey[teamKey].totalPoints += teamRes.totalPts;
        statsByKey[teamKey].totalWWCD += teamRes.wwcd;
        statsByKey[teamKey].matchesCount += teamRes.matches;

        statsByKey[teamKey].scrimResults.push({
          scrimId: scrim.id,
          scrimData: scrim,
          scrimName: scrim.title,
          scrimTier: scrim.tier || 'Tier 1 (Pro)',
          eventType: eventType,
          ranking: idx + 1,
          points: teamRes.totalPts,
          kills: teamRes.totalKills,
          wwcd: teamRes.wwcd,
          matches: teamRes.matches,
          date: scrim.date,
          isFinished: scrim.is_finished,
          hostKey: scrim.created_by || scrim.host_name || 'Admin',
          hostName: scrim.host_name || 'Tournament Organizer'
        });
      });
    });

    // Only return teams that actually have recorded match data, using canonical display names!
    const activeStats = {};
    Object.values(statsByKey).forEach(t => {
      if (t.matchesCount > 0 && t.scrimResults && t.scrimResults.length > 0) {
        const dbTeam = registeredByKey[t.canonicalKey];
        const isMec = t.canonicalKey === 'mec';
        const isDacsVictim = t.canonicalKey === 'dacs x victim';
        const finalName = pickPreferredTeamDisplayName(t.nameCounts, dbTeam?.name || null, t.canonicalKey) || (isMec ? 'MEC' : isDacsVictim ? 'DACS X VICTIM' : t.name);
        const aliases = Array.from(t.nameCounts.keys());
        if (isMec && !aliases.some(a => /maqna/i.test(a))) {
          aliases.push('MAQNA', 'MAQNA Esports');
        }
        if (isDacsVictim && !aliases.some(a => /dacs xvictim/i.test(a))) {
          aliases.push('DACS XVICTIM');
        }
        activeStats[finalName] = {
          name: finalName,
          canonicalKey: t.canonicalKey,
          aliases,
          tag: (isMec && (!dbTeam?.tag || /^(?:mqn|maqna)$/i.test(dbTeam.tag)))
            ? 'MEC'
            : (isDacsVictim ? 'DACS' : (dbTeam?.tag || t.tag)),
          logo_url: dbTeam?.logo_url || t.logo_url || null,
          scrimResults: t.scrimResults,
          totalKills: t.totalKills,
          totalPoints: t.totalPoints,
          totalWWCD: t.totalWWCD,
          matchesCount: t.matchesCount
        };
      }
    });

    return activeStats;
  }, [scrims, teams, teamAliasVersion]);

  const validTeamList = useMemo(() => {
    return Object.values(teamsStats)
      .filter(t => t.matchesCount > 0 && t.scrimResults && t.scrimResults.length > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWWCD - a.totalWWCD || b.totalKills - a.totalKills);
  }, [teamsStats]);

  const categoryTeamList = useMemo(() => {
    const { category, eventType, season, stage } = teamMatrixFilterState;
    const sssScope = { season, stage };
    if (category === 'ALL' && eventType === 'ALL') {
      return validTeamList;
    }
    return validTeamList
      .filter(t => (t.scrimResults || []).some(r => matchesStatsFilter(r, category, eventType, sssScope)))
      .sort((a, b) => {
        const aRes = (a.scrimResults || []).filter(r => matchesStatsFilter(r, category, eventType, sssScope));
        const bRes = (b.scrimResults || []).filter(r => matchesStatsFilter(r, category, eventType, sssScope));
        const aPts = aRes.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
        const bPts = bRes.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
        const aWwcd = aRes.reduce((acc, c) => acc + (Number(c.wwcd) || 0), 0);
        const bWwcd = bRes.reduce((acc, c) => acc + (Number(c.wwcd) || 0), 0);
        const aKills = aRes.reduce((acc, c) => acc + (Number(c.kills) || 0), 0);
        const bKills = bRes.reduce((acc, c) => acc + (Number(c.kills) || 0), 0);
        return bPts - aPts || bWwcd - aWwcd || bKills - aKills;
      });
  }, [validTeamList, teamMatrixFilterState]);

  const tier3RankedTeams = useMemo(() => {
    return validTeamList
      .map((t) => {
        const res = (t.scrimResults || []).filter(r => matchesStatsFilter(r, 'TIER_3', teamStatsEventType));
        if (res.length === 0) return null;
        const tier3Points = res.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
        const tier3Kills = res.reduce((acc, c) => acc + (Number(c.kills) || 0), 0);
        const tier3WWCD = res.reduce((acc, c) => acc + (Number(c.wwcd) || 0), 0);
        const tier3Matches = res.reduce((acc, c) => acc + (Number(c.matches) || 1), 0);
        return {
          ...t,
          tier3Points,
          tier3Kills,
          tier3WWCD,
          tier3Events: res.length,
          tier3Matches
        };
      })
      .filter(Boolean)
      .sort((a, b) => (
        b.tier3Points - a.tier3Points ||
        b.tier3WWCD - a.tier3WWCD ||
        b.tier3Kills - a.tier3Kills
      ))
      .map((t, idx) => ({
        ...t,
        tier3Rank: idx + 1
      }));
  }, [validTeamList, teamStatsEventType]);

  const tier3RankByTeam = useMemo(() => {
    const map = new Map();
    tier3RankedTeams.forEach((t) => {
      map.set(t.name, t);
    });
    return map;
  }, [tier3RankedTeams]);

  const filteredTeamList = useMemo(() => {
    const query = teamSearchQuery.toLowerCase().trim();
    return categoryTeamList.filter(t => 
      !query || 
      t.name.toLowerCase().includes(query) || 
      (t.tag && t.tag.toLowerCase().includes(query)) ||
      (Array.isArray(t.aliases) && t.aliases.some(alias => alias.toLowerCase().includes(query)))
    );
  }, [categoryTeamList, teamSearchQuery]);

  // Master Admin (Kuasa Mutlak) Manageable Teams Directory
  const allManageableTeams = useMemo(() => {
    const map = new Map();
    const signatureToKey = {};

    const resolveKey = (rawName) => {
      const base = getCanonicalTeamKey(rawName);
      if (!base) return '';
      const sig = getCompactTeamSignature(rawName);
      if (sig && signatureToKey[sig]) return signatureToKey[sig];
      if (sig) signatureToKey[sig] = base;
      return base;
    };

    // 1. Registered teams from state
    teams.forEach(t => {
      if (t && t.name) {
        const cleanName = cleanTeamDisplayName(t.name);
        const key = resolveKey(cleanName);
        if (!key) return;
        const resolvedName = resolveTeamDisplayName(cleanName);
        const targetName = key === 'mec'
          ? (resolvedName || 'MEC')
          : key === 'dacs x victim'
            ? 'DACS X VICTIM'
            : (resolvedName || cleanName);
        const targetTag = key === 'mec'
          ? 'MEC'
          : key === 'dacs x victim'
            ? 'DACS'
            : ((t.tag || cleanName.slice(0, 4)).trim().toUpperCase());
        const existing = map.get(key);
        map.set(key, {
          id: existing?.id || t.id || ('tm_' + cleanName.replace(/\s+/g, '_').toLowerCase()),
          name: existing?.name && /\s/.test(existing.name) && !/\s/.test(targetName) ? existing.name : targetName,
          tag: targetTag,
          logo_url: existing?.logo_url || t.logo_url || ''
        });
      }
    });

    // 2. Teams appearing in scrims/Team Matrix
    Object.values(teamsStats).forEach(st => {
      if (st && st.name) {
        const cleanName = cleanTeamDisplayName(st.name);
        const key = resolveKey(cleanName);
        if (!key) return;
        const resolvedName = resolveTeamDisplayName(cleanName);
        const targetName = key === 'mec'
          ? (resolvedName || 'MEC')
          : key === 'dacs x victim'
            ? 'DACS X VICTIM'
            : (resolvedName || cleanName);
        const targetTag = key === 'mec'
          ? 'MEC'
          : key === 'dacs x victim'
            ? 'DACS'
            : ((st.tag || cleanName.slice(0, 4)).trim().toUpperCase());
        if (!map.has(key)) {
          map.set(key, {
            id: 'tm_' + cleanName.replace(/\s+/g, '_').toLowerCase(),
            name: targetName,
            tag: targetTag,
            logo_url: st.logo_url || ''
          });
        } else if (!map.get(key).logo_url && st.logo_url) {
          map.get(key).logo_url = st.logo_url;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, teamsStats]);

  const potentialDuplicatePairs = useMemo(
    () => findPotentialDuplicatePairs(allManageableTeams),
    [allManageableTeams]
  );

  const filteredManageableTeams = useMemo(() => {
    const q = teamManagerSearch.toLowerCase().trim();
    if (!q) return allManageableTeams;
    return allManageableTeams.filter(t => 
      t.name.toLowerCase().includes(q) || 
      (t.tag && t.tag.toLowerCase().includes(q))
    );
  }, [allManageableTeams, teamManagerSearch]);

  const handleSaveTeamDetails = async (updatedTeam) => {
    if (!updatedTeam || !updatedTeam.name.trim()) {
      showToast('Masukkan nama team yang betul.');
      return;
    }

    setIsSavingTeam(true);
    try {
      const cleanTeam = {
        id: updatedTeam.id || ('tm_' + Date.now().toString(36)),
        name: updatedTeam.name.trim(),
        tag: (updatedTeam.tag || updatedTeam.name.slice(0, 4)).trim().toUpperCase(),
        logo_url: updatedTeam.logo_url?.trim() || null
      };

      // 1. Update React state & localStorage
      setTeams(prevTeams => {
        const map = new Map(prevTeams.map(t => [t.name.trim().toLowerCase(), t]));
        if (updatedTeam._originalName && updatedTeam._originalName.trim().toLowerCase() !== cleanTeam.name.toLowerCase()) {
          map.delete(updatedTeam._originalName.trim().toLowerCase());
        }
        map.set(cleanTeam.name.toLowerCase(), cleanTeam);
        const nextTeams = Array.from(map.values());
        try {
          localStorage.setItem('pubg_hub_custom_teams', JSON.stringify(nextTeams));
        } catch (err) {
          console.warn('LocalStorage save error:', err);
        }
        return nextTeams;
      });

      // 2. Persist to Supabase teams table
      let syncError = null;
      try {
        const { data: existingTeams, error: findErr } = await supabase
          .from('teams')
          .select('id, name')
          .ilike('name', cleanTeam.name);

        if (findErr) throw findErr;

        const existingTeam = existingTeams && existingTeams.length > 0 ? existingTeams[0] : null;

        if (existingTeam) {
          const { error: updErr } = await supabase
            .from('teams')
            .update({
              tag: cleanTeam.tag,
              logo_url: cleanTeam.logo_url
            })
            .eq('id', existingTeam.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from('teams')
            .insert({
              id: cleanTeam.id,
              name: cleanTeam.name,
              tag: cleanTeam.tag,
              logo_url: cleanTeam.logo_url
            });
          if (insErr) throw insErr;
        }
      } catch (dbErr) {
        syncError = dbErr;
        console.warn('Supabase teams sync note:', dbErr);
      }

      if (syncError && syncError.message?.includes('logo_url')) {
        showToast(`${cleanTeam.name} save kat device sahaja. Tambah column logo_url di Supabase teams.`);
      } else if (syncError) {
        showToast(`Team dah save (Cloud: ${syncError.message})`);
      } else {
        showToast(`${cleanTeam.name} & logo dah save ke Cloud!`);
      }
      setEditingTeam(null);
    } catch (error) {
      showToast('Tak dapat save: ' + error.message);
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleMergeTeams = async (sourceNameRaw, targetNameRaw) => {
    const sourceName = cleanTeamDisplayName(sourceNameRaw);
    const targetName = cleanTeamDisplayName(targetNameRaw);
    if (!sourceName || !targetName) {
      showToast('Pilih team asal dan team sasaran.');
      return;
    }

    const sourceKey = getCanonicalTeamKey(sourceName);
    const sourceSig = getCompactTeamSignature(sourceName);
    const targetKey = getCanonicalTeamKey(targetName);
    const targetSig = getCompactTeamSignature(targetName);
    if (!sourceKey || !targetKey || (sourceKey === targetKey && sourceSig === targetSig && sourceName.toLowerCase() === targetName.toLowerCase())) {
      showToast('Team asal dan sasaran sama je. Pilih dua team berbeza.');
      return;
    }

    const sourceObj = allManageableTeams.find(t => t.name === sourceName) || teams.find(t => getCanonicalTeamKey(t.name) === sourceKey);
    const targetObj = allManageableTeams.find(t => t.name === targetName) || teams.find(t => getCanonicalTeamKey(t.name) === targetKey);
    const finalTargetId = targetObj?.id || ('tm_' + targetName.replace(/[^a-z0-9]+/gi, '_').toLowerCase());
    const finalTargetTag = (targetObj?.tag || targetName.slice(0, 4)).trim().toUpperCase();
    const inheritedLogo = targetObj?.logo_url || sourceObj?.logo_url || null;

    setMergeTeamDraft(prev => prev ? { ...prev, isSubmitting: true } : { sourceName, targetName, isSubmitting: true });

    try {
      // 1. Persist canonical alias rule so future scans/imports auto-resolve
      saveCustomTeamAlias(sourceName, targetName);
      setTeamAliasVersion(v => v + 1);

      // 2. Rewrite matching rows inside scrims (state + localStorage + Supabase)
      const changedScrims = [];
      const nextScrims = scrims.map(scrim => {
        let modified = false;
        const nextMatches = (scrim.matches || []).map(m => {
          const nextResults = (m.results || []).map(r => {
            if (!r || !r.teamName) return r;
            const rKey = getCanonicalTeamKey(r.teamName);
            const rSig = getCompactTeamSignature(r.teamName);
            const matchesSource =
              r.teamName.trim().toLowerCase() === sourceName.toLowerCase() ||
              (sourceKey && rKey === sourceKey) ||
              (sourceSig && rSig === sourceSig);
            if (!matchesSource) return r;

            modified = true;
            return {
              ...r,
              teamId: finalTargetId,
              teamName: targetName,
              tag: finalTargetTag
            };
          });
          return { ...m, results: nextResults };
        });

        if (!modified) return scrim;
        const updatedScrim = { ...scrim, matches: nextMatches };
        changedScrims.push(updatedScrim);
        return updatedScrim;
      });

      if (changedScrims.length > 0) {
        setScrims(nextScrims);
        try {
          const localRaw = localStorage.getItem('pubg_hub_saved_scrims');
          if (localRaw) {
            const parsedLocal = JSON.parse(localRaw);
            if (Array.isArray(parsedLocal)) {
              const changedMap = new Map(changedScrims.map(cs => [cs.id, cs]));
              localStorage.setItem(
                'pubg_hub_saved_scrims',
                JSON.stringify(parsedLocal.map(ls => changedMap.get(ls?.id) || ls))
              );
            }
          }
        } catch {
          // ignore localStorage error
        }

        for (const updated of changedScrims) {
          try {
            await supabase
              .from('scrims')
              .update({ matches: updated.matches })
              .eq('id', updated.id);
          } catch (scErr) {
            console.warn('Scrim merge cloud sync note:', scErr);
          }
        }
      }

      // 3. Merge teams directory & logo
      setTeams(prevTeams => {
        const filtered = prevTeams.filter(t => {
          if (!t || !t.name) return false;
          const tk = getCanonicalTeamKey(t.name);
          return t.name.trim().toLowerCase() !== sourceName.toLowerCase() && tk !== sourceKey;
        });
        const idx = filtered.findIndex(t => getCanonicalTeamKey(t.name) === targetKey || t.name.trim().toLowerCase() === targetName.toLowerCase());
        const mergedEntry = {
          id: finalTargetId,
          name: targetName,
          tag: finalTargetTag,
          logo_url: inheritedLogo
        };
        if (idx >= 0) {
          filtered[idx] = { ...filtered[idx], ...mergedEntry };
        } else {
          filtered.push(mergedEntry);
        }
        try {
          localStorage.setItem('pubg_hub_custom_teams', JSON.stringify(filtered));
        } catch {
          // ignore
        }
        return filtered;
      });

      try {
        if (sourceObj?.id && sourceObj.id !== finalTargetId) {
          await supabase.from('teams').delete().eq('id', sourceObj.id);
        }
      } catch {
        // Ignore if RLS blocks delete; alias mapping + scrim rewrite handles it cleanly
      }

      setMergeTeamDraft(null);
      setEditingTeam(null);
      showToast(`"${sourceName}" dah digabung ke "${targetName}" (${changedScrims.length} scrim dikemas kini).`);
    } catch (err) {
      showToast('Gagal gabung team: ' + (err?.message || 'Ralat'));
      setMergeTeamDraft(prev => prev ? { ...prev, isSubmitting: false } : null);
    }
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUploadLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Pilih file gambar sahaja (PNG, JPG, WEBP).');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLogoCropSource(dataUrl);
    } catch (err) {
      showToast('Tak dapat baca file gambar: ' + err.message);
    } finally {
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };

  const handleOpenExistingLogoCrop = async () => {
    const src = editingTeam?.logo_url?.trim();
    if (!src) return;
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setLogoCropSource(src);
      return;
    }

    try {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const dataUrl = await readFileAsDataUrl(blob);
      setLogoCropSource(dataUrl);
    } catch {
      setLogoCropSource(src);
    }
  };

  const handleConfirmLogoCrop = async (croppedFile, previewDataUrl) => {
    setIsUploadingTeamLogo(true);
    try {
      let publicUrl = null;
      try {
        publicUrl = await uploadMediaToSupabase(croppedFile, 'team-logos');
      } catch (storageErr) {
        console.warn('Storage upload error, using local data URL fallback:', storageErr);
      }

      setEditingTeam(prev => (prev ? { ...prev, logo_url: publicUrl || previewDataUrl } : prev));
      setLogoCropSource(null);
      showToast('Logo dah crop & upload!');
    } catch (err) {
      showToast('Tak dapat upload gambar: ' + err.message);
    } finally {
      setIsUploadingTeamLogo(false);
    }
  };

  const currentSelectedTeam = useMemo(() => {
    if (!selectedTeamProfile) return '';
    if (validTeamList.some(t => t.name === selectedTeamProfile)) {
      return selectedTeamProfile;
    }
    const targetKey = getCanonicalTeamKey(selectedTeamProfile);
    const matched = validTeamList.find(t => getCanonicalTeamKey(t.name) === targetKey);
    return matched ? matched.name : '';
  }, [selectedTeamProfile, validTeamList]);

  const activeTeamData = currentSelectedTeam ? (teamsStats[currentSelectedTeam] || null) : null;

  const activeTeamScopedStats = useMemo(() => {
    if (!activeTeamData) return null;
    const { category, eventType, season, stage } = teamMatrixFilterState;
    const sssScope = { season, stage };
    const all = activeTeamData.scrimResults || [];
    const filtered = (category === 'ALL' && eventType === 'ALL')
      ? all
      : all.filter(r => matchesStatsFilter(r, category, eventType, sssScope));

    const totalPoints = filtered.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
    const totalKills = filtered.reduce((acc, c) => acc + (Number(c.kills) || 0), 0);
    const totalWWCD = filtered.reduce((acc, c) => acc + (Number(c.wwcd) || 0), 0);
    const matchesCount = filtered.reduce((acc, c) => acc + (Number(c.matches) || 1), 0);

    return {
      filteredResults: filtered,
      totalPoints,
      totalKills,
      totalWWCD,
      eventsCount: filtered.length,
      matchesCount
    };
  }, [activeTeamData, teamMatrixFilterState]);

  const organizersList = useMemo(() => {
    const map = {};

    scrims.forEach(s => {
      const hostKey = s.created_by || s.host_name || 'Admin';
      if (!map[hostKey]) {
        const prof = profiles.find(p => p.id === s.created_by);
        map[hostKey] = {
          id: s.created_by,
          name: prof?.display_name || s.host_name || 'Tournament Organizer',
          contact: prof?.contact || s.host_contact || '',
          bio: prof?.bio || 'Official Tournament Host & Scrim Coordinator.',
          avatar_url: prof?.avatar_url || '',
          scrims: []
        };
      }
      map[hostKey].scrims.push(s);
    });

    return Object.values(map).filter(h => 
      h.name.toLowerCase().includes(searchHostQuery.toLowerCase()) ||
      h.contact.toLowerCase().includes(searchHostQuery.toLowerCase())
    );
  }, [scrims, profiles, searchHostQuery]);

  const filteredTeamPerformance = useMemo(() => {
    if (!performanceTeam) return null;
    const allResults = performanceTeam.scrimResults || [];
    
    let results = allResults;
    if (selectedPerformanceHost !== 'ALL') {
      results = results.filter(r => r.hostKey === selectedPerformanceHost || r.hostName === selectedPerformanceHost);
    }
    if (performanceModalCategory !== 'ALL') {
      results = results.filter(r => matchesStatsFilter(r, performanceModalCategory));
    }

    const totalPts = results.reduce((acc, cur) => acc + cur.points, 0);
    const totalKills = results.reduce((acc, cur) => acc + cur.kills, 0);
    const totalWwcd = results.reduce((acc, cur) => acc + (cur.wwcd || 0), 0);
    const matchesCount = results.reduce((acc, cur) => acc + (cur.matches || 1), 0);

    return {
      results,
      totalPts,
      totalKills,
      totalWwcd,
      matchesCount,
      avgPts: results.length ? (totalPts / results.length).toFixed(1) : '0',
      avgKills: results.length ? (totalKills / results.length).toFixed(1) : '0',
      winRate: matchesCount ? ((totalWwcd / matchesCount) * 100).toFixed(0) + '%' : '0%'
    };
  }, [performanceTeam, selectedPerformanceHost, performanceModalCategory]);

  const [showcaseFilter, setShowcaseFilter] = useState('all');
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false);
  const [postSourceMode, setPostSourceMode] = useState('upload');
  const [postTitle, setPostTitle] = useState('');
  const [postType, _setPostType] = useState('poster');
  const [postTournament, _setPostTournament] = useState('');
  const [postRankBadge, setPostRankBadge] = useState('Official Tournament');
  const [postCaption, setPostCaption] = useState('');
  const [showcaseFile, setShowcaseFile] = useState(null);
  const [externalSocialUrl, setExternalSocialUrl] = useState('');
  const [socialPlatform, setSocialPlatform] = useState('instagram');
  const [isUploadingShowcase, setIsUploadingShowcase] = useState(false);

  const handleCreateShowcasePost = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Log masuk dulu untuk post content.');
      return;
    }
    if (!postTitle.trim()) return;

    try {
      setIsUploadingShowcase(true);
      let mediaUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
      let resolvedMediaType = postType === 'clip' ? 'video' : 'image';

      if (postSourceMode === 'upload' && showcaseFile) {
        mediaUrl = await uploadMediaToSupabase(showcaseFile, 'showcase');
      } else if (postSourceMode === 'social_link') {
        resolvedMediaType = 'social_link';
        if (socialPlatform === 'tiktok') {
          mediaUrl = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80';
        } else if (socialPlatform === 'instagram') {
          mediaUrl = 'https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&w=1200&q=80';
        } else {
          mediaUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
        }
      }

      const hostProfile = profiles.find(p => p.id === currentUser.id);

      const newPost = {
        id: 'post_' + Date.now(),
        author: hostProfile?.display_name || currentUser.email.split('@')[0],
        created_by: currentUser.id,
        player_role: 'Tournament Host',
        team_tag: 'PUBGM',
        type: postType === 'clip' ? 'clip' : 'achievement',
        title: postTitle.trim(),
        tournament: postTournament.trim() || activePublicScrim?.title || 'SCRIM HUB',
        rank: postRankBadge,
        caption: postCaption.trim() || 'Official competitive content update.',
        media_type: resolvedMediaType,
        media_url: mediaUrl,
        external_url: postSourceMode === 'social_link' ? externalSocialUrl.trim() : null,
        platform: postSourceMode === 'social_link' ? socialPlatform : null,
        likes: 1,
        date: 'Just now',
        tags: ['#PUBGM', '#Tournament', '#EsportsHub']
      };

      const { error } = await supabase.from('posts').insert([newPost]);

      if (error) {
        showToast('Tak dapat post: ' + error.message);
      } else {
        setPosts([newPost, ...posts]);
        setIsShowcaseModalOpen(false);
        setPostTitle('');
        setShowcaseFile(null);
        setExternalSocialUrl('');
        setPostCaption('');
        showToast('Content dah post!');
      }
    } catch (err) {
      showToast('Upload error: ' + err.message);
    } finally {
      setIsUploadingShowcase(false);
    }
  };

  const handleDeletePost = async (postId, postOwnerId) => {
    if (!currentUser) return;
    if (postOwnerId && postOwnerId !== currentUser.id && postOwnerId !== currentUser.email) {
      showToast('Awak boleh padam post sendiri sahaja.');
      return;
    }

    if (!window.confirm('Confirm nak padam post ni?')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      showToast('Tak dapat padam: ' + error.message);
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      showToast('Post dah padam.');
    }
  };

  const runBlurSwap = useCallback((shouldBlurOut, applyUpdate) => {
    if (tabTransitionTimerRef.current) {
      window.clearTimeout(tabTransitionTimerRef.current);
      tabTransitionTimerRef.current = null;
    }
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (shouldBlurOut && !reducedMotion) {
      setTabBlurStage('out');
      tabTransitionTimerRef.current = window.setTimeout(() => {
        applyUpdate();
        setTabBlurStage('idle');
        tabTransitionTimerRef.current = null;
      }, 110);
    } else {
      setTabBlurStage('idle');
      applyUpdate();
    }
  }, []);

  const openTeamProfile = useCallback((teamName) => {
    if (!teamName) return;
    runBlurSwap(true, () => {
      setNavDirection('forward');
      setSelectedTeamProfile(teamName);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 15);
    });
  }, [runBlurSwap]);

  const navigateToTab = useCallback((tab) => {
    const normalizedNext = tab === 'home' ? 'playground' : tab;
    const normalizedCurrent = activeTabRef.current === 'home' ? 'playground' : activeTabRef.current;
    setIsQuickCreateModalOpen(false);
    setIsSessionPickerOpen(false);
    setIsOrgPopoverOpen(false);
    setIsScorerActionsMenuOpen(false);
    setIsNavMenuOpen(false);
    setActiveHeaderInfo(null);

    const applyTabNavigation = () => {
      setSelectedTeamProfile('');
      setNavDirection('forward');
      setActiveTab((prevTab) => {
        const normalizedPrev = prevTab === 'home' ? 'playground' : prevTab;
        if (normalizedNext === 'playground') {
          setTabHistory([]);
        } else if (normalizedNext !== normalizedPrev) {
          setTabHistory((prevStack) => [...prevStack, normalizedPrev]);
        }
        return normalizedNext;
      });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 15);
    };

    const shouldBlur = normalizedNext !== normalizedCurrent;
    runBlurSwap(shouldBlur, applyTabNavigation);
  }, [runBlurSwap]);

  const handleNavigateBackTab = useCallback(() => {
    setActiveHeaderInfo(null);
    setIsNavMenuOpen(false);

    if (tabHistory.length > 0) {
      const previousTab = tabHistory[tabHistory.length - 1] || 'playground';
      runBlurSwap(true, () => {
        setSelectedTeamProfile('');
        setNavDirection('backward');
        setTabHistory((prev) => prev.slice(0, -1));
        setActiveTab(previousTab);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      return true;
    }

    if (activeTab !== 'playground' && activeTab !== 'home') {
      runBlurSwap(true, () => {
        setSelectedTeamProfile('');
        setNavDirection('backward');
        setActiveTab('playground');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      });
      return true;
    }

    return false;
  }, [tabHistory, activeTab, runBlurSwap]);

  const handleStartScoringSession = () => {
    navigateToTab('scorer');
  };

  const handleOpenGuide = (slideIdx = 0) => {
    setCurrentGuideSlide(slideIdx);
    setIsGuideModalOpen(true);
    setIsNavMenuOpen(false);
  };

  const handleCloseGuide = useCallback(() => {
    setIsGuideModalOpen(false);
    try {
      if (window.location.hash === '#guide' || window.location.hash === '#panduan' || window.location.hash === '#tutorial') {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      }
    } catch {}
  }, []);

  // --- MOBILE BACK BUTTON, MODAL SAFETY & PAGE HISTORY NAVIGATION ---
  const activeOverlayCount =
    (isImportModalOpen ? 1 : 0) +
    (isSessionPickerOpen ? 1 : 0) +
    (isQuickCreateModalOpen ? 1 : 0) +
    (isPerformanceModalOpen ? 1 : 0) +
    (inspectedScrim ? 1 : 0) +
    (inspectedPost ? 1 : 0) +
    (isEditScrimModalOpen ? 1 : 0) +
    (isCreateScrimOpen ? 1 : 0) +
    (isAuthModalOpen ? 1 : 0) +
    (isFeedbackModalOpen ? 1 : 0) +
    (isShowcaseModalOpen ? 1 : 0) +
    (isGuideModalOpen ? 1 : 0) +
    ocrOverlayCount +
    (isProfileModalOpen ? 1 : 0) +
    (isOrgPopoverOpen ? 1 : 0) +
    (isTeamManagerModalOpen ? 1 : 0) +
    (isNavMenuOpen ? 1 : 0) +
    (activeTab === 'teams' && selectedTeamProfile ? 1 : 0) +
    (activeHeaderInfo ? 1 : 0);

  const closeTopmostOverlay = useCallback(() => {
    if (isSessionPickerOpen) { setIsSessionPickerOpen(false); return true; }
    if (isImportModalOpen) { setIsImportModalOpen(false); return true; }
    if (isQuickCreateModalOpen) { setIsQuickCreateModalOpen(false); return true; }
    if (isTeamManagerModalOpen) {
      if (logoCropSource) {
        setLogoCropSource(null);
        return true;
      }
      if (mergeTeamDraft) {
        setMergeTeamDraft(null);
        return true;
      }
      if (editingTeam) {
        setEditingTeam(null);
        return true;
      }
      setIsTeamManagerModalOpen(false);
      return true;
    }
    if (isPerformanceModalOpen) { setIsPerformanceModalOpen(false); return true; }
    if (inspectedScrim) { setInspectedScrim(null); return true; }
    if (inspectedPost) { setInspectedPost(null); return true; }
    if (isEditScrimModalOpen) { setIsEditScrimModalOpen(false); return true; }
    if (isCreateScrimOpen) { setIsCreateScrimOpen(false); return true; }
    if (isAuthModalOpen) { setIsAuthModalOpen(false); setPendingCloudSync(false); return true; }
    if (isFeedbackModalOpen) { setIsFeedbackModalOpen(false); return true; }
    if (isShowcaseModalOpen) { setIsShowcaseModalOpen(false); return true; }
    if (isGuideModalOpen) { handleCloseGuide(); return true; }
    if (ocrOverlayCount > 0 && typeof closeOcrOverlayRef.current === 'function') {
      const closedOcr = closeOcrOverlayRef.current();
      if (closedOcr) return true;
    }
    if (isProfileModalOpen) {
      if (isEditProfileMode) {
        setIsEditProfileMode(false);
        return true;
      }
      setIsProfileModalOpen(false);
      return true;
    }
    if (isOrgPopoverOpen) { setIsOrgPopoverOpen(false); return true; }
    if (isNavMenuOpen) { setIsNavMenuOpen(false); return true; }
    if (activeTab === 'teams' && selectedTeamProfile) {
      setNavDirection('backward');
      setSelectedTeamProfile('');
      return true;
    }
    if (activeHeaderInfo) { setActiveHeaderInfo(null); return true; }
    return false;
  }, [
    isSessionPickerOpen,
    isImportModalOpen,
    isQuickCreateModalOpen,
    isTeamManagerModalOpen,
    logoCropSource,
    mergeTeamDraft,
    editingTeam,
    isPerformanceModalOpen,
    inspectedScrim,
    inspectedPost,
    isEditScrimModalOpen,
    isCreateScrimOpen,
    isAuthModalOpen,
    isFeedbackModalOpen,
    isShowcaseModalOpen,
    isGuideModalOpen,
    handleCloseGuide,
    ocrOverlayCount,
    isProfileModalOpen,
    isEditProfileMode,
    isOrgPopoverOpen,
    isNavMenuOpen,
    activeTab,
    selectedTeamProfile,
    activeHeaderInfo
  ]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#D7FF00] selection:text-black pb-24 md:pb-8 relative overflow-x-clip">
      <BackButtonHandler
        activeTab={activeTab}
        tabHistory={tabHistory}
        activeOverlayCount={activeOverlayCount}
        closeTopmostOverlay={closeTopmostOverlay}
        onNavigateBackTab={handleNavigateBackTab}
      />
      
      {/* Toast Alert: Ergonomik di Thumb Zone (Bawah) pada telefon & kemas di desktop */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[70] glass-pill text-[#D7FF00] px-4 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(215,255,0,0.2)] font-bold text-xs flex items-center gap-2 border-[#D7FF00]/45 animate-feedback-pop max-w-[90vw] text-center"
        >
          <CheckCircle className="w-4 h-4 text-[#D7FF00] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* HEADER & TOP NAVIGATION BAR (ON MOBILE: ONLY ON HOME PAGE; ON TABLET/DESKTOP: ALWAYS AVAILABLE) */}
      <header style={{ '--open-delay': '0ms' }} className={`bg-black sticky top-0 z-40 px-4 sm:px-6 lg:px-10 xl:px-12 pt-3 pb-2 md:py-3.5 animate-linear-open ${(activeTab === 'playground' || activeTab === 'home') ? 'block' : 'hidden md:block'}`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between relative">
          
          {/* TOP LEFT: Circular User Profile Avatar Button (when authenticated) or Brand Home Button */}
          <div className="flex items-center gap-2.5 z-10">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  aria-label="Open Host Profile Drawer"
                  title="Profil Host & Ringkasan Sesi"
                  className="relative w-10 h-10 rounded-full bg-zinc-900 border-2 border-[#D7FF00]/40 hover:border-[#D7FF00] flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(215,255,0,0.15)] transition-all active:scale-95 cursor-pointer group"
                >
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt={primaryAccountName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="text-xs font-black text-[#D7FF00] tracking-tight">
                      {primaryAccountName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080808]"
                    title="Authenticated Session Active"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigateToTab('playground')}
                  className="hidden sm:flex flex-col text-left cursor-pointer group"
                  title="Kembali ke Laman Utama"
                >
                  <span className="text-sm font-black tracking-wide text-white group-hover:text-[#D7FF00] transition-colors leading-none">
                    RYKHOR
                  </span>
                  <span className="text-[11px] text-zinc-300 font-mono mt-1 leading-none">
                    Scrim Hub
                  </span>
                </button>
              </div>
            ) : (
              <div 
                onClick={() => navigateToTab('playground')}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
                title="Kembali ke Laman Utama"
              >
                <img 
                  src="/logo.png" 
                  alt="RYKHOR Scrim Hub" 
                  className="w-9 h-9 rounded-full object-cover border border-[#D7FF00]/35 group-hover:scale-105 transition-transform" 
                />
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-black tracking-wide text-white group-hover:text-[#D7FF00] transition-colors">
                    RYKHOR
                  </span>
                  <span className="text-[11px] text-zinc-300 font-mono mt-0.5">
                    Scrim Hub
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TOP CENTER: Current Active Logged-In Account Selector (Small, Clean, Clickable with Floating Popover Card) */}
          {currentUser && (
            <div className="absolute left-1/2 -translate-x-1/2 z-30">
              <button
                type="button"
                onClick={() => setIsOrgPopoverOpen(prev => !prev)}
                aria-expanded={isOrgPopoverOpen}
                aria-haspopup="dialog"
                className="px-2 py-1 flex items-center gap-1.5 text-sm font-bold text-white hover:text-[#D7FF00] transition-colors active:scale-95 cursor-pointer max-w-[190px] sm:max-w-[240px]"
                title="Akaun Aktif Semasa"
              >
                <span className="truncate">{activeOrganizationName}</span>
                <ChevronDown
                  className={
                    'w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ' +
                    (isOrgPopoverOpen ? 'rotate-180 text-[#D7FF00]' : '')
                  }
                />
              </button>

              {/* Non-Intrusive Floating Popover Card (Shows Only Logged-In User Account) */}
              {isOrgPopoverOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsOrgPopoverOpen(false)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 w-64 sm:w-72 z-40">
                  <div
                    role="dialog"
                    aria-label="Active User Account"
                    className="w-full bg-black border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.92)] rounded-[1.5rem] p-3 space-y-2.5 origin-top animate-dropdown-reveal overscroll-contain"
                  >
                    <div className="flex items-center justify-between px-1.5 pt-0.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                        Akaun Log Masuk
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsOrgPopoverOpen(false)}
                        aria-label="Tutup"
                        className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Multi-Account List (1-Tap Switch) */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
                      {savedAccounts.length > 0 ? (
                        savedAccounts.map((acc) => {
                          const isActive = currentUser?.email?.toLowerCase() === acc.email?.toLowerCase();
                          const displayName = acc.name || acc.email.split('@')[0];
                          return (
                            <div
                              key={acc.email}
                              onClick={() => {
                                if (!isActive) handleSwitchAccount(acc);
                                else setIsOrgPopoverOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-2xl border font-bold flex items-center justify-between gap-2 text-left text-xs transition cursor-pointer ${
                                isActive
                                  ? 'bg-[#D7FF00]/15 text-white border-[#D7FF00]/40 shadow-sm'
                                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 ${
                                  isActive ? 'bg-[#D7FF00] text-black' : 'bg-zinc-800 text-zinc-300'
                                }`}>
                                  {displayName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-bold text-white flex items-center gap-1.5">
                                    <span>{displayName}</span>
                                    {isActive && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#D7FF00] text-black font-black">
                                        Aktif
                                      </span>
                                    )}
                                  </div>
                                  <div className="truncate text-[10px] text-zinc-400">{acc.email}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isActive ? (
                                  <Check className="w-4 h-4 text-[#D7FF00] shrink-0" />
                                ) : (
                                  <span className="text-[10px] font-mono text-zinc-400 group-hover:text-[#D7FF00]">
                                    Pilih
                                  </span>
                                )}
                                {savedAccounts.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemoveSavedAccount(e, acc.email)}
                                    title="Padam akaun dari senarai ini"
                                    className="w-5 h-5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-full px-3 py-2 rounded-2xl bg-[#D7FF00]/15 text-white border border-[#D7FF00]/30 font-bold flex items-center justify-between gap-2 text-left text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#D7FF00] text-black font-black text-[11px] flex items-center justify-center shrink-0">
                              {primaryAccountName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-white">{primaryAccountName}</div>
                              <div className="truncate text-[10px] text-zinc-400">{currentUser.email}</div>
                            </div>
                          </div>
                          <Check className="w-4 h-4 text-[#D7FF00] shrink-0" />
                        </div>
                      )}
                    </div>

                    {/* Account Actions */}
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOrgPopoverOpen(false);
                          setIsRegisterMode(false);
                          setAuthEmail('');
                          setAuthPassword('');
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-[#D7FF00] text-xs font-bold flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Tambah Akaun</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOrgPopoverOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-3 py-1.5 rounded-xl hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 text-[11px] font-semibold flex items-center justify-between transition cursor-pointer"
                      >
                        <span>Log Keluar Akaun Ini</span>
                        <LogOut className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TOP RIGHT: Desktop Navigation & Menu */}
          <div className="flex items-center gap-2 z-10">
            <nav className="hidden md:flex space-x-1 glass-pill p-1 rounded-2xl text-xs font-semibold items-center">
              <button
                type="button"
                onClick={() => navigateToTab('playground')}
                title="Command Center (Home)"
                aria-label="Home"
                className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ' + (
                  activeTab === 'playground' || activeTab === 'home'
                    ? 'bg-zinc-800 text-[#D7FF00] font-black shadow-xs' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                )}
              >
                <Home className="w-4 h-4"/>
                <span className="hidden xl:inline">Home</span>
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('history')}
                title="Rekod Kejohanan & Live Leaderboard"
                aria-label="Rekod Kejohanan"
                className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ' + (
                  activeTab === 'history' || activeTab === 'leaderboard'
                    ? 'bg-emerald-500/20 text-emerald-300 font-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                )}
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="hidden xl:inline">Rekod</span>
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('teams')}
                title="Team Matrix & Direktori Pasukan"
                aria-label="Team Matrix"
                className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ' + (
                  activeTab === 'teams'
                    ? 'bg-[#D7FF00]/20 text-[#D7FF00] font-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                )}
              >
                <Users className="w-4 h-4 text-[#D7FF00]" />
                <span className="hidden xl:inline">Teams</span>
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('admin')}
                title="Host Workspace & Portal Penganjur"
                aria-label="Host Portal"
                className={'flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ' + (
                  activeTab === 'admin'
                    ? 'bg-[#D7FF00]/20 text-[#D7FF00] font-black' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-bold'
                )}
              >
                {currentUser ? (
                  <ShieldCheck className="w-4 h-4 text-[#D7FF00]" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-zinc-300" />
                )}
                <span>Host</span>
              </button>
              <button
                type="button"
                onClick={() => navigateToTab('profile')}
                title="Profil Akaun & Pengurusan"
                aria-label="Profile"
                className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer ' + (
                  activeTab === 'profile'
                    ? 'bg-[#D7FF00]/20 text-[#D7FF00] font-black' 
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                )}
              >
                <User className="w-4 h-4 text-[#D7FF00]" />
                <span className="hidden xl:inline">Profile</span>
              </button>
            </nav>

            {!currentUser && (
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setPendingCloudSync(false);
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-1.5 rounded-full text-xs font-black bg-[#D7FF00] hover:bg-[#c2e600] text-black transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(215,255,0,0.3)] active:scale-95 cursor-pointer"
                title="Log masuk akaun penganjur"
              >
                <LogIn className="w-3.5 h-3.5 text-black stroke-[2.4]" />
                <span>Log Masuk</span>
              </button>
            )}

            {/* 3-Line Hamburger Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                className={'p-2 rounded-full transition flex items-center justify-center cursor-pointer ' + (
                  isNavMenuOpen 
                    ? 'bg-white/[0.14] text-[#D7FF00] border border-[#D7FF00]/40 backdrop-blur-md' 
                    : 'glass-pill glass-tile-hover text-zinc-300'
                )}
                title="Menu"
                aria-label="Navigation Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {isNavMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNavMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.92)] rounded-2xl overflow-hidden z-50 py-1.5 divide-y divide-white/10 text-xs origin-top-right animate-dropdown-reveal">
                    {isMasterAdmin && (
                      <div className="py-1 bg-[#D7FF00]/5 border-b border-[#D7FF00]/20">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNavMenuOpen(false);
                            setIsTeamManagerModalOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-[#D7FF00]/15 text-[#D7FF00] transition font-black cursor-pointer"
                        >
                          Urus Pasukan &amp; Logo
                        </button>
                      </div>
                    )}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleOpenGuide(0)}
                        className="w-full px-4 py-2 text-left hover:bg-white/5 text-zinc-200 transition font-bold cursor-pointer"
                      >
                        Slide Panduan App
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigateToTab('showcase');
                          setIsNavMenuOpen(false);
                        }}
                        className={'w-full px-4 py-2 text-left hover:bg-white/5 transition font-semibold cursor-pointer ' + (
                          activeTab === 'showcase' ? 'text-[#D7FF00] font-bold bg-white/5' : 'text-zinc-300'
                        )}
                      >
                        Content
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigateToTab('hosts');
                          setIsNavMenuOpen(false);
                        }}
                        className={'w-full px-4 py-2 text-left hover:bg-white/5 transition font-semibold cursor-pointer ' + (
                          activeTab === 'hosts' ? 'text-[#D7FF00] font-bold bg-white/5' : 'text-zinc-300'
                        )}
                      >
                        Direktori Host
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigateToTab('about');
                          setIsNavMenuOpen(false);
                        }}
                        className={'w-full px-4 py-2 text-left hover:bg-white/5 transition font-semibold cursor-pointer ' + (
                          activeTab === 'about' ? 'text-[#D7FF00] font-bold bg-white/5' : 'text-zinc-300'
                        )}
                      >
                        About Scrim Hub
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFeedbackModalOpen(true);
                          setIsNavMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-white/5 text-zinc-300 transition font-semibold cursor-pointer"
                      >
                        Feedback / Report Bug
                      </button>
                      {currentUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsNavMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-rose-400 transition font-bold cursor-pointer"
                        >
                          Log Keluar Akaun
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ '--open-delay': '90ms' }} className="flex-1 max-w-[1600px] w-full mx-auto px-3.5 sm:px-6 lg:px-10 xl:px-12 py-4 sm:py-6 pb-28 md:pb-10 animate-linear-open">
        <div
          key={`${activeTab}_${selectedTeamProfile ? 'profile' : 'main'}_${navDirection}`}
          className={`tab-blur-stage ${
            tabBlurStage === 'out'
              ? 'tab-blur-exiting'
              : activeTab === 'teams'
              ? 'animate-teams-enter'
              : activeTab === 'scorer' || activeTab === 'admin' || activeTab === 'scrim-data'
              ? 'animate-tab-bottom'
              : navDirection === 'backward'
              ? 'animate-tab-backward'
              : 'animate-tab-forward'
          }`}
        >

        {/* VIEW 0: AUTHENTICATION GUARD & BENTO-GRID COMMAND CENTER (ROOT ROUTE /) */}
        {(activeTab === 'playground' || activeTab === 'home') && (() => {
          // 1. LOADING SESSION STATE: Semantic Spinner & Frosted Glass Skeleton
          if (isAuthChecking) {
            return (
              <div className="max-w-xl md:max-w-full mx-auto space-y-4 pt-2 pb-6" aria-busy="true" aria-label="Memuatkan sesi">
                <div className="flex items-center justify-between px-1">
                  <div className="h-5 w-48 rounded-full bg-white/[0.06] animate-pulse" />
                  <div className="h-7 rounded-full glass-pill flex items-center gap-2 px-3">
                    <progress aria-label="Menyemak sesi" className="loading-spinner" style={{ '--size': '14px', '--thickness': '2px' }} />
                    <span className="text-[11px] font-mono text-zinc-300">Check sesi...</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-5">
                  <div className="col-span-2 lg:col-span-6 h-44 lg:h-96 rounded-[2rem] glass-panel animate-pulse p-6 flex flex-col justify-between">
                    <div className="h-6 w-40 rounded-full bg-white/[0.08]" />
                    <div className="space-y-2">
                      <div className="h-4 w-56 rounded-full bg-white/[0.06]" />
                      <div className="h-3 w-36 rounded-full bg-white/[0.04]" />
                    </div>
                  </div>
                  <div className="col-span-1 lg:col-span-3 h-72 lg:h-96 rounded-[2rem] glass-panel animate-pulse" />
                  <div className="col-span-1 lg:col-span-3 space-y-3.5 lg:space-y-5">
                    <div className="h-[137px] lg:h-[182px] rounded-[2rem] glass-panel animate-pulse" />
                    <div className="h-[137px] lg:h-[182px] rounded-[2rem] glass-panel animate-pulse" />
                  </div>
                </div>
              </div>
            );
          }

          // 2. BENTO-GRID COMMAND CENTER (Available for both Guests & Authenticated Users)
          const leadingTeam = validTeamList[0] || null;
          const topThreePreview = validTeamList.slice(0, 3);
          const tier3Leader = tier3RankedTeams[0] || null;
          const tier3TopThree = tier3RankedTeams.slice(0, 3);
          const desktopContendersSource = homeContendersCategory === 'TIER_3' ? tier3RankedTeams : validTeamList;
          const desktopContenders = desktopContendersSource.slice(0, 4);
          const desktopTopPoints = Math.max(
            homeContendersCategory === 'TIER_3'
              ? (desktopContenders[0]?.tier3Points || 1)
              : (desktopContenders[0]?.totalPoints || 1),
            1
          );
          const recentSessionsDock = scrims.slice(0, 3);

          const highestKillTeam = validTeamList.reduce((best, cur) => {
            const curAvg = cur.scrimResults?.length ? cur.totalKills / cur.scrimResults.length : 0;
            const bestAvg = best?.scrimResults?.length ? best.totalKills / best.scrimResults.length : 0;
            return curAvg > bestAvg ? cur : best;
          }, validTeamList[0] || null);
          const highestKillAvgVal = highestKillTeam?.scrimResults?.length
            ? (highestKillTeam.totalKills / highestKillTeam.scrimResults.length).toFixed(1)
            : '9.4';

          const tier3HighestKillTeam = tier3RankedTeams.reduce((best, cur) => {
            const curAvg = cur.tier3Events ? cur.tier3Kills / cur.tier3Events : 0;
            const bestAvg = best?.tier3Events ? best.tier3Kills / best.tier3Events : 0;
            return curAvg > bestAvg ? cur : best;
          }, tier3RankedTeams[0] || null);
          const tier3KillAvgVal = tier3HighestKillTeam?.tier3Events
            ? (tier3HighestKillTeam.tier3Kills / tier3HighestKillTeam.tier3Events).toFixed(1)
            : '0.0';

          const lastScannedRecord = scrims.find(
            s => s.created_by === 'public_ocr' || (s.description && s.description.toLowerCase().includes('ocr'))
          ) || scrims[0] || null;
          const lastScannedLabel = lastScannedRecord
            ? `${lastScannedRecord.title} • ${lastScannedRecord.date || 'Today'}`
            : 'Belum ada scan terkini';

          const quickScorerPreviewTitle =
            playgroundSession?.title && playgroundSession.title !== 'PUBG Mobile Scrim Season'
              ? playgroundSession.title
              : scrims[0]?.title || 'Sesi Pantas PMGC';

          const latestRekodSession = scrims[0] || null;
          const latestRekodTitle = latestRekodSession?.title || 'Belum ada sesi lagi';
          const latestRekodFinished = latestRekodSession ? Boolean(latestRekodSession.is_finished) : true;

          return (
            <div className="max-w-xl md:max-w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-7 pt-1 pb-6 md:pb-12 relative">
              
              {/* TIER 1: Specific Centered Headline + Live Counters */}
              <div
                className={`flex gap-3 px-1.5 md:px-1 animate-home-tier ${
                  currentUser
                    ? 'items-center justify-between'
                    : 'flex-col items-center text-center'
                }`}
                style={{ '--home-delay': '0ms' }}
              >
                <div className={currentUser ? 'min-w-0' : 'max-w-xl mx-auto text-center'}>
                  {currentUser ? (
                    <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight text-balance">
                      Selamat kembali, <span className="text-[#D7FF00]">{activeOrganizationName}</span>
                    </h1>
                  ) : (
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight text-balance">
                      Kedudukan Scrim &amp; <span className="text-[#D7FF00]">Kejohanan PUBG Mobile</span>
                    </h1>
                  )}
                  <p className="hidden md:block text-xs md:text-sm text-zinc-300 mt-1 text-pretty">
                    {currentUser
                      ? 'Urus rekod scrim, check prestasi team & scan poster keputusan.'
                      : 'Check ranking team, kira markah PMGC & scan poster keputusan.'}
                  </p>
                </div>

                {(currentUser || scrims.length > 0 || validTeamList.length > 0) && (
                  <div className={`items-center gap-2.5 shrink-0 ${currentUser ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Data Counters (Desktop only) */}
                    <div className="hidden lg:flex items-center gap-2">
                      <div className="px-3.5 py-2 rounded-full glass-pill text-xs font-mono font-bold text-zinc-200 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#D7FF00]" />
                        <span><strong className="text-white">{validTeamList.length}</strong> Pasukan</span>
                      </div>
                      <div className="px-3.5 py-2 rounded-full glass-pill text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                        <span><strong className="text-white">{scrims.length}</strong> Rekod</span>
                      </div>
                    </div>

                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-full glass-pill glass-tile-hover text-[11px] md:text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#D7FF00]" />
                        <span>{adminHostedScrims.length} Hosted</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

                {/* TIER 2: BENTO GRID LAYOUT (Mobile: 2-col intact | Desktop lg+: Wide 12-col Arena) */}
                <div className="grid grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5">
                  
                  {/* CARD A: Focal Hero Card (Acid Lime Accent) — [Team Matrix + Tier 3 Rank Slide] */}
                  <div
                    role="button"
                    tabIndex={0}
                    data-hof-slide={homeHofSlide}
                    onClick={() => {
                      setTeamStatsEventType('ALL');
                      handleSelectTeamStatsCategory(homeHofSlide === 1 ? 'TIER_3' : 'ALL');
                      navigateToTab('teams');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setTeamStatsEventType('ALL');
                        handleSelectTeamStatsCategory(homeHofSlide === 1 ? 'TIER_3' : 'ALL');
                        navigateToTab('teams');
                      }
                    }}
                    onMouseEnter={() => setIsHomeHofInteracting(true)}
                    onMouseLeave={() => setIsHomeHofInteracting(false)}
                    onFocus={() => setIsHomeHofInteracting(true)}
                    onBlur={() => setIsHomeHofInteracting(false)}
                    style={{ '--home-delay': '80ms' }}
                    className="col-span-2 lg:col-span-6 lg:row-span-2 rounded-[2rem] p-5 sm:p-6 lg:p-7 glass-lime hof-hero-card text-white lg:hover:-translate-y-1 active:scale-[0.985] [&:has([data-hof-controls]:active)]:scale-100 cursor-pointer relative overflow-hidden group select-none flex flex-col justify-between animate-home-tier"
                  >
                    <div className="relative z-10 flex flex-col justify-between gap-3.5 lg:h-full">
                      {/* Top Row: Smooth Crossfading Section Label, Title & Reactive Trophy Icon */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="hof-crossfade-stack text-[11px] font-mono font-bold text-[#D7FF00] leading-tight">
                            <span
                              data-active={homeHofSlide === 0}
                              aria-hidden={homeHofSlide !== 0}
                              className="hof-crossfade-item block"
                            >
                              Semua Team
                            </span>
                            <span
                              data-active={homeHofSlide === 1}
                              aria-hidden={homeHofSlide !== 1}
                              className="hof-crossfade-item block"
                            >
                              Tier 3
                            </span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-none pt-0.5 flex items-baseline gap-1.5">
                            <span className="font-team-matrix font-bold uppercase">Team</span>
                            <span className="font-jetbrains font-extrabold uppercase text-[0.88em] text-[#D7FF00] translate-y-[0.5px]">Matrix</span>
                          </h2>
                        </div>

                        <div
                          className={`hof-trophy-badge w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl bg-[#D7FF00] text-black flex items-center justify-center shadow-lg group-hover:scale-105 shrink-0 ${
                            homeHofSlide === 1 ? '-rotate-6 scale-105' : 'rotate-0 scale-100'
                          }`}
                        >
                          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 stroke-[2]" />
                        </div>
                      </div>

                      {/* Slide Carousel Viewport (Composited Slide + Soft Depth Breath) */}
                      <div
                        role="region"
                        aria-roledescription="carousel"
                        aria-label="Ringkasan Team Matrix dan Tier 3"
                        className="overflow-hidden rounded-2xl"
                      >
                        <div
                          className="hof-slide-track"
                          style={{ transform: `translate3d(-${homeHofSlide * 100}%, 0, 0)` }}
                        >
                          {/* SLIDE 1: OVERALL RANKING (SEMUA) */}
                          <div
                            role="group"
                            aria-roledescription="slide"
                            aria-label="1 of 2"
                            data-active={homeHofSlide === 0}
                            inert={homeHofSlide !== 0 ? true : undefined}
                            className="hof-slide-panel space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-2.5 lg:gap-3 pt-1">
                              <div className="hof-stat-tile glass-tile rounded-2xl p-3 lg:p-3.5">
                                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-300 block">
                                  #1 Leading Clan
                                </span>
                                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                  <span className="text-sm sm:text-base lg:text-lg font-black text-white truncate">
                                    {leadingTeam ? leadingTeam.name : 'Geek Fam'}
                                  </span>
                                  <span className="text-xs font-mono font-black text-[#D7FF00] shrink-0">
                                    {leadingTeam ? `${leadingTeam.totalPoints} PTS` : '148 PTS'}
                                  </span>
                                </div>
                              </div>

                              <div className="hof-stat-tile glass-tile rounded-2xl p-3 lg:p-3.5">
                                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-300 block">
                                  Elim Avg • WWCD Streak
                                </span>
                                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                  <span className="text-sm sm:text-base lg:text-lg font-black text-white font-mono">
                                    {highestKillAvgVal} Elims
                                  </span>
                                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-[#D7FF00] text-black shrink-0">
                                    {leadingTeam ? `${leadingTeam.totalWWCD} WWCD` : '4 WWCD'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {topThreePreview.length > 0 && (
                              <div className="hof-stat-tile hof-podium-strip hidden lg:flex flex-col gap-2 pt-0.5">
                                <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-wider text-zinc-300 px-0.5">
                                  <span>Live Podium Top 3 • Semua</span>
                                  <span className="inline-flex items-center gap-1 text-[#D7FF00] group-hover:translate-x-1 transition-transform">
                                    <span>Buka Leaderboard</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                  {topThreePreview.map((team, idx) => (
                                    <div
                                      key={team.name}
                                      className="rounded-xl glass-tile px-3 py-2 flex items-center gap-2 min-w-0"
                                    >
                                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-black shrink-0 ${
                                        idx === 0 ? 'bg-[#D7FF00] text-black' : 'bg-white/10 text-white'
                                      }`}>
                                        #{idx + 1}
                                      </span>
                                      {team.logo_url && (
                                        <img
                                          src={team.logo_url}
                                          alt=""
                                          className="w-6 h-6 rounded-lg object-cover shrink-0 bg-black/30"
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-black text-white truncate leading-tight">
                                          {team.name}
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-[#D7FF00] leading-tight">
                                          {team.totalPoints} PTS • {team.totalWWCD}W
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* SLIDE 2: TIER 3 (AMATEUR) RANKING SPOTLIGHT */}
                          <div
                            role="group"
                            aria-roledescription="slide"
                            aria-label="2 of 2"
                            data-active={homeHofSlide === 1}
                            inert={homeHofSlide !== 1 ? true : undefined}
                            className="hof-slide-panel space-y-3"
                          >
                            <div className="grid grid-cols-2 gap-2.5 lg:gap-3 pt-1">
                              <div className="hof-stat-tile glass-tile rounded-2xl p-3 lg:p-3.5">
                                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-300 block">
                                  #1 Tier 3 Leader
                                </span>
                                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                  <span className="text-sm sm:text-base lg:text-lg font-black text-white truncate">
                                    {tier3Leader ? tier3Leader.name : 'Belum ada rekod'}
                                  </span>
                                  <span className="text-xs font-mono font-black text-[#D7FF00] shrink-0">
                                    {tier3Leader ? `${tier3Leader.tier3Points} PTS` : 'Tier 3'}
                                  </span>
                                </div>
                              </div>

                              <div className="hof-stat-tile glass-tile rounded-2xl p-3 lg:p-3.5">
                                <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-300 block">
                                  Tier 3 Elim Avg • Aktif
                                </span>
                                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                                  <span className="text-sm sm:text-base lg:text-lg font-black text-white font-mono">
                                    {tier3KillAvgVal} Elims
                                  </span>
                                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-[#D7FF00] text-black shrink-0">
                                    {tier3Leader ? `${tier3RankedTeams.length} Team` : 'Amateur'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {tier3TopThree.length > 0 ? (
                              <div className="hof-stat-tile hof-podium-strip hidden lg:flex flex-col gap-2 pt-0.5">
                                <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase tracking-wider text-zinc-300 px-0.5">
                                  <span>Podium Top 3 • Tier 3 (Amateur)</span>
                                  <span className="inline-flex items-center gap-1 text-[#D7FF00] group-hover:translate-x-1 transition-transform">
                                    <span>Buka Rank Tier 3</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                  {tier3TopThree.map((team, idx) => (
                                    <div
                                      key={`t3_${team.name}`}
                                      className="rounded-xl glass-tile px-3 py-2 flex items-center gap-2 min-w-0"
                                    >
                                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-black shrink-0 ${
                                        idx === 0 ? 'bg-[#D7FF00] text-black' : 'bg-white/10 text-white'
                                      }`}>
                                        #{idx + 1}
                                      </span>
                                      {team.logo_url && (
                                        <img
                                          src={team.logo_url}
                                          alt=""
                                          className="w-6 h-6 rounded-lg object-cover shrink-0 bg-black/30"
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-black text-white truncate leading-tight">
                                          {team.name}
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-[#D7FF00] leading-tight">
                                          {team.tier3Points} PTS • {team.tier3WWCD}W
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="hof-stat-tile hof-podium-strip hidden lg:flex items-center justify-between rounded-xl glass-tile px-3.5 py-2.5 text-xs font-bold text-zinc-200">
                                <span>Rekod Tier 3 akan keluar kat sini lepas match disimpan.</span>
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-[#D7FF00] shrink-0">
                                  <span>Buka Tier 3</span>
                                  <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Slide Switcher Bar + Crossfading Teaser + Sliding Toggle Control */}
                      <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                        <div className="hof-crossfade-stack text-[10px] font-mono font-bold text-zinc-200 min-w-0 flex-1">
                          <span
                            data-active={homeHofSlide === 0}
                            aria-hidden={homeHofSlide !== 0}
                            className="hof-crossfade-item truncate block"
                          >
                            {tier3Leader
                              ? `Tier 3 #1: ${tier3Leader.name} (${tier3Leader.tier3Points} PTS)`
                              : 'Tap untuk buka Leaderboard penuh'}
                          </span>
                          <span
                            data-active={homeHofSlide === 1}
                            aria-hidden={homeHofSlide !== 1}
                            className="hof-crossfade-item truncate block"
                          >
                            {tier3TopThree.length > 1
                              ? `#2 ${tier3TopThree[1].name} • #3 ${tier3TopThree[2]?.name || '-'}`
                              : 'Tap untuk buka Ranking Tier 3'}
                          </span>
                        </div>

                        <div
                          data-hof-controls
                          className="flex items-center gap-1 glass-pill rounded-full p-0.5 touch-manipulation shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative grid grid-cols-2 items-center rounded-full">
                            <span
                              aria-hidden="true"
                              className="hof-toggle-thumb pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-full bg-[#D7FF00] shadow-[0_2px_10px_rgba(215,255,0,0.3)]"
                              style={{ transform: `translate3d(${homeHofSlide * 100}%, 0, 0)` }}
                            />
                            <button
                              type="button"
                              onClick={() => setHomeHofSlide(0)}
                              aria-label="Paparan Semua Ranking"
                              aria-current={homeHofSlide === 0 ? 'true' : undefined}
                              className={`relative z-10 px-2.5 py-1 rounded-full text-[10px] font-mono font-black transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF00] active:scale-95 touch-manipulation text-center ${
                                homeHofSlide === 0 ? 'text-black' : 'text-zinc-300 hover:text-white'
                              }`}
                            >
                              Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => setHomeHofSlide(1)}
                              aria-label="Paparan Ranking Tier 3"
                              aria-current={homeHofSlide === 1 ? 'true' : undefined}
                              className={`relative z-10 px-2.5 py-1 rounded-full text-[10px] font-mono font-black transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF00] active:scale-95 touch-manipulation text-center ${
                                homeHofSlide === 1 ? 'text-black' : 'text-zinc-300 hover:text-white'
                              }`}
                            >
                              Tier 3
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsHomeHofPaused((prev) => !prev)}
                            aria-label={isHomeHofPaused ? 'Mainkan slaid' : 'Jeda slaid'}
                            title={isHomeHofPaused ? 'Mainkan slaid automatik' : 'Jeda slaid automatik'}
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-[#D7FF00] hover:text-black text-white flex items-center justify-center transition duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF00] active:scale-90 touch-manipulation"
                          >
                            {isHomeHofPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD B: Left Tall Card (Pink Accent) — [Results Scanner] */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigateToTab('scrim-data')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToTab('scrim-data');
                      }
                    }}
                    style={{ '--home-delay': '160ms' }}
                    className="col-span-1 row-span-2 lg:col-span-3 lg:row-span-2 rounded-[2rem] p-5 lg:p-6 glass-pink text-white lg:hover:-translate-y-1 active:scale-[0.98] transition-[transform,background-color,border-color] duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none min-h-[290px] sm:min-h-[320px] lg:min-h-[380px] animate-home-tier"
                  >
                    {/* Top Icon */}
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <div className="w-11 h-11 rounded-2xl glass-tile text-pink-200 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5 stroke-[2]" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-pink-100 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    {/* Specific Capability Summary */}
                    <div className="my-auto py-4 relative z-10">
                      <p className="text-xs font-medium text-pink-50 leading-relaxed text-pretty">
                        Upload poster untuk extract &amp; check markah.
                      </p>
                    </div>

                    {/* Bottom Title & Last Scanned History */}
                    <div className="space-y-1.5 relative z-10">
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight text-balance">
                        Imbas Keputusan
                      </h2>
                      <p className="text-[11px] font-medium text-pink-50/95 leading-snug line-clamp-2">
                        Terkini: <strong className="text-white font-bold">{lastScannedLabel}</strong>
                      </p>
                    </div>
                  </div>

                  {/* CARD C: Top-Right Card (Blue Accent) — [Quick Scorer] */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigateToTab('scorer')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToTab('scorer');
                      }
                    }}
                    style={{ '--home-delay': '230ms' }}
                    className="col-span-1 lg:col-span-3 lg:row-span-1 rounded-[2rem] p-4 sm:p-5 lg:p-6 glass-blue text-white lg:hover:-translate-y-1 active:scale-[0.98] transition-[transform,background-color,border-color] duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none min-h-[140px] sm:min-h-[152px] lg:min-h-[180px] animate-home-tier"
                  >
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <div className="w-10 h-10 rounded-2xl glass-tile text-blue-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Edit3 className="w-4 h-4 stroke-[2]" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-100 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    <div className="space-y-1 pt-3 relative z-10">
                      <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight text-balance">
                        Quick Scorer
                      </h2>
                      <p className="text-[11px] font-medium text-blue-50 truncate">
                        {quickScorerPreviewTitle}
                      </p>
                    </div>
                  </div>

                  {/* CARD D: Bottom-Right Card (Green Accent) — [Rekod / Match Logs] */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigateToTab('history')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateToTab('history');
                      }
                    }}
                    style={{ '--home-delay': '300ms' }}
                    className="col-span-1 lg:col-span-3 lg:row-span-1 rounded-[2rem] p-4 sm:p-5 lg:p-6 glass-emerald text-white lg:hover:-translate-y-1 active:scale-[0.98] transition-[transform,background-color,border-color] duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none min-h-[140px] sm:min-h-[152px] lg:min-h-[180px] animate-home-tier"
                  >
                    <div className="flex items-center justify-between gap-2 relative z-10">
                      <div className="w-10 h-10 rounded-2xl glass-tile text-emerald-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Clock className="w-4 h-4 stroke-[2]" />
                      </div>

                      {latestRekodSession && (
                        latestRekodFinished ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 backdrop-blur-md border border-emerald-300/25 text-emerald-100 text-[10px] font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                            <span>Selesai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/75 backdrop-blur-md border border-amber-300/25 text-amber-100 text-[10px] font-mono font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                            <span>Live</span>
                          </span>
                        )
                      )}
                    </div>

                    <div className="space-y-1 pt-3 relative z-10">
                      <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-white leading-tight text-balance">
                        Rekod Kejohanan
                      </h2>
                      <p className="text-[11px] font-medium text-emerald-50 truncate">
                        {latestRekodTitle}
                      </p>
                    </div>
                  </div>

                </div>

                {/* TIER 3: DESKTOP IMMERSIVE LIVE ARENA DOCK (Hidden on mobile so phone view remains compact & identical) */}
                <div
                  className="hidden lg:grid lg:grid-cols-12 lg:gap-5 animate-home-tier"
                  style={{ '--home-delay': '370ms' }}
                >
                  {/* Left: Top Contenders Live Standings */}
                  <div className="lg:col-span-7 glass-panel rounded-[2rem] p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/15 border border-[#D7FF00]/25 text-[#D7FF00] flex items-center justify-center">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white tracking-tight">
                            {homeContendersCategory === 'TIER_3' ? 'Top Contenders • Tier 3' : 'Top Contenders Semasa'}
                          </h3>
                          <p className="text-[11px] text-zinc-400">
                            Tap nama team untuk tengok rekod &amp; graf
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center glass-pill rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => setHomeContendersCategory('ALL')}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                              homeContendersCategory === 'ALL'
                                ? 'bg-[#D7FF00] text-black'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            Semua
                          </button>
                          <button
                            type="button"
                            onClick={() => setHomeContendersCategory('TIER_3')}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                              homeContendersCategory === 'TIER_3'
                                ? 'bg-amber-400 text-black'
                                : 'text-amber-300/80 hover:text-amber-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>Tier 3</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setTeamStatsEventType('ALL');
                            handleSelectTeamStatsCategory(homeContendersCategory);
                            navigateToTab('teams');
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-[#D7FF00] flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <span>Team Matrix</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isDataLoading && desktopContenders.length === 0 ? (
                      <div className="space-y-2.5" aria-busy="true" aria-label="Memuatkan kedudukan pasukan">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className="w-full rounded-2xl glass-tile px-4 py-3 flex items-center gap-3.5 animate-pulse">
                            <div className="w-8 h-8 rounded-xl bg-white/[0.08] shrink-0" />
                            <div className="w-9 h-9 rounded-xl bg-white/[0.06] shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 w-36 rounded-full bg-white/[0.08]" />
                              <div className="h-2 w-48 rounded-full bg-white/[0.05]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : desktopContenders.length > 0 ? (
                      <div className="space-y-2.5">
                        {desktopContenders.map((team, idx) => {
                          const pts = homeContendersCategory === 'TIER_3' ? team.tier3Points : team.totalPoints;
                          const kills = homeContendersCategory === 'TIER_3' ? team.tier3Kills : team.totalKills;
                          const wwcd = homeContendersCategory === 'TIER_3' ? team.tier3WWCD : team.totalWWCD;
                          const tier3Info = homeContendersCategory === 'ALL' ? tier3RankByTeam.get(team.name) : null;
                          const pct = Math.max(12, Math.round((pts / desktopTopPoints) * 100));
                          return (
                            <button
                              key={`${homeContendersCategory}_${team.name}`}
                              type="button"
                              onClick={() => {
                                setTeamStatsEventType('ALL');
                                handleSelectTeamStatsCategory(homeContendersCategory);
                                navigateToTab('teams');
                                setSelectedTeamProfile(team.name);
                              }}
                              className="w-full text-left rounded-2xl glass-tile glass-tile-hover px-4 py-3 flex items-center gap-3.5 transition-[transform,background-color,border-color] duration-200 hover:translate-x-1 cursor-pointer group"
                            >
                              <span
                                className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                                  idx === 0
                                    ? (homeContendersCategory === 'TIER_3' ? 'bg-amber-400 text-black shadow-[0_0_14px_rgba(245,158,11,0.28)]' : 'bg-[#D7FF00] text-black shadow-[0_0_14px_rgba(215,255,0,0.28)]')
                                    : idx === 1
                                    ? 'bg-zinc-200 text-black'
                                    : idx === 2
                                    ? 'bg-amber-400 text-black'
                                    : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                #{idx + 1}
                              </span>

                              {team.logo_url ? (
                                <img
                                  src={team.logo_url}
                                  alt=""
                                  className="w-9 h-9 rounded-xl object-cover shrink-0 bg-zinc-900"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-[#D7FF00] font-black text-xs flex items-center justify-center shrink-0">
                                  {(team.tag || team.name.slice(0, 3)).toUpperCase()}
                                </div>
                              )}

                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm font-black text-white truncate group-hover:text-[#D7FF00] transition-colors">
                                      {team.name}
                                    </span>
                                    {team.tag && (
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-400 shrink-0">
                                        {team.tag}
                                      </span>
                                    )}
                                    {tier3Info && (
                                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 shrink-0">
                                        T3 #{tier3Info.tier3Rank}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                                    <span className="text-zinc-400">{kills} Elims</span>
                                    <span className="text-emerald-400 font-bold">{wwcd} WWCD</span>
                                    <span className={`${homeContendersCategory === 'TIER_3' ? 'text-amber-300' : 'text-[#D7FF00]'} font-black`}>{pts} PTS</span>
                                  </div>
                                </div>

                                <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      idx === 0
                                        ? (homeContendersCategory === 'TIER_3' ? 'bg-amber-400' : 'bg-[#D7FF00]')
                                        : 'bg-zinc-600 group-hover:bg-zinc-400'
                                    }`}
                                  />
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-xs text-zinc-400 rounded-2xl glass-tile">
                        {homeContendersCategory === 'TIER_3'
                          ? 'Belum ada rekod Tier 3 lagi.'
                          : 'Belum ada data ranking team lagi.'}
                      </div>
                    )}
                  </div>

                  {/* Right: Recent Sessions & Quick Portal Actions */}
                  <div className="lg:col-span-5 glass-panel rounded-[2rem] p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white tracking-tight">
                              Arkib Sesi Terkini
                            </h3>
                            <p className="text-[11px] text-zinc-400">
                              Tap sesi untuk tengok scoreboard penuh
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateToTab('history')}
                          className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <span>Semua Rekod</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isDataLoading && recentSessionsDock.length === 0 ? (
                        <div className="space-y-2.5" aria-busy="true" aria-label="Memuatkan arkib sesi">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="w-full rounded-2xl glass-tile px-4 py-3 flex items-center gap-3 animate-pulse">
                              <div className="w-9 h-9 rounded-xl bg-white/[0.07] shrink-0" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 w-40 rounded-full bg-white/[0.08]" />
                                <div className="h-2.5 w-24 rounded-full bg-white/[0.05]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : recentSessionsDock.length > 0 ? (
                        <div className="space-y-2.5">
                          {recentSessionsDock.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setInspectedScrim(s)}
                              className="w-full text-left rounded-2xl glass-tile glass-tile-hover px-4 py-3 flex items-center justify-between gap-3 transition-[transform,background-color,border-color] duration-200 hover:translate-x-1 cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {s.logo_url ? (
                                  <img
                                    src={s.logo_url}
                                    alt=""
                                    className="w-9 h-9 rounded-xl object-cover shrink-0 bg-zinc-900"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-zinc-900 text-[#D7FF00] flex items-center justify-center shrink-0">
                                    {s.event_type === 'Tour' ? (
                                      <Trophy className="w-4 h-4" />
                                    ) : (
                                      <Flame className="w-4 h-4" />
                                    )}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-sm font-black text-white truncate group-hover:text-[#D7FF00] transition-colors">
                                    {s.title}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                                    <span>{s.date || 'Tarikh -'}</span>
                                    <span>•</span>
                                    <span>{s.matches?.length || s.total_matches || 1} Match</span>
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full shrink-0 ${
                                  s.is_finished
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-300'
                                }`}
                              >
                                {s.is_finished ? 'Selesai' : 'Live'}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-xs text-zinc-400 rounded-2xl glass-tile">
                          Belum ada rekod sesi terkini.
                        </div>
                      )}
                    </div>

                    {/* Quick Desktop Shortcut Footer */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => navigateToTab('scrim-data')}
                        className="py-2.5 px-3.5 rounded-2xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        <span>Scan Poster AI</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToTab('admin')}
                        className="py-2.5 px-3.5 rounded-2xl bg-[#D7FF00]/15 hover:bg-[#D7FF00]/25 text-[#D7FF00] text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Portal Host</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          // NOTA: Paparan legacy guest landing view (Card slider, FAQ dsb.) kini telah diasingkan
          // ke dalam komponen `LegacyGuestLandingView.jsx` dan sedia untuk dipanggil bila-bila masa.
        })()}

        {/* NOTA: Quick Scorer kini telah dinaiktaraf sepenuhnya menggunakan enjin Admin Scorer */}

        {/* VIEW 1: TEAM STATS (TEAM MATRIX - REFERENCE DIAL & SUMMARY LAYOUT) */}
        {activeTab === 'teams' && (() => {
          const { category, eventType, season, stage } = teamMatrixFilterState;
          const sssScope = { season, stage };

          const allRankedTeamsWithStats = categoryTeamList.map((t) => {
            const allRes = t.scrimResults || [];
            const scopedRes = (category === 'ALL' && eventType === 'ALL')
              ? allRes
              : allRes.filter(r => matchesStatsFilter(r, category, eventType, sssScope));
            const scopedPoints = scopedRes.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
            const scopedKills = scopedRes.reduce((acc, c) => acc + (Number(c.kills) || 0), 0);
            const scopedWWCD = scopedRes.reduce((acc, c) => acc + (Number(c.wwcd) || 0), 0);
            const scopedMatches = scopedRes.reduce((acc, c) => acc + (Number(c.matches) || 1), 0);
            return {
              ...t,
              scopedPoints,
              scopedKills,
              scopedWWCD,
              scopedMatches,
              scopedEvents: scopedRes.length
            };
          }).sort((a, b) => (
            b.scopedPoints - a.scopedPoints ||
            b.scopedWWCD - a.scopedWWCD ||
            b.scopedKills - a.scopedKills
          )).map((t, idx) => ({
            ...t,
            globalRank: idx + 1
          }));

          const scopedScrimList = (category === 'ALL' && eventType === 'ALL')
            ? scrims
            : scrims.filter((s) =>
                matchesStatsFilter(
                  {
                    scrimName: s.title,
                    scrimData: s,
                    scrimTier: s.tier || 'Tier 1 (Pro)',
                    eventType: s.event_type || 'Scrim',
                    hostName: s.host_name || 'Tournament Organizer'
                  },
                  category,
                  eventType,
                  sssScope
                )
              );

          const totalTeamsCount = (category === 'ALL' && eventType === 'ALL')
            ? validTeamList.length
            : allRankedTeamsWithStats.length;
          const totalScrimsCount = scopedScrimList.filter(s => (s.event_type || 'Scrim') !== 'Tour').length;
          const totalToursCount = scopedScrimList.filter(s => s.event_type === 'Tour').length;

          const query = teamSearchQuery.toLowerCase().trim();
          const rankedTeamsWithStats = query
            ? allRankedTeamsWithStats.filter(t =>
                t.name.toLowerCase().includes(query) ||
                (t.tag && t.tag.toLowerCase().includes(query))
              )
            : allRankedTeamsWithStats;

          // DEDICATED FULL-PAGE VIEW FOR TEAM PROFILE & INTERACTIVE STATS (Replaces floating modal card)
          if (selectedTeamProfile && activeTeamData && activeTeamScopedStats) {
            const teamInRanked = allRankedTeamsWithStats.find(t => t.name === activeTeamData.name);
            const globalFallbackIndex = validTeamList.findIndex(t => t.name === activeTeamData.name);
            const overallRank = teamInRanked?.globalRank ?? (globalFallbackIndex !== -1 ? globalFallbackIndex + 1 : '-');
            const placementPoints = Math.max(0, activeTeamScopedStats.totalPoints - activeTeamScopedStats.totalKills);
            const kpPercent = activeTeamScopedStats.totalPoints > 0
              ? Math.round((activeTeamScopedStats.totalKills / activeTeamScopedStats.totalPoints) * 100)
              : 0;
            const ppPercent = Math.max(0, 100 - kpPercent);
            const avgPtsPerEvent = activeTeamScopedStats.eventsCount > 0
              ? (activeTeamScopedStats.totalPoints / activeTeamScopedStats.eventsCount).toFixed(1)
              : '0.0';
            const avgKillsPerMatch = activeTeamScopedStats.matchesCount > 0
              ? (activeTeamScopedStats.totalKills / activeTeamScopedStats.matchesCount).toFixed(1)
              : '0.0';
            const winRatePercent = activeTeamScopedStats.matchesCount > 0
              ? Math.round((activeTeamScopedStats.totalWWCD / activeTeamScopedStats.matchesCount) * 100)
              : 0;

            return (
              <div className="max-w-xl lg:max-w-full mx-auto space-y-4 lg:space-y-5 pt-1 pb-28 md:pb-10 animate-teams-enter relative">
                {/* 1. TOP NAVIGATION BAR */}
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => {
                      runBlurSwap(true, () => {
                        setNavDirection('backward');
                        setSelectedTeamProfile('');
                      });
                    }}
                    className="inline-flex items-center gap-2 text-white hover:text-[#D7FF00] transition cursor-pointer group py-1 active:scale-95"
                    title="Kembali ke Team Matrix"
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition">
                      <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-[#D7FF00] transition" />
                    </div>
                    <span className="text-sm sm:text-base font-bold tracking-tight text-zinc-300 group-hover:text-white transition">
                      Kembali ke Team Matrix
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPerformanceTeam(activeTeamData);
                      setSelectedPerformanceHost('ALL');
                      setPerformanceModalCategory(
                        teamStatsCategory !== 'ALL' ? teamStatsCategory : (teamStatsEventType !== 'ALL' ? teamStatsEventType : 'ALL')
                      );
                      setIsPerformanceModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-pill glass-tile-hover text-xs font-bold text-zinc-200 hover:text-[#D7FF00] transition cursor-pointer"
                    title="Jana IG Story 9:16"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#D7FF00]" />
                    <span>Story 9:16</span>
                  </button>
                </div>

                {/* 2. TEAM IDENTITY HERO BANNER */}
                <div className="relative overflow-hidden glass-panel rounded-[2rem] p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4 min-w-0">
                      {activeTeamData.logo_url ? (
                        <img
                          src={activeTeamData.logo_url}
                          alt={activeTeamData.name}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl object-cover shadow-[0_0_25px_rgba(215,255,0,0.22)] shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl bg-[#D7FF00] flex items-center justify-center text-black font-black text-2xl shadow-lg shrink-0">
                          {activeTeamData.tag || activeTeamData.name.slice(0, 3).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                            {activeTeamData.name}
                          </h1>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#D7FF00]/15 text-[#D7FF00] font-mono text-xs font-black">
                            #{overallRank}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                          <span>Tag: <strong className="text-zinc-200">[{activeTeamData.tag}]</strong></span>
                          <span>•</span>
                          <span>{activeTeamScopedStats.eventsCount} Sesi</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Category Filter Scope Tabs */}
                  <div className="mt-4 pt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pr-6">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
                      Skop:
                    </span>
                    {HALL_OF_FAME_EVENT_TOGGLES.map((ev) => {
                      const isEvActive = teamStatsEventType === ev.key;
                      return (
                        <button
                          key={ev.key}
                          type="button"
                          aria-pressed={isEvActive}
                          onClick={() => setTeamStatsEventType(prev => (prev === ev.key ? 'ALL' : ev.key))}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                            isEvActive
                              ? 'bg-zinc-100 text-zinc-950 font-semibold'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span>{ev.label}</span>
                        </button>
                      );
                    })}
                    <span className="w-px h-4 bg-zinc-800 shrink-0 mx-0.5" aria-hidden="true" />
                    {HALL_OF_FAME_FILTERS.map(cat => {
                      const isActive = teamStatsCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleSelectTeamStatsCategory(cat.key)}
                          className={`px-3.5 py-1.5 rounded-full text-xs transition-all shrink-0 cursor-pointer ${
                            isActive
                              ? 'bg-zinc-100 text-zinc-950 font-semibold'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                    {teamStatsCategory === 'SSS' && (
                      <div className="sss-tier2-reveal shrink-0 flex items-center gap-1.5 pl-1">
                        <label htmlFor="profile-sss-season-select" className="sr-only">
                          Pilih Musim SSS
                        </label>
                        <select
                          id="profile-sss-season-select"
                          name="profileSssSeason"
                          value={String(sssFilterSelection.season)}
                          onChange={(e) => handleSelectSssSeason(e.target.value)}
                          className="sss-brand-select"
                        >
                          {SSS_SEASON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <label htmlFor="profile-sss-stage-select" className="sr-only">
                          Pilih Stage SSS
                        </label>
                        <select
                          id="profile-sss-stage-select"
                          name="profileSssStage"
                          value={sssFilterSelection.stage}
                          onChange={(e) => handleSelectSssStage(e.target.value)}
                          className="sss-brand-select"
                        >
                          {SSS_STAGE_OPTIONS.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* DESKTOP 2-COLUMN ANALYTICS & MATCH LOGS SPLIT (Mobile stays vertical) */}
                <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
                  <div className="space-y-4 lg:col-span-7">
                    {/* 3. INTERACTIVE STATS BENTO GRID (4 CARDS) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Points */}
                  <div className="glass-tile glass-tile-hover rounded-2xl p-3.5 text-center flex flex-col justify-between transition group">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Points</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#D7FF00] my-1">
                      {activeTeamScopedStats.totalPoints}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-medium">
                      ~{avgPtsPerEvent} pts / sesi
                    </span>
                  </div>

                  {/* Elims */}
                  <div className="glass-tile glass-tile-hover rounded-2xl p-3.5 text-center flex flex-col justify-between transition group">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Eliminations</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white my-1">
                      {activeTeamScopedStats.totalKills}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-medium">
                      ~{avgKillsPerMatch} Elims / match
                    </span>
                  </div>

                  {/* WWCD */}
                  <div className="glass-tile glass-tile-hover rounded-2xl p-3.5 text-center flex flex-col justify-between transition group">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">WWCD Dinners</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-[#D7FF00] my-1 flex items-center justify-center gap-1">
                      <Trophy className="w-5 h-5 text-[#D7FF00]" />
                      {activeTeamScopedStats.totalWWCD}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-medium">
                      {winRatePercent}% Win Rate
                    </span>
                  </div>

                  {/* Matches / Sesi */}
                  <div className="glass-tile glass-tile-hover rounded-2xl p-3.5 text-center flex flex-col justify-between transition group">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sesi / Match</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-zinc-200 my-1">
                      {activeTeamScopedStats.eventsCount}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-medium">
                      {activeTeamScopedStats.matchesCount} match
                    </span>
                  </div>
                </div>

                {/* 4. TACTICAL PLAYSTYLE COMBAT RATIO */}
                <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">
                      Gaya Main (Elims vs PP)
                    </span>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#D7FF00] font-bold">Elims: {kpPercent}%</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400 font-bold">PP: {ppPercent}%</span>
                    </div>
                  </div>

                  {/* Dual-color Segmented Bar */}
                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden flex p-0.5">
                    <div
                      style={{ width: `${Math.max(kpPercent, 4)}%` }}
                      className="h-full bg-[#D7FF00] rounded-l-full transition-all duration-500"
                      title={`Elimination Points: ${activeTeamScopedStats.totalKills} PTS (${kpPercent}%)`}
                    />
                    <div
                      style={{ width: `${Math.max(ppPercent, 4)}%` }}
                      className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                      title={`Placement Points: ${placementPoints} PTS (${ppPercent}%)`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                      <span>Elimination Points ({activeTeamScopedStats.totalKills} pts)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Placement Points ({placementPoints} pts)</span>
                    </span>
                  </div>
                </div>

                {/* 4B. MERGED SMOOTH DUAL-LINE PERFORMANCE CHART (ELIMS VS PP PER SCRIM) */}
                <ScrimDualLineChart results={activeTeamScopedStats.filteredResults} />

                {/* 5. SHARE / STORY GENERATOR CTA BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setPerformanceTeam(activeTeamData);
                    setSelectedPerformanceHost('ALL');
                    setPerformanceModalCategory(
                      teamStatsCategory !== 'ALL' ? teamStatsCategory : (teamStatsEventType !== 'ALL' ? teamStatsEventType : 'ALL')
                    );
                    setIsPerformanceModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-black" />
                  <span>Buat Kad Story 9:16</span>
                </button>
                  </div>

                {/* 6. SEJARAH PERLAWANAN */}
                <div className="space-y-3 pt-2 lg:pt-0 lg:col-span-5">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Rekod Match
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full glass-pill text-zinc-200 font-mono font-bold">
                        {activeTeamScopedStats.filteredResults.length} Rekod
                      </span>
                    </div>
                  </div>

                  {activeTeamScopedStats.filteredResults && activeTeamScopedStats.filteredResults.length > 0 ? (
                    <div className="space-y-2">
                      {activeTeamScopedStats.filteredResults.map((item, idx) => {
                        const isFirst = item.ranking === 1;
                        const itemKey = item.scrimData?.id || `${item.scrimName}_${idx}`;
                        const isExpanded = Boolean(expandedTeamScrimIdxs[itemKey]);
                        const itemPP = Math.max(0, item.points - item.kills);

                        return (
                          <div
                            key={itemKey}
                            className={`rounded-2xl transition-all overflow-hidden ${
                              isFirst
                                ? 'glass-tile border-[#D7FF00]/30 shadow-[0_0_20px_rgba(215,255,0,0.1)]'
                                : 'glass-tile glass-tile-hover'
                            }`}
                          >
                            {/* Summary Row */}
                            <div
                              onClick={() => toggleTeamScrimExpand(itemKey)}
                              className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {item.scrimData?.logo_url ? (
                                  <img
                                    src={item.scrimData.logo_url}
                                    alt=""
                                    className="w-10 h-10 rounded-xl object-cover shrink-0"
                                  />
                                ) : (
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                    isFirst ? 'bg-[#D7FF00] text-black font-black' : 'bg-zinc-800 text-zinc-300'
                                  }`}>
                                    #{item.ranking}
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate max-w-[150px] sm:max-w-none">{item.scrimName}</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                                        (item.eventType || 'Scrim') === 'Tour'
                                          ? 'bg-amber-500/20 text-amber-300'
                                          : 'bg-[#D7FF00]/15 text-[#D7FF00]'
                                      }`}
                                    >
                                      {(item.eventType || 'Scrim').toUpperCase()}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 bg-zinc-800/90 text-zinc-300">
                                      {item.scrimTier || item.scrimData?.tier || 'Tier 1 (Pro)'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                                    <span className="font-mono text-zinc-400">{item.date || 'Tarikh -'}</span>
                                    <span>•</span>
                                    <span className="text-[#D7FF00] font-bold">{item.points} PTS</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Quick Rank Pill + Dropdown Icon Button */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span
                                  className={`text-xs font-black font-mono px-2.5 py-1 rounded-xl inline-block ${
                                    isFirst ? 'bg-[#D7FF00] text-black shadow-xs' : 'bg-zinc-800/80 text-zinc-300'
                                  }`}
                                >
                                  #{item.ranking}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTeamScrimExpand(itemKey);
                                  }}
                                  aria-label={isExpanded ? "Tutup maklumat scrim" : "Buka maklumat scrim"}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    isExpanded
                                      ? 'bg-[#D7FF00] text-black'
                                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                            </div>

                            {/* Dropdown Content - Expanded only on click */}
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-2 space-y-3 bg-zinc-950/50 origin-top animate-dropdown-reveal">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                  <div className="glass-tile p-2 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Eliminations</span>
                                    <span className="font-mono font-bold text-white">{item.kills} Elims</span>
                                  </div>
                                  <div className="glass-tile p-2 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Placement</span>
                                    <span className="font-mono font-bold text-emerald-400">{itemPP} PP</span>
                                  </div>
                                  <div className="glass-tile p-2 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tier</span>
                                    <span className="font-mono font-bold text-[#D7FF00] truncate block">{item.scrimTier || 'Umum'}</span>
                                  </div>
                                  <div className="glass-tile p-2 rounded-xl">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Host</span>
                                    <span className="font-mono font-bold text-zinc-200 truncate block">{item.hostName || 'Admin'}</span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setInspectedScrim(item.scrimData)}
                                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-[#D7FF00] hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Tengok Scoreboard Penuh</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950/40 rounded-2xl">
                      Belum ada rekod untuk kategori ni.
                    </div>
                  )}
                </div>
                </div>
              </div>
            );
          }

          const showAllTeams = isHallOfFameFullView || Boolean(teamSearchQuery.trim());
          const displayedRankedTeams = showAllTeams
            ? rankedTeamsWithStats
            : rankedTeamsWithStats.slice(0, 10);

          // Generate full 360-deg precision tick ring centered at (200, 190) for continuous smooth rotation
          const dialTicks = [];
          for (let deg = 0; deg < 360; deg += 3) {
            const rad = ((deg - 90) * Math.PI) / 180;
            const cx = 200;
            const cy = 190;
            const isCardinal = deg % 90 === 0;
            const isMajor = deg % 15 === 0;
            const rInner = isCardinal ? 146 : isMajor ? 149 : 152;
            const rOuter = isCardinal ? 164 : isMajor ? 162 : 160;
            const x1 = cx + rInner * Math.cos(rad);
            const y1 = cy + rInner * Math.sin(rad);
            const x2 = cx + rOuter * Math.cos(rad);
            const y2 = cy + rOuter * Math.sin(rad);
            const opacity = isCardinal ? 0.92 : isMajor ? 0.56 : 0.26;
            dialTicks.push({ deg, x1, y1, x2, y2, opacity, isCardinal });
          }

          return (
            <div className="max-w-xl md:max-w-full mx-auto space-y-5 sm:space-y-7 pt-1 pb-28 md:pb-12 relative">
              {/* 1. TOP NAVIGATION BAR (Top-level tab: no back chevron) */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Teams
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHallOfFameSearchOpen(prev => !prev)}
                    className={
                      'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
                      (isHallOfFameSearchOpen || teamSearchQuery
                        ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white')
                    }
                    title="Cari pasukan"
                    aria-label="Cari pasukan"
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleHeaderInfo('teams')}
                    className={
                      'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
                      (activeHeaderInfo === 'teams'
                        ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white')
                    }
                    title="Info Team Matrix"
                    aria-label="Info Team Matrix"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Info Card (if toggled) */}
              {activeHeaderInfo === 'teams' && (
                <div className="p-3.5 bg-zinc-900/95 border border-zinc-800 rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 origin-top animate-dropdown-reveal mx-1">
                  <Trophy className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
                  <p className="leading-relaxed flex-1">
                    Check ranking team, rekod WWCD &amp; buat kad Story 9:16.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveHeaderInfo(null)}
                    className="text-zinc-500 hover:text-white p-0.5 rounded transition shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 2. TWO-TIER HORIZONTAL FILTER & EVENT TOGGLE BAR */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 px-1">
                {/* Event Format Toggle Switch (Combinable with Tier Filters: Scrim / Tournament) */}
                <div
                  role="group"
                  aria-label="Toggle Jenis Acara"
                  className="inline-flex items-center gap-1.5 self-start shrink-0"
                >
                  <button
                    type="button"
                    aria-pressed={teamStatsEventType === 'ALL'}
                    onClick={() => setTeamStatsEventType('ALL')}
                    className={
                      'px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ' +
                      (teamStatsEventType === 'ALL'
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200')
                    }
                  >
                    Semua Event
                  </button>
                  {HALL_OF_FAME_EVENT_TOGGLES.map((ev) => {
                    const isEvActive = teamStatsEventType === ev.key;
                    return (
                      <button
                        key={ev.key}
                        type="button"
                        aria-pressed={isEvActive}
                        onClick={() => setTeamStatsEventType(prev => (prev === ev.key ? 'ALL' : ev.key))}
                        className={
                          'px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ' +
                          (isEvActive
                            ? 'bg-zinc-100 text-zinc-950 font-semibold'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200')
                        }
                      >
                        <span>{ev.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tier 1 (Category Pills) + Tier 2 (Conditional SSS Season Dropdown) */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
                  <div
                    role="group"
                    aria-label="Tapis Tier Team Matrix"
                    className="relative z-10 flex items-center gap-2 overflow-x-auto no-scrollbar pr-6 max-w-full py-4 -my-3 px-2 -mx-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {HALL_OF_FAME_FILTERS.map((cat) => {
                      const isActive = teamStatsCategory === cat.key;
                      const isSssFilter = cat.key === 'SSS';
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => handleSelectTeamStatsCategory(cat.key)}
                          className={
                            'px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ' +
                            (isSssFilter
                              ? isActive
                                ? 'sss-filter-pill-active'
                                : 'sss-filter-pill'
                              : isActive
                                ? 'bg-zinc-100 text-zinc-950 font-semibold'
                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200')
                          }
                        >
                          <span className="relative z-10">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tier 2 Conditional Selectors: Separated Season & Stage dropdowns revealed ONLY when "SSS" is active */}
                  {teamStatsCategory === 'SSS' && (
                    <div
                      key="sss-tier2-selector"
                      className="sss-tier2-reveal relative z-20 flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0"
                    >
                      <div className="min-w-0 shrink-0">
                        <label htmlFor="team-matrix-sss-season-select" className="sr-only">
                          Pilih Musim SSS
                        </label>
                        <select
                          id="team-matrix-sss-season-select"
                          name="sssSeason"
                          value={String(sssFilterSelection.season)}
                          onChange={(e) => handleSelectSssSeason(e.target.value)}
                          className="sss-brand-select w-auto max-w-full"
                        >
                          {SSS_SEASON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="min-w-0 shrink-0">
                        <label htmlFor="team-matrix-sss-stage-select" className="sr-only">
                          Pilih Stage SSS
                        </label>
                        <select
                          id="team-matrix-sss-stage-select"
                          name="sssStage"
                          value={sssFilterSelection.stage}
                          onChange={(e) => handleSelectSssStage(e.target.value)}
                          className="sss-brand-select w-auto max-w-full"
                        >
                          {SSS_STAGE_OPTIONS.map((st) => (
                            <option key={st.key} value={st.key}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar (Toggled by top-right Search icon) */}
              {(isHallOfFameSearchOpen || teamSearchQuery) && (
                <div className="relative px-1 origin-top animate-dropdown-reveal">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3" />
                  <input
                    type="search"
                    enterKeyHint="search"
                    placeholder="Cari nama atau tag team..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    className="w-full glass-tile rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white focus:outline-none focus:border-[#D7FF00]/50 transition font-semibold placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {teamSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTeamSearchQuery('')}
                      className="absolute right-4 top-2.5 text-zinc-500 hover:text-white p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* 3. MINIMALIST SEMI-CIRCULAR DIAL + TEAM MATRIX CENTERPIECE (No Floating Icons Around It) */}
              <div className="relative pt-2 pb-3 flex flex-col items-center text-center select-none overflow-hidden">
                <svg
                  viewBox="0 0 400 124"
                  className="w-full max-w-[380px] sm:max-w-[430px] h-auto overflow-hidden pointer-events-none"
                  aria-hidden="true"
                >
                  {/* Stationary 12-o'clock Center Indicator Pointers */}
                  <line
                    x1="200"
                    y1="10"
                    x2="200"
                    y2="21"
                    stroke="#D7FF00"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="200"
                    y1="48"
                    x2="200"
                    y2="59"
                    stroke="#FFFFFF"
                    strokeOpacity="0.85"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Continuously Rotating Chronograph Tick Ring */}
                  <g className="animate-dial-spin">
                    {dialTicks.map((t) => (
                      <line
                        key={t.deg}
                        x1={t.x1}
                        y1={t.y1}
                        x2={t.x2}
                        y2={t.y2}
                        stroke={t.isCardinal ? '#D7FF00' : '#E4E4E7'}
                        strokeOpacity={t.opacity}
                        strokeWidth={t.isCardinal ? '2' : '1.25'}
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                </svg>

                {/* Center Text Inside the Dial Arc (Slow Exclusive Blur Reveal) */}
                <div
                  className="-mt-14 sm:-mt-16 relative z-10 px-4 space-y-2.5 max-w-2xl animate-teams-blur"
                  style={{ '--blur-delay': '140ms' }}
                >
                  <h1 className="text-[clamp(2rem,1.25rem+3.4vw,3.65rem)] font-bold uppercase flex items-center justify-center gap-2.5 sm:gap-3.5">
                    <span className="font-team-matrix tracking-[0.1em] text-white">
                      TEAM
                    </span>
                    <span className="font-jetbrains font-extrabold tracking-[0.06em] text-[#D7FF00]">
                      MATRIX
                    </span>
                  </h1>

                  {teamStatsCategory === 'SSS' && (
                    <p className="text-[10px] sm:text-[11px] font-mono tracking-wide text-zinc-400 -mt-1">
                      Scrim Saja-Saja powered by <span className="text-yellow-300/90 font-semibold">Scrimlabs</span>
                    </p>
                  )}

                  {/* Stats Line: Jumlah Team - Jumlah Scrim - Jumlah Tournament */}
                  <div className="flex items-center justify-center gap-4 sm:gap-5 text-xs sm:text-sm font-mono tabular-nums text-zinc-300">
                    <span>
                      <strong className="text-white font-bold">{totalTeamsCount}</strong> Team
                    </span>
                    <span>
                      <strong className="text-white font-bold">{totalScrimsCount}</strong> Scrim
                    </span>
                    {(teamStatsCategory !== 'SSS' || totalToursCount > 0) && (
                      <span>
                        <strong className="text-white font-bold">{totalToursCount}</strong> Tournament
                      </span>
                    )}
                  </div>

                  {/* Description Paragraph */}
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xs sm:max-w-sm mx-auto pt-0.5 text-pretty">
                    Ranking team, rekod WWCD &amp; kad Story 9:16.
                  </p>
                </div>
              </div>

              {/* 3B. TIER 3 SPOTLIGHT HIERARCHY (Sleek Dark Obsidian Surface, Amber Reserved for #1 & CTA) */}
              {teamStatsCategory === 'ALL' && !teamSearchQuery.trim() && tier3RankedTeams.length > 0 && (
                <div
                  className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3.5 animate-teams-blur relative overflow-hidden"
                  style={{ '--blur-delay': '260ms' }}
                >
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                            Division Amateur
                          </h2>
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono tabular-nums font-bold text-[9px] uppercase tracking-wider">
                            {tier3RankedTeams.length} Team
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">
                          Top team kategori Tier 3
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectTeamStatsCategory('TIER_3')}
                      className="px-3.5 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0 active:scale-95"
                    >
                      <span>Rank Tier 3</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
                    {tier3RankedTeams.slice(0, 3).map((t3Team, idx) => (
                      <button
                        key={`hof_t3_${t3Team.name}`}
                        type="button"
                        onClick={() => openTeamProfile(t3Team.name)}
                        className="w-full text-left rounded-2xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/80 px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition cursor-pointer group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-7 h-7 rounded-xl font-mono tabular-nums font-black text-xs flex items-center justify-center shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                              : idx === 1
                              ? 'bg-zinc-200 text-zinc-950'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-200'
                          }`}>
                            #{idx + 1}
                          </span>

                          {t3Team.logo_url ? (
                            <img
                              src={t3Team.logo_url}
                              alt=""
                              className="w-8 h-8 rounded-xl object-cover bg-zinc-900 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-black text-[11px] flex items-center justify-center shrink-0">
                              {(t3Team.tag || t3Team.name.slice(0, 3)).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-black text-white truncate group-hover:text-[#D7FF00] transition-colors">
                              {t3Team.name}
                            </div>
                            <div className="text-[10px] font-mono tabular-nums text-zinc-400">
                              {t3Team.tier3Kills} Elims • {t3Team.tier3WWCD} WWCD
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="text-sm font-black text-white leading-none">
                            {t3Team.tier3Points}
                          </div>
                          <div className="text-[9px] text-zinc-500 font-bold">
                            T3 PTS
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. TOP PERFORM TEAM CARD (Podium Top 3 + Broadcast List #4–#10 & Beyond) */}
              <div
                className="glass-panel rounded-3xl p-4 sm:p-6 space-y-4 min-h-[420px] animate-teams-blur"
                style={{ '--blur-delay': '360ms' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {teamStatsCategory === 'SSS'
                        ? `Top Perform Team • ${activeSssSummaryLabel}${teamStatsEventType !== 'ALL' ? ` (${HALL_OF_FAME_EVENT_TOGGLES.find(f => f.key === teamStatsEventType)?.label || teamStatsEventType})` : ''}`
                        : teamStatsEventType === 'Tour'
                        ? `Top Perform Team • Tournament${teamStatsCategory !== 'ALL' ? ` (${HALL_OF_FAME_FILTERS.find(f => f.key === teamStatsCategory)?.label || teamStatsCategory})` : ''}`
                        : teamStatsEventType === 'Scrim'
                        ? `Top Perform Team • Scrim${teamStatsCategory !== 'ALL' ? ` (${HALL_OF_FAME_FILTERS.find(f => f.key === teamStatsCategory)?.label || teamStatsCategory})` : ''}`
                        : 'Top Perform Team'}
                    </h2>
                    <span className="text-[11px] text-zinc-400">
                      {teamStatsCategory === 'SSS'
                        ? `${activeSssSummaryLabel} • `
                        : ''}
                      {teamSearchQuery.trim()
                        ? `Jumpa ${displayedRankedTeams.length} team`
                        : showAllTeams
                        ? `Semua ${rankedTeamsWithStats.length} team`
                        : `Top ${Math.min(10, rankedTeamsWithStats.length)} team`}
                    </span>
                  </div>

                  {/* Top-Right View Full Button */}
                  {!teamSearchQuery.trim() && rankedTeamsWithStats.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setIsHallOfFameFullView(prev => !prev)}
                      className={
                        'h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shrink-0 ' +
                        (isHallOfFameFullView
                          ? 'bg-[#D7FF00] text-black shadow-sm'
                          : 'glass-pill glass-tile-hover text-zinc-200')
                      }
                      title={isHallOfFameFullView ? 'Tutup senarai penuh' : 'Lihat senarai penuh semua pasukan'}
                    >
                      <span>{isHallOfFameFullView ? 'Top 10' : 'View Full'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isDataLoading && validTeamList.length === 0 ? (
                  <div className="space-y-2.5 py-2" aria-busy="true" aria-label="Memuatkan ranking pasukan">
                    <div className="flex items-center justify-center gap-2 pb-2">
                      <progress aria-label="Memuatkan Team Matrix" className="loading-spinner" style={{ '--size': '16px', '--thickness': '2px' }} />
                      <span className="text-xs font-mono text-zinc-300">Loading ranking team...</span>
                    </div>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="glass-tile rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-4 rounded bg-white/[0.08]" />
                          <div className="w-12 h-5 rounded bg-white/[0.07]" />
                          <div className="w-32 h-4 rounded bg-white/[0.08]" />
                        </div>
                        <div className="w-14 h-4 rounded bg-white/[0.07]" />
                      </div>
                    ))}
                  </div>
                ) : validTeamList.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Users className="w-7 h-7 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Belum ada rekod match. Markah yang dah save akan masuk sini.
                    </p>
                  </div>
                ) : displayedRankedTeams.length === 0 ? (() => {
                  const tierLabel = teamStatsCategory === 'ALL'
                    ? ''
                    : teamStatsCategory === 'SSS'
                    ? activeSssSummaryLabel
                    : (HALL_OF_FAME_FILTERS.find(f => f.key === teamStatsCategory)?.label || teamStatsCategory);
                  const eventLabel = teamStatsEventType === 'ALL'
                    ? ''
                    : (HALL_OF_FAME_EVENT_TOGGLES.find(f => f.key === teamStatsEventType)?.label || teamStatsEventType);
                  const activeFilterLabel = [eventLabel, tierLabel].filter(Boolean).join(' • ') || 'Semua';
                  return (
                    <div
                      key={`teams_empty_${teamStatsCategory}_${teamStatsEventType}_${activeSssOptionId}`}
                      className="min-h-[320px] flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 glass-tile rounded-2xl animate-teams-scope"
                    >
                      <div className="w-11 h-11 rounded-2xl glass-pill text-zinc-400 flex items-center justify-center mx-auto">
                        {teamSearchQuery.trim() ? <Search className="w-5 h-5" /> : <Trophy className="w-5 h-5 text-[#D7FF00]/80" />}
                      </div>
                      <div className="space-y-1 max-w-xs mx-auto">
                        <p className="text-xs sm:text-sm font-bold text-white">
                          {teamSearchQuery.trim()
                            ? `Tak jumpa team "${teamSearchQuery.trim()}"`
                            : `Belum ada rekod ${activeFilterLabel}`}
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {teamSearchQuery.trim()
                            ? 'Cuba cari nama atau tag team lain.'
                            : `Ranking akan keluar lepas rekod ${activeFilterLabel} disimpan.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (teamSearchQuery.trim()) {
                            setTeamSearchQuery('');
                          } else {
                            handleSelectTeamStatsCategory('ALL');
                            setTeamStatsEventType('ALL');
                          }
                        }}
                        className="px-4 py-1.5 rounded-full glass-pill glass-tile-hover text-xs font-bold text-[#D7FF00] transition cursor-pointer"
                      >
                        {teamSearchQuery.trim() ? 'Reset Carian' : 'Lihat Semua Data'}
                      </button>
                    </div>
                  );
                })() : (() => {
                  const isSearchingTeams = Boolean(teamSearchQuery.trim());
                  const top3Teams = isSearchingTeams ? [] : displayedRankedTeams.slice(0, 3);
                  const listTeams = isSearchingTeams ? displayedRankedTeams : displayedRankedTeams.slice(3);

                  // Arrange podium slots visually: [#2 Left, #1 Center Elevated, #3 Right]
                  const podiumSlots =
                    top3Teams.length === 3
                      ? [
                          { team: top3Teams[1], slotRank: 2 },
                          { team: top3Teams[0], slotRank: 1 },
                          { team: top3Teams[2], slotRank: 3 }
                        ]
                      : top3Teams.length === 2
                      ? [
                          { team: top3Teams[1], slotRank: 2 },
                          { team: top3Teams[0], slotRank: 1 }
                        ]
                      : top3Teams.map((t, i) => ({ team: t, slotRank: i + 1 }));

                  return (
                    <div
                      key={`teams_scope_${teamStatsCategory}_${teamStatsEventType}_${activeSssOptionId}`}
                      className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto min-h-[320px] space-y-2.5 sm:space-y-3 animate-teams-scope"
                    >
                      {/* TOP 3 PODIUM SHOWCASE */}
                      {podiumSlots.length > 0 && (
                        <div
                          className={`grid items-end gap-2 sm:gap-3.5 ${
                            podiumSlots.length === 1
                              ? 'grid-cols-1 max-w-xs mx-auto'
                              : podiumSlots.length === 2
                              ? 'grid-cols-2 max-w-lg mx-auto'
                              : 'grid-cols-3'
                          }`}
                        >
                          {podiumSlots.map(({ team, slotRank }) => {
                            const rankNum = team.globalRank || slotRank;
                            const isSelected = currentSelectedTeam === team.name;
                            const isFirst = slotRank === 1;
                            const isSecond = slotRank === 2;
                            const podiumDelay = isFirst ? '160ms' : isSecond ? '260ms' : '350ms';

                            const podiumSurfaceClass = isFirst
                              ? 'glass-lime'
                              : isSecond
                              ? 'glass-silver'
                              : 'glass-amber';

                            const rankPillClass = isFirst
                              ? 'bg-[#D7FF00] text-black'
                              : isSecond
                              ? 'bg-zinc-200 text-black'
                              : 'bg-amber-400 text-black';

                            const ptsColorClass = isFirst
                              ? 'text-[#D7FF00]'
                              : isSecond
                              ? 'text-zinc-200'
                              : 'text-amber-300';

                            const fallbackPedestalBg = isFirst
                              ? 'bg-[#D7FF00] text-black'
                              : isSecond
                              ? 'bg-zinc-200 text-black'
                              : 'bg-amber-400 text-black';

                            return (
                              <div
                                key={team.name}
                                role="button"
                                tabIndex={0}
                                onClick={() => openTeamProfile(team.name)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openTeamProfile(team.name);
                                  }
                                }}
                                style={{ '--blur-delay': podiumDelay }}
                                className={`rounded-2xl sm:rounded-3xl overflow-hidden transition-[transform,filter,background-color] duration-200 hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer group flex flex-col justify-between select-none px-2 sm:px-3.5 animate-teams-blur ${
                                  isFirst
                                    ? 'pt-2.5 pb-3 sm:pt-4 sm:pb-4 min-h-[186px] sm:min-h-[252px]'
                                    : 'pt-2 pb-2.5 sm:pt-3.5 sm:pb-3.5 min-h-[168px] sm:min-h-[228px]'
                                } ${podiumSurfaceClass} ${
                                  isSelected ? 'brightness-110' : ''
                                }`}
                              >
                                {/* Top Row: Rank Badge + Optional T3 Rank */}
                                <div className="flex items-center justify-between gap-1 w-full">
                                  <span
                                    className={`inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-black text-[10px] sm:text-xs leading-none ${rankPillClass}`}
                                  >
                                    #{rankNum}
                                  </span>
                                  {teamStatsCategory === 'ALL' && tier3RankByTeam.has(team.name) ? (
                                    <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-mono font-bold text-[9px] sm:text-[10px] leading-none shrink-0">
                                      T3 #{tier3RankByTeam.get(team.name).tier3Rank}
                                    </span>
                                  ) : (
                                    <Eye className="hidden sm:block w-3.5 h-3.5 text-white/35 group-hover:text-white/80 transition-colors" />
                                  )}
                                </div>

                                {/* Centered Logo */}
                                <div className="flex items-center justify-center my-2 sm:my-3">
                                  {team.logo_url ? (
                                    <div
                                      className={`rounded-xl sm:rounded-2xl bg-black/45 border border-white/10 p-1.5 sm:p-2 shadow-lg group-hover:scale-105 transition-transform duration-300 flex items-center justify-center ${
                                        isFirst ? 'w-14 h-14 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-16 sm:h-16'
                                      }`}
                                    >
                                      <img
                                        src={team.logo_url}
                                        alt={team.name}
                                        className="w-full h-full object-contain rounded-lg sm:rounded-xl"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`rounded-xl sm:rounded-2xl flex items-center justify-center font-black shadow-lg group-hover:scale-105 transition-transform duration-300 ${
                                        isFirst ? 'w-14 h-14 sm:w-20 sm:h-20' : 'w-12 h-12 sm:w-16 sm:h-16'
                                      } ${fallbackPedestalBg}`}
                                    >
                                      <span className="text-xs sm:text-lg tracking-tight">
                                        {team.tag || team.name.slice(0, 3).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom Identity & Points Summary */}
                                <div className="text-center space-y-1 w-full">
                                  <div className="text-[11px] sm:text-sm font-black uppercase tracking-tight text-white leading-tight line-clamp-2 min-h-[2.2em] flex items-center justify-center">
                                    {team.name}
                                  </div>

                                  <div className="flex items-baseline justify-center gap-1 font-mono font-black tabular-nums">
                                    <span className={`leading-none text-white ${isFirst ? 'text-base sm:text-2xl' : 'text-sm sm:text-xl'}`}>
                                      {team.scopedPoints}
                                    </span>
                                    <span className={`text-[9px] sm:text-[11px] font-bold ${ptsColorClass}`}>
                                      PTS
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-mono text-zinc-300/90 tabular-nums tracking-tight whitespace-nowrap pt-0.5">
                                    <span className="sm:hidden">{team.scopedKills}E</span>
                                    <span className="hidden sm:inline">{team.scopedKills} Elims</span>
                                    <span className="text-white/25">·</span>
                                    <span>{team.scopedWWCD}W</span>
                                    <span className="text-white/25">·</span>
                                    <span>{team.scopedMatches}M</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* RANK #4 TO #10+ BROADCAST STACKED DARK LIST */}
                      {listTeams.length > 0 && (
                        <div className="space-y-1.5 pt-0.5">
                          {listTeams.map((team, idx) => {
                            const rankNum = team.globalRank || (isSearchingTeams ? idx + 1 : idx + 4);
                            const isSelected = currentSelectedTeam === team.name;
                            const tagText = (team.tag || team.name.slice(0, 3)).toUpperCase();

                            return (
                              <div
                                key={team.name}
                                role="button"
                                tabIndex={0}
                                onClick={() => openTeamProfile(team.name)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openTeamProfile(team.name);
                                  }
                                }}
                                style={{ '--blur-delay': `${380 + Math.min(idx, 6) * 60}ms` }}
                                className={`px-3 sm:px-4 py-2.5 rounded-xl transition-[transform,background-color] duration-200 active:scale-[0.985] flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer group animate-teams-blur select-none ${
                                  isSelected
                                    ? 'bg-white/[0.11] border border-[#D7FF00]/45 shadow-[0_0_20px_rgba(215,255,0,0.08)]'
                                    : 'glass-tile glass-tile-hover'
                                }`}
                              >
                                {/* Left: Rank # + Avatar/Tag + Full Readable Team Identity */}
                                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                                  <span
                                    className={`w-6 sm:w-7 text-center font-mono tabular-nums font-black text-xs sm:text-sm shrink-0 ${
                                      rankNum === 1
                                        ? 'text-[#D7FF00]'
                                        : rankNum === 2
                                        ? 'text-zinc-200'
                                        : rankNum === 3
                                        ? 'text-amber-400'
                                        : 'text-zinc-400'
                                    }`}
                                  >
                                    {rankNum}
                                  </span>

                                  {/* Mobile: Show Logo (if available) or Tag badge in left slot so team name gets full width */}
                                  {team.logo_url ? (
                                    <img
                                      src={team.logo_url}
                                      alt=""
                                      className="sm:hidden w-8 h-8 rounded-lg object-contain bg-zinc-950 border border-white/10 p-0.5 shrink-0"
                                    />
                                  ) : (
                                    <span className="sm:hidden px-1.5 py-1 min-w-[38px] text-center rounded-lg font-mono font-black text-[10px] uppercase shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-200">
                                      {tagText}
                                    </span>
                                  )}

                                  {/* Desktop Tag Pill */}
                                  <span className="hidden sm:inline-block px-2 py-0.5 min-w-[54px] text-center rounded-md font-mono font-black text-xs uppercase shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-200">
                                    {tagText}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[13px] sm:text-sm font-black uppercase tracking-tight text-white leading-tight break-words sm:truncate">
                                        {team.name}
                                      </span>

                                      {teamStatsCategory === 'ALL' && tier3RankByTeam.has(team.name) && (
                                        <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md font-mono tabular-nums font-black text-[10px] bg-amber-400/15 text-amber-300 shrink-0">
                                          T3 #{tier3RankByTeam.get(team.name).tier3Rank}
                                        </span>
                                      )}
                                    </div>

                                    {/* Mobile sub-row: Tag + Tier 3 badge + Stats without cramping team name */}
                                    <div className="flex sm:hidden flex-wrap items-center gap-1.5 mt-1">
                                      {team.logo_url && (
                                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono font-black text-[9px] uppercase text-zinc-300 leading-none">
                                          {tagText}
                                        </span>
                                      )}
                                      {teamStatsCategory === 'ALL' && tier3RankByTeam.has(team.name) && (
                                        <span className="px-1.5 py-0.5 rounded font-mono tabular-nums font-black text-[9px] bg-amber-400/15 text-amber-300 leading-none">
                                          T3 #{tier3RankByTeam.get(team.name).tier3Rank}
                                        </span>
                                      )}
                                      <span className="font-mono tabular-nums text-[10px] text-zinc-500 leading-none">
                                        {team.scopedKills} Elims · {team.scopedWWCD}W · {team.scopedMatches}M
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Desktop Mini Logo + Stats + Points + Eye View Button */}
                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                  <span className="hidden sm:inline font-mono tabular-nums text-[11px] text-zinc-500">
                                    {team.scopedKills} Elims • {team.scopedWWCD}W • {team.scopedMatches}M
                                  </span>

                                  {team.logo_url && (
                                    <img
                                      src={team.logo_url}
                                      alt=""
                                      className="hidden sm:block w-7 h-7 rounded-lg object-contain bg-zinc-950 p-0.5 shrink-0"
                                    />
                                  )}

                                  <div className="flex items-baseline gap-0.5 font-mono tabular-nums font-black min-w-[48px] sm:min-w-[62px] justify-end">
                                    <span className="text-sm sm:text-base text-white">
                                      {team.scopedPoints}
                                    </span>
                                    <span className="text-[9px] text-zinc-400 font-bold">
                                      PTS
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTeamProfile(team.name);
                                    }}
                                    className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-[#D7FF00] transition shrink-0 cursor-pointer"
                                    title={`Lihat maklumat ${team.name}`}
                                    aria-label={`Lihat maklumat ${team.name}`}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Bottom Toggle if there are more than 10 teams */}
                {!teamSearchQuery.trim() && rankedTeamsWithStats.length > 10 && (
                  <button
                    type="button"
                    onClick={() => setIsHallOfFameFullView(prev => !prev)}
                    className="w-full py-2.5 rounded-2xl glass-tile glass-tile-hover text-xs font-bold text-zinc-200 hover:text-[#D7FF00] transition cursor-pointer"
                  >
                    {isHallOfFameFullView
                      ? 'Tunjuk Top 10 Sahaja ↑'
                      : `Tengok Semua ${rankedTeamsWithStats.length} Team ↓`}
                  </button>
                )}
              </div>

              {/* 5. DATA SOURCE DISCLAIMER FOOTNOTE */}
              <div className="pt-1 pb-2 px-3 text-center space-y-1">
                {teamStatsCategory === 'SSS' ? (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {sssFilterSelection.season === 'ALL' && sssFilterSelection.stage === 'GRAND_FINAL' ? (
                      <>
                        Nota: Rekod <strong className="text-[#D7FF00] font-semibold">SSS</strong> dikumpul dari <strong className="text-zinc-200 font-semibold">Season 4 (S4-S12)</strong>.
                      </>
                    ) : (
                      <>
                        Nota: Statistik untuk <strong className="text-[#D7FF00] font-semibold">{activeSssSummaryLabel}</strong>.
                      </>
                    )}
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Nota: Data scrim mula dikumpul sejak <strong className="text-zinc-300 font-semibold">November 2026</strong>.
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400/90 tracking-wide leading-relaxed">
                      MEC SCRIMS • BUNNYKUN SCRIMS • BEN ESPORTS SCRIMS • CT SCRIMS • KxLatte SCRIMS
                    </p>
                  </>
                )}
              </div>

            </div>
          );
        })()}

        {/* VIEW 2: LIVE LEADERBOARD & REKOD KEJOHANAN */}
        {(activeTab === 'history' || activeTab === 'leaderboard') && (
          <div className="max-w-xl md:max-w-full mx-auto space-y-5 sm:space-y-6 pt-1 pb-28 md:pb-12">
            
            {/* 1. TOP NAVIGATION BAR (Top-level tab: no back chevron) */}
            <div className="flex items-center justify-between px-1">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                Rekod
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHistorySearchOpen(prev => !prev)}
                  className={
                    'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
                    (isHistorySearchOpen || searchScrimQuery
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white')
                  }
                  title="Cari sesi scrim atau kejohanan"
                  aria-label="Cari sesi scrim atau kejohanan"
                >
                  <Search className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => toggleHeaderInfo('history')}
                  className={
                    'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
                    (activeHeaderInfo === 'history'
                      ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white')
                  }
                  title="Info Rekod & Arkib"
                  aria-label="Info Rekod & Arkib"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expandable Info Card (if toggled) */}
            {activeHeaderInfo === 'history' && (
              <div className="p-3.5 bg-zinc-900/95 border border-zinc-800 rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 origin-top animate-dropdown-reveal shadow-lg mx-1">
                <Flame className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
                <p className="leading-relaxed flex-1">
                  Arkib rekod scrim &amp; tournament, status sesi, dan export poster HD.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveHeaderInfo(null)}
                  className="text-zinc-500 hover:text-white p-0.5 rounded transition shrink-0"
                  title="Tutup info"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 2. HEADING + FILTER PILLS BAR */}
            <div className="space-y-3.5 px-1">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white text-balance">
                  Rekod Kejohanan &amp; Scrim
                </h1>

                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => navigateToTab('admin')}
                    className="px-4 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-zinc-950 font-black rounded-full text-xs transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(215,255,0,0.22)] active:scale-95 cursor-pointer shrink-0"
                    title="Cipta atau urus sesi kejohanan baru di Portal Host"
                  >
                    <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
                    <span>Sesi Baru</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 shrink-0">
                    <Eye className="w-3.5 h-3.5 text-[#D7FF00]" />
                    <span>Paparan Umum</span>
                  </span>
                )}
              </div>

              {/* High-Contrast Neutral Filter Pills Row */}
              <div className="relative flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  {
                    key: 'ALL',
                    label: 'Semua',
                    isActive: historyStatusFilter === 'ALL' && leaderboardEventTypeFilter === 'All',
                    onClick: () => {
                      setHistoryStatusFilter('ALL');
                      setLeaderboardEventTypeFilter('All');
                    }
                  },
                  {
                    key: 'Completed',
                    label: 'Completed',
                    isActive: historyStatusFilter === 'Completed',
                    onClick: () => setHistoryStatusFilter(prev => (prev === 'Completed' ? 'ALL' : 'Completed'))
                  },
                  {
                    key: 'Pending',
                    label: 'Pending',
                    isActive: historyStatusFilter === 'Pending',
                    onClick: () => setHistoryStatusFilter(prev => (prev === 'Pending' ? 'ALL' : 'Pending'))
                  },
                  {
                    key: 'Scrim',
                    label: 'Scrim',
                    isActive: leaderboardEventTypeFilter === 'Scrim',
                    onClick: () => setLeaderboardEventTypeFilter(prev => (prev === 'Scrim' ? 'All' : 'Scrim'))
                  },
                  {
                    key: 'Tour',
                    label: 'Tournament',
                    isActive: leaderboardEventTypeFilter === 'Tour',
                    onClick: () => setLeaderboardEventTypeFilter(prev => (prev === 'Tour' ? 'All' : 'Tour'))
                  }
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={pill.onClick}
                    className={
                      'px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 cursor-pointer ' +
                      (pill.isActive
                        ? 'bg-zinc-100 text-zinc-950 font-semibold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200')
                    }
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search Bar & Tier Filter Row (Toggled via Top-Right Search Icon or Active Query) */}
              {(isHistorySearchOpen || searchScrimQuery || tierFilter !== 'All') && (
                <div className="flex items-center gap-2 origin-top animate-dropdown-reveal">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="search"
                      enterKeyHint="search"
                      placeholder="Cari nama scrim, host atau tier..."
                      value={searchScrimQuery}
                      onChange={(e) => setSearchScrimQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full glass-tile rounded-2xl pl-10 pr-8 py-2.5 text-xs text-white focus:outline-none focus:border-[#D7FF00]/50 font-semibold placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
                    />
                    {searchScrimQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchScrimQuery('')}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    aria-label="Tapis mengikut Tier"
                    className="glass-tile text-zinc-100 text-xs font-bold rounded-2xl px-3.5 py-2.5 focus:outline-none focus:border-[#D7FF00]/50 cursor-pointer shrink-0 [color-scheme:dark]"
                  >
                    <option value="All">Semua Tier</option>
                    <option value="Tier 1 (Pro)">Tier 1 (Pro)</option>
                    <option value="Tier 2 (Semi-Pro)">Tier 2 (Semi-Pro)</option>
                    <option value="Tier 3 (Amateur)">Tier 3 (Amateur)</option>
                    <option value="Open Community">Open</option>
                  </select>
                </div>
              )}
            </div>

            {/* 3. SESSION CARDS LIST */}
            {isDataLoading && filteredScrims.length === 0 ? (
              <div className="space-y-4 px-1" aria-busy="true" aria-label="Memuatkan rekod sesi">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                  <progress aria-label="Memuatkan arkib sesi" className="loading-spinner" style={{ '--size': '16px', '--thickness': '2px' }} />
                  <span>Loading rekod...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel rounded-3xl p-4 flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.08] shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-36 rounded-full bg-white/[0.08]" />
                        <div className="h-3 w-24 rounded-full bg-white/[0.05]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredScrims.length === 0 ? (
              <div
                key={`rekod_empty_${historyStatusFilter}_${leaderboardEventTypeFilter}_${tierFilter}`}
                className="min-h-[340px] flex flex-col items-center justify-center my-4 py-14 px-6 text-center bg-zinc-900/90 border border-zinc-800 rounded-3xl space-y-3.5 mx-1 animate-filter-reveal"
              >
                <Clock className="w-10 h-10 mx-auto opacity-30 text-zinc-500" />
                <h3 className="font-black text-white text-base">Tiada Rekod Lagi</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  {currentUser
                    ? 'Tak ada rekod untuk filter ni. Boleh buat sesi baru kat Portal Host.'
                    : 'Tak ada rekod untuk filter ni buat masa ni.'}
                </p>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => navigateToTab('admin')}
                    className="px-4 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-zinc-950 font-black rounded-full text-xs transition shadow-[0_0_15px_rgba(215,255,0,0.18)] cursor-pointer"
                  >
                    Buka Portal Host →
                  </button>
                )}
              </div>
            ) : (
              <div
                key={`rekod_list_${historyStatusFilter}_${leaderboardEventTypeFilter}_${tierFilter}`}
                className="min-h-[340px] content-start grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 px-1 animate-filter-reveal"
              >
                {filteredScrims.map((s, idx) => {
                  const isFinished = Boolean(s.is_finished);

                  return (
                    <div
                      key={s.id}
                      onClick={() => setInspectedScrim(s)}
                      style={{ animationDelay: `${80 + Math.min(idx, 8) * 60}ms` }}
                      className="glass-panel glass-panel-hover rounded-3xl p-3.5 sm:p-4 lg:p-5 transition-all cursor-pointer group active:scale-[0.99] flex items-center justify-between gap-3 animate-stagger-card"
                    >
                      {/* Left: Scrim Logo / Badge + Info (Nama Scrim, Status, Date) */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {s.logo_url ? (
                          <img
                            src={s.logo_url}
                            alt=""
                            className="w-12 h-12 rounded-2xl object-cover bg-zinc-900 shrink-0 shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-[#D7FF00] font-black flex items-center justify-center shrink-0 shadow-md">
                            {s.event_type === 'Tour' ? (
                              <Trophy className="w-5 h-5 text-[#D7FF00]" />
                            ) : (
                              <Flame className="w-5 h-5 text-[#D7FF00]" />
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          {/* 1. Nama Scrim (Full title, clear and unobstructed) */}
                          <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#D7FF00] transition leading-snug line-clamp-2">
                            {s.title}
                          </h3>

                          {/* 2 & 3. Status & Date */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {/* Status */}
                            {isFinished ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#D7FF00]/15 text-[#D7FF00] shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF00]" />
                                <span>Completed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-300 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>Pending</span>
                              </span>
                            )}

                            {/* Date */}
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-400 font-mono shrink-0">
                              <Clock className="w-3 h-3 text-zinc-500" />
                              <span>{s.date || 'Tiada Tarikh'}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Edit (for Hosts) & Enter Indicator */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isAuthorizedAdmin(s) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditScrimModal(s);
                            }}
                            aria-label={`Ubah tarikh dan info ${s.title}`}
                            title="Ubah tarikh & maklumat sesi"
                            className="w-8 h-8 rounded-full bg-zinc-900/90 hover:bg-[#D7FF00] text-zinc-400 hover:text-black flex items-center justify-center transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D7FF00]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="w-8 h-8 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-400 group-hover:text-[#D7FF00] group-hover:bg-zinc-800 transition shrink-0">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: HOST DIRECTORY */}
        {activeTab === 'hosts' && (
          <div className="space-y-4">
            
            <div className="glass-panel rounded-3xl p-4 sm:p-5 space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#D7FF00]"/>
                  <span>Direktori Penganjur</span>
                </h2>
                <p className="text-xs text-zinc-400">Senarai host &amp; penganjur berdaftar.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3"/>
                <input
                  type="search"
                  enterKeyHint="search"
                  placeholder="Cari nama host..."
                  value={searchHostQuery}
                  onChange={(e) => setSearchHostQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className="w-full glass-tile rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D7FF00]/50 placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizersList.map((host, idx) => (
                <div key={idx} className="glass-panel glass-panel-hover rounded-3xl p-5 space-y-3 flex flex-col justify-between transition">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {host.avatar_url ? (
                          <img 
                            src={host.avatar_url} 
                            alt={host.name} 
                            className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-[#D7FF00] text-black font-black flex items-center justify-center text-base shadow-sm">
                            {host.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <h3 className="font-black text-base text-white">{host.name}</h3>
                          <span className="text-[10px] bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/25 px-2 py-0.5 rounded-full font-mono font-bold">
                            {host.scrims.length} Sesi
                          </span>
                        </div>
                      </div>

                      {host.contact && (
                        <a
                          href={host.contact.startsWith('http') 
                            ? host.contact 
                            : (host.contact.replace(/[^0-9]/g, '').length >= 9
                              ? 'https://wa.me/' + host.contact.replace(/[^0-9]/g, '')
                              : 'https://t.me/' + host.contact.replace('@', ''))
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs flex items-center gap-1 shadow-[0_0_15px_rgba(215, 255, 0,0.18)] active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5"/>
                          <span>Mesej</span>
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl text-pretty">
                      {host.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Sesi Kejohanan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {host.scrims.slice(0, 4).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setInspectedScrim(s)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-950/60 border border-white/10 text-[11px] font-semibold text-zinc-200 hover:border-[#D7FF00]/40 hover:text-white flex items-center gap-1 transition"
                        >
                          <span>{s.title}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">({s.event_type || 'Scrim'})</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400"/>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 4: SHOWCASE */}
        {activeTab === 'showcase' && (
          <div className="space-y-4">
            
            <div className="glass-panel rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D7FF00]"/>
                  <span>Showcase Komuniti</span>
                </h2>
                <p className="text-[11px] text-zinc-400">Klip &amp; highlight komuniti.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setShowcaseFilter('all')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'all' ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-400 hover:text-white')}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('achievement')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'achievement' ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-400 hover:text-white')}
                  >
                    Kejohanan
                  </button>
                  <button
                    onClick={() => setShowcaseFilter('clip')}
                    className={'px-2.5 py-1 rounded-lg font-bold ' + (showcaseFilter === 'clip' ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-400 hover:text-white')}
                  >
                    Klip
                  </button>
                </div>

                {currentUser && (
                  <button
                    onClick={() => setIsShowcaseModalOpen(true)}
                    className="px-3 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(215, 255, 0,0.18)] transition active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-black"/>
                    <span>Siar Klip</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => {
                const isMyPost = currentUser && (post.created_by === currentUser.id || post.author === currentUser.email?.split('@')[0]);

                return (
                  <div key={post.id} className="glass-panel rounded-3xl overflow-hidden flex flex-col justify-between">
                    <div className="relative bg-black aspect-video overflow-hidden flex items-center justify-center">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" />
                      )}

                      <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#D7FF00] text-black">
                          {post.rank || 'Featured'}
                        </span>
                        {post.platform && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-950/90 text-white border border-white/10 flex items-center gap-1">
                            {post.platform === 'tiktok' ? <TikTokIcon className="w-2.5 h-2.5"/> : post.platform === 'instagram' ? <InstagramIcon className="w-2.5 h-2.5"/> : <LinkIcon className="w-2.5 h-2.5"/>}
                            <span>{post.platform}</span>
                          </span>
                        )}
                      </div>

                      {isMyPost && (
                        <button
                          onClick={() => handleDeletePost(post.id, post.created_by)}
                          className="absolute top-3 right-3 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition"
                          title="Delete My Post"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200">[{post.team_tag}] {post.author}</span>
                        <span className="text-[10px] text-zinc-400">{post.tournament}</span>
                      </div>

                      <h3 className="font-bold text-sm text-white leading-snug">{post.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{post.caption}</p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setInspectedPost(post)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D7FF00]"/>
                          <span>Info</span>
                        </button>

                        {post.external_url && (
                          <a
                            href={post.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] text-black text-xs font-black transition flex items-center gap-1 shadow-[0_0_15px_rgba(215, 255, 0,0.18)] active:scale-95"
                          >
                            <span>Pautan</span>
                            <ExternalLink className="w-3 h-3"/>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* VIEW 5: ABOUT & USER GUIDE */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            
            {/* Hero Card */}
            <div className="glass-panel text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="max-w-2xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#D7FF00]/10 border border-[#D7FF00]/30 text-[#D7FF00] px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Swords className="w-3.5 h-3.5"/>
                  Esports Tournament Engine
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  SCRIM HUB <span className="text-[#D7FF00]">by ry.khor</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Web app untuk host scrim, penganjur tournament &amp; squad PUBG Mobile. Kira markah PMGC, susun ranking, check rekod team &amp; export poster terus dari browser.
                </p>
              </div>
            </div>

            {/* SECTION: STEP-BY-STEP PLATFORM USER GUIDE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#D7FF00]"/>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">Panduan Guna SCRIM HUB</h2>
                  <p className="text-xs text-zinc-400">Cara guna Quick Scorer, Host Panel, Leaderboard &amp; rekod team.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* GUIDE 1: HOW ADMIN STARTS A SCRIM OR TOURNAMENT */}
                <div className="glass-panel rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Lock className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">1. Cara Host Mula Scrim / Tour</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">SETUP SESI &amp; MATCH</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-white block">Log Masuk Akaun Host</strong>
                        Buka tab <strong>Host</strong> dan log masuk akaun anda.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-white block">Pilih Format &amp; Isi Info</strong>
                        Pilih <span className="bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/30 px-1.5 py-0.5 rounded font-bold">Scrim</span> atau <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-bold">Tournament</span>. Isi tajuk, nama host, tier, contact &amp; upload logo event kalau ada.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-white block">Set Slot Team (2-24 Team)</strong>
                        Guna butang <strong>+</strong> / <strong>-</strong> kat Slot untuk adjust jumlah team, atau guna <strong>Import WA</strong> untuk paste terus dari WhatsApp.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">4</span>
                      <div>
                        <strong className="text-white block">Isi Markah &amp; Map</strong>
                        Pilih match &amp; map (Erangel, Miramar, dll), kemudian pilih placement dan masuk jumlah Elims.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">5</span>
                      <div>
                        <strong className="text-white block">Save &amp; Lock Keputusan</strong>
                        Tekan <strong>Save</strong> untuk simpan ke Cloud. Bila semua match habis, guna menu <strong>⋮</strong> untuk lock keputusan.
                      </div>
                    </div>
                  </div>
                </div>

                {/* GUIDE 2: COMPETITIVE POINT SYSTEM */}
                <div className="glass-panel rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Crosshair className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">2. Sistem Kiraan PMGC</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">STANDARD 10-POINT PMGC</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sistem ikut format rasmi PMGC 10-point. Placement &amp; elimination points dikira terus setiap pusingan:
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">1st Place (WWCD)</span>
                      <span className="font-black text-[#D7FF00]">10 PTS</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">2nd Place</span>
                      <span className="font-black text-white">6 PTS</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">3rd Place</span>
                      <span className="font-black text-white">5 PTS</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">#4 Place</span>
                      <span className="font-black text-white">4 PTS</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">#5 Place</span>
                      <span className="font-black text-white">3 PTS</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">#6 Place</span>
                      <span className="font-black text-white">2 PTS</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">#7 - #8 Place</span>
                      <span className="font-black text-white">1 PT</span>
                    </div>
                    <div className="p-2 rounded-xl bg-zinc-950/60 flex justify-between items-center">
                      <span className="text-zinc-300 font-bold">#9 - #24 Place</span>
                      <span className="font-black text-zinc-500">0 PTS</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#D7FF00]/10 border border-[#D7FF00]/20 text-[11px] text-[#D7FF00] font-bold flex items-center justify-between">
                    <span>Elimination Points:</span>
                    <span className="font-mono font-black">1 Elim = 1 Point</span>
                  </div>
                </div>

                {/* GUIDE 3: LIVE LEADERBOARD & INSTANT POSTER GENERATOR */}
                <div className="glass-panel rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Trophy className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">3. Live Leaderboard &amp; Poster PNG</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">EXPORT TERUS KE WA / IG</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                    <p>
                      <strong>Leaderboard</strong> susun ranking ikut Total Points, Placement Points, Elims &amp; WWCD.
                    </p>

                    <div className="p-3 glass-tile rounded-2xl space-y-1.5">
                      <span className="text-white font-black block flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Poster Standings HD (Sehingga 24 Team)
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        Tekan <strong>Export PNG</strong> untuk download poster siap logo event, badge WWCD &amp; table markah penuh.
                      </p>
                    </div>

                    <div className="p-2.5 glass-tile rounded-xl text-[11px] flex items-center justify-between">
                      <span className="font-bold text-zinc-200">Salin Teks:</span>
                      <span className="text-zinc-400">Copy table standings terus untuk WhatsApp &amp; Discord</span>
                    </div>
                  </div>
                </div>

                {/* GUIDE 4: TEAM STATS & CONTENT SHOWCASE */}
                <div className="glass-panel rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Sparkles className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">4. Statistik Team, Story 9:16 &amp; Content</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">TEAM MATRIX &amp; TIKTOK LINK</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                    <div className="p-3 glass-tile rounded-2xl space-y-1">
                      <strong className="text-white block flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Filter Rekod Team
                      </strong>
                      <p className="text-[11px] text-zinc-400">
                        Tap mana-mana team dalam Team Matrix untuk filter ikut <strong>Scrim</strong>, <strong>Tournament</strong>, atau <strong>Tier</strong>.
                      </p>
                    </div>

                    <div className="p-3 glass-tile rounded-2xl space-y-1">
                      <strong className="text-white block flex items-center gap-1.5">
                        <Share className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Kad IG Story 9:16
                      </strong>
                      <p className="text-[11px] text-zinc-400">
                        Tekan <strong>Story 9:16</strong> kat profile team untuk export kad statistik siap dengan graf &amp; total points.
                      </p>
                    </div>

                    <div className="p-3 glass-tile rounded-2xl space-y-1">
                      <strong className="text-white block flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Showcase Content
                      </strong>
                      <p className="text-[11px] text-zinc-400">
                        Post poster match atau link TikTok &amp; Instagram kat bahagian Content.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Platform Credits & Technical Info */}
            <div className="glass-panel rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                <div>
                  <h3 className="font-black text-sm text-white">Credits &amp; Info Teknikal</h3>
                  <p className="text-xs text-zinc-400">Info build &amp; developer.</p>
                </div>
                <span className="text-[10px] font-mono glass-pill text-zinc-300 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto">
                  v2.7.0
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 glass-tile rounded-2xl space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Dibina Oleh</span>
                    <span className="font-black text-white text-sm block">ry.khor (RYAN.)</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Frontend developer &amp; creator platform esports.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <a
                      href="https://rykhor.my"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[#D7FF00] font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition border border-white/10"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#D7FF00]" />
                      <span>Visit Portfolio</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>

                    <a
                      href="https://instagram.com/ry.khor"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#BE185D] hover:bg-[#9D174D] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 text-white/70" />
                    </a>
                  </div>
                </div>

                <div className="p-4 glass-tile rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Technology Stack</span>
                  <span className="font-black text-white text-sm block">React • Tailwind CSS • Supabase</span>
                  <p className="text-zinc-400 text-[11px]">Cloud sync dengan Supabase &amp; jana poster HD terus dalam browser.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 5B: RESULTS SCANNER (AI POSTER OCR) */}
        {activeTab === 'scrim-data' && (
          <ScrimDataHubView
            navigateToTab={navigateToTab}
            onBack={handleNavigateBackTab}
            onActiveOverlayChange={setOcrOverlayCount}
            closeOverlayRef={closeOcrOverlayRef}
            supabase={supabase}
            currentUser={currentUser}
            profileName={activeOrganizationName || profileName}
            scrims={scrims}
            setScrims={setScrims}
            knownTeams={allManageableTeams}
            showToast={showToast}
          />
        )}

        {/* VIEW 6: QUICK SCORER (POWERED BY FULL ADMIN SCORER ENGINE) */}
        {(activeTab === 'scorer' || activeTab === 'admin') && (
          <div className="space-y-4 sm:space-y-6">
            
            {!currentUser ? (
              <div className="glass-modal rounded-3xl max-w-md mx-auto my-6 sm:my-10 p-6 sm:p-7 space-y-5">
                <div className="space-y-1.5 text-center">
                  <h2 id="admin-login-heading" className="text-xl font-black tracking-tight text-white text-balance">
                    {isRegisterMode ? 'Create Host Account' : 'Host Account Portal'}
                  </h2>
                  <p className="text-xs text-zinc-400 text-pretty">
                    {isRegisterMode
                      ? 'Daftar akaun host untuk save & urus rekod scrim.'
                      : 'Log masuk untuk urus sesi & save rekod ke Cloud.'}
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} aria-labelledby="admin-login-heading" className="space-y-4">
                  <div>
                    <label htmlFor="admin-auth-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-auth-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="username"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        enterKeyHint="next"
                        placeholder="host@esports.com"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full min-h-[48px] bg-zinc-900/90 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D7FF00] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-auth-password" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="admin-auth-password"
                        name="password"
                        type={showAuthPassword ? 'text' : 'password'}
                        required
                        autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                        enterKeyHint="done"
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full min-h-[48px] bg-zinc-900/90 border border-white/15 rounded-xl pl-10 pr-12 py-2.5 text-base sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D7FF00] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword(prev => !prev)}
                        aria-pressed={showAuthPassword}
                        aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D7FF00] transition cursor-pointer"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full min-h-[48px] py-3 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl transition text-sm flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-60"
                  >
                    {authLoading ? (
                      <>
                        <progress className="loading-spinner loading-spinner-dark w-4 h-4" aria-hidden="true" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                    )}
                  </button>

                  <div className="text-center pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsRegisterMode(!isRegisterMode)}
                      className="text-xs text-[#D7FF00] hover:underline font-semibold cursor-pointer py-1"
                    >
                      {isRegisterMode ? 'Dah ada akaun? Log Masuk' : 'Belum ada akaun? Daftar sini'}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/10 text-center">
                    <button
                      type="button"
                      onClick={() => navigateToTab('scorer')}
                      className="text-xs text-zinc-400 hover:text-white font-semibold transition cursor-pointer"
                    >
                      Atau guna Quick Scorer tanpa login →
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 pb-28 md:pb-12">
                
                {/* STRATEGIC PAGE HEADER: OFFICIAL SCRIM SCORING */}
                <div className="bg-zinc-900/90 border border-zinc-800/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 relative overflow-hidden space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Top Bar: Navigation Back Link (Left) & Info Action (Right) */}
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => navigateToTab('playground')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition active:scale-95 cursor-pointer"
                          title="Kembali ke Laman Utama"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Laman Utama</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleHeaderInfo('admin')}
                          className={'p-1.5 sm:p-2 rounded-xl transition cursor-pointer shrink-0 ' + (
                            activeHeaderInfo === 'admin'
                              ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                          )}
                          title="Info portal penganjur"
                          aria-label="Info portal penganjur"
                        >
                          <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                      </div>

                      {/* Big Highlight Title */}
                      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                        Quick Scorer
                      </h1>

                      {/* Memorable Helper Text */}
                      <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                        Kira Markah, Simpan Cloud &amp; Eksport Poster HD
                      </p>

                      {/* Expandable Info Card */}
                      {activeHeaderInfo === 'admin' && (
                        <div className="p-3 sm:p-3.5 bg-zinc-950/90 border border-zinc-800 rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 origin-top animate-dropdown-reveal max-w-xl shadow-md">
                          <ShieldCheck className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
                          <p className="leading-relaxed flex-1">
                            Urus scrim, invite Co-Host &amp; save rekod ke Cloud.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveHeaderInfo(null)}
                            className="text-zinc-500 hover:text-white p-0.5 rounded transition shrink-0"
                            title="Tutup info"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right User Badge / Relocated Poster Jump Trigger / Logout Action */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="font-bold text-white truncate max-w-[140px]">{profileName || currentUser.email.split('@')[0]}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('admin-leaderboard-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        title="Lihat pratonton & eksport poster"
                      >
                        <Trophy className="w-3.5 h-3.5 text-[#D7FF00]" />
                        <span>Poster</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 border border-zinc-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                        title="Log Keluar Akaun Host"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1. ADVANCE SESSION CONTROL BAR (No Overflow, Consolidated More Actions Menu) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-zinc-900/90 border border-zinc-800/70 rounded-3xl">
                  {/* Left: Active Session Dropdown Selector */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-[#D7FF00] font-black flex items-center justify-center shrink-0">
                      {activeAdminScrim?.event_type === 'Tour' ? <Trophy className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {adminHostedScrims.length > 0 ? (
                          <div className="relative flex-1 min-w-0 max-w-sm">
                            <button
                              type="button"
                              onClick={() => {
                                setSessionPickerQuery('');
                                setIsSessionPickerOpen(true);
                              }}
                              aria-haspopup="dialog"
                              aria-expanded={isSessionPickerOpen}
                              className="w-full bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-800/70 rounded-xl px-3 py-2 text-xs text-white font-black transition flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] min-w-0"
                              title="Tukar atau cari sesi kejohanan / scrim"
                            >
                              <span className="flex items-center gap-2 min-w-0 flex-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase shrink-0 ${
                                    activeAdminScrim?.event_type === 'Tour'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-zinc-800 text-zinc-200'
                                  }`}
                                >
                                  {activeAdminScrim?.event_type === 'Tour' ? 'Tour' : 'Scrim'}
                                </span>
                                <span className="truncate">
                                  {activeAdminScrim?.title || 'Pilih Sesi'}
                                </span>
                              </span>
                              <span className="flex items-center gap-1.5 shrink-0 text-zinc-400">
                                <span className="text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.5 rounded-md bg-zinc-800/90 text-zinc-300">
                                  {adminHostedScrims.length}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isSessionPickerOpen ? 'rotate-180 text-[#D7FF00]' : ''}`} />
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-black text-white px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-zinc-800/70 truncate">
                              {activeAdminScrim?.title || 'Official Scrim - Session 1'}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold shrink-0">
                              (Sedia Diisi)
                            </span>
                          </div>
                        )}

                        <span className={'inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ' + (
                          activeAdminScrim?.is_finished 
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                            : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                        )}>
                          <span className={'w-1.5 h-1.5 rounded-full ' + (activeAdminScrim?.is_finished ? 'bg-amber-400' : 'bg-emerald-400')} />
                          <span>{activeAdminScrim?.is_finished ? 'LOCKED' : (activeAdminScrim?.is_draft ? 'READY' : 'CLOUD')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Primary + Sesi Baru CTA & Consolidated More Actions (⋮) Menu */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleQuickNewSession}
                      className="px-3.5 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-zinc-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                      title="Buat sesi baru"
                    >
                      <Plus className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />
                      <span>Sesi Baru</span>
                    </button>

                    {activeAdminScrim && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsScorerActionsMenuOpen(prev => !prev)}
                          aria-label="More Session Actions"
                          aria-expanded={isScorerActionsMenuOpen}
                          title="Menu sesi (Edit, Lock, Co-Host, Padam)"
                          className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 flex items-center justify-center transition active:scale-95 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isScorerActionsMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setIsScorerActionsMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-black border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.92)] rounded-2xl overflow-hidden z-40 py-1.5 divide-y divide-zinc-800/80 text-xs origin-top-right animate-dropdown-reveal">
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsScorerActionsMenuOpen(false);
                                    openEditScrimModal();
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-2 font-semibold transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Edit Info Sesi</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsScorerActionsMenuOpen(false);
                                    handleToggleFinishScrim();
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-2 font-semibold transition cursor-pointer"
                                >
                                  {activeAdminScrim.is_finished ? (
                                    <>
                                      <Unlock className="w-3.5 h-3.5 text-amber-300" />
                                      <span>Unlock Sesi</span>
                                    </>
                                  ) : (
                                    <>
                                      <LockKeyhole className="w-3.5 h-3.5 text-zinc-400" />
                                      <span>Lock Keputusan</span>
                                    </>
                                  )}
                                </button>

                                {isAuthorizedAdmin(activeAdminScrim) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsScorerActionsMenuOpen(false);
                                      handleCopyHostShareLink();
                                    }}
                                    className="w-full px-3.5 py-2 text-left text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-2 font-semibold transition cursor-pointer"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>Copy Link Co-Host</span>
                                  </button>
                                )}
                              </div>

                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsScorerActionsMenuOpen(false);
                                    handleDeleteScrim(activeAdminScrim.id);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 font-bold transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Padam Sesi Ini</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* SPLIT-SCREEN WORKSPACE (SEPERTI SCORER: INPUT SEBELAH KIRI, LIVE LEADERBOARD SEBELAH KANAN) */}
                <div id="admin-workspace-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-20">
                  
                  {/* LEFT PANEL: Match Rounds & Scoring Table (Identikal seperti Scorer) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    <div className="bg-zinc-900/90 border border-zinc-800/70 rounded-3xl p-4 sm:p-5 space-y-4">
                      
                      {/* Clean Workspace Header with Actions (Exact Quick Scorer Style) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/70">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-[#D7FF00] flex items-center justify-center font-black shrink-0">
                            <Zap className="w-5 h-5 fill-current"/>
                          </div>
                          <div>
                            <h2 className="text-sm sm:text-base font-black text-white">
                              Isi Markah Match
                            </h2>
                            <p className="text-[11px] font-mono tabular-nums text-zinc-400">
                              Match {selectedMatchIdx + 1} of {adminMatchCount} • {matchSlots.length} Pasukan • [{activeAdminScrim?.title || 'Sesi Aktif'}]
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                          {/* Quick WhatsApp / Text Import Button (High Contrast Emerald) */}
                          <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            disabled={activeAdminScrim?.is_finished}
                            className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 disabled:opacity-40 text-emerald-300 rounded-xl text-xs font-medium transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            title="Paste list team dari WhatsApp / Discord"
                          >
                            <Copy className="w-3.5 h-3.5 text-emerald-300"/>
                            <span>Import WA</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRandomizeTestData}
                            disabled={activeAdminScrim?.is_finished}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-40 text-zinc-100 rounded-xl text-xs font-medium transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            title="Isi markah demo untuk test"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-100"/>
                            <span>Demo</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleClearAdminForm}
                            disabled={activeAdminScrim?.is_finished}
                            className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-200 rounded-xl text-xs font-medium transition flex items-center gap-1 border border-zinc-700 disabled:opacity-40 cursor-pointer"
                            title="Clear markah match ni"
                          >
                            <Trash2 className="w-3.5 h-3.5"/>
                            <span className="hidden sm:inline">Clear</span>
                          </button>
                        </div>
                      </div>

                      {/* Match Navigation Selector Bar & Dynamic + / - Match */}
                      <div className="relative group">
                        <div className="p-1 bg-zinc-950/70 rounded-2xl flex items-center gap-1 overflow-x-auto scroll-smooth no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {adminMatchesList.map((m, mIdx) => {
                            const isSelected = selectedMatchIdx === mIdx;
                            const savedMap = m.map || PLAYGROUND_DEFAULT_MAPS[mIdx % 5] || 'Erangel';
                            const displayedMap = isSelected ? (inputMap || savedMap) : savedMap;
                            const hasSaved = Boolean(m.results && m.results.length > 0 && m.results.some(r => Number(r.totalPts) > 0 || Number(r.kills) > 0 || (r.placement !== '' && r.placement !== null && r.placement !== undefined)));
                            return (
                              <button
                                key={mIdx}
                                type="button"
                                onClick={() => setSelectedMatchIdx(mIdx)}
                                className={'py-1.5 px-3 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-0.5 min-w-[76px] sm:flex-1 shrink-0 ' + (
                                  isSelected 
                                    ? 'bg-zinc-800 text-[#D7FF00] shadow-sm border border-white/10' 
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px]">Match {mIdx + 1}</span>
                                  {hasSaved && <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF00]" title="Markah Disimpan"></span>}
                                </div>
                                <span className={'text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ' + (
                                  isSelected ? 'bg-[#D7FF00]/20 text-[#D7FF00]' : 'text-zinc-500'
                                )}>
                                  {displayedMap}
                                </span>
                              </button>
                            );
                          })}

                          {/* Dynamic + Match & - Match buttons (Advance feature!) */}
                          {!activeAdminScrim?.is_finished && (
                            <div className="flex items-center gap-1 pl-1 shrink-0">
                              {adminMatchCount > 1 && (
                                <button
                                  type="button"
                                  onClick={handleRemoveLastMatch}
                                  className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 border border-white/10 flex items-center justify-center transition active:scale-90"
                                  title="Padam match terakhir"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleAddNewMatch}
                                className="h-8 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#D7FF00] border border-[#D7FF00]/30 font-black text-xs transition flex items-center gap-1 active:scale-95"
                                title="Tambah match baru"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#D7FF00]" />
                                <span>Match</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clean Single Row: Map Selector + Session Title + Inline Team Slot Stepper (Exact Quick Scorer Style) */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        {/* Map Selector for this match */}
                        <div className="flex items-center gap-2 bg-zinc-950/70 px-3 py-1.5 rounded-xl shrink-0">
                          <span className="text-[11px] font-bold text-zinc-400">Map (M{selectedMatchIdx + 1}):</span>
                          <select
                            disabled={activeAdminScrim?.is_finished}
                            value={inputMap}
                            onChange={(e) => {
                              const newMap = e.target.value;
                              setInputMap(newMap);
                              if (activeAdminScrim) {
                                const current = adminMatchesList.length > 0 ? [...adminMatchesList] : [];
                                if (current[selectedMatchIdx]) {
                                  current[selectedMatchIdx] = { ...current[selectedMatchIdx], map: newMap };
                                  const updatedScrim = { ...activeAdminScrim, matches: current };
                                  setScrims(prev => {
                                    const exists = prev.some(s => s.id === activeAdminScrim.id);
                                    if (exists) {
                                      return prev.map(s => s.id === activeAdminScrim.id ? updatedScrim : s);
                                    } else {
                                      return [updatedScrim, ...prev];
                                    }
                                  });
                                }
                              }
                            }}
                            className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-0.5 text-xs font-bold text-white focus:outline-none focus:border-[#D7FF00] transition cursor-pointer"
                          >
                            <option value="Erangel" className="bg-zinc-950 text-white">Erangel</option>
                            <option value="Miramar" className="bg-zinc-950 text-white">Miramar</option>
                            <option value="Rondo" className="bg-zinc-950 text-white">Rondo</option>
                            <option value="Sanhok" className="bg-zinc-950 text-white">Sanhok</option>
                            <option value="Vikendi" className="bg-zinc-950 text-white">Vikendi</option>
                          </select>
                        </div>

                        {/* Middle: Session Title & Edit Info link */}
                        <button
                          type="button"
                          onClick={openEditScrimModal}
                          className="hidden md:flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white truncate px-2 py-1 rounded-lg hover:bg-zinc-800/50 transition cursor-pointer group"
                          title="Tap untuk edit info sesi"
                        >
                          <span className="text-[#D7FF00] font-mono font-bold">[{activeAdminScrim?.tier || 'Tier 1'}]</span>
                          <span className="truncate group-hover:text-[#D7FF00] transition font-bold">{activeAdminScrim?.title || 'PUBG Mobile Scrim'}</span>
                          <Edit3 className="w-3 h-3 text-zinc-500 group-hover:text-[#D7FF00] shrink-0" />
                        </button>

                        {/* Inline Team Slot Stepper (Exact same design as Quick Scorer!) */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 bg-zinc-950/70 px-3 py-1.5 rounded-xl shrink-0">
                          <span className="text-[11px] font-bold text-zinc-400">Slot:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleRemoveTeamSlot}
                              disabled={activeAdminScrim?.is_finished || matchSlots.length <= 2}
                              className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 flex items-center justify-center font-bold text-xs disabled:opacity-30 transition shadow-2xs"
                              title="Buang slot terakhir"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-black text-xs text-white px-1">
                              {matchSlots.length} Teams
                            </span>
                            <button
                              type="button"
                              onClick={handleAddTeamSlot}
                              disabled={activeAdminScrim?.is_finished || matchSlots.length >= 24}
                              className="w-6 h-6 rounded-lg bg-[#D7FF00] hover:bg-[#c2e600] text-black flex items-center justify-center font-black text-xs disabled:opacity-30 transition shadow-xs"
                              title="Tambah slot team"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Quick Input Grid Table (Identikal seperti Scorer) */}
                      <div className="rounded-2xl overflow-hidden bg-zinc-950/80 shadow-md">
                        <div className="overflow-x-auto scroll-smooth no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-white/10">
                              <tr>
                                <th className="py-2.5 px-3 w-12 text-center">Slot</th>
                                <th className="py-2.5 px-3 min-w-[150px]">Team Name</th>
                                <th className="py-2.5 px-2 w-24 text-center">Placement</th>
                                <th className="py-2.5 px-2 w-28 text-center">Elims</th>
                                <th className="py-2.5 px-2 w-20 text-center">WWCD</th>
                                <th className="py-2.5 px-3 w-20 text-center text-[#D7FF00]">Total Pts</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                              {matchSlots.map((row, idx) => {
                                const isWWCD = Number(row.placement) === 1 || Boolean(row.wwcd);
                                return (
                                  <tr 
                                    key={idx} 
                                    className={'transition ' + (isWWCD ? 'bg-[#D7FF00]/[0.06] hover:bg-[#D7FF00]/[0.1]' : 'hover:bg-zinc-800/40')}
                                  >
                                    {/* Slot # */}
                                    <td className="py-2 px-3 text-center text-zinc-500 font-bold tabular-nums">
                                      #{String(row.slot).padStart(2, '0')}
                                    </td>

                                    {/* Team Name */}
                                    <td className="py-2 px-3 font-sans">
                                      <input
                                        type="text"
                                        disabled={activeAdminScrim?.is_finished}
                                        data-cell={`admin-teamName-${idx}`}
                                        value={row.teamName}
                                        onChange={(e) => handleSlotChange(idx, 'teamName', e.target.value)}
                                        onKeyDown={(e) => handleAdminCellKeyDown(e, idx, 'teamName')}
                                        placeholder={`Squad ${row.slot}...`}
                                        className="w-full bg-zinc-900/90 border border-zinc-800/70 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-[#D7FF00] placeholder:text-zinc-600 disabled:opacity-40"
                                      />
                                    </td>

                                    {/* Placement Dropdown */}
                                    <td className="py-2 px-2 text-center">
                                      <select
                                        disabled={activeAdminScrim?.is_finished}
                                        data-cell={`admin-placement-${idx}`}
                                        value={row.placement || ''}
                                        onChange={(e) => handleSlotChange(idx, 'placement', e.target.value)}
                                        onKeyDown={(e) => handleAdminCellKeyDown(e, idx, 'placement')}
                                        className="w-full bg-zinc-900/90 border border-zinc-800/70 rounded-lg py-1 px-1 font-bold tabular-nums text-white focus:outline-none focus:border-[#D7FF00] text-xs text-center disabled:opacity-40"
                                      >
                                        <option value="" className="bg-zinc-950 text-white">--</option>
                                        {Array.from({ length: matchSlots.length }, (_, i) => i + 1).map((num) => (
                                          <option key={num} value={num} className="bg-zinc-950 text-white">
                                            #{num}
                                          </option>
                                        ))}
                                      </select>
                                    </td>

                                    {/* Elims with - / + buttons */}
                                    <td className="py-2 px-2 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          disabled={activeAdminScrim?.is_finished}
                                          onClick={() => handleAdjustKills(idx, -1)}
                                          className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-black text-xs transition active:scale-90 disabled:opacity-40"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          disabled={activeAdminScrim?.is_finished}
                                          data-cell={`admin-elims-${idx}`}
                                          value={row.kills}
                                          onChange={(e) => handleSlotChange(idx, 'kills', e.target.value)}
                                          onKeyDown={(e) => handleAdminCellKeyDown(e, idx, 'elims')}
                                          className="w-11 bg-zinc-900/90 border border-zinc-800/70 rounded-lg text-center py-1 text-xs font-bold tabular-nums text-white focus:outline-none focus:border-[#D7FF00] disabled:opacity-40 font-mono"
                                        />
                                        <button
                                          type="button"
                                          disabled={activeAdminScrim?.is_finished}
                                          onClick={() => handleAdjustKills(idx, 1)}
                                          className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 flex items-center justify-center font-black text-xs transition active:scale-90 disabled:opacity-40"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </td>

                                    {/* WWCD Button */}
                                    <td className="py-2 px-2 text-center font-sans">
                                      <button
                                        type="button"
                                        disabled={activeAdminScrim?.is_finished}
                                        onClick={() => handleSlotChange(idx, 'wwcd', !isWWCD)}
                                        className={'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 ' + (
                                          isWWCD 
                                            ? 'bg-[#D7FF00] text-zinc-950 shadow-xs font-bold' 
                                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                        )}
                                      >
                                        {isWWCD ? 'WWCD' : 'Normal'}
                                      </button>
                                    </td>

                                    {/* Total Pts */}
                                    <td className="py-2 px-3 text-center text-[#D7FF00] font-black tabular-nums text-sm">
                                      {row.totalPts}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* PMGC Standard Scoring Micro Note */}
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
                        <span>PMGC: WWCD=10pts • Elim=1pt</span>
                        <span>Total = Place + Elims</span>
                      </div>

                      {/* Save to Cloud Button & Mobile Jump */}
                      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveMatchScore}
                          disabled={activeAdminScrim?.is_finished}
                          className={'flex-1 w-full py-3 px-4 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-[0_0_20px_rgba(215, 255, 0,0.18)] active:scale-98 ' + (
                            activeAdminScrim?.is_finished 
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                              : 'bg-[#D7FF00] hover:bg-[#c2e600] text-black'
                          )}
                        >
                          <Save className="w-4 h-4"/>
                          <span>{activeAdminScrim?.is_finished ? 'Keputusan Dah Lock' : `Save Match ${selectedMatchIdx + 1} ke Cloud`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('admin-leaderboard-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="lg:hidden w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 border border-white/10 active:scale-98 uppercase tracking-wider"
                        >
                          <Trophy className="w-4 h-4 text-[#D7FF00]" />
                          <span>Lihat Poster ↓</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* RIGHT PANEL: Live Real-Time Leaderboard & Poster Preview (Sama seperti Scorer!) */}
                  <div id="admin-leaderboard-preview" className="lg:col-span-5 lg:sticky lg:top-20 space-y-3.5 scroll-mt-20">
                    
                    {/* Mode Selector Toggle: Overall Standings vs Current Match */}
                    <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/70 p-1 rounded-2xl text-xs">
                      <button
                        type="button"
                        onClick={() => setAdminPosterViewMode('overall')}
                        className={'flex-1 py-1.5 px-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer ' + (
                          adminPosterViewMode === 'overall'
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        <Trophy className="w-3.5 h-3.5"/>
                        <span>Overall</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminPosterViewMode('match')}
                        className={'flex-1 py-1.5 px-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 cursor-pointer ' + (
                          adminPosterViewMode === 'match'
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        )}
                      >
                        <Zap className="w-3.5 h-3.5"/>
                        <span>Match {selectedMatchIdx + 1}</span>
                      </button>
                    </div>

                    {/* Esports Visual Poster Card */}
                    <div
                      ref={adminPosterRef}
                      className="bg-[#0D0D0D] text-white rounded-3xl p-4 sm:p-5 shadow-2xl relative font-sans select-none overflow-hidden"
                      style={{ backgroundColor: '#0D0D0D' }}
                    >
                      {/* Poster Header */}
                      <div className="relative pb-3 mb-3 border-b border-white/10">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {activeAdminScrim?.logo_url ? (
                              <img src={activeAdminScrim.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-cover border border-white/10" />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-[#D7FF00] flex items-center justify-center text-black font-black text-xs">
                                {activeAdminScrim?.event_type === 'Tour' ? 'TR' : 'SC'}
                              </div>
                            )}
                            <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#D7FF00]">
                              {activeAdminScrim?.event_type === 'Tour' ? 'TOURNAMENT STANDINGS' : 'SCRIM STANDINGS'}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-[#D7FF00]/15 text-[#D7FF00] border-[#D7FF00]/30">
                            {adminPosterViewMode === 'overall' ? 'OVERALL RESULTS' : `${inputMap.toUpperCase()} • MATCH ${selectedMatchIdx + 1}`}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white truncate">
                          {activeAdminScrim?.title ? `${activeAdminScrim.title.toUpperCase()}` : 'PUBG MOBILE SCRIM'}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-1 flex-wrap">
                          <span className="text-[#D7FF00] font-bold">{activeAdminScrim?.tier || 'Tier 1'}</span>
                          <span>•</span>
                          <span>Host: {activeAdminScrim?.host_name || 'Admin'}</span>
                          {activeAdminScrim?.date && (
                            <>
                              <span>•</span>
                              <span>{activeAdminScrim.date}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Esports Leaderboard Table */}
                      <div className="overflow-x-auto scroll-smooth no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead>
                            <tr className="text-[9px] uppercase tracking-wider text-zinc-400 border-b border-white/10">
                              <th className="py-1.5 px-1 w-8 text-center">#</th>
                              <th className="py-1.5 px-2">TEAM NAME</th>
                              <th className="py-1.5 px-1 w-8 text-center">M</th>
                              <th className="py-1.5 px-1 w-10 text-center text-zinc-300">PLACE</th>
                              <th className="py-1.5 px-1 w-8 text-center">ELIM</th>
                              <th className="py-1.5 px-2 w-10 text-center font-black text-[#D7FF00]">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {adminLiveStandings.map((row, pos) => {
                              const isTop1 = pos === 0;
                              const isTop3 = pos < 3;
                              const hasWWCD = Number(row.wwcd) > 0;
                              return (
                                <tr 
                                  key={pos} 
                                  className={'transition ' + (
                                    isTop1 
                                      ? 'bg-[#D7FF00]/10 font-bold text-white' 
                                      : isTop3 
                                      ? 'bg-zinc-900/60 text-zinc-200' 
                                      : 'hover:bg-zinc-900/30 text-zinc-300'
                                  )}
                                >
                                  <td className="py-1.5 px-1 text-center font-bold">
                                    <span className={
                                      isTop1 
                                        ? 'text-[#D7FF00] font-black' 
                                        : pos === 1 
                                        ? 'text-zinc-300' 
                                        : pos === 2 
                                        ? 'text-amber-400' 
                                        : 'text-zinc-500'
                                    }>
                                      {`#${pos + 1}`}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 font-sans font-bold truncate max-w-[130px]">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="truncate">{row.teamName}</span>
                                      {hasWWCD && (
                                        <span className="text-[8px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider flex-shrink-0">
                                          WWCD{row.wwcd > 1 ? ` x${row.wwcd}` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-1.5 px-1 text-center text-zinc-400">{row.matchesPlayed}</td>
                                  <td className="py-1.5 px-1 text-center font-bold text-zinc-200">{row.placePts}</td>
                                  <td className="py-1.5 px-1 text-center text-zinc-300">{row.killPts}</td>
                                  <td className="py-1.5 px-2 text-center font-black text-[#D7FF00] bg-[#D7FF00]/10">
                                    {row.totalPts}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Poster Footer */}
                      <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                        <span>TIEBREAK: TOTAL PTS &gt; PLACEMENT PTS &gt; ELIMS &gt; WWCD</span>
                        <span className="text-[#D7FF00]/80 font-bold">scrim.rykhor.my</span>
                      </div>
                    </div>

                    {/* Primary Poster Action Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleDownloadAdminPoster}
                        disabled={isDownloadingAdminPoster}
                        className="w-full py-3 px-4 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-2xl shadow-[0_0_20px_rgba(215, 255, 0,0.18)] text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                      >
                        {isDownloadingAdminPoster ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin"/>
                            <span>Rendering Poster PNG...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 text-black"/>
                            <span>Export PNG</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyDiscordText(activeAdminScrim)}
                        className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.99]"
                      >
                        {copyFeedback ? <Check className="w-4 h-4 text-[#D7FF00]"/> : <Copy className="w-4 h-4 text-zinc-400"/>}
                        <span>Salin Teks</span>
                      </button>

                      {/* Mobile Jump Back Up to Scoring Form */}
                      <button
                        type="button"
                        onClick={() => {
                          document.getElementById('admin-workspace-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="w-full lg:hidden py-2.5 px-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl text-xs font-bold transition border border-white/5 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 rotate-90 text-[#D7FF00]" />
                        <span>Balik Ke Borang ↑</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW 7: NOTIS PRIVASI */}
        {activeTab === 'privacy' && (
          <div className="max-w-3xl mx-auto space-y-5 pt-1 pb-28 md:pb-12">
            <div className="flex items-center justify-between gap-3 px-1">
              <button
                type="button"
                onClick={handleNavigateBackTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateToTab('privacy')}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-100 text-zinc-950 font-semibold cursor-pointer"
                >
                  Notis Privasi
                </button>
                <button
                  type="button"
                  onClick={() => navigateToTab('terms')}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Terma Penggunaan
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-5">
              <div className="space-y-1.5 border-b border-zinc-800 pb-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                  Keselamatan &amp; Data
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Notis Privasi
                </h1>
                <p className="text-xs text-zinc-400">
                  Kemas kini terakhir: November 2026 • SCRIM HUB (scrim.rykhor.my)
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">1. Data Yang Dikumpul</h2>
                  <p>
                    Bila anda guna SCRIM HUB, kami hanya simpan maklumat yang perlu untuk jalankan fungsi app:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                    <li>
                      <strong className="text-white">Akaun Host:</strong> Email, nama paparan, gambar profil, bio, dan contact (WhatsApp / Telegram) jika anda daftar atau log masuk.
                    </li>
                    <li>
                      <strong className="text-white">Rekod Scrim &amp; Team:</strong> Tajuk sesi, tarikh, tier, nama team, tag, logo yang dimuat naik, serta markah perlawanan (Placement, Elims, WWCD).
                    </li>
                    <li>
                      <strong className="text-white">Feedback:</strong> Email (pilihan) dan mesej laporan bug atau cadangan yang anda hantar.
                    </li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">2. Cara Data Disimpan &amp; Diproses</h2>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                    <li>
                      <strong className="text-white">Supabase Cloud:</strong> Data akaun, profil host, logo, dan rekod sesi yang disimpan ke Cloud diurus melalui perkhidmatan Supabase.
                    </li>
                    <li>
                      <strong className="text-white">Storan Peranti (LocalStorage):</strong> Draf Quick Scorer, cache pasukan, dan senarai akaun untuk fungsi tukar akaun pantas disimpan secara setempat dalam browser anda sendiri.
                    </li>
                    <li>
                      <strong className="text-white">Results Scanner (AI OCR):</strong> Gambar poster yang anda muat naik dihantar ke pelayan untuk baca nama team dan markah sahaja. Sila semak semula keputusan sebelum save ke rekod awam.
                    </li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">3. Paparan Awam</h2>
                  <p>
                    Nama team, markah kejohanan, statistik Team Matrix, dan profil host (nama serta contact yang anda letak sebagai penganjur) boleh dilihat oleh pengguna lain sebagai rekod kejohanan. Jangan masukkan maklumat peribadi sensitif pada tajuk sesi atau borang awam.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">4. Kawalan Data Anda</h2>
                  <p>
                    Anda boleh edit profil, buang akaun dari peranti, atau padam sesi yang anda host pada bila-bila masa. Untuk permintaan padam akaun atau data sepenuhnya, hubungi pembangun melalui butang{' '}
                    <button
                      type="button"
                      onClick={() => setIsFeedbackModalOpen(true)}
                      className="text-[#D7FF00] font-semibold hover:underline cursor-pointer"
                    >
                      Feedback
                    </button>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 8: TERMA PENGGUNAAN */}
        {activeTab === 'terms' && (
          <div className="max-w-3xl mx-auto space-y-5 pt-1 pb-28 md:pb-12">
            <div className="flex items-center justify-between gap-3 px-1">
              <button
                type="button"
                onClick={handleNavigateBackTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => navigateToTab('privacy')}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                >
                  Notis Privasi
                </button>
                <button
                  type="button"
                  onClick={() => navigateToTab('terms')}
                  className="px-3.5 py-1.5 rounded-full text-xs bg-zinc-100 text-zinc-950 font-semibold cursor-pointer"
                >
                  Terma Penggunaan
                </button>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 space-y-5">
              <div className="space-y-1.5 border-b border-zinc-800 pb-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D7FF00]">
                  Syarat &amp; Penafian
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Terma Penggunaan
                </h1>
                <p className="text-xs text-zinc-400">
                  Kemas kini terakhir: November 2026 • SCRIM HUB (scrim.rykhor.my)
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">1. Penggunaan Platform</h2>
                  <p>
                    Dengan menggunakan SCRIM HUB, anda bersetuju untuk menggunakan platform ini bagi tujuan pengurusan scrim, kejohanan, kiraan markah, dan rekod pasukan secara sah dan beretika.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">2. Kandungan &amp; Tanggungjawab Host</h2>
                  <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                    <li>Host bertanggungjawab penuh ke atas ketepatan markah, nama pasukan, pautan media sosial, dan logo yang dimuat naik.</li>
                    <li>Dilarang memuat naik kandungan lucah, ujaran kebencian, penipuan, atau bahan yang melanggar hak cipta pihak lain.</li>
                    <li>Akses Co-Host hanya perlu dikongsi dengan pihak yang dipercayai. Pihak kami berhak membuang kandungan atau menyekat akses jika berlaku salah guna.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">3. Ketepatan Kiraan &amp; AI Scanner</h2>
                  <p>
                    Hasil imbasan poster menggunakan AI OCR boleh mengandungi ralat bacaan bergantung pada kualiti gambar. Host wajib menyemak kiraan PP + Elims dan nama pasukan sebelum mengesahkan atau menerbitkan keputusan rasmi.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">4. Penafian Rasmi (Disclaimer)</h2>
                  <p>
                    SCRIM HUB dibangunkan secara bebas oleh <strong className="text-white">ry.khor</strong> untuk komuniti esports tempatan. Platform ini tidak bergabung, disokong, atau ditaja oleh Krafton, Tencent Games, atau PUBG Mobile. Perkhidmatan disediakan sebagaimana adanya (&quot;as-is&quot;) tanpa jaminan bebas ralat atau gangguan pelayan.
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* FOOTER NAVIGATION & LEGAL LINKS */}
        <footer className="mt-10 pt-5 pb-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <span className="text-[11px] font-mono text-zinc-500">
            © 2026 SCRIM HUB by ry.khor
          </span>

          <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            <button
              type="button"
              onClick={() => navigateToTab('privacy')}
              className={`py-1 transition cursor-pointer ${
                activeTab === 'privacy'
                  ? 'text-[#D7FF00] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Notis Privasi
            </button>
            <button
              type="button"
              onClick={() => navigateToTab('terms')}
              className={`py-1 transition cursor-pointer ${
                activeTab === 'terms'
                  ? 'text-[#D7FF00] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Terma
            </button>
            <button
              type="button"
              onClick={() => navigateToTab('about')}
              className={`py-1 transition cursor-pointer ${
                activeTab === 'about'
                  ? 'text-[#D7FF00] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="py-1 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Feedback
            </button>
          </div>
        </footer>

      </main>

      {/* MODAL 1: TEAM PERFORMANCE & IG STORY EXPORT */}
      {isPerformanceModalOpen && performanceTeam && filteredTeamPerformance && (
        <div
          onClick={() => setIsPerformanceModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-3xl max-w-2xl w-full h-[84dvh] sm:h-[620px] max-h-[90vh] flex flex-col overflow-y-auto p-4 sm:p-6 space-y-4 animate-card-entrance"
          >
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#D7FF00] flex items-center justify-center text-black font-black text-base shadow-sm">
                  {performanceTeam.tag}
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    <span>{performanceTeam.name}</span>
                  </h3>
                  <span className="text-[11px] text-zinc-300">Statistik team &amp; export Story 9:16</span>
                </div>
              </div>

              <button 
                onClick={() => setIsPerformanceModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-900/60 p-3 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1 mb-1">
                  <Medal className="w-3.5 h-3.5 text-[#D7FF00]"/>
                  <span>Event Category:</span>
                </span>
                <select
                  value={performanceModalCategory}
                  onChange={(e) => setPerformanceModalCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-[#D7FF00]"
                >
                  <option value="ALL" className="bg-zinc-950 text-white">Semua (Scrim + Tour)</option>
                  <option value="SSS" className="bg-zinc-950 text-white">SSS (Bermula Season 4)</option>
                  <option value="TIER_1" className="bg-zinc-950 text-white">Tier 1 (Pro)</option>
                  <option value="TIER_2" className="bg-zinc-950 text-white">Tier 2 (Semi-Pro)</option>
                  <option value="TIER_3" className="bg-zinc-950 text-white">Tier 3 (Amateur)</option>
                  <option value="OPEN" className="bg-zinc-950 text-white">Open Community</option>
                  <option value="Scrim" className="bg-zinc-950 text-white">Scrim Sahaja</option>
                  <option value="Tour" className="bg-zinc-950 text-white">Tournament Sahaja</option>
                </select>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1 mb-1">
                  <Filter className="w-3.5 h-3.5 text-[#D7FF00]"/>
                  <span>Host / Organizer:</span>
                </span>
                <select
                  value={selectedPerformanceHost}
                  onChange={(e) => setSelectedPerformanceHost(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-[#D7FF00]"
                >
                  <option value="ALL" className="bg-zinc-950 text-white">All Hosts</option>
                  {organizersList.map(h => (
                    <option key={h.id || h.name} value={h.id || h.name} className="bg-zinc-950 text-white">
                      Host: {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              key={`perf_filter_${performanceModalCategory}_${selectedPerformanceHost}`}
              className="space-y-4 animate-filter-reveal flex-1"
            >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Avg Pts / Sesi</span>
                <span className="text-base font-black font-mono text-[#D7FF00]">
                  {filteredTeamPerformance.avgPts}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Avg Elims / Sesi</span>
                <span className="text-base font-black font-mono text-white">
                  {filteredTeamPerformance.avgKills}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Win Rate (WWCD)</span>
                <span className="text-base font-black font-mono text-[#D7FF00]">
                  {filteredTeamPerformance.winRate}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Jumlah Sesi</span>
                <span className="text-base font-black font-mono text-zinc-300">
                  {filteredTeamPerformance.results.length} Sesi
                </span>
              </div>
            </div>

            <ScrimDualLineChart results={filteredTeamPerformance.results} compact />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleShareToInstagramStory(
                  performanceTeam, 
                  filteredTeamPerformance, 
                  selectedPerformanceHost === 'ALL' 
                    ? 'ALL' 
                    : (organizersList.find(h => h.id === selectedPerformanceHost || h.name === selectedPerformanceHost)?.name || selectedPerformanceHost),
                  performanceModalCategory === 'ALL'
                    ? 'Official Scrim & Tour'
                    : (
                        [...HALL_OF_FAME_FILTERS, ...HALL_OF_FAME_EVENT_TOGGLES]
                          .find(f => f.key === performanceModalCategory)?.label || performanceModalCategory
                      )
                )}
                disabled={isGeneratingStory}
                className="px-4 py-2.5 bg-[#BE185D] hover:bg-[#9D174D] active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Share className="w-4 h-4"/>
                <span>{isGeneratingStory ? 'Menjana...' : 'Export Story'}</span>
              </button>

              <button
                onClick={() => setIsPerformanceModalOpen(false)}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 0: SLIDE PRESENTATION PANDUAN APLIKASI (QUICK SCORER & ADMIN FOCUS) */}
      {isGuideModalOpen && (
        <div
          onClick={handleCloseGuide}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-6 space-y-3 sm:space-y-4 relative overflow-hidden flex flex-col h-[90dvh] sm:h-[520px] sm:max-h-[88vh] animate-card-entrance"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 sm:pb-3 flex-shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#D7FF00]/10 border border-[#D7FF00]/20 text-[#D7FF00] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xs sm:text-sm text-white truncate">
                    Slide Panduan SCRIM HUB
                  </h3>
                  <span className="text-[10px] text-zinc-300 block truncate">Panduan Penggunaan Quick Scorer &amp; Host</span>
                </div>
              </div>

              {/* Action Buttons: Copy Link + Close */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCopyGuideLink}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95"
                  title="Salin pautan terus panduan ini untuk dikongsi (#guide)"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span className="text-[11px] font-bold hidden xs:inline sm:inline">Salin Link</span>
                </button>

                <button 
                  onClick={handleCloseGuide} 
                  className="p-1.5 rounded-xl hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
                  title="Tutup panduan"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Jump Category Pills */}
            <div className="relative group flex-shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar pb-1 px-1 flex-shrink-0 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { label: '1. Overview', idx: 0 },
                  { label: '2. Quick Scorer', idx: 1 },
                  { label: '3. Host Portal', idx: 2 },
                  { label: '4. Database', idx: 3 },
                ].map(item => {
                  const isActive = currentGuideSlide === item.idx;
                  return (
                    <button
                      key={item.idx}
                      type="button"
                      onClick={() => setCurrentGuideSlide(item.idx)}
                      className={'py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 shrink-0 ' + (
                        isActive
                          ? 'bg-zinc-800 text-[#D7FF00] font-bold border border-[#D7FF00]/50 shadow-xs'
                          : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/5 transition-colors'
                      )}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slide Body (Scrollable with mobile touch momentum) */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-3 sm:space-y-3.5 touch-pan-y">
              
              {/* SLIDE 0: PENGENALAN */}
              {currentGuideSlide === 0 && (
                <div className="space-y-3 animate-filter-reveal">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black text-[#D7FF00] bg-[#D7FF00]/10 px-2.5 py-0.5 rounded-full border border-[#D7FF00]/20">
                      PENGENALAN PLATFORM
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      Selamat Datang ke SCRIM HUB
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      Web app untuk kira markah scrim PUBG Mobile, buat poster standings &amp; simpan rekod team. Percuma untuk host &amp; squad.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded inline-block">1. Format PMGC</span>
                      <h4 className="text-xs font-bold text-white">Standard 10-Point</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">#1 (10pts), #2 (6pts), #3 (5pts) sampai #8 (1pt) + 1 point setiap Elim.</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded inline-block">2. Poster HD</span>
                      <h4 className="text-xs font-bold text-white">Live Standings</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">Export terus jadi poster PNG atau copy teks untuk WhatsApp &amp; Discord.</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded inline-block">3. Cloud Sync</span>
                      <h4 className="text-xs font-bold text-white">Simpan Rekod</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">Log masuk sebagai Host untuk save sesi ke Cloud &amp; update Team Matrix.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 1: PANDUAN QUICK SCORER (TEKANAN UTAMA) */}
              {currentGuideSlide === 1 && (
                <div className="space-y-3 animate-filter-reveal">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black text-[#D7FF00] bg-[#D7FF00]/10 px-2.5 py-0.5 rounded-full border border-[#D7FF00]/20">
                        PANDUAN 1: QUICK SCORER
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-white/5">Tanpa Perlu Login</span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      Cara Guna Quick Scorer (Kiraan Pantas)
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      Buka dan terus isi markah untuk match harian.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                        <h4 className="text-xs font-bold text-white">Pilih Match</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Tap <strong>Match 1</strong> sampai <strong>Match 5</strong> atau tekan <strong>+ Match</strong> untuk tambah pusingan.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                        <h4 className="text-xs font-bold text-white">Isi Nama Team</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Taip nama team kat ruang <em>Team Name</em> atau guna <strong>Import WA</strong>. Nama team akan sync ke match lain.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">3</span>
                        <h4 className="text-xs font-bold text-white">Pilih Placement &amp; Elims</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Pilih rank (cth: <code>#1</code>) &amp; masuk Elims. Markah dan badge WWCD dikira terus.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">4</span>
                        <h4 className="text-xs font-bold text-white">Export Poster PNG</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Check Live Leaderboard &amp; tekan <strong>Export PNG</strong> untuk download poster.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-zinc-900/80 border border-[#D7FF00]/30 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs text-zinc-300 leading-snug">
                      <strong>Tip:</strong> Guna butang <em>Tambah/Kurang Team</em> untuk tetapkan 2 hingga 24 slot skuad.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseGuide();
                        navigateToTab('scorer');
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(215, 255, 0,0.18)] shrink-0 active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Buka Quick Scorer →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 2: PANDUAN HOST WORKSPACE (TEKANAN UTAMA) */}
              {currentGuideSlide === 2 && (
                <div className="space-y-3 animate-filter-reveal">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black text-black bg-[#D7FF00] px-2.5 py-0.5 rounded-full border border-[#D7FF00]">
                        PANDUAN 2: HOST WORKSPACE
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded-md border border-[#D7FF00]/20">Simpanan Cloud</span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      Cara Guna Host Workspace (Penganjur Rasmi)
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      Untuk host liga, qualifier atau scrim harian yang nak rekod tersimpan dalam Cloud.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                        <h4 className="text-xs font-bold text-white">Daftar Akaun Host</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Log masuk atau daftar dengan email untuk buka akses save ke Cloud.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                        <h4 className="text-xs font-bold text-white">Buat Sesi Baru</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Tekan <strong>Sesi Baru</strong>, kemudian set tajuk, format Scrim/Tour &amp; bilangan match.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">3</span>
                        <h4 className="text-xs font-bold text-white">Isi Markah &amp; Live Ranking</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Isi rank &amp; Elims macam biasa sambil preview poster standings kat sebelah kanan.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">4</span>
                        <h4 className="text-xs font-bold text-white">Lock Sesi Bila Tamat</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Lepas habis semua match, tekan <strong>Lock Keputusan</strong> supaya markah tak diubah lagi.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-zinc-900 border border-white/10 text-white rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs text-zinc-300 leading-snug">
                      <strong>Ciri Penganjur:</strong> Boleh jemput <em>Co-Host</em> isi markah serentak dan muat naik logo penaja rasmi.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseGuide();
                        navigateToTab('admin');
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(215, 255, 0,0.18)] shrink-0 active:scale-95"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-black" />
                      <span>Buka Host Workspace →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLIDE 3: HISTORY & DATABASE */}
              {currentGuideSlide === 3 && (
                <div className="space-y-3 animate-filter-reveal">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-white/10">
                       REKOD &amp; ANALITIK
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      Arkib History &amp; Database Prestasi
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      Semua sesi yang dah save akan masuk ke tab Rekod dan Team Matrix.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="p-2.5 sm:p-3.5 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#D7FF00]"/>
                        <span>Tab Rekod (Arkib Sesi)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Senarai scrim &amp; tournament lepas. Tap mana-mana sesi untuk tengok scoreboard penuh atau edit balik kalau ada silap.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3.5 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-[#D7FF00]"/>
                        <span>Tab Teams (Team Matrix)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Ranking team ikut total points, Elims, WWCD &amp; graf prestasi setiap scrim.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-pink-950/50 border border-pink-500/25 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-pink-400">Export ke IG Story</span>
                      <p className="text-[11px] text-zinc-300 leading-snug">
                        Dalam tab Teams, pilih mana-mana team dan tekan <strong>Story 9:16</strong> untuk download kad statistik.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls (Next / Prev & Indicators) */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2.5 sm:pt-3 flex-shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setCurrentGuideSlide(prev => Math.max(prev - 1, 0))}
                disabled={currentGuideSlide === 0}
                className="px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 transition flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Sebelumnya</span>
              </button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map(dotIdx => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentGuideSlide(dotIdx)}
                    className={'h-2 rounded-full transition-all ' + (
                      currentGuideSlide === dotIdx 
                        ? 'w-5 sm:w-6 bg-[#D7FF00]' 
                        : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                    )}
                    title={`Lompat ke slide ${dotIdx + 1}`}
                  />
                ))}
              </div>

              {currentGuideSlide < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentGuideSlide(prev => Math.min(prev + 1, 3))}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black bg-[#D7FF00] hover:bg-[#c2e600] text-black transition flex items-center gap-1 shadow-xs active:scale-95 shrink-0"
                >
                  <span>Seterusnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseGuide}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black bg-zinc-900 hover:bg-zinc-800 text-[#D7FF00] border border-white/10 transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                >
                  <span>Selesai</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* AUTH MODAL (LOGIN / SIGN UP FOR GUEST-PLAYGROUND & DASHBOARD) */}
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAuthModalOpen(false);
              setPendingCloudSync(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="glass-modal rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => {
                setIsAuthModalOpen(false);
                setPendingCloudSync(false);
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1.5 pr-6 pl-6">
              <h2 id="auth-modal-title" className="text-xl font-black tracking-tight text-white text-balance">
                {isRegisterMode ? 'Create Host Account' : 'Host Account Portal'}
              </h2>
              <p className="text-xs text-zinc-400 text-pretty">
                {isRegisterMode
                  ? 'Daftar akaun host untuk save & urus rekod scrim.'
                  : 'Log masuk untuk buka dashboard host.'}
              </p>
            </div>

            {pendingCloudSync && (
              <div className="p-3 bg-[#D7FF00]/10 border border-[#D7FF00]/20 rounded-2xl text-xs text-[#D7FF00] font-semibold flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#D7FF00] flex-shrink-0" />
                <span>Data match akan terus save ke Cloud lepas log masuk.</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} aria-labelledby="auth-modal-title" className="space-y-4">
              <div>
                <label htmlFor="auth-modal-email" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-modal-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="host@esports.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full min-h-[48px] bg-zinc-900/90 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00] transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-modal-password" className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-modal-password"
                    name="password"
                    type={showAuthPassword ? 'text' : 'password'}
                    required
                    autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                    enterKeyHint="done"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full min-h-[48px] bg-zinc-900/90 border border-white/15 rounded-xl pl-10 pr-12 py-2.5 text-base sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(prev => !prev)}
                    aria-pressed={showAuthPassword}
                    aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white focus-visible:outline-2 focus-visible:outline-[#D7FF00] transition cursor-pointer"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full min-h-[48px] py-3 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl transition text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {authLoading ? (
                  <>
                    <progress className="loading-spinner loading-spinner-dark w-4 h-4" aria-hidden="true" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-[#D7FF00] hover:underline font-semibold cursor-pointer py-1"
                >
                  {isRegisterMode ? 'Dah ada akaun? Log Masuk' : 'Belum ada akaun? Daftar sini'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEVELOPER FEEDBACK MODAL */}
      {isFeedbackModalOpen && (
        <div
          onClick={() => setIsFeedbackModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-3xl max-w-md w-full p-6 space-y-4 animate-card-entrance"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center">
                  <Bug className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Developer Feedback & Bug Report</h3>
                  <span className="text-[10px] text-zinc-400">Mesej terus ke ry.khor</span>
                </div>
              </div>
              <button 
                onClick={() => setIsFeedbackModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7FF00]"
                >
                  <option value="Bug Report" className="bg-zinc-950 text-white">Bug Report / Error</option>
                  <option value="Feature Request" className="bg-zinc-950 text-white">Feature Request / Suggestion</option>
                  <option value="UI/Design Feedback" className="bg-zinc-950 text-white">UI & Design Feedback</option>
                  <option value="Other Inquiry" className="bg-zinc-950 text-white">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Your Email (Optional)</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="name@email.com (kalau perlu reply)"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Message / Issue Details</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Tulis detail bug atau cadangan..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingFeedback}
                  className="px-5 py-2 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black shadow-xs"
                >
                  {isSendingFeedback ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FULL PAGE HOST PROFILE SUMMARY (SCREENSHOT-MATCHED FULL MOBILE SCREEN) */}
      {(isProfileModalOpen || activeTab === 'profile') && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-drawer-title"
          id="profile-drawer-scroll" className="fixed inset-0 z-50 bg-black w-full h-[100dvh] overflow-y-auto no-scrollbar overscroll-contain animate-drawer-up flex flex-col select-none"
        >
          <div className="w-full max-w-md md:max-w-[1560px] mx-auto flex-1 flex flex-col min-h-full pb-36 sm:pb-20 md:px-6 lg:px-10 xl:px-12 animate-linear-open">
            {/* Top Frosted Glass Cover Banner */}
            <div className="relative h-44 md:h-60 lg:h-64 w-full overflow-hidden glass-panel shrink-0 rounded-b-3xl md:rounded-3xl md:mt-4">
              {/* Header Navigation: Back / Close & Quick Edit */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-6 sm:pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    if (activeTab === 'profile') {
                      handleNavigateBackTab();
                    }
                  }}
                  aria-label="Kembali"
                  className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 active:scale-95 transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {currentUser && (
                  <button
                    type="button"
                    onClick={toggleEditProfileMode}
                    aria-label={isEditProfileMode ? "Tutup Edit" : "Edit Profile"}
                    className={`w-10 h-10 md:w-auto md:px-4 rounded-full backdrop-blur-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer ${
                      isEditProfileMode
                        ? 'bg-[#D7FF00] text-black font-black'
                        : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-black/70'
                    }`}
                  >
                    <Edit3 className="w-4 h-4 stroke-[2.2]" />
                    <span className="hidden md:inline text-xs font-bold">{isEditProfileMode ? "Tutup Edit" : "Edit Profile"}</span>
                  </button>
                )}
              </div>
            </div>

            {!currentUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 my-auto">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-[#D7FF00] shadow-xl">
                  <User className="w-10 h-10" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-lg font-black text-white">Profil &amp; Akaun Host</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Log masuk untuk tengok profile, statistik sesi &amp; rekod Cloud.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black text-xs transition active:scale-95 shadow-[0_0_20px_rgba(215,255,0,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-black" />
                  <span>Log Masuk / Daftar Akaun</span>
                </button>
              </div>
            ) : (
              <>
            {/* Overlapping Profile Avatar + Display Name + Badges */}
            <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row items-center md:items-end justify-between px-5 md:px-6 lg:px-8 pb-6 gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
                <div className="relative">
                  <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-black shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                      {avatarDisplaySrc ? (
                        <img
                          src={avatarDisplaySrc}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-black text-2xl md:text-3xl text-[#D7FF00]">
                          {(profileName || activeOrganizationName || 'H').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Camera / Upload Badge */}
                  <label
                    title="Tukar foto profil"
                    className="absolute bottom-1 right-1 w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#D7FF00] hover:bg-[#c2e600] text-black flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition hover:scale-105"
                  >
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Display Name & Badges */}
                <div className="space-y-1.5">
                  <h3 id="profile-drawer-title" className="text-xl md:text-3xl font-black text-white tracking-tight">
                    {profileName || activeOrganizationName || 'Host Penganjur'}
                  </h3>

                  {/* Badges: Verified Host & Joined Date */}
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] md:text-xs font-black bg-[#D7FF00]/15 text-[#D7FF00] shadow-xs">
                      <Crown className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Verified Host</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] md:text-xs font-semibold bg-zinc-800/80 text-zinc-300">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formattedDateJoined}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Quick Action */}
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleEditProfileMode}
                  className="px-4 py-2.5 rounded-2xl bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black text-xs transition active:scale-95 shadow-[0_0_20px_rgba(215,255,0,0.2)] flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 stroke-[2.5]" />
                  <span>{isEditProfileMode ? 'Tutup Edit' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>

            {/* INLINE EDIT MODE FORM (SEGERA DI ATAS SELEPAS AVATAR & BADGES) */}
            {isEditProfileMode && (
              <div className="px-5 mb-6 origin-top animate-dropdown-reveal">
                <div className="flex items-center justify-between mb-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center font-black">
                      <Edit3 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight">Edit Profile</h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditProfileMode(false)}
                    className="text-xs font-bold text-zinc-400 hover:text-white transition px-2.5 py-1 rounded-lg bg-zinc-900"
                  >
                    Tutup
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 p-4 sm:p-6 rounded-3xl glass-panel">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-zinc-300 uppercase font-bold mb-1 text-[10px] tracking-wider">
                        Nama Paparan (Display Name)
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="cth: RYKHOR Esports Organizer"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none font-semibold"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-zinc-300 uppercase font-bold mb-1 text-[10px] tracking-wider">
                        Contact
                      </label>
                      <input
                        type="text"
                        autoComplete="tel"
                        placeholder="+60123456789 atau @username"
                        value={profileContact}
                        onChange={(e) => setProfileContact(e.target.value)}
                        className="w-full bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-zinc-300 uppercase font-bold mb-1 text-[10px] tracking-wider">
                        Bio
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Peraturan kejohanan, jadual mingguan, slot pendaftaran..."
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full bg-zinc-950 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditProfileMode(false)}
                      className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer transition active:scale-95"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-4 py-2 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black text-xs shadow-md cursor-pointer transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Simpan Profil</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SECTION 1: SESI DIANJURKAN (MY PRACTICES) */}
            <div className="px-5 md:px-6 lg:px-8 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-black text-white tracking-tight">Sesi Dianjurkan</h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    navigateToTab('history');
                  }}
                  className="text-[11px] font-bold text-zinc-400 hover:text-[#D7FF00] flex items-center gap-0.5 transition cursor-pointer"
                >
                  <span>Lihat semua</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Scroll Carousel on Mobile, Expansive Grid on Desktop */}
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-center md:items-stretch gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-1.5 no-scrollbar snap-x overscroll-x-contain">
                {adminHostedScrims.length > 0 ? (
                  adminHostedScrims.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setAdminSelectedScrimId(s.id);
                        setIsProfileModalOpen(false);
                        navigateToTab('admin');
                      }}
                      className="snap-start shrink-0 w-64 md:w-auto p-3.5 sm:p-4 rounded-2xl glass-tile glass-tile-hover flex items-center gap-3.5 transition cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center shrink-0">
                        {s.poster_url ? (
                          <img src={s.poster_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Trophy className="w-5 h-5 text-[#D7FF00]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-black text-white truncate group-hover:text-[#D7FF00] transition">
                          {s.title || 'Official Scrim'}
                        </h5>
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {s.matches_count || 4} Perlawanan • Skuad
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                          s.is_finished
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}>
                          <Clock className="w-2.5 h-2.5" />
                          <span>{s.is_finished ? 'Selesai' : 'Sedang Berlangsung'}</span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="shrink-0 w-60 md:w-auto p-3.5 sm:p-4 rounded-2xl glass-tile flex items-center gap-3 text-zinc-400 text-xs">
                    <Trophy className="w-4 h-4 text-[#D7FF00]/50" />
                    <span>Belum ada sesi dianjurkan</span>
                  </div>
                )}

                {/* + Sesi Baru Button Card */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleQuickNewSession();
                  }}
                  className="snap-start shrink-0 w-36 md:w-auto h-[76px] md:h-auto md:min-h-[76px] p-2.5 rounded-2xl glass-tile glass-tile-hover border-dashed flex flex-col md:flex-row items-center justify-center gap-2 text-center transition cursor-pointer text-zinc-400 hover:text-[#D7FF00] group active:scale-95"
                >
                  <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#D7FF00]/20 flex items-center justify-center text-white group-hover:text-[#D7FF00] transition">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold">+ Sesi Baru</span>
                </button>
              </div>
            </div>

            {/* SECTION 2: STATISTIK PENGANJUR (MY PROGRESS) */}
            <div className="px-5 md:px-6 lg:px-8 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-black text-white tracking-tight">Statistik Penganjur</h4>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 text-[10px] font-bold text-zinc-300">
                  <span>Musim Ini</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </div>
              </div>

              {/* 3 Circular SVG Progress Gauges Card */}
              <div className="p-4 sm:p-6 lg:p-7 rounded-2xl glass-panel grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
                {/* Gauge 1: Selesai (#D7FF00) */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] sm:text-xs font-bold mb-2 tracking-wide text-[#D7FF00]">
                    Selesai
                  </span>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 origin-center" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        className="stroke-white/10"
                        strokeWidth="5"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="#D7FF00"
                        strokeWidth="5"
                        strokeDasharray={150.8}
                        strokeDashoffset={150.8 - (profileHostStats.completionRate / 100) * 150.8}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs sm:text-sm lg:text-base font-black font-mono text-white">
                        {profileHostStats.completionRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gauge 2: Slot Penuh (#10B981) */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] sm:text-xs font-bold mb-2 tracking-wide text-emerald-400">
                    Slot Penuh
                  </span>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 origin-center" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        className="stroke-white/10"
                        strokeWidth="5"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="#10B981"
                        strokeWidth="5"
                        strokeDasharray={150.8}
                        strokeDashoffset={150.8 - (profileHostStats.fillRate / 100) * 150.8}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs sm:text-sm lg:text-base font-black font-mono text-white">
                        {profileHostStats.fillRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gauge 3: Auto-Audit (#38BDF8) */}
                <div className="flex flex-col items-center text-center">
                  <span className="text-[11px] sm:text-xs font-bold mb-2 tracking-wide text-sky-400">
                    Auto-Audit
                  </span>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 origin-center" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        className="stroke-white/10"
                        strokeWidth="5"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="24"
                        stroke="#38BDF8"
                        strokeWidth="5"
                        strokeDasharray={150.8}
                        strokeDashoffset={150.8 - (profileHostStats.auditRate / 100) * 150.8}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs sm:text-sm lg:text-base font-black font-mono text-white">
                        {profileHostStats.auditRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PROFIL & MAKLUMAT (NOTES) */}
            <div className="px-5 md:px-6 lg:px-8 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-black text-white tracking-tight">Profil &amp; Maklumat</h4>
                <button
                  type="button"
                  onClick={toggleEditProfileMode}
                  className="text-[11px] font-bold text-zinc-400 hover:text-[#D7FF00] flex items-center gap-0.5 transition cursor-pointer"
                >
                  <span>{isEditProfileMode ? 'Tutup Edit' : 'Edit'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CARDS VIEW MODE (Reference "Notes" Style) */}
              <div className="flex md:grid md:grid-cols-3 items-center md:items-stretch gap-3 md:gap-4 lg:gap-6 overflow-x-auto md:overflow-visible pb-1.5 no-scrollbar snap-x overscroll-x-contain">
                {/* Card 1: Official Contact */}
                <div className="snap-start shrink-0 w-48 md:w-auto p-4 sm:p-5 lg:p-6 rounded-2xl glass-tile flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400">CONTACT</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white line-clamp-2">
                    {profileContact || 'Belum ditetapkan'}
                  </p>
                  {profileContact ? (
                    <a
                      href={profileContact.startsWith('http') ? profileContact : (profileContact.startsWith('@') ? `https://t.me/${profileContact.slice(1)}` : `https://wa.me/${profileContact.replace(/\D/g, '')}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] sm:text-xs font-black text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Buka Chat</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[9px] font-mono text-zinc-500">Tekan edit</span>
                  )}
                </div>

                {/* Card 2: Bio & Rules */}
                <div className="snap-start shrink-0 w-52 md:w-auto p-4 sm:p-5 lg:p-6 rounded-2xl glass-tile flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400">BIO</span>
                    <div className="w-7 h-7 rounded-lg bg-[#D7FF00]/20 text-[#D7FF00] flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-zinc-300 line-clamp-3">
                    {profileBio || 'Host PUBG Mobile Scrims.'}
                  </p>
                  <span className="text-[9px] font-mono text-zinc-500 font-semibold">Terkini</span>
                </div>

                {/* Card 3: Clan / Organization */}
                <div className="snap-start shrink-0 w-48 md:w-auto p-4 sm:p-5 lg:p-6 rounded-2xl glass-tile flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-400">ORGANISASI</span>
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {activeOrganizationName || 'Clan Utama'}
                  </p>
                  <span className="text-[9px] font-mono text-sky-400 font-semibold">Akaun Aktif</span>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTIONS: LOGOUT */}
            <div className="mt-auto px-5 md:px-6 lg:px-8 pt-4 pb-6 flex justify-center">
              {currentUser && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full md:max-w-md py-3.5 px-6 rounded-2xl bg-rose-500/12 hover:bg-rose-500/22 text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Keluar Akaun</span>
                </button>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      )}

      {/* MODAL: PENGURUSAN PASUKAN & LOGO (KUASA MUTLAK - syahmi3122973@gmail.com) */}
      {isTeamManagerModalOpen && isMasterAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pengurusan Pasukan & Logo"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => {
            if (logoCropSource) setLogoCropSource(null);
            else if (mergeTeamDraft) setMergeTeamDraft(null);
            else if (editingTeam) setEditingTeam(null);
            else setIsTeamManagerModalOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-modal rounded-[2rem] p-5 sm:p-6 space-y-4 h-[82dvh] sm:h-[78vh] flex flex-col relative animate-card-entrance overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#D7FF00] flex items-center justify-center text-black font-black shrink-0 shadow-sm">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-white truncate">
                    Pengurusan Pasukan &amp; Logo
                  </h3>
                  <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                    {currentUser?.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (logoCropSource) setLogoCropSource(null);
                  else if (mergeTeamDraft) setMergeTeamDraft(null);
                  else if (editingTeam) setEditingTeam(null);
                  else setIsTeamManagerModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden File Input for Logo upload */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/*"
              onChange={handleUploadLogoFile}
              className="hidden"
            />

            {/* View A: Crop Logo OR Merge Teams OR Edit Team Form */}
            {editingTeam && logoCropSource ? (
              <TeamLogoCropper
                key={logoCropSource}
                imageSrc={logoCropSource}
                teamName={editingTeam.name}
                isSubmitting={isUploadingTeamLogo}
                onCancel={() => setLogoCropSource(null)}
                onConfirm={handleConfirmLogoCrop}
              />
            ) : mergeTeamDraft ? (
              <div className="space-y-4 overflow-y-auto pr-0.5 flex-1 overscroll-contain">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMergeTeamDraft(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-[#D7FF00] transition cursor-pointer min-h-[36px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali ke Senarai</span>
                  </button>
                  <span className="text-[10px] font-mono font-bold text-[#D7FF00] uppercase tracking-wider">
                    Gabung Duplikat
                  </span>
                </div>

                {/* Auto-detected near-duplicate pairs */}
                {potentialDuplicatePairs.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-black border border-amber-400/25 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                        Duplikat Dikesan ({potentialDuplicatePairs.length})
                      </span>
                      <span className="text-[10px] text-zinc-400">Tap untuk pilih</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
                      {potentialDuplicatePairs.map((pair, pIdx) => (
                        <div
                          key={`${pair.source.name}_${pair.target.name}_${pIdx}`}
                          className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate">
                              <span className="text-zinc-400 line-through mr-1.5">{pair.source.name}</span>
                              <span className="text-[#D7FF00]">→ {pair.target.name}</span>
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{pair.reason}</p>
                          </div>
                          <button
                            type="button"
                            disabled={mergeTeamDraft.isSubmitting}
                            onClick={() =>
                              setMergeTeamDraft({
                                sourceName: pair.source.name,
                                targetName: pair.target.name,
                                isSubmitting: false
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#D7FF00]/15 hover:bg-[#D7FF00] text-[#D7FF00] hover:text-black text-[11px] font-black transition shrink-0 cursor-pointer"
                          >
                            Pilih
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Source -> Target Merge Form */}
                <div className="p-4 rounded-2xl bg-black border border-white/10 space-y-3.5">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1.5">
                      Team Lama / Salah Ejaan (Akan Digabung)
                    </label>
                    <select
                      value={mergeTeamDraft.sourceName || ''}
                      onChange={(e) => setMergeTeamDraft(prev => ({ ...prev, sourceName: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-[#D7FF00]"
                    >
                      <option value="">-- Pilih team asal --</option>
                      {allManageableTeams.map(t => (
                        <option key={`src_${t.id}_${t.name}`} value={t.name}>
                          {t.name} [{t.tag}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-[#D7FF00]">
                      <GitMerge className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1.5">
                      Team Rasmi / Kekal (Sasaran)
                    </label>
                    <select
                      value={mergeTeamDraft.targetName || ''}
                      onChange={(e) => setMergeTeamDraft(prev => ({ ...prev, targetName: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-[#D7FF00]"
                    >
                      <option value="">-- Pilih team rasmi --</option>
                      {allManageableTeams
                        .filter(t => t.name !== mergeTeamDraft.sourceName)
                        .map(t => (
                          <option key={`tgt_${t.id}_${t.name}`} value={t.name}>
                            {t.name} [{t.tag}]
                          </option>
                        ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Semua rekod match, Elims, WWCD dan mata daripada team lama akan dipindahkan terus ke team rasmi dan disimpan sebagai alias kekal.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMergeTeamDraft(null)}
                    className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={
                      mergeTeamDraft.isSubmitting ||
                      !mergeTeamDraft.sourceName ||
                      !mergeTeamDraft.targetName ||
                      mergeTeamDraft.sourceName === mergeTeamDraft.targetName
                    }
                    onClick={() => handleMergeTeams(mergeTeamDraft.sourceName, mergeTeamDraft.targetName)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-40 text-black text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    {mergeTeamDraft.isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Menggabung...</span>
                      </>
                    ) : (
                      <>
                        <GitMerge className="w-3.5 h-3.5 text-black" />
                        <span>Gabung Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : editingTeam ? (
              <div className="space-y-4 overflow-y-auto pr-0.5 flex-1 overscroll-contain">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setLogoCropSource(null);
                      setEditingTeam(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-[#D7FF00] transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali ke Senarai</span>
                  </button>
                  <span className="text-[10px] text-zinc-500 font-mono font-bold truncate max-w-[150px]">
                    {editingTeam.id}
                  </span>
                </div>

                {/* Logo Editor Card */}
                <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-3">
                  <label className="block text-[11px] uppercase font-bold text-zinc-400">
                    Gambar Logo Pasukan
                  </label>
                  <div className="flex items-center gap-4">
                    {editingTeam.logo_url ? (
                      <div className="relative group shrink-0">
                        <img
                          src={editingTeam.logo_url}
                          alt="Logo Preview"
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-[#D7FF00]/50 shadow-[0_0_20px_rgba(215,255,0,0.2)]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingTeam(prev => ({ ...prev, logo_url: '' }))}
                          title="Buang logo"
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow cursor-pointer transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-zinc-900 border border-dashed border-white/20 flex flex-col items-center justify-center text-zinc-500 shrink-0">
                        <Camera className="w-6 h-6 mb-1 text-zinc-500" />
                        <span className="text-[9px] font-bold">Tiada Logo</span>
                      </div>
                    )}

                    <div className="space-y-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={isUploadingTeamLogo}
                        className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-white/10 active:scale-[0.98]"
                      >
                        {isUploadingTeamLogo ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D7FF00]" />
                            <span>Memuat naik...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-[#D7FF00]" />
                            <span>Pilih &amp; Crop Gambar</span>
                          </>
                        )}
                      </button>

                      {editingTeam.logo_url && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleOpenExistingLogoCrop}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-bold text-[#D7FF00] inline-flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-[0.98]"
                          >
                            <Crop className="w-3 h-3" />
                            <span>Crop Logo Ini</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTeam(prev => ({ ...prev, logo_url: '' }))}
                            className="py-1.5 px-2.5 rounded-xl text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            Padam
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Atau paste link URL gambar:
                    </label>
                    <input
                      type="url"
                      value={editingTeam.logo_url || ''}
                      onChange={(e) => setEditingTeam(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://... (PNG/JPG/WEBP)"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D7FF00] font-mono transition placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Team Name & Tag Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1.5">
                      Nama Penuh Pasukan
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTeam.name || ''}
                      onChange={(e) => setEditingTeam(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="cth: Geek Fam MY"
                      className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D7FF00] font-bold transition placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-bold text-zinc-400 mb-1.5">
                      Tag Singkatan Pasukan (Contoh: GEEK, SEM9)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editingTeam.tag || ''}
                      onChange={(e) => setEditingTeam(prev => ({ ...prev, tag: e.target.value.toUpperCase() }))}
                      placeholder="cth: GEEK"
                      className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D7FF00] font-mono font-bold transition uppercase placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                {/* Quick Merge Shortcut */}
                {!editingTeam._isNew && (
                  <button
                    type="button"
                    onClick={() => {
                      const original = editingTeam._originalName || editingTeam.name;
                      setMergeTeamDraft({
                        sourceName: original,
                        targetName: '',
                        isSubmitting: false
                      });
                    }}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-300 hover:text-[#D7FF00] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <GitMerge className="w-3.5 h-3.5 text-[#D7FF00]" />
                    <span>Gabung team ini ke team lain...</span>
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSavingTeam || !editingTeam.name?.trim()}
                    onClick={() => handleSaveTeamDetails(editingTeam)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-50 text-black text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(215,255,0,0.2)] active:scale-[0.98]"
                  >
                    {isSavingTeam ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-black" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* View B: Search and Simple Team List */
              <>
                {/* Search Bar & Add Button */}
                <div className="space-y-2.5 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={teamManagerSearch}
                      onChange={(e) => setTeamManagerSearch(e.target.value)}
                      placeholder="Cari nama atau tag pasukan..."
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white focus:outline-none focus:border-[#D7FF00] font-medium transition placeholder:text-zinc-500"
                    />
                    {teamManagerSearch && (
                      <button
                        type="button"
                        onClick={() => setTeamManagerSearch('')}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] gap-2">
                    <span className="text-zinc-400 font-mono">
                      {filteredManageableTeams.length} team
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const firstPair = potentialDuplicatePairs[0];
                          setMergeTeamDraft({
                            sourceName: firstPair?.source?.name || '',
                            targetName: firstPair?.target?.name || '',
                            isSubmitting: false
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-200 hover:text-[#D7FF00] font-bold transition cursor-pointer"
                      >
                        <GitMerge className="w-3 h-3 text-[#D7FF00]" />
                        <span>Gabung Team</span>
                        {potentialDuplicatePairs.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black">
                            {potentialDuplicatePairs.length}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeam({
                            id: 'tm_new_' + Date.now().toString(36),
                            name: '',
                            tag: '',
                            logo_url: '',
                            _isNew: true
                          });
                        }}
                        className="inline-flex items-center gap-1 text-[#D7FF00] hover:underline font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Team</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team List */}
                <div className="space-y-2 overflow-y-auto pr-0.5 flex-1 min-h-0 overscroll-contain">
                  {filteredManageableTeams.length > 0 ? (
                    filteredManageableTeams.map((team) => {
                      return (
                        <div
                          key={team.id || team.name}
                          className="p-3 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3 transition group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {team.logo_url ? (
                              <img
                                src={team.logo_url}
                                alt={team.name}
                                className="w-11 h-11 rounded-2xl object-cover shrink-0 border border-white/10 shadow-sm"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-xs text-[#D7FF00] shrink-0">
                                {team.tag || team.name.slice(0, 3).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-bold text-white leading-snug break-words group-hover:text-[#D7FF00] transition">
                                {team.name}
                              </h4>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>Tag: <strong className="text-zinc-300">[{team.tag}]</strong></span>
                                {team.logo_url ? (
                                  <span className="text-emerald-400 flex items-center gap-0.5">
                                    <Check className="w-2.5 h-2.5" /> Ada Logo
                                  </span>
                                ) : (
                                  <span className="text-zinc-500">Tiada Logo</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTeam({
                                ...team,
                                _originalName: team.name
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 group-hover:bg-[#D7FF00] text-zinc-300 group-hover:text-black border border-white/10 group-hover:border-transparent text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      Tak jumpa team "{teamManagerSearch}".
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isCreateScrimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsCreateScrimOpen(false)} />
          <div className="relative w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 space-y-4 z-10 animate-card-entrance max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center font-black">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Create Session</h3>
                  <p className="text-[11px] text-zinc-400">Data Saved</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateScrimOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center bg-zinc-900 p-1 rounded-2xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setNewEventType('Scrim')}
                className={'flex-1 py-2 rounded-xl font-black transition flex items-center justify-center gap-1.5 ' + (
                  newEventType === 'Scrim'
                    ? 'bg-[#D7FF00] text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Scrim</span>
              </button>
              <button
                type="button"
                onClick={() => setNewEventType('Tour')}
                className={'flex-1 py-2 rounded-xl font-black transition flex items-center justify-center gap-1.5 ' + (
                  newEventType === 'Tour'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Tournament</span>
              </button>
            </div>

            <form onSubmit={handleCreateNewScrim} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">
                  {newEventType === 'Tour' ? 'Nama Tournament' : 'Nama Sesi Scrim'}
                </label>
                <input
                  type="text"
                  placeholder={newEventType === 'Tour' ? 'cth: PMSL SEA Qualifier Season 2' : 'cth: Pro Night Scrim Fast 5 Maps'}
                  value={newScrimTitle}
                  onChange={(e) => setNewScrimTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FF00] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">Kategori / Tier</label>
                  <select
                    value={newScrimTier}
                    onChange={(e) => setNewScrimTier(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-[#D7FF00] font-semibold"
                  >
                    {TIER_OPTIONS.map(t => (
                      <option key={t} value={t} className="bg-zinc-950 text-white">{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">Tarikh</label>
                  <input
                    type="date"
                    value={newScrimDate}
                    onChange={(e) => setNewScrimDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#D7FF00] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">Nama Penganjur / Host</label>
                <input
                  type="text"
                  placeholder="cth: RYKHOR Esports"
                  value={newHostName}
                  onChange={(e) => setNewHostName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">Penerangan / Peraturan (Pada Poster)</label>
                <input
                  type="text"
                  placeholder="cth: 16 Pasukan Jemputan, sistem mata rasmi PMGC"
                  value={newScrimDesc}
                  onChange={(e) => setNewScrimDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">Logo Kejohanan (Opsional)</label>
                <label className="flex items-center justify-center gap-1.5 w-full bg-zinc-900 hover:bg-zinc-850 border border-dashed border-white/15 rounded-xl px-3 py-2.5 text-zinc-300 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span className="truncate">{logoFile ? logoFile.name : 'Pilih Fail Logo Dari Peranti'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateScrimOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploadingLogo}
                  className="px-5 py-2.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition shadow-[0_0_15px_rgba(215, 255, 0,0.2)] active:scale-95 disabled:opacity-50"
                >
                  {isUploadingLogo ? 'Memproses...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EVENT SETTINGS */}
      {isEditScrimModalOpen && (
        <div
          onClick={() => {
            setIsEditScrimModalOpen(false);
            setEditTargetScrim(null);
          }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88dvh] sm:max-h-[90vh] flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-5 pb-3 shrink-0">
              <h3 id="edit-scrim-modal-title" className="font-black text-sm text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#D7FF00]"/>
                <span>Edit Event Settings</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="edit-scrim-form"
                  disabled={isSavingEdit}
                  className="sm:hidden px-3.5 py-1.5 rounded-full bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-50 text-black font-black text-xs active:scale-95 transition shadow-sm"
                >
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditScrimModalOpen(false);
                    setEditTargetScrim(null);
                  }} 
                  aria-label="Tutup modal edit"
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form
              id="edit-scrim-form"
              aria-labelledby="edit-scrim-modal-title"
              onSubmit={handleUpdateScrimSettings}
              className="flex flex-col flex-1 min-h-0 text-xs"
            >
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3.5 overscroll-contain">
                <div className="bg-zinc-900/60 border border-white/5 text-zinc-300 p-2.5 rounded-2xl flex items-center gap-2 text-xs">
                  <Info className="w-4 h-4 text-[#D7FF00] shrink-0" />
                  <span className="leading-snug">
                    Tukar <strong>nama sesi</strong>, <strong>tarikh</strong>, <strong>logo</strong> &amp; <strong>description</strong> kat sini.
                  </span>
                </div>

                <div>
                  <span className="block text-zinc-400 uppercase font-bold mb-1">Event Category</span>
                  <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditEventType('Scrim')}
                      className={'flex-1 py-1.5 rounded-lg font-black transition ' + (editEventType === 'Scrim' ? 'bg-[#D7FF00] text-black shadow-xs' : 'text-zinc-400 hover:text-white')}
                    >
                      Scrim
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditEventType('Tour')}
                      className={'flex-1 py-1.5 rounded-lg font-black transition ' + (editEventType === 'Tour' ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white')}
                    >
                      Tournament
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label htmlFor="edit-scrim-title" className="block text-zinc-400 uppercase font-bold mb-1">
                      Event Title <span aria-hidden="true" className="text-[#D7FF00]">*</span>
                    </label>
                    <input
                      id="edit-scrim-title"
                      name="title"
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 min-h-[44px] sm:min-h-[40px] text-base sm:text-xs text-white placeholder-zinc-500 focus:outline-none focus-visible:border-[#D7FF00] focus-visible:ring-1 focus-visible:ring-[#D7FF00] font-semibold"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-scrim-date" className="block text-zinc-400 uppercase font-bold mb-1">
                      Tarikh Sesi <span aria-hidden="true" className="text-[#D7FF00]">*</span>
                    </label>
                    <input
                      id="edit-scrim-date"
                      name="date"
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 min-h-[44px] sm:min-h-[40px] text-base sm:text-xs text-white [color-scheme:dark] focus:outline-none focus-visible:border-[#D7FF00] focus-visible:ring-1 focus-visible:ring-[#D7FF00] font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="edit-scrim-host" className="block text-zinc-400 uppercase font-bold mb-1">
                      Host / Organizer Name <span aria-hidden="true" className="text-[#D7FF00]">*</span>
                    </label>
                    <input
                      id="edit-scrim-host"
                      name="host_name"
                      type="text"
                      required
                      value={editHostName}
                      onChange={(e) => setEditHostName(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 min-h-[44px] sm:min-h-[40px] text-base sm:text-xs text-white placeholder-zinc-500 focus:outline-none focus-visible:border-[#D7FF00] focus-visible:ring-1 focus-visible:ring-[#D7FF00] font-semibold"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-scrim-tier" className="block text-zinc-400 uppercase font-bold mb-1">Tier / Division</label>
                    <select
                      id="edit-scrim-tier"
                      name="tier"
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 min-h-[44px] sm:min-h-[40px] text-base sm:text-xs text-white focus:outline-none focus-visible:border-[#D7FF00] focus-visible:ring-1 focus-visible:ring-[#D7FF00] font-semibold"
                    >
                      {TIER_OPTIONS.map(t => (
                        <option key={t} value={t} className="bg-zinc-950 text-white">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <span className="block text-zinc-400 uppercase font-bold mb-1">Change Event Logo (Optional)</span>
                  <label className="flex items-center justify-center gap-2 w-full bg-zinc-900/80 hover:bg-zinc-800 border border-dashed border-white/15 rounded-xl p-2.5 min-h-[44px] text-zinc-300 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-[#D7FF00]"/>
                    <span className="truncate">{editLogoFile ? editLogoFile.name : 'Choose new event logo image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditLogoFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="edit-scrim-contact" className="block text-zinc-400 uppercase font-bold mb-1">Host Contact</label>
                  <input
                    id="edit-scrim-contact"
                    name="host_contact"
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    placeholder="e.g. +60123456789"
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 min-h-[44px] sm:min-h-[40px] text-base sm:text-xs text-white placeholder-zinc-500 focus:outline-none focus-visible:border-[#D7FF00] focus-visible:ring-1 focus-visible:ring-[#D7FF00]"
                  />
                </div>

                <div>
                  <label htmlFor="edit-scrim-desc" className="block text-zinc-400 uppercase font-bold mb-1">Description & Rules (Shown on Poster)</label>
                  <textarea
                    id="edit-scrim-desc"
                    name="description"
                    rows="2"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-base sm:text-xs text-white placeholder-zinc-500 resize-y focus:outline-none focus-visible:border-[#D7FF00] focus-visible:ring-1 focus-visible:ring-[#D7FF00]"
                  />
                </div>
              </div>

              {/* Pinned Bottom Footer with Safe Area Padding & Full Touch Targets */}
              <div className="flex items-center gap-2.5 p-3.5 sm:p-4 pb-6 sm:pb-4 border-t border-white/10 bg-zinc-950 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditScrimModalOpen(false);
                    setEditTargetScrim(null);
                  }}
                  className="w-1/3 sm:w-auto px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold active:scale-95 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="w-2/3 sm:flex-1 px-5 py-3 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-50 text-black font-black text-xs sm:text-sm shadow-md active:scale-95 transition text-center"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PUBLIC DETAILS MODAL */}
      {inspectedScrim && (
        <div
          onClick={() => setInspectedScrim(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-3xl max-w-2xl lg:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-4 lg:space-y-5 animate-card-entrance"
          >
            
            <div className="flex items-start justify-between border-b border-white/5 pb-3.5 gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {inspectedScrim.logo_url ? (
                  <img src={inspectedScrim.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-sm shrink-0 mt-0.5" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-[#D7FF00] font-black flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    {inspectedScrim.event_type === 'Tour' ? (
                      <Trophy className="w-5 h-5 text-[#D7FF00]" />
                    ) : (
                      <Flame className="w-5 h-5 text-[#D7FF00]" />
                    )}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug break-words">
                    {inspectedScrim.title}
                  </h3>

                  {/* Clean, Non-overlapping Metadata Badges */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={'text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono shrink-0 ' + (
                      inspectedScrim.event_type === 'Tour'
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/30'
                    )}>
                      {(inspectedScrim.event_type || 'Scrim').toUpperCase()}
                    </span>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-white/10 font-mono shrink-0">
                      {inspectedScrim.tier || 'Tier 1'}
                    </span>

                    {isAuthorizedAdmin(inspectedScrim) ? (
                      <button
                        type="button"
                        onClick={() => openEditScrimModal(inspectedScrim)}
                        title="Klik untuk ubah tarikh sesi"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-300 hover:text-[#D7FF00] bg-zinc-900/60 hover:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-white/5 hover:border-[#D7FF00]/40 transition shrink-0 cursor-pointer"
                      >
                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                        <span>{inspectedScrim.date || 'Set Tarikh'}</span>
                        <Edit3 className="w-2.5 h-2.5 text-[#D7FF00]" />
                      </button>
                    ) : (
                      inspectedScrim.date && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-zinc-900/60 px-2.5 py-0.5 rounded-full border border-white/5 shrink-0">
                          <Clock className="w-2.5 h-2.5 text-zinc-500" />
                          <span>{inspectedScrim.date}</span>
                        </span>
                      )
                    )}

                    {inspectedScrim.is_finished && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-[#D7FF00] text-black font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Final</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setInspectedScrim(null)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition shrink-0 cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-900/60 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Host / Organizer</span>
                <span className="font-bold text-white">{inspectedScrim.host_name || 'Official Host'}</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">{inspectedScrim.description}</p>
              </div>

              {inspectedScrim.host_contact && (
                <a
                  href={inspectedScrim.host_contact.startsWith('http') 
                    ? inspectedScrim.host_contact 
                    : (inspectedScrim.host_contact.replace(/[^0-9]/g, '').length >= 9
                      ? 'https://wa.me/' + inspectedScrim.host_contact.replace(/[^0-9]/g, '')
                      : 'https://t.me/' + inspectedScrim.host_contact.replace('@', ''))
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs flex items-center gap-1 shadow-sm transition"
                >
                  <MessageCircle className="w-3.5 h-3.5"/>
                  <span>Mesej</span>
                </a>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D7FF00] animate-pulse"></span>
                  <span>Live Official Standings</span>
                </span>
              </div>

              <div className="space-y-1.5 h-60 overflow-y-auto">
                {calculateLeaderboard(inspectedScrim, 'overall').map((teamRow) => (
                  <div
                    key={teamRow.teamId}
                    className="p-2.5 bg-zinc-900/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={'w-6 text-center font-black ' + (teamRow.rank === 1 ? 'text-[#D7FF00]' : 'text-zinc-500')}>
                        #{teamRow.rank}
                      </span>
                      <span className="font-bold text-white">{teamRow.teamName}</span>
                      {teamRow.wwcd > 0 && (
                        <span className="text-[9px] text-[#D7FF00] bg-[#D7FF00]/10 border border-[#D7FF00]/20 px-1.5 py-0.2 rounded font-mono font-bold">
                          WWCD{teamRow.wwcd > 1 ? ` x${teamRow.wwcd}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-right font-mono shrink-0">
                      <span className="hidden sm:inline text-zinc-500 text-[11px]">{teamRow.placePts} P</span>
                      <span className="text-zinc-400 text-[11px]">{teamRow.killPts} Elims</span>
                      <span className="text-[#D7FF00] font-black text-sm">{teamRow.totalPts} PTS</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono text-center pt-1">
                *Susunan ikut Total PTS → Placement PTS → Elim PTS → WWCD.
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {isAuthorizedAdmin(inspectedScrim) ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditScrimModal(inspectedScrim)}
                      className="px-3.5 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(215,255,0,0.18)] cursor-pointer active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5"/>
                      <span>Ubah Info &amp; Tarikh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAdminSelectedScrimId(inspectedScrim.id);
                        setInspectedScrim(null);
                        navigateToTab('admin');
                      }}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5"/>
                      <span>Portal Host</span>
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-[11px] font-semibold text-zinc-400">
                    <Lock className="w-3 h-3 text-zinc-500" />
                    <span>Lihat Sahaja</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyDiscordText(inspectedScrim)}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-zinc-400"/>
                  <span>Salin Teks</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectedScrim(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: SHOWCASE POST DETAIL MODAL */}
      {inspectedPost && (
        <div
          onClick={() => setInspectedPost(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 animate-card-entrance"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D7FF00] text-black font-mono">
                  {inspectedPost.rank || 'Featured'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">{inspectedPost.date}</span>
              </div>
              <button 
                onClick={() => setInspectedPost(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Display */}
            <div className="relative bg-zinc-900/50 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 p-2 sm:p-4">
              {inspectedPost.platform === 'tiktok' ? (
                <TikTokPreviewCard post={inspectedPost} />
              ) : inspectedPost.media_type === 'video' ? (
                <div className="w-full aspect-video">
                  <video src={inspectedPost.media_url} controls className="w-full h-full object-cover rounded-xl" />
                </div>
              ) : (
                <div className="w-full aspect-video">
                  <img src={inspectedPost.media_url} alt={inspectedPost.title} className="w-full h-full object-cover rounded-xl" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span className="font-bold text-white">Author: [{inspectedPost.team_tag}] {inspectedPost.author}</span>
                  <span className="font-mono text-[#D7FF00] font-bold">{inspectedPost.tournament}</span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white">{inspectedPost.title}</h2>
              </div>

              <div className="bg-zinc-900/60 p-3.5 rounded-2xl">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Content Details & Caption</span>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{inspectedPost.caption}</p>
              </div>

              {inspectedPost.external_url && (
                <div className="p-3 bg-zinc-900/80 border border-[#D7FF00]/20 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#D7FF00] text-black rounded-xl">
                      {inspectedPost.platform === 'tiktok' ? <TikTokIcon className="w-4 h-4"/> : inspectedPost.platform === 'instagram' ? <InstagramIcon className="w-4 h-4"/> : <LinkIcon className="w-4 h-4"/>}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">Linked on {inspectedPost.platform ? inspectedPost.platform.toUpperCase() : 'External Platform'}</span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-xs block">{inspectedPost.external_url}</span>
                    </div>
                  </div>

                  <a
                    href={inspectedPost.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-bold text-xs rounded-xl flex items-center gap-1 transition"
                  >
                    <span>Pautan</span>
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectedPost(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: PUBLISH CONTENT WITH SOCIAL MEDIA / FILE OPTIONS */}
      {isShowcaseModalOpen && (
        <div
          onClick={() => setIsShowcaseModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-modal rounded-3xl max-w-lg w-full p-6 space-y-4 animate-card-entrance"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D7FF00]"/>
                <span>Post Your Content</span>
              </h3>
              <button 
                onClick={() => setIsShowcaseModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShowcasePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Source Type</label>
                <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPostSourceMode('upload')}
                    className={'flex-1 py-1.5 rounded-lg font-black transition ' + (postSourceMode === 'upload' ? 'bg-[#D7FF00] text-black shadow-xs' : 'text-zinc-400 hover:text-white')}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostSourceMode('social_link')}
                    className={'flex-1 py-1.5 rounded-lg font-black transition ' + (postSourceMode === 'social_link' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-white')}
                  >
                    TikTok / Instagram Link
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Final Matchday Highlights"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00] font-semibold"
                />
              </div>

              {postSourceMode === 'upload' ? (
                <div>
                  <label className="block text-zinc-400 uppercase font-bold mb-1">Select File from Device</label>
                  <label className="flex items-center justify-center gap-2 w-full bg-zinc-900/80 hover:bg-zinc-800 border border-dashed border-white/15 rounded-xl p-3 text-zinc-300 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-[#D7FF00]"/>
                    <span className="font-medium truncate">{showcaseFile ? showcaseFile.name : 'Click to Upload Image / MP4 Video'}</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setShowcaseFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-zinc-400 uppercase font-bold mb-1">Platform</label>
                      <select
                        value={socialPlatform}
                        onChange={(e) => setSocialPlatform(e.target.value)}
                        className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7FF00] font-semibold"
                      >
                        <option value="instagram" className="bg-zinc-950 text-white">Instagram</option>
                        <option value="tiktok" className="bg-zinc-950 text-white">TikTok</option>
                        <option value="youtube" className="bg-zinc-950 text-white">YouTube</option>
                        <option value="web" className="bg-zinc-950 text-white">Other Website Link</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 uppercase font-bold mb-1">Content Badge</label>
                      <input
                        type="text"
                        value={postRankBadge}
                        onChange={(e) => setPostRankBadge(e.target.value)}
                        placeholder="e.g. Viral Clip"
                        className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-bold mb-1">Platform URL</label>
                    <input
                      type="url"
                      required
                      value={externalSocialUrl}
                      onChange={(e) => setExternalSocialUrl(e.target.value)}
                      placeholder="https://www.tiktok.com/@... or https://instagram.com/reel/..."
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Caption / Tournament Info</label>
                <textarea
                  rows="3"
                  placeholder="Share details, team tags, or requirements..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingShowcase}
                  className="px-5 py-2 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black shadow-[0_0_20px_rgba(215, 255, 0,0.18)]"
                >
                  {isUploadingShowcase ? 'Publishing...' : 'Publish Content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CREATE ACTION SHEET MODAL (+ NAVBAR 3-SELECTION MENU) */}
      {isQuickCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setIsQuickCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-sm glass-modal rounded-3xl p-5 space-y-4 z-10 animate-card-entrance">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center font-black shadow-sm">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Cipta atau Imbas</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateModalOpen(false)}
                className="w-7 h-7 rounded-full glass-tile glass-tile-hover flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Quick Scorer */}
              <button
                type="button"
                onClick={() => {
                  setIsQuickCreateModalOpen(false);
                  navigateToTab('scorer');
                }}
                className="w-full p-3.5 rounded-2xl glass-tile glass-tile-hover transition flex items-center gap-3 text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Edit3 className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-white block">Quick Scorer</span>
                  <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                    Kira Markah, Simpan Cloud &amp; Eksport Poster HD
                  </p>
                </div>
              </button>

              {/* Option 2: Results Scanner */}
              <button
                type="button"
                onClick={() => {
                  setIsQuickCreateModalOpen(false);
                  navigateToTab('scrim-data');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#D7FF00]/10 hover:bg-[#D7FF00]/15 border border-[#D7FF00]/25 transition flex items-center gap-3 text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl glass-tile text-[#D7FF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-white block">Imbas Keputusan</span>
                  <p className="text-[11px] text-zinc-200 leading-snug mt-0.5">
                    Upload poster untuk extract &amp; check markah.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK IMPORT DARI WHATSAPP / DISCORD MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setIsImportModalOpen(false)}
          />
          <div className="relative w-full max-w-lg glass-modal rounded-3xl p-5 sm:p-6 space-y-4 z-10 animate-card-entrance">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-black shadow-sm">
                  <Copy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Import Pasukan (WhatsApp / Teks)</h3>
                  <p className="text-[11px] text-zinc-400">Paste list team dari WhatsApp atau Discord</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-900/60 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Format Yang Boleh Masuk:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-mono text-[10px]">
                  1. Geek Fam<br/>
                  2. SEM9 Esports<br/>
                  3. Yoodo Alliance<br/>
                  Slot 4: Vampire Esports...
                </p>
                <p className="text-[10px] text-zinc-400">Nombor, bullet &amp; &quot;Slot&quot; akan auto-clean untuk semua 5 match.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase mb-1">
                  Tampal Senarai Pasukan Di Sini:
                </label>
                <textarea
                  rows={6}
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`1. Geek Fam\n2. SEM9\n3. Yoodo Alliance\n4. Vampire Esports\n5. Bigetron RA\n...`}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl p-3 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400 font-medium">
                  {importRawText.trim() ? `${importRawText.trim().split(/\r?\n/).filter(l => l.trim().length > 0).length} baris` : 'Tunggu input...'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportRawText('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-900 border border-white/10 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleParseAndImportTeams}
                    disabled={!importRawText.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black rounded-xl text-xs transition shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Sahkan &amp; Isi Slot</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SCORER SEARCHABLE SESSION PICKER SHEET / PALETTE (Handles 100+ sessions cleanly on Mobile & PC) */}
      {isSessionPickerOpen && (() => {
        const q = sessionPickerQuery.trim().toLowerCase();
        const filteredPickerScrims = adminHostedScrims.filter((s) => {
          if (sessionPickerFilter === 'ACTIVE' && s.is_finished) return false;
          if (sessionPickerFilter === 'LOCKED' && !s.is_finished) return false;
          if (sessionPickerFilter === 'Scrim' && (s.event_type || 'Scrim') !== 'Scrim') return false;
          if (sessionPickerFilter === 'Tour' && s.event_type !== 'Tour') return false;
          if (!q) return true;
          return (
            (s.title || '').toLowerCase().includes(q) ||
            (s.date || '').toLowerCase().includes(q) ||
            (s.tier || '').toLowerCase().includes(q) ||
            (s.event_type || '').toLowerCase().includes(q)
          );
        });

        const activeCount = adminHostedScrims.filter(s => !s.is_finished).length;
        const lockedCount = adminHostedScrims.filter(s => Boolean(s.is_finished)).length;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-picker-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                setIsSessionPickerOpen(false);
              }
            }}
            className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
            onClick={() => setIsSessionPickerOpen(false)}
          >
            <div
              aria-hidden="true"
              className="fixed inset-0 cursor-pointer"
              onClick={() => setIsSessionPickerOpen(false)}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full sm:max-w-lg glass-modal rounded-t-3xl sm:rounded-3xl flex flex-col h-[76dvh] sm:h-[74vh] overflow-hidden animate-drawer-up"
            >
              {/* Mobile Drag Handle */}
              <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Sticky Top Header + Quick New CTA + Search + Filter Pills */}
              <div className="p-4 sm:p-5 pb-3 space-y-3 shrink-0 bg-white/[0.04] border-b border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 id="session-picker-title" className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                      Pilih Sesi Scorer
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 shrink-0">
                      {adminHostedScrims.length} Sesi
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSessionPickerOpen(false);
                        handleQuickNewSession();
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#D7FF00] hover:bg-[#c2e600] text-black text-xs font-black flex items-center gap-1 shadow-[0_0_16px_rgba(215,255,0,0.2)] transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Sesi Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSessionPickerOpen(false)}
                      aria-label="Tutup pemilih sesi"
                      className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    enterKeyHint="search"
                    value={sessionPickerQuery}
                    onChange={(e) => setSessionPickerQuery(e.target.value)}
                    placeholder="Cari nama sesi, tarikh atau tier..."
                    className="w-full bg-black border border-zinc-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white font-semibold placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D7FF00]/60 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {sessionPickerQuery && (
                    <button
                      type="button"
                      onClick={() => setSessionPickerQuery('')}
                      aria-label="Kosongkan carian"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Compact Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pr-6">
                  {[
                    { key: 'ALL', label: `Semua (${adminHostedScrims.length})` },
                    { key: 'ACTIVE', label: `Aktif (${activeCount})` },
                    { key: 'LOCKED', label: `Locked (${lockedCount})` },
                    { key: 'Scrim', label: 'Scrim' },
                    { key: 'Tour', label: 'Tournament' }
                  ].map((chip) => {
                    const isChipActive = sessionPickerFilter === chip.key;
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setSessionPickerFilter(chip.key)}
                        className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-95 ${
                          isChipActive
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable Bounded Session List (Fixed window height + animated filter switch) */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 [scrollbar-gutter:stable]">
                <div key={sessionPickerFilter} className="space-y-1.5 min-h-full animate-filter-reveal">
                {filteredPickerScrims.length > 0 ? (
                  filteredPickerScrims.map((s) => {
                    const isSelected = s.id === adminSelectedScrimId;
                    const isTour = s.event_type === 'Tour';
                    const isLocked = Boolean(s.is_finished);
                    const matchCount = s.matches?.length || s.total_matches || 1;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedMatchIdx(0);
                          setAdminSelectedScrimId(s.id);
                          setIsSessionPickerOpen(false);
                          setSessionPickerQuery('');
                        }}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`w-full text-left rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 transition cursor-pointer group active:scale-[0.99] ${
                          isSelected
                            ? 'bg-[#D7FF00]/15 shadow-[0_0_18px_rgba(215,255,0,0.08)]'
                            : 'bg-black border border-zinc-800/80 hover:bg-zinc-950'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {s.logo_url ? (
                            <img
                              src={s.logo_url}
                              alt=""
                              className="w-9 h-9 rounded-xl object-cover shrink-0 bg-zinc-900"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isTour
                                  ? 'bg-amber-500/18 text-amber-300'
                                  : 'bg-[#D7FF00]/14 text-[#D7FF00]'
                              }`}
                            >
                              {isTour ? <Trophy className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`text-xs sm:text-sm font-black truncate ${
                                  isSelected ? 'text-[#D7FF00]' : 'text-white group-hover:text-[#D7FF00] transition-colors'
                                }`}
                              >
                                {s.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5 truncate">
                              <span>{isTour ? 'Tour' : 'Scrim'}</span>
                              <span>•</span>
                              <span>{s.date || 'Tanpa tarikh'}</span>
                              <span>•</span>
                              <span>{matchCount}M</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isLocked
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {isLocked && <Lock className="w-2.5 h-2.5" />}
                            <span>{isLocked ? 'Locked' : 'Aktif'}</span>
                          </span>

                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-[#D7FF00] text-black flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-10 text-center space-y-2.5">
                    <p className="text-xs text-zinc-400">
                      Tak jumpa sesi untuk filter ni.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSessionPickerQuery('');
                        setSessionPickerFilter('ALL');
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-[#D7FF00] transition cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MINIMALIST FLOATING PILL MOBILE NAVBAR (FIXED SLOTS, ZERO JITTER, SLEEK & THIN) */}
      <nav
        aria-label="Mobile Navigation"
        className={'md:hidden fixed bottom-3 sm:bottom-4 inset-x-0 mx-auto z-50 w-[calc(100%-2rem)] max-w-[340px] pointer-events-auto ' + (isEditScrimModalOpen ? 'hidden pointer-events-none' : '')}
      >
        <div className="glass-dock rounded-full px-2 py-1.5 flex items-center justify-between [text-shadow:0_1px_4px_rgba(0,0,0,0.65)]">
          
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => navigateToTab('playground')}
            title="Laman Utama"
            aria-label="Home"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 ' + (
              activeTab === 'playground' || activeTab === 'home'
                ? 'text-[#D7FF00]'
                : 'text-zinc-200 hover:text-white'
            )}
          >
            <Home className={'w-5 h-5 ' + (activeTab === 'playground' || activeTab === 'home' ? 'stroke-[2.2]' : 'stroke-[1.75]')} />
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'playground' || activeTab === 'home' ? 'font-bold' : 'font-medium')}>
              Home
            </span>
          </button>

          {/* Tab 2: Standings / Rekod */}
          <button
            type="button"
            onClick={() => navigateToTab('history')}
            title="Live Standings & Rekod"
            aria-label="Rekod"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 ' + (
              activeTab === 'history' || activeTab === 'leaderboard'
                ? 'text-[#D7FF00]'
                : 'text-zinc-200 hover:text-white'
            )}
          >
            <Trophy className={'w-5 h-5 ' + (activeTab === 'history' || activeTab === 'leaderboard' ? 'stroke-[2.2]' : 'stroke-[1.75]')} />
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'history' || activeTab === 'leaderboard' ? 'font-bold' : 'font-medium')}>
              Rekod
            </span>
          </button>

          {/* CENTER HERO: [+] Action Menu */}
          <div className="shrink-0 px-1">
            <button
              type="button"
              onClick={() => setIsQuickCreateModalOpen(prev => !prev)}
              title="Cipta atau imbas keputusan"
              aria-label="Open Action Menu"
              className={'relative w-11 h-11 rounded-full flex items-center justify-center select-none -translate-y-2 transition-all duration-200 ease-out active:scale-90 cursor-pointer bg-[#D7FF00] text-black ' + (
                isQuickCreateModalOpen || activeTab === 'scorer' || activeTab === 'scrim-data'
                  ? 'shadow-[0_0_24px_rgba(215,255,0,0.45)] scale-105'
                  : 'shadow-[0_4px_16px_rgba(215,255,0,0.28)] hover:scale-105'
              )}
            >
              <Plus className={'w-5 h-5 text-black stroke-[2.5] transition-transform duration-200 ' + (
                isQuickCreateModalOpen ? 'rotate-45' : 'rotate-0'
              )} />
            </button>
          </div>

          {/* Tab 4: Teams */}
          <button
            type="button"
            onClick={() => navigateToTab('teams')}
            title="Team Matrix & Database Pasukan"
            aria-label="Teams"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 ' + (
              activeTab === 'teams' || activeTab === 'database'
                ? 'text-[#D7FF00]'
                : 'text-zinc-200 hover:text-white'
            )}
          >
            <Users className={'w-5 h-5 ' + (activeTab === 'teams' || activeTab === 'database' ? 'stroke-[2.2]' : 'stroke-[1.75]')} />
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'teams' || activeTab === 'database' ? 'font-bold' : 'font-medium')}>
              Teams
            </span>
          </button>

          {/* Tab 5: Profile */}
          <button
            type="button"
            onClick={() => navigateToTab('profile')}
            title="Profil Pengguna"
            aria-label="Profile"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 relative ' + (
              activeTab === 'profile'
                ? 'text-[#D7FF00]'
                : 'text-zinc-200 hover:text-white'
            )}
          >
            <div className="relative">
              <User className={'w-5 h-5 ' + (activeTab === 'profile' ? 'stroke-[2.2]' : 'stroke-[1.75]')} />
              {currentUser && activeTab !== 'profile' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#D7FF00] border border-zinc-950"></span>
              )}
            </div>
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'profile' ? 'font-black' : 'font-medium')}>
              Profile
            </span>
          </button>

        </div>
      </nav>

    </div>
  );
}