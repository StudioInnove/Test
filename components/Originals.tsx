"use client";

/*
 * Studio Originals: the apps the studio makes for itself.
 *   LaunchTrack  — a fine ruler from idea to launch, lit up to where the build is (after Ananta's
 *                  pre-registration milestones).
 *   WaitlistForm — one glass pill; the button turns into a tick when you're in.
 *   PerkCards    — what joining early gets you.
 *   WarpCarousel — the Originals as cards that bend and lean as you drag through them
 *                  (after the 21st.dev "Warp Carousel", louisstudios).
 */
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { content } from "@/lib/content";

const ease = [0.23, 1, 0.32, 1] as const;

/* ---------------------------------------------------------------- launch track */

export function LaunchTrack({ size = "md" }: { size?: "md" | "lg" }) {
  const { stages, current, statusLabel } = content.originals;
  const ticks = size === "lg" ? 72 : 48;
  const at = current / (stages.length - 1); // 0..1 along the ruler
  return (
    <div className="launch" style={{ ["--at" as string]: at }}>
      <p className="index mb-4">{statusLabel}</p>
      <div className="relative">
        {/* stage names over the ruler */}
        <ol className="relative mb-3 h-4" aria-label={`${statusLabel}: ${stages[current]}`}>
          {stages.map((s, i) => {
            const x = i / (stages.length - 1);
            return (
              <li
                key={s}
                aria-current={i === current ? "step" : undefined}
                className={`absolute top-0 whitespace-nowrap text-[12px] tracking-[-0.005em] ${i === current ? "text-paper" : i < current ? "text-paper/55" : "text-paper/30"} ${i === 0 ? "" : i === stages.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${size === "md" && i !== 0 && i !== current && i !== stages.length - 1 ? "max-sm:hidden" : ""}`}
                style={{ left: `${x * 100}%` }}
              >
                {s}
              </li>
            );
          })}
        </ol>
        {/* the ruler */}
        <div className={`relative ${size === "lg" ? "h-12" : "h-8"} overflow-hidden rounded-[6px] bg-white/[0.04] shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.12)]`}>
          <div aria-hidden className="absolute inset-y-0 left-0 flex w-full items-center justify-between px-2">
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const major = i % (ticks / (stages.length - 1)) === 0;
              const lit = i / ticks <= at;
              return <span key={i} className={`block w-px ${major ? "h-[55%]" : "h-[28%]"} ${lit ? "bg-paper/70" : "bg-white/15"}`} />;
            })}
          </div>
          {/* the lit part sweeps in */}
          <div aria-hidden className="launch-fill absolute inset-y-0 left-0 bg-gradient-to-r from-signal/0 via-signal/10 to-signal/25" />
          <div aria-hidden className="launch-line absolute bottom-0 left-0 h-px bg-gradient-to-r from-signal/20 to-signal" />
          {/* where we are */}
          <div aria-hidden className="launch-mark absolute inset-y-0 w-px bg-signal shadow-[0_0_12px_2px_rgb(232_161_90/0.6)]">
            <span className="absolute -top-px left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-signal" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Kept for older imports. */
export const StatusTrack = LaunchTrack;

/* ---------------------------------------------------------------- waitlist */

export function WaitlistForm({ source = "home", size = "md" }: { source?: string; size?: "md" | "lg" }) {
  const o = content.originals;
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [email, setEmail] = useState("");
  const reduce = useReducedMotion() ?? false;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || state === "sending") return;
    setState("sending");
    try {
      const r = await fetch(content.studio.waitlistEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, list: "Studio Originals waitlist", source }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  const done = state === "done";
  const h = size === "lg" ? "h-[60px]" : "h-[54px]";

  return (
    <form onSubmit={submit} className="w-full max-w-[460px]">
      <motion.div layout={!reduce} transition={{ duration: 0.6, ease }} className={`glass waitlist ${h} flex items-center rounded-full p-[5px] ${done ? "is-done" : ""}`}>
        <AnimatePresence initial={false} mode="popLayout">
          {!done && (
            <motion.div key="field" layout={!reduce} exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.25 } }} className="flex min-w-0 flex-1 items-center">
              <label className="sr-only" htmlFor={`wl-${source}`}>{o.placeholder}</label>
              <input
                id={`wl-${source}`}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder={o.placeholder}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state === "error") setState("idle");
                }}
                className="h-full min-w-0 flex-1 bg-transparent pl-5 pr-3 text-[16px] tracking-[-0.01em] text-paper outline-none placeholder:text-paper/45"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          layout={!reduce}
          type="submit"
          disabled={state === "sending" || done}
          transition={{ duration: 0.6, ease }}
          className={`btn btn-primary relative h-full shrink-0 overflow-hidden !rounded-full !px-5 text-[14px] ${done ? "flex-1 !cursor-default" : ""}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease, delay: 0.15 }} className="flex items-center gap-2.5" role="status">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <motion.path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease, delay: 0.3 }} />
                </svg>
                {o.success}
              </motion.span>
            ) : state === "sending" ? (
              <motion.span key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1" aria-label="Joining">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1 w-1 animate-[dot_1s_ease-in-out_infinite] rounded-full bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.25 }} className="flex items-center gap-2">
                {o.cta}
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="max-sm:hidden">
                  <path d="M2 6h7.5M6.5 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
      <p className={`t-small mt-3 pl-5 ${state === "error" ? "text-signal" : "text-paper/40"}`} role={state === "error" ? "alert" : undefined}>
        {state === "error" ? o.error : done ? " " : o.privacy}
      </p>
    </form>
  );
}

/* ---------------------------------------------------------------- perks */

const PerkIcon = ({ i }: { i: number }) => {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (i === 0)
    return (
      <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
        <circle cx="22" cy="32" r="9" {...common} />
        <path d="M31 32h22M46 32v7M52 32v5" {...common} />
      </svg>
    );
  if (i === 1)
    return (
      <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
        <path d="M12 30l18-18h20v20L32 50z" {...common} />
        <circle cx="42" cy="22" r="3" {...common} />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
      <path d="M12 16h40v26H30l-10 8v-8h-8z" {...common} />
      <path d="M22 27h20M22 33h12" {...common} />
    </svg>
  );
};

export function PerkCards() {
  const { perks } = content.originals;
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {perks.map((p, i) => (
        <li key={p.label} className="rise perk group" style={{ ["--d" as string]: `${200 + i * 120}ms` }}>
          <div className="glass flex h-full flex-col overflow-hidden rounded-[18px]">
            <div className="flex items-center justify-between border-b-[0.5px] border-white/10 px-5 py-3">
              <span className="text-[13px] text-paper/85">{p.label}</span>
              <span className="index">0{i + 1}</span>
            </div>
            <div className="perk-art relative flex h-28 sm:h-36 items-center justify-center text-paper/80">
              <div aria-hidden className="absolute inset-0 [background:radial-gradient(50%_60%_at_50%_55%,rgb(232_161_90/0.16),transparent_70%)] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative transition-transform duration-700 [transition-timing-function:var(--ease-out)] group-hover:-translate-y-1 group-hover:scale-105">
                <PerkIcon i={i} />
              </div>
            </div>
            <div className="px-5 pb-6">
              <p className="t-head text-[20px]">{p.title}</p>
              <p className="t-body mt-2 text-[15px] text-paper/65">{p.line}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- warp carousel */

type Project = (typeof content.originals.projects)[number];

function WarpCard({ p, i, x, skew, step, center }: { p: Project; i: number; x: MotionValue<number>; skew: MotionValue<number>; step: number; center: number }) {
  // how far this card sits from the middle of the view, in cards
  const d = useTransform(x, (v) => (v + i * step + step / 2 - center) / step);
  const rotateY = useTransform(d, [-2, 0, 2], [28, 0, -28]);
  const scale = useTransform(d, [-2, 0, 2], [0.86, 1, 0.86]);
  const z = useTransform(d, (v) => -Math.abs(v) * 90);
  const opacity = useTransform(d, [-2.2, -1, 0, 1, 2.2], [0.25, 0.75, 1, 0.75, 0.25]);
  return (
    <motion.li style={{ rotateY, scale, z, opacity, skewX: skew, width: step - 16 }} className="warp-card mx-2 shrink-0 [transform-style:preserve-3d]">
      <article className={`glass relative flex h-[420px] flex-col overflow-hidden rounded-[22px] ${p.locked ? "is-locked" : ""}`}>
        <header className="flex items-center justify-between px-5 pt-5">
          <span className="index tracking-[0.06em]">{p.code}</span>
          <span className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] ${p.locked ? "bg-white/[0.06] text-paper/55" : "bg-signal/15 text-signal"}`}>
            {!p.locked && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />}
            {p.status}
          </span>
        </header>
        <div className="relative flex flex-1 items-center justify-center">
          {p.locked ? (
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/[0.03] shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.14)]">
              <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden className="text-paper/60">
                <rect x="2" y="13" width="22" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 13V9a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
          ) : (
            <Radar />
          )}
        </div>
        <footer className="px-5 pb-6">
          <p className={`t-head ${p.locked ? "text-paper/60" : ""}`}>{p.name}</p>
          <p className="t-body mt-2 text-[15px] text-paper/60">{p.line}</p>
        </footer>
      </article>
    </motion.li>
  );
}

/** Original 01's emblem: a slow sweep finding the right customers among many. */
function Radar() {
  const dots = [
    [0.28, 0.32, 0], [0.7, 0.26, 1], [0.62, 0.7, 0], [0.36, 0.72, 0], [0.8, 0.52, 0], [0.18, 0.55, 0], [0.5, 0.18, 0], [0.45, 0.45, 1],
  ];
  return (
    <div className="relative h-40 w-40" aria-hidden>
      {[1, 0.66, 0.33].map((r) => (
        <span key={r} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.14)]" style={{ width: `${r * 100}%`, height: `${r * 100}%` }} />
      ))}
      <span className="absolute inset-0 animate-[spin_5s_linear_infinite] rounded-full [background:conic-gradient(from_0deg,rgb(232_161_90/0.35),transparent_22%)]" />
      {dots.map(([x, y, hit], k) => (
        <span
          key={k}
          className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${hit ? "bg-signal shadow-[0_0_10px_2px_rgb(232_161_90/0.6)]" : "bg-paper/35"}`}
          style={{ left: `${x * 100}%`, top: `${y * 100}%`, animation: hit ? `pulse 2.4s ease-in-out ${k * 0.4}s infinite` : undefined }}
        />
      ))}
    </div>
  );
}

export function WarpCarousel() {
  const { projects } = content.originals;
  const viewRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;
  const [geo, setGeo] = useState({ step: 340, center: 600, min: -1000 });
  const x = useMotionValue(0);
  const v = useVelocity(x);
  // dragging fast leans the cards, like they're being pulled through the air
  const skewRaw = useTransform(v, [-2400, 0, 2400], reduce ? [0, 0, 0] : [9, 0, -9]);
  const skew = useSpring(skewRaw, { stiffness: 260, damping: 26 });

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const step = Math.min(360, Math.max(270, w * 0.78));
      const center = w / 2;
      // start with the first card in the middle
      const start = center - step / 2;
      const end = center - (projects.length - 0.5) * step;
      setGeo({ step, center, min: end });
      x.set(start);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [projects.length, x]);

  const max = geo.center - geo.step / 2;

  return (
    <div ref={viewRef} className="relative overflow-hidden py-6 [perspective:1400px]">
      <motion.ul
        drag="x"
        style={{ x }}
        dragConstraints={{ left: geo.min, right: max }}
        dragElastic={0.12}
        dragTransition={{
          power: 0.35,
          timeConstant: 260,
          // always come to rest with a card in the middle
          modifyTarget: (t) => Math.round((t - max) / geo.step) * geo.step + max,
        }}
        className="flex cursor-grab touch-pan-y active:cursor-grabbing [transform-style:preserve-3d]"
        aria-label="Studio Originals"
      >
        {projects.map((p, i) => (
          <WarpCard key={p.code} p={p} i={i} x={x} skew={skew} step={geo.step} center={geo.center} />
        ))}
      </motion.ul>
      <p className="t-small mt-6 text-center text-paper/35 md:hidden">Swipe to see more</p>
    </div>
  );
}
