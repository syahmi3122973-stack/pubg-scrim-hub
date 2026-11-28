import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  drawErangelSimulation,
  drawSafeZones,
  getActiveSponsors,
  getCachedImage,
  getCornerStageRect,
  getLogoTransformBox,
  getPodiumStageRect,
  getTickerStageRect,
  renderActiveScene,
  renderLayerOnStage,
  renderSponsorLoops,
  renderStingerFrame,
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
  selectedLayerKey = 'logo',
  onSelectLayer = null,
  onActiveSponsorChange,
  onStingerActiveChange,
  onUpdateLoopTransform = null,
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
      const stageW = STAGE_WIDTH;
      const stageH = STAGE_HEIGHT;

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
        (activeLayer === 'all' || activeLayer === 'scene')
      ) {
        renderActiveScene(ctx, cfg, activeScene, elapsed);
      }

      if (activeLayer === 'all' || activeLayer === 'loop') {
        renderSponsorLoops(ctx, cfg, elapsed);
      } else if (
        activeLayer === 'logo-only' ||
        activeLayer === 'corner' ||
        activeLayer === 'ticker' ||
        activeLayer === 'podium'
      ) {
        renderLayerOnStage(ctx, cfg, activeLayer, elapsed);
      }

      const activeSponsors = getActiveSponsors(cfg);
      if (activeSponsors.length > 0 && onActiveSponsorChangeRef.current) {
        const hold = Math.max(1500, (Number(cfg?.loop?.logoDurationSec) || 3.5) * 1000);
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
        drawSafeZones(ctx, stageW, stageH);
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

  const interactiveLayers = useMemo(() => {
    if (isObs || typeof onUpdateLoopTransform !== 'function') return [];
    const items = [];
    const allowAll = layer === 'all' || layer === 'loop';

    if ((allowAll || layer === 'logo-only') && config?.loop?.logoOnlyEnabled) {
      const box = getLogoTransformBox(config);
      items.push({
        key: 'logo',
        label: 'Kotak Logo',
        box,
        xKey: 'logoStageX',
        yKey: 'logoStageY',
        sKey: 'logoStageScale',
        minS: 0.25,
        maxS: 2.5,
        accent: '#FACC15',
      });
    }

    if ((allowAll || layer === 'corner') && config?.loop?.cornerEnabled) {
      const rect = getCornerStageRect(config);
      items.push({
        key: 'corner',
        label: 'Corner Badge',
        box: {
          cx: rect.cx,
          cy: rect.cy,
          halfW: rect.w / 2,
          halfH: rect.h / 2,
          scale: rect.scale,
        },
        xKey: 'cornerStageX',
        yKey: 'cornerStageY',
        sKey: 'cornerScale',
        minS: 0.35,
        maxS: 2.2,
        accent: '#38BDF8',
      });
    }

    if ((allowAll || layer === 'ticker') && config?.loop?.tickerEnabled) {
      const rect = getTickerStageRect(config);
      items.push({
        key: 'ticker',
        label: 'Ticker Bar',
        box: {
          cx: rect.cx,
          cy: rect.cy,
          halfW: rect.w / 2,
          halfH: rect.h / 2,
          scale: rect.scale,
        },
        xKey: 'tickerStageX',
        yKey: 'tickerStageY',
        sKey: 'tickerScale',
        minS: 0.35,
        maxS: 1.5,
        accent: '#34D399',
      });
    }

    if ((allowAll || layer === 'podium') && config?.loop?.podiumEnabled) {
      const rect = getPodiumStageRect(config);
      items.push({
        key: 'podium',
        label: 'Podium Card',
        box: {
          cx: rect.cx,
          cy: rect.cy,
          halfW: rect.w / 2,
          halfH: rect.h / 2,
          scale: rect.scale,
        },
        xKey: 'podiumStageX',
        yKey: 'podiumStageY',
        sKey: 'podiumScale',
        minS: 0.35,
        maxS: 2.2,
        accent: '#A78BFA',
      });
    }

    return items.map((it) => ({
      ...it,
      left: ((it.box.cx - it.box.halfW) / STAGE_WIDTH) * 100,
      top: ((it.box.cy - it.box.halfH) / STAGE_HEIGHT) * 100,
      width: ((it.box.halfW * 2) / STAGE_WIDTH) * 100,
      height: ((it.box.halfH * 2) / STAGE_HEIGHT) * 100,
      xPct: Math.round((it.box.cx / STAGE_WIDTH) * 1000) / 10,
      yPct: Math.round((it.box.cy / STAGE_HEIGHT) * 1000) / 10,
      scalePct: Math.round(it.box.scale * 100),
    }));
  }, [isObs, layer, config, onUpdateLoopTransform]);

  const beginLayerPointerAction = (item, mode, corner, e) => {
    if (!stageRef.current || !onUpdateLoopTransform) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectLayer?.(item.key);

    const rect = stageRef.current.getBoundingClientRect();
    const origX = (item.box.cx / STAGE_WIDTH) * 100;
    const origY = (item.box.cy / STAGE_HEIGHT) * 100;
    const origScale = item.box.scale;
    const startX = e.clientX;
    const startY = e.clientY;
    const centerPxX = rect.left + (origX / 100) * rect.width;
    const centerPxY = rect.top + (origY / 100) * rect.height;
    const origDist = Math.max(18, Math.hypot(startX - centerPxX, startY - centerPxY));

    setDragState({ target: item.key, mode, corner });

    const onMove = (ev) => {
      if (mode === 'move') {
        const dxPct = ((ev.clientX - startX) / rect.width) * 100;
        const dyPct = ((ev.clientY - startY) / rect.height) * 100;
        const nextX = clamp(Math.round((origX + dxPct) * 10) / 10, 4, 96);
        const nextY = clamp(Math.round((origY + dyPct) * 10) / 10, 4, 96);
        onUpdateLoopTransform({ [item.xKey]: nextX, [item.yKey]: nextY });
      } else {
        const curDist = Math.max(10, Math.hypot(ev.clientX - centerPxX, ev.clientY - centerPxY));
        const nextScale = clamp(
          Math.round(origScale * (curDist / origDist) * 100) / 100,
          item.minS,
          item.maxS
        );
        onUpdateLoopTransform({ [item.sKey]: nextScale });
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
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        className="w-full h-full block object-contain pointer-events-none"
      />

      {interactiveLayers.map((item) => {
        const isSelected = selectedLayerKey === item.key;
        const isActive =
          isSelected || hoveredTarget === item.key || dragState?.target === item.key;
        return (
          <div
            key={item.key}
            role="button"
            tabIndex={0}
            aria-label={`Seret posisi ${item.label}, atau tarik bucu untuk saiz`}
            onPointerEnter={() => setHoveredTarget(item.key)}
            onPointerLeave={() =>
              setHoveredTarget((prev) => (prev === item.key ? null : prev))
            }
            onPointerDown={(e) => beginLayerPointerAction(item, 'move', null, e)}
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              width: `${item.width}%`,
              height: `${item.height}%`,
              borderColor: isActive ? item.accent : `${item.accent}55`,
              backgroundColor: isActive ? `${item.accent}0D` : 'transparent',
            }}
            className={`absolute cursor-move rounded-lg border border-dashed transition-colors ${
              isSelected
                ? 'border-2 shadow-[0_0_0_1px_rgba(0,0,0,0.65)] z-30'
                : isActive
                ? 'border-2 shadow-[0_0_0_1px_rgba(0,0,0,0.6)] z-20'
                : 'z-10'
            }`}
          >
            {isActive && (
              <div
                style={{ borderColor: `${item.accent}88`, color: item.accent }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border text-[10px] font-semibold whitespace-nowrap pointer-events-none shadow-lg"
              >
                {item.label} · X {item.xPct}% · Y {item.yPct}% · {item.scalePct}%
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
                aria-label={`Ubah saiz ${item.label} dari bucu ${h.id.toUpperCase()}`}
                onPointerDown={(e) => beginLayerPointerAction(item, 'resize', h.id, e)}
                style={{ borderColor: item.accent }}
                className={`absolute ${h.pos} ${h.cursor} w-3.5 h-3.5 rounded-full bg-white border-2 shadow-md transition-transform hover:scale-125 focus:outline-none ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-65 scale-90'
                }`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
