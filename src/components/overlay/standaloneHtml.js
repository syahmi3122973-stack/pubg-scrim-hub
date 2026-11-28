import { ELEMENT_BOXES } from './overlayEngine';
import { createStoreZipBlob } from './zipPack';

const STANDALONE_HELPERS_JS = `
function clamp(v, min = 0, max = 1) { return Math.max(min, Math.min(max, v)); }
function easeOutExpo(t) { const x = clamp(t); return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function easeInExpo(t) { const x = clamp(t); return x === 0 ? 0 : Math.pow(2, 10 * x - 10); }
function easeInOutQuart(t) { const x = clamp(t); return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; }
function easeOutCubic(t) { const x = clamp(t); return 1 - Math.pow(1 - x, 3); }

function drawRoundedRect(ctx, x, y, w, h, r = 12) {
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

const imgCache = new Map();
function getCachedImage(url) {
  if (!url) return null;
  const ex = imgCache.get(url);
  if (ex) return ex.complete && ex.naturalWidth > 0 ? ex : null;
  const img = new Image();
  img.src = url;
  imgCache.set(url, img);
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function drawSponsorMark(ctx, sponsor, cx, cy, size) {
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
    const maxW = size - pad * 2, maxH = size - pad * 2;
    const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
    return;
  }
  ctx.fillStyle = sponsor.accentColor;
  ctx.fillRect(cx - half + size * 0.14, cy - half + size * 0.14, size * 0.24, Math.max(3, size * 0.06));
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 ' + Math.round(size * 0.36) + 'px "Geist", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((sponsor.monogram || 'SH').slice(0, 3).toUpperCase(), cx, cy + size * 0.04);
  ctx.restore();
}
`;

const TARGET_RENDERERS_JS = {
  'logo-only': `
function renderTarget(ctx, config, timeMs) {
  const sponsors = config.sponsors.filter(s => s.active);
  if (!sponsors.length) return;
  const durMs = Math.max(1500, (config.loop.logoDurationSec || 3.5) * 1000);
  const totalCycle = durMs * sponsors.length;
  const wrappedMs = ((timeMs % totalCycle) + totalCycle) % totalCycle;
  const idx = Math.floor(wrappedMs / durMs);
  const localMs = wrappedMs - idx * durMs;
  const sponsor = sponsors[idx];

  const transMs = Math.min(460, durMs * 0.24);
  let enterT = 1, exitT = 0;
  if (sponsors.length > 1) {
    if (localMs < transMs) enterT = easeOutExpo(localMs / transMs);
    if (localMs > durMs - transMs) exitT = easeInExpo((localMs - (durMs - transMs)) / transMs);
  } else {
    enterT = easeOutExpo(Math.min(1, timeMs / 460));
  }

  const transition = config.loop.logoTransition || 'crossfade';
  const alpha = clamp(enterT * (1 - exitT));
  let offsetX = 0, offsetY = 0, animScale = 1;
  if (transition === 'slide-up') offsetY = (1 - enterT) * 26 - exitT * 26;
  else if (transition === 'slide-left') offsetX = (1 - enterT) * 44 - exitT * 44;
  else if (transition === 'zoom') animScale = 0.84 + 0.16 * enterT - 0.14 * exitT;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(180 + offsetX, 90 + offsetY);
  ctx.scale(animScale, animScale);

  const img = getCachedImage(sponsor.logoDataUrl);
  if (img) {
    const ratio = Math.min(320 / img.naturalWidth, 144 / img.naturalHeight);
    const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  } else {
    ctx.fillStyle = sponsor.accentColor || '#FFFFFF';
    ctx.font = '800 54px "Geist", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((sponsor.name || sponsor.monogram || 'LOGO').toUpperCase(), 0, 2);
  }
  ctx.restore();
}
`,
  corner: `
function renderTarget(ctx, config, timeMs) {
  const sponsors = config.sponsors.filter(s => s.active);
  if (!sponsors.length) return;
  const durMs = Math.max(2000, config.loop.cornerDurationSec * 1000);
  const totalCycle = durMs * sponsors.length;
  const wrappedMs = ((timeMs % totalCycle) + totalCycle) % totalCycle;
  const idx = Math.floor(wrappedMs / durMs);
  const localMs = wrappedMs - idx * durMs;
  const progress = clamp(localMs / durMs);
  const sponsor = sponsors[idx];

  const transInMs = Math.min(440, durMs * 0.18), transOutMs = Math.min(380, durMs * 0.16);
  let enterT = 1, exitT = 0;
  if (sponsors.length > 1) {
    if (localMs < transInMs) enterT = easeOutExpo(localMs / transInMs);
    if (localMs > durMs - transOutMs) exitT = easeInExpo((localMs - (durMs - transOutMs)) / transOutMs);
  } else {
    enterT = easeOutExpo(Math.min(1, timeMs / 460));
  }

  const baseW = 436, baseH = 114;
  const slideOffset = (1 - enterT) * -32 + exitT * 32;
  ctx.save();
  ctx.globalAlpha = clamp(enterT * (1 - exitT));
  ctx.translate(18 + slideOffset, 17);
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

  drawRoundedRect(ctx, 8, 16, 4, baseH - 32, 2);
  ctx.fillStyle = sponsor.accentColor;
  ctx.fill();

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

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 26px "Geist", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(sponsor.name.toUpperCase(), 114, 41);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '500 13px "Geist", system-ui, sans-serif';
  ctx.fillText(sponsor.tagline, 114, 72);

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
`,
  ticker: `
function renderTarget(ctx, config, timeMs) {
  const sponsors = config.sponsors.filter(s => s.active);
  if (!sponsors.length) return;
  const barH = 56, barW = 1808, barX = 12, barY = 14, labelW = 248;

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

  drawRoundedRect(ctx, barX + 6, barY + 6, labelW - 12, barH - 12, 8);
  ctx.fillStyle = config.primaryAccent || '#D7FF00';
  ctx.fill();

  ctx.fillStyle = '#09090B';
  ctx.beginPath();
  ctx.arc(barX + 24, barY + barH / 2, 4, 0, Math.PI * 2);
  ctx.fill();

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

  const segments = sponsors.map(sp => {
    const nameStr = sp.name.toUpperCase();
    const tierStr = sp.tier.toUpperCase();
    ctx.font = '700 16px "Geist", system-ui, sans-serif';
    const nameW = ctx.measureText(nameStr).width;
    ctx.font = '600 12px "Geist Mono", monospace';
    const tierW = ctx.measureText(tierStr).width;
    return { sp, nameStr, tierStr, nameW, totalW: 48 + nameW + 12 + tierW + 52 };
  });

  const cycleWidth = Math.max(1, segments.reduce((s, x) => s + x.totalW, 0));
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
        ctx.fillText('• ' + seg.tierStr, cursorX + 54 + seg.nameW, barY + barH / 2 + 0.5);
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
`,
  podium: `
function renderTarget(ctx, config, timeMs) {
  const sponsors = config.sponsors.filter(s => s.active);
  if (!sponsors.length) return;
  const durMs = Math.max(2500, config.loop.podiumDurationSec * 1000);
  const totalCycle = durMs * sponsors.length;
  const wrappedMs = ((timeMs % totalCycle) + totalCycle) % totalCycle;
  const idx = Math.floor(wrappedMs / durMs);
  const localMs = wrappedMs - idx * durMs;
  const progress = clamp(localMs / durMs);
  const sponsor = sponsors[idx];

  const transInMs = Math.min(480, durMs * 0.2), transOutMs = Math.min(400, durMs * 0.16);
  let enterT = 1, exitT = 0;
  if (sponsors.length > 1) {
    if (localMs < transInMs) enterT = easeOutExpo(localMs / transInMs);
    if (localMs > durMs - transOutMs) exitT = easeInExpo((localMs - (durMs - transOutMs)) / transOutMs);
  } else {
    enterT = easeOutExpo(Math.min(1, timeMs / 460));
  }

  const cardW = 688, cardH = 252;
  const cx = 368, cy = 152 + (1 - enterT) * 24 + exitT * -18;

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

  ctx.save();
  drawRoundedRect(ctx, 0, 0, cardW, cardH, 16);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  ctx.fillRect(0, 0, cardW, 44);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, 44, cardW, 1);
  ctx.restore();

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

  drawSponsorMark(ctx, sponsor, 108, 146, 128);

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

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 46px "Geist", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(sponsor.name.toUpperCase(), 198, 114);

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '500 18px "Geist", system-ui, sans-serif';
  ctx.fillText(sponsor.tagline, 198, 170);

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
`,
  stinger: `
function drawCenterCrest(ctx, stinger, scale, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(960, 540);
  ctx.scale(scale, scale);

  const img = getCachedImage(stinger.emblemDataUrl);
  const titleText = String(stinger.brandTitle || '').trim();
  const subText = String(stinger.brandSubtitle || '').trim();

  if (img) {
    const glow = ctx.createRadialGradient(0, -18, 16, 0, -18, 220);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -18, 220, 0, Math.PI * 2);
    ctx.fill();

    const ratio = Math.min(380 / img.naturalWidth, 230 / img.naturalHeight);
    const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio;
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
    const initials = (titleText || 'DIY').split(/\\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'DIY';
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

function renderTarget(ctx, config, timeMs) {
  const stinger = config.stinger;
  const dur = Math.max(400, stinger.durationMs);
  const progress = clamp(timeMs / dur);
  if (progress <= 0 || progress >= 1) return;

  const cut = clamp(stinger.cutPointRatio, 0.35, 0.65);
  const holdHalf = 0.08;
  const enterEnd = cut - holdHalf, exitStart = cut + holdHalf;
  const enterT = progress < enterEnd ? easeOutExpo(progress / enterEnd) : 1;
  const exitT = progress > exitStart ? easeInExpo((progress - exitStart) / (1 - exitStart)) : 0;

  const emblemIn = clamp((progress - enterEnd * 0.55) / (enterEnd * 0.5));
  const emblemOut = progress > exitStart ? clamp(1 - (progress - exitStart) / 0.16) : 1;
  const emblemAlpha = clamp(emblemIn * emblemOut);
  const emblemScale = 0.9 + 0.1 * easeOutCubic(emblemIn) - 0.06 * exitT;

  if (stinger.style === 'matrix-wipe') {
    const skew = 180, halfW = 960 + skew, slide = enterT * (1 - exitT);
    ctx.save();
    const lx = -halfW + slide * halfW;
    ctx.beginPath();
    ctx.moveTo(lx, 0); ctx.lineTo(lx + 960 + skew / 2, 0);
    ctx.lineTo(lx + 960 - skew / 2, 1080); ctx.lineTo(lx, 1080); ctx.closePath();
    ctx.fillStyle = stinger.secondaryColor; ctx.fill();
    ctx.strokeStyle = stinger.primaryColor; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(lx + 960 + skew / 2, 0); ctx.lineTo(lx + 960 - skew / 2, 1080); ctx.stroke();

    const rx = 1920 - slide * (960 + skew / 2);
    ctx.beginPath();
    ctx.moveTo(rx + skew, 0); ctx.lineTo(rx + 1920 + skew, 0);
    ctx.lineTo(rx + 1920 + skew, 1080); ctx.lineTo(rx, 1080); ctx.closePath();
    ctx.fillStyle = '#000000'; ctx.fill();
    if (progress >= enterEnd && progress <= exitStart) {
      ctx.fillStyle = stinger.secondaryColor; ctx.fillRect(0, 0, 1920, 1080);
    }
    ctx.restore();
    drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
  } else if (stinger.style === 'volt-slash') {
    const layers = [
      { color: stinger.primaryColor, delay: 0 },
      { color: '#141418', delay: 0.06 },
      { color: stinger.secondaryColor, delay: 0.12 },
    ];
    ctx.save();
    for (const l of layers) {
      const lIn = clamp((progress - l.delay) / Math.max(0.15, enterEnd - l.delay));
      const lOut = progress > exitStart + l.delay * 0.6 ? clamp((progress - (exitStart + l.delay * 0.6)) / Math.max(0.15, 1 - exitStart - l.delay * 0.6)) : 0;
      const eIn = easeOutExpo(lIn), eOut = easeInExpo(lOut);
      if (eIn <= 0.001 || eOut >= 0.999) continue;
      const sx = -500 + eOut * 2820, ex = -500 + eIn * 2820;
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(sx + 340, 0); ctx.lineTo(ex + 340, 0);
      ctx.lineTo(ex, 1080); ctx.lineTo(sx, 1080); ctx.closePath(); ctx.fill();
    }
    if (progress >= enterEnd && progress <= exitStart) {
      ctx.fillStyle = stinger.secondaryColor; ctx.fillRect(0, 0, 1920, 1080);
    }
    ctx.restore();
    drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
  } else if (stinger.style === 'radar-pulse') {
    const maxR = Math.hypot(960, 540) + 80;
    ctx.save();
    if (progress <= exitStart) {
      const r = easeInOutQuart(enterT) * maxR;
      ctx.fillStyle = stinger.secondaryColor;
      ctx.beginPath(); ctx.arc(960, 540, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = stinger.primaryColor; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(960, 540, Math.max(0, r - 6), 0, Math.PI * 2); ctx.stroke();
    } else {
      const hr = easeInOutQuart(exitT) * maxR;
      ctx.fillStyle = stinger.secondaryColor;
      ctx.beginPath(); ctx.rect(0, 0, 1920, 1080);
      ctx.arc(960, 540, hr, 0, Math.PI * 2, true); ctx.fill('evenodd');
      ctx.strokeStyle = stinger.primaryColor; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(960, 540, hr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
  } else {
    const bands = 8, bandH = 135;
    ctx.save();
    for (let i = 0; i < bands; i++) {
      const st = (i % 4) * 0.035;
      const bIn = easeOutExpo(clamp((progress - st) / Math.max(0.15, enterEnd - st)));
      const bOut = progress > exitStart ? easeInExpo(clamp((progress - exitStart - st * 0.5) / Math.max(0.15, 1 - exitStart - st * 0.5))) : 0;
      const dir = i % 2 === 0 ? 1 : -1;
      const x = dir === 1 ? -1920 + bIn * 1920 + bOut * 1920 : 1920 - bIn * 1920 - bOut * 1920;
      const y = i * bandH;
      ctx.fillStyle = i % 2 === 0 ? stinger.secondaryColor : '#050507';
      ctx.fillRect(x, y, 1920, bandH + 1);
      ctx.fillStyle = stinger.primaryColor;
      ctx.fillRect(dir === 1 ? x + 1912 : x, y, 8, bandH + 1);
    }
    if (progress >= enterEnd && progress <= exitStart) {
      ctx.fillStyle = stinger.secondaryColor; ctx.fillRect(0, 0, 1920, 1080);
    }
    ctx.restore();
    drawCenterCrest(ctx, stinger, emblemScale, emblemAlpha);
  }
}
`,
};

async function urlToDataUrl(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function inlineConfigAssets(config) {
  const sponsors = await Promise.all(
    config.sponsors.map(async (sp) => ({
      ...sp,
      logoDataUrl: sp.logoDataUrl ? await urlToDataUrl(sp.logoDataUrl) : null,
    }))
  );
  const emblemDataUrl = config.stinger.emblemDataUrl
    ? await urlToDataUrl(config.stinger.emblemDataUrl)
    : null;

  return {
    ...config,
    sponsors,
    stinger: { ...config.stinger, emblemDataUrl },
  };
}

export function generateStandaloneHtml(config, target) {
  const box = ELEMENT_BOXES[target];
  const safeJson = JSON.stringify(config).replace(/</g, '\\u003c');
  const titleMap = {
    'logo-only': 'Pure Logo Loop (Starting Soon / Custom Scene)',
    corner: 'Sponsor Corner Badge',
    ticker: 'Sponsor Ticker Bar',
    podium: 'Sponsor Podium Card',
    stinger: 'ScrimHub Stinger Transition',
  };

  return `<!doctype html>
<html lang="ms">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titleMap[target]} — SCRIMHUB Overlay Motion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..800&family=Geist:wght@400..900&display=swap" rel="stylesheet" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: transparent; overflow: hidden; }
    canvas { width: 100vw; height: 100vh; display: block; object-fit: contain; }
  </style>
</head>
<body>
  <canvas id="stage" width="${box.width}" height="${box.height}"></canvas>
  <script>
    const CONFIG = ${safeJson};
    const IS_STINGER = ${target === 'stinger' ? 'true' : 'false'};
    ${STANDALONE_HELPERS_JS}
    ${TARGET_RENDERERS_JS[target]}

    const canvas = document.getElementById('stage');
    const ctx = canvas.getContext('2d', { alpha: true });
    let startTime = performance.now();

    function replay() { startTime = performance.now(); }
    if (IS_STINGER) {
      window.addEventListener('click', replay);
      window.addEventListener('keydown', (e) => { if (e.code === 'Space') replay(); });
    }

    function frame(now) {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderTarget(ctx, CONFIG, elapsed);
      requestAnimationFrame(frame);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        startTime = performance.now();
        requestAnimationFrame(frame);
      });
    } else {
      requestAnimationFrame(frame);
    }
  </script>
</body>
</html>`;
}

export function generateClientReadme(config) {
  const cutPointMs = Math.round(config.stinger.durationMs * config.stinger.cutPointRatio);
  return `SCRIMHUB OVERLAY MOTION — CLIENT DELIVERY PACK
Preset: ${config.presetMode.toUpperCase()}
====================================================

Setiap overlay sudah dipisahkan ke fail berasingan supaya anda boleh
susun, drag, dan resize posisi sendiri dengan bebas di OBS Studio / Streamlabs.

1. FAIL LOGO LOOP & SPONSOR LOOP (Standalone Local HTML — Tiada Server Diperlukan)
---------------------------------------------------------------------------------
Di OBS Studio:
  Sources (+) -> Browser -> Tick "Local file" -> Pilih fail HTML di bawah:

  [0] 00-sponsor-logo-only.html
      - Width : 360
      - Height: 180
      - Cara guna: LOGO SAHAJA tanpa kad/teks! Letak terus atas scene Starting Soon
        atau mana-mana scene design anda sendiri.

  [A] 01-sponsor-corner-badge.html
      - Width : 472
      - Height: 148
      - Cara guna: Kad sponsor di mana-mana penjuru atau sebelah facecam.

  [B] 02-sponsor-ticker-bar.html
      - Width : 1832
      - Height: 84
      - Cara guna: Letak di bahagian bawah atau atas skrin livestream.

  [C] 03-sponsor-podium-card.html
      - Width : 736
      - Height: 304
      - Cara guna: Sesuai untuk scene Lobby, Intermission, atau Post-Match.

2. FAIL STINGER TRANSITION
--------------------------
Pilihan 1 (Disyorkan untuk OBS Scene Transition):
  Export fail "Alpha .WebM" untuk Stinger Transition dari Studio, kemudian di OBS:
  Scene Transitions (+) -> Stinger -> Pilih fail .webm tersebut:
  - Transition Point Type : Time (milliseconds)
  - Transition Point      : ${cutPointMs} ms
  (Total durasi stinger: ${config.stinger.durationMs} ms)

Pilihan 2 (HTML Browser Source):
  [D] 04-stinger-transition.html
      - Width : 1920
      - Height: 1080
      - Tick "Shutdown source when not visible" & "Refresh browser when scene becomes active".

3. TIPS OBS BROWSER SOURCE
--------------------------
- FPS: 60
- Custom CSS: Biarkan kosong (latar belakang sudah telus / transparent).
- Powered by SCRIMHUB (scrim.rykhor.my)
`;
}

export async function buildClientPackZip(config) {
  const resolved = await inlineConfigAssets(config);
  return createStoreZipBlob([
    { name: '00-sponsor-logo-only.html', content: generateStandaloneHtml(resolved, 'logo-only') },
    { name: '01-sponsor-corner-badge.html', content: generateStandaloneHtml(resolved, 'corner') },
    { name: '02-sponsor-ticker-bar.html', content: generateStandaloneHtml(resolved, 'ticker') },
    { name: '03-sponsor-podium-card.html', content: generateStandaloneHtml(resolved, 'podium') },
    { name: '04-stinger-transition.html', content: generateStandaloneHtml(resolved, 'stinger') },
    { name: 'README-CLIENT-OBS.txt', content: generateClientReadme(resolved) },
  ]);
}
