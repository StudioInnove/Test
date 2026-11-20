"use client";

/*
 * The ground behind the explore pages: near-black night navy, with a faint warm light leak drifting
 * through it like lamp light on silk, and fine film grain. On a computer the haze gathers a little around
 * the cursor. Adapted from the 21st.dev "Grainy Light Leak Shader Background" (Velvet Haze, by
 * kedhareswer): recoloured to the studio's palette, turned right down, fixed behind the page, and capped
 * at a calm frame rate. Raw WebGL2, one fragment pass; a plain dark fill if WebGL2 isn't there.
 */
import { useEffect, useRef } from "react";

const INK = "#070a12";

const P = {
  lightX: 0.3, lightY: 0.16, exposure: 0.2, bloom: 0.38, ember: 0.42,
  shadow: 1, fold: 0.48, softness: 1.2, flow: 1,
  grain: 0.05, grainSize: 1, jitter: 0.4, vignette: 0.6,
  lens: 0.5, drag: 0.8, reach: 0.4,
  ink: [7, 10, 18], shade: [3, 5, 10], emberC: [120, 78, 44], violet: [38, 52, 96], lavender: [90, 98, 128], silver: [196, 178, 150],
};
const rgb = (c: number[]) => c.map((v) => v / 255) as [number, number, number];

const VERT = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uDpr, uTime, uFrame, uLampOn;
uniform vec2 uLamp, uSmear;
uniform float uLightX, uLightY, uExposure, uBloom, uEmber, uShadow, uFold, uSoftness, uFlow, uGrain, uGrainSize, uJitter, uVignette, uLens, uDrag, uReach;
uniform vec3 uInk, uShade, uEmberC, uViolet, uLavender, uSilver;
out vec4 frag;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 r = mat2(0.8,-0.6,0.6,0.8); for (int i = 0; i < 4; i++){ v += a*noise(p); p = r*p*2.03 + 11.7; a *= 0.5; } return v; }
float lobe(vec2 q, vec2 c, vec2 s){ vec2 d = (q - c) / s; return exp(-dot(d, d)); }
void main(){
  vec2 px = gl_FragCoord.xy / max(uDpr, 1.0);
  vec2 cssRes = uRes / max(uDpr, 1.0);
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  float t = uTime;
  vec2 weave = (vec2(hash12(vec2(uFrame, 3.1)), hash12(vec2(7.7, uFrame))) - 0.5) * uJitter / cssRes;
  vec2 uv = gl_FragCoord.xy / uRes + weave; uv.y = 1.0 - uv.y;
  vec2 q = uv;
  vec2 dm = (q - uLamp) * asp;
  float fall = exp(-dot(dm, dm) / (uReach * uReach));
  q += (uLamp - q) * fall * uLens * 0.32 * uLampOn;
  q -= uSmear * fall * uDrag;
  float ts = t * 0.05;
  vec2 warp = vec2(fbm(q*1.4 + vec2(0.0, ts)), fbm(q*1.4 + vec2(5.2, 1.3 - ts*0.8))) - 0.5;
  q += warp * 0.2 * uFlow;
  float sway = sin(q.x*3.3 + t*0.21)*0.025 + sin(q.x*7.1 - t*0.13)*0.01;
  vec2 lc = vec2(uLightX, uLightY);
  float edge = uFold - 0.05 + 0.2*smoothstep(0.02, 0.5, q.x) - 0.1*smoothstep(0.45, 1.0, q.x) + sway;
  float soft = mix(0.03, 0.12, smoothstep(0.0, 0.8, q.x)) * uSoftness + 0.004;
  float folded = smoothstep(edge + soft, edge - soft, q.y);
  float haze = lobe(q, lc, vec2(0.75, 0.52));
  float under = lobe(q, lc + vec2(0.1, 0.36), vec2(0.24, 0.1)) * 0.34;
  float silver = (min(haze*1.18, 1.0)*folded + under) * uExposure;
  float violet = lobe(q, vec2(0.7, 0.0), vec2(0.27, 0.24)) * uBloom;
  float lavender = lobe(q, vec2(0.5, 0.02), vec2(0.3, 0.24));
  float ember = lobe(q, vec2(0.66, 0.28), vec2(0.18, 0.09)) * uEmber;
  vec3 col = uInk;
  vec3 lightCol = mix(uSilver, uLavender, lavender*0.8);
  col = mix(col, lightCol, clamp(silver, 0.0, 1.0));
  col = mix(col, uViolet, clamp(violet, 0.0, 1.0)*0.6);
  col = mix(col, uEmberC, clamp(ember, 0.0, 1.0)*0.5);
  float push = 1.0 - fall*0.55*uLampOn;
  float sd = dot(q - vec2(0.6, 0.37), vec2(0.874, 0.486)) + sway*0.8;
  col = mix(col, uShade, clamp(smoothstep(-0.14, 0.26, sd)*uShadow*push, 0.0, 1.0)*0.97);
  col += uSilver * lobe(q, vec2(0.67, 0.53), vec2(0.13, 0.05)) * 0.05 * uExposure;
  col = mix(col, uInk, smoothstep(0.55, 0.95, uv.y)*0.85);
  col += uSilver * fall * 0.035 * uLampOn;
  vec2 v = (uv - vec2(0.36, 0.3)) * vec2(1.0, 1.1);
  col = mix(col, uInk*0.85, uVignette*smoothstep(0.45, 1.1, length(v)));
  vec2 gp = floor(px / max(uGrainSize, 0.5));
  float g = hash12(gp + uFrame*vec2(17.13, 31.71)) - 0.5;
  float g2 = hash12(floor(gp*0.5) + uFrame*vec2(5.3, 9.7)) - 0.5;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += (g*0.8 + g2*0.35) * uGrain * (0.55 + 0.9*sqrt(lum));
  frag = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

export function Haze() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const f1 = (n: string, v: number) => gl.uniform1f(u(n), v);
    // the fixed look
    f1("uLightX", P.lightX); f1("uLightY", P.lightY); f1("uExposure", P.exposure); f1("uBloom", P.bloom); f1("uEmber", P.ember);
    f1("uShadow", P.shadow); f1("uFold", P.fold); f1("uSoftness", P.softness); f1("uFlow", P.flow);
    f1("uGrain", P.grain); f1("uGrainSize", P.grainSize); f1("uJitter", P.jitter); f1("uVignette", P.vignette);
    f1("uLens", P.lens); f1("uDrag", P.drag); f1("uReach", P.reach);
    gl.uniform3fv(u("uInk"), rgb(P.ink)); gl.uniform3fv(u("uShade"), rgb(P.shade)); gl.uniform3fv(u("uEmberC"), rgb(P.emberC));
    gl.uniform3fv(u("uViolet"), rgb(P.violet)); gl.uniform3fv(u("uLavender"), rgb(P.lavender)); gl.uniform3fv(u("uSilver"), rgb(P.silver));
    const U = { res: u("uRes"), dpr: u("uDpr"), time: u("uTime"), frame: u("uFrame"), lamp: u("uLamp"), on: u("uLampOn"), smear: u("uSmear") };

    let cssW = 1;
    const resize = () => {
      // a soft picture: drawn at a modest resolution, grain stays per pixel of that
      const dpr = Math.min(window.devicePixelRatio || 1, fine ? 1.25 : 1);
      cssW = Math.max(1, window.innerWidth);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let tx = 0.5, ty = 0.4, lx = 0.5, ly = 0.4, sx = 0, sy = 0, on = 0, touched = -1e9;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;
      touched = performance.now() / 1000;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    const t0 = performance.now();
    let raf = 0, last = 0, lastT = 0;
    const paint = (now: number) => {
      const t = reduce ? 9 : (now - t0) / 1000;
      const dt = Math.min(0.1, Math.max(0, t - lastT));
      lastT = t;
      const idle = now / 1000 - touched > 5;
      const gx = 0.42 + 0.22 * Math.sin(t * 0.19), gy = 0.38 + 0.16 * Math.cos(t * 0.15);
      const wx = idle ? gx : tx, wy = idle ? gy : ty;
      const k = 1 - Math.exp(-dt * (idle ? 1.2 : 4));
      const nx = lx + (wx - lx) * k, ny = ly + (wy - ly) * k;
      if (dt > 0) {
        const ks = 1 - Math.exp(-dt * 5);
        sx += (Math.max(-3, Math.min(3, (nx - lx) / dt)) * 0.06 - sx) * ks;
        sy += (Math.max(-3, Math.min(3, (ny - ly) / dt)) * 0.06 - sy) * ks;
      }
      lx = nx; ly = ny;
      on += ((fine ? (idle ? 0.5 : 1) : 0.4) - on) * (1 - Math.exp(-dt * 3));
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.dpr, canvas.width / cssW);
      gl.uniform1f(U.time, t);
      gl.uniform1f(U.frame, Math.floor(t * 24) % 4096);
      gl.uniform2f(U.lamp, lx, ly);
      gl.uniform1f(U.on, on);
      gl.uniform2f(U.smear, sx, sy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // 30 frames a second is plenty for drifting light
      if (now - last < 33 || document.hidden) return;
      last = now;
      paint(now);
    };
    paint(performance.now());
    canvas.style.opacity = "1";
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      gl.deleteProgram(prog);
      gl.deleteVertexArray(vao);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{ background: INK }}>
      <canvas ref={ref} className="block h-full w-full transition-opacity duration-1000" style={{ opacity: 0 }} />
    </div>
  );
}
