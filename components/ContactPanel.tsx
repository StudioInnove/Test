"use client";

/*
 * What "Book a call" opens: a quiet panel with two ways to start. Book thirty minutes on the calendar, or,
 * for anyone who would rather write, three short questions sent straight to the studio's inbox.
 * It rises out of a light blur over a dimmed, softened page (motion), sits at the bottom on a phone like a
 * sheet, and closes with Escape, the backdrop or the close button. While it is open, the film behind it
 * doesn't hear the wheel, touches or keys.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { content } from "@/lib/content";
import { openCal } from "./BookCall";
import { Words } from "./Words";

const ease = [0.23, 1, 0.32, 1] as const;

export function ContactPanel() {
  const c = content.contact;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "write">("choose");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [when, setWhen] = useState(0);
  const reduce = useReducedMotion() ?? false;
  const panel = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const on = () => {
      back.current = document.activeElement as HTMLElement;
      setMode("choose");
      setState("idle");
      setOpen(true);
    };
    window.addEventListener("contact:open", on);
    return () => window.removeEventListener("contact:open", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("panel-open");
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>("[data-first]")?.focus(), 60);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      // keep the keyboard inside the panel
      if (e.key === "Tab" && panel.current) {
        const f = Array.from(panel.current.querySelectorAll<HTMLElement>("button, input, textarea, a[href]")).filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
      e.stopPropagation();
    };
    window.addEventListener("keydown", key, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", key, true);
      document.documentElement.classList.remove("panel-open");
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    back.current?.focus?.();
  };

  const call = () => {
    setOpen(false);
    setTimeout(openCal, 280);
  };

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      const r = await fetch(content.studio.ideaEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: "A new idea, from the website", idea: f.get("idea"), when: c.when[when], email: f.get("email") }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const rise = reduce ? {} : { initial: { opacity: 0, y: 10, filter: "blur(6px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, transition: { duration: 0.15 } } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="contact"
          className="fixed inset-0 z-[80] flex items-end justify-center md:items-center"
          onWheel={stop}
          onTouchStart={stop}
          onTouchMove={stop}
          onTouchEnd={stop}
          data-lenis-prevent
        >
          <motion.button
            type="button"
            aria-label={c.close}
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 cursor-default bg-[#05070c]/60 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease }}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            className="glass relative w-full max-w-[560px] overflow-y-auto rounded-t-[28px] border border-paper/10 bg-[#0b0e16]/90 px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-7 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)] max-md:max-h-[92svh] md:rounded-[28px] md:px-9 md:pb-9 md:pt-9"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.98, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.985, filter: "blur(6px)", transition: { duration: 0.3, ease } }}
            transition={{ duration: 0.6, ease }}
          >
            <button type="button" onClick={close} aria-label={c.close} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-paper/60 transition-colors hover:bg-paper/[0.06] hover:text-paper md:right-5 md:top-5">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {state === "done" ? (
                <motion.div key="done" {...rise} transition={{ duration: 0.6, ease }} role="status" className="py-6">
                  <p className="kicker">{c.kicker}</p>
                  <h2 className="t-title mt-3"><Words text={c.doneTitle} /></h2>
                  <p className="t-lead mt-4 max-w-[34ch]">{c.doneLine}</p>
                  <button type="button" data-first onClick={close} className="btn btn-primary mt-8">{c.doneButton}</button>
                </motion.div>
              ) : mode === "choose" ? (
                <motion.div key="choose" {...rise} transition={{ duration: 0.6, ease }}>
                  <p className="kicker">{c.kicker}</p>
                  <h2 id="contact-title" className="t-title mt-3 pr-10"><Words text={c.title} /></h2>
                  <div className="mt-8 grid gap-3">
                    <button type="button" data-first onClick={call} className="contact-choice group">
                      <span>
                        <span className="block text-[19px] text-paper">{c.call.title}</span>
                        <span className="mt-1 block text-[15px] text-paper/60">{c.call.line}</span>
                      </span>
                      <Arrow />
                    </button>
                    <button type="button" onClick={() => setMode("write")} className="contact-choice group">
                      <span>
                        <span className="block text-[19px] text-paper">{c.write.title}</span>
                        <span className="mt-1 block text-[15px] text-paper/60">{c.write.line}</span>
                      </span>
                      <Arrow />
                    </button>
                  </div>
                  <p className="mt-6 text-[14px] text-paper/50">{content.studio.replyPromise}</p>
                </motion.div>
              ) : (
                <motion.form key="write" {...rise} transition={{ duration: 0.6, ease }} onSubmit={send}>
                  <button type="button" onClick={() => setMode("choose")} className="kicker -ml-1 inline-flex items-center gap-1.5 rounded-full px-1 hover:text-paper">
                    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><path d="M10 6H2.5M5.5 3l-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {c.back}
                  </button>
                  <h2 id="contact-title" className="t-title mt-3 pr-10"><Words text={c.write.heading} /></h2>

                  <label className="mt-7 block">
                    <span className="t-label block">{c.fields.idea}</span>
                    <textarea data-first name="idea" required rows={3} placeholder={c.fields.ideaHint} className="contact-input mt-2 resize-none" />
                  </label>

                  <fieldset className="mt-6">
                    <legend className="t-label">{c.fields.when}</legend>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {c.when.map((w, i) => (
                        <button key={w} type="button" aria-pressed={when === i} onClick={() => setWhen(i)} className={`rounded-full px-4 py-2 text-[15px] transition-colors duration-300 ${when === i ? "bg-paper text-[#0b0e16]" : "bg-paper/[0.06] text-paper/75 hover:bg-paper/[0.1]"}`}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="mt-6 block">
                    <span className="t-label block">{c.fields.email}</span>
                    <input name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" className="contact-input mt-2" />
                  </label>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button type="submit" disabled={state === "sending"} className="btn btn-primary disabled:opacity-60">{state === "sending" ? c.sending : c.send}</button>
                    {state === "error" && <p role="alert" className="text-[14px] text-[#f4b478]">{c.error} {content.studio.email}</p>}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden className="shrink-0 text-paper/50 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 group-hover:text-paper">
      <path d="M2 6h7.5M6.5 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
