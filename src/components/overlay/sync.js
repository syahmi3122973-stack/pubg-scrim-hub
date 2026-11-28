import { PRESETS } from './presets';

export const OVERLAY_STORAGE_KEY = 'scrimhub:overlay-motion:v1';
export const PRODUCTION_ORIGIN = 'https://scrim.rykhor.my';
const CHANNEL_NAME = 'scrimhub-overlay-motion';

export function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sponsors && parsed.loop && parsed.stinger) {
        return parsed;
      }
    }
  } catch {
    // Fallback below
  }
  return structuredClone(PRESETS.tournament);
}

export function saveStoredConfig(config) {
  try {
    localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}

export function createSyncChannel() {
  if (typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

export function postSyncMessage(channel, msg) {
  if (!channel) return;
  try {
    channel.postMessage(msg);
  } catch {
    // Ignore closed channel
  }
}

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64) {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function buildObsUrl(config, layer, baseOrigin = PRODUCTION_ORIGIN) {
  const url = new URL('/overlay-studio', baseOrigin || window.location.origin);
  url.searchParams.set('obs', '1');
  url.searchParams.set('layer', layer);
  url.searchParams.set('preset', config.presetMode);

  const compact = {
    ...config,
    sponsors: config.sponsors.map((s) => ({
      ...s,
      logoDataUrl: s.logoDataUrl && s.logoDataUrl.length < 18000 ? s.logoDataUrl : null,
    })),
    stinger: {
      ...config.stinger,
      emblemDataUrl:
        config.stinger.emblemDataUrl && config.stinger.emblemDataUrl.length < 18000
          ? config.stinger.emblemDataUrl
          : null,
    },
  };

  try {
    const encoded = toBase64Url(JSON.stringify(compact));
    if (encoded.length < 14000) url.searchParams.set('cfg', encoded);
  } catch {
    // Keep clean preset params
  }
  return url.toString();
}

export function parseObsRouteParams() {
  const params = new URLSearchParams(window.location.search);
  const isObs = params.get('obs') === '1';
  const rawLayer = params.get('layer');
  const layer =
    rawLayer === 'loop' ||
    rawLayer === 'stinger' ||
    rawLayer === 'logo-only' ||
    rawLayer === 'corner' ||
    rawLayer === 'ticker' ||
    rawLayer === 'podium' ||
    rawLayer === 'all'
      ? rawLayer
      : 'all';

  const cfgParam = params.get('cfg');
  if (cfgParam) {
    try {
      const parsed = JSON.parse(fromBase64Url(cfgParam));
      if (parsed && parsed.sponsors && parsed.loop && parsed.stinger) {
        return { isObs, layer, initialConfig: parsed };
      }
    } catch {
      // Fallback below
    }
  }

  const presetParam = params.get('preset');
  if (isObs && (presetParam === 'tournament' || presetParam === 'streamer' || presetParam === 'logo-only')) {
    const stored = loadStoredConfig();
    if (stored.presetMode === presetParam) {
      return { isObs, layer, initialConfig: stored };
    }
    return { isObs, layer, initialConfig: structuredClone(PRESETS[presetParam]) };
  }

  return { isObs, layer, initialConfig: loadStoredConfig() };
}
