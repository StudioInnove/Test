"use client";

/*
 * Liquid-glass navigation.
 * A floating glass capsule. A soft "drop" of light sits behind the section you're in, and glides,
 * stretching on the way, to whichever link you point at — then settles back.
 * Inspired by the 21st.dev "Liquid Glass Navbar" (gughigug), rebuilt in CSS and Motion for our palette.
 * On phones: the capsule holds the logo, the call button and a menu that opens to a full-screen glass sheet.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { asset, content, href } from "@/lib/content";
import { BookCall } from "./BookCall";
import { FloorPlan } from "./FloorPlan";

const SCENE_LINK: Record<string, string> = {
  services: "/#services",
  web: "/#services",
  mobile: "/#services",
  how: "/#how",
  originals: "/#originals",
  faq: "/#faq",
};

const spring = { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.9 } as const;

export function Nav() {
  const { links, cta } = content.nav;
  const { studio } = content;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [scene, setScene] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [inWorld, setInWorld] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);

  // where are we? the film tells us; other pages go by their address
  useEffect(() => {
    const onScene = (e: Event) => {
      const k = String((e as CustomEvent).detail);
      setActive(SCENE_LINK[k] ?? null);
      setCompact(k !== "hero");
      setScene(k);
    };
    window.addEventListener("film:scene", onScene);
    // stepping into a room: the navigation steps aside
    const onWorld = (e: Event) => {
      setInWorld(Boolean((e as CustomEvent).detail));
      setOpen(false);
      setMapOpen(false);
    };
    window.addEventListener("film:world", onWorld);
    const onScroll = () => {
      if (!document.querySelector("[data-scene]")) setCompact(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("film:scene", onScene);
      window.removeEventListener("film:world", onWorld);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open && !mapOpen) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setMapOpen(false);
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, mapOpen]);

  const lit = active;

  return (
    <header className={`nav-shade pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-[max(14px,env(safe-area-inset-top))] transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-out)] max-md:px-[var(--gutter)] md:px-3 md:pt-5 ${inWorld ? "-translate-y-3 opacity-0 [&_*]:!pointer-events-none" : ""}`}>
      <motion.div
        ref={rootRef}
        initial={reduce ? false : { opacity: 0, y: -12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1], delay: 0.5 }}
        className="pointer-events-auto relative w-full md:w-auto"
      >
        <nav
          aria-label="Main"
          data-compact={compact}
          className="nav-bar glass glass-pill flex h-11 items-center gap-2 transition-[background-color] duration-700 [transition-timing-function:var(--ease-out)] md:rounded-full md:pl-5 md:pr-[5px] md:h-12"
        >
          <a href={href("/")} aria-label={`${studio.name}, home`} className="link mr-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt={studio.name} width={64} height={25} className="h-[22px] w-auto select-none" draggable={false} />
          </a>
          <ul className="hidden items-center md:flex">
            {links.map((l) => {
              const on = lit === l.href;
              return (
                <li key={l.href} className="relative">
                  {on && (
                    <motion.span
                      layoutId="nav-drop"
                      aria-hidden
                      className="glass-drop absolute inset-0 rounded-full"
                      transition={reduce ? { duration: 0 } : spring}
                    />
                  )}
                  <a
                    href={href(l.href)}
                    aria-current={active === l.href ? "true" : undefined}
                    className={`relative block rounded-full px-3.5 py-[7px] text-[14px] transition-colors duration-500 ${on ? "text-paper" : "text-paper/60 hover:text-paper"}`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="ml-auto flex items-center gap-1 md:ml-3">
            <button type="button" onClick={() => setMapOpen(true)} aria-expanded={mapOpen} className="map-btn mr-1 hidden h-8 items-center gap-2 rounded-full px-3 text-[14px] text-paper/70 transition-colors duration-300 hover:text-paper md:flex">
              <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="1.5" y="2.5" width="11" height="9" rx="1" /><path d="M6 2.5v5.5M6 8h6.5" /></svg>
              {content.map.label}
            </button>
            <BookCall size="sm" className="max-md:hidden">{cta}</BookCall>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="menu-sheet"
              className="-mr-2 flex h-11 items-center gap-2.5 px-2 text-[14px] text-paper active:opacity-60 md:hidden"
            >
              <span className="relative block h-4 overflow-hidden">
                <span className={`block transition-transform duration-500 [transition-timing-function:var(--ease-out)] ${open ? "-translate-y-4" : ""}`}>Menu</span>
                <span className={`absolute left-0 top-4 block transition-transform duration-500 [transition-timing-function:var(--ease-out)] ${open ? "-translate-y-4" : ""}`}>Close</span>
              </span>
            </button>
          </div>
        </nav>
      </motion.div>

      {/* Phone menu: a full-screen sheet of glass */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto fixed inset-0 -z-10 flex flex-col justify-between bg-ink/70 px-[var(--gutter)] pb-[max(28px,env(safe-area-inset-bottom))] pt-28 backdrop-blur-2xl md:hidden"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div>
            <ul>
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.06 + i * 0.05 }}
                  className="border-b-[0.5px] border-white/10"
                >
                  <a href={href(l.href)} onClick={() => setOpen(false)} className="t-title flex items-baseline gap-5 py-4 active:opacity-60">
                    <span className="t-label w-6">0{i + 1}</span>
                    <span className={active === l.href ? "text-paper" : "text-paper/80"}>{l.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }} className="menu-map mt-6">
              <FloorPlan current={scene} compact onPick={() => setOpen(false)} />
            </motion.div>
            </div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
              className="space-y-6"
            >
              <BookCall className="!h-12 w-full !rounded-full text-[15px]" onOpen={() => setOpen(false)}>{cta}</BookCall>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[14px] text-paper/60">
                <span className="select-all">{studio.email}</span>
                <span className="flex gap-5">
                  <a href={studio.linkedin} target="_blank" rel="noopener" className="link">LinkedIn</a>
                  <a href={studio.youtube} target="_blank" rel="noopener" className="link">YouTube</a>
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop map: the plan of the studio over a dimmed page */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Map of the studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto fixed inset-0 z-[70] hidden items-center justify-center bg-ink/80 backdrop-blur-xl md:flex"
            onClick={(e) => e.target === e.currentTarget && setMapOpen(false)}
          >
            <motion.div initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.05 }} className="w-[min(760px,80vw)]">
              <div className="mb-8 flex items-end justify-between">
                <p className="t-title">The studio</p>
                <button type="button" onClick={() => setMapOpen(false)} className="more">Close</button>
              </div>
              <FloorPlan current={scene} onPick={() => setMapOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
