"use client";

/*
 * Lights: a little game for the phone. A city at night; lights lift off its windows and drift up into the dark.
 * Tap them before they fade. Warm ones are worth 1, quick blue ones 2, the rare gold one 5; catching in quick
 * succession builds a combo. Twenty seconds a round, best score kept for the visit. Drawn on a canvas.
 * When nobody's playing it idles beautifully: a few lights drift up on their own.
 */
import { useEffect, useRef, useState } from "react";

const W = 390, H = 844;
const ROUND = 20;
const SKY = 590; // where the skyline starts

type Light = { x: number; y: number; vx: number; vy: number; r: number; born: number; life: number; kind: 0 | 1 | 2; ph: number };
type Spark = { x: number; y: number; vx: number; vy: number; born: number; c: string };
type Pop = { x: number; y: number; born: number; text: string };

const COL = [
  { core: "#ffd6a0", glow: "255,170,90" },
  { core: "#cfe0ff", glow: "120,160,255" },
  { core: "#fff1b8", glow: "255,210,90" },
];

// a seeded skyline, the same every time
function skyline() {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const blds: { x: number; w: number; h: number; win: { x: number; y: number; on: number; ph: number }[] }[] = [];
  let x = -10;
  while (x < W + 10) {
    const w = 34 + rnd() * 46;
    const h = 90 + rnd() * 170 + (x > 230 && x < 290 ? 120 : 0);
    const win: { x: number; y: number; on: number; ph: number }[] = [];
    for (let wy = H - h + 14; wy < H - 20; wy += 15) for (let wx = x + 7; wx < x + w - 8; wx += 11) if (rnd() < 0.42) win.push({ x: wx, y: wy, on: rnd(), ph: rnd() * 6.28 });
    blds.push({ x, w, h, win });
    x += w + 2 + rnd() * 6;
  }
  const far: { x: number; w: number; h: number }[] = [];
  for (let fx = -20; fx < W + 20; ) {
    const w = 26 + rnd() * 40;
    far.push({ x: fx, w, h: 150 + rnd() * 190 });
    fx += w + rnd() * 4;
  }
  const stars = Array.from({ length: 70 }, () => ({ x: rnd() * W, y: rnd() * (SKY - 60), r: 0.4 + rnd() * 1.1, ph: rnd() * 6.28 }));
  return { blds, far, stars };
}

export function LightsGame({ live, active }: { live: boolean; active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [left, setLeft] = useState(ROUND);
  const [combo, setCombo] = useState(1);
  const game = useRef({ lights: [] as Light[], sparks: [] as Spark[], pops: [] as Pop[], score: 0, combo: 1, lastCatch: 0, start: 0, playing: false, nextSpawn: 0 });

  useEffect(() => {
    if (!active) return;
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { blds, far, stars } = skyline();
    const g = game.current;
    let raf = 0, last = 0;
    const spawn = (now: number, attract: boolean) => {
      const b = blds[Math.floor(Math.random() * blds.length)];
      const w = b.win.length ? b.win[Math.floor(Math.random() * b.win.length)] : { x: b.x + b.w / 2, y: H - b.h };
      const roll = Math.random();
      const kind: 0 | 1 | 2 = attract ? 0 : roll < 0.06 ? 2 : roll < 0.3 ? 1 : 0;
      const t = g.playing ? Math.min(1, (now - g.start) / (ROUND * 1000)) : 0;
      // most lift off a window; some appear out of the dark
      const sky = !attract && Math.random() < 0.35;
      g.lights.push({
        x: sky ? 40 + Math.random() * (W - 80) : w.x, y: sky ? 220 + Math.random() * 300 : Math.min(w.y, SKY + 60), vx: (Math.random() - 0.5) * 18,
        vy: -(kind === 1 ? 120 : kind === 2 ? 60 : 85) * (1 + t * 0.5) * (attract ? 0.55 : sky ? 0.45 : 1),
        r: kind === 2 ? 20 : kind === 1 ? 12 : 15, born: now, life: (kind === 1 ? 2200 : kind === 2 ? 3200 : 2900) * (attract ? 1.6 : 1 - t * 0.25), kind, ph: Math.random() * 6.28,
      });

    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      if (!g.playing && now - last < 30) return; // idling: 30 fps is plenty
      last = now;
      // spawn
      if (now > g.nextSpawn) {
        spawn(now, !g.playing);
        const t = g.playing ? Math.min(1, (now - g.start) / (ROUND * 1000)) : 0;
        g.nextSpawn = now + (g.playing ? 430 - t * 200 + Math.random() * 160 : 650 + Math.random() * 600);
      }
      // the round's clock
      if (g.playing) {
        const l = Math.max(0, ROUND - Math.floor((now - g.start) / 1000));
        setLeft((p) => (p !== l ? l : p));
        if (now - g.start >= ROUND * 1000) {
          g.playing = false;
          setPhase("done");
          setBest((b) => Math.max(b, g.score));
        }
        if (g.combo > 1 && now - g.lastCatch > 1400) {
          g.combo = 1;
          setCombo(1);
        }
      }
      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#070912");
      sky.addColorStop(0.55, "#111427");
      sky.addColorStop(0.8, "#2a1d2c");
      sky.addColorStop(1, "#3a2420");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      const haze = ctx.createRadialGradient(W * 0.62, SKY + 40, 10, W * 0.62, SKY + 40, 300);
      haze.addColorStop(0, "rgba(255,150,80,0.22)");
      haze.addColorStop(1, "rgba(255,150,80,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, H);
      const ts = now / 1000;
      for (const s of stars) {
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(ts * 1.3 + s.ph);
        ctx.fillStyle = "#dfe6ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // lights (behind the buildings at first, they rise out of them)
      ctx.globalCompositeOperation = "lighter";
      g.lights = g.lights.filter((L) => now - L.born < L.life);
      for (const L of g.lights) {
        const age = (now - L.born) / L.life;
        L.x += (L.vx + Math.sin(ts * 2 + L.ph) * 10) * dt;
        L.y += L.vy * dt;
        const a = age < 0.12 ? age / 0.12 : age > 0.7 ? Math.max(0, (1 - age) / 0.3) : 1;
        const c = COL[L.kind];
        const R = L.r * (1 + 0.08 * Math.sin(ts * 6 + L.ph));
        const gr = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, R * 3.2);
        gr.addColorStop(0, `rgba(${c.glow},${0.55 * a})`);
        gr.addColorStop(0.35, `rgba(${c.glow},${0.18 * a})`);
        gr.addColorStop(1, `rgba(${c.glow},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(L.x, L.y, R * 3.2, 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = a;
        ctx.fillStyle = c.core;
        ctx.beginPath();
        ctx.arc(L.x, L.y, R * 0.42, 0, 6.283);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // sparks from a catch
      g.sparks = g.sparks.filter((s) => now - s.born < 700);
      for (const s of g.sparks) {
        const k = (now - s.born) / 700;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 120 * dt;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.2 * (1 - k) + 0.4, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      // the far city, softer, a little hazy
      ctx.fillStyle = "#141626";
      for (const b of far) ctx.fillRect(b.x, H - 90 - b.h, b.w, b.h + 90);
      const fade = ctx.createLinearGradient(0, H - 380, 0, H);
      fade.addColorStop(0, "rgba(42,29,44,0)");
      fade.addColorStop(1, "rgba(42,29,44,0.35)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, H - 380, W, 380);
      // the city
      for (const b of blds) {
        ctx.fillStyle = "#0a0b12";
        ctx.fillRect(b.x, H - b.h, b.w, b.h);
        for (const w of b.win) {
          const on = 0.5 + 0.5 * Math.sin(ts * 0.35 + w.ph);
          if (w.on + on * 0.3 < 0.62) continue;
          ctx.fillStyle = `rgba(255,${190 + Math.round(w.on * 30)},120,${0.35 + 0.4 * w.on})`;
          ctx.fillRect(w.x, w.y, 4, 6);
        }
      }
      // the tower, with its ring
      const tx = 262;
      ctx.fillStyle = "#0c0d15";
      ctx.beginPath();
      ctx.moveTo(tx - 12, H);
      ctx.lineTo(tx - 6, SKY - 120);
      ctx.lineTo(tx + 6, SKY - 120);
      ctx.lineTo(tx + 12, H);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,236,210,${0.7 + 0.2 * Math.sin(ts * 2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(tx, SKY - 128, 14, 4, 0, 0, 6.283);
      ctx.stroke();
      // floating scores
      g.pops = g.pops.filter((p) => now - p.born < 900);
      ctx.textAlign = "center";
      ctx.font = "600 18px Inter, system-ui, sans-serif";
      for (const p of g.pops) {
        const k = (now - p.born) / 900;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = "#fff";
        ctx.fillText(p.text, p.x, p.y - k * 40);
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const start = () => {
    const g = game.current;
    g.lights = [];
    g.sparks = [];
    g.pops = [];
    g.score = 0;
    g.combo = 1;
    g.start = performance.now();
    g.nextSpawn = g.start + 300;
    g.playing = true;
    setScore(0);
    setCombo(1);
    setLeft(ROUND);
    setPhase("play");
  };

  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = game.current;
    if (!live || !g.playing) return;
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width, y = ((e.clientY - r.top) * H) / r.height;
    const now = performance.now();
    let hit = -1, bestD = 1e9;
    g.lights.forEach((L, i) => {
      const d = Math.hypot(L.x - x, L.y - y);
      if (d < L.r * 2.6 + 10 && d < bestD) {
        bestD = d;
        hit = i;
      }
    });
    if (hit < 0) return;
    const L = g.lights[hit];
    g.lights.splice(hit, 1);
    g.combo = now - g.lastCatch < 1400 ? Math.min(5, g.combo + 1) : 1;
    g.lastCatch = now;
    const pts = [1, 2, 5][L.kind] * g.combo;
    g.score += pts;
    setScore(g.score);
    setCombo(g.combo);
    const c = COL[L.kind].core;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 6.283, v = 60 + Math.random() * 110;
      g.sparks.push({ x: L.x, y: L.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, born: now, c });
    }
    g.pops.push({ x: L.x, y: L.y - 14, born: now, text: `+${pts}` });
    try { navigator.vibrate?.(8); } catch {}
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070912] text-white">
      <canvas ref={ref} onPointerDown={tap} className="absolute inset-0 h-full w-full" style={{ touchAction: "none", willChange: "transform", transform: "translateZ(0)" }} />
      {/* the title screen: the name, centred over the night; the clock and score while playing */}
      <div className={`pointer-events-none absolute inset-x-0 top-[180px] text-center transition-all duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${phase === "idle" ? "opacity-100" : "-translate-y-3 opacity-0"}`}>
        <p className="text-[13px] font-[500] uppercase tracking-[0.32em] text-[#ffd6a0]/80">A little game</p>
        <p className="mt-3 text-[64px] font-[600] leading-none tracking-[-0.05em]" style={{ textShadow: "0 0 40px rgba(255,190,120,.45)" }}>Lights</p>
        <p className="mx-auto mt-4 max-w-[250px] text-[15px] leading-[1.4] text-white/60 [text-wrap:balance]">Catch the city&rsquo;s lights before they fade.</p>
      </div>
      <div className="pointer-events-none absolute inset-x-6 top-[58px]">
        <div className={`absolute inset-x-0 top-0 transition-all duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${phase === "play" ? "opacity-100" : "translate-y-2 opacity-0"}`}>
          <div className="flex items-end justify-between">
            <p className="text-[46px] font-[600] leading-none tracking-[-0.04em] tabular-nums">{score}</p>
            <p className={`mb-1 rounded-full bg-white/10 px-3 py-1 text-[13px] font-[600] tabular-nums transition-all duration-300 ${combo > 1 ? "scale-100 opacity-100" : "scale-90 opacity-0"}`} style={{ color: "#ffd6a0" }}>×{combo}</p>
          </div>
          <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#ffb27a,#ffe0b0)] transition-[width] duration-1000 ease-linear" style={{ width: `${(left / ROUND) * 100}%` }} />
          </div>
        </div>
      </div>
      {/* start, and the end of a round */}
      <div className={`absolute inset-x-0 bottom-[86px] flex flex-col items-center gap-4 px-10 transition-all duration-700 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${phase === "play" ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100"}`}>
        {phase === "done" && (
          <div className="mb-2 text-center">
            <p className="text-[12px] uppercase tracking-[0.24em] text-white/50">Lights caught</p>
            <p className="mt-1 text-[72px] font-[600] leading-none tracking-[-0.05em] tabular-nums" style={{ textShadow: "0 0 40px rgba(255,190,120,.45)" }}>{score}</p>
            <p className="mt-2 text-[14px] text-white/55">{score >= best ? "A new best." : `Best ${best}`}</p>
          </div>
        )}
        <button type="button" tabIndex={live ? 0 : -1} onClick={start} className="h-[60px] w-[220px] rounded-full bg-white text-[17px] font-[600] tracking-[-0.01em] text-[#0b0d18] shadow-[0_0_0_6px_rgb(255_255_255/0.08),0_14px_50px_rgb(255_180_120/0.45)] transition-transform duration-150 active:scale-[0.97]">
          {phase === "done" ? "Play again" : "Play"}
        </button>
        <p className="text-[12.5px] text-white/45">{phase === "idle" && best ? `Best ${best} · ` : ""}20 seconds · tap to catch</p>
      </div>
    </div>
  );
}
