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

const SCENE_LINK: Record<string, string> = {
  services: "/#services",
  web: "/#services",
  mobile: "/#services",
  how: "/#how",
  originals: "/#originals",
  faq: "/#faq",
};

const spring = { type: "spring", bounce: 0.28, duration: 0.55 } as const;

export function Nav() {
  const { links, cta } = content.nav;
  const { studio } = content;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);

  // where are we? the film tells us; other pages go by their address
  useEffect(() => {
    const onScene = (e: Event) => {
      const k = String((e as CustomEvent).detail);
      setActive(SCENE_LINK[k] ?? null);
      setCompact(k !== "hero");
    };
    window.addEventListener("film:scene", onScene);
    const onScroll = () => {
      if (!document.querySelector("[data-scene]")) setCompact(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("film:scene", onScene);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);

  const lit = hover ?? active;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] sm:pt-5">
      <motion.div
        ref={rootRef}
        initial={reduce ? false : { opacity: 0, y: -12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1], delay: 0.5 }}
        className="pointer-events-auto relative w-full max-w-[560px] md:w-auto md:max-w-none"
      >
        <nav
          aria-label="Main"
          data-compact={compact}
          className="glass glass-pill flex items-center gap-2 rounded-full pl-5 pr-[5px] transition-[height,background-color] duration-500 [transition-timing-function:var(--ease-out)] data-[compact=true]:h-[46px] data-[compact=false]:h-[50px]"
        >
          <a href={href("/")} aria-label={`${studio.name}, home`} className="link mr-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt={studio.name} width={64} height={25} className="h-[22px] w-auto select-none" draggable={false} />
          </a>
          <ul className="hidden items-center md:flex" onPointerLeave={() => setHover(null)}>
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
                    onPointerEnter={() => setHover(l.href)}
                    aria-current={active === l.href ? "true" : undefined}
                    className={`relative block rounded-full px-3.5 py-[7px] text-[14px] transition-colors duration-300 ${on ? "text-paper" : "text-paper/65 hover:text-paper"}`}
                  >
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="ml-auto flex items-center gap-1 md:ml-3">
            <BookCall size="sm" className="!rounded-full !px-4">{cta}</BookCall>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="menu-sheet"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-paper active:scale-95 md:hidden"
            >
              <span aria-hidden className="relative block h-2.5 w-4">
                <span className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-300 ${open ? "top-[5px] rotate-45" : "top-0.5"}`} />
                <span className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-300 ${open ? "top-[5px] -rotate-45" : "top-2"}`} />
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
            <ul>
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.06 + i * 0.05 }}
                  className="border-b-[0.5px] border-white/10"
                >
                  <a href={href(l.href)} onClick={() => setOpen(false)} className="flex items-baseline gap-5 py-4 text-[34px] font-[320] tracking-[-0.03em] active:opacity-60">
                    <span className="index w-6">0{i + 1}</span>
                    <span className={active === l.href ? "text-paper" : "text-paper/80"}>{l.label}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
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
    </header>
  );
}
