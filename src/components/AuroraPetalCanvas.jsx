import React, { useEffect, useRef } from 'react';

const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_anchor;
uniform float u_radius;
uniform float u_ignite;
uniform float u_dpr;
uniform float u_time;
uniform float u_intensity;
uniform vec3 u_primary;
uniform vec3 u_accent;

float hash21(vec2 p) {
  // Keep coordinates bounded before hash multiply to stay crisp on mobile GPUs
  p = mod(p, 256.0);
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.04;
    a *= 0.5;
  }
  return v;
}

void main() {
  // WebGL v_uv.y is bottom-to-top; invert Y so anchorY matches CSS top-to-bottom coordinates
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  float minDim = max(min(u_resolution.x, u_resolution.y), 1.0);
  vec2 delta = (uv - u_anchor) * (u_resolution / minDim);

  // Starting glow emerges strictly from inside the card center (0.42x) and expands smoothly outward (1.0x)
  float activeRadius = max(u_radius * mix(0.42, 1.0, u_ignite), 0.12);
  float r = length(delta) / activeRadius;
  float ang = atan(delta.y, delta.x);
  float t = u_time;

  // Domain-warped organic fluid motion inside the shader
  vec2 warp = vec2(
    fbm(delta * 2.15 + vec2(t * 0.13, -t * 0.09)),
    fbm(delta * 2.15 + vec2(-t * 0.10, t * 0.14) + vec2(4.2, 1.7))
  );

  // Flowing aurora petals (kelopak cahaya organik)
  float petalA = sin(ang * 3.0 + t * 0.25 + warp.x * 3.8);
  float petalB = cos(ang * 5.0 - t * 0.19 + warp.y * 3.1);
  float petalHarmonic = clamp(0.54 + 0.28 * petalA + 0.18 * petalB, 0.08, 1.0);

  // Flowing silk wave interference with crisp defined aurora crests
  float waveFlow = fbm(delta * 1.75 + warp * 1.35 + vec2(t * 0.05, -t * 0.15));
  float combined = waveFlow * 0.70 + petalHarmonic * 0.42;

  float petalStretch = 1.48 - 0.56 * petalHarmonic;
  float envelope = exp(-r * r * petalStretch);
  float softCore = exp(-r * r * 2.45);

  float ribbon = smoothstep(0.24, 0.82, combined) * envelope;
  float crispCrest = pow(smoothstep(0.46, 0.94, combined), 1.55) * envelope;

  float edgeFade = smoothstep(0.0, 0.10, uv.y) * smoothstep(1.0, 0.82, uv.y);
  float luma = clamp((ribbon * 0.68 + crispCrest * 0.42 + softCore * 0.30) * edgeFade, 0.0, 1.0);

  // 70% crisp primary white body + 30% mood accent concentrated along crisp petal crests
  float ridgeRatio = clamp(0.28 + crispCrest * 0.24 - softCore * 0.10, 0.18, 0.44);
  vec3 tint = mix(u_primary, u_accent, ridgeRatio);

  // Retina-calibrated sharp micro-grain (~1.6px physical on 2K 3x DPR phones, ~1px on 1x PC)
  vec2 grainCoord = floor(gl_FragCoord.xy / max(u_dpr * 0.55, 1.0));
  float grain = hash21(grainCoord + vec2(floor(fract(t * 0.75) * 64.0) * 1.37, 19.7)) - 0.5;

  float activeIntensity = u_intensity * u_ignite;
  vec3 color = tint * luma * activeIntensity;
  color += grain * 0.078 * smoothstep(0.02, 0.45, luma) * u_ignite;

  gl_FragColor = vec4(max(color, 0.0), clamp(luma * activeIntensity * 1.22, 0.0, 1.0));
}
`;

function hexToRgbNorm(hex) {
  const clean = String(hex || '#FFFFFF').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, 'F').slice(0, 6);
  const n = parseInt(full, 16);
  return [
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  ];
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Measure `[data-aurora-target]` in DOM so the ignition origin starts strictly behind the
 * primary card center on both phone and desktop viewports, then blooms around its perimeter.
 */
function measureTargetGeometry(canvas, key, fallback) {
  const canvasRect = canvas?.getBoundingClientRect();
  if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) return fallback;

  const targetEl = document.querySelector(`[data-aurora-target="${key}"]`);
  if (!targetEl) return fallback;

  const cardRect = targetEl.getBoundingClientRect();
  if (cardRect.width <= 24 || cardRect.height <= 24) return fallback;

  const clampedH = Math.min(cardRect.height, 420);
  const ax = Math.min(0.88, Math.max(0.12, (cardRect.left + cardRect.width * 0.5 - canvasRect.left) / canvasRect.width));
  const ay = Math.min(0.85, Math.max(0.16, (cardRect.top + clampedH * 0.5 - canvasRect.top) / canvasRect.height));
  const minCanvas = Math.min(canvasRect.width, canvasRect.height);
  const cardSpan = Math.max(cardRect.width, clampedH);
  const radius = Math.min(0.92, Math.max(0.46, (cardSpan * 0.68) / minCanvas));

  return { anchorX: ax, anchorY: ay, radius };
}

/**
 * Native HiDPI (up to 3x DPR for 2K phones) WebGL petaled aurora + sharp film grain backdrop.
 * Anchors directly behind `[data-aurora-target]` and ignites from dark (0 -> 1) on tab changes.
 */
export default function AuroraPetalCanvas({
  ignitionKey = 'home',
  anchorX = 0.5,
  anchorY = 0.52,
  radius = 0.6,
  primaryColor = '#FFFFFF',
  accentColor = '#D7FF00',
  intensity = 0.4,
  className = '',
}) {
  const canvasRef = useRef(null);
  const targetRef = useRef({
    ignitionKey,
    anchorX,
    anchorY,
    radius,
    intensity,
    primaryRgb: hexToRgbNorm(primaryColor),
    accentRgb: hexToRgbNorm(accentColor),
  });
  const ignitePendingRef = useRef(true);

  useEffect(() => {
    const isNewTab = targetRef.current.ignitionKey !== ignitionKey;
    const measured = measureTargetGeometry(canvasRef.current, ignitionKey, {
      anchorX,
      anchorY,
      radius,
    });
    targetRef.current = {
      ignitionKey,
      anchorX: measured.anchorX,
      anchorY: measured.anchorY,
      radius: measured.radius,
      intensity,
      primaryRgb: hexToRgbNorm(primaryColor),
      accentRgb: hexToRgbNorm(accentColor),
    };
    if (isNewTab) {
      ignitePendingRef.current = true;
    }
  }, [ignitionKey, anchorX, anchorY, radius, primaryColor, accentColor, intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) return undefined;

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vert || !frag) return undefined;

    const program = gl.createProgram();
    if (!program) return undefined;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return undefined;
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_pos');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uAnchor = gl.getUniformLocation(program, 'u_anchor');
    const uRadius = gl.getUniformLocation(program, 'u_radius');
    const uIgnite = gl.getUniformLocation(program, 'u_ignite');
    const uDpr = gl.getUniformLocation(program, 'u_dpr');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');
    const uPrimary = gl.getUniformLocation(program, 'u_primary');
    const uAccent = gl.getUniformLocation(program, 'u_accent');

    const initialGeo = measureTargetGeometry(canvas, targetRef.current.ignitionKey, {
      anchorX: targetRef.current.anchorX,
      anchorY: targetRef.current.anchorY,
      radius: targetRef.current.radius,
    });
    targetRef.current.anchorX = initialGeo.anchorX;
    targetRef.current.anchorY = initialGeo.anchorY;
    targetRef.current.radius = initialGeo.radius;

    const current = {
      anchorX: initialGeo.anchorX,
      anchorY: initialGeo.anchorY,
      radius: initialGeo.radius,
      intensity: targetRef.current.intensity,
      primaryRgb: [...targetRef.current.primaryRgb],
      accentRgb: [...targetRef.current.accentRgb],
    };

    const getClampedDpr = () => Math.min(window.devicePixelRatio || 1, 3);
    let currentDpr = getClampedDpr();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      currentDpr = getClampedDpr();
      const nextW = Math.round(rect.width * currentDpr);
      const nextH = Math.round(rect.height * currentDpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);

      const resynced = measureTargetGeometry(canvas, targetRef.current.ignitionKey, targetRef.current);
      targetRef.current.anchorX = resynced.anchorX;
      targetRef.current.anchorY = resynced.anchorY;
      targetRef.current.radius = resynced.radius;
    };

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    let rafId = 0;
    const startTs = performance.now();
    let lastTs = startTs;
    let igniteStartTs = startTs;
    const IGNITE_DURATION_MS = 950;

    const renderFrame = (now) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const tgt = targetRef.current;

      if (ignitePendingRef.current) {
        const freshGeo = measureTargetGeometry(canvas, tgt.ignitionKey, tgt);
        tgt.anchorX = freshGeo.anchorX;
        tgt.anchorY = freshGeo.anchorY;
        tgt.radius = freshGeo.radius;

        ignitePendingRef.current = false;
        igniteStartTs = now;
        current.anchorX = tgt.anchorX;
        current.anchorY = tgt.anchorY;
        current.radius = tgt.radius;
        current.intensity = tgt.intensity;
        current.primaryRgb = [...tgt.primaryRgb];
        current.accentRgb = [...tgt.accentRgb];
      } else {
        const smooth = reducedMotion ? 1 : 1 - Math.exp(-dt * 5.0);
        current.anchorX += (tgt.anchorX - current.anchorX) * smooth;
        current.anchorY += (tgt.anchorY - current.anchorY) * smooth;
        current.radius += (tgt.radius - current.radius) * smooth;
        current.intensity += (tgt.intensity - current.intensity) * smooth;
        for (let i = 0; i < 3; i += 1) {
          current.primaryRgb[i] += (tgt.primaryRgb[i] - current.primaryRgb[i]) * smooth;
          current.accentRgb[i] += (tgt.accentRgb[i] - current.accentRgb[i]) * smooth;
        }
      }

      const rawIgnite = reducedMotion ? 1 : Math.min((now - igniteStartTs) / IGNITE_DURATION_MS, 1);
      const easedIgnite = 1 - Math.pow(1 - rawIgnite, 3);

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uAnchor, current.anchorX, current.anchorY);
      gl.uniform1f(uRadius, current.radius);
      gl.uniform1f(uIgnite, easedIgnite);
      gl.uniform1f(uDpr, currentDpr);
      gl.uniform1f(uTime, reducedMotion ? 2.4 : (now - startTs) * 0.001);
      gl.uniform1f(uIntensity, current.intensity);
      gl.uniform3fv(uPrimary, current.primaryRgb);
      gl.uniform3fv(uAccent, current.accentRgb);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handleMotionChange = (e) => {
      reducedMotion = e.matches;
      window.cancelAnimationFrame(rafId);
      renderFrame(performance.now());
    };
    motionQuery.addEventListener?.('change', handleMotionChange);

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro?.disconnect();
      motionQuery.removeEventListener?.('change', handleMotionChange);
      gl.deleteBuffer(posBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`w-full h-full block ${className}`}
    />
  );
}
