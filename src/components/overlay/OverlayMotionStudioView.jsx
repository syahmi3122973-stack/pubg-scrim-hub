import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileCode2,
  Film,
  FolderArchive,
  Grid3X3,
  ImagePlus,
  Layers,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  Tv,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import OverlayStage from './OverlayStage';
import { ELEMENT_BOXES, fileToOptimizedDataUrl } from './overlayEngine';
import { PRESETS } from './presets';
import {
  buildClientPackZip,
  generateStandaloneHtml,
  inlineConfigAssets,
} from './standaloneHtml';
import {
  buildObsUrl,
  createSyncChannel,
  parseObsRouteParams,
  postSyncMessage,
  PRODUCTION_ORIGIN,
  saveStoredConfig,
} from './sync';
import { exportOverlayWebm, getSupportedWebmMimeType } from './webmExporter';

const TABS = [
  { id: 'sponsors', label: 'Sponsors', Icon: Layers },
  { id: 'loop', label: 'Loop', Icon: Sliders },
  { id: 'stinger', label: 'Stinger', Icon: Zap },
  { id: 'obs', label: 'Client Export', Icon: Film },
];

const STINGER_STYLES = [
  {
    value: 'matrix-wipe',
    name: 'Matrix Grid Wipe',
    desc: 'Panel obsidian dengan grid ScrimHub & pinggir Electric Lime',
  },
  {
    value: 'volt-slash',
    name: 'Volt Lime Slash',
    desc: 'Potongan bilah diagonal pantas Electric Lime merentasi skrin',
  },
  {
    value: 'radar-pulse',
    name: 'Radar Pulse Iris',
    desc: 'Gelombang bulatan taktikal obsidian & iris reveal',
  },
  {
    value: 'standings-shutter',
    name: 'Standings Shutter',
    desc: '8 jalur mendatar gaya jadual standings menutup & membuka skrin',
  },
];

const CORNERS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export default function OverlayMotionStudioView() {
  const route = useMemo(() => parseObsRouteParams(), []);
  const [config, setConfig] = useState(route.initialConfig);
  const [activeTab, setActiveTab] = useState('sponsors');
  const [backdrop, setBackdrop] = useState('erangel');
  const [customBackdropUrl, setCustomBackdropUrl] = useState(null);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [loopPaused, setLoopPaused] = useState(false);
  const [stingerRunKey, setStingerRunKey] = useState(0);
  const [stingerActive, setStingerActive] = useState(false);
  const [activeSponsorIdx, setActiveSponsorIdx] = useState(0);
  const [copiedTopUrl, setCopiedTopUrl] = useState(false);

  // Sponsor panel local states
  const [dragOverId, setDragOverId] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Export panel local states
  const [obsLayer, setObsLayer] = useState('all');
  const [obsOrigin, setObsOrigin] = useState(PRODUCTION_ORIGIN);
  const [copiedObsUrl, setCopiedObsUrl] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [loopExportSec, setLoopExportSec] = useState(() => {
    const count = Math.max(1, route.initialConfig.sponsors.filter((s) => s.active).length);
    return Math.min(40, Math.round(route.initialConfig.loop.cornerDurationSec * count));
  });
  const [exportState, setExportState] = useState({
    running: false,
    target: null,
    progress: 0,
    error: null,
    lastFile: null,
  });

  const channelRef = useRef(null);
  const tabRefs = useRef([]);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!route.isObs) return undefined;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.backgroundColor = 'transparent';
    document.body.style.backgroundColor = 'transparent';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [route.isObs]);

  useEffect(() => {
    const channel = createSyncChannel();
    channelRef.current = channel;

    const handleMsg = (ev) => {
      const msg = ev.data;
      if (!msg || !msg.type) return;
      if (msg.type === 'CONFIG_UPDATE' && msg.payload && msg.payload.sponsors) {
        setConfig(msg.payload);
      } else if (msg.type === 'TRIGGER_STINGER') {
        setStingerRunKey((k) => k + 1);
      } else if (msg.type === 'TOGGLE_LOOP' && msg.payload && typeof msg.payload.paused === 'boolean') {
        setLoopPaused(msg.payload.paused);
      }
    };

    channel?.addEventListener('message', handleMsg);

    const handleStorage = (ev) => {
      if (ev.key === 'scrimhub:overlay-motion:v1' && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          if (parsed?.sponsors) setConfig(parsed);
        } catch {
          // Ignore malformed storage payload
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      channel?.removeEventListener('message', handleMsg);
      channel?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateConfig = useCallback((next) => {
    setConfig(next);
    saveStoredConfig(next);
    postSyncMessage(channelRef.current, {
      type: 'CONFIG_UPDATE',
      payload: next,
      timestamp: Date.now(),
    });
  }, []);

  const triggerStinger = useCallback(() => {
    setStingerRunKey((k) => k + 1);
    postSyncMessage(channelRef.current, {
      type: 'TRIGGER_STINGER',
      timestamp: Date.now(),
    });
  }, []);

  const toggleLoopPaused = useCallback(() => {
    setLoopPaused((prev) => {
      const next = !prev;
      postSyncMessage(channelRef.current, {
        type: 'TOGGLE_LOOP',
        payload: { paused: next },
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (route.isObs) return undefined;
    const onKeyDown = (e) => {
      if (e.code !== 'Space') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      e.preventDefault();
      triggerStinger();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [route.isObs, triggerStinger]);

  const obsUrl = useMemo(() => buildObsUrl(config, obsLayer, obsOrigin), [config, obsLayer, obsOrigin]);
  const supportedMime = useMemo(() => getSupportedWebmMimeType(), []);

  // Pure OBS Browser Source view
  if (route.isObs) {
    return (
      <OverlayStage
        config={config}
        backdrop="alpha"
        showSafeZones={false}
        loopPaused={loopPaused}
        stingerRunKey={stingerRunKey}
        layer={route.layer}
        isObs
      />
    );
  }

  const activeSponsors = config.sponsors.filter((s) => s.active);
  const currentSponsor = activeSponsors[activeSponsorIdx % Math.max(1, activeSponsors.length)];
  const cutPointMs = Math.round(config.stinger.durationMs * config.stinger.cutPointRatio);

  const switchPreset = (mode) => {
    updateConfig(structuredClone(PRESETS[mode]));
  };

  const handleCopyTopObsUrl = async () => {
    try {
      await navigator.clipboard.writeText(buildObsUrl(config, 'all', obsOrigin));
      setCopiedTopUrl(true);
      setTimeout(() => setCopiedTopUrl(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleCopyObsUrl = async () => {
    try {
      await navigator.clipboard.writeText(obsUrl);
      setCopiedObsUrl(true);
      setTimeout(() => setCopiedObsUrl(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleTabKeyDown = (e, idx) => {
    let nextIdx = idx;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = TABS.length - 1;
    else return;
    e.preventDefault();
    setActiveTab(TABS[nextIdx].id);
    tabRefs.current[nextIdx]?.focus();
  };

  // Sponsor handlers
  const updateSponsor = (id, patch) => {
    updateConfig({
      ...config,
      sponsors: config.sponsors.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const moveSponsor = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= config.sponsors.length) return;
    const copy = [...config.sponsors];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    updateConfig({ ...config, sponsors: copy });
  };

  const removeSponsor = (id) => {
    if (config.sponsors.length <= 1) return;
    updateConfig({ ...config, sponsors: config.sponsors.filter((s) => s.id !== id) });
  };

  const handleFileForSponsor = async (id, file) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Fail mestilah gambar PNG, SVG, atau WebP.');
      return;
    }
    try {
      const dataUrl = await fileToOptimizedDataUrl(file);
      updateSponsor(id, { logoDataUrl: dataUrl, isSample: false });
    } catch {
      setUploadError('Gagal membaca fail logo. Cuba format PNG/SVG lain.');
    }
  };

  const handleAddSponsor = async (file) => {
    setUploadError(null);
    const id = `sp-${Date.now()}`;
    let logoDataUrl = null;
    let name = `SPONSOR ${config.sponsors.length + 1}`;
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Fail mestilah gambar PNG, SVG, atau WebP.');
        return;
      }
      try {
        logoDataUrl = await fileToOptimizedDataUrl(file);
        name = file.name.replace(/\.[^.]+$/, '').slice(0, 20).toUpperCase();
      } catch {
        setUploadError('Gagal memproses fail logo.');
        return;
      }
    }

    const next = {
      id,
      name,
      tier: 'OFFICIAL PARTNER',
      tagline: 'SPONSORED SEGMENT',
      accentColor: '#D7FF00',
      logoDataUrl,
      monogram: name.slice(0, 2) || 'SP',
      active: true,
      isSample: !file,
    };
    updateConfig({ ...config, sponsors: [...config.sponsors, next] });
  };

  const handleEmblemUpload = async (file) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await fileToOptimizedDataUrl(file);
    updateConfig({ ...config, stinger: { ...config.stinger, emblemDataUrl: dataUrl } });
  };

  const handleCustomBackdropUpload = async (file) => {
    if (!file.type.startsWith('image/')) return;
    const dataUrl = await fileToOptimizedDataUrl(file, 1920);
    setCustomBackdropUrl(dataUrl);
    setBackdrop('custom');
  };

  // Client deliverable handlers
  const handleDownloadStandaloneHtml = async (target) => {
    const resolved = await inlineConfigAssets(config);
    const html = generateStandaloneHtml(resolved, target);
    const filenameMap = {
      'logo-only': '00-sponsor-logo-only.html',
      corner: '01-sponsor-corner-badge.html',
      ticker: '02-sponsor-ticker-bar.html',
      podium: '03-sponsor-podium-card.html',
      stinger: '04-stinger-transition.html',
    };
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    triggerBlobDownload(blob, filenameMap[target]);
    setExportState((prev) => ({ ...prev, error: null, lastFile: filenameMap[target] }));
  };

  const handleDownloadClientZip = async () => {
    if (zipBusy) return;
    setZipBusy(true);
    try {
      const zipBlob = await buildClientPackZip(config);
      const filename = `scrimhub-overlay-client-pack-${config.presetMode}.zip`;
      triggerBlobDownload(zipBlob, filename);
      setExportState((prev) => ({ ...prev, error: null, lastFile: filename }));
    } catch (err) {
      setExportState((prev) => ({
        ...prev,
        error: err?.message || 'Gagal menjana fail ZIP.',
      }));
    } finally {
      setZipBusy(false);
    }
  };

  const handleExportWebm = async (target) => {
    if (exportState.running) return;
    const controller = new AbortController();
    abortRef.current = controller;

    const durationMs =
      target === 'stinger' ? config.stinger.durationMs : Math.max(2000, loopExportSec * 1000);

    setExportState({ running: true, target, progress: 0, error: null, lastFile: null });

    try {
      const blob = await exportOverlayWebm({
        target,
        config,
        durationMs,
        onProgress: (ratio) => setExportState((prev) => ({ ...prev, progress: ratio })),
        signal: controller.signal,
      });

      const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
      const nameMap = {
        stinger: `scrimhub-stinger-${config.stinger.style}-cut${cutPointMs}ms-${stamp}.webm`,
        'logo-only': `scrimhub-logo-only-360x180-${stamp}.webm`,
        corner: `scrimhub-sponsor-corner-472x148-${stamp}.webm`,
        ticker: `scrimhub-sponsor-ticker-1832x84-${stamp}.webm`,
        podium: `scrimhub-sponsor-podium-736x304-${stamp}.webm`,
        loop: `scrimhub-sponsor-full-1920x1080-${stamp}.webm`,
      };
      const filename = nameMap[target];
      triggerBlobDownload(blob, filename);
      setExportState({ running: false, target: null, progress: 1, error: null, lastFile: filename });
    } catch (err) {
      if (err?.name === 'AbortError') {
        setExportState({
          running: false,
          target: null,
          progress: 0,
          error: 'Export dibatalkan.',
          lastFile: null,
        });
      } else {
        setExportState({
          running: false,
          target: null,
          progress: 0,
          error: err?.message || 'Export gagal.',
          lastFile: null,
        });
      }
    } finally {
      abortRef.current = null;
    }
  };

  const deliverables = [
    {
      id: 'logo-only',
      title: 'Pure Logo Loop (Starting Soon / Scene)',
      sizeLabel: `${ELEMENT_BOXES['logo-only'].width}×${ELEMENT_BOXES['logo-only'].height} (Logo Sahaja)`,
      note: 'Cuma seketul logo berputar tanpa kad atau teks — letak terus atas scene Starting Soon.',
    },
    {
      id: 'stinger',
      title: 'Stinger Transition',
      sizeLabel: `${ELEMENT_BOXES.stinger.width}×${ELEMENT_BOXES.stinger.height} • Cut ${cutPointMs}ms`,
      note: 'Fail transisi berasingan (alpha). Untuk OBS Stinger atau Browser Source.',
    },
    {
      id: 'corner',
      title: 'Sponsor Corner Badge',
      sizeLabel: `${ELEMENT_BOXES.corner.width}×${ELEMENT_BOXES.corner.height} (Cropped)`,
      note: 'Client bebas drag, resize & letak di mana-mana penjuru atau sebelah cam.',
    },
    {
      id: 'ticker',
      title: 'Sponsor Ticker Bar',
      sizeLabel: `${ELEMENT_BOXES.ticker.width}×${ELEMENT_BOXES.ticker.height} (Cropped)`,
      note: 'Marquee bar berasingan. Client boleh letak di bawah atau atas skrin.',
    },
    {
      id: 'podium',
      title: 'Sponsor Podium Card',
      sizeLabel: `${ELEMENT_BOXES.podium.width}×${ELEMENT_BOXES.podium.height} (Cropped)`,
      note: 'Kad showcase sponsor gaya ScrimHub untuk scene Lobby / Intermission.',
    },
  ];

  const inputClass =
    'w-full bg-[#070709] border border-white/[0.10] hover:border-white/[0.20] focus:border-[#D7FF00] focus:outline-none rounded-lg px-2.5 py-1.5 text-sm text-zinc-100 transition';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-black text-zinc-100 flex flex-col font-sans antialiased selection:bg-[#D7FF00] selection:text-black">
      {/* Top ScrimHub Studio Bar */}
      <header className="bg-[#0A0A0A] border-b border-white/[0.08] px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="SCRIMHUB"
            className="w-6 h-6 rounded-md border border-white/10 object-cover"
          />
          <span className="text-zinc-600 font-mono text-xs">/</span>
          <span className="text-[13px] font-semibold tracking-tight text-zinc-100">scrimhub</span>
          <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.02]">
            ry.khor
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#D7FF00]/25 bg-[#D7FF00]/10 text-[#D7FF00]">
            Overlay Studio
          </span>
        </div>

        {/* Preset Switcher (ScrimHub pill style) */}
        <div
          role="group"
          aria-label="Preset siaran"
          className="inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5 gap-0.5"
        >
          <button
            type="button"
            onClick={() => switchPreset('tournament')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              config.presetMode === 'tournament'
                ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Tournament Scrim
          </button>
          <button
            type="button"
            onClick={() => switchPreset('streamer')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              config.presetMode === 'streamer'
                ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Personal Streamer
          </button>
          <button
            type="button"
            onClick={() => switchPreset('logo-only')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              config.presetMode === 'logo-only'
                ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Starting Soon / Logo Only
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => switchPreset(config.presetMode)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.12] hover:border-white/[0.26] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium text-zinc-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopyTopObsUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition cursor-pointer"
          >
            {copiedTopUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedTopUrl ? 'URL Disalin' : 'Salin URL OBS'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_410px]">
        {/* Left: Broadcast Stage & Cue Bar */}
        <section
          aria-label="Paparan Stage Overlay"
          className="bg-black p-4 flex flex-col gap-3 overflow-y-auto"
        >
          {/* Stage Top Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-zinc-400 mr-1">Latar Stage:</span>
              {[
                { id: 'erangel', label: 'PUBG Sim', Icon: Eye },
                { id: 'alpha', label: 'Alpha Grid', Icon: Grid3X3 },
                { id: 'chroma', label: 'Chroma', Icon: ShieldCheck },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBackdrop(b.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    backdrop === b.id
                      ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                      : 'bg-[#0A0A0C] border border-white/[0.10] text-zinc-300 hover:border-white/[0.24]'
                  }`}
                >
                  <b.Icon className="w-3.5 h-3.5" />
                  {b.label}
                </button>
              ))}
              <label
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  backdrop === 'custom'
                    ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                    : 'bg-[#0A0A0C] border border-white/[0.10] text-zinc-300 hover:border-white/[0.24]'
                }`}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {customBackdropUrl ? 'Scene Sendiri' : 'Uji Atas Scene'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCustomBackdropUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSafeZones}
                  onChange={(e) => setShowSafeZones(e.target.checked)}
                  className="accent-[#D7FF00] rounded cursor-pointer"
                />
                Safe Zones (90% / 93%)
              </label>
              <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded bg-[#0A0A0C] border border-white/[0.10] text-zinc-400">
                1920×1080 • 60FPS
              </span>
            </div>
          </div>

          {/* 16:9 Broadcast Canvas */}
          <OverlayStage
            config={config}
            backdrop={backdrop}
            customBackdropUrl={customBackdropUrl}
            showSafeZones={showSafeZones}
            loopPaused={loopPaused}
            stingerRunKey={stingerRunKey}
            onActiveSponsorChange={setActiveSponsorIdx}
            onStingerActiveChange={setStingerActive}
          />

          {/* Cue & Telemetry Bar */}
          <div className="bg-[#0A0A0C] border border-white/[0.10] rounded-xl px-3.5 py-2.5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLoopPaused}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.12] bg-[#141418] hover:bg-[#1C1C22] text-xs font-semibold text-zinc-100 transition cursor-pointer"
              >
                {loopPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {loopPaused ? 'Play Loop' : 'Pause Loop'}
              </button>

              <button
                type="button"
                onClick={triggerStinger}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D7FF00] hover:bg-[#e5ff47] active:scale-[0.98] text-zinc-950 text-xs font-extrabold transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {stingerActive ? 'Stinger Aktif…' : 'Uji Stinger [Space]'}
              </button>
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  On Air Sponsor
                </div>
                <div className="text-xs font-bold text-[#D7FF00]">
                  {currentSponsor ? currentSponsor.name : 'TIADA'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Stinger Cut Point
                </div>
                <div className="text-xs font-mono font-bold tabular-nums text-emerald-300">
                  {cutPointMs} ms
                </div>
              </div>
            </div>
          </div>

          {/* Active Layers Strip */}
          <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-3.5 py-2 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-zinc-400 mr-1">Layer Aktif:</span>
              {[
                { key: 'logoOnlyEnabled', label: 'Logo Only' },
                { key: 'cornerEnabled', label: 'Corner Badge' },
                { key: 'tickerEnabled', label: 'Ticker Bar' },
                { key: 'podiumEnabled', label: 'Podium Card' },
              ].map((item) => {
                const enabled = config.loop[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, [item.key]: !enabled },
                      })
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      enabled
                        ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                        : 'bg-[#111114] border border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px]">Sedia untuk OBS</span>
            </div>
          </div>
        </section>

        {/* Right: ScrimHub Inspector Dock */}
        <aside
          aria-label="Konfigurasi Overlay Studio"
          className="bg-[#0A0A0A] border-t lg:border-t-0 lg:border-l border-white/[0.08] flex flex-col min-h-0"
        >
          <div
            role="tablist"
            aria-label="Bahagian studio overlay"
            className="flex flex-nowrap overflow-x-auto border-b border-white/[0.08] px-2 gap-1 shrink-0"
          >
            {TABS.map((tab, idx) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[idx] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`scrim-overlay-tab-${tab.id}`}
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`relative flex-1 shrink-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-3 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selected ? 'text-[#D7FF00]' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  <tab.Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1.5 bottom-0 h-[2.5px] bg-[#D7FF00] rounded-t-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: SPONSORS */}
          <div
            role="tabpanel"
            aria-labelledby="scrim-overlay-tab-sponsors"
            hidden={activeTab !== 'sponsors'}
            className="p-4 overflow-y-auto flex-1 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Senarai Sponsor ({activeSponsors.length}/{config.sponsors.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Drag-and-drop logo PNG/SVG transparan atau tambah slot baru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddSponsor()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D7FF00] hover:bg-[#e5ff47] text-zinc-950 text-xs font-extrabold transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>

            {uploadError && (
              <div
                role="alert"
                className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
              >
                {uploadError}
              </div>
            )}

            <label
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/[0.18] bg-[#0A0A0C] hover:border-[#D7FF00]/60 text-xs text-zinc-400 cursor-pointer transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleAddSponsor(f);
              }}
            >
              <Upload className="w-4 h-4 text-[#D7FF00]" />
              <span>Drop logo baru di sini atau klik untuk muat naik</span>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAddSponsor(f);
                  e.target.value = '';
                }}
              />
            </label>

            {config.sponsors.map((sp, idx) => {
              const isCurrent = sp.id === currentSponsor?.id;
              const isDrag = dragOverId === sp.id;
              return (
                <div
                  key={sp.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(sp.id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverId(null);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileForSponsor(sp.id, f);
                  }}
                  className={`rounded-xl bg-[#0A0A0C] border p-3 space-y-2.5 transition ${
                    isDrag
                      ? 'border-[#D7FF00]'
                      : isCurrent
                      ? 'border-[#D7FF00]/45'
                      : 'border-white/[0.10]'
                  } ${sp.active ? 'opacity-100' : 'opacity-60'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <label
                      title="Muat naik logo sponsor"
                      className="w-11 h-11 rounded-lg bg-[#070709] border flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                      style={{ borderColor: sp.accentColor }}
                    >
                      {sp.logoDataUrl ? (
                        <img
                          src={sp.logoDataUrl}
                          alt={`${sp.name} logo`}
                          className="w-4/5 h-4/5 object-contain"
                        />
                      ) : (
                        <span className="font-bold text-sm text-white">{sp.monogram}</span>
                      )}
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/jpeg"
                        hidden
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileForSponsor(sp.id, f);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sp.active}
                          aria-label={`Aktifkan sponsor ${sp.name}`}
                          onChange={(e) => updateSponsor(sp.id, { active: e.target.checked })}
                          className="accent-[#D7FF00] cursor-pointer"
                        />
                        <span className="text-sm font-bold text-white truncate">{sp.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#141418] border border-white/[0.10] hover:border-white/[0.22] text-[11px] font-medium text-zinc-200 cursor-pointer">
                          <ImagePlus className="w-3 h-3" />
                          Logo
                          <input
                            type="file"
                            accept="image/png,image/svg+xml,image/webp,image/jpeg"
                            hidden
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileForSponsor(sp.id, f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {sp.logoDataUrl && (
                          <button
                            type="button"
                            onClick={() => updateSponsor(sp.id, { logoDataUrl: null })}
                            className="px-2 py-0.5 rounded bg-[#141418] border border-white/[0.10] text-[11px] text-zinc-300 cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                        {sp.isSample && (
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-zinc-400">
                            Sample
                          </span>
                        )}
                        {isCurrent && sp.active && (
                          <span className="px-1.5 py-0.5 rounded bg-[#D7FF00]/15 text-[#D7FF00] text-[10px] font-mono font-bold">
                            ON AIR
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Naikkan ${sp.name}`}
                        disabled={idx === 0}
                        onClick={() => moveSponsor(idx, -1)}
                        className="p-1.5 rounded bg-[#141418] border border-white/[0.08] text-zinc-300 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Turunkan ${sp.name}`}
                        disabled={idx === config.sponsors.length - 1}
                        onClick={() => moveSponsor(idx, 1)}
                        className="p-1.5 rounded bg-[#141418] border border-white/[0.08] text-zinc-300 disabled:opacity-35 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Padam ${sp.name}`}
                        disabled={config.sponsors.length <= 1}
                        onClick={() => removeSponsor(sp.id)}
                        className="p-1.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300 disabled:opacity-35 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_72px] gap-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Nama Brand</label>
                      <input
                        type="text"
                        value={sp.name}
                        maxLength={28}
                        className={inputClass}
                        onChange={(e) =>
                          updateSponsor(sp.id, { name: e.target.value, isSample: false })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Aksen</label>
                      <input
                        type="color"
                        value={sp.accentColor}
                        aria-label={`Warna aksen ${sp.name}`}
                        onChange={(e) => updateSponsor(sp.id, { accentColor: e.target.value })}
                        className="w-full h-[34px] p-0.5 bg-[#070709] border border-white/[0.10] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Tier / Label</label>
                      <input
                        type="text"
                        value={sp.tier}
                        maxLength={32}
                        className={inputClass}
                        onChange={(e) => updateSponsor(sp.id, { tier: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={sp.tagline}
                        maxLength={42}
                        className={inputClass}
                        onChange={(e) => updateSponsor(sp.id, { tagline: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TAB 2: LOOP */}
          <div
            role="tabpanel"
            aria-labelledby="scrim-overlay-tab-loop"
            hidden={activeTab !== 'loop'}
            className="p-4 overflow-y-auto flex-1 space-y-3"
          >
            {/* Pure Logo Loop (Starting Soon / Custom Scene) */}
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(config.loop.logoOnlyEnabled)}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, logoOnlyEnabled: e.target.checked },
                      })
                    }
                    className="accent-[#D7FF00]"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Pure Logo Loop
                  </span>
                </label>
                <span className="text-[10px] font-mono text-[#D7FF00]">Tanpa Kad / Teks</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'crossfade', label: 'Crossfade' },
                  { value: 'slide-up', label: 'Slide Up' },
                  { value: 'zoom', label: 'Zoom Pop' },
                  { value: 'slide-left', label: 'Slide Left' },
                ].map((anim) => {
                  const active = (config.loop.logoTransition || 'crossfade') === anim.value;
                  return (
                    <button
                      key={anim.value}
                      type="button"
                      onClick={() =>
                        updateConfig({
                          ...config,
                          loop: { ...config.loop, logoTransition: anim.value },
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        active
                          ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                          : 'bg-[#070709] border border-white/[0.08] text-zinc-300 hover:border-white/[0.20]'
                      }`}
                    >
                      {anim.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Hold / Logo</span>
                    <span className="font-mono tabular-nums">
                      {config.loop.logoDurationSec ?? 3.5}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1.5}
                    max={12}
                    step={0.5}
                    value={config.loop.logoDurationSec ?? 3.5}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, logoDurationSec: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[#D7FF00]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Saiz Preview</span>
                    <span className="font-mono tabular-nums">
                      {Math.round((config.loop.logoStageScale ?? 0.72) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.35}
                    max={1.8}
                    step={0.05}
                    value={config.loop.logoStageScale ?? 0.72}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, logoStageScale: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[#D7FF00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Posisi X (Preview)</span>
                    <span className="font-mono tabular-nums">{config.loop.logoStageX ?? 29}%</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={92}
                    step={1}
                    value={config.loop.logoStageX ?? 29}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, logoStageX: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[#D7FF00]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Posisi Y (Preview)</span>
                    <span className="font-mono tabular-nums">{config.loop.logoStageY ?? 9}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={92}
                    step={1}
                    value={config.loop.logoStageY ?? 9}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, logoStageY: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[#D7FF00]"
                  />
                </div>
              </div>
            </div>

            {/* Corner Badge */}
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.loop.cornerEnabled}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, cornerEnabled: e.target.checked },
                    })
                  }
                  className="accent-[#D7FF00]"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Corner Badge Rotation
                </span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {CORNERS.map((c) => {
                  const active = config.loop.cornerPosition === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        updateConfig({
                          ...config,
                          loop: { ...config.loop, cornerPosition: c.value },
                        })
                      }
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        active
                          ? 'bg-[#D7FF00] text-zinc-950 font-bold'
                          : 'bg-[#070709] border border-white/[0.08] text-zinc-300 hover:border-white/[0.20]'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Hold / Sponsor</span>
                    <span className="font-mono tabular-nums">{config.loop.cornerDurationSec}s</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    step={0.5}
                    value={config.loop.cornerDurationSec}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, cornerDurationSec: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[#D7FF00]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Saiz</span>
                    <span className="font-mono tabular-nums">
                      {Math.round(config.loop.cornerScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.75}
                    max={1.3}
                    step={0.05}
                    value={config.loop.cornerScale}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, cornerScale: Number(e.target.value) },
                      })
                    }
                    className="w-full accent-[#D7FF00]"
                  />
                </div>
              </div>
            </div>

            {/* Ticker Bar */}
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.loop.tickerEnabled}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, tickerEnabled: e.target.checked },
                    })
                  }
                  className="accent-[#D7FF00]"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Broadcast Ticker Bar
                </span>
              </label>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Label Pill Kiri</label>
                <input
                  type="text"
                  value={config.loop.tickerLabel}
                  maxLength={22}
                  className={inputClass}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, tickerLabel: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Teks Telemetri / Promo Kanan
                </label>
                <input
                  type="text"
                  value={config.loop.tickerMessage}
                  maxLength={44}
                  className={inputClass}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, tickerMessage: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Kelajuan Marquee</span>
                  <span className="font-mono tabular-nums">{config.loop.tickerSpeed} px/s</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={220}
                  step={10}
                  value={config.loop.tickerSpeed}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, tickerSpeed: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-[#D7FF00]"
                />
              </div>
            </div>

            {/* Podium Card */}
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.loop.podiumEnabled}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        loop: { ...config.loop, podiumEnabled: e.target.checked },
                      })
                    }
                    className="accent-[#D7FF00]"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Podium / Card Carousel
                  </span>
                </label>
                <span className="text-[10px] font-mono text-zinc-500">Lobby / Intermission</span>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Tajuk Header Kad</label>
                <input
                  type="text"
                  value={config.loop.podiumTitle}
                  maxLength={24}
                  className={inputClass}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, podiumTitle: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Hold / Kad</span>
                  <span className="font-mono tabular-nums">{config.loop.podiumDurationSec}s</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={0.5}
                  value={config.loop.podiumDurationSec}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      loop: { ...config.loop, podiumDurationSec: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-[#D7FF00]"
                />
              </div>
            </div>
          </div>

          {/* TAB 3: STINGER */}
          <div
            role="tabpanel"
            aria-labelledby="scrim-overlay-tab-stinger"
            hidden={activeTab !== 'stinger'}
            className="p-4 overflow-y-auto flex-1 space-y-3"
          >
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  OBS Transition Cut Point
                </div>
                <div className="font-mono font-bold tabular-nums text-lg text-emerald-300">
                  {cutPointMs} ms
                </div>
              </div>
              <button
                type="button"
                onClick={triggerStinger}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#D7FF00] hover:bg-[#e5ff47] text-zinc-950 text-xs font-extrabold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Uji Stinger
              </button>
            </div>

            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Gaya Animasi Transisi
              </h3>
              {STINGER_STYLES.map((item) => {
                const selected = config.stinger.style === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      updateConfig({
                        ...config,
                        stinger: { ...config.stinger, style: item.value },
                      })
                    }
                    className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer ${
                      selected
                        ? 'border-[#D7FF00] bg-[#D7FF00]/10'
                        : 'border-white/[0.08] bg-[#070709] hover:border-white/[0.20]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Teks Tengah &amp; Warna
              </h3>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Tajuk Utama</label>
                <input
                  type="text"
                  value={config.stinger.brandTitle}
                  maxLength={26}
                  className={inputClass}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      stinger: { ...config.stinger, brandTitle: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Subtajuk</label>
                <input
                  type="text"
                  value={config.stinger.brandSubtitle}
                  maxLength={36}
                  className={inputClass}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      stinger: { ...config.stinger, brandSubtitle: e.target.value },
                    })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141418] border border-white/[0.10] hover:border-white/[0.22] text-xs font-medium text-zinc-200 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {config.stinger.emblemDataUrl ? 'Ganti Logo Tengah' : 'Muat Naik Logo Tengah'}
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/webp"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleEmblemUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {config.stinger.emblemDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({
                        ...config,
                        stinger: { ...config.stinger, emblemDataUrl: null },
                      })
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-[#141418] border border-white/[0.10] text-xs text-zinc-300 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Aksen Utama</label>
                  <input
                    type="color"
                    value={config.stinger.primaryColor}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        stinger: { ...config.stinger, primaryColor: e.target.value },
                      })
                    }
                    className="w-full h-[34px] p-0.5 bg-[#070709] border border-white/[0.10] rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Latar Panel</label>
                  <input
                    type="color"
                    value={config.stinger.secondaryColor}
                    onChange={(e) =>
                      updateConfig({
                        ...config,
                        stinger: { ...config.stinger, secondaryColor: e.target.value },
                      })
                    }
                    className="w-full h-[34px] p-0.5 bg-[#070709] border border-white/[0.10] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Jumlah Durasi</span>
                  <span className="font-mono tabular-nums">{config.stinger.durationMs} ms</span>
                </div>
                <input
                  type="range"
                  min={700}
                  max={2500}
                  step={50}
                  value={config.stinger.durationMs}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      stinger: { ...config.stinger, durationMs: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-[#D7FF00]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Kedudukan Cut Point</span>
                  <span className="font-mono tabular-nums">
                    {Math.round(config.stinger.cutPointRatio * 100)}% ({cutPointMs} ms)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.35}
                  max={0.65}
                  step={0.01}
                  value={config.stinger.cutPointRatio}
                  onChange={(e) =>
                    updateConfig({
                      ...config,
                      stinger: { ...config.stinger, cutPointRatio: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-[#D7FF00]"
                />
              </div>
            </div>
          </div>

          {/* TAB 4: CLIENT EXPORT */}
          <div
            role="tabpanel"
            aria-labelledby="scrim-overlay-tab-obs"
            hidden={activeTab !== 'obs'}
            className="p-4 overflow-y-auto flex-1 space-y-3"
          >
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Client Delivery Pack (.ZIP)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Muat turun semua fail HTML berasingan (Corner, Ticker, Podium, Stinger) + panduan saiz
                OBS. Client buka terus melalui <span className="font-mono text-zinc-200">Local file</span>{' '}
                tanpa server.
              </p>
              <button
                type="button"
                disabled={zipBusy}
                onClick={handleDownloadClientZip}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#D7FF00] hover:bg-[#e5ff47] text-zinc-950 text-xs font-extrabold transition cursor-pointer disabled:opacity-50"
              >
                <FolderArchive className="w-4 h-4" />
                {zipBusy ? 'Membungkus Pack…' : 'Muat Turun Semua Fail Client (.zip)'}
              </button>
            </div>

            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Fail Berasingan (.HTML / .WebM)
                </h3>
                <span className="text-[10px] font-mono font-bold text-[#D7FF00] whitespace-nowrap">
                  BEBAS SUSUN POSISI
                </span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Durasi Export Video Sponsor Loop (.webm)</span>
                  <span className="font-mono tabular-nums">{loopExportSec}s</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={1}
                  value={loopExportSec}
                  onChange={(e) => setLoopExportSec(Number(e.target.value))}
                  className="w-full accent-[#D7FF00]"
                />
              </div>

              {!supportedMime && (
                <div
                  role="alert"
                  className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs"
                >
                  MediaRecorder WebM tidak disokong pada browser ini. Gunakan fail{' '}
                  <span className="font-mono">.html</span> atau <span className="font-mono">.zip</span>.
                </div>
              )}

              <div className="space-y-2">
                {deliverables.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-[#070709] border border-white/[0.08] p-2.5 space-y-2"
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className="text-[10px] font-mono tabular-nums text-emerald-300">
                        {item.sizeLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{item.note}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadStandaloneHtml(item.id)}
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[#141418] border border-white/[0.10] hover:border-white/[0.24] text-[11px] font-semibold text-zinc-100 transition cursor-pointer"
                      >
                        <FileCode2 className="w-3.5 h-3.5 text-[#D7FF00]" />
                        Local .HTML
                      </button>
                      <button
                        type="button"
                        disabled={!supportedMime || exportState.running}
                        onClick={() => handleExportWebm(item.id)}
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[#141418] border border-white/[0.10] hover:border-white/[0.24] text-[11px] font-semibold text-zinc-100 transition cursor-pointer disabled:opacity-45"
                      >
                        <Film className="w-3.5 h-3.5 text-emerald-300" />
                        Alpha .WebM
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {exportState.running && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Merakam {exportState.target} WebM (60fps)…</span>
                    <span className="font-mono tabular-nums">
                      {Math.round(exportState.progress * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <progress value={exportState.progress} max={1} className="flex-1 h-2" />
                    <button
                      type="button"
                      onClick={() => abortRef.current?.abort()}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {exportState.lastFile && !exportState.running && (
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  Fail dimuat turun: <span className="font-mono">{exportState.lastFile}</span>
                </div>
              )}

              {exportState.error && !exportState.running && (
                <div
                  role="alert"
                  className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
                >
                  {exportState.error}
                </div>
              )}
            </div>

            {/* Live Studio OBS URL */}
            <div className="rounded-xl bg-[#0A0A0C] border border-white/[0.10] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  URL OBS Browser Source (Pilihan Live)
                </h3>
                <span className="text-[10px] font-mono text-emerald-300">SYNC REAL-TIME</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Domain OBS</label>
                  <select
                    value={obsOrigin}
                    onChange={(e) => setObsOrigin(e.target.value)}
                    className={inputClass}
                  >
                    <option value={PRODUCTION_ORIGIN}>scrim.rykhor.my (Live)</option>
                    <option value={window.location.origin}>Origin Semasa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Filter Layer OBS</label>
                  <select
                    value={obsLayer}
                    onChange={(e) => setObsLayer(e.target.value)}
                    className={inputClass}
                  >
                    <option value="all">Semua Overlay (1920×1080)</option>
                    <option value="loop">Semua Sponsor Loop (1920×1080)</option>
                    <option value="logo-only">Pure Logo Loop Sahaja (360×180)</option>
                    <option value="corner">Sponsor Corner Sahaja (472×148)</option>
                    <option value="ticker">Sponsor Ticker Sahaja (1832×84)</option>
                    <option value="podium">Sponsor Podium Sahaja (736×304)</option>
                    <option value="stinger">Stinger Sahaja (1920×1080)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={obsUrl}
                  aria-label="URL OBS Browser Source"
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${inputClass} font-mono text-[11px]`}
                />
                <button
                  type="button"
                  onClick={handleCopyObsUrl}
                  className="px-3 py-1.5 rounded-lg bg-[#D7FF00] hover:bg-[#e5ff47] text-zinc-950 text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedObsUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedObsUrl ? 'Disalin' : 'Salin'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={obsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#141418] border border-white/[0.10] hover:border-white/[0.22] text-xs font-semibold text-zinc-200 transition no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Paparan OBS
                </a>
                <button
                  type="button"
                  onClick={triggerStinger}
                  className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#141418] border border-white/[0.10] hover:border-white/[0.22] text-xs font-semibold text-zinc-200 transition cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  Cue Live Stinger
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
