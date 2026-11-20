"use client";

/*
 * Studio Originals: the apps the studio makes for itself.
 *   LaunchTrack  — a fine ruler from idea to launch, lit up to where the build is (after Ananta's
 *                  pre-registration milestones).
 *   WaitlistForm — one glass pill; the button turns into a tick when you're in.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getGsap } from "@/lib/gsap";
import { content } from "@/lib/content";

const ease = [0.23, 1, 0.32, 1] as const;

/* ---------------------------------------------------------------- launch track */

export function LaunchTrack({ size = "md", scrub = false }: { size?: "md" | "lg"; scrub?: boolean }) {
  const { stages, current, statusLabel } = content.originals;
  const ticks = size === "lg" ? 72 : 48;
  const at = current / (stages.length - 1); // 0..1 along the ruler
  const ref = useRef<HTMLDivElement>(null);
  // on a page, the ruler fills as you scroll it into view (GSAP ScrollTrigger); in the film it sweeps in
  useEffect(() => {
    const el = ref.current;
    if (!scrub || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { gsap } = getGsap();
    el.classList.add("launch-scrub");
    const ticksEls = Array.from(el.querySelectorAll<HTMLElement>("[data-tick]"));
    const st = { v: 0 };
    const apply = () => {
      const v = st.v;
      el.style.setProperty("--fill", String(v));
      ticksEls.forEach((t, i) => t.classList.toggle("is-lit", i / ticks <= at * v + 0.0001 && v > 0.01));
    };
    apply();
    const ctx = gsap.context(() => {
      gsap.to(st, { v: 1, ease: "none", onUpdate: apply, scrollTrigger: { trigger: el, start: "top 92%", end: "top 48%", scrub: 0.8 } });
    }, el);
    return () => {
      ctx.revert();
      el.classList.remove("launch-scrub");
    };
  }, [scrub, at, ticks]);
  return (
    <div ref={ref} className="launch" style={{ ["--at" as string]: at }}>
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
                className={`absolute top-0 whitespace-nowrap text-[13px] tracking-[-0.005em] ${i === current ? "text-paper" : i < current ? "text-paper/55" : "text-paper/30"} ${i === 0 ? "" : i === stages.length - 1 ? "-translate-x-full" : "-translate-x-1/2"} ${size === "md" && i !== 0 && i !== current && i !== stages.length - 1 ? "max-sm:hidden" : ""}`}
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
              return <span key={i} data-tick className={`block w-px ${major ? "h-[55%]" : "h-[28%]"} ${lit ? "bg-paper/70" : "bg-white/15"}`} />;
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

/** An email line and a button. Side by side on a computer, stacked on a phone. */
export function WaitlistForm({ source = "home", size = "md", tone = "dark", onJoined }: { source?: string; size?: "md" | "lg"; tone?: "dark" | "light"; onJoined?: () => void }) {
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
      if (r.ok) onJoined?.();
    } catch {
      setState("error");
    }
  }

  const done = state === "done";
  const light = tone === "light";

  return (
    <form onSubmit={submit} className={`w-full ${size === "lg" ? "max-w-[520px]" : "max-w-[440px]"}`}>
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.p
            key="done"
            role="status"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className={`flex h-12 items-center gap-3 border-b text-[16px] ${light ? "border-[#b8662f]/60 text-[#231d1a]" : "border-signal/60"}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="text-signal">
              <motion.path d="M3 8.5l3 3 7-7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease, delay: 0.2 }} />
            </svg>
            {o.success}
          </motion.p>
        ) : (
          <motion.div key="form" exit={{ opacity: 0, transition: { duration: 0.2 } }} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
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
              className={`h-12 min-w-0 flex-1 rounded-none border-b bg-transparent px-0 text-[16px] tracking-[-0.01em] outline-none transition-colors duration-300 ${light ? "border-[#231d1a]/25 text-[#231d1a] placeholder:text-[#231d1a]/45 focus:border-[#231d1a]/70" : "border-paper/25 text-paper placeholder:text-paper/40 focus:border-paper/70"}`}
            />
            <button type="submit" disabled={state === "sending"} className={`btn h-12 shrink-0 max-sm:w-full disabled:opacity-60 ${light ? "bg-[#231d1a] text-[#f6ead9] hover:bg-black" : "btn-primary"}`}>
              {state === "sending" ? "Joining…" : o.cta}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <p className={`mt-3 text-[13px] ${state === "error" ? (light ? "text-[#b5402a]" : "text-signal") : light ? "text-[#231d1a]/50" : "text-paper/40"}`} role={state === "error" ? "alert" : undefined}>
        {state === "error" ? o.error : done ? "\u00a0" : o.privacy}
      </p>
    </form>
  );
}
