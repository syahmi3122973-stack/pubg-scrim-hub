import {
  ELEMENT_BOXES,
  renderCornerBadgeStandalone,
  renderLogoOnlyStandalone,
  renderPodiumCardStandalone,
  renderSponsorLoops,
  renderStingerFrame,
  renderTickerBarStandalone,
} from './overlayEngine';

export function getSupportedWebmMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return null;
}

export function getExportBox(target) {
  return ELEMENT_BOXES[target] || ELEMENT_BOXES.all;
}

export async function exportOverlayWebm(options) {
  const mimeType = getSupportedWebmMimeType();
  if (!mimeType) {
    throw new Error('Browser ini tidak menyokong MediaRecorder WebM export.');
  }

  const box = getExportBox(options.target);
  const canvas = document.createElement('canvas');
  canvas.width = box.width;
  canvas.height = box.height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Gagal memulakan Canvas 2D context.');
  }

  const stream = canvas.captureStream(60);
  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond:
      options.target === 'stinger' || options.target === 'loop' ? 14_000_000 : 8_000_000,
  });

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  const stopped = new Promise((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = () => reject(new Error('Ralat semasa merakam video WebM.'));
  });

  recorder.start(100);

  const startWall = performance.now();
  const totalMs = Math.max(400, options.durationMs);

  await new Promise((resolve, reject) => {
    let rafId = 0;

    const cleanup = () => {
      cancelAnimationFrame(rafId);
      options.signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      if (recorder.state !== 'inactive') recorder.stop();
      reject(new DOMException('Export dibatalkan.', 'AbortError'));
    };

    if (options.signal) {
      if (options.signal.aborted) {
        onAbort();
        return;
      }
      options.signal.addEventListener('abort', onAbort, { once: true });
    }

    const tick = (now) => {
      const elapsed = now - startWall;
      const ratio = Math.min(1, elapsed / totalMs);

      ctx.clearRect(0, 0, box.width, box.height);
      switch (options.target) {
        case 'stinger':
          renderStingerFrame(ctx, options.config.stinger, ratio);
          break;
        case 'logo-only':
          renderLogoOnlyStandalone(ctx, options.config, elapsed);
          break;
        case 'corner':
          renderCornerBadgeStandalone(ctx, options.config, elapsed);
          break;
        case 'ticker':
          renderTickerBarStandalone(ctx, options.config, elapsed);
          break;
        case 'podium':
          renderPodiumCardStandalone(ctx, options.config, elapsed);
          break;
        default:
          renderSponsorLoops(ctx, options.config, elapsed);
          break;
      }

      options.onProgress?.(ratio);

      if (elapsed >= totalMs) {
        cleanup();
        resolve();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  });

  if (recorder.state !== 'inactive') recorder.stop();
  return await stopped;
}
