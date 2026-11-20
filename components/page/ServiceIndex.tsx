"use client";

/*
 * Anything you can imagine: a few examples, told one at a time, on a device that stays put while its
 * screen changes. The section holds still while you scroll; the titles turn past a reading line like the
 * drum of a rolodex, and each example's screen builds itself in front of you (GSAP): its pieces settle into
 * place one after another, charts draw on, numbers count up. On the phone, the apps slide across as on a
 * real phone; on the websites page, one site re-dresses itself for each kind of site.
 * The last one is yours: type your idea and its first screen appears, then send it to us.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { LaptopFrame, LAPTOP_SIZE } from "../ui/LaptopFrame";
import { PhoneFrame, FRAME_SIZE } from "../ui/PhoneFrame";
import { ProjectApp } from "../apps/ProjectApp";
import { PhoneApps } from "../apps/PhoneApps";
import { SiteLooks } from "../apps/SiteLooks";
import { PlatformScreen, AnalyticsScreen, IdeaScreen, PhoneIdea } from "../apps/ExampleScreens";

type Item = { title: string; phrase: string; line: string; demo?: string };

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);
const PHONE_PAGE: Record<string, number> = { "mobile-food": 0, "mobile-fitness": 1, "mobile-music": 2 };
const SITE_LOOK: Record<string, number> = { "site-landing": 2, "site-brand": 0, "site-shop": 1 };

/** something drawn at a fixed size, scaled to the width it is given */
function Fit({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState(0);
  useIso(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setS(el.clientWidth / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="relative w-full" style={{ aspectRatio: `${w} / ${h}` }}>
      {s > 0 && <div className="absolute left-0 top-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${s})` }}>{children}</div>}
    </div>
  );
}

/** build a screen in front of you: pieces settle in, charts draw, numbers count */
function build(el: Element | null) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { gsap } = getGsap();
  gsap.fromTo(el.querySelectorAll("[data-b]"), { opacity: 0, y: 22, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", stagger: 0.045, overwrite: true });
  el.querySelectorAll("[data-draw]").forEach((p) => gsap.fromTo(p, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.6, ease: "power2.inOut", delay: 0.4 }));
  el.querySelectorAll("[data-fade]").forEach((p) => gsap.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 1 }));
  el.querySelectorAll<HTMLElement>("[data-grow]").forEach((p) => gsap.fromTo(p, { scaleX: 0 }, { scaleX: 1, transformOrigin: "0 50%", duration: 1.2, ease: "power3.out", delay: 0.5 }));
  el.querySelectorAll<HTMLElement>("[data-count]").forEach((p) => {
    const end = +p.dataset.count!;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.4, ease: "power2.out", delay: 0.3, onUpdate: () => { p.textContent = Math.round(o.v).toLocaleString("en-GB"); } });
  });
}

export function ServiceIndex({ kicker, items }: { kicker: string; items: Item[] }) {
  const ref = useRef<HTMLElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const screens = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const [idea, setIdea] = useState("");
  const n = items.length;
  const kind = (items[0]?.demo ?? "web").split("-")[0] as "web" | "mobile" | "site";
  const phone = kind === "mobile";

  // the demos only mount once the section is close
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "800px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  useIso(() => {
    const { gsap } = getGsap();
    const root = ref.current;
    if (!root) return;
    const state = { t: 0 };
    let last = -1;
    const apply = () => {
      const t = state.t;
      const fl = Math.min(n - 1, Math.floor(t));
      const pos = Math.min(n - 1, fl + smooth(clamp((t - fl - 0.8) / 0.2)));
      rows.current.forEach((el, i) => {
        if (!el) return;
        const d = i - pos;
        const a = Math.min(1, Math.abs(d));
        el.style.transform = `translate3d(0, ${d * 92}%, 0) scale(${1 - a * 0.3})`;
        el.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.15));
        el.style.filter = a > 0.02 ? `blur(${a * 5}px)` : "none";
      });
      const now = Math.round(pos);
      if (now !== last) {
        last = now;
        setActive(now);
      }
    };
    apply();
    const ctx = gsap.context(() => {
      gsap.to(state, { t: n - 0.08, ease: "none", onUpdate: apply, scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 1 } });
    }, root);
    return () => ctx.revert();
  }, [n]);

  // each time you arrive at an example, its screen builds itself
  useEffect(() => {
    if (!near) return;
    const id = requestAnimationFrame(() => build(screens.current[active]));
    return () => cancelAnimationFrame(id);
  }, [active, near]);

  const cur = items[active]?.demo ?? "";
  const isIdea = cur.endsWith("idea");
  const send = () => window.dispatchEvent(new CustomEvent("contact:open", { detail: { idea } }));

  // what's on the device for each example
  const screenFor = (demo: string) => {
    if (demo === "web-platform") return <PlatformScreen />;
    if (demo === "web-dashboard") return <AnalyticsScreen />;
    if (demo === "web-tool") return <ProjectApp />;
    if (demo === "web-idea") return <IdeaScreen idea={idea} kind="web" />;
    if (demo === "site-idea") return <IdeaScreen idea={idea} kind="site" />;
    if (demo === "mobile-idea") return <PhoneIdea idea={idea} />;
    return null;
  };

  const device = (() => {
    if (!near) return null;
    if (kind === "mobile") {
      const page = PHONE_PAGE[cur] ?? 2;
      return (
        <Fit w={FRAME_SIZE.w} h={FRAME_SIZE.h}>
          <PhoneFrame>
            <div ref={(el) => { items.forEach((it, i) => { if (!it.demo?.endsWith("idea")) screens.current[i] = el; }); }} className="relative h-full w-full">
              <PhoneApps page={page} />
            </div>
            <div ref={(el) => { screens.current[n - 1] = el; }} className="absolute inset-0 z-40 transition-opacity duration-700" style={{ opacity: isIdea ? 1 : 0, pointerEvents: "none" }}>
              <PhoneIdea idea={idea} />
            </div>
          </PhoneFrame>
        </Fit>
      );
    }
    return (
      <Fit w={LAPTOP_SIZE.w} h={LAPTOP_SIZE.h}>
        <LaptopFrame>
          {kind === "site" ? (
            <>
              <div ref={(el) => { items.forEach((it, i) => { if (!it.demo?.endsWith("idea")) screens.current[i] = el; }); }} className="absolute inset-0">
                <SiteLooks look={SITE_LOOK[cur] ?? 1} />
              </div>
              <div ref={(el) => { screens.current[n - 1] = el; }} className="absolute inset-0 z-10 transition-opacity duration-700" style={{ opacity: isIdea ? 1 : 0 }}>
                <IdeaScreen idea={idea} kind="site" />
              </div>
            </>
          ) : (
            items.map((it, i) => (
              <div key={it.title} ref={(el) => { screens.current[i] = el; }} className="absolute inset-0 transition-[opacity,visibility] duration-700" style={{ opacity: i === active ? 1 : 0, visibility: Math.abs(i - active) > 1 ? "hidden" : "visible" }}>
                {screenFor(it.demo ?? "")}
              </div>
            ))
          )}
        </LaptopFrame>
      </Fit>
    );
  })();

  return (
    <section ref={ref} className="relative" style={{ height: `${n * 110 + 40}svh` }} aria-label={kicker}>
      <div className={`sticky top-0 flex h-[100svh] flex-col justify-center gap-8 overflow-hidden px-[var(--gutter)] md:grid md:content-center md:items-center md:justify-center md:gap-[4vw] ${phone ? "md:grid-cols-[minmax(0,520px)_minmax(0,320px)]" : "md:grid-cols-[minmax(0,460px)_minmax(0,820px)]"}`}>
        {/* the words */}
        <div className="relative max-md:pt-14">
          <p className="kicker">{kicker}</p>
          <div className="relative mt-6 h-[1.9em] si-title md:mt-10">
            {items.map((it, i) => (
              <div key={it.title} ref={(el) => { rows.current[i] = el; }} aria-hidden={i !== active} className="absolute inset-x-0 top-0 origin-left will-change-transform">
                <h3 className="leading-[0.95]">{it.title}</h3>
                <p className="si-phrase mt-[0.12em]">{it.phrase}</p>
              </div>
            ))}
          </div>
          <div className="relative mt-8 grid md:mt-12">
            {items.map((it, i) => (
              <div key={it.title} className="col-start-1 row-start-1 transition-[opacity,transform] duration-[900ms] [transition-timing-function:var(--ease-out)]" style={{ opacity: i === active ? 1 : 0, transform: i === active ? "none" : "translateY(10px)", pointerEvents: i === active ? "auto" : "none" }}>
                <p className="t-lead max-w-[34ch]">{it.line}</p>
                {it.demo?.endsWith("idea") && (
                  <form className="mt-6 flex max-w-[420px] flex-col gap-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
                    <label className="sr-only" htmlFor={`idea-${kind}`}>Your idea</label>
                    <input
                      id={`idea-${kind}`}
                      value={idea}
                      onChange={(e) => setIdea(e.target.value.slice(0, 80))}
                      tabIndex={i === active ? 0 : -1}
                      placeholder={kind === "mobile" ? "A fitness app for my running club" : kind === "site" ? "A website for my bakery" : "A booking platform for my salon"}
                      className="contact-input"
                    />
                    <button type="submit" tabIndex={i === active ? 0 : -1} disabled={!idea.trim()} className="btn btn-primary w-max disabled:opacity-40">Send it to us</button>
                  </form>
                )}
              </div>
            ))}
          </div>
          <div aria-hidden className="mt-10 flex gap-2">
            {items.map((it, i) => (
              <span key={it.title} className={`h-[2px] rounded-full transition-all duration-700 [transition-timing-function:var(--ease-out)] ${i === active ? "w-8 bg-paper" : "w-3 bg-paper/25"}`} />
            ))}
          </div>
        </div>

        {/* the device */}
        <div className={`relative mx-auto w-full md:mx-0 ${phone ? "max-w-[300px] max-md:w-[52%]" : "max-w-[860px]"}`}>
          {device}
        </div>
      </div>
    </section>
  );
}
