import { getPlacementPoints } from './presets';

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export const ELEMENT_BOXES = {
  'logo-only': { width: 360, height: 180 },
  corner: { width: 472, height: 148 },
  ticker: { width: 1832, height: 84 },
  podium: { width: 736, height: 304 },
  stinger: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
  scene: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
  all: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
};

export function getLogoTransformBox(config) {
  const scale = clamp(config?.loop?.logoStageScale ?? 0.9, 0.25, 2.5);
  const cx = STAGE_WIDTH * (clamp(config?.loop?.logoStageX ?? 16, 4, 96) / 100);
  const cy = STAGE_HEIGHT * (clamp(config?.loop?.logoStageY ?? 14, 4, 96) / 100);
  const halfW = (320 * scale) / 2;
  const halfH = (144 * scale) / 2;
  return { cx, cy, halfW, halfH, scale };
}

export function getCornerStageRect(config) {
  const baseW = 436;
  const baseH = 114;
  const scale = clamp(config?.loop?.cornerScale ?? 1, 0.35, 2.2);
  const w = baseW * scale;
  const h = baseH * scale;
  if (
    Number.isFinite(Number(config?.loop?.cornerStageX)) &&
    config?.loop?.cornerStageX !== null &&
    Number.isFinite(Number(config?.loop?.cornerStageY)) &&
    config?.loop?.cornerStageY !== null
  ) {
    const cx = STAGE_WIDTH * (clamp(Number(config.loop.cornerStageX), 4, 96) / 100);
    const cy = STAGE_HEIGHT * (clamp(Number(config.loop.cornerStageY), 4, 96) / 100);
    return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, scale };
  }
  const pos = config?.loop?.cornerPosition || 'top-right';
  const isRight = pos === 'top-right' || pos === 'bottom-right';
  const isBottom = pos === 'bottom-left' || pos === 'bottom-right';
  const marginX = 56;
  const marginY = config?.loop?.tickerEnabled ? 116 : 52;
  const x = isRight ? STAGE_WIDTH - marginX - w : marginX;
  const y = isBottom ? STAGE_HEIGHT - marginY - h : 52;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, scale };
}

export function getTickerStageRect(config) {
  const baseW = 1808;
  const baseH = 56;
  const scale = clamp(config?.loop?.tickerScale ?? 1, 0.35, 1.5);
  const w = baseW * scale;
  const h = baseH * scale;
  const hasCustom =
    Number.isFinite(Number(config?.loop?.tickerStageX)) &&
    config?.loop?.tickerStageX !== null &&
    Number.isFinite(Number(config?.loop?.tickerStageY)) &&
    config?.loop?.tickerStageY !== null;
  const cx = hasCustom
    ? STAGE_WIDTH * (clamp(Number(config.loop.tickerStageX), 4, 96) / 100)
    : 56 + baseW / 2;
  const cy = hasCustom
    ? STAGE_HEIGHT * (clamp(Number(config.loop.tickerStageY), 4, 96) / 100)
    : STAGE_HEIGHT - baseH - 28 + baseH / 2;
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, scale };
}

export function getPodiumStageRect(config) {
  const baseW = 688;
  const baseH = 252;
  const scale = clamp(config?.loop?.podiumScale ?? 1, 0.35, 2.2);
  const w = baseW * scale;
  const h = baseH * scale;
  const hasCustom =
    Number.isFinite(Number(config?.loop?.podiumStageX)) &&
    config?.loop?.podiumStageX !== null &&
    Number.isFinite(Number(config?.loop?.podiumStageY)) &&
    config?.loop?.podiumStageY !== null;
  const cx = hasCustom
    ? STAGE_WIDTH * (clamp(Number(config.loop.podiumStageX), 4, 96) / 100)
    : STAGE_WIDTH / 2;
  const cy = hasCustom
    ? STAGE_HEIGHT * (clamp(Number(config.loop.podiumStageY), 4, 96) / 100)
    : STAGE_HEIGHT * 0.56;
  return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy, scale };
}

const imageCache = new Map();
const failedImages = new Set();

export function getCachedImage(dataUrl) {
  if (!dataUrl || failedImages.has(dataUrl)) return null;
  const existing = imageCache.get(dataUrl);
  if (existing) {
    return existing.complete && existing.naturalWidth > 0 ? existing : null;
  }
  const img = new Image();
  img.onerror = () => {
    failedImages.add(dataUrl);
    imageCache.delete(dataUrl);
  };
  img.src = dataUrl;
  imageCache.set(dataUrl, img);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export async function fileToOptimizedDataUrl(file, maxDim = 512) {
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const blob = new Blob([text], { type: 'image/svg+xml' });
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca fail gambar.'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

export function easeOutExpo(t) {
  const x = clamp(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeInExpo(t) {
  const x = clamp(t);
  return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

export function easeInOutQuart(t) {
  const x = clamp(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

export function easeOutCubic(t) {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 3);
}

export function drawRoundedRect(ctx, x, y, w, h, r = 12) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawSponsorMark(ctx, sponsor, cx, cy, size) {
  const img = getCachedImage(sponsor.logoDataUrl);
  const half = size / 2;

  ctx.save();
  drawRoundedRect(ctx, cx - half, cy - half, size, size, Math.max(6, size * 0.16));
  ctx.fillStyle = '#070709';
  ctx.fill();
  ctx.lineWidth = Math.max(1.2, size * 0.025);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  if (img) {
    const pad = size * 0.14;
    const maxW = size - pad * 2;
    const maxH = size - pad * 2;
    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const drawW = img.naturalWidth * ratio;
    const drawH = img.naturalHeight * ratio;
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
    return;
  }

  // ScrimHub-style crisp team/sponsor monogram tile
  ctx.fillStyle = sponsor.accentColor;
  ctx.fillRect(cx - half + size * 0.14, cy - half + size * 0.14, size * 0.24, Math.max(3, size * 0.06));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${Math.round(size * 0.36)}px "Geist", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((sponsor.monogram || 'SH').slice(0, 3).toUpperCase(), cx, cy + size * 0.04);
  ctx.restore();
}

export function getActiveSponsors(config) {
  const active = (config.sponsors || []).filter((s) => s.active);
  return active.length > 0 ? active : (config.sponsors || []).slice(0, 1);
}

export function drawErangelSimulation(ctx, w, h, timeMs) {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, '#131a20');
  skyGrad.addColorStop(0.42, '#1d2724');
  skyGrad.addColorStop(0.46, '#141916');
  skyGrad.addColorStop(1, '#090b0a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#0e1310';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.48);
  ctx.lineTo(w * 0.18, h * 0.39);
  ctx.lineTo(w * 0.34, h * 0.44);
  ctx.lineTo(w * 0.56, h * 0.36);
  ctx.lineTo(w * 0.77, h * 0.43);
  ctx.lineTo(w, h * 0.38);
  ctx.lineTo(w, h * 0.55);
  ctx.lineTo(0, h * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  // Simulated PUBG HUD elements
  ctx.fillStyle = 'rgba(10, 10, 12, 0.55)';
  drawRoundedRect(ctx, w * 0.32, 22, w * 0.36, 30, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(244, 244, 245, 0.7)';
  ctx.font = '600 15px "Geist Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NW   315   N   15   NE   60   E', w * 0.5, 37);

  ctx.fillStyle = 'rgba(10, 10, 12, 0.72)';
  drawRoundedRect(ctx, 36, 36, 232, 42, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#D7FF00';
  ctx.font = '700 18px "Geist Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ALIVE 42 • PHASE 3', 52, 57);

  const mapSize = 230;
  const mx = w - mapSize - 36;
  const my = h - mapSize - 36;
  ctx.fillStyle = 'rgba(10, 14, 12, 0.8)';
  drawRoundedRect(ctx, mx, my, mapSize, mapSize, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 900);
  ctx.strokeStyle = `rgba(140, 196, 255, ${0.45 + pulse * 0.35})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx + mapSize * 0.52, my + mapSize * 0.48, mapSize * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(215, 255, 0, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mx + mapSize * 0.48, my + mapSize * 0.5, mapSize * 0.21, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(161, 161, 170, 0.5)';
  ctx.font = '500 12px "Geist Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('SIMULATED PUBG GAMEPLAY (TIDAK DIEKSPORT)', w - 36, 26);
  ctx.restore();
}

export function drawSafeZones(ctx, w, h) {
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 1.5;

  const ax = w * 0.035;
  const ay = h * 0.035;
  ctx.strokeStyle = 'rgba(140, 196, 255, 0.42)';
  ctx.strokeRect(ax, ay, w - ax * 2, h - ay * 2);

  const tx = w * 0.05;
  const ty = h * 0.05;
  ctx.strokeStyle = 'rgba(215, 255, 0, 0.45)';
  ctx.strokeRect(tx, ty, w - tx * 2, h - ty * 2);

  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(215, 255, 0, 0.8)';
  ctx.font = '600 12px "Geist Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TITLE SAFE 90%', tx + 8, ty + 18);
  ctx.fillStyle = 'rgba(140, 196, 255, 0.8)';
  ctx.fillText('ACTION SAFE 93%', ax + 8, ay - 6);
  ctx.restore();
}

// ============================================================================
// SPONSOR LOOP RENDERERS (ScrimHub Design Language)
// ============================================================================

export function renderSponsorLoops(ctx, config, timeMs) {
  const sponsors = getActiveSponsors(config);
  if (sponsors.length === 0) return;

  if (config.loop.logoOnlyEnabled) {
    renderLogoOnly(ctx, config, sponsors, timeMs, false);
  }
  if (config.loop.cornerEnabled) {
    renderCornerBadge(ctx, config, sponsors, timeMs, false);
  }
  if (config.loop.tickerEnabled) {
    renderTickerBar(ctx, config, sponsors, timeMs, false);
  }
  if (config.loop.podiumEnabled) {
    renderPodiumCard(ctx, config, sponsors, timeMs, false);
  }
}

export function renderLogoOnlyStandalone(ctx, config, timeMs) {
  const sponsors = getActiveSponsors(config);
  if (sponsors.length === 0) return;
  renderLogoOnly(ctx, config, sponsors, timeMs, true);
}

function drawPureLogoMark(ctx, sponsor, maxW, maxH) {
  const img = getCachedImage(sponsor.logoDataUrl);
  if (img) {
    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const drawW = img.naturalWidth * ratio;
    const drawH = img.naturalHeight * ratio;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    return;
  }

  ctx.fillStyle = sponsor.accentColor || '#FFFFFF';
  ctx.font = '800 54px "Geist", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((sponsor.name || sponsor.monogram || 'LOGO').toUpperCase(), 0, 2);
}

function renderLogoOnly(ctx, config, sponsors, timeMs, standalone) {
  const durMs = Math.max(1500, (config.loop.logoDurationSec ?? 3.5) * 1000);
  const totalCycle = durMs * sponsors.length;
  const wrappedMs = ((timeMs % totalCycle) + totalCycle) % totalCycle;
  const idx = Math.floor(wrappedMs / durMs);
  const localMs = wrappedMs - idx * durMs;
  const sponsor = sponsors[idx];

  const transMs = Math.min(460, durMs * 0.24);
  let enterT = 1;
  let exitT = 0;

  if (sponsors.length > 1) {
    if (localMs < transMs) enterT = easeOutExpo(localMs / transMs);
    if (localMs > durMs - transMs) {
      exitT = easeInExpo((localMs - (durMs - transMs)) / transMs);
    }
  } else {
    enterT = easeOutExpo(Math.min(1, timeMs / 460));
  }

  const transition = config.loop.logoTransition || 'crossfade';
  const alpha = clamp(enterT * (1 - exitT));
  let offsetX = 0;
  let offsetY = 0;
  let animScale = 1;

  if (transition === 'slide-up') {
    offsetY = (1 - enterT) * 26 - exitT * 26;
  } else if (transition === 'slide-left') {
    offsetX = (1 - enterT) * 44 - exitT * 44;
  } else if (transition === 'zoom') {
    animScale = 0.84 + 0.16 * enterT - 0.14 * exitT;
  }

  const logoBox = getLogoTransformBox(config);
  const cx = standalone ? ELEMENT_BOXES['logo-only'].width / 2 : logoBox.cx;
  const cy = standalone ? ELEMENT_BOXES['logo-only'].height / 2 : logoBox.cy;
  const userScale = standalone ? clamp(logoBox.scale, 0.35, 1.15) : logoBox.scale;
  const showBox = config?.loop?.logoBoxEnabled !== false;
  const boxW = 320;
  const boxH = 144;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(userScale, userScale);

  if (showBox) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 16);
    ctx.fillStyle = 'rgba(10, 10, 14, 0.90)';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();

    // Accent bar on left inner edge + tiny slot dots on top-right
    ctx.fillStyle = sponsor.accentColor || config?.primaryAccent || '#FACC15';
    drawRoundedRect(ctx, -boxW / 2 + 12, -boxH / 2 + 16, 4, boxH - 32, 2);
    ctx.fill();

    if (sponsors.length > 1) {
      for (let i = 0; i < sponsors.length; i++) {
        const dx = boxW / 2 - 18 - (sponsors.length - 1 - i) * 11;
        ctx.fillStyle = i === idx ? (sponsor.accentColor || '#FACC15') : 'rgba(255,255,255,0.22)';
        drawRoundedRect(ctx, dx, -boxH / 2 + 14, i === idx ? 7 : 4, 4, 2);
        ctx.fill();
      }
    }

    drawRoundedRect(ctx, -boxW / 2 + 2, -boxH / 2 + 2, boxW - 4, boxH - 4, 14);
    ctx.clip();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(offsetX, offsetY);
  ctx.scale(animScale, animScale);
  drawPureLogoMark(ctx, sponsor, showBox ? 250 : 320, showBox ? 96 : 144);
  ctx.restore();

  ctx.restore();
}

export function renderCornerBadgeStandalone(ctx, config, timeMs) {
  const sponsors = getActiveSponsors(config);
  if (sponsors.length === 0) return;
  renderCornerBadge(ctx, config, sponsors, timeMs, true);
}

export function renderTickerBarStandalone(ctx, config, timeMs) {
  const sponsors = getActiveSponsors(config);
  if (sponsors.length === 0) return;
  renderTickerBar(ctx, config, sponsors, timeMs, true);
}

export function renderPodiumCardStandalone(ctx, config, timeMs) {
  const sponsors = getActiveSponsors(config);
  if (sponsors.length === 0) return;
  renderPodiumCard(ctx, config, sponsors, timeMs, true);
}

export function renderLayerOnStage(ctx, config, layer, timeMs) {
  const sponsors = getActiveSponsors(config);
  if (sponsors.length === 0) return;
  if (layer === 'logo-only') {
    renderLogoOnly(ctx, config, sponsors, timeMs, false);
  } else if (layer === 'corner') {
    renderCornerBadge(ctx, config, sponsors, timeMs, false);
  } else if (layer === 'ticker') {
    renderTickerBar(ctx, config, sponsors, timeMs, false);
  } else if (layer === 'podium') {
    renderPodiumCard(ctx, config, sponsors, timeMs, false);
  }
}

function renderCornerBadge(ctx, config, sponsors, timeMs, standalone) {
  const durMs = Math.max(2000, config.loop.cornerDurationSec * 1000);
  const totalCycle = durMs * sponsors.length;
  const wrappedMs = ((timeMs % totalCycle) + totalCycle) % totalCycle;
  const idx = Math.floor(wrappedMs / durMs);
  const localMs = wrappedMs - idx * durMs;
  const progress = clamp(localMs / durMs);
  const sponsor = sponsors[idx];

  const transInMs = Math.min(440, durMs * 0.18);
  const transOutMs = Math.min(380, durMs * 0.16);

  let enterT = 1;
  let exitT = 0;
  if (sponsors.length > 1) {
    if (localMs < transInMs) enterT = easeOutExpo(localMs / transInMs);
    if (localMs > durMs - transOutMs) {
      exitT = easeInExpo((localMs - (durMs - transOutMs)) / transOutMs);
    }
  } else {
    enterT = easeOutExpo(Math.min(1, timeMs / 460));
  }

  const baseW = 436;
  const baseH = 114;
  const cornerRect = getCornerStageRect(config);
  const scale = standalone ? 1 : cornerRect.scale;

  const pos = config.loop.cornerPosition;
  const isRight = pos === 'top-right' || pos === 'bottom-right';

  let targetX = 18;
  let targetY = 17;
  let slideOffset = (1 - enterT) * -32 + exitT * 32;

  if (!standalone) {
    targetX = cornerRect.x;
    targetY = cornerRect.y;
    slideOffset = (isRight ? 1 : -1) * ((1 - enterT) * 70 + exitT * 70);
  }

  ctx.save();
  ctx.globalAlpha = clamp(enterT * (1 - exitT));
  ctx.translate(targetX + slideOffset, targetY);
  ctx.scale(scale, scale);

  // ScrimHub obsidian elevated card (#0A0A0C + 1px hairline white/14 border)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.78)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, 0, 0, baseW, baseH, 12);
  ctx.fillStyle = 'rgba(10, 10, 12, 0.95)';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  // Left vertical rail bar (ScrimHub active rail style)
  drawRoundedRect(ctx, 8, 16, 4, baseH - 32, 2);
  ctx.fillStyle = sponsor.accentColor;
  ctx.fill();

  // Subtle single specular sweep
  if (progress > 0.2 && progress < 0.42) {
    const sheenT = (progress - 0.2) / 0.22;
    ctx.save();
    drawRoundedRect(ctx, 0, 0, baseW, baseH, 12);
    ctx.clip();
    const sx = -100 + sheenT * (baseW + 200);
    const sg = ctx.createLinearGradient(sx, 0, sx + 80, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(215,255,0,0.08)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx, 0, 80, baseH);
    ctx.restore();
  }

  drawSponsorMark(ctx, sponsor, 62, baseH / 2, 72);

  // Tier pill badge (Geist Mono)
  const tierText = sponsor.tier.toUpperCase();
  ctx.font = '700 11px "Geist Mono", monospace';
  const tierW = Math.min(220, ctx.measureText(tierText).width + 16);
  drawRoundedRect(ctx, 114, 15, tierW, 20, 5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = sponsor.accentColor;
  ctx.stroke();

  ctx.fillStyle = sponsor.accentColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tierText, 122, 25.5);

  // Sponsor Name (Geist bold uppercase, tight tracking feel)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 26px "Geist", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(sponsor.name.toUpperCase(), 114, 41);

  // Tagline
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '500 13px "Geist", system-ui, sans-serif';
  ctx.fillText(sponsor.tagline, 114, 72);

  // Bottom hairline progress track
  drawRoundedRect(ctx, 114, baseH - 15, baseW - 134, 4, 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  drawRoundedRect(ctx, 114, baseH - 15, Math.max(4, (baseW - 134) * (1 - progress)), 4, 2);
  ctx.fillStyle = sponsor.accentColor;
  ctx.fill();

  if (sponsors.length > 1) {
    for (let i = 0; i < sponsors.length; i++) {
      const dx = baseW - 22 - (sponsors.length - 1 - i) * 11;
      ctx.fillStyle = i === idx ? sponsor.accentColor : 'rgba(255, 255, 255, 0.22)';
      drawRoundedRect(ctx, dx, 20, i === idx ? 7 : 4, 4, 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function renderTickerBar(ctx, config, sponsors, timeMs, standalone) {
  const barH = 56;
  const barW = 1808;
  const barX = standalone ? 12 : 56;
  const barY = standalone ? 14 : STAGE_HEIGHT - barH - 28;
  const labelW = 248;

  ctx.save();
  if (!standalone) {
    const tRect = getTickerStageRect(config);
    ctx.translate(tRect.cx, tRect.cy);
    ctx.scale(tRect.scale, tRect.scale);
    ctx.translate(-(barX + barW / 2), -(barY + barH / 2));
  }
  ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  drawRoundedRect(ctx, barX, barY, barW, barH, 12);
  ctx.fillStyle = 'rgba(10, 10, 12, 0.95)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  ctx.save();
  drawRoundedRect(ctx, barX, barY, barW, barH, 12);
  ctx.clip();

  // Left solid Electric Lime ScrimHub CTA pill block
  drawRoundedRect(ctx, barX + 6, barY + 6, labelW - 12, barH - 12, 8);
  ctx.fillStyle = config.primaryAccent || '#D7FF00';
  ctx.fill();

  // Live dark dot inside pill
  ctx.fillStyle = '#09090B';
  ctx.beginPath();
  ctx.arc(barX + 24, barY + barH / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#09090B';
  ctx.font = '800 15px "Geist", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.loop.tickerLabel.toUpperCase(), barX + 36, barY + barH / 2 + 0.5);

  const msgText = config.loop.tickerMessage.trim();
  let rightPromoW = 0;
  if (msgText) {
    ctx.font = '600 13px "Geist Mono", monospace';
    rightPromoW = Math.min(540, Math.max(240, Math.ceil(ctx.measureText(msgText).width + 44)));
  }

  const trackX = barX + labelW + 10;
  const trackW = Math.max(120, barW - labelW - rightPromoW - 26);

  ctx.save();
  ctx.beginPath();
  ctx.rect(trackX, barY, trackW, barH);
  ctx.clip();

  const segments = sponsors.map((sp) => {
    const nameStr = sp.name.toUpperCase();
    const tierStr = sp.tier.toUpperCase();
    ctx.font = '700 16px "Geist", system-ui, sans-serif';
    const nameW = ctx.measureText(nameStr).width;
    ctx.font = '600 12px "Geist Mono", monospace';
    const tierW = ctx.measureText(tierStr).width;
    return { sp, nameStr, tierStr, nameW, totalW: 48 + nameW + 12 + tierW + 52 };
  });

  const cycleWidth = Math.max(
    1,
    segments.reduce((s, x) => s + x.totalW, 0)
  );
  const speed = Math.max(40, config.loop.tickerSpeed);
  const offset = ((timeMs / 1000) * speed) % cycleWidth;
  const repeats = Math.ceil(trackW / cycleWidth) + 2;

  for (let r = 0; r < repeats; r++) {
    let cursorX = trackX + r * cycleWidth - offset;
    for (const seg of segments) {
      if (cursorX + seg.totalW >= trackX && cursorX <= trackX + trackW) {
        drawSponsorMark(ctx, seg.sp, cursorX + 20, barY + barH / 2, 32);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 16px "Geist", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(seg.nameStr, cursorX + 44, barY + barH / 2 + 0.5);

        ctx.fillStyle = seg.sp.accentColor;
        ctx.font = '600 12px "Geist Mono", monospace';
        ctx.fillText(`• ${seg.tierStr}`, cursorX + 54 + seg.nameW, barY + barH / 2 + 0.5);
      }
      cursorX += seg.totalW;
    }
  }
  ctx.restore();

  if (rightPromoW > 0) {
    const rx = barX + barW - rightPromoW;
    ctx.fillStyle = '#070709';
    ctx.fillRect(rx, barY, rightPromoW, barH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(rx, barY, 1, barH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rx + 12, barY, rightPromoW - 20, barH);
    ctx.clip();
    ctx.fillStyle = config.primaryAccent || '#D7FF00';
    ctx.font = '600 13px "Geist Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(msgText, rx + 18, barY + barH / 2 + 0.5);
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

function renderPodiumCard(ctx, config, sponsors, timeMs, standalone) {
  const durMs = Math.max(2500, config.loop.podiumDurationSec * 1000);
  const totalCycle = durMs * sponsors.length;
  const wrappedMs = ((timeMs % totalCycle) + totalCycle) % totalCycle;
  const idx = Math.floor(wrappedMs / durMs);
  const localMs = wrappedMs - idx * durMs;
  const progress = clamp(localMs / durMs);
  const sponsor = sponsors[idx];

  const transInMs = Math.min(480, durMs * 0.2);
  const transOutMs = Math.min(400, durMs * 0.16);

  let enterT = 1;
  let exitT = 0;
  if (sponsors.length > 1) {
    if (localMs < transInMs) enterT = easeOutExpo(localMs / transInMs);
    if (localMs > durMs - transOutMs) {
      exitT = easeInExpo((localMs - (durMs - transOutMs)) / transOutMs);
    }
  } else {
    enterT = easeOutExpo(Math.min(1, timeMs / 460));
  }

  const cardW = 688;
  const cardH = 252;
  const pRect = getPodiumStageRect(config);
  const cx = standalone ? ELEMENT_BOXES.podium.width / 2 : pRect.cx;
  const baseY = standalone ? ELEMENT_BOXES.podium.height / 2 : pRect.cy;
  const scale = standalone ? 1 : pRect.scale;
  const cy = baseY + (1 - enterT) * 24 + exitT * -18;

  ctx.save();
  ctx.globalAlpha = clamp(enterT * (1 - exitT));
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cardW / 2, -cardH / 2);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 14;
  drawRoundedRect(ctx, 0, 0, cardW, cardH, 16);
  ctx.fillStyle = 'rgba(10, 10, 12, 0.96)';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  // Top ScrimHub-style header bar
  ctx.save();
  drawRoundedRect(ctx, 0, 0, cardW, cardH, 16);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.fillRect(0, 0, cardW, 44);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 44, cardW, 1);
  ctx.restore();

  // Header dot + label + scrim.rykhor.my tag
  ctx.fillStyle = sponsor.accentColor;
  ctx.beginPath();
  ctx.arc(24, 22, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 13px "Geist", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.loop.podiumTitle.toUpperCase(), 38, 22.5);

  ctx.fillStyle = '#71717A';
  ctx.font = '600 12px "Geist Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('scrim.rykhor.my', cardW - 22, 22.5);

  // Large avatar badge
  drawSponsorMark(ctx, sponsor, 108, 146, 128);

  // Tier pill
  const tierText = sponsor.tier.toUpperCase();
  ctx.font = '700 12px "Geist Mono", monospace';
  const tierW = Math.min(300, ctx.measureText(tierText).width + 20);
  drawRoundedRect(ctx, 198, 78, tierW, 24, 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = sponsor.accentColor;
  ctx.stroke();
  ctx.fillStyle = sponsor.accentColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tierText, 208, 90);

  // Display title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 46px "Geist", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(sponsor.name.toUpperCase(), 198, 114);

  // Tagline
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '500 18px "Geist", system-ui, sans-serif';
  ctx.fillText(sponsor.tagline, 198, 170);

  // Bottom progress bar + pips
  drawRoundedRect(ctx, 198, cardH - 26, cardW - 224, 5, 2.5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  drawRoundedRect(ctx, 198, cardH - 26, Math.max(5, (cardW - 224) * (1 - progress)), 5, 2.5);
  ctx.fillStyle = sponsor.accentColor;
  ctx.fill();

  if (sponsors.length > 1) {
    for (let i = 0; i < sponsors.length; i++) {
      const px = cardW - 34 - (sponsors.length - 1 - i) * 14;
      ctx.fillStyle = i === idx ? sponsor.accentColor : 'rgba(255, 255, 255, 0.2)';
      drawRoundedRect(ctx, px, cardH - 42, i === idx ? 10 : 5, 5, 2.5);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================================
// STINGER TRANSITION RENDERER (ScrimHub Design Language)
// ============================================================================

function drawCenterCrest(ctx, stinger, scale, alpha) {
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(STAGE_WIDTH / 2, STAGE_HEIGHT / 2);
  ctx.scale(scale, scale);

  const img = getCachedImage(stinger.emblemDataUrl);
  const titleText = String(stinger.brandTitle || '').trim();
  const subText = String(stinger.brandSubtitle || '').trim();

  if (img) {
    const glow = ctx.createRadialGradient(0, -18, 16, 0, -18, 220);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.24)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -18, 220, 0, Math.PI * 2);
    ctx.fill();

    const ratio = Math.min(380 / img.naturalWidth, 230 / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    const centerY = titleText ? -56 : -14;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 28;
    ctx.drawImage(img, -dw / 2, centerY - dh / 2, dw, dh);
    ctx.shadowColor = 'transparent';
  } else {
    drawRoundedRect(ctx, -72, -110, 144, 144, 22);
    ctx.fillStyle = '#070709';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.stroke();

    drawRoundedRect(ctx, -46, -84, 92, 92, 16);
    ctx.fillStyle = stinger.primaryColor;
    ctx.fill();

    const initials =
      (titleText || 'DIY')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'DIY';

    ctx.fillStyle = '#09090B';
    ctx.font = '900 44px "Geist", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 0, -37);
  }

  let subY = img ? 132 : 70;
  if (titleText) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 56px "Geist", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(titleText.toUpperCase(), 0, img ? 74 : 56);
    subY = img ? 148 : 128;
  }

  if (subText) {
    const sub = subText.toUpperCase();
    ctx.font = '700 17px "Geist Mono", monospace';
    const subW = Math.min(720, ctx.measureText(sub).width + 40);
    drawRoundedRect(ctx, -subW / 2, subY, subW, 34, 17);
    ctx.fillStyle = 'rgba(10, 10, 12, 0.78)';
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = stinger.primaryColor;
    ctx.stroke();

    ctx.fillStyle = stinger.primaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, 0, subY + 17);
  }

  ctx.restore();
}

export function renderStingerFrame(ctx, stinger, t) {
  const progress = clamp(t);
  if (progress <= 0 || progress >= 1) return;

  const cut = clamp(stinger.cutPointRatio, 0.35, 0.65);
  const holdHalf = 0.08;
  const enterEnd = cut - holdHalf;
  const exitStart = cut + holdHalf;

  const enterT = progress < enterEnd ? easeOutExpo(progress / enterEnd) : 1;
  const exitT = progress > exitStart ? easeInExpo((progress - exitStart) / (1 - exitStart)) : 0;

  const emblemIn = clamp((progress - enterEnd * 0.55) / (enterEnd * 0.5));
  const emblemOut = progress > exitStart ? clamp(1 - (progress - exitStart) / 0.16) : 1;
  const emblemAlpha = clamp(emblemIn * emblemOut);
  const emblemScale = 0.9 + 0.1 * easeOutCubic(emblemIn) - 0.06 * exitT;

  switch (stinger.style) {
    case 'matrix-wipe': {
      const skew = 180;
      const halfW = STAGE_WIDTH / 2 + skew;
      const slide = enterT * (1 - exitT);

      ctx.save();
      const lx = -halfW + slide * halfW;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx + STAGE_WIDTH / 2 + skew / 2, 0);
      ctx.lineTo(lx + STAGE_WIDTH / 2 - skew / 2, STAGE_HEIGHT);
      ctx.lineTo(lx, STAGE_HEIGHT);
      ctx.closePath();
      ctx.fillStyle = stinger.secondaryColor;
      ctx.fill();

      ctx.strokeStyle = stinger.primaryColor;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(lx + STAGE_WIDTH / 2 + skew / 2, 0);
      ctx.lineTo(lx + STAGE_WIDTH / 2 - skew / 2, STAGE_HEIGHT);
      ctx.stroke();

      const rx = STAGE_WIDTH - slide * (STAGE_WIDTH / 2 + skew / 2);
      ctx.beginPath();
      ctx.moveTo(rx + skew, 0);
      ctx.lineTo(rx + STAGE_WIDTH + skew, 0);
      ctx.lineTo(rx + STAGE_WIDTH + skew, STAGE_HEIGHT);
      ctx.lineTo(rx, STAGE_HEIGHT);
      ctx.closePath();
      ctx.fillStyle = '#000000';
      ctx.fill();

      if (progress >= enterEnd && progress <= exitStart) {
        ctx.fillStyle = stinger.secondaryColor;
        ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      }

      if (emblemAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = 0.08 * emblemAlpha;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        for (let gx = 160; gx < STAGE_WIDTH; gx += 160) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, STAGE_HEIGHT);
          ctx.stroke();
        }
        for (let gy = 180; gy < STAGE_HEIGHT; gy += 180) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(STAGE_WIDTH, gy);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();

      drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
      break;
    }

    case 'volt-slash': {
      const layers = [
        { color: stinger.primaryColor, delay: 0 },
        { color: '#141418', delay: 0.06 },
        { color: stinger.secondaryColor, delay: 0.12 },
      ];

      ctx.save();
      for (const layer of layers) {
        const lIn = clamp((progress - layer.delay) / Math.max(0.15, enterEnd - layer.delay));
        const lOut =
          progress > exitStart + layer.delay * 0.6
            ? clamp(
                (progress - (exitStart + layer.delay * 0.6)) /
                  Math.max(0.15, 1 - exitStart - layer.delay * 0.6)
              )
            : 0;
        const eIn = easeOutExpo(lIn);
        const eOut = easeInExpo(lOut);
        if (eIn <= 0.001 || eOut >= 0.999) continue;

        const startX = -500 + eOut * (STAGE_WIDTH + 900);
        const endX = -500 + eIn * (STAGE_WIDTH + 900);
        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.moveTo(startX + 340, 0);
        ctx.lineTo(endX + 340, 0);
        ctx.lineTo(endX, STAGE_HEIGHT);
        ctx.lineTo(startX, STAGE_HEIGHT);
        ctx.closePath();
        ctx.fill();
      }

      if (progress >= enterEnd && progress <= exitStart) {
        ctx.fillStyle = stinger.secondaryColor;
        ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      }
      ctx.restore();

      drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
      break;
    }

    case 'radar-pulse': {
      const maxRadius = Math.hypot(STAGE_WIDTH / 2, STAGE_HEIGHT / 2) + 80;
      ctx.save();
      if (progress <= exitStart) {
        const radius = easeInOutQuart(enterT) * maxRadius;
        ctx.fillStyle = stinger.secondaryColor;
        ctx.beginPath();
        ctx.arc(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = stinger.primaryColor;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, Math.max(0, radius - 6), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const holeRadius = easeInOutQuart(exitT) * maxRadius;
        ctx.fillStyle = stinger.secondaryColor;
        ctx.beginPath();
        ctx.rect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
        ctx.arc(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, holeRadius, 0, Math.PI * 2, true);
        ctx.fill('evenodd');

        ctx.strokeStyle = stinger.primaryColor;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(STAGE_WIDTH / 2, STAGE_HEIGHT / 2, holeRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
      break;
    }

    case 'standings-shutter': {
      const bands = 8;
      const bandH = Math.ceil(STAGE_HEIGHT / bands);

      ctx.save();
      for (let i = 0; i < bands; i++) {
        const stagger = (i % 4) * 0.035;
        const bIn = easeOutExpo(clamp((progress - stagger) / Math.max(0.15, enterEnd - stagger)));
        const bOut =
          progress > exitStart
            ? easeInExpo(
                clamp((progress - exitStart - stagger * 0.5) / Math.max(0.15, 1 - exitStart - stagger * 0.5))
              )
            : 0;

        const dir = i % 2 === 0 ? 1 : -1;
        const x =
          dir === 1
            ? -STAGE_WIDTH + bIn * STAGE_WIDTH + bOut * STAGE_WIDTH
            : STAGE_WIDTH - bIn * STAGE_WIDTH - bOut * STAGE_WIDTH;

        const y = i * bandH;
        ctx.fillStyle = i % 2 === 0 ? stinger.secondaryColor : '#050507';
        ctx.fillRect(x, y, STAGE_WIDTH, bandH + 1);

        ctx.fillStyle = stinger.primaryColor;
        ctx.fillRect(dir === 1 ? x + STAGE_WIDTH - 8 : x, y, 8, bandH + 1);
      }

      if (progress >= enterEnd && progress <= exitStart) {
        ctx.fillStyle = stinger.secondaryColor;
        ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      }
      ctx.restore();

      drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
      break;
    }
  }
}

// ============================================================================
// OBS BROADCAST SCENE RENDERERS (7 Preset Scenes + Custom Scene)
// ============================================================================

export function computeStandingsSorted(standings) {
  const rows = Array.isArray(standings?.rows) ? standings.rows : [];
  return rows
    .map((r, idx) => {
      const rankNum = r?.rank === '' || r?.rank === null || r?.rank === undefined ? 0 : Number(r.rank);
      const kills = Math.max(0, Number(r?.kills) || 0);
      const placePts = getPlacementPoints(rankNum);
      const wwcd = rankNum === 1 ? 1 : 0;
      const totalPts = placePts + kills;
      return {
        id: r?.id || `row-${idx + 1}`,
        slot: Number(r?.slot) || idx + 1,
        teamName: String(r?.teamName || `SQUAD ${idx + 1}`),
        rank: rankNum,
        wwcd,
        placePts,
        kills,
        totalPts,
      };
    })
    .sort((a, b) => {
      if (b.totalPts !== a.totalPts) return b.totalPts - a.totalPts;
      if (b.wwcd !== a.wwcd) return b.wwcd - a.wwcd;
      if (b.placePts !== a.placePts) return b.placePts - a.placePts;
      if (b.kills !== a.kills) return b.kills - a.kills;
      const aRank = a.rank > 0 ? a.rank : 999;
      const bRank = b.rank > 0 ? b.rank : 999;
      if (aRank !== bRank) return aRank - bRank;
      return a.slot - b.slot;
    });
}

function drawBroadcastHeaderPill(ctx, accent, sceneName, subtitle, eventTitle, y = 44) {
  ctx.save();
  const titleStr = String(sceneName || 'LIVE').toUpperCase();
  const subStr = String(subtitle || eventTitle || '').toUpperCase();
  ctx.font = '800 20px "Geist", system-ui, sans-serif';
  const titleW = ctx.measureText(titleStr).width;
  ctx.font = '600 13px "Geist Mono", monospace';
  const subW = subStr ? ctx.measureText(subStr).width : 0;
  const pillW = Math.min(920, Math.max(360, titleW + subW + 110));
  const x = (STAGE_WIDTH - pillW) / 2;
  const h = 54;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
  ctx.shadowBlur = 22;
  drawRoundedRect(ctx, x, y, pillW, h, 14);
  ctx.fillStyle = 'rgba(10, 10, 12, 0.92)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + 24, y + h / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 19px "Geist", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(titleStr, x + 40, y + h / 2 + 0.5);

  if (subStr) {
    ctx.fillStyle = accent;
    ctx.font = '600 13px "Geist Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(subStr, x + pillW - 22, y + h / 2 + 0.5);
  }
  ctx.restore();
}

export function renderActiveScene(ctx, config, scene, timeMs) {
  if (!scene) return;
  if (scene.imageDataUrl) {
    const sceneImg = getCachedImage(scene.imageDataUrl);
    if (sceneImg) {
      ctx.drawImage(sceneImg, 0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    }
    return;
  }

  const accent = config?.primaryAccent || config?.stinger?.primaryColor || '#FACC15';
  const eventTitle = String(config?.eventTitle || 'TOURNAMENT BROADCAST').toUpperCase();
  const sceneName = String(scene.name || 'SCENE').toUpperCase();
  const subtitle = String(scene.subtitle || '').toUpperCase();
  const kind = scene.kind || 'custom';
  const emblemImg = getCachedImage(config?.stinger?.emblemDataUrl);
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 650);

  switch (kind) {
    case 'starting-soon': {
      const boxW = 920;
      const boxH = 350;
      const x = (STAGE_WIDTH - boxW) / 2;
      const y = 340;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.78)';
      ctx.shadowBlur = 40;
      drawRoundedRect(ctx, x, y, boxW, boxH, 24);
      ctx.fillStyle = 'rgba(9, 9, 11, 0.90)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      // Top accent line
      ctx.fillStyle = accent;
      drawRoundedRect(ctx, x + 28, y + 26, 86, 6, 3);
      ctx.fill();

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '700 14px "Geist Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(eventTitle, x + 128, y + 29);

      if (emblemImg) {
        const ratio = Math.min(180 / emblemImg.naturalWidth, 110 / emblemImg.naturalHeight);
        const dw = emblemImg.naturalWidth * ratio;
        const dh = emblemImg.naturalHeight * ratio;
        ctx.drawImage(emblemImg, x + boxW - dw - 34, y + 24, dw, dh);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 72px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(sceneName, x + 36, y + 102);

      ctx.fillStyle = accent;
      ctx.font = '700 20px "Geist Mono", monospace';
      ctx.fillText(subtitle || 'BERSIAP SEDIA • LOBBY AKAN BERMULA', x + 38, y + 194);

      // Live status footer strip inside card
      drawRoundedRect(ctx, x + 36, y + boxH - 68, boxW - 72, 40, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.fillStyle = `rgba(250, 204, 21, ${0.55 + pulse * 0.45})`;
      ctx.beginPath();
      ctx.arc(x + 60, y + boxH - 48, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E4E4E7';
      ctx.font = '600 14px "Geist Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText('STANDBY BROADCAST FEED • SILA KEKAL DI SALURAN INI', x + 78, y + boxH - 47.5);
      ctx.restore();
      break;
    }

    case 'in-game-flight': {
      drawBroadcastHeaderPill(
        ctx,
        accent,
        sceneName,
        `${config?.standings?.matchLabel || 'MATCH LIVE'} • ${subtitle || 'FLIGHT PATH'}`,
        eventTitle,
        42
      );
      break;
    }

    case 'caster': {
      drawBroadcastHeaderPill(ctx, accent, sceneName, subtitle || eventTitle, eventTitle, 38);
      // Dual transparent camera frame cutouts for OBS camera sources underneath
      const frameW = 790;
      const frameH = 540;
      const gap = 80;
      const startX = (STAGE_WIDTH - (frameW * 2 + gap)) / 2;
      const frameY = 180;
      ['CASTER 1', 'CASTER 2'].forEach((label, i) => {
        const fx = startX + i * (frameW + gap);
        ctx.save();
        drawRoundedRect(ctx, fx, frameY, frameW, frameH, 22);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.20)';
        ctx.stroke();

        // Top corner accent edge
        ctx.fillStyle = accent;
        drawRoundedRect(ctx, fx + 24, frameY - 3, 120, 6, 3);
        ctx.fill();

        // Lower nameplate bar
        drawRoundedRect(ctx, fx + 24, frameY + frameH - 72, 290, 48, 12);
        ctx.fillStyle = 'rgba(10, 10, 12, 0.92)';
        ctx.fill();
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = accent;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 18px "Geist", system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, fx + 44, frameY + frameH - 48);
        ctx.restore();
      });
      break;
    }

    case 'ingame-map': {
      // Compact side & top tactical frame keeping center map transparent for OBS capture
      drawBroadcastHeaderPill(ctx, accent, sceneName, subtitle || 'TACTICAL ZONE FEED', eventTitle, 38);
      const panelW = 300;
      const panelH = 210;
      const px = 56;
      const py = STAGE_HEIGHT - panelH - 110;
      ctx.save();
      drawRoundedRect(ctx, px, py, panelW, panelH, 16);
      ctx.fillStyle = 'rgba(10, 10, 12, 0.88)';
      ctx.fill();
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.font = '700 12px "Geist Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('MAP TELEMETRY', px + 20, py + 18);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 22px "Geist", system-ui, sans-serif';
      ctx.fillText(config?.standings?.matchLabel || 'ERANGEL • LIVE', px + 20, py + 44);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '500 13px "Geist", system-ui, sans-serif';
      ctx.fillText('Letak Map Capture di bawah layer ini.', px + 20, py + 84);
      ctx.fillText('Safe zone & rotasi pasukan live.', px + 20, py + 106);

      if (emblemImg) {
        const ratio = Math.min(110 / emblemImg.naturalWidth, 44 / emblemImg.naturalHeight);
        ctx.drawImage(emblemImg, px + 20, py + panelH - 60, emblemImg.naturalWidth * ratio, emblemImg.naturalHeight * ratio);
      }
      ctx.restore();
      break;
    }

    case 'standings': {
      const sorted = computeStandingsSorted(config?.standings).slice(0, 16);
      const boardW = 1540;
      const boardH = 740;
      const bx = (STAGE_WIDTH - boardW) / 2;
      const by = 160;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 42;
      drawRoundedRect(ctx, bx, by, boardW, boardH, 22);
      ctx.fillStyle = 'rgba(9, 9, 12, 0.94)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      // Header bar
      ctx.save();
      drawRoundedRect(ctx, bx, by, boardW, boardH, 22);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(bx, by, boardW, 92);
      ctx.fillStyle = accent;
      ctx.fillRect(bx, by, 8, 92);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(bx, by + 92, boardW, 1);
      ctx.restore();

      ctx.fillStyle = accent;
      ctx.font = '700 13px "Geist Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(config?.standings?.matchLabel || 'MATCH STANDINGS', bx + 28, by + 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 34px "Geist", system-ui, sans-serif';
      ctx.fillText(sceneName, bx + 28, by + 40);

      if (emblemImg) {
        const ratio = Math.min(140 / emblemImg.naturalWidth, 62 / emblemImg.naturalHeight);
        const dw = emblemImg.naturalWidth * ratio;
        const dh = emblemImg.naturalHeight * ratio;
        ctx.drawImage(emblemImg, bx + boardW - dw - 28, by + (92 - dh) / 2, dw, dh);
      }

      // Split into 2 clean columns (1-8 Left, 9-16 Right)
      const colW = (boardW - 76) / 2;
      const startY = by + 114;
      const rowH = 66;
      const gapY = 8;

      for (let c = 0; c < 2; c++) {
        const colX = bx + 24 + c * (colW + 28);
        // Column header
        ctx.fillStyle = '#71717A';
        ctx.font = '700 12px "Geist Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('#', colX + 18, startY + 12);
        ctx.fillText('SQUAD', colX + 66, startY + 12);
        ctx.textAlign = 'right';
        ctx.fillText('WWCD', colX + colW - 210, startY + 12);
        ctx.fillText('PLACE', colX + colW - 140, startY + 12);
        ctx.fillText('KILL', colX + colW - 76, startY + 12);
        ctx.fillText('PTS', colX + colW - 18, startY + 12);

        const slice = sorted.slice(c * 8, c * 8 + 8);
        slice.forEach((row, rIdx) => {
          const overallRank = c * 8 + rIdx + 1;
          const ry = startY + 28 + rIdx * (rowH + gapY);
          const isTop1 = overallRank === 1;
          drawRoundedRect(ctx, colX, ry, colW, rowH, 12);
          ctx.fillStyle = isTop1 ? 'rgba(250, 204, 21, 0.14)' : 'rgba(255, 255, 255, 0.03)';
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = isTop1 ? accent : 'rgba(255, 255, 255, 0.08)';
          ctx.stroke();

          ctx.fillStyle = isTop1 ? accent : overallRank <= 3 ? '#FFFFFF' : '#A1A1AA';
          ctx.font = '800 20px "Geist Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(String(overallRank).padStart(2, '0'), colX + 16, ry + rowH / 2 + 1);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 21px "Geist", system-ui, sans-serif';
          const name = row.teamName.toUpperCase().slice(0, 18);
          ctx.fillText(name, colX + 66, ry + rowH / 2 + 1);

          ctx.font = '700 18px "Geist Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = row.wwcd > 0 ? accent : '#52525B';
          ctx.fillText(String(row.wwcd), colX + colW - 210, ry + rowH / 2 + 1);

          ctx.fillStyle = '#D4D4D8';
          ctx.fillText(String(row.placePts), colX + colW - 140, ry + rowH / 2 + 1);

          ctx.fillStyle = '#D4D4D8';
          ctx.fillText(String(row.kills), colX + colW - 76, ry + rowH / 2 + 1);

          ctx.fillStyle = isTop1 ? accent : '#FFFFFF';
          ctx.font = '900 22px "Geist Mono", monospace';
          ctx.fillText(String(row.totalPts), colX + colW - 18, ry + rowH / 2 + 1);
        });
      }
      ctx.restore();
      break;
    }

    case 'point-system': {
      const cardW = 1220;
      const cardH = 600;
      const cx = (STAGE_WIDTH - cardW) / 2;
      const cy = 200;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 40;
      drawRoundedRect(ctx, cx, cy, cardW, cardH, 24);
      ctx.fillStyle = 'rgba(9, 9, 12, 0.94)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      ctx.fillStyle = accent;
      ctx.font = '700 14px "Geist Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(eventTitle, cx + 40, cy + 32);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 40px "Geist", system-ui, sans-serif';
      ctx.fillText(sceneName, cx + 40, cy + 58);

      if (emblemImg) {
        const ratio = Math.min(150 / emblemImg.naturalWidth, 72 / emblemImg.naturalHeight);
        ctx.drawImage(emblemImg, cx + cardW - emblemImg.naturalWidth * ratio - 40, cy + 32, emblemImg.naturalWidth * ratio, emblemImg.naturalHeight * ratio);
      }

      const items = [
        { pos: '#1 WWCD', pts: '10 PTS', highlight: true },
        { pos: '#2 PLACE', pts: '6 PTS' },
        { pos: '#3 PLACE', pts: '5 PTS' },
        { pos: '#4 PLACE', pts: '4 PTS' },
        { pos: '#5 PLACE', pts: '3 PTS' },
        { pos: '#6 PLACE', pts: '2 PTS' },
        { pos: '#7 – #8', pts: '1 PT' },
        { pos: '#9 – #16+', pts: '0 PTS' },
      ];
      const tileW = (cardW - 120) / 4;
      const tileH = 112;
      items.forEach((it, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const tx = cx + 40 + col * (tileW + 13);
        const ty = cy + 134 + row * (tileH + 14);
        drawRoundedRect(ctx, tx, ty, tileW, tileH, 14);
        ctx.fillStyle = it.highlight ? 'rgba(250, 204, 21, 0.16)' : 'rgba(255,255,255,0.035)';
        ctx.fill();
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = it.highlight ? accent : 'rgba(255,255,255,0.09)';
        ctx.stroke();

        ctx.fillStyle = it.highlight ? accent : '#A1A1AA';
        ctx.font = '700 14px "Geist Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(it.pos, tx + 20, ty + 20);

        ctx.fillStyle = it.highlight ? accent : '#FFFFFF';
        ctx.font = '900 34px "Geist Mono", monospace';
        ctx.fillText(it.pts, tx + 20, ty + 50);
      });

      // Elimination Point Banner + Tiebreaker note
      drawRoundedRect(ctx, cx + 40, cy + 394, cardW - 80, 92, 16);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.fillStyle = '#09090B';
      ctx.font = '900 30px "Geist", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('ELIMINATION = 1 POINT PER KILL', cx + 70, cy + 440);

      ctx.font = '700 16px "Geist Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('OFFICIAL PMGC SCORING', cx + cardW - 70, cy + 440);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = '600 15px "Geist Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('TIEBREAKER: TOTAL PTS → PLACEMENT PTS → ELIMS → WWCD → BEST RANK', cx + 42, cy + 536);
      ctx.restore();
      break;
    }

    case 'intermission': {
      const cardW = 860;
      const cardH = 300;
      const x = (STAGE_WIDTH - cardW) / 2;
      const y = 170;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 36;
      drawRoundedRect(ctx, x, y, cardW, cardH, 22);
      ctx.fillStyle = 'rgba(9, 9, 12, 0.90)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.stroke();

      if (emblemImg) {
        const ratio = Math.min(180 / emblemImg.naturalWidth, 100 / emblemImg.naturalHeight);
        const dw = emblemImg.naturalWidth * ratio;
        const dh = emblemImg.naturalHeight * ratio;
        ctx.drawImage(emblemImg, x + cardW - dw - 34, y + 32, dw, dh);
      }

      ctx.fillStyle = accent;
      ctx.font = '700 14px "Geist Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(eventTitle, x + 36, y + 34);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 60px "Geist", system-ui, sans-serif';
      ctx.fillText(sceneName, x + 36, y + 66);

      ctx.fillStyle = '#D4D4D8';
      ctx.font = '600 18px "Geist Mono", monospace';
      ctx.fillText(subtitle || 'REHAT SEBENTAR • MATCH SETERUSNYA AKAN BERMULA', x + 36, y + 148);

      drawRoundedRect(ctx, x + 36, y + 210, 310, 42, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.font = '700 15px "Geist Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(config?.standings?.matchLabel || 'UP NEXT • ERANGEL', x + 56, y + 231);
      ctx.restore();
      break;
    }

    default: {
      drawBroadcastHeaderPill(ctx, accent, sceneName, subtitle || eventTitle, eventTitle, 42);
      break;
    }
  }
}
