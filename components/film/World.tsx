"use client";

/*
 * Stepping into something in a room. The camera has already pushed in; a warm light blooms and you land
 * in a full-screen close-up that is alive. The words are set exactly like the film's scenes (title, lead,
 * actions) and arrive the same way. "Back to the room", Esc or a fresh scroll takes you back out.
 */
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { content, href } from "@/lib/content";
import { PhoneApps } from "../apps/PhoneApps";
import { BookCall } from "../BookCall";
import { LaunchTrack, WaitlistForm } from "../Originals";
import { WorldClocks } from "../ui/WorldClocks";
import { Words } from "../Words";
import { BG, Scenery, usePhone } from "./Scenery";
import type { WorldId } from "./timeline";

const ease = [0.23, 1, 0.32, 1] as const;
const film = [0.22, 0.61, 0.36, 1] as const;

/** The words of a close-up, arriving like a scene's: the title word by word, then each block rising in turn. */
function Story({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.classList.add("on"), 450);
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastWheel = useRef(0);
  const opened = useRef(0);

  useEffect(() => {
    if (!id) return;
    opened.current = performance.now();
    setJoined(false);
    const t = window.setTimeout(() => closeRef.current?.focus({ preventScroll: true }), 900);
    return () => clearTimeout(t);
  }, [id]);

  // the floating phone's size: as large as fits
  const [ps, setPs] = useState(0.7);
  useEffect(() => {
    const f = () => setPs(phone ? Math.min(0.52, (window.innerHeight * 0.46) / 844) : Math.min(0.8, (window.innerHeight * 0.74) / 844));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [phone]);

  const W = content.worlds;
  const bg = id ? BG[id] : null;

  // a fresh scroll (not the tail of the one that brought you here) steps back out
  const onWheel = (e: React.WheelEvent) => {
    const now = performance.now();
    const fresh = now - lastWheel.current > 220;
    lastWheel.current = now;
    if (phone || (e.target as HTMLElement).closest("[data-app], form")) return;
    if (fresh && now - opened.current > 900 && Math.abs(e.deltaY) > 4) onClose();
  };

  const actions = (ms: number, link?: { link: string; href: string }) => (
    <div className="rise actions" style={d(ms)}>
      <BookCall>{content.nav.cta}</BookCall>
      {link && <a href={href(link.href)} className="more">{link.link}</a>}
    </div>
  );

  let body: ReactNode = null;
  const right = id === "web" && !phone;
  if (id === "web" || id === "mobile") {
    const w = W[id];
    body = (
      <Story>
        <h2 className="t-title"><Words text={w.title} /></h2>
        <p className="rise t-lead" style={d(250)}>{w.lines.join(" ")}</p>
        {actions(380, w)}
      </Story>
    );
  } else if (id === "how") {
    body = (
      <Story>
        <h2 className="t-title"><Words text={W.how.title} /></h2>
        <p className="rise t-lead" style={d(250)}>{W.how.line}</p>
        <ol className="rise mt-8 w-full border-t border-paper/15" style={d(380)}>
          {content.how.steps.map((s) => (
            <li key={s.title} className="grid grid-cols-[92px_1fr] gap-4 border-b border-paper/15 py-4">
              <span className="t-body !text-paper">{s.title}</span>
              <span className="t-body">{s.line}</span>
            </li>
          ))}
        </ol>
        {actions(500, W.how)}
      </Story>
    );
  } else if (id === "think") {
    body = (
      <Story>
        <h2 className="t-title"><Words text={W.think.title} /></h2>
        <ul className="rise mt-8 w-full border-t border-paper/15" style={d(250)}>
          {W.think.lines.map((l) => (
            <li key={l} className="t-lead border-b border-paper/15 py-4">{l}</li>
          ))}
        </ul>
        {actions(380)}
      </Story>
    );
  } else if (id === "world") {
    body = (
      <Story>
        <h2 className="t-title"><Words text={W.world.title} /></h2>
        <p className="rise t-lead" style={d(250)}>{W.world.line}</p>
        <div className="rise mt-8 w-full" style={d(380)}><WorldClocks /></div>
        {actions(500)}
      </Story>
    );
  } else if (id === "originals") {
    body = (
      <Story>
        <h2 className="t-title"><Words text={W.originals.title} /></h2>
        <p className="rise t-lead" style={d(250)}>{joined ? W.originals.joined : W.originals.line}</p>
        <div className="rise mt-8 w-full" style={d(380)}><LaunchTrack /></div>
        <div className="rise mt-8 w-full" style={d(500)}><WaitlistForm source="originals-room" onJoined={() => setJoined(true)} /></div>
      </Story>
    );
  }

  return (
    <AnimatePresence>
      {id && bg && (
        <motion.div
          key={id}
          role="dialog"
          aria-modal="true"
          aria-label={W[id].title}
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
            <Scenery bg={bg} phone={phone} interactive glowOn={joined} />
            {/* shade where the words sit: the same as the scenes */}
            <div aria-hidden className={`pointer-events-none absolute inset-0 ${phone ? "[background:linear-gradient(180deg,rgb(7_10_18/0.45)_0%,transparent_20%,transparent_62%,#070a12_100%)]" : right ? "[background:linear-gradient(270deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.7)_22%,transparent_38%)]" : id === "originals" ? "[background:linear-gradient(90deg,rgb(7_10_18/0.96)_0%,rgb(7_10_18/0.88)_34%,rgb(7_10_18/0.35)_56%,transparent_72%)]" : "[background:linear-gradient(90deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.6)_36%,transparent_60%)]"}`} />
          </div>

          {/* the floating phone you can use */}
          {id === "mobile" && (
            <motion.div data-app className={`absolute z-10 ${phone ? "left-1/2 top-[max(64px,6svh)]" : "right-[12vw] top-1/2"}`} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease, delay: 0.55 }}>
              <div
                className="overflow-hidden rounded-[52px] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.8),0_0_0_10px_#15161b,0_0_0_11px_rgb(255_255_255/0.12)]"
                style={{ transform: phone ? `translateX(-50%) scale(${ps})` : `translateY(-50%) scale(${ps})`, transformOrigin: phone ? "top center" : "center right" }}
              >
                <PhoneApps interactive />
              </div>
            </motion.div>
          )}

          {/* the words: placed like a scene's, bottom-left on a computer, below the picture on a phone */}
          <div
            className={`pointer-events-none relative z-[5] flex h-full flex-col overflow-y-auto overscroll-contain px-[var(--gutter)] max-md:pointer-events-auto ${
              phone ? `pb-[max(32px,env(safe-area-inset-bottom))] ${id === "mobile" ? "pt-[58svh]" : "pt-[48svh]"}` : `justify-end pb-[12svh] ${right ? "items-end" : ""}`
            }`}
          >
            <div className={`pointer-events-auto w-full ${right ? "max-w-[400px] mr-[2vw]" : "max-w-[460px]"}`}>{body}</div>
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

          {/* the warm light you pass through on the way in */}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-30 [background:radial-gradient(60%_60%_at_50%_50%,rgb(255_196_130/0.8),rgb(232_161_90/0.4)_45%,rgb(7_10_18/0.85))]" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.3, ease: film }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
