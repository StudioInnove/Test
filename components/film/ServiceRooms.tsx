"use client";

/*
 * The three ways in, under "We design and build websites and apps": just the words. They surface one after
 * another the way every heading on the site does (a soft rise out of a light blur). Pointing at one dims the
 * others and opens a small window onto that room beside the cursor: it unmasks from its centre, follows with
 * a soft lag and leans a little with the movement (GSAP quickTo). Phones get the words alone.
 */
import { useEffect, useRef } from "react";
import { asset } from "@/lib/content";
import { getGsap } from "@/lib/gsap";

type Room = { key: string; title: string; still: string; onGo: () => void };

export function ServiceRooms({ rooms }: { rooms: Room[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const scene = root.closest(".reveal");
    if (!scene) return;
    const { gsap } = getGsap();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-room]"));
    const peek = root.querySelector<HTMLElement>("[data-peek]")!;
    const pics = Array.from(peek.querySelectorAll<HTMLElement>("[data-pic]"));

    // arriving
    let tl: gsap.core.Timeline | null = null;
    const hide = () => gsap.set(items, { opacity: 0, y: 16, filter: "blur(8px)" });
    const play = () => {
      tl?.kill();
      if (reduce) return void gsap.set(items, { opacity: 1, y: 0, filter: "blur(0px)" });
      hide();
      tl = gsap.timeline({ delay: 2.2 }).to(items, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, ease: "power3.out", stagger: 0.22 });
    };
    const leave = () => {
      tl?.kill();
      gsap.to(items, { opacity: 0, duration: 0.3, overwrite: true });
    };
    let on = scene.classList.contains("on");
    if (on) play();
    else hide();
    const mo = new MutationObserver(() => {
      const now = scene.classList.contains("on");
      if (now === on) return;
      on = now;
      if (on) play();
      else leave();
    });
    mo.observe(scene, { attributes: true, attributeFilter: ["class"] });

    // pointing: the others step back, a window onto the room follows the cursor
    const offs: (() => void)[] = [];
    if (!reduce && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const box = root.getBoundingClientRect.bind(root);
      const xTo = gsap.quickTo(peek, "x", { duration: 0.7, ease: "power3" });
      const yTo = gsap.quickTo(peek, "y", { duration: 0.7, ease: "power3" });
      const rTo = gsap.quickTo(peek, "rotation", { duration: 0.9, ease: "power3" });
      let lastX = 0, shown = -1;
      const move = (e: PointerEvent) => {
        const r = box();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        xTo(x + 22);
        yTo(y + 26);
        rTo(Math.max(-7, Math.min(7, (e.clientX - lastX) * 0.6)));
        lastX = e.clientX;
      };
      const show = (i: number, e: PointerEvent) => {
        if (shown < 0) {
          const r = box();
          gsap.set(peek, { x: e.clientX - r.left + 22, y: e.clientY - r.top + 26 });
          lastX = e.clientX;
          gsap.fromTo(peek, { clipPath: "inset(50% 50% 50% 50% round 12px)" }, { clipPath: "inset(0% 0% 0% 0% round 12px)", duration: 0.75, ease: "expo.out", overwrite: "auto" });
        }
        pics.forEach((p, k) => gsap.to(p, { opacity: k === i ? 1 : 0, scale: k === i ? 1 : 1.12, duration: 0.6, ease: "power3.out", overwrite: true }));
        items.forEach((it, k) => gsap.to(it, { opacity: k === i ? 1 : 0.32, duration: 0.5, ease: "power2.out", overwrite: "auto" }));
        shown = i;
      };
      const hideAll = () => {
        shown = -1;
        gsap.to(peek, { clipPath: "inset(50% 50% 50% 50% round 12px)", duration: 0.45, ease: "power3.in", overwrite: "auto" });
        items.forEach((it) => gsap.to(it, { opacity: 1, duration: 0.6, ease: "power2.out", overwrite: "auto" }));
      };
      items.forEach((it, i) => {
        const enter = (e: PointerEvent) => show(i, e);
        it.addEventListener("pointerenter", enter);
        offs.push(() => it.removeEventListener("pointerenter", enter));
      });
      const list = root.querySelector<HTMLElement>("[data-list]")!;
      list.addEventListener("pointermove", move);
      list.addEventListener("pointerleave", hideAll);
      offs.push(() => {
        list.removeEventListener("pointermove", move);
        list.removeEventListener("pointerleave", hideAll);
      });
    }
    return () => {
      mo.disconnect();
      tl?.kill();
      offs.forEach((f) => f());
    };
  }, []);

  return (
    <div ref={ref} className="relative mt-10 md:mt-14">
      <div data-list className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 md:gap-x-14">
        {rooms.map((r) => (
          <button key={r.key} data-room type="button" onClick={r.onGo} className="svc-room2" style={{ opacity: 0 }}>
            {r.title}
          </button>
        ))}
      </div>
      {/* the window onto a room, beside the cursor */}
      <div data-peek aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[150px] w-[120px] overflow-hidden rounded-[12px] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] md:block" style={{ clipPath: "inset(50% 50% 50% 50% round 12px)" }}>
        {rooms.map((r) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={r.key} data-pic src={asset(`/film/stills/${r.still}-m.webp`)} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0 }} />
        ))}
      </div>
    </div>
  );
}
