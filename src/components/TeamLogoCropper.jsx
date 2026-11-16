import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Crop, RotateCw, ZoomIn, ZoomOut, RefreshCw, Check, X } from 'lucide-react';

const CROP_VIEWPORT_PX = 240;
const EXPORT_SIZE_PX = 512;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4.5;

const BG_MODES = [
  { key: 'transparent', label: 'Lutsinar', fill: null, previewBg: '#0c0e15' },
  { key: 'dark', label: 'Gelap', fill: '#0c0c10', previewBg: '#0c0c10' },
  { key: 'light', label: 'Putih', fill: '#ffffff', previewBg: '#ffffff' }
];

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export default function TeamLogoCropper({
  imageSrc,
  teamName = '',
  isSubmitting = false,
  onCancel,
  onConfirm
}) {
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [bgMode, setBgMode] = useState('transparent');
  const [loadError, setLoadError] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const imgRef = useRef(null);
  const activePointersRef = useRef(new Map());
  const pinchStartDistRef = useRef(null);
  const pinchStartZoomRef = useRef(1);

  useEffect(() => {
    setNaturalSize({ width: 0, height: 0 });
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setLoadError('');
  }, [imageSrc]);

  const baseScale = naturalSize.width > 0 && naturalSize.height > 0
    ? CROP_VIEWPORT_PX / Math.max(naturalSize.width, naturalSize.height)
    : 1;

  const clampPan = useCallback(
    (nextX, nextY, nextZoom = zoom, nextRotation = rotation) => {
      if (!naturalSize.width || !naturalSize.height) return { x: nextX, y: nextY };
      const isSwapped = Math.abs(nextRotation) % 180 !== 0;
      const effW = (isSwapped ? naturalSize.height : naturalSize.width) * baseScale * nextZoom;
      const effH = (isSwapped ? naturalSize.width : naturalSize.height) * baseScale * nextZoom;
      const maxX = Math.max(CROP_VIEWPORT_PX * 0.45, effW * 0.5 + CROP_VIEWPORT_PX * 0.2);
      const maxY = Math.max(CROP_VIEWPORT_PX * 0.45, effH * 0.5 + CROP_VIEWPORT_PX * 0.2);
      return {
        x: clamp(nextX, -maxX, maxX),
        y: clamp(nextY, -maxY, maxY)
      };
    },
    [naturalSize.width, naturalSize.height, baseScale, zoom, rotation]
  );

  const handleImageLoad = (e) => {
    const el = e.currentTarget;
    if (el.naturalWidth && el.naturalHeight) {
      setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
      setLoadError('');
    }
  };

  const handlePointerDown = (e) => {
    if (isSubmitting || isExporting || !naturalSize.width) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartZoomRef.current = zoom;
    }
  };

  const handlePointerMove = (e) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    const prevPt = activePointersRef.current.get(e.pointerId);
    const currPt = { x: e.clientX, y: e.clientY };
    activePointersRef.current.set(e.pointerId, currPt);

    if (activePointersRef.current.size === 1) {
      const dx = currPt.x - prevPt.x;
      const dy = currPt.y - prevPt.y;
      setPan((prev) => clampPan(prev.x + dx, prev.y + dy));
    } else if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const nextZoom = clamp(
        Number((pinchStartZoomRef.current * (dist / pinchStartDistRef.current)).toFixed(2)),
        MIN_ZOOM,
        MAX_ZOOM
      );
      setZoom(nextZoom);
      setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
    }
  };

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
  };

  const handleWheel = (e) => {
    if (!naturalSize.width) return;
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.1 : -0.1;
    const nextZoom = clamp(Number((zoom + step).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    setZoom(nextZoom);
    setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
  };

  const handleReset = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setPan((prev) => clampPan(prev.x, prev.y, zoom, nextRot));
  };

  const handleConfirmCrop = async () => {
    const imgEl = imgRef.current;
    if (!imgEl || !naturalSize.width || isExporting || isSubmitting) return;

    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_SIZE_PX;
      canvas.height = EXPORT_SIZE_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Kanvas pelayar tidak disokong.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const selectedBg = BG_MODES.find((b) => b.key === bgMode);
      if (selectedBg?.fill) {
        ctx.fillStyle = selectedBg.fill;
        ctx.fillRect(0, 0, EXPORT_SIZE_PX, EXPORT_SIZE_PX);
      } else {
        ctx.clearRect(0, 0, EXPORT_SIZE_PX, EXPORT_SIZE_PX);
      }

      const ratio = EXPORT_SIZE_PX / CROP_VIEWPORT_PX;
      const drawW = naturalSize.width * baseScale * ratio;
      const drawH = naturalSize.height * baseScale * ratio;

      ctx.save();
      ctx.translate(EXPORT_SIZE_PX / 2 + pan.x * ratio, EXPORT_SIZE_PX / 2 + pan.y * ratio);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(imgEl, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Gagal menjana gambar crop.'))),
          'image/png'
        );
      });

      const previewDataUrl = canvas.toDataURL('image/png');
      const croppedFile = new File([blob], `team_logo_${Date.now()}.png`, { type: 'image/png' });
      await onConfirm(croppedFile, previewDataUrl);
    } catch (err) {
      setLoadError(err?.message || 'Gagal memproses imej. Cuba muat naik fail dari peranti.');
    } finally {
      setIsExporting(false);
    }
  };

  const activeBgObj = BG_MODES.find((b) => b.key === bgMode) || BG_MODES[0];
  const busy = isSubmitting || isExporting;

  return (
    <div className="space-y-4 overflow-y-auto pr-0.5 flex-1 overscroll-contain">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-[#D7FF00]/15 text-[#D7FF00] flex items-center justify-center shrink-0">
            <Crop className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-white truncate">
              Crop Logo {teamName ? `• ${teamName}` : ''}
            </h4>
            <p className="text-[10px] text-zinc-400">
              Seret untuk laras posisi, cubit atau guna slider untuk zoom
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-bold transition cursor-pointer shrink-0 disabled:opacity-50"
        >
          Batal
        </button>
      </div>

      {/* Interactive Square Crop Viewport (240x240px) */}
      <div className="flex flex-col items-center gap-2.5">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{
            width: `${CROP_VIEWPORT_PX}px`,
            height: `${CROP_VIEWPORT_PX}px`,
            backgroundColor: activeBgObj.previewBg
          }}
          className="relative rounded-3xl overflow-hidden border-2 border-[#D7FF00]/75 shadow-[0_12px_36px_rgba(0,0,0,0.65)] touch-none select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              crossOrigin={imageSrc.startsWith('data:') || imageSrc.startsWith('blob:') ? undefined : 'anonymous'}
              alt="Pratonton Crop Logo"
              onLoad={handleImageLoad}
              onError={() =>
                setLoadError('Gambar URL luaran disekat CORS. Sila muat naik gambar dari peranti anda.')
              }
              draggable={false}
              style={{
                width: naturalSize.width ? `${naturalSize.width * baseScale}px` : 'auto',
                height: naturalSize.height ? `${naturalSize.height * baseScale}px` : 'auto',
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
              className="pointer-events-none select-none"
            />
          )}

          {/* Subtle Alignment Rule-of-Thirds & Safe Rounded Frame Guide */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 border border-white/15 rounded-3xl"
          >
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/10" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/10" />
            <div className="absolute inset-2.5 rounded-2xl border border-dashed border-[#D7FF00]/35" />
          </div>
        </div>

        {loadError && (
          <p className="text-[11px] font-bold text-rose-400 text-center max-w-xs">{loadError}</p>
        )}
      </div>

      {/* Zoom & Quick Transform Controls */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/75 border border-white/10 space-y-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Zum keluar"
            onClick={() => {
              const nextZoom = clamp(Number((zoom - 0.15).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
              setZoom(nextZoom);
              setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
            }}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            aria-label="Tahap zum logo"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.02}
            value={zoom}
            onChange={(e) => {
              const nextZoom = clamp(Number(e.target.value), MIN_ZOOM, MAX_ZOOM);
              setZoom(nextZoom);
              setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
            }}
            className="flex-1 accent-[#D7FF00] cursor-pointer h-1.5"
          />

          <button
            type="button"
            aria-label="Zum masuk"
            onClick={() => {
              const nextZoom = clamp(Number((zoom + 0.15).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
              setZoom(nextZoom);
              setPan((prev) => clampPan(prev.x, prev.y, nextZoom));
            }}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 flex items-center justify-center transition cursor-pointer shrink-0 active:scale-95"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono font-bold text-[#D7FF00] w-11 text-right tabular-nums shrink-0">
            {zoom.toFixed(2)}x
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          {/* Background Fill Mode */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-0.5 rounded-full border border-white/5">
            {BG_MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setBgMode(m.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  bgMode === m.key
                    ? 'bg-[#D7FF00] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRotate}
              className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer border border-white/10 active:scale-95"
              title="Putar 90 darjah"
            >
              <RotateCw className="w-3 h-3 text-[#D7FF00]" />
              <span>90°</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer border border-white/10 active:scale-95"
              title="Pusatkan semula"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/10 disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Batal</span>
        </button>

        <button
          type="button"
          onClick={handleConfirmCrop}
          disabled={busy || !naturalSize.width || Boolean(loadError)}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-[#D7FF00] hover:bg-[#c5ea00] text-black font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(215,255,0,0.22)] cursor-pointer active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memuat naik...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guna &amp; Upload Logo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
