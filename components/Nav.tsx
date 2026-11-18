"use client";

/*
 * Floating glass navigation with a morphing pill.
 * Adapted from "Floating Glassmorphic Navbar with Morphing Pill Indicator" (21st.dev, themeocean),
 * restyled for Studio Innové.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { content } from "@/lib/content";
import { BookCall } from "./BookCall";

const SPRING = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

export function Nav() {
  const { links, cta } = content.nav;
  const [hovered, setHovered] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const reduce = useReducedMotion() ?? false;
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

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
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <motion.div
        ref={rootRef}
        initial={reduce ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28, delay: 0.2 }}
        className="pointer-events-auto relative w-full max-w-[560px] md:w-auto md:max-w-none"
      >
        <nav
          aria-label="Main"
          className={`relative flex items-center justify-between gap-2 rounded-full py-1.5 pl-4 pr-1.5 transition-[background-color,box-shadow] duration-300 md:gap-6 ${
            solid ? "bg-black/45" : "bg-black/25"
          }`}
          style={{
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.16), inset 0 0 0 1px rgb(255 255 255 / 0.1), 0 20px 40px -20px rgb(0 0 0 / 0.55)",
          }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <Link href="/" aria-label="Studio Innové, home" className="flex items-center rounded-full py-1 outline-none focus-visible:ring-2 focus-visible:ring-amber">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/wordmark.png" alt="Studio Innové" width={67} height={28} className="h-7 w-auto select-none" draggable={false} />
          </Link>

          <ul className="hidden items-center gap-0.5 md:flex" onPointerLeave={() => setHovered(null)}>
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(l.href)}
                  onFocus={() => setHovered(l.href)}
                  onBlur={() => setHovered(null)}
                  className={`relative isolate flex items-center rounded-full px-4 py-2 text-[14px] font-medium outline-none transition-colors duration-200 ${
                    hovered === l.href ? "text-paper" : "text-paper/70"
                  }`}
                >
                  {hovered === l.href && (
                    <motion.span layoutId={`pill-${id}`} aria-hidden transition={reduce ? { duration: 0 } : SPRING} className="absolute inset-0 -z-10 rounded-full bg-white/12" />
                  )}
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <BookCall size="sm" arrow={false} className="hidden md:inline-flex">
            {cta}
          </BookCall>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-paper outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber md:hidden"
          >
            <span aria-hidden className="relative block h-3 w-5">
              <span className={`absolute left-0 block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0.5"}`} />
              <span className={`absolute left-0 block h-[1.5px] w-5 rounded-full bg-current transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={reduce ? { duration: 0.12 } : SPRING}
              style={{ transformOrigin: "top center", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)" }}
              className="absolute inset-x-0 top-full mt-2 rounded-[28px] bg-black/60 p-2 shadow-2xl ring-1 ring-white/10 md:hidden"
            >
              <ul className="flex flex-col">
                {links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3.5 text-[17px] font-medium text-paper/90 active:bg-white/10">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="p-1 pt-2">
                <BookCall className="w-full" onOpen={() => setOpen(false)}>
                  {cta}
                </BookCall>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
