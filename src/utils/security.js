/**
 * Lightweight security helpers for URL sanitization, text/form bounds,
 * safe file upload validation, and cryptographic token generation.
 */

function stripControlChars(str) {
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    out += code < 32 || code === 127 ? ' ' : str[i];
  }
  return out;
}

/**
 * Allows strictly http: or https: URLs. Blocks javascript:, vbscript:, data:, etc.
 */
export function safeExternalUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Allows https:, http:, local /paths, blob:, and safe raster data:image URIs.
 * Explicitly blocks SVG data URIs (data:image/svg+xml) and HTML data URIs.
 */
export function safeMediaUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  if (/^blob:(https?:\/\/|null)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(?:png|jpeg|jpg|webp);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  return safeExternalUrl(trimmed);
}

/**
 * Safely converts a contact handle / phone / URL into a clickable link or null.
 */
export function buildSafeContactUrl(rawContact) {
  if (!rawContact) return null;
  const trimmed = String(rawContact).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return safeExternalUrl(trimmed);
  }
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).replace(/[^a-zA-Z0-9_]/g, '');
    return handle ? `https://t.me/${handle}` : null;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length >= 7 && digits.length <= 16) {
    return `https://wa.me/${digits}`;
  }
  return null;
}

/**
 * Strips ASCII control characters and bounds input text length.
 */
export function sanitizeTextInput(raw, maxLength = 200) {
  if (raw === null || raw === undefined) return '';
  return stripControlChars(String(raw))
    .trim()
    .slice(0, maxLength);
}

/**
 * Generates a cryptographically random URL-safe token.
 */
export function generateSecureToken(prefix = 'token_') {
  const bytes = new Uint8Array(12);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${hex}`;
}

const IMAGE_UPLOAD_MIMES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const VIDEO_UPLOAD_MIMES = new Set(['video/mp4', 'video/webm']);
const MIME_TO_SAFE_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf'
};

/**
 * Validates file type and size before uploading to Supabase Storage.
 * Blocks SVG/HTML scriptable files and oversized payloads.
 */
export function validateUploadFile(file, { allowVideo = false, allowPdf = false, maxMb = 5 } = {}) {
  if (!file) return { ok: false, error: 'Tiada fail dipilih.' };
  const mime = String(file.type || '').toLowerCase();
  const isImage = IMAGE_UPLOAD_MIMES.has(mime);
  const isVideo = allowVideo && VIDEO_UPLOAD_MIMES.has(mime);
  const isPdf =
    allowPdf &&
    (mime === 'application/pdf' || (!mime && String(file.name || '').toLowerCase().endsWith('.pdf')));
  if (!isImage && !isVideo && !isPdf) {
    return {
      ok: false,
      error: allowPdf
        ? 'Format tak disokong. Guna fail PDF atau gambar PNG, JPG, WEBP sahaja.'
        : allowVideo
          ? 'Format tak disokong. Guna PNG, JPG, WEBP, MP4 atau WEBM sahaja.'
          : 'Format tak disokong. Guna gambar PNG, JPG atau WEBP sahaja (SVG disekat).'
    };
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `Saiz fail terlalu besar (had maksimum ${maxMb}MB).` };
  }
  return { ok: true, ext: isPdf ? 'pdf' : (MIME_TO_SAFE_EXT[mime] || 'jpg') };
}
