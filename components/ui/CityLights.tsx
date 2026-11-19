"use client";

/*
 * The foot of the page: a field of tiny city lights seen from very high up, with the studio's name
 * cut out of them across the full width. Lights glitter, a shimmer runs up and down through them in a
 * few places, and every so often a little train slides along the bottom. On a computer the lights near the cursor warm up a touch.
 * Drawn on a canvas at a calm frame rate, and only while it's on screen.
 */
import { useEffect, useRef } from "react";

type Dot = { x: number; y: number; base: number; level: number; target: number; warm: boolean };

export function CityLights({ text }: { text: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let W = 0, H = 0, dpr = 1;
    let dots: Dot[] = [];
    let mask: Uint8ClampedArray | null = null;
    let maskW = 0;
    let visible = false;
    let raf = 0, last = 0;
    let train = { x: -1, speed: 0, next: performance.now() + 4000 };
    const mouse = { x: -1e4, y: -1e4 };
    // places where the lights shimmer up and down for a while, then move elsewhere
    type Shimmer = { x: number; w: number; speed: number; phase: number; from: number; until: number; fade: (t: number) => number };
    const newShimmer = (t: number): Shimmer => {
      const from = t, until = t + 6 + Math.random() * 8;
      return {
        x: Math.random() * (W || 1200), w: 40 + Math.random() * 110, speed: 0.6 + Math.random() * 0.7, phase: Math.random() * 6.28, from, until,
        fade: (n: number) => Math.min(1, (n - from) / 1.5, (until - n) / 1.5),
      };
    };
    const shimmers: Shimmer[] = [0, 1, 2].map(() => newShimmer(performance.now() / 1000 - Math.random() * 6));

    const inText = (x: number, y: number) => {
      if (!mask) return false;
      const i = (Math.round(y * dpr) * maskW + Math.round(x * dpr)) * 4 + 3;
      return (mask[i] ?? 0) > 90;
    };

    const build = async () => {
      try { await document.fonts.load('500 120px "Inter Variable"'); } catch {}
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);

      // the name, edge to edge, sitting on the bottom
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const o = off.getContext("2d")!;
      o.scale(dpr, dpr);
      const family = '"Inter Variable", Inter, system-ui, sans-serif';
      o.font = `500 100px ${family}`;
      o.letterSpacing = "-5px";
      const w100 = o.measureText(text).width;
      const gutter = Math.max(16, Math.min(69, W * 0.048));
      const size = ((W - gutter * 2) * 100) / w100;
      o.font = `500 ${size}px ${family}`;
      o.letterSpacing = `${-0.05 * size}px`;
      o.fillStyle = "#fff";
      o.textBaseline = "alphabetic";
      o.fillText(text, gutter, H + size * 0.04);
      mask = o.getImageData(0, 0, off.width, off.height).data;
      maskW = off.width;

      // the lights: sparse at the top, dense near the bottom
      const step = W < 700 ? 6 : 5;
      dots = [];
      for (let y = step; y < H - 1; y += step) {
        const p = Math.pow(y / H, 1.2) * 0.95;
        for (let x = step / 2; x < W; x += step) {
          if (Math.random() > p || inText(x, y)) continue;
          const base = 0.3 + Math.random() * 0.45;
          dots.push({ x, y, base, level: base, target: base, warm: Math.random() < 0.6 });
        }
      }
      draw(performance.now());
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // glitter: a handful of lights sparkle up and settle each frame
      if (!reduce && dots.length) {
        for (let k = 0; k < 6; k++) {
          const d = dots[(Math.random() * dots.length) | 0];
          d.target = Math.random() < 0.75 ? 1 : d.base * 0.25;
        }
      }
      // and in a few places a shimmer runs up and down through the lights
      const t = now / 1000;
      for (const sh of shimmers) {
        if (t > sh.until) Object.assign(sh, newShimmer(t));
      }
      for (const d of dots) {
        d.level += (d.target - d.level) * (d.target > d.level ? 0.22 : 0.05);
        if (Math.abs(d.target - d.level) < 0.02 && d.target !== d.base) d.target = d.base;
        let a = d.level;
        if (!reduce) {
          for (const sh of shimmers) {
            const dx = Math.abs(d.x - sh.x);
            if (dx > sh.w) continue;
            const wy = H * (0.5 + 0.5 * Math.sin(t * sh.speed + sh.phase));
            const dy = (d.y - wy) / 14;
            a += Math.exp(-dy * dy) * (1 - dx / sh.w) * 0.7 * sh.fade(t);
          }
        }
        if (fine) {
          const dx = d.x - mouse.x, dy = d.y - mouse.y;
          const near = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / 140);
          a += near * near * 0.45;
        }
        a = Math.min(1, a);
        const sz = a > 0.9 ? 2.2 : 1.6;
        ctx.fillStyle = d.warm ? `rgba(240,176,108,${a})` : `rgba(239,233,224,${a * 0.9})`;
        ctx.fillRect(d.x - (sz - 1.6) / 2, d.y - (sz - 1.6) / 2, sz, sz);
      }
      // the train: a short line of lit carriages along the bottom
      if (!reduce) {
        if (train.x < 0 && now > train.next) train = { x: -160, speed: 0.18 + Math.random() * 0.08, next: 0 };
        if (train.x >= -160 && train.next === 0) {
          const y = H - 7;
          for (let c = 0; c < 12; c++) {
            const cx = train.x + c * 11;
            if (cx < -10 || cx > W + 10 || inText(cx + 4, y)) continue;
            ctx.fillStyle = c === 11 ? "rgba(255,226,180,0.95)" : "rgba(240,190,130,0.7)";
            ctx.fillRect(cx, y, 9, 2);
          }
          train.x += train.speed * 16;
          if (train.x > W + 20) train = { x: -1, speed: 0, next: now + 8000 + Math.random() * 9000 };
        }
      }
    };

    const loop = (now: number) => {
      if (!visible) return;
      if (now - last > 40) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(wrap);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = mouse.y = -1e4; };
    if (fine) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
    }
    let rt = 0, lastW = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = window.setTimeout(() => {
        if (wrap.clientWidth !== lastW) { lastW = wrap.clientWidth; build(); }
      }, 150);
    };
    window.addEventListener("resize", onResize);
    lastW = wrap.clientWidth;
    build();

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      window.removeEventListener("resize", onResize);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [text]);

  return (
    <div ref={wrapRef} aria-hidden className="relative h-[clamp(92px,13vw,190px)] w-full select-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
