"use client";

import { useEffect } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { runHaze } from "@/lib/haze";

/**
 * Moving between pages: a curtain of the studio's dark shader rises over the page; the studio's mark comes
 * into focus with a fine line drawing out beneath it while the next page opens underneath, then the
 * curtain lifts away upwards (GSAP). It makes the site feel like one continuous place. Links to sections
 * on the same page, other sites and mail are left alone.
 */
export function PageFade() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const { gsap } = getGsap();
    let stopHaze: (() => void) | null = null;
    const make = () => {
      const c = document.createElement("div");
      c.className = "page-curtain";
      c.setAttribute("aria-hidden", "true");
      const cv = document.createElement("canvas");
      const mark = document.createElement("div");
      mark.className = "page-curtain-mark";
      const img = document.createElement("img");
      img.src = asset("/brand/logo.svg");
      img.alt = "";
      const ln = document.createElement("span");
      mark.append(img, ln);
      c.append(cv, mark);
      document.body.appendChild(c);
      if (!reduce) stopHaze = runHaze(cv);
      return c;
    };
    const done = (c: HTMLElement) => {
      stopHaze?.();
      stopHaze = null;
      c.remove();
    };

    // arriving: the curtain lifts
    if (root.classList.contains("curtain-in")) {
      const c = make();
      root.classList.remove("curtain-in");
      if (reduce) done(c);
      else {
        const img = c.querySelector("img"), ln = c.querySelector(".page-curtain-mark span");
        gsap.set(img, { opacity: 0.85 });
        gsap.set(ln, { scaleX: 1 });
        gsap.timeline({ onComplete: () => done(c) })
          .to([img, ln], { opacity: 0, duration: 0.45, ease: "power2.in", delay: 0.25 })
          .fromTo(c, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "power3.inOut" }, "-=0.15");
      }
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const raw = a.getAttribute("href") || "";
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      if (reduce) return void (location.href = url.href);
      // leaving: the curtain rises from the bottom, the mark appears, then the next page opens
      const c = make();
      const img = c.querySelector("img"), ln = c.querySelector(".page-curtain-mark span");
      gsap.timeline({
        onComplete: () => {
          try { sessionStorage.setItem("si-curtain", "1"); } catch {}
          location.href = url.href;
        },
      })
        .fromTo(c, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "power3.inOut" })
        .fromTo(img, { opacity: 0, filter: "blur(10px)", y: 6 }, { opacity: 0.85, filter: "blur(0px)", y: 0, duration: 0.7, ease: "power2.out" }, "-=0.3")
        .fromTo(ln, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.inOut" }, "-=0.45");
    };
    // coming back with the browser's back button: no curtain left behind
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) document.querySelectorAll(".page-curtain").forEach((n) => n.remove());
    };
    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);
  return null;
}
