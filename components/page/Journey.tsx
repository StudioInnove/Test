"use client";

/*
 * From idea to launch, as a walk along the studio's design wall (after Era Residence's sideways chapters).
 * The section stays put while the wall slides by. The wall is drawn on a canvas, one frame at a time, from
 * a single decoded picture: a very wide image moved as a page layer gets painted in tiles, and on a fast
 * scroll some tiles arrive late and the picture blinks. A canvas can't do that.
 * GSAP ScrollTrigger scrubs the walk with a little smoothing. One caption at a time, like an exhibition
 * label: a word in the italic serif (first, then, next, finally), a title, a line. A fine thread, pinned
 * from one group of sketches to the next, is drawn along the wall as you walk.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { asset } from "@/lib/content";
import { Words } from "../Words";

type Step = { title: string; line: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Where the thread runs on the wall (a share of its height); it sags a little between pins. */
const THREAD_Y = 0.255;

/** Points along the thread, in wall coordinates (0..1 across, px down), sampled evenly enough to draw part of it. */
function threadPoints(at: number[], h: number) {
  const pts: [number, number][] = [];
  const y = h * THREAD_Y, sag = h * 0.05;
  for (let i = 1; i < at.length; i++) {
    const x0 = at[i - 1], x1 = at[i];
    for (let k = i === 1 ? 0 : 1; k <= 60; k++) {
      const t = k / 60;
      // a cubic with both handles pulled down: a soft catenary
      const mt = 1 - t;
      const bx = mt * mt * mt * x0 + 3 * mt * mt * t * (x0 + (x1 - x0) * 0.3) + 3 * mt * t * t * (x0 + (x1 - x0) * 0.7) + t * t * t * x1;
      const by = mt * mt * mt * y + 3 * mt * mt * t * (y + sag) + 3 * mt * t * t * (y + sag) + t * t * t * y;
      pts.push([bx, by]);
    }
  }
  return pts;
}

export function Journey({ heading, steps, titles, order, image, aspect, at }: { heading: string; steps: Step[]; titles?: string[]; order?: string[]; image: string; aspect: number; at: number[] }) {
  const ref = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);

  useIso(() => {
    const { gsap } = getGsap();
    const sec = ref.current, box = boxRef.current, canvas = canvasRef.current;
    if (!sec || !box || !canvas) return;
    const ctx2 = canvas.getContext("2d");
    if (!ctx2) return;
    const img = new Image();
    img.decoding = "async";
    img.src = asset(image);
    let ready = false;
    const state = { p: 0 };
    let size = { w: 0, h: 0, dpr: 1 };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size = { w: box.clientWidth, h: box.clientHeight, dpr };
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
      draw();
    };

    const draw = () => {
      const { w, h, dpr } = size;
      if (!w || !h) return;
      const c = ctx2;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = "#070a12";
      c.fillRect(0, 0, w, h);
      if (!ready) return;
      // the wall is as tall as the view (cropped if the view is unusually wide) and slides across it
      const trackW = Math.max(w * 1.6, h * aspect);
      const trackH = trackW / aspect;
      const ty = (h - trackH) / 2;
      const x = -state.p * (trackW - w);
      // only the part of the picture that is in view
      const k = img.naturalWidth / trackW;
      const sx = Math.max(0, -x * k), sw = Math.min(img.naturalWidth - sx, w * k);
      const sy = Math.max(0, -ty * k), sh = Math.min(img.naturalHeight - sy, h * k);
      c.drawImage(img, sx, sy, sw, sh, 0, Math.max(0, ty), sw / k, sh / k);

      // the thread, drawn a little ahead of you so it reaches each group as you do
      const pts = threadPoints(at, trackH);
      const n = Math.max(2, Math.floor(pts.length * Math.min(1, state.p * 1.04 + 0.01)));
      c.save();
      c.translate(x, ty);
      c.shadowColor = "rgba(0,0,0,0.45)";
      c.shadowBlur = 3;
      c.shadowOffsetY = 2;
      c.strokeStyle = "rgba(239,233,224,0.72)";
      c.lineWidth = 1.4;
      c.lineCap = "round";
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const [px, py] = pts[i];
        if (i === 0) c.moveTo(px * trackW, py);
        else c.lineTo(px * trackW, py);
      }
      c.stroke();
      // a pin where the thread is fixed, once the thread has reached it
      c.fillStyle = "rgba(239,233,224,0.95)";
      at.forEach((a, i) => {
        const reach = i / (at.length - 1);
        if (state.p * 1.04 + 0.01 < reach - 0.001) return;
        c.beginPath();
        c.arc(a * trackW, trackH * THREAD_Y, 4, 0, Math.PI * 2);
        c.fill();
      });
      c.restore();
    };

    img.decode?.().catch(() => {}).finally(() => { ready = img.complete && img.naturalWidth > 0; draw(); });
    img.onload = () => { ready = true; draw(); };

    const ro = new ResizeObserver(resize);
    ro.observe(box);
    resize();

    let last = 0;
    const ctx = gsap.context(() => {
      gsap.to(state, {
        p: 1,
        ease: "none",
        onUpdate: draw,
        scrollTrigger: {
          trigger: sec,
          start: "top top",
          // held in place by GSAP's own pin (not CSS sticky) while you walk the wall
          end: () => "+=" + window.innerHeight * 3.2,
          pin: true,
          refreshPriority: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          scrub: 0.6,
          onUpdate: (st) => {
            // which step you're on, with a little give so it never flickers between two
            const f = st.progress * (steps.length - 1);
            const near = Math.round(f);
            if (near !== last && Math.abs(f - last) > 0.62) {
              last = near;
              setActive(near);
            }
          },
        },
      });
    }, sec);
    return () => {
      ctx.revert();
      ro.disconnect();
    };
  }, [aspect, steps.length, image]);

  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden bg-ink" aria-label={heading.replace(/\*/g, "")}>
      <div ref={boxRef} className="absolute inset-0 overflow-hidden bg-ink">
        <canvas ref={canvasRef} role="img" aria-label="Sketches and designs for every screen, pinned along the studio wall" className="absolute inset-0 h-full w-full" />
        <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(0deg,rgb(7_10_18/0.94)_0%,rgb(7_10_18/0.55)_30%,transparent_55%),linear-gradient(180deg,rgb(7_10_18/0.6)_0%,transparent_26%)]" />

        {/* the heading stays */}
        <div className="absolute left-[var(--gutter)] top-[max(104px,14svh)]">
          <h2 className="t-title"><Words text={heading} /></h2>
        </div>

        {/* one caption at a time */}
        <div className="absolute bottom-[calc(8svh+24px)] left-[var(--gutter)] right-[var(--gutter)] grid">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <div key={s.title} aria-hidden={!on} className="col-start-1 row-start-1 max-w-[560px]" style={{ pointerEvents: on ? "auto" : "none" }}>
                <p className="kicker transition-opacity duration-[1000ms]" style={{ opacity: on ? 1 : 0 }}>{order?.[i] ?? s.title}</p>
                <h3 className="journey-title mt-2 transition-[opacity,transform] duration-[1100ms] [transition-timing-function:var(--ease-out)]" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(14px)", transitionDelay: on ? "120ms" : "0ms" }}><Words text={titles?.[i] ?? s.title} /></h3>
                <p className="t-lead mt-4 max-w-[36ch] transition-[opacity,transform] duration-[1200ms] [transition-timing-function:var(--ease-out)]" style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(8px)", transitionDelay: on ? "380ms" : "0ms" }}>
                  {s.line}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
