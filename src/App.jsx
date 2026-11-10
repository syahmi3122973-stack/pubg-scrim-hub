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
  Save, 
  RefreshCw, 
  Check, 
  Sparkles, 
  Download, 
  Filter, 
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
  Home
} from 'lucide-react';
import { supabase } from './supabaseClient';
import ScrimDataHubView from './components/ScrimDataHubView';

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
    <div className="relative w-full max-w-[320px] mx-auto aspect-[9/15] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-4 group select-none">
      <img
        src={post.media_url || fallbackThumbnail}
        alt={post.title}
        className="absolute inset-0 w-full h-full object-cover opacity-60 scale-100 group-hover:scale-105 transition-transform duration-500 ease-out"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-slate-950/95" />

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
  { id: 'tm_24', name: 'S2G Esports', tag: 'S2G' }
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
    answer: 'Ya, 100% mematuhi sistem mata rasmi PMGC (WWCD = 10 mata, Tempat Ke-2 = 6 mata, setiap Kill = 1 mata). Sistem turut mengira pemecah seri (Tiebreaker) automatik mengikut keutamaan: Jumlah Mata > Mata Penempatan > Jumlah Kills > Kemenangan WWCD.',
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
      if (['playground', 'home', 'standings', 'leaderboard', 'history', 'teams', 'database', 'hosts', 'showcase', 'about', 'admin', 'scrim-data'].includes(hash)) {
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
        showToast('Maximum 24 teams reached!');
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

      showToast(`Slot #${newSlotNo} ditambah! Jumlah pasukan: ${newSlotNo}`);
      return { ...prev, matches: updatedMatches, synced: false };
    });
  };

  const handleRemovePlaygroundTeam = () => {
    setPlaygroundSession(prev => {
      const currentCount = prev.matches[0]?.slots?.length || 16;
      if (currentCount <= 2) {
        showToast('Minimum 2 pasukan diperlukan!');
        return prev;
      }
      const updatedMatches = prev.matches.map(m => ({
        ...m,
        slots: m.slots.slice(0, -1)
      }));

      showToast(`Slot #${currentCount} dipadam. Jumlah pasukan: ${currentCount - 1}`);
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
      showToast('Tiada nama pasukan dikesan. Sila pastikan teks mengandungi senarai nama.');
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
      showToast(`Berjaya import ${extracted.length} pasukan ke sesi Host.`);
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

    showToast(`Berjaya import ${extracted.length} pasukan ke semua 5 perlawanan.`);
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
    if (!window.confirm('Kosongkan semua markah untuk kesemua 5 match? (Nama team dikekalkan)')) return;
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
    showToast('Markah dikosongkan! Sedia untuk rekod baru.');
  };

  const handleResetPlaygroundToDefault = () => {
    if (!window.confirm('Reset semula borang ke 16 slot kosong asal?')) return;
    setPlaygroundSession(createDefaultPlaygroundSession(16));
    setCurrentPlaygroundMatchIdx(0);
    showToast('Borang dikosongkan ke format asal (16 slot bersih)!');
  };

  const handleLoadDemoPlaygroundData = () => {
    setPlaygroundSession(createDemoPlaygroundSession(16));
    setCurrentPlaygroundMatchIdx(0);
    showToast('Data contoh demo dimuatkan! Anda boleh lihat contoh kiraan & rupa poster.');
    setTimeout(() => {
      const el = document.getElementById('quick-scorer-workspace');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const navigateToTab = (tab) => {
    setIsQuickCreateModalOpen(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 15);
  };

  const handleStartScoringSession = () => {
    navigateToTab('scorer');
  };

  const handleOpenGuide = (slideIdx = 0) => {
    setCurrentGuideSlide(slideIdx);
    setIsGuideModalOpen(true);
    setIsNavMenuOpen(false);
    try {
      if (window.location.hash !== '#guide') {
        window.history.pushState(null, '', '#guide');
      }
    } catch {}
  };

  const handleCloseGuide = () => {
    setIsGuideModalOpen(false);
    try {
      if (window.location.hash === '#guide' || window.location.hash === '#panduan' || window.location.hash === '#tutorial') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {}
  };

  const handleCopyGuideLink = () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#guide`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link panduan disalin ke papan klip.');
        }).catch(() => {
          showToast(`Link panduan: ${url}`);
        });
      } else {
        showToast(`Link panduan: ${url}`);
      }
    } catch {
      showToast('Pautan: ' + window.location.href);
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
      showToast('Overall Leaderboard PNG berjaya dimuat turun.');
    } catch (err) {
      console.error('Error generating poster:', err);
      showToast('Failed to download poster: ' + err.message);
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
      showToast('Poster Standings PNG berjaya dimuat turun.');
    } catch (err) {
      console.error('Error generating poster:', err);
      showToast('Gagal memuat turun poster: ' + err.message);
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
        if (!teams.some(t => t.name.toLowerCase() === tName.toLowerCase())) {
          newTeamsToRegister.push({
            id: 'tm_' + tName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36),
            name: tName,
            tag: tName.slice(0, 4).toUpperCase()
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

      showToast('5 Match disimpan ke Dashboard & Rekod Prestasi Pasukan dikemaskini.');
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
  
  const [teams, setTeams] = useState(INITIAL_FALLBACK_TEAMS);
  const [scrims, setScrims] = useState([]);
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedScrimId, setSelectedScrimId] = useState('');
  const [adminSelectedScrimId, setAdminSelectedScrimId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const [tierFilter, setTierFilter] = useState('All');
  const [searchScrimQuery, setSearchScrimQuery] = useState('');
  const [leaderboardEventTypeFilter, setLeaderboardEventTypeFilter] = useState('All');
  const [teamStatsCategory, setTeamStatsCategory] = useState('ALL');

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Modals
  const [inspectedScrim, setInspectedScrim] = useState(null);
  const [inspectedPost, setInspectedPost] = useState(null);
  const [isEditScrimModalOpen, setIsEditScrimModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceTeam, setPerformanceTeam] = useState(null);
  const [selectedPerformanceHost, setSelectedPerformanceHost] = useState('ALL');
  const [performanceModalCategory, setPerformanceModalCategory] = useState('ALL');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Feedback Modal
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Bug Report');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const [searchHostQuery, setSearchHostQuery] = useState('');

  // User Profile States
  const [profileName, setProfileName] = useState('');
  const [profileContact, setProfileContact] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || null;
      setCurrentUser(user);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const u = session?.user || null;
        setCurrentUser(u);
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
        }
      });

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });

      if (teamsData && teamsData.length > 0) {
        setTeams(teamsData);
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
        showToast('Registration Error: ' + error.message);
      } else {
        showToast('Registration complete! Please sign in.');
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
        showToast('Sign In Failed: ' + error.message);
      } else {
        setCurrentUser(data.user);
        showToast('Welcome back, ' + data.user.email);
        setAuthPassword('');
        setIsAuthModalOpen(false);
        if (pendingCloudSync) {
          await syncMatchToCloud(data.user, playgroundSession);
        }
      }
    }
    setAuthLoading(false);
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
    showToast('Logged out successfully.');
  };

  const isAuthorizedAdmin = useCallback((scrim) => {
    if (!currentUser || !scrim) return false;
    const isOwner = scrim.created_by === currentUser.id || scrim.created_by === currentUser.email;
    const isCoHost = scrim.co_hosts && scrim.co_hosts.includes(currentUser.id);
    return isOwner || isCoHost;
  }, [currentUser]);

  const adminHostedScrims = useMemo(() => {
    if (!currentUser) return [];
    return scrims.filter(s => isAuthorizedAdmin(s));
  }, [scrims, currentUser, isAuthorizedAdmin]);

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
    showToast(`Sesi baru "${newSession.title}" sedia untuk diisi!`);
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
        showToast('Profile Error: ' + error.message);
      } else {
        setProfiles(prev => {
          const filtered = prev.filter(p => p.id !== currentUser.id);
          return [...filtered, payload];
        });
        setProfileAvatarUrl(newAvatarUrl);
        setAvatarFile(null);
        setIsProfileModalOpen(false);
        showToast('Profile updated successfully!');
      }
    } catch (err) {
      showToast('Failed to upload profile picture: ' + err.message);
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
        showToast('Thank you! Feedback delivered to Developer ry.khor.');
        setFeedbackMessage('');
        setIsFeedbackModalOpen(false);
      }
    } catch (err) {
      showToast('Failed to send: ' + err.message);
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const [editTitle, setEditTitle] = useState('');
  const [editHostName, setEditHostName] = useState('');
  const [editEventType, setEditEventType] = useState('Scrim');
  const [editTier, setEditTier] = useState('Tier 1 (Pro)');
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

  // Restorasi filteredScrims dan activePublicScrim yang hilang
  const filteredScrims = useMemo(() => {
    if (!currentUser) return [];

    return scrims.filter(s => {
      const isOwner = isAuthorizedAdmin(s) || s.created_by === 'public_ocr';
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
        s.title.toLowerCase().includes(q) ||
        (s.tier && s.tier.toLowerCase().includes(q)) ||
        (s.host_name && s.host_name.toLowerCase().includes(q));
      return isOwner && matchTier && matchType && matchStatus && matchSearch;
    });
  }, [scrims, tierFilter, leaderboardEventTypeFilter, historyStatusFilter, searchScrimQuery, currentUser, isAuthorizedAdmin]);

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
    if (!target || (!isAuthorizedAdmin(target) && target.created_by !== 'public_ocr')) {
      showToast('You do not have permission to delete this session!');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${target.title}"? All match results will be removed.`)) {
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

      showToast('Session deleted successfully!');
    } catch (err) {
      showToast('Failed to delete session: ' + err.message);
    }
  };

  const openEditScrimModal = () => {
    if (!activeAdminScrim) return;
    setEditTitle(activeAdminScrim.title || '');
    setEditHostName(activeAdminScrim.host_name || '');
    setEditEventType(activeAdminScrim.event_type || 'Scrim');
    setEditTier(activeAdminScrim.tier || 'Tier 1 (Pro)');
    setEditDesc(activeAdminScrim.description || '');
    setEditContact(activeAdminScrim.host_contact || '');
    setEditLogoFile(null);
    setIsEditScrimModalOpen(true);
  };

  const handleUpdateScrimSettings = async (e) => {
    e.preventDefault();
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Access denied!');
      return;
    }

    try {
      setIsSavingEdit(true);
      let updatedLogoUrl = activeAdminScrim.logo_url;

      if (editLogoFile) {
        updatedLogoUrl = await uploadMediaToSupabase(editLogoFile, 'logos');
      }

      const updatedData = {
        title: editTitle.trim(),
        host_name: editHostName.trim() || activeAdminScrim.host_name || 'Tournament Organizer',
        event_type: editEventType,
        tier: editTier,
        description: editDesc.trim(),
        host_contact: editContact.trim(),
        logo_url: updatedLogoUrl
      };

      const { error } = await supabase
        .from('scrims')
        .update(updatedData)
        .eq('id', activeAdminScrim.id);

      if (error) {
        showToast('Update failed: ' + error.message);
      } else {
        const merged = { ...activeAdminScrim, ...updatedData };
        setScrims(prev => {
          const exists = prev.some(s => s.id === activeAdminScrim.id);
          if (exists) {
            return prev.map(s => s.id === activeAdminScrim.id ? merged : s);
          } else {
            return [merged, ...prev];
          }
        });
        setIsEditScrimModalOpen(false);
        showToast('Event settings saved successfully!');
      }
    } catch (err) {
      showToast('Failed to upload logo: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleFinishScrim = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) {
      showToast('Only authorized hosts can change lock status!');
      return;
    }

    const nextState = !activeAdminScrim.is_finished;
    const { error } = await supabase
      .from('scrims')
      .update({ is_finished: nextState })
      .eq('id', activeAdminScrim.id);

    if (error) {
      showToast('Status update failed: ' + error.message);
    } else {
      const updated = { ...activeAdminScrim, is_finished: nextState };
      setScrims(scrims.map(s => s.id === activeAdminScrim.id ? updated : s));
      setSelectedScrimId(activeAdminScrim.id);
      showToast(nextState ? 'Session marked as concluded (Locked).' : 'Session reopened for scoring.');
    }
  };

  const handleAddNewMatch = async () => {
    if (!activeAdminScrim) {
      showToast('Sila cipta atau pilih sesi terlebih dahulu!');
      return;
    }
    if (activeAdminScrim.is_finished) {
      showToast('Cannot add rounds to a concluded session.');
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
    showToast(`Match ${nextMatchNo} (${defaultMap}) ditambah!`);

    try {
      await supabase.from('scrims').upsert(updatedScrim);
    } catch (err) {
      console.error('Error persisting new round:', err);
    }
  };

  const handleRemoveLastMatch = async () => {
    if (!activeAdminScrim || !isAuthorizedAdmin(activeAdminScrim)) return;
    if (activeAdminScrim.is_finished) {
      showToast('Cannot delete rounds from a concluded session.');
      return;
    }

    const currentMatches = adminMatchesList.length > 0 ? [...adminMatchesList] : [];
    if (currentMatches.length <= 1) {
      showToast('Minimum 1 match round required.');
      return;
    }

    const lastMatchIndex = currentMatches.length - 1;
    const lastMatch = currentMatches[lastMatchIndex];
    const hasRecordedScores = Boolean(lastMatch?.results?.some(
      r => Number(r.totalPts) > 0 || Number(r.kills) > 0 || (r.placement !== '' && r.placement !== null && r.placement !== undefined)
    ));

    // Confirm only if this match already has saved scores
    if (hasRecordedScores) {
      if (!window.confirm(`Match ${lastMatchIndex + 1} mengandungi markah yang telah disimpan. Adakah anda pasti mahu memadamkannya?`)) {
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

    showToast(`Match ${lastMatchIndex + 1} berjaya dipadam.`);

    try {
      await supabase.from('scrims').upsert(updatedScrim);
    } catch (err) {
      console.error('Error removing round:', err);
    }
  };

  const handleAddTeamSlot = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Scores are locked because this session has concluded.');
      return;
    }
    if (matchSlots.length >= 24) {
      showToast('Maximum limit reached (24 teams).');
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

    showToast(`Team slot ${matchSlots.length + 1} added.`);
  };

  const handleRemoveTeamSlot = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Scores are locked because this session has concluded.');
      return;
    }
    if (matchSlots.length <= 2) {
      showToast('Minimum 2 teams required.');
      return;
    }

    setMatchSlots(prev => prev.slice(0, -1));
    showToast(`Team slot ${matchSlots.length} removed.`);
  };

  const handleClearAdminForm = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('Scores are locked.');
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
    showToast(`Markah Match ${selectedMatchIdx + 1} dikosongkan.`);
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
      showToast('Scores are locked because this session has concluded.');
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
      showToast('Scores are locked.');
      return;
    }
    const current = matchSlots[index].kills;
    handleSlotChange(index, 'kills', Math.max(0, current + delta));
  };

  const handleRandomizeTestData = () => {
    if (activeAdminScrim?.is_finished) {
      showToast('This session is locked.');
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
    showToast('Simulated scores populated successfully.');
  };

  const handleSaveMatchScore = async () => {
    if (!currentUser) {
      showToast('Please sign in as Admin to save scores.');
      return;
    }
    if (!activeAdminScrim) {
      showToast('Please create or select a session first.');
      return;
    }
    if (activeAdminScrim.is_finished) {
      showToast('This session has concluded (Scores locked).');
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
      if (!teams.some(t => t.name.toLowerCase() === tName.toLowerCase())) {
        newTeamsToRegister.push({
          id: 'tm_' + tName.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36),
          name: tName,
          tag: tName.slice(0, 4).toUpperCase()
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
      showToast(`Match ${selectedMatchIdx + 1} & sesi berjaya disimpan ke Cloud!`);
    }
  };

  const handleCreateNewScrim = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Only verified hosts can create match sessions!');
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
        showToast(`${newEventType === 'Tour' ? 'Tournament' : 'Scrim'} session created successfully!`);
      }
    } catch (err) {
      showToast('Upload failed: ' + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCopyHostShareLink = () => {
    if (!activeAdminScrim) return;
    const shareUrl = `${window.location.origin}?claim_scrim=${activeAdminScrim.id}&token=${activeAdminScrim.claim_token || 'shared'}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Co-Host invitation link copied!');
    });
  };

  const [copyFeedback, setCopyFeedback] = useState(false);

  const calculateLeaderboard = (targetScrim, filterType) => {
    if (!targetScrim || !targetScrim.matches || targetScrim.matches.length === 0) {
      return [];
    }

    if (filterType === 'overall') {
      const summaryMap = {};

      targetScrim.matches.forEach((m) => {
        if (!m) return;
        (m.results || []).forEach(r => {
          if (!r || !r.teamId) return;
          if (!summaryMap[r.teamId]) {
            summaryMap[r.teamId] = {
              teamId: r.teamId,
              teamName: r.teamName,
              tag: r.tag,
              matchesPlayed: 0,
              wwcd: 0,
              placePts: 0,
              killPts: 0,
              totalPts: 0
            };
          }
          const hasScore = (r.placement !== '' && r.placement !== null && r.placement !== undefined) || Number(r.kills) > 0 || Number(r.totalPts) > 0;
          if (hasScore) {
            summaryMap[r.teamId].matchesPlayed += 1;
            summaryMap[r.teamId].wwcd += (typeof r.wwcd === 'number' ? r.wwcd : (r.wwcd ? 1 : (Number(r.placement) === 1 ? 1 : 0)));
            summaryMap[r.teamId].placePts += (Number(r.placePts) || 0);
            summaryMap[r.teamId].killPts += (Number(r.kills) || 0);
            summaryMap[r.teamId].totalPts += (Number(r.totalPts) || 0);
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
      showToast('Tiada data markah untuk disalin.');
      return;
    }

    const eventLabel = (targetSession?.event_type === 'Tour' ? 'TOURNAMENT' : 'SCRIM');
    let output = '**' + (targetSession?.title || eventLabel).toUpperCase() + '**\n';
    output += `Type: ${eventLabel} | Tier: ${targetSession?.tier || 'Tier 1'} | Date: ${targetSession?.date || ''}\n`;
    if (targetSession?.is_finished) output += 'STATUS: COMPLETED (FINAL STANDINGS)\n';
    if (targetSession?.host_contact) output += `Contact Host: ${targetSession.host_contact}\n`;
    output += '============================\n';
    output += '# | TEAM | MATCH | WWCD | KILLS | TOTAL\n';
    output += '============================\n';
    dataToUse.forEach(r => {
      output += `${r.rank}. ${r.teamName} | ${r.matchesPlayed || 1}M | ${r.wwcd || 0}W | ${r.killPts || 0}K | ${r.totalPts || 0}PTS\n`;
    });
    output += '============================\n';
    output += 'Generated by scrim.rykhor.my';

    navigator.clipboard.writeText(output).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
      showToast('Standings text copied to clipboard.');
    }).catch(() => {
      showToast('Gagal menyalin teks standings.');
    });
  };

  // INSTAGRAM STORY INFOGRAPHIC ENGINE
  const handleShareToInstagramStory = async (team, stats, hostFilterName, eventTypeLabel) => {
    if (!team || !stats) {
      showToast('No statistics available to generate card!');
      return;
    }

    try {
      setIsGeneratingStory(true);
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bg = ctx.createLinearGradient(0, 0, 0, 1920);
      bg.addColorStop(0, '#0a0d14');
      bg.addColorStop(0.4, '#10141f');
      bg.addColorStop(0.8, '#0b0e17');
      bg.addColorStop(1, '#05070b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);

      // Grid background lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 1080; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 1920);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1080, 56);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(340, 0);
      ctx.lineTo(300, 56);
      ctx.lineTo(0, 56);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SCRIM HUB MATCHDAY', 40, 36);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('PUBGM COMPETITIVE LEAGUE • BY RY.KHOR', 1040, 36);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(0, 56, 1080, 140);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 194, 1080, 4);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 48px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[${team.tag}]`, 60, 145);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px sans-serif';
      const cleanTeamName = team.name.length > 20 ? team.name.slice(0, 18) + '..' : team.name;
      ctx.fillText(cleanTeamName.toUpperCase(), 230, 142);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      const scopeBadge = `${eventTypeLabel.toUpperCase()} • ${hostFilterName === 'ALL' ? 'ALL HOSTS' : hostFilterName.toUpperCase()}`;
      ctx.fillText(scopeBadge, 1020, 142);

      const drawRibbonHeader = (title, y) => {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(440, y);
        ctx.lineTo(400, y + 42);
        ctx.lineTo(0, y + 42);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(title, 40, y + 28);
      };

      drawRibbonHeader('PERFORMANCE METRICS', 225);

      const drawCircularGauge = (centerX, centerY, radius, value, maxVal, title, unitColor = '#f97316') => {
        const startAngle = -0.75 * Math.PI;
        const totalAngle = 1.5 * Math.PI;
        const progress = Math.min(Math.max(parseFloat(value) || 0, 0) / maxVal, 1);
        const endAngle = startAngle + (totalAngle * (progress || 0.15));

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + totalAngle);
        ctx.stroke();

        ctx.strokeStyle = unitColor;
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, centerX, centerY - 65);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px monospace';
        ctx.fillText(String(value), centerX, centerY + 10);
      };

      drawCircularGauge(200, 360, 68, stats.avgPts || 0, 35, 'AVG POINTS', '#f97316');
      drawCircularGauge(540, 360, 68, stats.avgKills || 0, 18, 'AVG ELIMS', '#D7FF00');
      drawCircularGauge(880, 360, 68, stats.winRate || '0%', 100, 'WIN RATIO', '#f97316');

      drawRibbonHeader('SQUAD COMBAT PROFILE', 490);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 555, 960, 290);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 555, 960, 290);

      ctx.fillStyle = '#f97316';
      ctx.fillRect(60, 555, 10, 290);

      const isWinner = Number(stats.totalWwcd) >= 2;
      const isLethal = Number(stats.totalKills) >= 20;
      const archetype = isWinner ? 'CHICKEN DINNER HUNTER' : (isLethal ? 'LETHAL COMBAT PREDATOR' : 'TACTICAL SURVIVOR');

      ctx.fillStyle = '#f97316';
      ctx.fillRect(100, 585, 360, 38);
      ctx.fillStyle = '#000000';
      ctx.font = '900 15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(archetype.toUpperCase(), 115, 610);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px sans-serif';
      ctx.fillText(cleanTeamName.toUpperCase(), 100, 675);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px sans-serif';
      ctx.fillText(`Total Eliminations: ${stats.totalKills || 0} Kills`, 100, 725);
      ctx.fillText(`Total Points: ${stats.totalPts || 0} Pts`, 100, 760);
      ctx.fillText(`Total WWCD: ${stats.totalWwcd || 0}`, 100, 795);

      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(680, 585, 310, 230);
      ctx.strokeStyle = '#f97316';
      ctx.strokeRect(680, 585, 310, 230);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CATEGORY SCOPE', 835, 625);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px monospace';
      ctx.fillText(`${stats.results ? stats.results.length : 0}`, 835, 695);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${eventTypeLabel.toUpperCase()} JOINED`, 835, 735);
      ctx.fillText(`(${stats.matchesCount || 0} TOTAL MATCHES)`, 835, 765);

      drawRibbonHeader('ANALYSIS STATEMENT', 885);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 950, 960, 210);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(60, 950, 960, 210);

      ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.font = '900 120px serif';
      ctx.textAlign = 'left';
      ctx.fillText('“', 90, 1050);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 18px monospace';
      ctx.fillText(`${eventTypeLabel.toUpperCase()} RECORD`, 170, 995);

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic 500 21px sans-serif';
      const quoteText = isWinner 
        ? 'This squad displays elite zone dominance consistency with an outstanding win rate.'
        : 'A high-impact aggressive squad consistently pressuring opponents for maximum eliminations.';
      ctx.fillText(quoteText, 170, 1040);
      ctx.fillText('Verified for official competitive tier participation.', 170, 1075);

      drawRibbonHeader('NUMBERS TO KNOW', 1200);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 1265, 960, 270);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(60, 1265, 960, 270);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`WITH A RECORD OF ${stats.totalPts || 0} TOTAL POINTS AND`, 100, 1340);
      ctx.fillText(`${stats.totalKills || 0} ELIMINATIONS, [${team.tag}] RANKS AMONG`, 100, 1380);
      ctx.fillText(`THE MOST FORMIDABLE ROSTERS IN THE`, 100, 1420);
      ctx.fillText(`SCRIM HUB ${eventTypeLabel.toUpperCase()} SERIES.`, 100, 1460);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 110px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(stats.totalPts || 0), 830, 1410);

      ctx.fillStyle = '#f97316';
      ctx.font = '900 18px monospace';
      ctx.fillText('CAREER POINTS', 830, 1455);

      drawRibbonHeader('COLORWAY & METADATA', 1575);

      ctx.fillStyle = '#141a24';
      ctx.fillRect(60, 1635, 960, 130);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeRect(60, 1635, 960, 130);

      const drawColorSwatch = (x, color, label) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, 1655, 90, 60);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 1655, 90, 60);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + 45, 1740);
      };

      drawColorSwatch(120, '#f97316', 'PRIMARY');
      drawColorSwatch(240, '#000000', 'SECONDARY');
      drawColorSwatch(360, '#ffffff', 'ACCENT');

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(cleanTeamName.toUpperCase(), 980, 1695);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`${eventTypeLabel.toUpperCase()} DIVISION`, 980, 1725);

      ctx.fillStyle = '#05070b';
      ctx.fillRect(0, 1805, 1080, 115);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 1805, 1080, 4);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px monospace';
      ctx.fillText('SCRIM HUB', 60, 1860);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('BY RY.KHOR  •  POWERED BY SUPABASE', 60, 1890);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#f97316';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('scrim.rykhor.my', 1020, 1872);

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `${team.tag}-${eventTypeLabel.toLowerCase()}-stats.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `[${team.tag}] ${eventTypeLabel} Stats Infographic`,
              text: `Check out our team's ${eventTypeLabel} performance infographic on SCRIM HUB! (scrim.rykhor.my)`
            });
            showToast('Instagram Story infographic ready to share!');
          } catch (err) {
            if (err.name !== 'AbortError') showToast('Error: ' + err.message);
          }
        } else {
          const link = document.createElement('a');
          link.download = `${team.tag}-${eventTypeLabel.toLowerCase()}-stats.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          showToast('Infographic poster downloaded successfully!');
        }
      }, 'image/png');

    } catch (error) {
      showToast('Failed to generate poster: ' + error.message);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [selectedTeamProfile, setSelectedTeamProfile] = useState('');

  const teamsStats = useMemo(() => {
    const stats = {};

    // Seed registered teams so canonical tags and names are retained
    teams.forEach(t => {
      if (!t || !t.name) return;
      stats[t.name] = {
        name: t.name,
        tag: t.tag || t.name.slice(0, 4).toUpperCase(),
        scrimResults: [],
        totalKills: 0,
        totalPoints: 0,
        totalWWCD: 0,
        matchesCount: 0
      };
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
          const cleanTeamName = r.teamName.trim();

          // Verify this specific team actually played or has recorded points/kills/placement
          const teamHasPlayed =
            (r.placement !== '' && r.placement !== null && r.placement !== undefined && Number(r.placement) > 0) ||
            Number(r.kills) > 0 ||
            Number(r.totalPts) > 0 ||
            Boolean(r.wwcd);
          if (!teamHasPlayed) return;

          if (!scrimSummary[cleanTeamName]) {
            const dbTeam = teams.find(t => t.name.toLowerCase() === cleanTeamName.toLowerCase());
            scrimSummary[cleanTeamName] = {
              teamName: cleanTeamName,
              tag: r.tag || dbTeam?.tag || cleanTeamName.slice(0, 4).toUpperCase(),
              totalPts: 0,
              totalKills: 0,
              wwcd: 0,
              matches: 0
            };
          }
          scrimSummary[cleanTeamName].totalPts += (Number(r.totalPts) || 0);
          scrimSummary[cleanTeamName].totalKills += (Number(r.kills) || 0);
          scrimSummary[cleanTeamName].matches += 1;
          scrimSummary[cleanTeamName].wwcd += (typeof r.wwcd === 'number' ? r.wwcd : (r.wwcd ? 1 : (Number(r.placement) === 1 ? 1 : 0)));
        });
      });

      const sortedTeams = Object.values(scrimSummary)
        .filter(teamRes => teamRes.matches > 0)
        .sort((a, b) => b.totalPts - a.totalPts || b.wwcd - a.wwcd);

      sortedTeams.forEach((teamRes, idx) => {
        const tName = teamRes.teamName;
        if (!stats[tName]) {
          stats[tName] = {
            name: tName,
            tag: teamRes.tag,
            scrimResults: [],
            totalKills: 0,
            totalPoints: 0,
            totalWWCD: 0,
            matchesCount: 0
          };
        }

        stats[tName].totalKills += teamRes.totalKills;
        stats[tName].totalPoints += teamRes.totalPts;
        stats[tName].totalWWCD += teamRes.wwcd;
        stats[tName].matchesCount += teamRes.matches;

        stats[tName].scrimResults.push({
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

    // Only return teams that actually have recorded match data!
    const activeStats = {};
    Object.values(stats).forEach(t => {
      if (t.matchesCount > 0 && t.scrimResults && t.scrimResults.length > 0) {
        activeStats[t.name] = t;
      }
    });

    return activeStats;
  }, [scrims, teams]);

  const validTeamList = useMemo(() => {
    return Object.values(teamsStats)
      .filter(t => t.matchesCount > 0 && t.scrimResults && t.scrimResults.length > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWWCD - a.totalWWCD || b.totalKills - a.totalKills);
  }, [teamsStats]);

  const categoryTeamList = useMemo(() => {
    if (teamStatsCategory === 'ALL') {
      return validTeamList;
    }
    return validTeamList
      .filter(t => (t.scrimResults || []).some(r => (r.eventType || 'Scrim') === teamStatsCategory))
      .sort((a, b) => {
        const aPts = (a.scrimResults || []).filter(r => (r.eventType || 'Scrim') === teamStatsCategory).reduce((acc, c) => acc + c.points, 0);
        const bPts = (b.scrimResults || []).filter(r => (r.eventType || 'Scrim') === teamStatsCategory).reduce((acc, c) => acc + c.points, 0);
        return bPts - aPts;
      });
  }, [validTeamList, teamStatsCategory]);

  const filteredTeamList = useMemo(() => {
    const query = teamSearchQuery.toLowerCase().trim();
    return categoryTeamList.filter(t => 
      !query || 
      t.name.toLowerCase().includes(query) || 
      (t.tag && t.tag.toLowerCase().includes(query))
    );
  }, [categoryTeamList, teamSearchQuery]);

  const currentSelectedTeam = useMemo(() => {
    if (selectedTeamProfile && categoryTeamList.some(t => t.name === selectedTeamProfile)) {
      return selectedTeamProfile;
    }
    return categoryTeamList.length > 0 ? categoryTeamList[0].name : '';
  }, [selectedTeamProfile, categoryTeamList]);

  const activeTeamData = teamsStats[currentSelectedTeam] || categoryTeamList[0] || null;

  const activeTeamScopedStats = useMemo(() => {
    if (!activeTeamData) return null;
    const all = activeTeamData.scrimResults || [];
    const filtered = teamStatsCategory === 'ALL'
      ? all
      : all.filter(r => (r.eventType || 'Scrim') === teamStatsCategory);

    const totalPoints = filtered.reduce((acc, c) => acc + c.points, 0);
    const totalKills = filtered.reduce((acc, c) => acc + c.kills, 0);
    const totalWWCD = filtered.reduce((acc, c) => acc + (c.wwcd || 0), 0);
    const matchesCount = filtered.reduce((acc, c) => acc + (c.matches || 1), 0);

    return {
      filteredResults: filtered,
      totalPoints,
      totalKills,
      totalWWCD,
      eventsCount: filtered.length,
      matchesCount
    };
  }, [activeTeamData, teamStatsCategory]);

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
      results = results.filter(r => (r.eventType || 'Scrim') === performanceModalCategory);
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
      showToast('Only admins can publish content!');
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
        showToast('Error publishing: ' + error.message);
      } else {
        setPosts([newPost, ...posts]);
        setIsShowcaseModalOpen(false);
        setPostTitle('');
        setShowcaseFile(null);
        setExternalSocialUrl('');
        setPostCaption('');
        showToast('Content published successfully!');
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
      showToast('You can only delete your own posts!');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      showToast('Failed to delete: ' + error.message);
    } else {
      setPosts(posts.filter(p => p.id !== postId));
      showToast('Post deleted successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#D7FF00] selection:text-black pb-24 md:pb-8 relative overflow-x-hidden">
      
      {/* Toast Alert: Ergonomik di Thumb Zone (Bawah) pada telefon & kemas di desktop */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[70] bg-zinc-950/95 backdrop-blur-md text-[#D7FF00] px-4 py-2.5 rounded-full shadow-[0_0_25px_rgba(215, 255, 0,0.2)] font-black text-xs flex items-center space-x-2 border border-[#D7FF00]/40 animate-card-entrance max-w-[90vw] text-center">
          <CheckCircle className="w-4 h-4 text-[#D7FF00] shrink-0"/>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* HEADER NAVIGATION BERSEPADU */}
      <header className="border-b border-white/5 bg-zinc-950/75 backdrop-blur-xl sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div 
            onClick={() => setActiveTab('playground')}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
            title="Kembali ke Laman Utama"
          >
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="RYKHOR Scrim Hub Logo" 
                className="w-9 h-9 rounded-xl object-cover shadow-md shadow-[#D7FF00]/10 border border-[#D7FF00]/30 group-hover:scale-105 transition-transform" 
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#D7FF00] border-2 border-zinc-950 animate-pulse" title="Sistem Aktif"></span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black tracking-wider text-white group-hover:text-[#D7FF00] transition-colors">
                  RYKHOR
                </span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-tight lowercase">
                  scrim hub
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1 bg-zinc-900/60 p-1.5 rounded-2xl border border-white/5 text-xs font-semibold items-center">
            <button
              type="button"
              onClick={() => navigateToTab('playground')}
              title="Home (Laman Utama)"
              aria-label="Home"
              className={'p-2 rounded-xl transition-all active:scale-95 ' + (
                activeTab === 'playground' || activeTab === 'home'
                  ? 'bg-zinc-800 text-white font-black shadow-xs ring-1 ring-white/10' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Home className="w-4 h-4"/>
            </button>
            <button
              type="button"
              onClick={() => navigateToTab('history')}
              title="Rekod Kejohanan & Live Leaderboard"
              aria-label="Rekod Kejohanan"
              className={'p-2 rounded-xl transition-all active:scale-95 ' + (
                activeTab === 'history' || activeTab === 'leaderboard'
                  ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => navigateToTab('teams')}
              title="Hall of Fame & Direktori Pasukan"
              aria-label="Hall of Fame"
              className={'p-2 rounded-xl transition-all active:scale-95 ' + (
                activeTab === 'teams'
                  ? 'bg-indigo-500/20 text-indigo-300 font-black border border-indigo-500/30' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Users className="w-4 h-4 text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={() => navigateToTab('admin')}
              title="Host Workspace & Portal Penganjur"
              aria-label="Host Portal"
              className={'flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 ' + (
                activeTab === 'admin'
                  ? 'bg-[#D7FF00]/20 text-[#D7FF00] font-black border border-[#D7FF00]/30' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-bold'
              )}
            >
              {currentUser ? (
                <ShieldCheck className="w-4 h-4 text-[#D7FF00]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <span>Host</span>
            </button>
          </nav>

          {/* Desktop Central [+] Action Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsQuickCreateModalOpen(true)}
            className={'hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer ' + (
              activeTab === 'scorer' || activeTab === 'scrim-data'
                ? 'bg-[#D7FF00] text-black shadow-[0_0_20px_rgba(215, 255, 0,0.18)]'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-[#D7FF00] border border-white/10'
            )}
            title="Pilih Quick Score, Admin Scorer atau Scrim Data"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Scorer / Data</span>
          </button>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-white/20 px-2.5 py-1.5 rounded-xl transition text-left group active:scale-95"
                  title="Urus Profil Host"
                >
                  <User className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span className="hidden sm:inline text-xs font-bold text-zinc-200 group-hover:text-white max-w-[130px] truncate">
                    {profileName || currentUser.email.split('@')[0]}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition flex items-center gap-1 active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setPendingCloudSync(false);
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-[#D7FF00] border border-white/10 transition flex items-center gap-1.5 shadow-sm"
                title="Sign in to your host account"
              >
                <Lock className="w-3.5 h-3.5 text-[#D7FF00]" />
                <span>Login</span>
              </button>
            )}

            {/* 3-Line Hamburger Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                className={'p-2 rounded-xl transition border flex items-center justify-center ' + (
                  isNavMenuOpen 
                    ? 'bg-zinc-800 text-[#D7FF00] border-[#D7FF00]/40' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-white/10'
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
                  <div className="absolute right-0 mt-2 w-52 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 py-1.5 divide-y divide-white/5 text-xs">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => handleOpenGuide(0)}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-white/5 text-zinc-200 transition font-bold"
                      >
                        <BookOpen className="w-4 h-4 text-[#D7FF00]"/>
                        <span>Slide Panduan App</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('showcase');
                          setIsNavMenuOpen(false);
                        }}
                        className={'w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition ' + (
                          activeTab === 'showcase' ? 'text-[#D7FF00] font-bold bg-white/5' : 'text-zinc-300'
                        )}
                      >
                        <Sparkles className="w-4 h-4 text-[#D7FF00]"/>
                        <span className="font-semibold">Content</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('hosts');
                          setIsNavMenuOpen(false);
                        }}
                        className={'w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition ' + (
                          activeTab === 'hosts' ? 'text-[#D7FF00] font-bold bg-white/5' : 'text-zinc-300'
                        )}
                      >
                        <Flame className="w-4 h-4 text-[#D7FF00]"/>
                        <span className="font-semibold">Direktori Host</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('about');
                          setIsNavMenuOpen(false);
                        }}
                        className={'w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition ' + (
                          activeTab === 'about' ? 'text-[#D7FF00] font-bold bg-white/5' : 'text-zinc-300'
                        )}
                      >
                        <Info className="w-4 h-4 text-[#D7FF00]"/>
                        <span className="font-semibold">About Scrim Hub</span>
                      </button>
                    </div>
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFeedbackModalOpen(true);
                          setIsNavMenuOpen(false);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-white/5 text-zinc-300 transition"
                      >
                        <Bug className="w-4 h-4 text-[#D7FF00]"/>
                        <span className="font-semibold">Feedback / Report Bug</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">

        {/* VIEW 0: PLAYGROUND SPLIT-SCREEN WORKSPACE (ROOT ROUTE /) */}
        {(activeTab === 'playground' || activeTab === 'home') && (() => {
          const activeTeamsCount = Math.max(Object.keys(teamsStats || {}).length, 16);
          const homeSliderCards = [
            {
              id: 'cara-baru-cepat',
              title: 'Cara Baru & Cepat',
              icon: Zap,
              badge: 'VS GOOGLE SHEET',
              description: 'Sheet mudah rosak & tiada auto-tiebreaker. Di sini kiraan PMGC dan poster Standings HD siap serentak dalam saat.',
              footerText: 'Ganti Google Sheet & Canva serentak',
              onAction: handleStartScoringSession,
              renderVisual: (isActive) => (
                <div
                  key={isActive ? 'gauge-active' : 'gauge-idle'}
                  className="relative pt-2 pb-1 flex flex-col items-center justify-center"
                >
                  {/* Animated Semi-circle gauge inspired by reference Card 1 */}
                  <svg viewBox="0 0 200 105" className="w-44 sm:w-48 h-auto overflow-visible">
                    <path
                      d="M 20 95 A 80 80 0 0 1 180 95"
                      fill="none"
                      stroke="#27272A"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 95 A 80 80 0 0 1 158 40"
                      fill="none"
                      stroke="#D7FF00"
                      strokeWidth="14"
                      strokeLinecap="round"
                      className={
                        'drop-shadow-[0_0_12px_rgba(215,255,0,0.4)] ' +
                        (isActive ? 'animate-gauge-sweep' : '')
                      }
                    />
                    {/* Glowing tip indicator dot */}
                    <circle
                      cx="158"
                      cy="40"
                      r="4.5"
                      fill="#FFFFFF"
                      className={isActive ? 'animate-pulse' : ''}
                    />
                  </svg>
                  <div
                    className={
                      '-mt-10 text-center ' + (isActive ? 'animate-visual-pop' : '')
                    }
                    style={{ animationDelay: '180ms' }}
                  >
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">10</span>
                      <span className="text-xs sm:text-sm text-[#D7FF00] font-bold">saat</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 line-through block">
                      30 minit Sheet + Canva
                    </span>
                  </div>
                </div>
              )
            },
            {
              id: 'portfolio-pasukan',
              title: 'Portfolio Pasukan & Penaja',
              icon: Award,
              badge: 'HALL OF FAME',
              description: 'Rekod match se-Malaysia disimpan kolektif — jadi portfolio rasmi untuk pitching tajaan & scouting bakat baru.',
              footerText: 'Teroka Database Hall of Fame →',
              onAction: () => navigateToTab('teams'),
              renderVisual: (isActive) => (
                <div
                  key={isActive ? 'bars-active' : 'bars-idle'}
                  className="relative py-2 flex items-end justify-between gap-3"
                >
                  <div className={'space-y-1 ' + (isActive ? 'animate-visual-pop' : '')}>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                      {activeTeamsCount}+
                    </div>
                    <div className="text-xs font-bold text-zinc-300 leading-snug">
                      Skuad &amp; Rekod<br />
                      <span className="text-[#D7FF00]">Kolektif Malaysia</span>
                    </div>
                  </div>
                  {/* Animated Ascending bar chart inspired by reference Card 2 */}
                  <div className="flex items-end gap-1.5 h-20 pt-2 relative">
                    <div
                      style={{ animationDelay: '40ms' }}
                      className={
                        'w-5 h-7 rounded-t-md bg-zinc-800/90 ' +
                        (isActive ? 'animate-bar-grow' : '')
                      }
                    />
                    <div
                      style={{ animationDelay: '120ms' }}
                      className={
                        'w-5 h-11 rounded-t-md bg-zinc-700/80 ' +
                        (isActive ? 'animate-bar-grow' : '')
                      }
                    />
                    <div
                      style={{ animationDelay: '200ms' }}
                      className={
                        'w-5 h-15 rounded-t-md bg-[#D7FF00]/45 ' +
                        (isActive ? 'animate-bar-grow' : '')
                      }
                    />
                    <div className="relative flex flex-col items-center">
                      {isActive && (
                        <span className="text-[9px] font-mono font-black text-[#D7FF00] mb-1 animate-hero-float">
                          TOP
                        </span>
                      )}
                      <div
                        style={{ animationDelay: '280ms' }}
                        className={
                          'w-5 h-20 rounded-t-md bg-[#D7FF00] shadow-[0_0_14px_rgba(215,255,0,0.35)] ' +
                          (isActive ? 'animate-bar-grow' : '')
                        }
                      />
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'quick-scorer',
              title: 'Kira Segera (Quick Scorer)',
              icon: Zap,
              badge: 'TANPA LOGIN',
              description: 'Kalkulator markah scrim pantas di browser — terus isi kedudukan & kills setiap pusingan tanpa perlu daftar akaun.',
              pills: ['1–5 Match', 'Format Point PMPL', 'Tanpa Login'],
              footerText: 'Buka Quick Scorer Sekarang →',
              onAction: handleStartScoringSession,
              renderVisual: (isActive) => (
                <div
                  key={isActive ? 'scorer-active' : 'scorer-idle'}
                  className="py-2 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className={'text-2xl sm:text-3xl font-black tracking-tight text-white font-mono ' + (isActive ? 'animate-visual-pop' : '')}>
                      1–5 Match
                    </div>
                    {/* Animated Sequential Match Round Indicators */}
                    <div className="flex items-center gap-1">
                      {['M1', 'M2', 'M3', 'M4', 'M5'].map((m, mIdx) => (
                        <span
                          key={m}
                          style={{ animationDelay: `${mIdx * 380}ms` }}
                          className={
                            'px-1.5 py-0.5 rounded text-[9px] font-mono font-black transition-all ' +
                            (isActive
                              ? 'animate-round-step'
                              : mIdx === 0
                              ? 'bg-[#D7FF00] text-black'
                              : 'bg-zinc-900 text-zinc-500')
                          }
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    {isActive && (
                      <span className="absolute inset-0 rounded-2xl bg-[#D7FF00]/30 animate-ping pointer-events-none" />
                    )}
                    <div className={'relative w-12 h-12 rounded-2xl bg-[#D7FF00] text-black flex items-center justify-center shadow-[0_0_18px_rgba(215,255,0,0.35)] ' + (isActive ? 'animate-hero-float' : '')}>
                      <Zap className="w-6 h-6 fill-black text-black" />
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'portal-host',
              title: 'Portal Host & Scrim',
              icon: ShieldCheck,
              badge: 'CLOUD HUB',
              description: 'Pusat kawalan penganjur rasmi dengan simpanan awan automatik, pusingan fleksibel & jemputan Co-Host.',
              pills: ['Live Cloud Sync', 'Detailed', 'Rekod Standing'],
              footerText: 'Buka Portal Host & Scrim →',
              onAction: () => navigateToTab('admin'),
              renderVisual: (isActive) => (
                <div
                  key={isActive ? 'cloud-active' : 'cloud-idle'}
                  className="py-2 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className={'text-2xl sm:text-3xl font-black tracking-tight text-white font-mono ' + (isActive ? 'animate-visual-pop' : '')}>
                      Cloud Sync
                    </div>
                    {/* Animated Live Cloud Sync Status Bar */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 text-[10px] font-mono text-zinc-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D7FF00] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D7FF00]" />
                      </span>
                      <span>Auto-Save &amp; Live Standings</span>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <div className={'w-12 h-12 rounded-2xl bg-zinc-800 text-[#D7FF00] flex items-center justify-center shadow-[0_0_16px_rgba(215,255,0,0.15)] ' + (isActive ? 'animate-hero-float' : '')}>
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'scrim-data-ocr',
              title: 'Results Scanner',
              icon: Sparkles,
              badge: 'AI SCANNER',
              description: 'Muat naik poster keputusan untuk ekstrak markah automatik (AI OCR) & semakan matematik.',
              pills: ['AI Results OCR', 'Auto-Audit Math', 'Mobile View'],
              footerText: 'Buka Results Scanner →',
              onAction: () => navigateToTab('scrim-data'),
              renderVisual: (isActive) => (
                <div
                  key={isActive ? 'ocr-active' : 'ocr-idle'}
                  className="py-2 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className={'text-2xl sm:text-3xl font-black tracking-tight text-white font-mono ' + (isActive ? 'animate-visual-pop' : '')}>
                      Results Scanner
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 text-[10px] font-mono text-[#D7FF00]">
                      <CheckCircle className="w-3 h-3 text-[#D7FF00]" />
                      <span>PP + KP = Total Verified</span>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    {isActive && (
                      <span className="absolute inset-0 rounded-2xl bg-[#D7FF00]/25 animate-ping pointer-events-none" />
                    )}
                    <div className={'relative w-12 h-12 rounded-2xl bg-[#D7FF00] text-black flex items-center justify-center shadow-[0_0_18px_rgba(215,255,0,0.35)] ' + (isActive ? 'animate-hero-float' : '')}>
                      <Database className="w-6 h-6 text-black" />
                    </div>
                  </div>
                </div>
              )
            }
          ];

          // 4 cards + first 2 cloned at the end so transition 3 -> 4 (0-clone) always shrinks left & grows from right
          const extendedTrackCards = [
            ...homeSliderCards,
            homeSliderCards[0],
            homeSliderCards[1]
          ];

          return (
            <div className="max-w-xl lg:max-w-2xl mx-auto space-y-5 sm:space-y-6 pt-1 pb-4">
              
              {/* 1. TOP MICRO-BAR (Following Reference: Brand Left + Action Link Right) */}
              <div className="flex items-center justify-between px-1 animate-stagger-card">
                <div className="inline-flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#D7FF00]/15 text-[#D7FF00] flex items-center justify-center">
                    <Crosshair className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                    Scrim Hub • PMGC
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenGuide(0)}
                  className="text-xs font-semibold text-zinc-400 hover:text-[#D7FF00] underline underline-offset-4 transition cursor-pointer"
                >
                  Panduan
                </button>
              </div>

              {/* 2. HERO HEADLINE BLOCK (3-Line Bold Hierarchy + Inline Icon Pills + Right Brand Emblem) */}
              <div
                className="relative px-1 animate-stagger-card"
                style={{ animationDelay: '70ms' }}
              >
                {/* Geometric X-Arc Emblem on the Right (Following Reference Top-Right Graphic) */}
                <div
                  aria-hidden="true"
                  className="absolute right-1 top-0 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none select-none opacity-90 animate-hero-float"
                >
                  <svg viewBox="0 0 120 120" className="w-full h-full">
                    <path
                      d="M 22 18 A 38 38 0 0 0 98 18"
                      fill="none"
                      stroke="#D7FF00"
                      strokeOpacity="0.22"
                      strokeWidth="16"
                      strokeLinecap="square"
                    />
                    <path
                      d="M 22 102 A 38 38 0 0 1 98 102"
                      fill="none"
                      stroke="#D7FF00"
                      strokeOpacity="0.22"
                      strokeWidth="16"
                      strokeLinecap="square"
                    />
                  </svg>
                </div>

                <div className="relative z-10 space-y-3 max-w-lg">
                  <h1 className="text-[30px] sm:text-5xl font-black tracking-tight text-white leading-[1.12]">
                    <span className="inline-flex items-center gap-2 sm:gap-2.5">
                      <span>Kira</span>
                      <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D7FF00] text-black shadow-[0_0_16px_rgba(215,255,0,0.35)] animate-hero-float">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black" />
                      </span>
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D7FF00]/20 text-[#D7FF00] animate-hero-float"
                        style={{ animationDelay: '400ms' }}
                      >
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7FF00]" />
                      </span>
                    </span>
                    <span className="block mt-1">Markah Scrim &amp;</span>
                    <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-[#D7FF00]">
                      Poster Sepantas Saat
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
                    Susun kedudukan &amp; tiebreaker automatik supaya anda tak perlu lagi baiki formula spreadsheet atau lukis poster manual.
                  </p>
                </div>
              </div>

              {/* 3. INTERACTIVE 4-SECOND AUTO SLIDER (Shrink Left -> Next Card Enters From Right & Grows) */}
              <div
                className="relative select-none animate-stagger-card"
                style={{ animationDelay: '150ms' }}
                onMouseEnter={() => setIsHomeSliderPaused(true)}
                onMouseLeave={() => setIsHomeSliderPaused(false)}
                onTouchStart={(e) => {
                  setIsHomeSliderPaused(true);
                  homeSliderTouchStartX.current = e.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  const startX = homeSliderTouchStartX.current;
                  const endX = e.changedTouches[0]?.clientX ?? null;
                  if (startX !== null && endX !== null) {
                    const diff = startX - endX;
                    if (diff > 40) {
                      advanceHomeSlider();
                    } else if (diff < -40) {
                      prevHomeSlider();
                    }
                  }
                  homeSliderTouchStartX.current = null;
                  setTimeout(() => setIsHomeSliderPaused(false), 2500);
                }}
              >
                <div className="overflow-hidden py-2 px-1">
                  <div
                    className={
                      'flex items-stretch [--slide-w:78%] sm:[--slide-w:66%] ' +
                      (isHomeSliderAnimating
                        ? 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
                        : 'transition-none')
                    }
                    style={{
                      transform: `translate3d(calc(var(--slide-w) * -${homeSlideTrackIdx}), 0, 0)`
                    }}
                  >
                    {extendedTrackCards.map((card, slotIdx) => {
                      const CardIcon = card.icon;
                      const isActive = slotIdx === homeSlideTrackIdx;
                      const isPast = slotIdx < homeSlideTrackIdx;

                      return (
                        <div
                          key={`${card.id}-${slotIdx}`}
                          className="w-[var(--slide-w)] shrink-0 pr-3 sm:pr-4"
                        >
                          <div
                            onClick={() => {
                              if (!isActive) {
                                if (slotIdx === homeSlideTrackIdx + 1) {
                                  advanceHomeSlider();
                                } else {
                                  goToHomeSlide(slotIdx % HOME_SLIDER_TOTAL);
                                }
                              } else if (card.onAction) {
                                card.onAction();
                              }
                            }}
                            className={
                              'h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-pointer group/card ' +
                              (isHomeSliderAnimating
                                ? 'transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] '
                                : 'transition-none ') +
                              (isActive
                                ? 'bg-[#121214] scale-100 opacity-100 shadow-2xl origin-center'
                                : isPast
                                ? 'bg-[#121214]/70 scale-[0.86] opacity-35 shadow-md origin-right'
                                : 'bg-[#121214]/80 scale-[0.88] opacity-60 hover:opacity-85 shadow-lg origin-left')
                            }
                          >
                            {/* Top Row: Icon + Card Title */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-[#D7FF00] flex items-center justify-center shrink-0">
                                    <CardIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                                    {card.title}
                                  </h2>
                                </div>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 shrink-0">
                                  {card.badge}
                                </span>
                              </div>

                              {/* Center Graphic / Metric with Active State Animation */}
                              {card.renderVisual(isActive)}

                              {/* Concise Text Description */}
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {card.description}
                              </p>

                              {/* Feature Pills (for Cards 3 & 4) */}
                              {card.pills && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  {card.pills.map((pill, pIdx) => (
                                    <span
                                      key={pIdx}
                                      style={{ animationDelay: `${120 + pIdx * 80}ms` }}
                                      className={
                                        'px-2.5 py-1 rounded-lg bg-zinc-900 text-[10px] font-mono font-bold text-[#D7FF00] ' +
                                        (isActive ? 'animate-visual-pop' : '')
                                      }
                                    >
                                      {pill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Bottom Highlight Pill (Following Reference Card Footer Pill) */}
                            <div className="mt-4 pt-3 border-t border-white/5">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 text-[11px] font-semibold text-zinc-200 w-full">
                                <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black flex items-center justify-center shrink-0 group-hover/card:translate-x-0.5 transition-transform">
                                  <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                                </span>
                                <span className="truncate">{card.footerText}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Slider Progress Dots & Manual Controls */}
                <div className="flex items-center justify-between px-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {homeSliderCards.map((c, idx) => {
                      const isCurrent = activeHomeSlide === idx;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => goToHomeSlide(idx)}
                          aria-label={`Paparkan kad ${c.title}`}
                          className={
                            'h-1.5 rounded-full transition-all duration-300 cursor-pointer ' +
                            (isCurrent ? 'w-6 bg-[#D7FF00]' : 'w-2 bg-zinc-800 hover:bg-zinc-700')
                          }
                        />
                      );
                    })}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500">
                    {activeHomeSlide + 1} / {HOME_SLIDER_TOTAL} • Geser atau tekan kad
                  </span>
                </div>
              </div>

              {/* 4. FULL-WIDTH PILL CTA BUTTON (Following Reference "Let's get started! (>)") */}
              <div
                className="space-y-3 pt-1 px-1 animate-stagger-card"
                style={{ animationDelay: '240ms' }}
              >
                <button
                  type="button"
                  onClick={handleStartScoringSession}
                  className="w-full p-2 pl-6 rounded-full bg-[#161619] hover:bg-[#1c1c20] active:scale-[0.99] text-white transition-all flex items-center justify-between shadow-2xl cursor-pointer group"
                  title="Mula kira markah sekarang di Quick Scorer tanpa login"
                >
                  <span className="text-sm sm:text-base font-bold tracking-tight text-white mx-auto pr-4">
                    Mula Kira Sekarang!
                  </span>
                  <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#D7FF00] group-hover:bg-[#c2e600] text-black flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(215,255,0,0.3)] group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-5 h-5 stroke-[2.5] text-black" />
                  </span>
                </button>

                {/* Secondary Sign-In / Host Portal Link (Following Reference "Already have an account? Sign in") */}
                <div className="text-center text-xs text-zinc-400">
                  <span>Penganjur kejohanan rasmi? </span>
                  <button
                    type="button"
                    onClick={() => navigateToTab('admin')}
                    className="font-black text-white hover:text-[#D7FF00] underline decoration-[#D7FF00]/60 underline-offset-4 transition cursor-pointer"
                  >
                    Buka Portal Host
                  </button>
                </div>
              </div>

              {/* 5. ACTIVE OFFICIAL SCRIM BANNER (IF ANY) */}
              {scrims.length > 0 && (
                <div
                  onClick={() => {
                    setSelectedScrimId(scrims[0].id);
                    navigateToTab('history');
                  }}
                  className="p-3.5 bg-[#121214] hover:bg-[#161619] rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group shadow-md mx-1"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#D7FF00] animate-pulse shrink-0 shadow-[0_0_8px_rgba(215,255,0,0.6)]" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block">Sesi Terkini Diarkib</span>
                      <span className="text-xs sm:text-sm font-bold text-white truncate block">
                        {scrims[0].title || 'PUBG Mobile Scrim'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 group-hover:text-[#D7FF00] transition-colors shrink-0">
                    <span className="hidden sm:inline">Lihat Keputusan</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* DEDICATED QUICK SCORER TAB (KHAS TEMPAT KIRA QUICK SCORE) */}
        {activeTab === 'scorer' && (
          <div className="space-y-4 animate-card-entrance">
            
            {/* STRATEGIC PAGE HEADER: QUICK SCORER */}
            <div className="bg-[#121214] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                <div className="space-y-2.5 flex-1 min-w-0">
                  {/* Top Bar: Navigation Back Link (Left) & Info Action (Right) */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigateToTab('playground')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition active:scale-95 border border-zinc-800"
                      title="Kembali ke Laman Utama"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Laman Utama</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleHeaderInfo('scorer')}
                      className={'p-1.5 sm:p-2 rounded-xl border transition cursor-pointer shrink-0 ' + (
                        activeHeaderInfo === 'scorer'
                          ? 'bg-[#D7FF00] text-black border-[#D7FF00] shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      )}
                      title="Info sistem Quick Scorer"
                      aria-label="Info Quick Scorer"
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
                    Kiraan mata automatik PMGC 1-5 match &amp; penjana poster Overall Standings HD.
                  </p>

                  {/* Expandable Info Card */}
                  {activeHeaderInfo === 'scorer' && (
                    <div className="p-3 sm:p-3.5 bg-zinc-900/90 rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 animate-in fade-in duration-150 max-w-xl shadow-md">
                      <Zap className="w-4 h-4 text-[#D7FF00] fill-current shrink-0 mt-0.5 sm:mt-0" />
                      <p className="leading-relaxed flex-1">
                        Kiraan mata automatik 1–5 match mengikut format rasmi PMGC 10-points tanpa login. Poster HD sedia dimuat turun terus.
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

                {/* Status Indicator */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-white/10 text-xs font-mono text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-[#D7FF00] animate-pulse"></span>
                    <span>Auto-saved (Local)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Screen Grid */}
            <div id="quick-scorer-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-20">
              
              {/* LEFT PANEL: Quick Input Grid (5 Matches with Dynamic Team Rows) */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3.5">
                  
                  {/* Clean Workspace Header with Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 text-[#D7FF00] flex items-center justify-center font-black shadow-xs shrink-0">
                        <Zap className="w-5 h-5 fill-current"/>
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-white">Borang Pengisian Markah</h2>
                        <p className="text-[11px] text-zinc-400">
                          Pusingan Match {currentPlaygroundMatchIdx + 1} of 5 • {playgroundSession.matches[0]?.slots?.length || 16} Pasukan
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                      {/* Quick WhatsApp / Text Import Button */}
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs active:scale-95"
                        title="Tampal senarai nama pasukan daripada WhatsApp / Discord"
                      >
                        <Copy className="w-3.5 h-3.5 text-black"/>
                        <span>Import WA</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadDemoPlaygroundData}
                        className="px-2.5 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs"
                        title="Muat contoh preset demo untuk cuba segera"
                      >
                        <Eye className="w-3.5 h-3.5 text-black"/>
                        <span>Demo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleClearPlaygroundForm}
                        className="px-2 py-1.5 bg-zinc-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-white/5"
                        title="Kosongkan markah perlawanan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                        <span className="hidden sm:inline">Clear</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetPlaygroundToDefault}
                        className="px-2 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-white/5"
                        title="Reset semula ke format asal (Slot 1..16)"
                      >
                        <RefreshCw className="w-3.5 h-3.5"/>
                        <span className="hidden sm:inline">Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* 5-Match Segmented Bar */}
                  <div className="grid grid-cols-5 gap-1 bg-zinc-950/70 p-1 rounded-2xl">
                    {playgroundSession.matches.map((m, mIdx) => {
                      const isSelected = currentPlaygroundMatchIdx === mIdx;
                      return (
                        <button
                          key={mIdx}
                          type="button"
                          onClick={() => setCurrentPlaygroundMatchIdx(mIdx)}
                          className={'py-1.5 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-0.5 ' + (
                            isSelected 
                              ? 'bg-zinc-800 text-[#D7FF00] shadow-sm border border-white/10' 
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                          )}
                        >
                          <span className="text-[11px]">Match {mIdx + 1}</span>
                          <span className={'text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ' + (
                            isSelected ? 'bg-[#D7FF00]/20 text-[#D7FF00]' : 'text-zinc-500'
                          )}>
                            {m.map}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Title & Inline Team Slot Stepper (Clean Single Row) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={playgroundSession.title}
                        onChange={(e) => handleSetPlaygroundTitle(e.target.value)}
                        placeholder="Nama Kejohanan / Sesi Scrim (e.g. Scrim Malam Minggu)"
                        className="w-full bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#D7FF00] focus:ring-1 focus:ring-[#D7FF00]/40 transition placeholder:text-zinc-600"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 bg-zinc-950/60 px-2.5 py-1 rounded-xl shrink-0">
                      <span className="text-[11px] font-bold text-zinc-400">Slot:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleRemovePlaygroundTeam}
                          disabled={currentMatch.slots.length <= 2}
                          className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 flex items-center justify-center font-bold text-xs disabled:opacity-30 transition shadow-2xs"
                          title="Padam slot baris team terakhir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-black text-xs text-white px-1">
                          {currentMatch.slots.length} Teams
                        </span>
                        <button
                          type="button"
                          onClick={handleAddPlaygroundTeam}
                          disabled={currentMatch.slots.length >= 24}
                          className="w-6 h-6 rounded-lg bg-[#D7FF00] hover:bg-[#c2e600] text-black flex items-center justify-center font-black text-xs disabled:opacity-30 transition shadow-xs"
                          title="Tambah slot baris team baru"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Input Grid Table */}
                  <div className="border border-white/5 rounded-2xl overflow-hidden shadow-xs bg-zinc-950/60">
                    <div className="overflow-x-auto">
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
                        <tbody className="divide-y divide-white/5 font-mono">
                          {currentMatch.slots.map((row, idx) => {
                            const isWWCD = Number(row.placement) === 1 || row.wwcd;
                            return (
                              <tr 
                                key={idx} 
                                className={'transition ' + (isWWCD ? 'bg-[#D7FF00]/10 hover:bg-[#D7FF00]/15' : 'hover:bg-white/[0.02]')}
                              >
                                {/* Slot # */}
                                <td className="py-2 px-3 text-center text-zinc-500 font-bold">
                                  #{String(row.slot).padStart(2, '0')}
                                </td>

                                {/* Team Name (Synchronized across all 5 matches) */}
                                <td className="py-2 px-3 font-sans">
                                  <input
                                    type="text"
                                    data-cell={`teamName-${idx}`}
                                    value={row.teamName}
                                    onChange={(e) => handlePlaygroundSlotChange(idx, 'teamName', e.target.value)}
                                    onKeyDown={(e) => handleCellKeyDown(e, idx, 'teamName')}
                                    placeholder={`Squad ${row.slot}...`}
                                    className="w-full bg-zinc-900/90 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-[#D7FF00] focus:ring-1 focus:ring-[#D7FF00]/40 placeholder:text-zinc-600"
                                  />
                                </td>

                                {/* Placement Dropdown (Scales dynamically with total slots) */}
                                <td className="py-2 px-2 text-center">
                                  <select
                                    data-cell={`placement-${idx}`}
                                    value={row.placement || ''}
                                    onChange={(e) => handlePlaygroundSlotChange(idx, 'placement', e.target.value)}
                                    onKeyDown={(e) => handleCellKeyDown(e, idx, 'placement')}
                                    className="w-full bg-zinc-900/90 border border-white/10 rounded-lg py-1 px-1 font-bold text-white focus:outline-none focus:border-[#D7FF00] text-xs text-center cursor-pointer"
                                  >
                                    <option value="">--</option>
                                    {Array.from({ length: currentMatch.slots.length }, (_, i) => i + 1).map((num) => (
                                      <option key={num} value={num}>
                                        #{num}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Elims */}
                                <td className="py-2 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handlePlaygroundSlotChange(idx, 'elims', Math.max(0, row.elims - 1))}
                                      className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-black text-xs transition active:scale-90"
                                      title="Kurangkan 1 kill"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      min="0"
                                      data-cell={`elims-${idx}`}
                                      value={row.elims}
                                      onChange={(e) => handlePlaygroundSlotChange(idx, 'elims', e.target.value)}
                                      onKeyDown={(e) => handleCellKeyDown(e, idx, 'elims')}
                                      className="w-11 bg-zinc-900/90 border border-white/10 rounded-lg text-center py-1 text-xs font-bold text-white focus:outline-none focus:border-[#D7FF00] font-mono"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handlePlaygroundSlotChange(idx, 'elims', row.elims + 1)}
                                      className="w-6 h-6 rounded-lg bg-[#D7FF00] hover:bg-[#c2e600] text-black flex items-center justify-center font-black text-xs transition active:scale-90"
                                      title="Tambah 1 kill"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                {/* WWCD Toggle */}
                                <td className="py-2 px-2 text-center font-sans">
                                  <button
                                    type="button"
                                    onClick={() => handlePlaygroundSlotChange(idx, 'wwcd', !isWWCD)}
                                    className={'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 ' + (
                                      isWWCD 
                                        ? 'bg-[#D7FF00] text-black shadow-[0_0_12px_rgba(215, 255, 0,0.25)]' 
                                        : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-200'
                                    )}
                                  >
                                    {isWWCD ? 'WWCD' : 'Normal'}
                                  </button>
                                </td>

                                {/* Total Points for current match */}
                                <td className="py-2 px-3 text-center">
                                  <div className="font-mono font-black text-xs text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded border border-[#D7FF00]/25 inline-block">
                                    {row.totalPts}
                                  </div>
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

                  {/* Strategic Action on Mobile: Flow down to Poster */}
                  <div className="lg:hidden pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('quick-scorer-leaderboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="w-full py-3 px-4 bg-[#D7FF00] hover:bg-[#c2e600] text-black rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(215, 255, 0,0.18)] active:scale-98 uppercase tracking-wider"
                    >
                      <Trophy className="w-4 h-4 text-black" />
                      <span>Lihat Keputusan &amp; Poster ↓</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* RIGHT PANEL: Sticky Real-Time Poster Preview (Direct Overall Standings - Always Visible) */}
              <div id="quick-scorer-leaderboard" className="lg:col-span-5 lg:sticky lg:top-20 space-y-3.5 scroll-mt-20">
                
                {/* Clean State Helper Pill */}
                {!hasAnyPlaygroundScores && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-zinc-900/60 border border-white/5 rounded-2xl shadow-sm text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#D7FF00] flex-shrink-0" />
                      <div>
                        <div className="font-bold text-white text-xs">Borang Bersih &amp; Sedia Diisi</div>
                        <div className="text-[11px] text-zinc-400">Poster dikemaskini langsung bila anda isi placement &amp; elims.</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadDemoPlaygroundData}
                      className="px-2.5 py-1 bg-[#D7FF00]/15 hover:bg-[#D7FF00]/25 text-[#D7FF00] border border-[#D7FF00]/30 rounded-xl font-bold text-[11px] whitespace-nowrap transition"
                      title="Lihat contoh poster dengan data demo"
                    >
                      Cuba Demo
                    </button>
                  </div>
                )}

                {/* Poster Display Toggle: Overall Standings (Default) vs Single Match */}
                <div className="flex items-center justify-between bg-zinc-950/80 p-1 rounded-2xl text-xs">
                  <button
                    type="button"
                    onClick={() => setPosterViewMode('overall')}
                    className={'flex-1 py-1.5 px-2 rounded-xl font-black text-center transition flex items-center justify-center gap-1.5 ' + (
                      posterViewMode === 'overall'
                        ? 'bg-[#D7FF00] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <Trophy className="w-3.5 h-3.5"/>
                    <span>Overall (5M)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterViewMode('match')}
                    className={'flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition flex items-center justify-center gap-1.5 ' + (
                      posterViewMode === 'match'
                        ? 'bg-[#D7FF00] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    )}
                  >
                    <Zap className="w-3.5 h-3.5"/>
                    <span>Match {currentPlaygroundMatchIdx + 1}</span>
                  </button>
                </div>

                {/* Visual Esports Leaderboard Card (Dark Aesthetic #0D0D0D) */}
                <div 
                  ref={posterRef}
                  className="bg-[#0D0D0D] text-white rounded-3xl p-5 shadow-2xl relative font-sans select-none overflow-hidden"
                  style={{ backgroundColor: '#0D0D0D' }}
                >
                  {/* Angled background accents */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-lime-500/15 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Poster Header */}
                  <div className="relative pb-3 mb-3 border-b border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-lime-400 flex items-center justify-center text-slate-950 font-black text-xs">
                          SH
                        </div>
                        <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-lime-400 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                          <span>LIVE PMGC LEADERBOARD</span>
                        </span>
                      </div>

                      {/* Mode Badge */}
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border bg-lime-500/20 text-lime-400 border-lime-500/30">
                        {posterViewMode === 'overall' ? 'OVERALL • 5 ROUNDS' : `${currentMatch.map.toUpperCase()} • ROUND ${currentPlaygroundMatchIdx + 1}`}
                      </span>
                    </div>

                    <h3 className="text-lg font-black uppercase tracking-wider text-white truncate">
                      {playgroundSession.title ? `${playgroundSession.title.toUpperCase()} ${posterViewMode === 'overall' ? '• OVERALL' : `• R${currentPlaygroundMatchIdx + 1}`}` : 'PUBG MOBILE SCRIM • OVERALL'}
                    </h3>
                    
                    <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase flex items-center gap-2 mt-0.5">
                      <span>{posterViewMode === 'overall' ? '5 ROUNDS COMBINED' : `ROUND ${currentPlaygroundMatchIdx + 1} (${currentMatch.map})`}</span>
                      <span>•</span>
                      <span>{currentMatch.slots.length} COMPETING SQUADS</span>
                    </p>

                    {posterViewMode === 'overall' && (
                      <div className="flex items-center gap-1 mt-2 text-[9px] font-mono font-bold text-slate-400">
                        <span className="text-lime-400">MAPS:</span>
                        <span>ERANGEL • ERANGEL • MIRAMAR • MIRAMAR • RONDO</span>
                      </div>
                    )}
                  </div>

                  {/* Leaderboard Table */}
                  <div className="space-y-1 relative font-mono text-xs">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-slate-800">
                      <div className="col-span-2 text-center">RANK</div>
                      <div className="col-span-5 text-left font-sans pl-1">SQUAD / TEAM</div>
                      <div className="col-span-2 text-center text-slate-300">PLACE</div>
                      <div className="col-span-1 text-center">ELIM</div>
                      <div className="col-span-2 text-center text-lime-400">TOTAL</div>
                    </div>

                    {/* Sorted Rows */}
                    <div className="space-y-1">
                      {(posterViewMode === 'overall' ? sortedOverallLeaderboard : sortedCurrentMatchLeaderboard).map((row, pos) => {
                        const rankNumber = pos + 1;
                        const placePtsDisplay = posterViewMode === 'overall' ? row.totalPlacePts : row.placePts;
                        const hasWWCD = posterViewMode === 'overall' ? (row.totalWWCD > 0) : (Boolean(row.wwcd) || Number(row.placement) === 1);
                        const wwcdCount = posterViewMode === 'overall' ? row.totalWWCD : 1;

                        const totalPoints = posterViewMode === 'overall' ? row.totalPts : row.totalPts;
                        const elimPoints = posterViewMode === 'overall' ? row.totalElims : row.elims;
                        const isChamp = pos === 0 && (totalPoints > 0 || hasWWCD);

                        return (
                          <div 
                            key={row.slot}
                            className={'grid grid-cols-12 items-center px-2 py-1 rounded-lg text-xs transition ' + (
                              isChamp 
                                ? 'bg-gradient-to-r from-lime-500/25 via-lime-500/10 to-transparent border-l-4 border-l-lime-400 text-white font-bold' 
                                : rankNumber <= 3
                                ? 'bg-slate-900/60 border-l-2 border-l-slate-400 text-slate-200'
                                : 'bg-slate-900/30 text-slate-300 hover:bg-slate-900/50'
                            )}
                          >
                            {/* Rank */}
                            <div className="col-span-2 text-center font-bold flex items-center justify-center gap-1">
                              {isChamp ? (
                                <span className="text-lime-400 font-black">
                                  #1
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="text-slate-300">#2</span>
                              ) : rankNumber === 3 ? (
                                <span className="text-amber-500">#3</span>
                              ) : (
                                <span className="text-slate-500">#{rankNumber}</span>
                              )}
                            </div>

                            {/* Squad Name with Chicken Dinner Badge */}
                            <div className="col-span-5 text-left font-sans truncate pl-1 flex items-center gap-1.5">
                              <span className="truncate font-semibold text-white">
                                {row.teamName || `Slot #${row.slot}`}
                              </span>
                              {hasWWCD && (
                                <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider flex-shrink-0">
                                  WWCD{wwcdCount > 1 ? ` x${wwcdCount}` : ''}
                                </span>
                              )}
                            </div>

                            {/* Point Placement */}
                            <div className="col-span-2 text-center text-slate-300 font-mono font-bold">
                              {placePtsDisplay}
                            </div>

                            {/* Elims */}
                            <div className="col-span-1 text-center font-bold text-slate-300">
                              {elimPoints}
                            </div>

                            {/* Total Points */}
                            <div className="col-span-2 text-center font-black text-lime-400 font-mono">
                              {totalPoints}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Poster Footer */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    <span>GENERATED VIA SCRIM HUB</span>
                    <span>TIEBREAK: TOTAL PTS &gt; PLACEMENT PTS &gt; ELIMS &gt; WWCD</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownloadPlaygroundPoster}
                    disabled={isDownloadingPoster}
                    className="w-full py-3.5 px-4 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-2xl shadow-[0_0_20px_rgba(215, 255, 0,0.18)] text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {isDownloadingPoster ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin"/>
                        <span>Rendering...</span>
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
                    onClick={handleSaveMatchClick}
                    disabled={isSavingCloudMatch}
                    className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSavingCloudMatch ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#D7FF00]"/>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 text-[#D7FF00]"/>
                        <span>Simpan Cloud</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Strategic Action on Mobile: Return to Scoring Form */}
                <div className="lg:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('quick-scorer-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full py-2.5 px-4 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl font-black text-xs transition flex items-center justify-center gap-1.5 border border-white/5 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-90 text-[#D7FF00]" />
                    <span>Kembali Ke Borang Markah ↑</span>
                  </button>
                </div>

                {/* Local Storage Auto-Save Indicator */}
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span>
                    <span>Auto-saved</span>
                  </span>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* VIEW 1: TEAM STATS (HALL OF FAME - REFERENCE DIAL & SUMMARY LAYOUT) */}
        {activeTab === 'teams' && (() => {
          const totalTeamsCount = validTeamList.length;
          const totalScrimsCount = scrims.filter(s => (s.event_type || 'Scrim') !== 'Tour').length;
          const totalToursCount = scrims.filter(s => s.event_type === 'Tour').length;

          const rankedTeamsWithStats = filteredTeamList.map((t) => {
            const allRes = t.scrimResults || [];
            const scopedRes = teamStatsCategory === 'ALL'
              ? allRes
              : allRes.filter(r => (r.eventType || 'Scrim') === teamStatsCategory);
            const scopedPoints = scopedRes.reduce((acc, c) => acc + (Number(c.points) || 0), 0);
            const scopedKills = scopedRes.reduce((acc, c) => acc + (Number(c.kills) || 0), 0);
            const scopedWWCD = scopedRes.reduce((acc, c) => acc + (Number(c.wwcd) || 0), 0);
            return {
              ...t,
              scopedPoints,
              scopedKills,
              scopedWWCD,
              scopedEvents: scopedRes.length
            };
          }).sort((a, b) => (
            b.scopedPoints - a.scopedPoints ||
            b.scopedWWCD - a.scopedWWCD ||
            b.scopedKills - a.scopedKills
          ));

          const showAllTeams = isHallOfFameFullView || Boolean(teamSearchQuery.trim());
          const displayedRankedTeams = showAllTeams
            ? rankedTeamsWithStats
            : rankedTeamsWithStats.slice(0, 3);

          // Generate radial tick marks for the minimalist semi-circle dial (-74 deg to +74 deg)
          const dialTicks = [];
          for (let deg = -74; deg <= 74; deg += 2) {
            const rad = ((deg - 90) * Math.PI) / 180;
            const cx = 200;
            const cy = 190;
            const isMajor = deg % 10 === 0;
            const rInner = isMajor ? 148 : 151;
            const rOuter = isMajor ? 163 : 160;
            const x1 = cx + rInner * Math.cos(rad);
            const y1 = cy + rInner * Math.sin(rad);
            const x2 = cx + rOuter * Math.cos(rad);
            const y2 = cy + rOuter * Math.sin(rad);
            const distFromCenter = Math.abs(deg) / 74;
            const opacity = Math.max(0.12, (1 - distFromCenter * 0.75) * (isMajor ? 0.65 : 0.38));
            dialTicks.push({ deg, x1, y1, x2, y2, opacity, isCenter: deg === 0 });
          }

          return (
            <div className="max-w-xl lg:max-w-2xl mx-auto space-y-5 pt-1 pb-4">
              
              {/* 1. TOP NAVIGATION BAR (Following Reference: "< My Personality" + Search Right) */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => navigateToTab('playground')}
                  className="inline-flex items-center gap-2 text-white hover:text-[#D7FF00] transition cursor-pointer group"
                  title="Kembali ke Laman Utama"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-[#D7FF00] group-hover:-translate-x-0.5 transition-all" />
                  <span className="text-base sm:text-lg font-bold tracking-tight">
                    Teams
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHallOfFameSearchOpen(prev => !prev)}
                    className={
                      'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
                      (isHallOfFameSearchOpen || teamSearchQuery
                        ? 'bg-[#D7FF00] text-black shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-300 hover:text-white')
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
                        ? 'bg-[#D7FF00] text-black shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white')
                    }
                    title="Info Hall of Fame"
                    aria-label="Info Hall of Fame"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Info Card (if toggled) */}
              {activeHeaderInfo === 'teams' && (
                <div className="p-3.5 bg-[#121214] rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 animate-in fade-in duration-150 shadow-lg mx-1">
                  <Trophy className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
                  <p className="leading-relaxed flex-1">
                    Pangkalan data statistik ranking pasukan, analitik konsistensi seluruh kejohanan Malaysia, metrik win-rate dan penjana kad Story 9:16.
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

              {/* 2. HORIZONTAL FILTER PILLS BAR (Following Reference: "Mood | Style & Looks | Habbits...") */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                  { key: 'ALL', label: 'Semua Data' },
                  { key: 'Scrim', label: 'Scrim' },
                  { key: 'Tour', label: 'Tournament' }
                ].map((cat) => {
                  const isActive = teamStatsCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setTeamStatsCategory(cat.key)}
                      className={
                        'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ' +
                        (isActive
                          ? 'bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/50 shadow-[0_0_12px_rgba(215,255,0,0.15)]'
                          : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-white/10')
                      }
                    >
                      {cat.label}
                    </button>
                  );
                })}

                {rankedTeamsWithStats.slice(0, 6).map((t) => {
                  const isSelected = currentSelectedTeam === t.name;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => {
                        setSelectedTeamProfile(t.name);
                        document.getElementById('hof-team-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                      className={
                        'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ' +
                        (isSelected
                          ? 'bg-zinc-800 text-white border border-white/25'
                          : 'bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 border border-white/5')
                      }
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar (Toggled by top-right Search icon) */}
              {(isHallOfFameSearchOpen || teamSearchQuery) && (
                <div className="relative px-1 animate-in fade-in duration-150">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3" />
                  <input
                    type="text"
                    placeholder="Cari nama pasukan atau tag..."
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white focus:outline-none focus:border-[#D7FF00] transition font-semibold placeholder:text-zinc-500"
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

              {/* 3. MINIMALIST SEMI-CIRCULAR DIAL + HALL OF FAME CENTERPIECE (No Floating Icons Around It) */}
              <div className="relative pt-2 pb-3 flex flex-col items-center text-center select-none overflow-hidden">
                <svg
                  viewBox="0 0 400 130"
                  className="w-full max-w-[380px] sm:max-w-[430px] h-auto overflow-visible pointer-events-none"
                  aria-hidden="true"
                >
                  {/* Top & Bottom Center Indicator Pointers (Exact Reference Dial Marker) */}
                  <line
                    x1="200"
                    y1="10"
                    x2="200"
                    y2="22"
                    stroke="#D7FF00"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-dial-pointer"
                  />
                  <line
                    x1="200"
                    y1="46"
                    x2="200"
                    y2="58"
                    stroke="#FFFFFF"
                    strokeOpacity="0.85"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Semi-Circular Radial Tick Marks with Sweep Animation */}
                  <g key={teamStatsCategory} className="animate-dial-sweep">
                    {dialTicks.map((t) => (
                      <line
                        key={t.deg}
                        x1={t.x1}
                        y1={t.y1}
                        x2={t.x2}
                        y2={t.y2}
                        stroke={t.isCenter ? '#D7FF00' : '#E4E4E7'}
                        strokeOpacity={t.isCenter ? 0.95 : t.opacity}
                        strokeWidth={t.isCenter ? '2' : '1.25'}
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                </svg>

                {/* Center Text Inside the Dial Arc */}
                <div
                  className="-mt-14 sm:-mt-16 relative z-10 px-4 space-y-2.5 max-w-md animate-stagger-card"
                  style={{ animationDelay: '60ms' }}
                >
                  <h1 className="text-3xl sm:text-5xl font-light tracking-[0.14em] uppercase text-white">
                    HALL OF FAME
                  </h1>

                  {/* Stats Line: Jumlah Team - Jumlah Scrim - Jumlah Tournament */}
                  <div className="flex items-center justify-center gap-4 sm:gap-5 text-xs sm:text-sm font-mono text-zinc-300">
                    <span>
                      <strong className="text-white font-bold">{totalTeamsCount}</strong> Team
                    </span>
                    <span>
                      <strong className="text-white font-bold">{totalScrimsCount}</strong> Scrim
                    </span>
                    <span>
                      <strong className="text-white font-bold">{totalToursCount}</strong> Tournament
                    </span>
                  </div>

                  {/* Description Paragraph */}
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs sm:max-w-sm mx-auto pt-0.5">
                    Ranking prestasi pasukan, rekod WWCD &amp; jana kad Instagram Story 9:16.
                  </p>
                </div>
              </div>

              {/* 4. TOP PERFORM TEAM CARD (Following Reference "Mood Summary" + Top-Right View Full Button) */}
              <div
                className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-stagger-card"
                style={{ animationDelay: '140ms' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Top Perform Team
                    </h2>
                    <span className="text-[11px] text-zinc-500">
                      {showAllTeams
                        ? `Senarai penuh (${rankedTeamsWithStats.length} pasukan aktif)`
                        : 'Kedudukan 3 pasukan terbaik keseluruhan'}
                    </span>
                  </div>

                  {/* Top-Right View Full Button (↗) */}
                  {rankedTeamsWithStats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsHallOfFameFullView(prev => !prev)}
                      className={
                        'h-9 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shrink-0 ' +
                        (isHallOfFameFullView
                          ? 'bg-[#D7FF00] text-black shadow-sm'
                          : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200')
                      }
                      title={isHallOfFameFullView ? 'Tutup senarai penuh' : 'Lihat senarai penuh semua pasukan'}
                    >
                      <span>{isHallOfFameFullView ? 'Ringkas' : 'View Full'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {validTeamList.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Users className="w-7 h-7 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Tiada pasukan dengan rekod perlawanan lagi. Rekod akan muncul secara automatik sebaik sahaja markah disimpan.
                    </p>
                  </div>
                ) : displayedRankedTeams.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-400">
                    Tiada pasukan sepadan dengan tapisan semasa.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedRankedTeams.map((team, idx) => {
                      const rankNum = idx + 1;
                      const isSelected = currentSelectedTeam === team.name;
                      const badgeBg =
                        rankNum === 1
                          ? 'bg-gradient-to-br from-[#D7FF00] via-lime-300 to-emerald-400 text-black shadow-[0_0_18px_rgba(215,255,0,0.25)]'
                          : rankNum === 2
                          ? 'bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-500 text-black'
                          : rankNum === 3
                          ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 text-black'
                          : 'bg-zinc-800/90 text-zinc-200';

                      return (
                        <div
                          key={team.name}
                          onClick={() => {
                            setSelectedTeamProfile(team.name);
                            document.getElementById('hof-team-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                          style={{ animationDelay: `${180 + Math.min(idx, 8) * 60}ms` }}
                          className={
                            'p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all animate-stagger-card ' +
                            (isSelected
                              ? 'bg-zinc-800/80 shadow-md'
                              : 'hover:bg-zinc-900/70')
                          }
                        >
                          {/* Left: #Rank + Square Rounded Thumbnail Badge + Team Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={
                                'w-6 text-xs sm:text-sm font-mono font-bold shrink-0 ' +
                                (rankNum === 1
                                  ? 'text-[#D7FF00]'
                                  : rankNum === 2
                                  ? 'text-zinc-300'
                                  : rankNum === 3
                                  ? 'text-amber-400'
                                  : 'text-zinc-500')
                              }
                            >
                              #{rankNum}
                            </span>

                            <div
                              className={
                                'w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black ' +
                                badgeBg
                              }
                            >
                              <span className="text-xs sm:text-sm tracking-tight leading-none">
                                {team.tag || team.name.slice(0, 3).toUpperCase()}
                              </span>
                              <span className="text-[8px] font-mono uppercase opacity-75 mt-0.5">
                                {team.scopedWWCD > 0 ? `${team.scopedWWCD} WWCD` : 'SQUAD'}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-sm sm:text-base font-bold text-white truncate">
                                {team.name}
                              </div>
                              <div className="text-xs text-zinc-400 truncate mt-0.5">
                                {team.scopedPoints} PTS • {team.scopedKills} Elims • {team.scopedWWCD} WWCD
                              </div>
                            </div>
                          </div>

                          {/* Right: Overlapping Mini Badges + Quick IG Story Button (Following Reference Right Badges) */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden xs:flex items-center -space-x-1.5">
                              <span
                                className="w-6 h-6 rounded-full bg-zinc-900 text-[#D7FF00] text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-[#121214]"
                                title={`${team.scopedEvents} Sesi Disertai`}
                              >
                                {team.scopedEvents}S
                              </span>
                              {team.scopedWWCD > 0 && (
                                <span
                                  className="w-6 h-6 rounded-full bg-[#D7FF00] text-black text-[9px] font-mono font-black flex items-center justify-center ring-2 ring-[#121214]"
                                  title={`${team.scopedWWCD} Chicken Dinner`}
                                >
                                  🏆
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPerformanceTeam(team);
                                setSelectedPerformanceHost('ALL');
                                setPerformanceModalCategory(teamStatsCategory);
                                setIsPerformanceModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-[#D7FF00] text-zinc-300 hover:text-black text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Buka Kad Analitik & IG Story 9:16"
                            >
                              <Share2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Story 9:16</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Toggle if there are more than 3 teams */}
                {!teamSearchQuery.trim() && rankedTeamsWithStats.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setIsHallOfFameFullView(prev => !prev)}
                    className="w-full py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-xs font-bold text-zinc-300 hover:text-[#D7FF00] transition cursor-pointer"
                  >
                    {isHallOfFameFullView
                      ? 'Tunjukkan Top 3 Sahaja ↑'
                      : `Lihat Semua ${rankedTeamsWithStats.length} Pasukan ↓`}
                  </button>
                )}
              </div>

              {/* 5. SELECTED TEAM DETAILED STATS & MATCH LOGS */}
              {activeTeamData && activeTeamScopedStats && (
                <div
                  id="hof-team-detail-panel"
                  style={{ animationDelay: '260ms' }}
                  className="bg-[#121214] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 scroll-mt-20 animate-stagger-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#D7FF00] to-lime-300 flex items-center justify-center text-black font-black text-base shadow-sm">
                        {activeTeamData.tag}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-sm sm:text-base text-white">{activeTeamData.name}</h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono font-bold">
                            Rekod {teamStatsCategory === 'ALL' ? 'Keseluruhan' : teamStatsCategory}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          Klik sesi di bawah untuk lihat papan markah penuh atau jana IG Story 9:16
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPerformanceTeam(activeTeamData);
                        setSelectedPerformanceHost('ALL');
                        setPerformanceModalCategory(teamStatsCategory);
                        setIsPerformanceModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(215,255,0,0.18)] active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-black" />
                      <span>Jana IG Story 9:16</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-zinc-950/60 p-3 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Points</span>
                      <span className="text-xl font-black font-mono text-[#D7FF00]">{activeTeamScopedStats.totalPoints}</span>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Elims</span>
                      <span className="text-xl font-black font-mono text-white">{activeTeamScopedStats.totalKills}</span>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">WWCD</span>
                      <span className="text-xl font-black font-mono text-[#D7FF00]">
                        {activeTeamScopedStats.totalWWCD}
                      </span>
                    </div>
                    <div className="bg-zinc-950/60 p-3 rounded-2xl text-center">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Sesi</span>
                      <span className="text-xl font-black font-mono text-zinc-300">{activeTeamScopedStats.eventsCount}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Sejarah Perlawanan ({activeTeamScopedStats.filteredResults.length})
                      </span>
                      <span className="text-[10px] text-[#D7FF00] font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Semak Standings
                      </span>
                    </div>

                    {activeTeamScopedStats.filteredResults && activeTeamScopedStats.filteredResults.length > 0 ? (
                      activeTeamScopedStats.filteredResults.map((item, idx) => {
                        const isFirst = item.ranking === 1;
                        return (
                          <div
                            key={idx}
                            onClick={() => setInspectedScrim(item.scrimData)}
                            className={
                              'p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition ' +
                              (isFirst
                                ? 'bg-zinc-900/90 shadow-[0_0_15px_rgba(215,255,0,0.06)]'
                                : 'bg-zinc-950/60 hover:bg-zinc-900/60')
                            }
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              {item.scrimData?.logo_url && (
                                <img
                                  src={item.scrimData.logo_url}
                                  alt=""
                                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate max-w-[160px] sm:max-w-none">{item.scrimName}</span>
                                  <span
                                    className={
                                      'text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 ' +
                                      ((item.eventType || 'Scrim') === 'Tour'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-[#D7FF00]/15 text-[#D7FF00]')
                                    }
                                  >
                                    {(item.eventType || 'Scrim').toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1 flex-wrap">
                                  <span className="text-[#D7FF00] font-bold">{item.scrimTier}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px] sm:max-w-none">Host: {item.hostName}</span>
                                  <span>•</span>
                                  <span className="font-mono">{item.date}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 flex-shrink-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Kills</span>
                                <span className="text-xs font-mono font-bold text-zinc-200">{item.kills} K</span>
                              </div>
                              <div className="text-left sm:text-right">
                                <span className="text-[9px] text-zinc-500 uppercase font-bold block">Points</span>
                                <span className="text-xs font-mono font-black text-[#D7FF00]">{item.points} PTS</span>
                              </div>
                              <div className="text-right pl-1">
                                <span
                                  className={
                                    'text-xs font-black font-mono px-2.5 py-1 rounded-xl inline-block ' +
                                    (isFirst ? 'bg-[#D7FF00] text-black shadow-xs' : 'bg-zinc-800 text-zinc-300')
                                  }
                                >
                                  #{item.ranking}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-zinc-500 text-xs bg-zinc-950/60 rounded-2xl">
                        Tiada rekod bagi kategori ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* VIEW 2: LIVE LEADERBOARD & REKOD KEJOHANAN */}
        {(activeTab === 'history' || activeTab === 'leaderboard') && (
          <div className="max-w-xl lg:max-w-3xl mx-auto space-y-5 pt-1 pb-4">
            
            {/* 1. TOP NAVIGATION BAR (Exact Position & Size of Search & Info Buttons as Teams / Hall of Fame) */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => navigateToTab('playground')}
                className="inline-flex items-center gap-2 text-white hover:text-[#D7FF00] transition cursor-pointer group"
                title="Kembali ke Laman Utama"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-[#D7FF00] group-hover:-translate-x-0.5 transition-all" />
                <span className="text-base sm:text-lg font-bold tracking-tight">
                  Rekod
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHistorySearchOpen(prev => !prev)}
                  className={
                    'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ' +
                    (isHistorySearchOpen || searchScrimQuery
                      ? 'bg-[#D7FF00] text-black shadow-sm'
                      : 'bg-zinc-900/80 text-zinc-300 hover:text-white')
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
                      ? 'bg-[#D7FF00] text-black shadow-sm'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white')
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
              <div className="p-3.5 bg-[#121214] rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 animate-in fade-in duration-150 shadow-lg mx-1">
                <Flame className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
                <p className="leading-relaxed flex-1">
                  Arkib keputusan rasmi, status sesi (Completed / Pending), carta kedudukan keseluruhan pusingan &amp; cetakan poster HD.
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

            {/* 2. HEADING + CONNECTED FILTER PILLS BAR (Following Reference "Find Jobs" + Connected Pills) */}
            <div className="space-y-3.5 px-1">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  Rekod &amp; Arkib
                </h1>

                <button
                  type="button"
                  onClick={() => navigateToTab('admin')}
                  className="px-3.5 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-full text-xs transition flex items-center gap-1.5 shadow-[0_0_18px_rgba(215,255,0,0.18)] active:scale-95 cursor-pointer shrink-0"
                  title="Cipta atau urus sesi kejohanan baru di Portal Host"
                >
                  <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                  <span>Sesi Baru</span>
                </button>
              </div>

              {/* Connected Pills Row (Exact Reference Chain Style: (Semua)—(Completed)—(Pending)—(Scrim)—(Tournament)) */}
              <div className="relative flex items-center overflow-x-auto no-scrollbar py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center relative">
                  {/* Horizontal connector line behind pills */}
                  <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-zinc-800 pointer-events-none z-0" />

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
                  ].map((pill, idx) => (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={pill.onClick}
                      className={
                        'relative z-10 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ' +
                        (idx > 0 ? 'ml-2.5 ' : '') +
                        (pill.isActive
                          ? 'bg-[#D7FF00] text-black shadow-[0_0_15px_rgba(215,255,0,0.22)]'
                          : 'bg-[#18181C] text-zinc-300 hover:text-white hover:bg-zinc-800')
                      }
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Bar & Tier Filter Row (Toggled via Top-Right Search Icon or Active Query) */}
              {(isHistorySearchOpen || searchScrimQuery || tierFilter !== 'All') && (
                <div className="flex items-center gap-2 animate-in fade-in duration-150">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Cari nama scrim, penganjur atau tier..."
                      value={searchScrimQuery}
                      onChange={(e) => setSearchScrimQuery(e.target.value)}
                      className="w-full bg-[#121214] rounded-2xl pl-10 pr-8 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#D7FF00] font-semibold placeholder:text-zinc-500"
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
                    className="bg-[#121214] text-zinc-200 text-xs font-bold rounded-2xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#D7FF00] cursor-pointer shrink-0"
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

            {/* 3. SESSION CARDS LIST (Following Reference Card Hierarchy & Two-Tone Footer) */}
            {filteredScrims.length === 0 ? (
              <div className="p-12 text-center bg-[#121214] rounded-3xl shadow-2xl space-y-3 mx-1">
                <Clock className="w-10 h-10 mx-auto opacity-30 text-zinc-500" />
                <h3 className="font-black text-white text-base">Tiada Rekod Sesi Dijumpai</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Belum ada sesi kejohanan atau scrim di bawah carian atau penapis ini. Anda boleh cipta sesi baharu di Portal Host.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="px-4 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-full text-xs transition shadow-[0_0_15px_rgba(215,255,0,0.18)] cursor-pointer"
                >
                  Buka Portal Host →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                {filteredScrims.map((s, idx) => {
                  const matchCount = s.matches?.length || 0;
                  const squadCount = s.matches?.[0]?.results?.length || 16;
                  const isFinished = Boolean(s.is_finished);
                  const isOwner = currentUser && (s.created_by === currentUser.id || s.co_hosts?.includes(currentUser.id));

                  // Calculate quick top 3 summary if matches exist
                  const overallScores = calculateLeaderboard(s, 'overall');
                  const top1 = overallScores[0];
                  const top2 = overallScores[1];
                  const top3 = overallScores[2];

                  return (
                    <div
                      key={s.id}
                      style={{ animationDelay: `${80 + Math.min(idx, 8) * 60}ms` }}
                      className="bg-[#121214] hover:bg-[#151518] rounded-3xl overflow-hidden shadow-2xl transition-all flex flex-col justify-between animate-stagger-card"
                    >
                      {/* Upper Card Body */}
                      <div className="p-4 sm:p-5 space-y-3.5">
                        {/* Top Row: Left (Logo Scrim + Nama Scrim) | Right (Edit Icon Only + View ↗ Button) */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {s.logo_url ? (
                              <img
                                src={s.logo_url}
                                alt={s.title}
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
                              <h3 className="font-bold text-base sm:text-lg text-white truncate leading-snug">
                                {s.title}
                              </h3>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">
                                {s.host_name || 'Esports Organizer'}
                              </p>
                            </div>
                          </div>

                          {/* Top-Right Action Buttons: Symbol-only Edit + View ↗ */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminSelectedScrimId(s.id);
                                setActiveTab('admin');
                              }}
                              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-[#D7FF00] flex items-center justify-center transition cursor-pointer"
                              title="Sunting Sesi"
                              aria-label="Sunting Sesi"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setInspectedScrim(s)}
                              className="h-9 px-3.5 rounded-full bg-zinc-900 hover:bg-[#D7FF00] text-white hover:text-black text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                              title="Lihat Standings Sesi"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleDeleteScrim(s.id)}
                                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition cursor-pointer"
                                title="Padam Sesi"
                                aria-label="Padam Sesi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Middle Pills Row: Status Badge (Completed / Pending) + Event Type + Match/Squad Info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isFinished ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#D7FF00]/15 text-[#D7FF00]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF00]" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Pending</span>
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900 text-zinc-300">
                            {s.event_type === 'Tour' ? 'Tournament' : 'Scrim'} • {s.tier?.split(' ')[0] || 'Tier 1'}
                          </span>

                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-900 text-zinc-300 font-mono">
                            {matchCount} Match • {squadCount} Team
                          </span>
                        </div>

                        {/* Description / Standings Preview Paragraph (Following Reference 2-line Summary + Read More) */}
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {overallScores.length > 0 ? (
                            <>
                              Kedudukan Semasa: <strong className="text-white">#1 {top1?.teamName}</strong> ({top1?.totalPts} PTS)
                              {top2 ? `, #2 ${top2.teamName} (${top2.totalPts} PTS)` : ''}
                              {top3 ? `, #3 ${top3.teamName} (${top3.totalPts} PTS)` : ''}.{' '}
                            </>
                          ) : (
                            <>
                              {s.description || 'Rekod rasmi perlawanan dan kedudukan mata keseluruhan pasukan bagi sesi ini.'}{' '}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectedScrim(s)}
                            className="text-white hover:text-[#D7FF00] underline font-semibold inline cursor-pointer"
                          >
                            Lihat Penuh
                          </button>
                        </p>
                      </div>

                      {/* Bottom Contrasting Footer Bar: Left Date | Right Champion / Metric Highlight */}
                      <div className="bg-[#18181C] px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{s.date || 'Tiada Tarikh'}</span>
                        </div>

                        <div className="text-xs sm:text-sm font-black text-white truncate">
                          {top1 ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-[#D7FF00] shrink-0" />
                              <span className="truncate max-w-[130px] sm:max-w-[170px]">{top1.teamName}</span>
                              <span className="text-[#D7FF00] font-mono">{top1.totalPts} PTS</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-mono text-xs">
                              {matchCount} Match Direkod
                            </span>
                          )}
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
            
            <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#D7FF00]"/>
                  <span>Direktori Penganjur</span>
                </h2>
                <p className="text-xs text-zinc-400">Direktori penganjur &amp; hos kejohanan berdaftar.</p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3"/>
                <input
                  type="text"
                  placeholder="Cari penganjur..."
                  value={searchHostQuery}
                  onChange={(e) => setSearchHostQuery(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D7FF00] placeholder:text-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organizersList.map((host, idx) => (
                <div key={idx} className="bg-zinc-900/60 hover:bg-zinc-900/90 backdrop-blur-md rounded-3xl p-5 shadow-2xl space-y-3 flex flex-col justify-between transition">
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

                    <p className="text-xs text-zinc-300 leading-relaxed italic bg-zinc-950/60 p-2.5 rounded-xl">
                      "{host.bio}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Sesi Kejohanan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {host.scrims.slice(0, 4).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setInspectedScrim(s)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-950/60 border border-white/5 text-[11px] font-semibold text-zinc-300 hover:border-[#D7FF00]/40 hover:text-white flex items-center gap-1 transition"
                        >
                          <span>{s.title}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">({s.event_type || 'Scrim'})</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500"/>
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
            
            <div className="bg-zinc-900/60 backdrop-blur-md rounded-3xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D7FF00]"/>
                  <span>Showcase Komuniti</span>
                </h2>
                <p className="text-[11px] text-zinc-400">Klip &amp; sorotan komuniti.</p>
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
                  <div key={post.id} className="bg-zinc-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
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
            <div className="bg-zinc-900/60 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D7FF00]/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-2xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#D7FF00]/10 border border-[#D7FF00]/30 text-[#D7FF00] px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Swords className="w-3.5 h-3.5"/>
                  Esports Tournament Engine
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  SCRIM HUB <span className="text-[#D7FF00]">by ry.khor</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  SCRIM HUB is an all-in-one competitive esports management platform built specifically for PUBG Mobile tournament organizers, scrim hosts, and tier squads. Automate live match scoring, dynamic leaderboard rankings, verified career statistics, and instant social media poster generation directly in your browser.
                </p>
              </div>
            </div>

            {/* SECTION: STEP-BY-STEP PLATFORM USER GUIDE */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#D7FF00]"/>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">Platform User Guide & Feature Manual</h2>
                  <p className="text-xs text-zinc-400">Master every capability of SCRIM HUB to manage professional scrims and tournaments with ease.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* GUIDE 1: HOW ADMIN STARTS A SCRIM OR TOURNAMENT */}
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Lock className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">1. How Admin Starts a Scrim / Tour</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">FIXTURE SETUP & ROUND MANAGEMENT</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-white block">Sign In to Admin Portal</strong>
                        Navigate to the <strong>Admin Scrim</strong> tab and log in using your authorized host credentials.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-white block">Choose Event Type & Enter Details</strong>
                        Toggle between <span className="bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/30 px-1.5 py-0.5 rounded font-bold">Scrim</span> (practice) or <span className="bg-amber-400/15 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-bold">Tournament</span> (official). Fill in fixture title, organizer, tier division, contact, and upload an event logo.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-white block">Adjust Team Slots (Up to 24)</strong>
                        Use the <strong>+ Add Team</strong> and <strong>- Remove Team</strong> buttons to set the exact number of competing squads (2 to 24 teams).
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">4</span>
                      <div>
                        <strong className="text-white block">Input Match Scores & Maps</strong>
                        Select active round (Match 1, Match 2...) and the battleground map. Choose the placement from the rank dropdown and enter eliminations.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">5</span>
                      <div>
                        <strong className="text-white block">Save & Conclude</strong>
                        Click <strong>"Save Match Scores"</strong> to commit results to the database. Once all rounds finish, hit <strong>"Conclude"</strong> to lock scores permanently.
                      </div>
                    </div>
                  </div>
                </div>

                {/* GUIDE 2: COMPETITIVE POINT SYSTEM */}
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Crosshair className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">2. Official PMGC Point System</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">STANDARDIZED BATTLE ROYALE SCORING</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    SCRIM HUB uses the standard PUBG Mobile Global Championship (PMGC) 10-point scoring matrix. Points are calculated automatically per round:
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
                    <span className="font-mono font-black">1 Kill = 1 Point</span>
                  </div>
                </div>

                {/* GUIDE 3: LIVE LEADERBOARD & INSTANT POSTER GENERATOR */}
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Trophy className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">3. Live Leaderboard & Instant Posters</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">AUTOMATED SOCIAL MEDIA PUBLISHING</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                    <p>
                      The <strong>Leaderboard</strong> dynamically aggregates team standings in real-time with automated tie-breaking (Total Points &gt; WWCD Count &gt; Placement Points &gt; Elimination Points).
                    </p>

                    <div className="p-3 bg-zinc-950/60 rounded-2xl space-y-1.5">
                      <span className="text-white font-black block flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Instant Matchday Poster (Up to 24 Teams)
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        Click the <strong>"Poster PNG"</strong> button on any active session to render a dynamic graphic banner ready for Instagram or WhatsApp. It automatically scales and pulls:
                      </p>
                      <ul className="list-disc pl-4 text-[11px] text-zinc-400 space-y-0.5">
                        <li>Your uploaded tournament/scrim logo.</li>
                        <li>Verified leaderboard standings (2-24 teams) with WWCD badges.</li>
                        <li>Host &amp; organizer contact banner and session regulations without overlapping.</li>
                      </ul>
                    </div>

                    <div className="p-2.5 bg-zinc-950/60 rounded-xl text-[11px] flex items-center justify-between">
                      <span className="font-bold text-zinc-200">Copy Text Feature:</span>
                      <span className="text-zinc-400">1-click formatted text for WhatsApp &amp; Discord</span>
                    </div>
                  </div>
                </div>

                {/* GUIDE 4: TEAM STATS & CONTENT SHOWCASE */}
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 shadow-xl">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center font-black">
                      <Sparkles className="w-4 h-4"/>
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">4. Analytics, IG Story &amp; Content</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">TEAM PROFILES &amp; TIKTOK BINDING</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                    <div className="p-3 bg-zinc-950/60 rounded-2xl space-y-1">
                      <strong className="text-white block flex items-center gap-1.5">
                        <BarChart2 className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Scoped Career Statistics
                      </strong>
                      <p className="text-[11px] text-zinc-400">
                        Filter squad metrics across <strong>All Events</strong>, <strong>Scrims Only</strong>, or <strong>Tour Only</strong> to analyze kill averages, total WWCDs, and battle logs.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-950/60 rounded-2xl space-y-1">
                      <strong className="text-white block flex items-center gap-1.5">
                        <Share className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        9:16 Instagram Story Generator
                      </strong>
                      <p className="text-[11px] text-zinc-400">
                        Inside <em>Team Performance Info</em>, click <strong>"Share to IG Story"</strong> to render a vertical story card showcasing circular gauges, combat archetypes, and career points.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-950/60 rounded-2xl space-y-1">
                      <strong className="text-white block flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-[#D7FF00]"/>
                        Showcase Content &amp; Social Links
                      </strong>
                      <p className="text-[11px] text-zinc-400">
                        Use <strong>"Post Your Content"</strong> to publish match posters or bind links from TikTok and Instagram with interactive player cards.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Platform Credits & Technical Info */}
            <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                <div>
                  <h3 className="font-black text-sm text-white">Platform Credits & Technical Info</h3>
                  <p className="text-xs text-zinc-400">System infrastructure and developer identity.</p>
                </div>
                <span className="text-[10px] font-mono bg-zinc-950/60 text-zinc-300 px-2.5 py-1 rounded-full font-bold self-start sm:self-auto border border-white/10">
                  v2.7.0 • PRODUCTION READY
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-zinc-950/60 rounded-2xl space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Created & Engineered By</span>
                    <span className="font-black text-white text-sm block">ry.khor (RYAN.)</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Esports Digital Creator & Frontend Developer specializing in high-performance competitive gaming interfaces.
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
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-90 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                    >
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 text-white/70" />
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/60 rounded-2xl space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Technology Stack</span>
                  <span className="font-black text-white text-sm block">React • Tailwind CSS • Supabase</span>
                  <p className="text-zinc-400 text-[11px]">Real-time database sync, secure organizer credentials, and responsive HTML5 Canvas rendering engine.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 5B: RESULTS SCANNER (AI POSTER OCR) */}
        {activeTab === 'scrim-data' && (
          <ScrimDataHubView
            navigateToTab={navigateToTab}
            supabase={supabase}
            currentUser={currentUser}
            profileName={profileName}
            scrims={scrims}
            setScrims={setScrims}
            showToast={showToast}
          />
        )}

        {/* VIEW 6: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <div className="space-y-4 sm:space-y-6">
            
            {!currentUser ? (
              <div className="max-w-3xl mx-auto my-4 sm:my-6 bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#D7FF00]/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative">
                  
                  {/* LEFT COLUMN: Ringkasan Nilai Admin */}
                  <div className="md:col-span-6 space-y-4 md:border-r border-white/5 md:pr-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 rounded-full text-[11px] font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF00]" />
                      <span>Ruang Khas Penganjur &amp; Host</span>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        Tournament Operations Portal
                      </h2>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Log masuk untuk anjurkan kejohanan rasmi dengan simpanan kekal di cloud database.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-zinc-950/60">
                        <div className="w-7 h-7 rounded-xl bg-zinc-800 text-[#D7FF00] flex items-center justify-center font-bold shrink-0">
                          <Cloud className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs font-bold text-zinc-300">
                          Simpan Cloud &amp; Akses Multi-Device
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-zinc-950/60">
                        <div className="w-7 h-7 rounded-xl bg-zinc-800 text-[#D7FF00] flex items-center justify-center font-bold shrink-0">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs font-bold text-zinc-300">
                          Multi-Day Scrim &amp; Grand Finals
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-zinc-950/60">
                        <div className="w-7 h-7 rounded-xl bg-zinc-800 text-[#D7FF00] flex items-center justify-center font-bold shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-xs font-bold text-zinc-300">
                          Jemput Co-Host &amp; Marshall Semak Skor
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Form Login / Register */}
                  <div className="md:col-span-6 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-white">
                        {isRegisterMode ? 'Daftar Akaun Host' : 'Log Masuk Akaun Host'}
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {isRegisterMode 
                          ? 'Cipta akaun host untuk mula anjurkan kejohanan rasmi anda.'
                          : 'Sila masukkan emel & kata laluan akaun anda.'}
                      </p>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-zinc-400 uppercase font-bold mb-1 text-[10px]">Emel Penganjur</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3"/>
                          <input
                            type="email"
                            required
                            placeholder="admin@esports.com"
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#D7FF00] font-semibold placeholder:text-zinc-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-400 uppercase font-bold mb-1 text-[10px]">Kata Laluan</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3"/>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            className="w-full bg-zinc-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-[#D7FF00] font-semibold placeholder:text-zinc-600"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl transition shadow-[0_0_20px_rgba(215, 255, 0,0.18)] text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98"
                      >
                        {authLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin"/>
                            <span>Sedang Memproses...</span>
                          </>
                        ) : (
                          <span>{isRegisterMode ? 'Daftar Akaun Host' : 'Log Masuk Host'}</span>
                        )}
                      </button>

                      <div className="text-center pt-0.5">
                        <button
                          type="button"
                          onClick={() => setIsRegisterMode(!isRegisterMode)}
                          className="text-xs text-[#D7FF00] hover:underline font-semibold"
                        >
                          {isRegisterMode ? 'Sudah ada akaun? Log Masuk di sini' : "Belum ada akaun host? Daftar di sini"}
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex flex-col items-center justify-center gap-1.5 text-center">
                        <span className="text-[11px] text-zinc-400">Hanya mahu kira markah perlawanan pantas?</span>
                        <button
                          type="button"
                          onClick={() => navigateToTab('scorer')}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 font-black text-xs transition flex items-center gap-1 active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 text-[#D7FF00]" />
                          <span>Gunakan Quick Scorer (Tanpa Akaun) →</span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                
                {/* STRATEGIC PAGE HEADER: OFFICIAL SCRIM SCORING */}
                <div className="bg-[#121214] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Top Bar: Navigation Back Link (Left) & Info Action (Right) */}
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => navigateToTab('playground')}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition active:scale-95 border border-zinc-800"
                          title="Kembali ke Laman Utama"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Laman Utama</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleHeaderInfo('admin')}
                          className={'p-1.5 sm:p-2 rounded-xl border transition cursor-pointer shrink-0 ' + (
                            activeHeaderInfo === 'admin'
                              ? 'bg-[#D7FF00] text-black border-[#D7FF00] shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          )}
                          title="Info portal penganjur"
                          aria-label="Info portal penganjur"
                        >
                          <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </button>
                      </div>

                      {/* Big Highlight Title */}
                      <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                        Host Workspace
                      </h1>

                      {/* Memorable Helper Text */}
                      <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                        Pusat kawalan kejohanan rasmi, simpanan cloud database &amp; jemputan Co-Host.
                      </p>

                      {/* Expandable Info Card */}
                      {activeHeaderInfo === 'admin' && (
                        <div className="p-3 sm:p-3.5 bg-zinc-900/90 rounded-2xl text-xs text-zinc-300 flex items-start sm:items-center gap-2.5 animate-in fade-in duration-150 max-w-xl shadow-md">
                          <ShieldCheck className="w-4 h-4 text-[#D7FF00] shrink-0 mt-0.5 sm:mt-0" />
                          <p className="leading-relaxed flex-1">
                            Pusat penganjur kejohanan rasmi dengan simpanan cloud automatik, sokongan jemputan Co-Host, dan pengurusan berbilang pusingan.
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

                    {/* Right User Badge / Logout Action */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                      <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-white/10 text-xs font-mono text-zinc-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="font-bold text-white truncate max-w-[140px]">{profileName || currentUser.email.split('@')[0]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 border border-white/5 text-xs font-bold transition active:scale-95"
                        title="Log Keluar Akaun Host"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 1. ADVANCE SESSION CONTROL BAR (Sleek & Compact) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-zinc-900/60 backdrop-blur-md rounded-3xl shadow-xl">
                  {/* Left: Active Session Dropdown Selector */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#D7FF00] text-black font-black flex items-center justify-center shrink-0 shadow-xs">
                      {activeAdminScrim?.event_type === 'Tour' ? <Trophy className="w-4 h-4 text-black" /> : <Flame className="w-4 h-4 text-black" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {adminHostedScrims.length > 0 ? (
                          <div className="relative flex-1 max-w-sm">
                            <select
                              value={adminSelectedScrimId}
                              onChange={(e) => {
                                if (e.target.value === 'quick_new') {
                                  handleQuickNewSession();
                                } else {
                                  setSelectedMatchIdx(0);
                                  setAdminSelectedScrimId(e.target.value);
                                }
                              }}
                              className="w-full bg-zinc-950/90 hover:bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-black focus:outline-none focus:border-[#D7FF00] transition truncate cursor-pointer"
                            >
                              <option value="quick_new" className="bg-zinc-900 text-[#D7FF00] font-black">+ Mulakan Sesi Baru</option>
                              {adminHostedScrims.map((s) => (
                                <option key={s.id} value={s.id} className="bg-zinc-950 text-white">
                                  [{s.event_type === 'Tour' ? 'Tour' : 'Scrim'}] {s.title} {s.is_finished ? '(Locked)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-white/10 truncate max-w-[220px]">
                              {activeAdminScrim?.title || 'Official Scrim - Session 1'}
                            </span>
                            <span className="text-[10px] font-mono text-[#D7FF00] font-bold">
                              (Sedia Diisi)
                            </span>
                          </div>
                        )}

                        <span className={'inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ' + (
                          activeAdminScrim?.is_finished 
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                            : 'bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/25'
                        )}>
                          <span className={'w-1.5 h-1.5 rounded-full ' + (activeAdminScrim?.is_finished ? 'bg-amber-400' : 'bg-[#D7FF00] animate-pulse')} />
                          <span>{activeAdminScrim?.is_finished ? 'LOCKED' : (activeAdminScrim?.is_draft ? 'READY' : 'CLOUD')}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Advance Management Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={handleQuickNewSession}
                      className="px-3 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition flex items-center gap-1 shadow-xs active:scale-95"
                      title="Mula sesi kejohanan / scrim baru serta-merta tanpa modal"
                    >
                      <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
                      <span>Sesi Baru</span>
                    </button>

                    {activeAdminScrim && (
                      <>
                        <button
                          type="button"
                          onClick={openEditScrimModal}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95"
                          title="Sunting maklumat sesi (nama, tier, logo)"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#D7FF00]" />
                          <span className="hidden md:inline">Sunting</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleToggleFinishScrim}
                          className={'px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border active:scale-95 ' + (
                            activeAdminScrim.is_finished
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/10'
                          )}
                          title={activeAdminScrim.is_finished ? 'Buka kunci sesi untuk menyunting' : 'Kunci keputusan rasmi'}
                        >
                          {activeAdminScrim.is_finished ? <Unlock className="w-3.5 h-3.5" /> : <LockKeyhole className="w-3.5 h-3.5 text-zinc-400" />}
                          <span className="hidden sm:inline">{activeAdminScrim.is_finished ? 'Buka Kunci' : 'Kunci'}</span>
                        </button>

                        {isAuthorizedAdmin(activeAdminScrim) && (
                          <button
                            type="button"
                            onClick={handleCopyHostShareLink}
                            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-white/10 active:scale-95"
                            title="Salin Pautan Co-Host"
                          >
                            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="hidden md:inline">Co-Host</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteScrim(activeAdminScrim.id)}
                          className="p-1.5 sm:px-2 bg-zinc-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 border border-white/5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95"
                          title="Padam sesi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* SPLIT-SCREEN WORKSPACE (SEPERTI SCORER: INPUT SEBELAH KIRI, LIVE LEADERBOARD SEBELAH KANAN) */}
                <div id="admin-workspace-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-20">
                  
                  {/* LEFT PANEL: Match Rounds & Scoring Table (Identikal seperti Scorer) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
                      
                      {/* Clean Workspace Header with Actions (Exact Quick Scorer Style) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 text-[#D7FF00] flex items-center justify-center font-black shadow-xs shrink-0">
                            <Zap className="w-5 h-5 fill-current"/>
                          </div>
                          <div>
                            <h2 className="text-sm sm:text-base font-black text-white">
                              Borang Kemasukan Markah
                            </h2>
                            <p className="text-[11px] text-zinc-400">
                              Match {selectedMatchIdx + 1} of {adminMatchCount} • {matchSlots.length} Pasukan • [{activeAdminScrim?.title || 'Sesi Aktif'}]
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                          {/* Quick WhatsApp / Text Import Button */}
                          <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            disabled={activeAdminScrim?.is_finished}
                            className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs active:scale-95"
                            title="Tampal senarai nama pasukan daripada WhatsApp / Discord"
                          >
                            <Copy className="w-3.5 h-3.5 text-black"/>
                            <span>Import WA</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRandomizeTestData}
                            disabled={activeAdminScrim?.is_finished}
                            className="px-2.5 py-1.5 bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-40 text-black rounded-xl text-xs font-black transition flex items-center gap-1 shadow-xs active:scale-95"
                            title="Isi markah demo rawak untuk ujian pantas"
                          >
                            <Eye className="w-3.5 h-3.5 text-black"/>
                            <span>Demo</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleClearAdminForm}
                            disabled={activeAdminScrim?.is_finished}
                            className="px-2 py-1.5 bg-zinc-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-white/5 disabled:opacity-40"
                            title="Kosongkan markah perlawanan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5"/>
                            <span className="hidden sm:inline">Clear</span>
                          </button>
                        </div>
                      </div>

                      {/* Match Navigation Selector Bar with Edge Fades & Dynamic + / - Match (Exact Quick Scorer Style) */}
                      <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10 rounded-l-2xl"></div>

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
                                  title="Padam pusingan match terakhir"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleAddNewMatch}
                                className="h-8 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[#D7FF00] border border-[#D7FF00]/30 font-black text-xs transition flex items-center gap-1 active:scale-95"
                                title="Tambah pusingan match baru"
                              >
                                <Plus className="w-3.5 h-3.5 text-[#D7FF00]" />
                                <span>Match</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10 rounded-r-2xl"></div>
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

                        {/* Middle: Session Title & Sunting Info link */}
                        <button
                          type="button"
                          onClick={openEditScrimModal}
                          className="hidden md:flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white truncate px-2 py-1 rounded-lg hover:bg-zinc-800/50 transition cursor-pointer group"
                          title="Tekan untuk sunting info kejohanan"
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
                              title="Padam slot baris team terakhir"
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
                              title="Tambah slot baris team baru"
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
                            <tbody className="divide-y divide-white/5 font-mono">
                              {matchSlots.map((row, idx) => {
                                const isWWCD = Number(row.placement) === 1 || Boolean(row.wwcd);
                                return (
                                  <tr 
                                    key={idx} 
                                    className={'transition ' + (isWWCD ? 'bg-[#D7FF00]/[0.06] hover:bg-[#D7FF00]/[0.1]' : 'hover:bg-zinc-800/40')}
                                  >
                                    {/* Slot # */}
                                    <td className="py-2 px-3 text-center text-zinc-500 font-bold">
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
                                        className="w-full bg-zinc-900/90 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-[#D7FF00] placeholder:text-zinc-600 disabled:opacity-40"
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
                                        className="w-full bg-zinc-900/90 border border-white/10 rounded-lg py-1 px-1 font-bold text-white focus:outline-none focus:border-[#D7FF00] text-xs text-center disabled:opacity-40"
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
                                          className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-black text-xs transition active:scale-90 disabled:opacity-40"
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
                                          className="w-11 bg-zinc-900/90 border border-white/10 rounded-lg text-center py-1 text-xs font-bold text-white focus:outline-none focus:border-[#D7FF00] disabled:opacity-40 font-mono"
                                        />
                                        <button
                                          type="button"
                                          disabled={activeAdminScrim?.is_finished}
                                          onClick={() => handleAdjustKills(idx, 1)}
                                          className="w-6 h-6 rounded-lg bg-[#D7FF00] hover:bg-[#c2e600] text-black flex items-center justify-center font-black text-xs transition active:scale-90 disabled:opacity-40"
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
                                            ? 'bg-[#D7FF00] text-black shadow-xs font-bold' 
                                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                        )}
                                      >
                                        {isWWCD ? 'WWCD' : 'Normal'}
                                      </button>
                                    </td>

                                    {/* Total Pts */}
                                    <td className="py-2 px-3 text-center text-[#D7FF00] font-black text-sm">
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
                          <span>{activeAdminScrim?.is_finished ? 'Keputusan Dikunci' : `Simpan Skor Match ${selectedMatchIdx + 1} ke Cloud`}</span>
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
                    <div className="flex items-center justify-between bg-zinc-950/90 p-1 rounded-2xl text-xs shadow-md">
                      <button
                        type="button"
                        onClick={() => setAdminPosterViewMode('overall')}
                        className={'flex-1 py-1.5 px-2 rounded-xl font-black text-center transition flex items-center justify-center gap-1.5 ' + (
                          adminPosterViewMode === 'overall'
                            ? 'bg-[#D7FF00] text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        )}
                      >
                        <Trophy className="w-3.5 h-3.5"/>
                        <span>Overall</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminPosterViewMode('match')}
                        className={'flex-1 py-1.5 px-2 rounded-xl font-bold text-center transition flex items-center justify-center gap-1.5 ' + (
                          adminPosterViewMode === 'match'
                            ? 'bg-[#D7FF00] text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white'
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
                      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#D7FF00]/10 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

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
                        <span>Kembali Ke Isi Markah ↑</span>
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            )}
          </div>
        )}

        {/* FOOTER METADATA */}
        <div className="mt-8 pt-4 pb-2 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            SCRIM HUB ENGINE • COMPETITIVE PRODUCTION BUILD
          </p>
        </div>

      </main>

      {/* MODAL 1: TEAM PERFORMANCE & IG STORY EXPORT */}
      {isPerformanceModalOpen && performanceTeam && filteredTeamPerformance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#D7FF00] flex items-center justify-center text-black font-black text-base shadow-sm">
                  {performanceTeam.tag}
                </div>
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-1.5">
                    <span>{performanceTeam.name}</span>
                    <span className="text-[10px] bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 px-2 py-0.5 rounded-full font-mono">
                      Career Analytics
                    </span>
                  </h3>
                  <span className="text-[11px] text-zinc-400">Visual performance & organizer metrics</span>
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
                  <option value="ALL" className="bg-zinc-950 text-white">All Categories (Scrim + Tour)</option>
                  <option value="Scrim" className="bg-zinc-950 text-white">Scrim Only (Practice)</option>
                  <option value="Tour" className="bg-zinc-950 text-white">Tournament Only (Official)</option>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 bg-zinc-900/60 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Avg Points / Event</span>
                <span className="text-base font-black font-mono text-[#D7FF00]">
                  {filteredTeamPerformance.avgPts}
                </span>
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-2xl">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Avg Kills / Event</span>
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
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Filtered Sessions</span>
                <span className="text-base font-black font-mono text-zinc-300">
                  {filteredTeamPerformance.results.length} Sessions
                </span>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#D7FF00]"/>
                  <span>Points & Kills per Session</span>
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#D7FF00] font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D7FF00] inline-block"></span> Points
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-zinc-500 inline-block"></span> Kills
                  </span>
                </div>
              </div>

              {filteredTeamPerformance.results.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  No match records found under this filter scope.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {filteredTeamPerformance.results.map((item, idx) => {
                    const maxPts = Math.max(...filteredTeamPerformance.results.map(s => s.points), 40);
                    const ptsPct = Math.min(100, (item.points / maxPts) * 100);
                    const killsPct = Math.min(100, (item.kills / maxPts) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-xs flex items-center gap-1">
                            <span>{item.scrimName}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">[{item.eventType?.slice(0, 4) || 'Scri'}]</span>
                          </span>
                          <span className="font-mono text-zinc-400 text-[10px]">
                            {item.points} PTS • {item.kills} K ({item.date})
                          </span>
                        </div>
                        
                        <div className="h-4 bg-zinc-950 rounded-lg overflow-hidden flex flex-col justify-center gap-0.5 p-0.5 border border-white/5">
                          <div 
                            style={{ width: `${Math.max(5, ptsPct)}%` }} 
                            className="h-1.5 bg-[#D7FF00] rounded-full transition-all"
                          />
                          <div 
                            style={{ width: `${Math.max(5, killsPct)}%` }} 
                            className="h-1 bg-zinc-500 rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleShareToInstagramStory(
                  performanceTeam, 
                  filteredTeamPerformance, 
                  selectedPerformanceHost === 'ALL' 
                    ? 'ALL' 
                    : (organizersList.find(h => h.id === selectedPerformanceHost || h.name === selectedPerformanceHost)?.name || selectedPerformanceHost),
                  performanceModalCategory === 'ALL' ? 'Official Scrim & Tour' : (performanceModalCategory === 'Tour' ? 'Tournament' : 'Scrim')
                )}
                disabled={isGeneratingStory}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 active:scale-95 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-950/95 border border-white/10 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 relative overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[88vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 sm:pb-3 flex-shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#D7FF00]/10 border border-[#D7FF00]/20 text-[#D7FF00] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-black text-xs sm:text-sm text-white truncate">
                      Slide Panduan SCRIM HUB
                    </h3>
                    <span className="text-[9px] font-mono font-bold bg-zinc-900 text-zinc-400 px-1.5 py-0.2 rounded border border-white/10">v2.7.0</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block truncate">Panduan Penggunaan Quick Scorer &amp; Host</span>
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

            {/* Quick Jump Category Pills with Edge Fades & Modern Rounded Pills */}
            <div className="relative group flex-shrink-0">
              <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10 rounded-l-2xl"></div>

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

              <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none z-10 rounded-r-2xl"></div>
            </div>

            {/* Slide Body (Scrollable with mobile touch momentum) */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-3 sm:space-y-3.5 touch-pan-y">
              
              {/* SLIDE 0: PENGENALAN */}
              {currentGuideSlide === 0 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black text-[#D7FF00] bg-[#D7FF00]/10 px-2.5 py-0.5 rounded-full border border-[#D7FF00]/20">
                      PENGENALAN PLATFORM
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      Selamat Datang ke SCRIM HUB
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      SCRIM HUB ialah platform pengurusan &amp; kalkulator mata scrim PUBG Mobile paling pantas. 100% percuma &amp; terbuka untuk semua — daripada squad sparring santai hinggalah kejohanan komuniti rasmi.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded inline-block">1. Format Rasmi</span>
                      <h4 className="text-xs font-bold text-white">Standard Mata PMGC</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">#1 (10pts), #2 (6pts), #3 (5pts) hingga ke #8 (1pt) + 1 mata untuk setiap elim.</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded inline-block">2. Poster Automatik</span>
                      <h4 className="text-xs font-bold text-white">Live Overall Standings</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">Visual leaderboard resolusi tinggi siap dijana terus untuk WhatsApp, Discord &amp; Story.</p>
                    </div>
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#D7FF00] bg-[#D7FF00]/10 px-2 py-0.5 rounded inline-block">3. Dua Mod Selesa</span>
                      <h4 className="text-xs font-bold text-white">Pantas atau Cloud</h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">Guna Quick Scorer tanpa login, atau daftar Host untuk anjur kejohanan bersiri.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 1: PANDUAN QUICK SCORER (TEKANAN UTAMA) */}
              {currentGuideSlide === 1 && (
                <div className="space-y-3 animate-in fade-in">
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
                      Direka untuk pusingan harian atau semakan keputusan segera. Buka web dan terus masukkan mata di borang tanpa perlu sebarang persediaan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                        <h4 className="text-xs font-bold text-white">Pilih Pusingan Match</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Tekan tab <strong>Match 1</strong> hingga <strong>Match 5</strong> di bar pusingan. Anda juga boleh menamakan sesi perlawanan anda.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                        <h4 className="text-xs font-bold text-white">Taip Nama Pasukan</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Masukkan nama skuad di lajur <em>Team Name</em>. Nama pasukan automatik diselaraskan untuk kesemua 5 match!
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">3</span>
                        <h4 className="text-xs font-bold text-white">Pilih Kedudukan &amp; Kills</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Pilih nombor kedudukan (contoh: <code>#1</code>) &amp; taip jumlah kills. Sistem automatik mengira mata rasmi dan lencana WWCD.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">4</span>
                        <h4 className="text-xs font-bold text-white">Download Poster Standings</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Semak Live Overall Standings di sebelah kanan. Tekan butang <strong>Download Poster</strong> untuk simpan fail grafik HD.
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
                        setActiveTab('playground');
                        setTimeout(() => {
                          document.getElementById('quick-scorer-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 80);
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
                <div className="space-y-3 animate-in fade-in">
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
                      Direka khas untuk penganjur kejohanan, liga bertingkat (Qualifiers/Finals) dan clan esports yang memerlukan rekod tersimpan selamat.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">1</span>
                        <h4 className="text-xs font-bold text-white">Daftar Akaun Host</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Buka tab <strong>Host Workspace</strong> dan masukkan emel anda. Pendaftaran adalah terbuka &amp; segera untuk simpan data ke Cloud.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">2</span>
                        <h4 className="text-xs font-bold text-white">Cipta Sesi Kejohanan</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Tekan <strong>Sesi Baru</strong>. Tetapkan nama kejohanan, format (Scrim/Tour), dan pusingan match tanpa had.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">3</span>
                        <h4 className="text-xs font-bold text-white">Isi Keputusan &amp; Live Ranking</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Antara muka sama mudah macam Scorer! Rekod kedudukan &amp; kills dengan Live Leaderboard poster di sebelah kanan.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#D7FF00] text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">4</span>
                        <h4 className="text-xs font-bold text-white">Kunci &amp; Tamatkan Sesi</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug pl-7">
                        Bila kejohanan tamat, tekan <strong>Kunci Sesi</strong> untuk arkibkan data kekal dan kemaskini prestasi pasukan ke Database.
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
                        setActiveTab('admin');
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
                <div className="space-y-3 animate-in fade-in">
                  <div className="space-y-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-mono font-black text-zinc-300 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-white/10">
                       REKOD &amp; ANALITIK
                    </span>
                    <h2 className="text-base sm:text-xl font-black text-white">
                      Arkib History &amp; Database Prestasi
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                      Semua kejohanan yang disimpan di Host Workspace secara automatik terhimpun dalam arkib rekod dan profil analitik setiap skuad.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <div className="p-2.5 sm:p-3.5 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#D7FF00]"/>
                        <span>Tab History (Arkib Kejohanan)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Senarai perlawanan lepas yang pernah dianjurkan. Boleh semak keputusan detail setiap match, kemaskini jika ada ralat, atau padam sesi lama.
                      </p>
                    </div>

                    <div className="p-2.5 sm:p-3.5 bg-zinc-900/60 rounded-xl sm:rounded-2xl space-y-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-[#D7FF00]"/>
                        <span>Tab Database (Prestasi Pasukan)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Statistik pasukan sepanjang musim: Jumlah kills, mata purata, bilangan Chicken Dinner (WWCD) &amp; graf prestasi perlawanan.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 sm:p-3 bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-amber-900/40 border border-pink-500/20 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-pink-400">Kongsi ke Instagram Story</span>
                      <p className="text-[11px] text-zinc-300 leading-snug">
                        Di tab Database, tekan mana-mana kad pasukan dan pilih <strong>Share to IG Story</strong> untuk jana visual kad esport siap kongsi!
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 relative">
            <button
              onClick={() => {
                setIsAuthModalOpen(false);
                setPendingCloudSync(false);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white rounded-full p-1.5 hover:bg-zinc-900 transition"
              title="Close modal"
            >
              <X className="w-5 h-5"/>
            </button>

            <div className="text-center space-y-1.5 pt-1">
              <div className="w-12 h-12 bg-[#D7FF00]/10 border border-[#D7FF00]/20 text-[#D7FF00] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6"/>
              </div>
              <h3 className="text-lg font-black text-white">
                {isRegisterMode ? 'Create Host Account' : 'Host Account Portal'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isRegisterMode 
                  ? 'Sign up to organize tournaments, track team analytics, and save match fixtures.' 
                  : 'Sign in to access your tournament dashboard and save match fixtures.'}
              </p>
            </div>

            {pendingCloudSync && (
              <div className="p-3 bg-[#D7FF00]/10 border border-[#D7FF00]/20 rounded-2xl text-xs text-[#D7FF00] font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D7FF00] flex-shrink-0"/>
                <span>Your active match data is ready to be saved directly to your cloud tournament history upon signing in!</span>
              </div>
            )}

            {/* Kelebihan Akaun Host */}
            <div className="p-3 bg-zinc-900/60 rounded-2xl space-y-1.5 text-xs text-zinc-300">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF00]" />
                <span>Kelebihan Akaun Host:</span>
              </span>
              <ul className="grid grid-cols-1 gap-1 text-[11px] text-zinc-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#D7FF00] flex-shrink-0" />
                  <span>Simpan rekod perlawanan ke Cloud selamanya</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#D7FF00] flex-shrink-0" />
                  <span>Pusingan tanpa had &amp; format multi-day kejohanan</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#D7FF00] flex-shrink-0" />
                  <span>Jemput co-host isi mata &amp; database sejarah pasukan</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3"/>
                  <input
                    type="email"
                    required
                    placeholder="host@esports.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3"/>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl transition shadow-[0_0_20px_rgba(215, 255, 0,0.18)] text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin"/>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isRegisterMode ? 'Register Host Account' : 'Sign In as Host'}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-[#D7FF00] hover:underline font-semibold"
                >
                  {isRegisterMode ? 'Already have an account? Sign In' : "Don't have a host account? Register here"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DEVELOPER FEEDBACK MODAL */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D7FF00]/10 text-[#D7FF00] border border-[#D7FF00]/20 flex items-center justify-center">
                  <Bug className="w-4 h-4"/>
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Developer Feedback & Bug Report</h3>
                  <span className="text-[10px] text-zinc-400">Direct message to ry.khor</span>
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
                  placeholder="name@email.com (if follow-up is needed)"
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
                  placeholder="Describe the bug or feature recommendation in detail..."
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

      {/* MODAL 3: EDIT HOST PROFILE */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#D7FF00]"/>
                <span>Public Host Profile & Avatar</span>
              </h3>
              <button 
                onClick={() => setIsProfileModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Host Profile Picture</label>
                <div className="flex items-center space-x-3">
                  {avatarFile ? (
                    <div className="w-12 h-12 rounded-2xl bg-[#D7FF00]/10 border border-[#D7FF00]/30 flex items-center justify-center font-bold text-[#D7FF00] text-[10px]">
                      Selected
                    </div>
                  ) : profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <User className="w-5 h-5"/>
                    </div>
                  )}

                  <label className="flex-1 flex items-center justify-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 border border-dashed border-white/15 rounded-xl p-2.5 text-zinc-300 cursor-pointer transition">
                    <Upload className="w-4 h-4 text-[#D7FF00]"/>
                    <span className="truncate">{avatarFile ? avatarFile.name : 'Upload Profile Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Organizer Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RYKHOR Esports Organizer"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00] font-semibold"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">Official Contact (WhatsApp / Telegram)</label>
                <input
                  type="text"
                  placeholder="+60123456789 or @username"
                  value={profileContact}
                  onChange={(e) => setProfileContact(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 uppercase font-bold mb-1">About / Host Bio</label>
                <textarea
                  rows="3"
                  placeholder="Tell teams about your upcoming tournaments or regular scrim schedules..."
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 rounded-xl bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black shadow-xs"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CIPTA SESI KEJOHANAN / SCRIM BARU (CLOUD) */}
      {isCreateScrimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsCreateScrimOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 z-10 animate-card-entrance max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center font-black">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Cipta Sesi Kejohanan / Scrim Baru</h3>
                  <p className="text-[11px] text-zinc-400">Data disimpan terus ke Cloud Database (Supabase)</p>
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
                <span>Scrim (Practice)</span>
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
                <span>Tournament (Official)</span>
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

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-[11px] uppercase font-bold text-zinc-300 mb-1">Contact (WhatsApp / Discord)</label>
                  <input
                    type="text"
                    placeholder="cth: +60123456789"
                    value={newHostContact}
                    onChange={(e) => setNewHostContact(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D7FF00]"
                  />
                </div>
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
                  {isUploadingLogo ? 'Memproses...' : 'Cipta Sesi Kejohanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EVENT SETTINGS */}
      {isEditScrimModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
          <div className="bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative z-10 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 p-4 sm:p-5 pb-3 shrink-0">
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#D7FF00]"/>
                <span>Edit Event Settings</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUpdateScrimSettings}
                  disabled={isSavingEdit}
                  className="sm:hidden px-3.5 py-1.5 rounded-full bg-[#D7FF00] hover:bg-[#c2e600] disabled:opacity-50 text-black font-black text-xs active:scale-95 transition shadow-sm"
                >
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditScrimModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateScrimSettings} className="flex flex-col flex-1 min-h-0 text-xs">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-3 space-y-3.5 overscroll-contain">
                <div className="bg-zinc-900/60 border border-white/5 text-zinc-300 p-2.5 rounded-2xl flex items-center gap-2 text-xs">
                  <Info className="w-4 h-4 text-[#D7FF00] shrink-0" />
                  <span className="leading-snug">
                    Di sini anda boleh tukar <strong>nama sesi kejohanan</strong>, muat naik <strong>logo rasmi</strong> untuk poster, dan kemaskini <strong>description / peraturan</strong>.
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase font-bold mb-1">Event Category</label>
                  <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditEventType('Scrim')}
                      className={'flex-1 py-1.5 rounded-lg font-black transition ' + (editEventType === 'Scrim' ? 'bg-[#D7FF00] text-black shadow-xs' : 'text-zinc-400 hover:text-white')}
                    >
                      Scrim (Practice)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditEventType('Tour')}
                      className={'flex-1 py-1.5 rounded-lg font-black transition ' + (editEventType === 'Tour' ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white')}
                    >
                      Tour (Official Tournament)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase font-bold mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-zinc-400 uppercase font-bold mb-1">Host / Organizer Name</label>
                    <input
                      type="text"
                      required
                      value={editHostName}
                      onChange={(e) => setEditHostName(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 uppercase font-bold mb-1">Tier / Division</label>
                    <select
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#D7FF00] font-semibold"
                    >
                      {TIER_OPTIONS.map(t => (
                        <option key={t} value={t} className="bg-zinc-950 text-white">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase font-bold mb-1">Change Event Logo (Optional)</label>
                  <label className="flex items-center justify-center gap-2 w-full bg-zinc-900/80 hover:bg-zinc-800 border border-dashed border-white/15 rounded-xl p-2.5 text-zinc-300 cursor-pointer transition">
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
                  <label className="block text-zinc-400 uppercase font-bold mb-1">Host Contact</label>
                  <input
                    type="text"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    placeholder="e.g. +60123456789"
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase font-bold mb-1">Description & Rules (Shown on Poster)</label>
                  <textarea
                    rows="2"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#D7FF00]"
                  />
                </div>
              </div>

              {/* Pinned Bottom Footer with Safe Area Padding & Full Touch Targets */}
              <div className="flex items-center gap-2.5 p-3.5 sm:p-4 pb-6 sm:pb-4 border-t border-white/10 bg-zinc-950 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditScrimModalOpen(false)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-3">
                {inspectedScrim.logo_url && (
                  <img src={inspectedScrim.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-sm" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={'text-[10px] font-black px-2 py-0.5 rounded-full font-mono ' + (
                      inspectedScrim.event_type === 'Tour'
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-[#D7FF00]/15 text-[#D7FF00] border border-[#D7FF00]/30'
                    )}>
                      {(inspectedScrim.event_type || 'Scrim').toUpperCase()}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-white/10 font-mono">
                      {inspectedScrim.tier || 'Tier 1'}
                    </span>
                    <span className="text-[10px] text-zinc-400">{inspectedScrim.date}</span>
                    {inspectedScrim.is_finished && (
                      <span className="text-[10px] bg-[#D7FF00] text-black font-black px-2 py-0.5 rounded-full uppercase">
                        Final
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {inspectedScrim.title}
                  </h3>
                </div>
              </div>

              <button 
                onClick={() => setInspectedScrim(null)} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
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
                <span className="text-[10px] font-mono text-zinc-400 font-bold bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-md">
                  PMGC Formula (1st=10pts, 1pt/elim)
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
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

                    <div className="flex items-center space-x-3 text-right font-mono">
                      <span className="text-zinc-400 text-[11px]">{teamRow.killPts} K</span>
                      <span className="text-[#D7FF00] font-black text-sm">{teamRow.totalPts} PTS</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 font-mono text-center pt-1">
                *Kedudukan disusun automatik mengikut Total PTS → Placement PTS → Kill PTS → WWCD.
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminSelectedScrimId(inspectedScrim.id);
                    setActiveTab('admin');
                    setInspectedScrim(null);
                  }}
                  className="px-3.5 py-2 bg-[#D7FF00] hover:bg-[#c2e600] text-black font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(215, 255, 0,0.18)]"
                >
                  <Edit3 className="w-3.5 h-3.5"/>
                  <span>Sunting</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyDiscordText(inspectedScrim)}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-white/10"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-950/95 border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setIsQuickCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[#121214] rounded-3xl p-5 shadow-2xl space-y-4 z-10 animate-card-entrance">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center font-black shadow-sm">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Pilih Tindakan (+)</h3>
                  <p className="text-[11px] text-zinc-400">Pilih salah satu daripada 3 fungsi utama</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Selection 1: Quick Score */}
              <button
                type="button"
                onClick={() => navigateToTab('scorer')}
                className="w-full p-3.5 rounded-2xl bg-[#18181C] hover:bg-zinc-800/90 transition flex items-center gap-3 text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#D7FF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">1. Quick Score</span>
                    <span className="text-[9px] font-bold text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">1–5 Match</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                    Kira markah pantas &amp; jana poster HD tanpa perlu login.
                  </p>
                </div>
              </button>

              {/* Selection 2: Admin Scorer */}
              <button
                type="button"
                onClick={() => {
                  navigateToTab('admin');
                  setIsCreateScrimOpen(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-[#18181C] hover:bg-zinc-800/90 transition flex items-center gap-3 text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D7FF00] text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">2. Admin Scorer</span>
                    <span className="text-[9px] font-black text-black bg-[#D7FF00] px-1.5 py-0.5 rounded">Cloud Host</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                    Kejohanan rasmi Cloud, pusingan penuh, database &amp; co-host.
                  </p>
                </div>
              </button>

              {/* Selection 3: Results Scanner */}
              <button
                type="button"
                onClick={() => navigateToTab('scrim-data')}
                className="w-full p-3.5 rounded-2xl bg-[#D7FF00]/10 hover:bg-[#D7FF00]/15 transition flex items-center gap-3 text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-[#D7FF00] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                  <Database className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">3. Results Scanner</span>
                    <span className="text-[9px] font-black text-[#D7FF00] bg-[#D7FF00]/15 px-1.5 py-0.5 rounded">AI OCR</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                    AI Poster OCR Scanner, audit matematik &amp; simpan kedudukan kejohanan secara automatik.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK IMPORT DARI WHATSAPP / DISCORD MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="fixed inset-0"
            onClick={() => setIsImportModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-zinc-950/95 rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 space-y-4 z-10 animate-card-entrance">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-black shadow-sm">
                  <Copy className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Import Pasukan (WhatsApp / Teks)</h3>
                  <p className="text-[11px] text-zinc-400">Tampal senarai pasukan dari chat WhatsApp atau Discord</p>
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
                  <span>Format Disokong Automatik:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed font-mono text-[10px]">
                  1. Geek Fam<br/>
                  2. SEM9 Esports<br/>
                  3. Yoodo Alliance<br/>
                  Slot 4: Vampire Esports...
                </p>
                <p className="text-[10px] text-zinc-400">Nombor, bullet, dan prefix &quot;Slot&quot; akan dibersihkan secara automatik ke semua 5 perlawanan.</p>
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
                  {importRawText.trim() ? `${importRawText.trim().split(/\r?\n/).filter(l => l.trim().length > 0).length} baris dikesan` : 'Menunggu input...'}
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

      {/* FLOATING ACTION PILL ON MOBILE: SLEEK ERGONOMIC THUMB ZONE SHORTCUT */}
      {(activeTab === 'scorer' || (activeTab === 'admin' && adminHostedScrims.length > 0)) && (
        <div className={'lg:hidden fixed bottom-20 right-4 z-40 ' + (isEditScrimModalOpen ? 'hidden pointer-events-none' : '')}>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'admin') {
                if (isScrolledToPoster) {
                  document.getElementById('admin-workspace-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  document.getElementById('admin-leaderboard-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              } else {
                if (isScrolledToPoster) {
                  document.getElementById('quick-scorer-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  document.getElementById('quick-scorer-leaderboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }}
            className="px-3.5 py-2 rounded-full bg-zinc-950/95 backdrop-blur-md text-[#D7FF00] border border-[#D7FF00]/30 shadow-[0_4px_25px_rgba(0,0,0,0.65)] flex items-center gap-1.5 active:scale-95 transition-all text-xs font-black group"
            title={isScrolledToPoster ? 'Kembali ke borang isi markah' : 'Lihat pratonton poster'}
            aria-label={isScrolledToPoster ? 'Scroll to scoring' : 'Scroll to poster'}
          >
            {isScrolledToPoster ? (
              <>
                <ChevronLeft className="w-3.5 h-3.5 rotate-90 text-[#D7FF00]" />
                <span>Borang Markah</span>
              </>
            ) : (
              <>
                <Trophy className="w-3.5 h-3.5 text-[#D7FF00]" />
                <span>Poster</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* MINIMALIST FLOATING PILL MOBILE NAVBAR (FIXED SLOTS, ZERO JITTER, SLEEK & THIN) */}
      <nav
        aria-label="Mobile Navigation"
        className={'md:hidden fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[340px] pointer-events-auto ' + (isEditScrimModalOpen ? 'hidden pointer-events-none' : '')}
      >
        <div className="bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-full px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.7),0_0_1px_1px_rgba(255,255,255,0.06)] flex items-center justify-between">
          
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => navigateToTab('playground')}
            title="Laman Utama"
            aria-label="Home"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 ' + (
              activeTab === 'playground' || activeTab === 'home'
                ? 'text-[#D7FF00]'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Home className={'w-5 h-5 ' + (activeTab === 'playground' || activeTab === 'home' ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(215, 255, 0,0.4)]' : 'stroke-[1.8]')} />
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'playground' || activeTab === 'home' ? 'font-black' : 'font-medium')}>
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
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Trophy className={'w-5 h-5 ' + (activeTab === 'history' || activeTab === 'leaderboard' ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(215, 255, 0,0.4)]' : 'stroke-[1.8]')} />
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'history' || activeTab === 'leaderboard' ? 'font-black' : 'font-medium')}>
              Rekod
            </span>
          </button>

          {/* CENTER HERO: [+] 3-Selection Action Menu (1 Quick Score, 2 Admin Scorer, 3 Scrim Data) */}
          <div className="shrink-0 px-1">
            <button
              type="button"
              onClick={() => setIsQuickCreateModalOpen(prev => !prev)}
              title="Pilih: 1. Quick Score, 2. Admin Scorer, 3. Scrim Data"
              aria-label="Open Action Menu"
              className={'relative w-11 h-11 rounded-full flex items-center justify-center select-none -translate-y-2 transition-all duration-200 ease-out active:scale-90 border-2 border-zinc-950 cursor-pointer ' + (
                isQuickCreateModalOpen || activeTab === 'scorer' || activeTab === 'scrim-data'
                  ? 'bg-[#D7FF00] text-black ring-2 ring-[#D7FF00] ring-offset-2 ring-offset-zinc-950 shadow-[0_0_22px_rgba(215, 255, 0,0.6)] scale-105'
                  : 'bg-[#D7FF00] text-black shadow-[0_0_14px_rgba(215, 255, 0,0.3)] hover:scale-105'
              )}
            >
              {/* Soft ambient breathing halo */}
              <span
                className={'absolute -inset-1 rounded-full bg-[#D7FF00] pointer-events-none -z-10 transition-opacity duration-300 ' + (
                  isQuickCreateModalOpen || activeTab === 'scorer' || activeTab === 'scrim-data'
                    ? 'opacity-35 blur-sm animate-pulse'
                    : 'opacity-15 blur-[2px] animate-pulse [animation-duration:3s]'
                )}
              />

              <Plus className={'w-5 h-5 text-black stroke-[3] transition-transform duration-200 ' + (
                isQuickCreateModalOpen ? 'rotate-45' : 'rotate-0'
              )} />
            </button>
          </div>

          {/* Tab 4: Teams */}
          <button
            type="button"
            onClick={() => navigateToTab('teams')}
            title="Hall of Fame & Database Pasukan"
            aria-label="Teams"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 ' + (
              activeTab === 'teams' || activeTab === 'database'
                ? 'text-[#D7FF00]'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Users className={'w-5 h-5 ' + (activeTab === 'teams' || activeTab === 'database' ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(215, 255, 0,0.4)]' : 'stroke-[1.8]')} />
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'teams' || activeTab === 'database' ? 'font-black' : 'font-medium')}>
              Teams
            </span>
          </button>

          {/* Tab 5: Host */}
          <button
            type="button"
            onClick={() => navigateToTab('admin')}
            title="Portal Host"
            aria-label="Host"
            className={'flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none active:scale-95 relative ' + (
              activeTab === 'admin'
                ? 'text-[#D7FF00]'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <div className="relative">
              {currentUser ? (
                <ShieldCheck className={'w-5 h-5 ' + (activeTab === 'admin' ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(215, 255, 0,0.4)]' : 'stroke-[1.8]')} />
              ) : (
                <User className={'w-5 h-5 ' + (activeTab === 'admin' ? 'stroke-[2.5] drop-shadow-[0_0_8px_rgba(215, 255, 0,0.4)]' : 'stroke-[1.8]')} />
              )}
              {currentUser && activeTab !== 'admin' && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#D7FF00] border border-zinc-950"></span>
              )}
            </div>
            <span className={'text-[10px] tracking-tight mt-0.5 leading-none ' + (activeTab === 'admin' ? 'font-black' : 'font-medium')}>
              Host
            </span>
          </button>

        </div>
      </nav>

    </div>
  );
}