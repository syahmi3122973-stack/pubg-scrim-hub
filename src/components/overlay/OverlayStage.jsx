import React, { useEffect, useRef } from 'react';
import {
  drawErangelSimulation,
  drawSafeZones,
  ELEMENT_BOXES,
  getCachedImage,
  renderCornerBadgeStandalone,
  renderLogoOnlyStandalone,
  renderPodiumCardStandalone,
  renderSponsorLoops,
  renderStingerFrame,
  renderTickerBarStandalone,
  STAGE_HEIGHT,
  STAGE_WIDTH,
} from './overlayEngine';

export default function OverlayStage({
  config,
  backdrop,
  customBackdropUrl = null,
  showSafeZones,
  loopPaused,
  stingerRunKey,
  layer = 'all',
  isObs = false,
  onActiveSponsorChange,
  onStingerActiveChange,
}) {
  const canvasRef = useRef(null);
  const loopElapsedRef = useRef(0);
  const lastRafTimeRef = useRef(null);
  const stingerStartRef = useRef(null);
  const prevTriggerKeyRef = useRef(stingerRunKey);
  const lastReportedSponsorRef = useRef(-1);

  const configRef = useRef(config);
  const backdropRef = useRef(backdrop);
  const customBackdropRef = useRef(customBackdropUrl);
  const showSafeZonesRef = useRef(showSafeZones);
  const loopPausedRef = useRef(loopPaused);
  const layerRef = useRef(layer);

  useEffect(() => {
    configRef.current = config;
    backdropRef.current = backdrop;
    customBackdropRef.current = customBackdropUrl;
    showSafeZonesRef.current = showSafeZones;
    loopPausedRef.current = loopPaused;
    layerRef.current = layer;
  }, [config, backdrop, customBackdropUrl, showSafeZones, loopPaused, layer]);

  const obsBox =
    isObs &&
    (layer === 'logo-only' || layer === 'corner' || layer === 'ticker' || layer === 'podium')
      ? ELEMENT_BOXES[layer]
      : { width: STAGE_WIDTH, height: STAGE_HEIGHT };

  useEffect(() => {
    if (stingerRunKey !== prevTriggerKeyRef.current && stingerRunKey > 0) {
      prevTriggerKeyRef.current = stingerRunKey;
      stingerStartRef.current = performance.now();
      onStingerActiveChange?.(true);
    }
  }, [stingerRunKey, onStingerActiveChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId = 0;

    const frame = (now) => {
      if (lastRafTimeRef.current === null) lastRafTimeRef.current = now;
      const dt = Math.min(100, now - lastRafTimeRef.current);
      lastRafTimeRef.current = now;

      if (!loopPausedRef.current) {
        loopElapsedRef.current += dt;
      }

      const cfg = configRef.current;
      const activeLayer = layerRef.current;
      const elapsed = loopElapsedRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isObs) {
        if (backdropRef.current === 'erangel') {
          drawErangelSimulation(ctx, STAGE_WIDTH, STAGE_HEIGHT, elapsed);
        } else if (backdropRef.current === 'chroma') {
          ctx.fillStyle = '#00B140';
          ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        } else if (backdropRef.current === 'custom' && customBackdropRef.current) {
          const bgImg = getCachedImage(customBackdropRef.current);
          if (bgImg) {
            const ratio = Math.min(STAGE_WIDTH / bgImg.naturalWidth, STAGE_HEIGHT / bgImg.naturalHeight);
            const dw = bgImg.naturalWidth * ratio;
            const dh = bgImg.naturalHeight * ratio;
            ctx.drawImage(bgImg, (STAGE_WIDTH - dw) / 2, (STAGE_HEIGHT - dh) / 2, dw, dh);
          }
        }
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

      const activeSponsors = cfg.sponsors.filter((s) => s.active);
      if (activeSponsors.length > 0 && onActiveSponsorChange) {
        const durMs = cfg.loop.logoOnlyEnabled
          ? Math.max(1500, (cfg.loop.logoDurationSec ?? 3.5) * 1000)
          : Math.max(2000, cfg.loop.cornerDurationSec * 1000);
        const total = durMs * activeSponsors.length;
        const wrapped = ((elapsed % total) + total) % total;
        const idx = Math.floor(wrapped / durMs);
        if (idx !== lastReportedSponsorRef.current) {
          lastReportedSponsorRef.current = idx;
          onActiveSponsorChange(idx);
        }
      }

      if ((activeLayer === 'all' || activeLayer === 'stinger') && stingerStartRef.current !== null) {
        const stingerElapsed = now - stingerStartRef.current;
        const t = stingerElapsed / Math.max(400, cfg.stinger.durationMs);
        if (t >= 1) {
          stingerStartRef.current = null;
          onStingerActiveChange?.(false);
        } else {
          renderStingerFrame(ctx, cfg.stinger, t);
        }
      }

      if (!isObs && showSafeZonesRef.current) {
        drawSafeZones(ctx, STAGE_WIDTH, STAGE_HEIGHT);
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [isObs, onActiveSponsorChange, onStingerActiveChange]);

  const checkerStyle =
    !isObs && backdrop === 'alpha'
      ? {
          backgroundColor: '#0c0c0f',
          backgroundImage:
            'linear-gradient(45deg, #16161b 25%, transparent 25%), linear-gradient(-45deg, #16161b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #16161b 75%), linear-gradient(-45deg, transparent 75%, #16161b 75%)',
          backgroundSize: '28px 28px',
          backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0',
        }
      : undefined;

  return (
    <div
      className={
        isObs
          ? 'w-screen h-screen bg-transparent overflow-hidden'
          : 'relative w-full aspect-video rounded-xl overflow-hidden border border-white/[0.12] bg-[#070709]'
      }
      style={checkerStyle}
    >
      <canvas
        ref={canvasRef}
        width={obsBox.width}
        height={obsBox.height}
        className="w-full h-full block object-contain"
      />
    </div>
  );
}
