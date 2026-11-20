"use client";

/*
 * The display in the websites room: a finished website in a quiet browser window, filling the screen edge to
 * edge. Someone is browsing: the pointer drifts to a link, presses it, and the next of the studio's sites
 * opens. It takes turns between the three demo sites. Driven by its own clock (requestAnimationFrame).
 */
import { useEffect, useRef } from "react";
import { asset } from "@/lib/content";

const W = 1200, H = 720;
/** each page, and the link the pointer goes for (in screen pixels) */
const PAGES = [
  { image: "/sites/screen-brand.webp", to: [1046, 640] },
  { image: "/sites/screen-shop.webp", to: [770, 410] },
  { image: "/sites/screen-landing.webp", to: [524, 424] },
] as const;
/** one page's turn, in seconds */
const TURN = 7;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function SiteScreen() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const pages = Array.from(root.querySelectorAll<HTMLElement>("[data-page]"));
    const cursor = root.querySelector<HTMLElement>("[data-cursor]")!;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cursor.style.opacity = "0";
      return;
    }
    let raf = 0, last = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now - last < 33) return;
      last = now;
      const t = Math.max(0, now - t0) / 1000;
      const turn = Math.floor(t / TURN);
      const i = turn % PAGES.length;
      const k = t - turn * TURN;
      // the page: the next one opens a moment after the press
      const swap = clamp((k - 5.05) / 0.55);
      pages.forEach((p, j) => {
        const on = j === i ? 1 : j === (i + 1) % PAGES.length ? swap : 0;
        p.style.opacity = String(j === i ? 1 : on);
        p.style.zIndex = j === i ? "1" : on > 0 ? "2" : "0";
      });
      // the pointer: rests where the last press was, glides to this page's link, presses it
      const from = PAGES[(i + PAGES.length - 1) % PAGES.length].to;
      const to = PAGES[i].to;
      const m = io(clamp((k - 1.6) / 2.6));
      const arc = Math.sin(m * Math.PI) * 26;
      const x = from[0] + (to[0] - from[0]) * m + arc * 0.4;
      const y = from[1] + (to[1] - from[1]) * m - arc;
      const press = k > 4.55 && k < 4.8 ? 0.86 : 1;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${press})`;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} aria-hidden className="relative overflow-hidden" style={{ width: W, height: H, background: "#1c1e26" }}>
      {PAGES.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.image} data-page src={asset(p.image)} alt="" draggable={false} className="absolute inset-0 h-full w-full" style={{ opacity: i === 0 ? 1 : 0 }} />
      ))}
      <svg data-cursor width="22" height="30" viewBox="0 0 22 30" className="absolute left-0 top-0 z-10 origin-top-left" style={{ transform: `translate3d(${PAGES[2].to[0]}px, ${PAGES[2].to[1]}px, 0)`, filter: "drop-shadow(0 2px 3px rgb(0 0 0 / 0.35))" }}>
        <path d="M2 2 L2 23 L7.4 18.2 L11 26.4 L14.6 24.8 L11.1 16.8 L18.4 16.6 Z" fill="#111" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export const SITE_SIZE = { w: W, h: H };
