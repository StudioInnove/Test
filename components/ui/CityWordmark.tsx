"use client";

/*
 * The studio's name set huge at the foot of the page, built like the city in the film:
 * each letter is a dark tower full of office windows. Lights come on and go off slowly,
 * and on a computer the windows near the cursor warm up, as if someone just walked in.
 * Inspired by the 21st.dev "Footer with Big Wordmark" (vilqor) and "Doodle Crew Footer" (kedhareswer).
 */
import { useEffect, useRef } from "react";

type Win = { x: number; y: number; on: number; target: number; warm: boolean; next: number };

export function CityWordmark({ text }: { text: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let wins: Win[] = [];
    let cell = 8;
    let W = 0, H = 0, dpr = 1;
    let letters: HTMLCanvasElement | null = null;
    let visible = false;
    let raf = 0;
    let last = 0;
    const mouse = { x: -1e4, y: -1e4 };

    const build = async () => {
      try { await document.fonts.load('500 200px "Inter Variable"'); } catch {}
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth;
      // size the type so the name spans the full width
      const probe = document.createElement("canvas").getContext("2d")!;
      const family = '"Inter Variable", Inter, system-ui, sans-serif';
      probe.font = `500 100px ${family}`;
      probe.letterSpacing = "-4px";
      const m = probe.measureText(text);
      const size = Math.min(420, (W * 0.985 * 100) / m.width);
      const asc = size * 0.74;
      H = Math.round(asc * 1.02);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = `${H}px`;
      wrap.style.height = `${H}px`;

      // the letters, once, as a mask
      letters = document.createElement("canvas");
      letters.width = canvas.width;
      letters.height = canvas.height;
      const l = letters.getContext("2d")!;
      l.scale(dpr, dpr);
      l.font = `500 ${size}px ${family}`;
      l.letterSpacing = `${-0.04 * size}px`;
      l.textBaseline = "alphabetic";
      const tw = l.measureText(text).width;
      l.fillStyle = "#fff";
      l.fillText(text, (W - tw) / 2, asc);
      const alpha = l.getImageData(0, 0, letters.width, letters.height).data;

      // windows: a fine grid, kept only where the letters are solid
      cell = Math.max(4, Math.round(size / 40));
      wins = [];
      const now = performance.now();
      for (let y = Math.round(cell * 0.6); y < H - cell; y += cell) {
        for (let x = Math.round(cell * 0.5); x < W - cell; x += cell * 0.9) {
          const px = Math.round((x + cell * 0.3) * dpr), py = Math.round((y + cell * 0.3) * dpr);
          if (alpha[(py * letters.width + px) * 4 + 3] < 200) continue;
          const lit = Math.random() < 0.34;
          wins.push({ x, y, on: lit ? 1 : 0, target: lit ? 1 : 0, warm: Math.random() < 0.72, next: now + 2000 + Math.random() * 14000 });
        }
      }
      draw(now, true);
    };

    const draw = (now: number, force = false) => {
      if (!letters) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // the towers: a faint facade, lighter at the top
      ctx.globalAlpha = 1;
      ctx.drawImage(letters, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, "rgba(239,233,224,0.13)");
      g.addColorStop(1, "rgba(239,233,224,0.03)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.scale(dpr, dpr);
      const w = cell * 0.42, h = cell * 0.5;
      for (const win of wins) {
        if (!reduce && !force && now > win.next) {
          win.target = win.target ? 0 : 1;
          win.next = now + 4000 + Math.random() * 16000;
        }
        win.on += (win.target - win.on) * (reduce ? 1 : 0.08);
        const dx = win.x - mouse.x, dy = win.y - mouse.y;
        const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (cell * 16));
        const a = Math.min(1, win.on * 0.75 + near * 0.9);
        if (a < 0.03) continue;
        ctx.fillStyle = win.warm ? `rgba(240,170,96,${a})` : `rgba(239,233,224,${a * 0.85})`;
        ctx.fillRect(win.x, win.y, w, h);
      }
    };

    const loop = (now: number) => {
      if (!visible) return;
      // a calm city: about 20 frames a second is plenty
      if (now - last > 48) {
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
    const onLeave = () => {
      mouse.x = mouse.y = -1e4;
    };
    if (fine) {
      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
    }
    let rt = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = window.setTimeout(() => { if (wrap.clientWidth !== W) build(); }, 150);
    };
    window.addEventListener("resize", onResize);
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
    <div ref={wrapRef} aria-hidden className="city-wordmark relative w-full select-none">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
