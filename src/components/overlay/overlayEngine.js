export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

export const ELEMENT_BOXES = {
  'logo-only': { width: 360, height: 180 },
  corner: { width: 472, height: 148 },
  ticker: { width: 1832, height: 84 },
  podium: { width: 736, height: 304 },
  stinger: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
  all: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
};

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

  const cx = standalone
    ? ELEMENT_BOXES['logo-only'].width / 2
    : STAGE_WIDTH * (clamp(config.loop.logoStageX ?? 29, 5, 95) / 100);
  const cy = standalone
    ? ELEMENT_BOXES['logo-only'].height / 2
    : STAGE_HEIGHT * (clamp(config.loop.logoStageY ?? 9, 5, 95) / 100);
  const userScale = standalone ? 1 : clamp(config.loop.logoStageScale ?? 0.72, 0.35, 2.0);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx + offsetX, cy + offsetY);
  ctx.scale(userScale * animScale, userScale * animScale);
  drawPureLogoMark(ctx, sponsor, 320, 144);
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
  const scale = standalone ? 1 : clamp(config.loop.cornerScale, 0.7, 1.35);
  const w = baseW * scale;
  const h = baseH * scale;

  const pos = config.loop.cornerPosition;
  const isRight = pos === 'top-right' || pos === 'bottom-right';
  const isBottom = pos === 'bottom-left' || pos === 'bottom-right';

  let targetX = 18;
  let targetY = 17;
  let slideOffset = (1 - enterT) * -32 + exitT * 32;

  if (!standalone) {
    const marginX = 56;
    const marginY = config.loop.tickerEnabled ? 116 : 52;
    const topMarginY = 52;
    targetX = isRight ? STAGE_WIDTH - marginX - w : marginX;
    targetY = isBottom ? STAGE_HEIGHT - marginY - h : topMarginY;
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
  const cx = standalone ? ELEMENT_BOXES.podium.width / 2 : STAGE_WIDTH / 2;
  const baseY = standalone ? ELEMENT_BOXES.podium.height / 2 : STAGE_HEIGHT * 0.56;
  const cy = baseY + (1 - enterT) * 24 + exitT * -18;

  ctx.save();
  ctx.globalAlpha = clamp(enterT * (1 - exitT));
  ctx.translate(cx - cardW / 2, cy - cardH / 2);

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
  // ScrimHub rounded square icon container
  drawRoundedRect(ctx, -72, -110, 144, 144, 22);
  ctx.fillStyle = '#070709';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.stroke();

  if (img) {
    const ratio = Math.min(108 / img.naturalWidth, 108 / img.naturalHeight);
    const dw = img.naturalWidth * ratio;
    const dh = img.naturalHeight * ratio;
    ctx.drawImage(img, -dw / 2, -38 - dh / 2, dw, dh);
  } else {
    // ScrimHub-style Electric Lime inner badge mark
    drawRoundedRect(ctx, -46, -84, 92, 92, 16);
    ctx.fillStyle = stinger.primaryColor;
    ctx.fill();

    const initials =
      (stinger.brandTitle || 'SH')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'SH';

    ctx.fillStyle = '#09090B';
    ctx.font = '900 44px "Geist", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 0, -37);
  }

  // Brand title in crisp Geist display weight
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 58px "Geist", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(stinger.brandTitle.toUpperCase(), 0, 56);

  if (stinger.brandSubtitle.trim()) {
    const sub = stinger.brandSubtitle.toUpperCase();
    ctx.font = '600 18px "Geist Mono", monospace';
    const subW = Math.min(720, ctx.measureText(sub).width + 36);
    drawRoundedRect(ctx, -subW / 2, 128, subW, 34, 17);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = stinger.primaryColor;
    ctx.stroke();

    ctx.fillStyle = stinger.primaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, 0, 145);
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
