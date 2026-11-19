"use client";

/*
 * Stepping into something in a room. The camera has already pushed in; here a warm light blooms, and you
 * land in a full-screen close-up that is alive: the screen in it works, the words arrive one by one like
 * a story, and "Back to the room" (or Esc, or a scroll) takes you back out.
 */
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { asset, content, href } from "@/lib/content";
import { coverPoint, quadMatrix } from "@/lib/quad";
import { Dashboard, DASH_SIZE } from "../apps/Dashboard";
import { PhoneApps, PHONE_SIZE } from "../apps/PhoneApps";
import { BookCall } from "../BookCall";
import { WaitlistForm } from "../Originals";
import { WorldClocks } from "../ui/WorldClocks";
import type { Quad, WorldId } from "./timeline";

const ease = [0.23, 1, 0.32, 1] as const;
const film = [0.22, 0.61, 0.36, 1] as const;

type Bg = {
  d: string;
  m: string;
  /** natural size of the desktop picture */
  iw: number;
  ih: number;
  /** the phone picture is a 3:4 crop starting at mx0 (share of the full width), mw wide */
  mx0: number;
  mw: number;
  /** object-position on desktop */
  fy: number;
  /** desktop: the picture is drawn this much wider than the screen, pushed left, to make room on the right */
  shift?: number;
  /** a still from the film, zoomed in on a point (u, v) */
  zoom?: { s: number; u: number; v: number };
  screen?: { app: "dash" | "orig"; quad: Quad };
  dim?: number;
};

const BG: Record<WorldId, Bg> = {
  web: { d: "/worlds/web-d.webp", m: "/worlds/web-m.webp", iw: 2400, ih: 1792, mx0: 0.2079, mw: 0.56, fy: 0.62, shift: 0.16, screen: { app: "dash", quad: [[0.2583, 0.4234], [0.7184, 0.4404], [0.7184, 0.748], [0.2593, 0.8104]] } },
  mobile: { d: "/worlds/mobile-d.webp", m: "/worlds/mobile-m.webp", iw: 2400, ih: 1792, mx0: 0.14, mw: 0.56, fy: 0.5, dim: 0.35 },
  how: { d: "/worlds/how-d.webp", m: "/worlds/how-m.webp", iw: 2400, ih: 1792, mx0: 0.22, mw: 0.56, fy: 0.45 },
  originals: { d: "/worlds/originals-d.webp", m: "/worlds/originals-m.webp", iw: 2400, ih: 1340, mx0: 0.2906, mw: 0.4185, fy: 0.5, screen: { app: "orig", quad: [[0.2232, 0.2484], [0.792, 0.2484], [0.792, 0.7977], [0.2232, 0.7977]] } },
  think: { d: "/film/stills/s3-d.webp", m: "/film/stills/s3-m.webp", iw: 3200, ih: 1786, mx0: 0.2975, mw: 0.405, fy: 0.3, zoom: { s: 1.9, u: 0.5, v: 0.3 }, dim: 0.45 },
  world: { d: "/film/stills/s4-d.webp", m: "/film/stills/s4-m.webp", iw: 3200, ih: 1786, mx0: 0.4375, mw: 0.405, fy: 0.3, zoom: { s: 1.7, u: 0.45, v: 0.32 }, dim: 0.5 },
};

function usePhone() {
  const [phone, setPhone] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const f = () => setPhone(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return phone;
}

/** A line of the story: arrives after the one before it. */
const Line = ({ i, children, className = "", base = 0.75 }: { i: number; children: ReactNode; className?: string; base?: number }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: base + i * 0.32 }} className={className}>
    {children}
  </motion.div>
);

/** What the Originals monitor shows: the teaser and the list, set on the glowing screen itself. */
function OriginalsScreen({ onJoined, joined }: { onJoined: () => void; joined: boolean }) {
  const o = content.originals;
  const w = content.worlds.originals;
  const at = o.current / (o.stages.length - 1);
  return (
    <div className="relative flex h-full w-full flex-col justify-center px-[110px] text-[#231d1a]" style={{ background: "linear-gradient(110deg,rgb(250_238_224/0.86),rgb(248_226_204/0.8))" }}>
      <Line i={1} base={1}><p className="mt-3 max-w-[15ch] text-[76px] font-[320] leading-[1.02] tracking-[-0.04em]">{w.title}</p></Line>
      <Line i={2} base={1}><p className="mt-6 max-w-[40ch] text-[24px] leading-[1.45] text-[#231d1a]/70">{joined ? w.joined : w.line}</p></Line>
      <Line i={3} base={1} className="mt-10">
        <div className="flex justify-between text-[18px]">
          {o.stages.map((s, i) => (
            <span key={s} className={i === o.current ? "text-[#231d1a]" : "text-[#231d1a]/40"}>{s}</span>
          ))}
        </div>
        <div className="mt-3 h-[6px] rounded-full bg-[#231d1a]/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#5b3a2a] to-[#e8903f]" initial={{ width: 0 }} animate={{ width: `${at * 100}%` }} transition={{ duration: 1.8, ease: film, delay: 2.2 }} />
        </div>
      </Line>
      <Line i={4} base={1} className="mt-10 origin-left scale-[1.35]">
        <WaitlistForm source="originals-room" tone="light" onJoined={onJoined} />
      </Line>
    </div>
  );
}

function Stage({ id, bg, phone, joined, onJoined, parallax }: { id: WorldId; bg: Bg; phone: boolean; joined: boolean; onJoined: () => void; parallax: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const moveRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current!;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // a slow drift with the cursor, the room and its screen together
  useEffect(() => {
    if (!parallax) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const tick = () => {
      x += (tx - x) * 0.04;
      y += (ty - y) * 0.04;
      if (moveRef.current) moveRef.current.style.transform = `translate3d(${(-x * 14).toFixed(2)}px, ${(-y * 10).toFixed(2)}px, 0) scale(1.03)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [parallax]);

  const shift = phone ? 0 : bg.shift ?? 0;
  // the picture as drawn: phones use the 3:4 crop
  const iw = phone ? 1080 : bg.iw, ih = phone ? 1440 : bg.ih;
  const toBox = (u: number, v: number): [number, number] => {
    if (!box) return [0, 0];
    const uu = phone ? (u - bg.mx0) / bg.mw : u;
    return coverPoint(uu, v, iw, ih, box.w, box.h, 0.5, phone ? 0.5 : bg.fy);
  };
  const z = bg.zoom;
  const origin = z ? toBox(z.u, z.v) : null;

  let screen: ReactNode = null;
  if (bg.screen && box) {
    const size = bg.screen.app === "dash" ? DASH_SIZE : { w: 1200, h: 647 };
    const m = quadMatrix(size.w, size.h, bg.screen.quad.map(([u, v]) => toBox(u, v)));
    const showOrig = bg.screen.app === "orig" && !phone;
    screen = (
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: size.w, height: size.h, transform: m }}>
        {bg.screen.app === "dash" ? (
          <motion.div className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.5 }} data-app>
            <Dashboard interactive={!phone} />
            <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(115deg,rgb(255_255_255/0.08),transparent_40%)]" />
          </motion.div>
        ) : showOrig ? (
          <motion.div className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.6 }} data-app>
            <OriginalsScreen onJoined={onJoined} joined={joined} />
          </motion.div>
        ) : null}
        {bg.screen.app === "orig" && <div aria-hidden className={`pointer-events-none absolute -inset-[8%] rounded-[40px] transition-opacity duration-[1600ms] [background:radial-gradient(closest-side,rgb(255_196_130/0.45),transparent)] ${joined ? "opacity-100" : "opacity-0"}`} />}
      </div>
    );
  }

  return (
    <div ref={boxRef} className="absolute inset-y-0 overflow-hidden" style={{ left: `${-shift * 100}%`, width: `${(1 + shift) * 100}%` }}>
      <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, transition: { duration: 0.45 } }} transition={{ duration: 1.5, ease: film }}>
        <div ref={moveRef} className="absolute inset-0 will-change-transform" style={{ transform: parallax ? "scale(1.03)" : undefined }}>
          <div className="absolute inset-0" style={z && origin ? { transform: `scale(${z.s})`, transformOrigin: `${origin[0]}px ${origin[1]}px`, filter: "blur(1.5px)" } : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(phone ? bg.m : bg.d)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `50% ${phone ? 50 : bg.fy * 100}%` }} />
          </div>
          {screen}
        </div>
      </motion.div>
      {bg.dim ? <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: bg.dim }} /> : null}
      <span className="sr-only">{id}</span>
    </div>
  );
}

export function World({ id, onClose, cue }: { id: WorldId | null; onClose: () => void; cue?: (k: "tap") => void }) {
  const phone = usePhone();
  const [joined, setJoined] = useState(false);
  const [fine, setFine] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastWheel = useRef(0);
  const opened = useRef(0);

  useEffect(() => {
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);
  useEffect(() => {
    if (!id) return;
    opened.current = performance.now();
    setJoined(false);
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 900);
    return () => clearTimeout(t);
  }, [id]);

  const W = content.worlds;
  const bg = id ? BG[id] : null;
  // the floating phone's size: as large as fits
  const [ps, setPs] = useState(0.7);
  useEffect(() => {
    const f = () => setPs(phone ? Math.min(0.52, (window.innerHeight * 0.46) / 844) : Math.min(0.86, (window.innerHeight * 0.78) / 844));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [phone]);

  // a fresh scroll (not the tail of the one that brought you here) steps back out
  const onWheel = (e: React.WheelEvent) => {
    const now = performance.now();
    const fresh = now - lastWheel.current > 220;
    lastWheel.current = now;
    if ((e.target as HTMLElement).closest("[data-app]")) return;
    if (fresh && now - opened.current > 900 && Math.abs(e.deltaY) > 4) onClose();
  };

  const actions = (link?: { link: string; href: string }) => (
    <div className="actions">
      <BookCall>{content.nav.cta}</BookCall>
      {link && <a href={href(link.href)} className="more">{link.link}</a>}
    </div>
  );

  let body: ReactNode = null;
  let layout: "left" | "right" | "center" | "screen" = "left";
  if (id === "web") {
    layout = "right";
    body = (
      <>
        <Line i={0}><h2 className="t-title">{W.web.title}</h2></Line>
        {W.web.lines.map((l, i) => <Line key={l} i={i + 1}><p className={`t-lead mt-4 ${i === 2 ? "!text-paper" : ""}`}>{l}</p></Line>)}
        <Line i={4} className="mt-8">{actions(W.web)}</Line>
      </>
    );
  } else if (id === "mobile") {
    body = (
      <>
        <Line i={0}><h2 className="t-title">{W.mobile.title}</h2></Line>
        {W.mobile.lines.map((l, i) => <Line key={l} i={i + 1}><p className={`t-lead mt-4 ${i === 2 ? "!text-paper" : ""}`}>{l}</p></Line>)}
        <Line i={4} className="mt-8">{actions(W.mobile)}</Line>
      </>
    );
  } else if (id === "how") {
    body = (
      <>
        <Line i={0}><h2 className="t-title">{W.how.title}</h2></Line>
        <Line i={1}><p className="t-lead mt-4">{W.how.line}</p></Line>
        <ol className="mt-8 border-t border-paper/15">
          {content.how.steps.map((s, i) => (
            <motion.li key={s.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.85 + (i + 2) * 0.32 }} className="grid grid-cols-[88px_1fr] gap-4 border-b border-paper/15 py-4">
              <span className="text-[17px] text-paper">{s.title}</span>
              <span className="t-body">{s.line}</span>
            </motion.li>
          ))}
        </ol>
        <Line i={6} base={0.85} className="mt-8">{actions(W.how)}</Line>
      </>
    );
  } else if (id === "think") {
    layout = "center";
    body = (
      <>
        <Line i={0}><h2 className="t-title text-paper/60">{W.think.title}</h2></Line>
        <div className="mt-8 space-y-3">
          {W.think.lines.map((l, i) => <Line key={l} i={i + 1} base={0.9}><p className="t-display">{l}</p></Line>)}
        </div>
        <Line i={5} base={0.9} className="mt-12 flex justify-center">{actions()}</Line>
      </>
    );
  } else if (id === "world") {
    layout = "center";
    body = (
      <>
        <Line i={0}><h2 className="t-display">{W.world.title}</h2></Line>
        <Line i={1}><p className="t-lead mx-auto mt-5 max-w-[42ch]">{W.world.line}</p></Line>
        <Line i={2} className="mt-12"><WorldClocks size="lg" className="mx-auto max-w-[760px] text-left" /></Line>
        <Line i={3} className="mt-12 flex justify-center">{actions()}</Line>
      </>
    );
  } else if (id === "originals") {
    layout = phone ? "left" : "screen";
    body = phone ? (
      <>
        <Line i={0}><h2 className="t-title">{W.originals.title}</h2></Line>
        <Line i={1}><p className="t-lead mt-4">{joined ? W.originals.joined : W.originals.line}</p></Line>
        <Line i={2} className="mt-8 w-full"><WaitlistForm source="originals-room" onJoined={() => setJoined(true)} /></Line>
      </>
    ) : null;
  }

  return (
    <AnimatePresence>
      {id && bg && (
        <motion.div
          key={id}
          role="dialog"
          aria-modal="true"
          aria-label={id === "web" ? W.web.title : id === "mobile" ? W.mobile.title : id === "how" ? W.how.title : id === "think" ? W.think.title : id === "world" ? W.world.title : W.originals.title}
          data-panel
          onWheel={onWheel}
          className="world fixed inset-0 z-[55] overflow-hidden bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: film } }}
          transition={{ duration: 0.6, ease: film }}
        >
          {/* the picture: full screen on a computer, the top of the screen on a phone */}
          <div className={`absolute inset-x-0 top-0 ${phone ? "h-[56svh]" : "h-full"}`}>
            <Stage id={id} bg={bg} phone={phone} joined={joined} onJoined={() => setJoined(true)} parallax={fine} />
            {/* shade where the words sit */}
            <div aria-hidden className={`pointer-events-none absolute inset-0 ${phone ? "[background:linear-gradient(180deg,rgb(7_10_18/0.5)_0%,transparent_22%,transparent_60%,#070a12_100%)]" : layout === "right" ? "[background:linear-gradient(270deg,rgb(7_10_18/0.94)_0%,rgb(7_10_18/0.75)_22%,transparent_36%)]" : layout === "center" ? "[background:radial-gradient(70%_70%_at_50%_50%,rgb(7_10_18/0.55),rgb(7_10_18/0.25))]" : layout === "screen" ? "[background:linear-gradient(0deg,rgb(7_10_18/0.5),transparent_25%)]" : "[background:linear-gradient(90deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.7)_32%,transparent_58%)]"}`} />
          </div>

          {/* the floating phone you can use */}
          {id === "mobile" && (
            <motion.div
              data-app
              className={`absolute z-10 ${phone ? "left-1/2 top-[max(64px,6svh)]" : "right-[12vw] top-1/2"}`}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.2, ease, delay: 0.55 }}
            >
              <div
                className="overflow-hidden rounded-[52px] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.8),0_0_0_10px_#15161b,0_0_0_11px_rgb(255_255_255/0.12)]"
                style={{ transform: phone ? `translateX(-50%) scale(${ps})` : `translateY(-50%) scale(${ps})`, transformOrigin: phone ? "top center" : "center right" }}
              >
                <PhoneApps interactive />
              </div>
            </motion.div>
          )}

          {/* the words */}
          {body && (
            <div
              className={`relative z-[5] flex h-full flex-col overflow-y-auto overscroll-contain px-[var(--gutter)] ${
                phone
                  ? `pb-[max(32px,env(safe-area-inset-bottom))] ${id === "mobile" ? "pt-[60svh]" : "pt-[50svh]"}`
                  : layout === "center"
                    ? "items-center justify-center text-center"
                    : layout === "right"
                      ? "items-end justify-center"
                      : "justify-center"
              }`}
            >
              <div className={`${layout === "center" && !phone ? "max-w-[900px]" : "max-w-[460px]"} ${layout === "right" && !phone ? "w-[min(460px,30vw)] mr-[2vw]" : ""}`}>{body}</div>
            </div>
          )}

          {/* back to the room */}
          <motion.button
            ref={closeRef}
            type="button"
            onClick={() => {
              cue?.("tap");
              onClose();
            }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.5 }}
            className="more world-back absolute left-[var(--gutter)] top-[max(18px,env(safe-area-inset-top))] z-20 h-11 md:top-6"
          >
            {W.back}
          </motion.button>

          {/* the warm light you pass through on the way in */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-30 [background:radial-gradient(60%_60%_at_50%_50%,rgb(255_196_130/0.9),rgb(232_161_90/0.5)_45%,rgb(7_10_18/0.85))]" initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 1.3, ease: film }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
