"use client";

/*
 * The three ways in, under "We design and build websites and apps". When the scene arrives, a hairline draws
 * out from the centre; each room's little line drawing (a browser, a phone, a page) sketches itself and its
 * name rises letter by letter out of the line, one room after another; then the line gathers back into the
 * middle and is gone, leaving just the three. Pointing at one rolls its letters over (GSAP throughout).
 */
import { useEffect, useRef } from "react";
import { getGsap } from "@/lib/gsap";

type Room = { key: string; title: string; onGo: () => void };

const ICONS: Record<string, string[]> = {
  // a browser window
  web: ["M2.5 5.5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2z", "M2.5 8.5h19", "M5.5 6h.01M8 6h.01", "M6 12h6M6 15h9"],
  // a phone
  mobile: ["M7 2.5h10a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2z", "M10 5h4", "M8.5 9.5h7v5h-7z", "M10.5 18.5h3"],
  // a page with its layout
  sites: ["M4 3.5h16v17H4z", "M4 7.5h16", "M7 11h10v4H7z", "M7 17.5h4M13 17.5h4"],
};

export function ServiceRooms({ rooms }: { rooms: Room[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const scene = root.closest(".reveal");
    if (!scene) return;
    const { gsap } = getGsap();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const line = root.querySelector<HTMLElement>("[data-line]")!;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-room]"));
    const paths = items.map((it) => Array.from(it.querySelectorAll<SVGPathElement>("path")));
    const chars = items.map((it) => Array.from(it.querySelectorAll<HTMLElement>("[data-ch]")));
    const dots = Array.from(root.querySelectorAll<HTMLElement>("[data-dot]"));
    paths.flat().forEach((p) => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = `${L}`;
      p.style.strokeDashoffset = `${L}`;
    });
    const hide = () => {
      gsap.set(line, { scaleX: 0, opacity: 0 });
      gsap.set(chars.flat(), { yPercent: 110, rotateX: -70, opacity: 0 });
      gsap.set(dots, { scale: 0, opacity: 0 });
      paths.flat().forEach((p) => gsap.set(p, { strokeDashoffset: p.getTotalLength() }));
      gsap.set(items, { opacity: 1 });
    };
    hide();

    let tl: gsap.core.Timeline | null = null;
    const play = () => {
      tl?.kill();
      hide();
      if (reduce) {
        gsap.set(chars.flat(), { yPercent: 0, rotateX: 0, opacity: 1 });
        gsap.set(dots, { scale: 1, opacity: 1 });
        paths.flat().forEach((p) => gsap.set(p, { strokeDashoffset: 0 }));
        return;
      }
      tl = gsap.timeline({ delay: 2.1 });
      tl.to(line, { scaleX: 1, opacity: 1, duration: 1.1, ease: "power3.inOut" });
      items.forEach((_, i) => {
        const at = 0.55 + i * 0.32;
        tl!.to(paths[i], { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.12 }, at);
        tl!.to(chars[i], { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.028 }, at + 0.25);
        if (dots[i - 1]) tl!.to(dots[i - 1], { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(3)" }, at + 0.1);
      });
      // the line gathers back into the middle and is gone
      tl.to(line, { scaleX: 0, opacity: 0, duration: 1.2, ease: "power3.inOut" }, "-=0.5");
    };
    const leave = () => {
      tl?.kill();
      tl = null;
      gsap.to(items, { opacity: 0, duration: 0.3, ease: "power1.out", onComplete: hide });
      gsap.to(line, { opacity: 0, duration: 0.3 });
    };
    let on = scene.classList.contains("on");
    if (on) play();
    const mo = new MutationObserver(() => {
      const now = scene.classList.contains("on");
      if (now === on) return;
      on = now;
      if (on) play();
      else leave();
    });
    mo.observe(scene, { attributes: true, attributeFilter: ["class"] });

    // pointing at a room rolls its letters over, and redraws its little picture
    const offs: (() => void)[] = [];
    if (!reduce && matchMedia("(hover: hover)").matches) {
      items.forEach((it, i) => {
        const rolls = Array.from(it.querySelectorAll<HTMLElement>("[data-roll]"));
        const enter = () => {
          gsap.to(rolls, { yPercent: -50, duration: 0.55, ease: "power3.out", stagger: 0.018, overwrite: true });
          gsap.fromTo(paths[i], { strokeDashoffset: (k: number, p: SVGPathElement) => p.getTotalLength() }, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out", stagger: 0.06, overwrite: true });
        };
        const out = () => gsap.to(rolls, { yPercent: 0, duration: 0.55, ease: "power3.out", stagger: 0.012, overwrite: true });
        it.addEventListener("pointerenter", enter);
        it.addEventListener("pointerleave", out);
        offs.push(() => {
          it.removeEventListener("pointerenter", enter);
          it.removeEventListener("pointerleave", out);
        });
      });
    }
    return () => {
      mo.disconnect();
      tl?.kill();
      offs.forEach((f) => f());
    };
  }, []);

  return (
    <div ref={ref} className="svc-rooms relative mt-10 md:mt-14">
      <span data-line aria-hidden className="pointer-events-none absolute left-[-6%] right-[-6%] top-1/2 h-px origin-center bg-[linear-gradient(90deg,transparent,rgb(239_233_224/0.45),transparent)]" style={{ transform: "scaleX(0)", opacity: 0 }} />
      <div className="relative flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
        {rooms.map((r, i) => (
          <div key={r.key} className="flex items-center gap-x-9">
            {i > 0 && <span data-dot aria-hidden className="h-1 w-1 rounded-full bg-paper/35" style={{ transform: "scale(0)", opacity: 0 }} />}
            <button data-room type="button" onClick={r.onGo} className="svc-room2 group flex items-center gap-3">
              <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-paper/60 transition-colors duration-500 group-hover:text-[#f4b478]">
                {ICONS[r.key].map((d) => <path key={d} d={d} />)}
              </svg>
              <span className="relative inline-flex h-[1.25em] overflow-hidden leading-[1.25em] [perspective:600px]" aria-label={r.title}>
                {Array.from(r.title).map((c, k) => (
                  <span key={k} data-ch aria-hidden className="inline-block h-[1.25em] will-change-transform" style={{ transformOrigin: "50% 100%" }}>
                    <span data-roll className="flex flex-col">
                      <span className="block h-[1.25em]">{c === " " ? " " : c}</span>
                      <span className="block h-[1.25em] text-paper">{c === " " ? " " : c}</span>
                    </span>
                  </span>
                ))}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
