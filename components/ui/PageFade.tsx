"use client";

import { useEffect } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";

/**
 * Moving between pages: a dark curtain rises over the page (with the studio's mark showing for a moment),
 * the next page opens underneath it, and the curtain lifts away upwards (GSAP). It makes the site feel like
 * one continuous place. Links to sections on the same page, other sites and mail are left alone.
 */
export function PageFade() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    const { gsap } = getGsap();
    const make = () => {
      const c = document.createElement("div");
      c.className = "page-curtain";
      c.setAttribute("aria-hidden", "true");
      const img = document.createElement("img");
      img.src = asset("/brand/logo.svg");
      img.alt = "";
      c.appendChild(img);
      document.body.appendChild(c);
      return c;
    };

    // arriving: the curtain lifts
    if (root.classList.contains("curtain-in")) {
      const c = make();
      root.classList.remove("curtain-in");
      if (reduce) c.remove();
      else
        gsap.fromTo(c, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.0, ease: "power3.inOut", delay: 0.12, onComplete: () => c.remove() });
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
      const img = c.querySelector("img");
      gsap.timeline({
        onComplete: () => {
          try { sessionStorage.setItem("si-curtain", "1"); } catch {}
          location.href = url.href;
        },
      })
        .fromTo(c, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "power3.inOut" })
        .to(img, { opacity: 0.85, duration: 0.35, ease: "power2.out" }, "-=0.25");
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
