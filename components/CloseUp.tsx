"use client";

/*
 * A close-up from the film as a full-screen section of a page: the living picture (its screen works,
 * its lights glint), and the words set exactly like the film's scenes.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhoneApps } from "./apps/PhoneApps";
import { BG, Scenery, usePhone } from "./film/Scenery";
import type { WorldId } from "./film/timeline";

export function CloseUp({ id, side = "left", children }: { id: WorldId; side?: "left" | "right"; children: ReactNode }) {
  const phone = usePhone();
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [ps, setPs] = useState(0.7);
  const right = side === "right" && !phone;

  // the words arrive once the section comes into view
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const f = () => setPs(phone ? Math.min(0.5, (window.innerHeight * 0.44) / 844) : Math.min(0.78, (window.innerHeight * 0.74) / 844));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [phone]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-ink max-md:pb-16 md:h-[100svh] md:min-h-[640px]">
      <div className="relative h-[60svh] md:absolute md:inset-0 md:h-auto">
        <Scenery bg={BG[id]} phone={phone} interactive enter={false} />
        <div aria-hidden className={`pointer-events-none absolute inset-0 ${phone ? "[background:linear-gradient(180deg,transparent_55%,#070a12_100%)]" : right ? "[background:linear-gradient(270deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.7)_22%,transparent_38%)]" : id === "originals" ? "[background:linear-gradient(90deg,rgb(7_10_18/0.96)_0%,rgb(7_10_18/0.88)_34%,rgb(7_10_18/0.35)_56%,transparent_72%)]" : "[background:linear-gradient(90deg,rgb(7_10_18/0.92)_0%,rgb(7_10_18/0.6)_36%,transparent_60%)]"}`} />
        {id === "mobile" && (
          <div data-app className={`absolute z-10 ${phone ? "left-1/2 top-6" : "right-[12vw] top-1/2"}`}>
            <div
              className="overflow-hidden rounded-[52px] shadow-[0_40px_90px_-30px_rgb(0_0_0/0.8),0_0_0_10px_#15161b,0_0_0_11px_rgb(255_255_255/0.12)]"
              style={{ transform: phone ? `translateX(-50%) scale(${ps})` : `translateY(-50%) scale(${ps})`, transformOrigin: phone ? "top center" : "center right" }}
            >
              <PhoneApps interactive />
            </div>
          </div>
        )}
      </div>
      <div className={`pointer-events-none relative z-[5] flex px-[var(--gutter)] md:h-full md:flex-col md:justify-end md:pb-[12svh] ${right ? "md:items-end" : ""}`}>
        <div className={`reveal pointer-events-auto w-full ${right ? "max-w-[400px] md:mr-[2vw]" : "max-w-[460px]"} ${seen ? "on" : ""}`}>
          <div className="stack w-full">{children}</div>
        </div>
      </div>
    </section>
  );
}
