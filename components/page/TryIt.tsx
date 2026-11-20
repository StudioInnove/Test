"use client";

/*
 * Made here: the demo itself, working, in the middle of each service page. Web apps get the project tool on
 * a laptop, mobile apps the phone with its three apps, websites the site with three looks. The words sit
 * above, centred, and surface the way every heading on the site does (a soft rise out of a light blur);
 * the device rises and settles from a little further away, scrubbed by GSAP ScrollTrigger. The demo only
 * mounts once it is close, so the page stays light until then.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getGsap } from "@/lib/gsap";
import { Words } from "../Words";
import { ProjectApp } from "../apps/ProjectApp";
import { PhoneApps, PHONE_SIZE } from "../apps/PhoneApps";
import { SiteLooks, LookPicker } from "../apps/SiteLooks";
import { PhoneFrame, FRAME_SIZE } from "../ui/PhoneFrame";
import { LaptopFrame, LAPTOP_SIZE } from "../ui/LaptopFrame";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
type Copy = { kicker: string; title: string; line: string; hint: string; hintPhone?: string };

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

export function TryIt({ kind, copy }: { kind: "web" | "mobile" | "sites"; copy: Copy }) {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [touch, setTouch] = useState(false);
  const [look, setLook] = useState(0);
  const [small, setSmall] = useState(false);
  const [accent, setAccent] = useState<string | null>(null);

  useEffect(() => {
    setTouch(matchMedia("(hover: none)").matches);
    setSmall(matchMedia("(max-width: 767px)").matches);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  useIso(() => {
    const root = ref.current!;
    const { gsap } = getGsap();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-ti-word]", { opacity: 0, y: 16, filter: "blur(8px)", duration: 1.5, ease: "power3.out", stagger: 0.14, scrollTrigger: { trigger: root, start: "top 70%", once: true } });
      gsap.fromTo("[data-ti-device]", { y: 80, scale: 0.92, opacity: 0.4 }, { y: 0, scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: "[data-ti-device]", start: "top 95%", end: "top 35%", scrub: 0.8 } });
    }, root);
    return () => ctx.revert();
  }, []);

  // on a phone, the web app comes as its phone-sized version, in a phone
  const phone = kind === "mobile" || (kind === "web" && small);
  return (
    <section ref={ref} aria-label={copy.title.replace(/\*/g, "")} className="relative px-[var(--gutter)] py-[16svh]">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center text-center">
        <p data-ti-word className="kicker">{copy.kicker}</p>
        <h2 data-ti-word className="t-title mt-4"><Words text={copy.title} /></h2>
        <p data-ti-word className="t-lead mt-4 max-w-[40ch]">{copy.line}</p>
        <p data-ti-word className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-paper/15 px-4 py-2 text-[14px] text-paper/75">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f4b478]" />
          {touch && copy.hintPhone ? copy.hintPhone : copy.hint}
        </p>

        <div data-ti-device className={`relative mt-14 w-full text-left will-change-transform ${phone ? "max-w-[340px] max-md:w-[78%]" : "max-w-[1100px]"}`}>
          {phone ? (
            <Fit w={FRAME_SIZE.w} h={FRAME_SIZE.h}>
              <PhoneFrame>{!near ? <div style={{ width: PHONE_SIZE.w, height: PHONE_SIZE.h, background: "#0b0d12" }} /> : kind === "web" ? <ProjectApp interactive compact /> : <PhoneApps interactive />}</PhoneFrame>
            </Fit>
          ) : (
            <Fit w={LAPTOP_SIZE.w} h={LAPTOP_SIZE.h}>
              <LaptopFrame>{near && (kind === "web" ? <ProjectApp interactive /> : <SiteLooks interactive look={look} accent={accent} />)}</LaptopFrame>
            </Fit>
          )}
          {kind === "sites" && <LookPicker look={look} onLook={setLook} accent={accent} onAccent={setAccent} />}
        </div>
      </div>
    </section>
  );
}
