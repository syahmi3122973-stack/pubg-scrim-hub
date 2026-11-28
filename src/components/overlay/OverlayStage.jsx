import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ELEMENT_BOXES,
  drawErangelSimulation,
  drawSafeZones,
  getActiveSponsors,
  getCachedImage,
  getCornerStageRect,
  getLogoTransformBox,
  renderActiveScene,
  renderCornerBadgeStandalone,
  renderLogoOnlyStandalone,
  renderPodiumCardStandalone,
  renderSponsorLoops,
  renderStingerFrame,
  renderTickerBarStandalone,
} from './overlayEngine';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function OverlayStage({
  config,
  backdrop,
  customBackdropUrl = null,
  showSafeZones,
  loopPaused,
  stingerRunKey,
  layer = 'all',
  isObs = false,
  activeSceneId = null,
  showSceneOverlay = true,
  onActiveSponsorChange,
  onStingerActiveChange,
  onUpdateLogoTransform = null,
  onUpdateCornerTransform = null,
}) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  const [dragState, setDragState] = useState(null);
  const [hoveredTarget, setHoveredTarget] = useState(null);

  const configRef = useRef(config);
  const backdropRef = useRef(backdrop);
  const customBackdropUrlRef = useRef(customBackdropUrl);
  const loopPausedRef = useRef(loopPaused);
  const showSafeZonesRef = useRef(showSafeZones);
  const layerRef = useRef(layer);
  const activeSceneIdRef = useRef(activeSceneId);
  const showSceneOverlayRef = useRef(showSceneOverlay);
  const onActiveSponsorChangeRef = useRef(onActiveSponsorChange);
  const onStingerActiveChangeRef = useRef(onStingerActiveChange);

  useEffect(() => {
    configRef.current = config;
    backdropRef.current = backdrop;
    customBackdropUrlRef.current = customBackdropUrl;
    loopPausedRef.current = loopPaused;
    showSafeZonesRef.current = showSafeZones;
    layerRef.current = layer;
    activeSceneIdRef.current = activeSceneId;
    showSceneOverlayRef.current = showSceneOverlay;
    onActiveSponsorChangeRef.current = onActiveSponsorChange;
    onStingerActiveChangeRef.current = onStingerActiveChange;
  });

  const obsBox = ELEMENT_BOXES[layer] || ELEMENT_BOXES.all;

  const stingerStartRef = useRef(null);
  const lastStingerKeyRef = useRef(stingerRunKey);
  const wasStingerActiveRef = useRef(false);
  const lastSponsorIdxRef = useRef(-1);

  useEffect(() => {
    (config?.sponsors || []).forEach((sp) => {
      if (sp?.logoDataUrl) getCachedImage(sp.logoDataUrl);
    });
  }, [config?.sponsors]);

  useEffect(() => {
    if (config?.stinger?.emblemDataUrl) {
      getCachedImage(config.stinger.emblemDataUrl);
    }
  }, [config?.stinger?.emblemDataUrl]);

  useEffect(() => {
    (config?.scenes || []).forEach((sc) => {
      if (sc?.imageDataUrl) getCachedImage(sc.imageDataUrl);
    });
  }, [config?.scenes]);

  useEffect(() => {
    if (stingerRunKey !== lastStingerKeyRef.current) {
      lastStingerKeyRef.current = stingerRunKey;
      if (stingerRunKey > 0) {
        stingerStartRef.current = performance.now();
      }
    }
  }, [stingerRunKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId = 0;
    let lastNow = performance.now();
    let elapsed = 0;

    const tick = (now) => {
      const dt = Math.min(100, now - lastNow);
      lastNow = now;
      if (!loopPausedRef.current) {
        elapsed += dt;
      }

      const cfg = configRef.current;
      const activeLayer = layerRef.current || 'all';
      const box = ELEMENT_BOXES[activeLayer] || ELEMENT_BOXES.all;
      const stageW = canvas.width;
      const stageH = canvas.height;

      ctx.clearRect(0, 0, stageW, stageH);

      if (!isObs && activeLayer === 'all') {
        const bgMode = backdropRef.current;
        if (bgMode === 'erangel') {
          drawErangelSimulation(ctx, stageW, stageH, elapsed);
        } else if (bgMode === 'custom' && customBackdropUrlRef.current) {
          const customImg = getCachedImage(customBackdropUrlRef.current);
          if (customImg) {
            ctx.drawImage(customImg, 0, 0, stageW, stageH);
          }
        }
      }

      const scenes = cfg?.scenes || [];
      const targetSceneId = activeSceneIdRef.current || cfg?.activeSceneId;
      const activeScene =
        scenes.find((s) => s.id === targetSceneId) || scenes[0] || null;

      if (
        showSceneOverlayRef.current &&
        activeScene &&
        (activeLayer === 'all' || activeLayer === 'scene' || activeLayer === 'loop')
      ) {
        renderActiveScene(ctx, cfg, activeScene, elapsed);
      }

      if (activeLayer === 'all' || activeLayer === 'loop') {
        renderSponsorLoops(ctx, cfg, elapsed);
      } else if (activeLayer === 'logo-only') {
        renderLogoOnlyStandalone(ctx, cfg, elapsed);
      } else if (activeLayer === 'corner') {
        renderCornerBadgeStandalone(ctx, cfg, elapsed);
      } else if (activeLayer === 'ticker') {
        renderTickerBarStandalone(ctx, cfg, elapsed);
      } else if (activeLayer === 'podium') {
        renderPodiumCardStandalone(ctx, cfg, elapsed);
      }

      const activeSponsors = getActiveSponsors(cfg);
      if (activeSponsors.length > 0 && onActiveSponsorChangeRef.current) {
        const hold = Math.max(1500, (Number(cfg?.loop?.cornerDurationSec) || 6) * 1000);
        const idx = Math.floor(elapsed / hold) % activeSponsors.length;
        if (idx !== lastSponsorIdxRef.current) {
          lastSponsorIdxRef.current = idx;
          onActiveSponsorChangeRef.current(idx);
        }
      }

      if (
        (activeLayer === 'all' || activeLayer === 'stinger') &&
        stingerStartRef.current !== null &&
        cfg?.stinger
      ) {
        const duration = Math.max(400, Number(cfg.stinger.durationMs) || 1400);
        const sElapsed = now - stingerStartRef.current;
        if (sElapsed < duration) {
          renderStingerFrame(ctx, cfg.stinger, sElapsed / duration);
          if (!wasStingerActiveRef.current) {
            wasStingerActiveRef.current = true;
            onStingerActiveChangeRef.current?.(true);
          }
        } else {
          stingerStartRef.current = null;
          if (wasStingerActiveRef.current) {
            wasStingerActiveRef.current = false;
            onStingerActiveChangeRef.current?.(false);
          }
        }
      }

      if (!isObs && showSafeZonesRef.current) {
        drawSafeZones(ctx, box.width, box.height);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isObs]);

  const stageStyle = useMemo(() => {
    if (isObs || backdrop === 'chroma' || backdrop === 'transparent') {
      return { background: 'transparent', backgroundColor: 'transparent' };
    }
    if (backdrop === 'alpha') {
      return {
        backgroundColor: '#0c0c10',
        backgroundImage:
          'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
      };
    }
    return { backgroundColor: '#070709' };
  }, [isObs, backdrop]);

  const interactiveLogoAllowed =
    !isObs &&
    (layer === 'all' || layer === 'loop' || layer === 'logo-only') &&
    Boolean(config?.loop?.logoOnlyEnabled) &&
    typeof onUpdateLogoTransform === 'function';

  const interactiveCornerAllowed =
    !isObs &&
    (layer === 'all' || layer === 'loop' || layer === 'corner') &&
    Boolean(config?.loop?.cornerEnabled) &&
    typeof onUpdateCornerTransform === 'function';

  const logoRectPct = useMemo(() => {
    if (!interactiveLogoAllowed) return null;
    const box = getLogoTransformBox(config);
    return {
      left: ((box.cx - box.halfW) / 1920) * 100,
      top: ((box.cy - box.halfH) / 1080) * 100,
      width: ((box.halfW * 2) / 1920) * 100,
      height: ((box.halfH * 2) / 1080) * 100,
      xPct: Math.round((box.cx / 1920) * 1000) / 10,
      yPct: Math.round((box.cy / 1080) * 1000) / 10,
      scalePct: Math.round(box.scale * 100),
    };
  }, [interactiveLogoAllowed, config]);

  const cornerRectPct = useMemo(() => {
    if (!interactiveCornerAllowed) return null;
    const rect = getCornerStageRect(config);
    return {
      left: (rect.x / 1920) * 100,
      top: (rect.y / 1080) * 100,
      width: (rect.w / 1920) * 100,
      height: (rect.h / 1080) * 100,
      xPct: Math.round((rect.cx / 1920) * 1000) / 10,
      yPct: Math.round((rect.cy / 1080) * 1000) / 10,
    };
  }, [interactiveCornerAllowed, config]);

  const beginLogoPointerAction = (mode, corner, e) => {
    if (!stageRef.current || !onUpdateLogoTransform) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = stageRef.current.getBoundingClientRect();
    const box = getLogoTransformBox(config);
    const origX = (box.cx / 1920) * 100;
    const origY = (box.cy / 1080) * 100;
    const origScale = box.scale;
    const startX = e.clientX;
    const startY = e.clientY;
    const centerPxX = rect.left + (origX / 100) * rect.width;
    const centerPxY = rect.top + (origY / 100) * rect.height;
    const origDist = Math.max(18, Math.hypot(startX - centerPxX, startY - centerPxY));

    setDragState({ target: 'logo', mode, corner });

    const onMove = (ev) => {
      if (mode === 'move') {
        const dxPct = ((ev.clientX - startX) / rect.width) * 100;
        const dyPct = ((ev.clientY - startY) / rect.height) * 100;
        const nextX = clamp(Math.round((origX + dxPct) * 10) / 10, 4, 96);
        const nextY = clamp(Math.round((origY + dyPct) * 10) / 10, 4, 96);
        onUpdateLogoTransform({ logoStageX: nextX, logoStageY: nextY });
      } else {
        const curDist = Math.max(10, Math.hypot(ev.clientX - centerPxX, ev.clientY - centerPxY));
        const nextScale = clamp(Math.round(origScale * (curDist / origDist) * 100) / 100, 0.25, 2.5);
        onUpdateLogoTransform({ logoStageScale: nextScale });
      }
    };

    const onUp = () => {
      setDragState(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const beginCornerPointerAction = (e) => {
    if (!stageRef.current || !onUpdateCornerTransform) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = stageRef.current.getBoundingClientRect();
    const cornerBox = getCornerStageRect(config);
    const origX = (cornerBox.cx / 1920) * 100;
    const origY = (cornerBox.cy / 1080) * 100;
    const startX = e.clientX;
    const startY = e.clientY;

    setDragState({ target: 'corner', mode: 'move' });

    const onMove = (ev) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;
      const nextX = clamp(Math.round((origX + dxPct) * 10) / 10, 8, 92);
      const nextY = clamp(Math.round((origY + dyPct) * 10) / 10, 6, 94);
      onUpdateCornerTransform({ cornerStageX: nextX, cornerStageY: nextY });
    };

    const onUp = () => {
      setDragState(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const logoActive = hoveredTarget === 'logo' || dragState?.target === 'logo';
  const cornerActive = hoveredTarget === 'corner' || dragState?.target === 'corner';

  return (
    <div
      ref={stageRef}
      className={
        isObs
          ? 'w-screen h-screen bg-transparent overflow-hidden'
          : `relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.12] select-none ${
              backdrop === 'chroma' || backdrop === 'transparent' ? 'bg-transparent' : 'bg-[#070709]'
            }`
      }
      style={stageStyle}
    >
      <canvas
        ref={canvasRef}
        width={obsBox.width}
        height={obsBox.height}
        className="w-full h-full block object-contain pointer-events-none"
      />

      {cornerRectPct && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Seret posisi Corner Sponsor Badge"
          onPointerEnter={() => setHoveredTarget('corner')}
          onPointerLeave={() => setHoveredTarget((prev) => (prev === 'corner' ? null : prev))}
          onPointerDown={beginCornerPointerAction}
          style={{
            left: `${cornerRectPct.left}%`,
            top: `${cornerRectPct.top}%`,
            width: `${cornerRectPct.width}%`,
            height: `${cornerRectPct.height}%`,
          }}
          className={`absolute cursor-move rounded-lg transition-colors ${
            cornerActive
              ? 'border border-dashed border-sky-400/90 bg-sky-400/[0.06]'
              : 'border border-dashed border-transparent hover:border-sky-400/50'
          }`}
        >
          {cornerActive && (
            <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-black/85 border border-sky-400/40 text-[10px] font-medium text-sky-200 whitespace-nowrap pointer-events-none shadow-md">
              Corner · {cornerRectPct.xPct}% · {cornerRectPct.yPct}%
            </div>
          )}
        </div>
      )}

      {logoRectPct && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Seret untuk ubah posisi logo sponsor, atau tarik bucu untuk saiz"
          onPointerEnter={() => setHoveredTarget('logo')}
          onPointerLeave={() => setHoveredTarget((prev) => (prev === 'logo' ? null : prev))}
          onPointerDown={(e) => beginLogoPointerAction('move', null, e)}
          style={{
            left: `${logoRectPct.left}%`,
            top: `${logoRectPct.top}%`,
            width: `${logoRectPct.width}%`,
            height: `${logoRectPct.height}%`,
          }}
          className={`absolute cursor-move rounded-lg transition-colors ${
            logoActive
              ? 'border-2 border-dashed border-[#FACC15] bg-[#FACC15]/[0.05] shadow-[0_0_0_1px_rgba(0,0,0,0.6)]'
              : 'border border-dashed border-[#FACC15]/35 hover:border-[#FACC15]/80'
          }`}
        >
          {logoActive && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-[#FACC15]/45 text-[10px] font-semibold text-[#FDE047] whitespace-nowrap pointer-events-none shadow-lg">
              X {logoRectPct.xPct}% · Y {logoRectPct.yPct}% · {logoRectPct.scalePct}%
            </div>
          )}

          {[
            { id: 'nw', pos: '-top-1.5 -left-1.5', cursor: 'cursor-nwse-resize' },
            { id: 'ne', pos: '-top-1.5 -right-1.5', cursor: 'cursor-nesw-resize' },
            { id: 'sw', pos: '-bottom-1.5 -left-1.5', cursor: 'cursor-nesw-resize' },
            { id: 'se', pos: '-bottom-1.5 -right-1.5', cursor: 'cursor-nwse-resize' },
          ].map((h) => (
            <button
              key={h.id}
              type="button"
              aria-label={`Ubah saiz logo dari bucu ${h.id.toUpperCase()}`}
              onPointerDown={(e) => beginLogoPointerAction('resize', h.id, e)}
              className={`absolute ${h.pos} ${h.cursor} w-3.5 h-3.5 rounded-full bg-white border-2 border-[#FACC15] shadow-md transition-transform hover:scale-125 focus:outline-none ${
                logoActive ? 'opacity-100 scale-100' : 'opacity-70 scale-90'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
