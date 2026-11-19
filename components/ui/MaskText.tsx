"use client";

/*
 * Headlines that surface slowly, line after line, from a soft blur: nothing slides or wipes, it simply
 * comes into focus a moment after you arrive. Words wrapped in *asterisks* are set in the italic serif
 * accent; lines are measured after the fonts load; it plays when it scrolls into view (or when `play`
 * turns on, inside the close-ups). No mask, so italics are never cropped.
 */
import { useLayoutEffect, useMemo, useRef, useState, type ElementType } from "react";

type Word = { text: string; accent: boolean };

function words(text: string): Word[] {
  return text.split(/\s+/).filter(Boolean).map((raw) => ({ text: raw.replace(/\*/g, ""), accent: /^\*.*\*[.,!?]?$/.test(raw) }));
}

export function MaskText({ text, as: Tag = "h2", className = "", delay = 0, play, stagger = 160 }: { text: string; as?: ElementType; className?: string; delay?: number; play?: boolean; stagger?: number }) {
  const ref = useRef<HTMLElement>(null);
  const ws = useMemo(() => words(text), [text]);
  const [lines, setLines] = useState<number[][] | null>(null);
  const [seen, setSeen] = useState(false);
  // a frame after the lines are laid out, so the rise always plays
  const [armed, setArmed] = useState(false);
  useLayoutEffect(() => {
    if (!lines) return setArmed(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setArmed(true)));
    return () => cancelAnimationFrame(id);
  }, [lines]);
  const on = (play ?? seen) && armed;

  // group the words into the lines the browser actually lays them out on
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      const spans = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
      const groups: number[][] = [];
      let top = -1e9;
      spans.forEach((s, i) => {
        const t = s.offsetTop;
        if (t > top + 2) {
          groups.push([]);
          top = t;
        }
        groups[groups.length - 1].push(i);
      });
      setLines((old) => (JSON.stringify(old) === JSON.stringify(groups) ? old : groups));
    };
    // measure on a flat copy of the words first
    setLines(null);
    requestAnimationFrame(measure);
    document.fonts?.ready.then(() => requestAnimationFrame(measure));
    // re-measure only when the width changes (the height changes as lines settle)
    let w = (el.parentElement ?? el).clientWidth;
    const ro = new ResizeObserver(() => {
      const nw = (el.parentElement ?? el).clientWidth;
      if (Math.abs(nw - w) < 1) return;
      w = nw;
      setLines(null);
      requestAnimationFrame(measure);
    });
    ro.observe(el.parentElement ?? el);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [text]);

  // play once it comes into view (unless told when to play)
  useLayoutEffect(() => {
    if (play !== undefined || !ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [play]);

  const word = (w: Word, i: number, last: boolean) => (
    <span key={i} data-w className={`inline-block ${w.accent ? "accent" : ""}`}>
      {w.text}
      {last ? "" : " "}
    </span>
  );

  return (
    <Tag ref={ref} className={`${className} mask-text`} aria-label={text.replace(/\*/g, "")}>
      {!lines ? (
        <span aria-hidden className="invisible">{ws.map((w, i) => word(w, i, i === ws.length - 1))}</span>
      ) : (
        lines.map((g, li) => (
          <span key={li} aria-hidden className={`soft-line ${on ? "on" : ""}`} style={{ transitionDelay: on ? `${250 + delay + li * stagger}ms` : "0ms" }}>
            {g.map((i) => word(ws[i], i, i === ws.length - 1))}
          </span>
        ))
      )}
    </Tag>
  );
}
