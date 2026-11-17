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
precision mediump float;

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
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
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
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  // WebGL v_uv.y is bottom-to-top; invert Y so anchorY matches CSS top-to-bottom coordinates
  vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
  float minDim = max(min(u_resolution.x, u_resolution.y), 1.0);
  vec2 delta = (uv - u_anchor) * (u_resolution / minDim);

  float activeRadius = max(u_radius * mix(0.58, 1.0, u_ignite), 0.12);
  float r = length(delta) / activeRadius;
  float ang = atan(delta.y, delta.x);
  float t = u_time;

  // Domain-warped organic fluid motion inside the shader
  vec2 warp = vec2(
    fbm(delta * 2.0 + vec2(t * 0.13, -t * 0.09)),
    fbm(delta * 2.0 + vec2(-t * 0.10, t * 0.14) + vec2(4.2, 1.7))
  );

  // Flowing aurora petals (kelopak cahaya organik)
  float petalA = sin(ang * 3.0 + t * 0.25 + warp.x * 3.6);
  float petalB = cos(ang * 5.0 - t * 0.19 + warp.y * 2.9);
  float petalHarmonic = clamp(0.54 + 0.28 * petalA + 0.18 * petalB, 0.08, 1.0);

  // Flowing silk wave interference
  float waveFlow = fbm(delta * 1.65 + warp * 1.3 + vec2(t * 0.05, -t * 0.15));

  // Generous backlit envelope that still fades smoothly to #000000 at canvas bounds
  float petalStretch = 1.55 - 0.58 * petalHarmonic;
  float envelope = exp(-r * r * petalStretch);
  float softCore = exp(-r * r * 3.1);

  float ribbon = smoothstep(0.20, 0.85, waveFlow * 0.72 + petalHarmonic * 0.40) * envelope;
  float edgeFade = smoothstep(0.0, 0.12, uv.y) * smoothstep(1.0, 0.78, uv.y);
  float luma = clamp((ribbon * 0.80 + softCore * 0.44) * edgeFade, 0.0, 1.0);

  // 70% crisp primary white body + 30% mood accent along aurora petal ridges
  float ridgeRatio = clamp(0.30 + (ribbon - softCore) * 0.18, 0.18, 0.42);
  vec3 tint = mix(u_primary, u_accent, ridgeRatio);

  // Crisp ~1.4px logical film grain so noise texture stays visible & tactile on HiDPI screens
  vec2 grainCoord = floor(gl_FragCoord.xy / max(u_dpr * 1.4, 1.35));
  float grain = hash21(grainCoord + fract(t * 1.5) * 47.0) - 0.5;

  float activeIntensity = u_intensity * u_ignite;
  vec3 color = tint * luma * activeIntensity;
  color += grain * 0.058 * smoothstep(0.02, 0.46, luma) * u_ignite;

  gl_FragColor = vec4(max(color, 0.0), clamp(luma * activeIntensity * 1.2, 0.0, 1.0));
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
 * Compact WebGL domain-warped petaled aurora + visible tactile film grain backdrop.
 * Ignites from dark (0 -> 1) directly behind the target tab's card region whenever `ignitionKey` switches.
 */
export default function AuroraPetalCanvas({
  ignitionKey = 'home',
  anchorX = 0.5,
  anchorY = 0.54,
  radius = 0.62,
  primaryColor = '#FFFFFF',
  accentColor = '#D7FF00',
  intensity = 0.38,
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
    targetRef.current = {
      ignitionKey,
      anchorX,
      anchorY,
      radius,
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

    const current = {
      anchorX: targetRef.current.anchorX,
      anchorY: targetRef.current.anchorY,
      radius: targetRef.current.radius,
      intensity: targetRef.current.intensity,
      primaryRgb: [...targetRef.current.primaryRgb],
      accentRgb: [...targetRef.current.accentRgb],
    };

    let currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextW = Math.round(rect.width * currentDpr);
      const nextH = Math.round(rect.height * currentDpr);
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW;
        canvas.height = nextH;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
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
    const IGNITE_DURATION_MS = 920;

    const renderFrame = (now) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const tgt = targetRef.current;

      if (ignitePendingRef.current) {
        // Snap immediately to new card anchor & mood color, then ignite from 0 behind card
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
