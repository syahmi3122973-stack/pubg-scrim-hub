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

  float r = length(delta) / max(u_radius, 0.12);
  float ang = atan(delta.y, delta.x);
  float t = u_time;

  // Domain-warped organic fluid motion inside the shader (no box sliding)
  vec2 warp = vec2(
    fbm(delta * 2.3 + vec2(t * 0.14, -t * 0.10)),
    fbm(delta * 2.3 + vec2(-t * 0.11, t * 0.15) + vec2(4.2, 1.7))
  );

  // Flowing aurora petals (kelopak cahaya organik)
  float petalA = sin(ang * 3.0 + t * 0.28 + warp.x * 3.8);
  float petalB = cos(ang * 5.0 - t * 0.21 + warp.y * 3.1);
  float petalHarmonic = clamp(0.54 + 0.28 * petalA + 0.18 * petalB, 0.08, 1.0);

  // Flowing silk wave interference
  float waveFlow = fbm(delta * 1.85 + warp * 1.35 + vec2(t * 0.06, -t * 0.16));

  // Compact exponential envelope so glow melts smoothly into pure #000000
  float petalStretch = 1.65 - 0.62 * petalHarmonic;
  float envelope = exp(-r * r * petalStretch);
  float softCore = exp(-r * r * 3.6);

  float ribbon = smoothstep(0.22, 0.86, waveFlow * 0.72 + petalHarmonic * 0.40) * envelope;
  float edgeFade = smoothstep(1.0, 0.82, uv.y);
  float luma = clamp((ribbon * 0.78 + softCore * 0.42) * edgeFade, 0.0, 1.0);

  // Strict ~70% primary (white) + ~30% accent mood blend along aurora ridges
  float ridgeRatio = clamp(0.30 + (ribbon - softCore) * 0.18, 0.18, 0.42);
  vec3 tint = mix(u_primary, u_accent, ridgeRatio);

  // Procedural 1px film grain dither to prevent gradient banding on OLED screens
  float grain = hash21(gl_FragCoord.xy + fract(t * 1.7) * 53.0) - 0.5;
  vec3 color = tint * luma * u_intensity;
  color += grain * 0.042 * smoothstep(0.025, 0.45, luma);

  gl_FragColor = vec4(max(color, 0.0), clamp(luma * u_intensity * 1.15, 0.0, 1.0));
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
 * Compact WebGL domain-warped petaled aurora + procedural 1px film grain backdrop.
 * Smoothly interpolates anchor, scale, and mood colors across tab hierarchy transitions.
 */
export default function AuroraPetalCanvas({
  anchorX = 0.5,
  anchorY = 0.34,
  radius = 0.52,
  primaryColor = '#FFFFFF',
  accentColor = '#D7FF00',
  intensity = 0.36,
  className = '',
}) {
  const canvasRef = useRef(null);
  const targetRef = useRef({
    anchorX,
    anchorY,
    radius,
    intensity,
    primaryRgb: hexToRgbNorm(primaryColor),
    accentRgb: hexToRgbNorm(accentColor),
  });

  useEffect(() => {
    targetRef.current = {
      anchorX,
      anchorY,
      radius,
      intensity,
      primaryRgb: hexToRgbNorm(primaryColor),
      accentRgb: hexToRgbNorm(accentColor),
    };
  }, [anchorX, anchorY, radius, primaryColor, accentColor, intensity]);

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

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const nextW = Math.round(rect.width * dpr);
      const nextH = Math.round(rect.height * dpr);
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

    const renderFrame = (now) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const smooth = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.5);
      const tgt = targetRef.current;

      current.anchorX += (tgt.anchorX - current.anchorX) * smooth;
      current.anchorY += (tgt.anchorY - current.anchorY) * smooth;
      current.radius += (tgt.radius - current.radius) * smooth;
      current.intensity += (tgt.intensity - current.intensity) * smooth;
      for (let i = 0; i < 3; i += 1) {
        current.primaryRgb[i] += (tgt.primaryRgb[i] - current.primaryRgb[i]) * smooth;
        current.accentRgb[i] += (tgt.accentRgb[i] - current.accentRgb[i]) * smooth;
      }

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform2f(uAnchor, current.anchorX, current.anchorY);
      gl.uniform1f(uRadius, current.radius);
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
