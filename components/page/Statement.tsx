"use client";

/*
 * A large statement read at your pace. The section holds still while you scroll; the words come up one
 * after another, each rising a touch as it lights, and small rounded photographs of the studio open up
 * inside the sentence as you reach them (the photos-in-the-text idea after the 21st.dev "ImgText Reveal
 * Scroll Animation" by ajith66310). Everything is scrubbed by GSAP ScrollTrigger, so it follows the scroll
 * exactly. Words in *asterisks* are set in the italic accent; [/path.webp] places a photograph.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Piece = { kind: "w"; t: string; a: boolean } | { kind: "img"; src: string };

export function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLParagraphElement>(null);
  const pieces = useMemo<Piece[]>(
    () =>
      text.split(/\s+/).filter(Boolean).map((raw) =>
        /^\[[^\]]+\][.,;:!?]?$/.test(raw) ? { kind: "img", src: raw.slice(1, raw.lastIndexOf("]")) } : { kind: "w", t: raw.replace(/\*/g, ""), a: /^\*.*\*[.,!?—]?$/.test(raw) },
      ),
    [text],
  );

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current, box = boxRef.current;
    if (!root || !box) return;
    const els = Array.from(box.querySelectorAll<HTMLElement>("[data-p]"));
    const n = els.length;
    const state = { p: 0 };
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const apply = () => {
      // a soft front moves through the sentence; each piece takes about three words' worth to arrive
      const front = state.p * (n + 3);
      els.forEach((el, i) => {
        const k = ease(Math.max(0, Math.min(1, (front - i) / 3)));
        if (el.dataset.p === "img") {
          el.style.width = `${k * 1.7}em`;
          el.style.opacity = String(k);
          const img = el.firstElementChild as HTMLElement | null;
          if (img) img.style.transform = `scale(${1.25 - k * 0.25})`;
        } else {
          el.style.opacity = String(0.13 + k * 0.87);
          el.style.transform = `translate3d(0, ${(1 - k) * 0.28}em, 0)`;
        }
      });
    };
    apply();
    const ctx = gsap.context(() => {
      gsap.to(state, { p: 1, ease: "none", onUpdate: apply, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.6 } });
    }, root);
    return () => ctx.revert();
  }, [pieces]);

  return (
    <section ref={ref} className="relative" style={{ height: "230svh" }}>
      <div className="sticky top-0 flex h-[100svh] items-center px-[var(--gutter)]">
        <p ref={boxRef} className="statement-text max-w-[19ch]" aria-label={text.replace(/\*|\[[^\]]*\]\s?/g, "")}>
          {pieces.map((pc, i) =>
            pc.kind === "img" ? (
              <span key={i} data-p="img" aria-hidden className="statement-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(pc.src)} alt="" loading="lazy" />
              </span>
            ) : (
              <span key={i} data-p="w" aria-hidden className={`inline-block ${pc.a ? "accent" : ""}`} style={{ opacity: 0.13 }}>
                {pc.t}
              </span>
            ),
          ).flatMap((el, i) => (i < pieces.length - 1 ? [el, " "] : [el]))}
        </p>
      </div>
    </section>
  );
}
