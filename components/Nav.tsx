"use client";

/*
 * Floating navigation: one compact translucent bar, logo, four destinations, a small call button.
 * Structure adapted from the 21st.dev "Floating Glassmorphic Navbar" (themeocean), restyled.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { asset, content, href } from "@/lib/content";
import { BookCall } from "./BookCall";

const glass = {
  background: "rgba(175,175,175,0.1)",
  backdropFilter: "blur(20px) saturate(140%)",
  WebkitBackdropFilter: "blur(20px) saturate(140%)",
} as const;

export function Nav() {
  const { links, cta } = content.nav;
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const down = (e: PointerEvent) => rootRef.current && !rootRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", down);
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-6">
      <motion.div
        ref={rootRef}
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1], delay: 0.4 }}
        className="pointer-events-auto relative w-full max-w-[560px] md:w-auto md:max-w-none"
      >
        <nav aria-label="Main" className="flex h-[44px] items-center gap-7 rounded-[10px] pl-4 pr-[5px]" style={glass}>
          <a href={href("/")} aria-label="Studio Innové, home" className="link shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/brand/logo.svg")} alt="Studio Innové" width={64} height={25} className="h-[22px] w-auto select-none" draggable={false} />
          </a>
          <ul className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={href(l.href)} className="link text-[14px] text-paper/75 hover:text-paper">{l.label}</a>
              </li>
            ))}
          </ul>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <BookCall size="sm">{cta}</BookCall>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[7px] text-paper md:hidden"
            >
              <span aria-hidden className="relative block h-2.5 w-4">
                <span className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-300 ${open ? "top-[5px] rotate-45" : "top-0.5"}`} />
                <span className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-300 ${open ? "top-[5px] -rotate-45" : "top-2"}`} />
              </span>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              style={{ ...glass, background: "rgba(20,20,22,0.72)" }}
              className="absolute inset-x-0 top-full mt-1.5 rounded-[10px] p-2 md:hidden"
            >
              <ul>
                {links.map((l, i) => (
                  <li key={l.href}>
                    <a href={href(l.href)} onClick={() => setOpen(false)} className="flex items-baseline gap-4 rounded-[7px] px-3 py-3 text-[20px]">
                      <span className="index">0{i + 1}</span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
