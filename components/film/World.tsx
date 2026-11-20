"use client";

/*
 * Stepping into something in a room. The camera has already pushed in; a warm light blooms and you land
 * in a full-screen close-up that is alive. It tells its story in a few short chapters: scroll (or swipe,
 * or use the arrow keys) and the camera glides to the next thing while the words change. The words are
 * set exactly like the film's scenes: a title, one line, and something to do. Scrolling past the last
 * chapter, or "Back to the room", or Esc, takes you back out.
 */
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { asset, content, href } from "@/lib/content";
import { PhoneApps } from "../apps/PhoneApps";
import { BookCall } from "../BookCall";
import { LaunchTrack, WaitlistForm } from "../Originals";
import { WorldClocks } from "../ui/WorldClocks";
import { MaskText } from "../ui/MaskText";
import { PhoneFrame } from "../ui/PhoneFrame";
import { BG, Scenery, usePhone, type Cam } from "./Scenery";
import type { WorldId } from "./timeline";

const ease = [0.23, 1, 0.32, 1] as const;
const film = [0.22, 0.61, 0.36, 1] as const;
const W = content.worlds;

/** Where the camera looks in each chapter. */
const CAMS: Record<WorldId, Cam[]> = {
  web: [{ z: 1, u: 0.5, v: 0.5 }, { z: 1.18, u: 0.72, v: 0.62 }, { z: 1.04, u: 0.72, v: 0.55 }],
  mobile: [{ z: 1, u: 0.5, v: 0.5 }, { z: 1.06, u: 0.6, v: 0.45 }, { z: 1.02, u: 0.5, v: 0.5 }],
  sites: [{ z: 1, u: 0.5, v: 0.45 }, { z: 1.16, u: 0.42, v: 0.3 }, { z: 1, u: 0.5, v: 0.5 }],
  how: [{ z: 1.25, u: 0.15, v: 0.35 }, { z: 1.25, u: 0.36, v: 0.32 }, { z: 1.25, u: 0.58, v: 0.48 }, { z: 1.25, u: 0.92, v: 0.8 }],
  think: [{ z: 1, u: 0.5, v: 0.32 }, { z: 1.08, u: 0.5, v: 0.32 }, { z: 1.16, u: 0.5, v: 0.32 }],
  world: [{ z: 1, u: 0.45, v: 0.32 }, { z: 1.12, u: 0.45, v: 0.32 }],
  originals: [{ z: 1, u: 0.5, v: 0.5 }, { z: 1.1, u: 0.5, v: 0.6 }, { z: 1.04, u: 0.5, v: 0.5 }],
};

/** A different shot for a chapter: it crossfades in over the room and settles slowly. x/y place it in a crop. */
type Shot = { d: string; m?: string; x?: number; y?: number };
const SHOTS: Partial<Record<WorldId, (Shot | null)[]>> = {
  web: [null, null, { d: "/worlds/web-grow-d.webp", m: "/worlds/web-grow-m.webp", x: 38 }],
  mobile: [null, null, { d: "/worlds/mobile-both-d.webp", m: "/worlds/mobile-both-m.webp", x: 64 }],
  sites: [null, null, { d: "/worlds/sites-phone-d.webp", m: "/worlds/sites-phone-m.webp", x: 36 }],
  think: [null, { d: "/worlds/think-designs-d.webp", m: "/worlds/think-designs-m.webp", x: 62 }, { d: "/worlds/think-fast-d.webp", m: "/worlds/think-fast-m.webp", x: 56 }],
  originals: [null, { d: "/worlds/orig-cloth-d.webp", m: "/worlds/orig-cloth-m.webp", x: 62 }, { d: "/worlds/orig-door-d.webp", m: "/worlds/orig-door-m.webp", x: 64 }],
};

/** Words on the right (r) or left (l), per chapter. */
const SIDES: Partial<Record<WorldId, ("l" | "r")[]>> = { web: ["r", "r", "r"], sites: ["r", "r", "r"], how: ["l", "l", "l"] };

/** The process close-up walks along the design wall: one step of the process per stop. */
const WALL = { src: "/worlds/wall-d.webp", aspect: 3800 / 1612, k: 1.32, at: [0.355, 0.61, 0.855] };
function Wall({ chap, phone, right }: { chap: number; phone: boolean; right: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const el = ref.current!;
    const f = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    f();
    const ro = new ResizeObserver(f);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const h = box.h * (phone ? 1.08 : WALL.k);
  const w = h * WALL.aspect;
  // centre this step (a little right of centre on a computer, where the words are not)
  const want = box.w * (phone ? 0.5 : right ? 0.34 : 0.64) - WALL.at[chap] * w;
  const x = Math.min(0, Math.max(box.w - w, want));
  const y = (box.h - h) * (phone ? 0.5 : 0.42);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(WALL.src)}
        alt="Sketches and designs for every screen, pinned along the studio wall"
        className="absolute left-0 top-0 max-w-none will-change-transform"
        style={{ width: w, height: h, transform: `translate3d(${x}px,${y}px,0)`, transition: "transform 1600ms cubic-bezier(0.65,0,0.35,1)" }}
      />
    </div>
  );
}

/** The words of one chapter, arriving like a scene's: the title word by word, then the line, then the rest. */
function Story({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.classList.add("on"), 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={ref} className="reveal stack w-full">
      {children}
    </div>
  );
}
const d = (ms: number) => ({ ["--d" as string]: `${ms}ms` });

export function World({ id, onClose, cue }: { id: WorldId | null; onClose: () => void; cue?: (k: "tap") => void }) {
  const phone = usePhone();
  const [joined, setJoined] = useState(false);
  const [chap, setChap] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastWheel = useRef(0);
  const busyUntil = useRef(0);
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    busyUntil.current = performance.now() + 1100;
    setJoined(false);
    setChap(0);
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 900);
    return () => clearTimeout(t);
  }, [id]);

  // once the Original is out, its room introduces it instead of keeping the secret
  const rv = content.originals.reveal;
  const chapters = !id ? [] : id === "originals" && rv.on ? [{ title: `Meet *${rv.name}.*`, line: rv.line }] : W[id].chapters;
  const last = chapters.length - 1;

  /** Move one chapter on (+1) or back (-1); past either end steps out of the close-up. */
  const step = useCallback(
    (dir: number) => {
      const now = performance.now();
      if (now < busyUntil.current) return;
      busyUntil.current = now + 850;
      const next = chap + dir;
      if (next < 0 || next > last) return onClose();
      setChap(next);
    },
    [chap, last, onClose],
  );

  useEffect(() => {
    if (!id) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); step(1); }
      if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); step(-1); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [id, step]);

  // the floating phone's size: as large as fits
  const [ps, setPs] = useState(0.7);
  useEffect(() => {
    const f = () => setPs(phone ? Math.min(0.5, (window.innerHeight * 0.48) / 874) : Math.min(0.8, (window.innerHeight * 0.72) / 874));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [phone]);

  const bg = id ? BG[id] : null;
  // a form keeps its own scroll and keys; elsewhere (even over a screen) one scroll is one chapter
  const inForm = (t: EventTarget | null) => !!(t as HTMLElement)?.closest?.("form");

  // one fresh scroll = one chapter
  const gesture = useRef({ sum: 0, done: false });
  const onWheel = (e: React.WheelEvent) => {
    const now = performance.now();
    // a pause, or a change of direction, starts a fresh gesture
    if (now - lastWheel.current > 200 || (gesture.current.sum && Math.sign(e.deltaY) !== Math.sign(gesture.current.sum))) gesture.current = { sum: 0, done: false };
    lastWheel.current = now;
    if (inForm(e.target) || gesture.current.done) return;
    gesture.current.sum += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
    if (Math.abs(gesture.current.sum) < 24 || now < busyUntil.current) return;
    gesture.current.done = true;
    step(Math.sign(gesture.current.sum));
  };
  // a mostly-vertical swipe anywhere moves the story on, even over the phone (its apps swipe sideways)
  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = inForm(e.target) ? null : e.touches[0].clientY;
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchY.current === null) return;
    const dy = touchY.current - e.changedTouches[0].clientY;
    const dx = touchX.current - e.changedTouches[0].clientX;
    touchY.current = null;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      busyUntil.current = Math.min(busyUntil.current, performance.now());
      step(Math.sign(dy));
    }
  };

  const actions = (ms: number, link?: { link: string; href: string }) => (
    <div className="rise actions" style={d(ms)}>
      <BookCall>{content.nav.cta}</BookCall>
      {link && <a href={href(link.href)} className="more">{link.link}</a>}
    </div>
  );

  // what each chapter adds under its title and line
  let extra: ReactNode = null;
  if (id && chap === last && id !== "originals") {
    const link = id === "web" || id === "mobile" || id === "sites" ? W[id] : undefined;
    extra = actions(380, link);
  }
  if (id === "world" && chap === 1) extra = (
    <>
      <div className="rise mt-8 w-full" style={d(330)}><WorldClocks /></div>
      {actions(460)}
    </>
  );
  if (id === "originals" && rv.on) extra = (
    <div className="rise actions" style={d(380)}>
      <a href={rv.url} target="_blank" rel="noopener" className="btn btn-primary">{rv.cta}</a>
    </div>
  );
  else if (id === "originals" && chap === 1) extra = <div className="rise mt-8 w-full" style={d(380)}><LaunchTrack /></div>;
  else if (id === "originals" && chap === 2) extra = <div className="rise mt-8 w-full" style={d(380)}><WaitlistForm source="originals-room" onJoined={() => setJoined(true)} /></div>;

  const c = chapters[chap];
  // which side the words sit on, so they never cover the thing the chapter is about
  const right = !phone && (SIDES[id ?? "web"]?.[chap] ?? "l") === "r";
  const line = id === "originals" && chap === 2 && joined ? W.originals.joined : c?.line;

  return (
    <AnimatePresence>
      {id && bg && c && (
        <motion.div
          key={id}
          role="dialog"
          aria-modal="true"
          aria-label={chapters[0].title.replace(/\*/g, "")}
          data-panel
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="world fixed inset-0 z-[55] overflow-hidden bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: film } }}
          transition={{ duration: 0.6, ease: film }}
        >
          {/* the picture: full screen on a computer, the top of the screen on a phone */}
          <div className={`absolute inset-x-0 top-0 ${phone ? "h-[58svh]" : "h-full"}`}>
            {id === "how" ? <Wall chap={chap} phone={phone} right={right} /> : <Scenery bg={bg} phone={phone} interactive glowOn={joined} cam={CAMS[id][chap]} />}
            {/* other shots crossfade in over the room */}
            {SHOTS[id]?.map((sh, i) =>
              sh ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={asset(phone && sh.m ? sh.m : sh.d)}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{
                    objectPosition: `${sh.x ?? 50}% ${sh.y ?? 50}%`,
                    opacity: i === chap ? 1 : 0,
                    transform: i === chap ? "scale(1)" : "scale(1.07)",
                    transition: `opacity 1200ms cubic-bezier(0.65,0,0.35,1), transform ${i === chap ? 2600 : 1200}ms cubic-bezier(0.22,0.61,0.36,1)`,
                  }}
                />
              ) : null,
            )}
            {/* the room dims while the phone has the stage */}
            {id === "mobile" && <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink transition-opacity duration-[1200ms]" style={{ opacity: chap === 1 ? 0.62 : 0 }} />}
            {/* shade where the words sit: the same as the scenes */}
            {phone ? (
              <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(180deg,rgb(7_10_18/0.45)_0%,transparent_20%,transparent_62%,#070a12_100%)]" />
            ) : (
              <>
                <div aria-hidden className="pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] [background:linear-gradient(270deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.7)_22%,transparent_40%)]" style={{ opacity: right ? 1 : 0 }} />
                <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ${id === "originals" ? "[background:linear-gradient(90deg,rgb(7_10_18/0.96)_0%,rgb(7_10_18/0.88)_34%,rgb(7_10_18/0.35)_56%,transparent_72%)]" : "[background:linear-gradient(90deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.6)_36%,transparent_60%)]"}`} style={{ opacity: right ? 0 : 1 }} />
              </>
            )}
          </div>

          {/* the floating phone you can use; it comes forward in the chapter about it */}
          {id === "mobile" && (
            <motion.div
              data-app
              className={`absolute z-10 ${phone ? "left-1/2 top-[max(64px,6svh)]" : "top-1/2"}`}
              style={{ right: phone ? undefined : chap === 1 ? "22vw" : "12vw", transition: "right 1400ms cubic-bezier(0.65,0,0.35,1)", pointerEvents: chap === 2 ? "none" : undefined }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: chap === 2 ? 0 : 1, y: chap === 2 ? 60 : 0, scale: chap === 1 ? 1.1 : 1 }}
              transition={{ duration: 1.3, ease, delay: chap === 0 ? 0.55 : 0 }}
            >
              <div style={{ transform: phone ? `translateX(-50%) scale(${ps})` : `translateY(-50%) scale(${ps})`, transformOrigin: phone ? "top center" : "center right" }}>
                <PhoneFrame>
                  <PhoneApps interactive />
                </PhoneFrame>
              </div>
            </motion.div>
          )}

          {/* the words: placed like a scene's, bottom-left on a computer, below the picture on a phone */}
          <div className={`pointer-events-none relative z-[5] flex h-full flex-col px-[var(--gutter)] ${phone ? `justify-start pt-[calc(58svh+20px)] pb-[max(24px,env(safe-area-inset-bottom))]` : `justify-end pb-[12svh] ${right ? "items-end" : ""}`}`}>
            <div className={`pointer-events-auto flex w-full flex-col ${phone ? "flex-1" : ""} ${right ? "max-w-[400px] mr-[2vw]" : "max-w-[460px]"}`}>
              <Story key={chap}>
                <MaskText className="t-title" text={c.title} play />
                {line && <p className="rise t-lead" style={d(250)}>{line}</p>}
                {extra}
              </Story>
              {/* where you are in the story, and how to go on */}
              <div className={`flex items-center gap-4 ${phone ? "mt-auto pt-6" : "mt-10"}`}>
                <div className="flex items-center">
                  {chapters.map((_, i) => (
                    <button key={i} type="button" aria-label={`Part ${i + 1} of ${chapters.length}`} aria-current={i === chap ? "step" : undefined} onClick={() => { busyUntil.current = 0; setChap(i); }} className="flex h-8 items-center pr-2">
                      <span className={`block h-[2px] rounded-full transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === chap ? "w-8 bg-paper" : "w-3 bg-paper/30"}`} />
                    </button>
                  ))}
                </div>
                <span className={`t-label transition-opacity duration-500 ${chap < last ? "opacity-100" : "opacity-0"}`}>{phone ? "Swipe up to continue" : W.next}</span>
              </div>
            </div>
          </div>

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

          {/* the screen here really works: a quiet invitation, top right, once you've arrived */}
          {((id === "web" && !phone && chap === 0) || (id === "mobile" && chap < 2)) && (
            <motion.p
              key={`try-${id}`}
              initial={{ opacity: 0, y: -6, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, ease, delay: 2.4 }}
              className="pointer-events-none absolute right-[var(--gutter)] top-[max(18px,env(safe-area-inset-top))] z-20 hidden h-11 items-center gap-2.5 text-[14px] text-paper/75 md:top-6 md:flex"
            >
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f4b478]" />
              {W[id === "web" ? "web" : "mobile"].tryHint}
            </motion.p>
          )}

          {/* the warm light you pass through on the way in */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-30 [background:radial-gradient(60%_60%_at_50%_50%,rgb(255_196_130/0.8),rgb(232_161_90/0.4)_45%,rgb(7_10_18/0.85))]" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.3, ease: film }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
