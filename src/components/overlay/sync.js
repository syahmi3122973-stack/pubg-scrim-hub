import { supabase } from '../../supabaseClient';
import { normalizeOverlayConfig, PRESETS } from './presets';

export const OVERLAY_STORAGE_KEY = 'scrimhub:overlay-motion:v2';
const LEGACY_STORAGE_KEY = 'scrimhub:overlay-motion:v1';
const OVERLAY_ROOM_STORAGE_KEY = 'scrimhub:overlay-room-id';
export const PRODUCTION_ORIGIN = 'https://scrim.rykhor.my';
const CHANNEL_NAME = 'scrimhub-overlay-motion-v2';

export function getOrCreateSyncRoomId() {
  try {
    const existing = localStorage.getItem(OVERLAY_ROOM_STORAGE_KEY);
    if (existing && /^[a-z0-9_-]{4,32}$/i.test(existing)) {
      return existing;
    }
    const generated = `diy_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(OVERLAY_ROOM_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'diy_default';
  }
}

export function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sponsors && parsed.loop && parsed.stinger) {
        return normalizeOverlayConfig(parsed);
      }
    }
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (parsedLegacy && parsedLegacy.sponsors && parsedLegacy.loop && parsedLegacy.stinger) {
        return normalizeOverlayConfig({
          ...parsedLegacy,
          stinger: {
            ...parsedLegacy.stinger,
            emblemDataUrl: PRESETS.tournament.stinger.emblemDataUrl,
            brandTitle: '',
            primaryColor: '#FACC15',
          },
        });
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

/**
 * Subscribe to Supabase Realtime Broadcast so Studio edits in Chrome
 * immediately sync to external OBS Browser Source instances.
 */
export function createRemoteSyncChannel(roomId, onMessage, onSubscribed) {
  if (!supabase || !roomId) return null;
  const channel = supabase.channel(`overlay-live-${roomId}`, {
    config: { broadcast: { self: false } },
  });
  channel
    .on('broadcast', { event: 'overlay-sync' }, ({ payload }) => {
      if (payload) onMessage?.(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onSubscribed?.(channel);
      }
    });
  return channel;
}

export function sendRemoteSyncMessage(remoteChannel, msg) {
  if (!remoteChannel || !msg) return;
  try {
    let payloadToSend = msg;
    if (msg.type === 'CONFIG_UPDATE' && msg.payload) {
      const approxLen = JSON.stringify(msg.payload).length;
      if (approxLen > 75000) {
        const trimmed = buildCompactConfigForTransport(msg.payload, 18000);
        const safePayload =
          JSON.stringify(trimmed).length > 75000
            ? buildCompactConfigForTransport(msg.payload, 0)
            : trimmed;
        payloadToSend = { ...msg, payload: safePayload };
      }
    }
    remoteChannel.send({
      type: 'broadcast',
      event: 'overlay-sync',
      payload: payloadToSend,
    });
  } catch {
    // Non-fatal if socket is not ready
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

function keepTransportUrl(url, maxInlineLen) {
  if (!url) return null;
  if (!String(url).startsWith('data:')) return url;
  return url.length <= maxInlineLen ? url : null;
}

export function buildCompactConfigForTransport(config, maxInlineLen = 4000) {
  return {
    ...config,
    scenes: (config.scenes || []).map((sc) => ({
      ...sc,
      imageDataUrl:
        sc.imageDataUrl === null
          ? null
          : keepTransportUrl(sc.imageDataUrl, maxInlineLen) ??
            (sc.id === 'starting-soon'
              ? PRESETS.tournament.scenes[0]?.imageDataUrl || null
              : null),
    })),
    sponsors: (config.sponsors || []).map((s) => ({
      ...s,
      logoDataUrl: keepTransportUrl(s.logoDataUrl, maxInlineLen),
    })),
    stinger: {
      ...config.stinger,
      emblemDataUrl:
        keepTransportUrl(config.stinger?.emblemDataUrl, maxInlineLen) ||
        PRESETS.tournament.stinger.emblemDataUrl,
    },
  };
}

export function buildObsUrl(
  config,
  layer = 'all',
  baseOrigin = PRODUCTION_ORIGIN,
  sceneId = null,
  roomId = null
) {
  const url = new URL('/overlay-studio', baseOrigin || window.location.origin);
  url.searchParams.set('obs', '1');
  url.searchParams.set('layer', layer);
  url.searchParams.set('preset', config.presetMode || 'tournament');
  if (sceneId) url.searchParams.set('scene', sceneId);
  if (roomId) url.searchParams.set('room', roomId);

  try {
    let encoded = toBase64Url(JSON.stringify(buildCompactConfigForTransport(config, 4000)));
    if (encoded.length >= 14000) {
      encoded = toBase64Url(JSON.stringify(buildCompactConfigForTransport(config, 0)));
    }
    if (encoded.length < 16000) {
      url.searchParams.set('cfg', encoded);
    }
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
    rawLayer === 'scene' ||
    rawLayer === 'all'
      ? rawLayer
      : 'all';

  const sceneParam = params.get('scene') || '';
  const roomParam = params.get('room') || '';

  const cfgParam = params.get('cfg');
  if (cfgParam) {
    try {
      const parsed = JSON.parse(fromBase64Url(cfgParam));
      if (parsed && parsed.sponsors && parsed.loop && parsed.stinger) {
        const normalized = normalizeOverlayConfig(parsed);
        if (sceneParam && normalized.scenes.some((s) => s.id === sceneParam)) {
          normalized.activeSceneId = sceneParam;
        }
        return {
          isObs,
          layer,
          lockedSceneId: sceneParam || null,
          roomId: roomParam || null,
          initialConfig: normalized,
        };
      }
    } catch {
      // Fallback below
    }
  }

  const presetParam = params.get('preset');
  if (isObs && (presetParam === 'tournament' || presetParam === 'streamer' || presetParam === 'logo-only')) {
    const stored = loadStoredConfig();
    const resolved =
      stored.presetMode === presetParam ? stored : structuredClone(PRESETS[presetParam]);
    if (sceneParam && resolved.scenes.some((s) => s.id === sceneParam)) {
      resolved.activeSceneId = sceneParam;
    }
    return {
      isObs,
      layer,
      lockedSceneId: sceneParam || null,
      roomId: roomParam || null,
      initialConfig: resolved,
    };
  }

  const fallback = loadStoredConfig();
  if (sceneParam && fallback.scenes.some((s) => s.id === sceneParam)) {
    fallback.activeSceneId = sceneParam;
  }
  return {
    isObs,
    layer,
    lockedSceneId: isObs && sceneParam ? sceneParam : null,
    roomId: roomParam || null,
    initialConfig: fallback,
  };
}
