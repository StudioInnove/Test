"use client";

/*
 * Made here: the demo itself, working, in the middle of each service page. Web apps get the reservations
 * app in a quiet window, mobile apps the phone with its three little apps, websites the browser where the
 * three demo sites are being looked through. As you arrive the words surface the way every heading on the
 * site does (a soft rise out of a light blur), and the device opens out of a rounded mask while it settles
 * from a little further away, scrubbed by GSAP ScrollTrigger. The demo only mounts once it is close, so
 * the page stays light until then.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { Words } from "../Words";
import { Dashboard, DASH_SIZE } from "../apps/Dashboard";
import { PhoneApps, PHONE_SIZE } from "../apps/PhoneApps";
import { LiveSites, LIVE_SITES_SIZE } from "../apps/LiveSites";
import { PhoneFrame, FRAME_SIZE } from "../ui/PhoneFrame";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Copy = { kicker: string; title: string; line: string; hint: string; hintPhone?: string };
const BAR = 30;

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
    <div ref={ref} className="relative w-full" style={{ height: s ? h * s : undefined, aspectRatio: s ? undefined : `${w} / ${h}` }}>
      {s > 0 && <div className="absolute left-0 top-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${s})` }}>{children}</div>}
    </div>
  );
}

export function TryIt({ kind, copy }: { kind: "web" | "mobile" | "sites"; copy: Copy }) {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(matchMedia("(hover: none)").matches);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  useIso(() => {
    const root = ref.current!;
    const { gsap } = getGsap();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-ti-word]", {
        opacity: 0, y: 16, filter: "blur(8px)", duration: 1.5, ease: "power3.out", stagger: 0.14,
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      });
      gsap.fromTo("[data-ti-device]",
        { clipPath: "inset(14% 10% 14% 10% round 28px)", scale: 0.9, y: 40 },
        // the phone's side buttons sit just outside its body, so its mask opens a little wider
        { clipPath: kind === "mobile" ? "inset(-4% -8% -4% -8% round 18px)" : "inset(0% 0% 0% 0% round 18px)", scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: root, start: "top 85%", end: "top 15%", scrub: 0.8 } });
    }, root);
    return () => ctx.revert();
  }, [kind]);

  const wide = kind !== "mobile";
  return (
    <section ref={ref} aria-label={copy.title.replace(/\*/g, "")} className="relative flex min-h-[100svh] items-center px-[var(--gutter)] py-[14svh]">
      <div className={`mx-auto grid w-full max-w-[1320px] items-center gap-10 md:gap-[5vw] ${wide ? "md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]" : "md:grid-cols-[minmax(0,460px)_minmax(0,340px)] md:justify-center"}`}>
        <div>
          <p data-ti-word className="kicker">{copy.kicker}</p>
          <h2 data-ti-word className="t-title mt-4"><Words text={copy.title} /></h2>
          <p data-ti-word className="t-lead mt-5 max-w-[36ch]">{copy.line}</p>
          <p data-ti-word className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-paper/15 px-4 py-2 text-[14px] text-paper/75">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f4b478]" />
            {touch && copy.hintPhone ? copy.hintPhone : copy.hint}
          </p>
        </div>

        <div data-ti-device className={`relative will-change-transform ${wide ? "" : "mx-auto w-[min(300px,72vw)] md:w-full"}`}>
          {wide ? (
            <div className="overflow-hidden rounded-[18px] bg-[#f6f2ec] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.08)]">
              {kind === "web" && (
                <div aria-hidden className="flex items-center gap-1.5 bg-[#ece6de] px-4" style={{ height: BAR }}>
                  {[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-[#1d1b18]/15" />)}
                </div>
              )}
              {kind === "web" ? (
                <Fit w={DASH_SIZE.w} h={DASH_SIZE.h}>{near && <Dashboard interactive={!touch} />}</Fit>
              ) : (
                <Fit w={LIVE_SITES_SIZE.w} h={LIVE_SITES_SIZE.h}>{near && <LiveSites />}</Fit>
              )}
            </div>
          ) : (
            <Fit w={FRAME_SIZE.w} h={FRAME_SIZE.h}>
              <PhoneFrame>{near ? <PhoneApps interactive /> : <div style={{ width: PHONE_SIZE.w, height: PHONE_SIZE.h, background: "#0b0d12" }} />}</PhoneFrame>
            </Fit>
          )}
        </div>
      </div>
    </section>
  );
}
