"use client";

/*
 * Studio Originals: the apps the studio makes for itself.
 *   LaunchTrack  — a fine ruler from idea to launch, lit up to where the build is (after Ananta's
 *                  pre-registration milestones).
 *   WaitlistForm — one glass pill; the button turns into a tick when you're in.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type FormEvent } from "react";
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
