import React from 'react';
import {
  Zap,
  Award,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  Database,
  Crosshair,
  Trophy,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

/**
 * LegacyGuestLandingView
 * 
 * Komponen asal untuk paparan pendaratan tetamu (Unauthenticated Guest Landing View)
 * yang dipindahkan dari App.jsx untuk tujuan arkib/pengasingan kod tanpa memadam sebarang logik.
 */
export default function LegacyGuestLandingView({
  teamsStats = {},
  handleStartScoringSession = () => {},
  navigateToTab = () => {},
  handleOpenGuide = () => {},
  isHomeSliderPaused = false,
  setIsHomeSliderPaused = () => {},
  homeSliderTouchStartX = { current: null },
  advanceHomeSlider = () => {},
  prevHomeSlider = () => {},
  goToHomeSlide = () => {},
  isHomeSliderAnimating = false,
  homeSlideTrackIdx = 0,
  HOME_SLIDER_TOTAL = 5,
  activeHomeSlide = 0,
  scrims = [],
  setSelectedScrimId = () => {}
}) {
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
      badge: 'TEAM MATRIX',
      description: 'Rekod match se-Malaysia disimpan kolektif — jadi portfolio rasmi untuk pitching tajaan & scouting bakat baru.',
      footerText: 'Teroka Database Team Matrix →',
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

  const extendedTrackCards = [
    ...homeSliderCards,
    homeSliderCards[0],
    homeSliderCards[1]
  ];

  return (
    <div className="max-w-xl lg:max-w-2xl mx-auto space-y-5 sm:space-y-6 pt-1 pb-4">
      {/* 1. TOP MICRO-BAR */}
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

      {/* 2. HERO HEADLINE BLOCK */}
      <div
        className="relative px-1 animate-stagger-card"
        style={{ animationDelay: '70ms' }}
      >
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

      {/* 3. INTERACTIVE AUTO SLIDER */}
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
                        ? 'glass-panel scale-100 opacity-100 origin-center'
                        : isPast
                        ? 'glass-tile scale-[0.86] opacity-40 origin-right'
                        : 'glass-tile scale-[0.88] opacity-65 hover:opacity-90 origin-left')
                    }
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full glass-tile text-[#D7FF00] flex items-center justify-center shrink-0">
                            <CardIcon className="w-3.5 h-3.5" />
                          </div>
                          <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                            {card.title}
                          </h2>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full glass-tile text-zinc-300 shrink-0">
                          {card.badge}
                        </span>
                      </div>

                      {card.renderVisual(isActive)}

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {card.description}
                      </p>

                      {card.pills && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {card.pills.map((pill, pIdx) => (
                            <span
                              key={pIdx}
                              style={{ animationDelay: `${120 + pIdx * 80}ms` }}
                              className={
                                'px-2.5 py-1 rounded-lg glass-tile text-[10px] font-mono font-bold text-[#D7FF00] ' +
                                (isActive ? 'animate-visual-pop' : '')
                              }
                            >
                              {pill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-[11px] font-semibold text-zinc-100 w-full">
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

        {/* Slider Dots */}
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

      {/* 4. FULL-WIDTH PILL CTA BUTTON */}
      <div
        className="space-y-3 pt-1 px-1 animate-stagger-card"
        style={{ animationDelay: '240ms' }}
      >
        <button
          type="button"
          onClick={handleStartScoringSession}
          className="w-full p-2 pl-6 rounded-full glass-pill glass-tile-hover active:scale-[0.99] text-white transition-all flex items-center justify-between cursor-pointer group"
          title="Mula kira markah sekarang di Quick Scorer tanpa login"
        >
          <span className="text-sm sm:text-base font-bold tracking-tight text-white mx-auto pr-4">
            Mula Kira Sekarang!
          </span>
          <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#D7FF00] group-hover:bg-[#c2e600] text-black flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(215,255,0,0.3)] group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-5 h-5 stroke-[2.5] text-black" />
          </span>
        </button>

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

      {/* 5. ACTIVE OFFICIAL SCRIM BANNER */}
      {scrims.length > 0 && (
        <div
          onClick={() => {
            setSelectedScrimId(scrims[0].id);
            navigateToTab('history');
          }}
          className="p-3.5 glass-panel glass-panel-hover rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group mx-1"
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
}
