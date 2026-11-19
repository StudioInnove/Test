"use client";

/*
 * The screen in the back room: an app being built, kept just out of focus so nobody can read it.
 * A progress bar creeps along, panels slide into place, and when someone joins the list it glows.
 */
import { useEffect, useState } from "react";

const W = 1200, H = 630;

export function BuildScreen({ glow = false, focus = 9 }: { glow?: boolean; focus?: number }) {
  const [p, setP] = useState(0.56);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setP((v) => (v > 0.7 ? 0.54 : v + 0.004));
      setStep((s) => s + 1);
    }, 260);
    return () => clearInterval(id);
  }, []);
  const lit = step % 3;
  return (
    <div aria-hidden className="relative overflow-hidden" style={{ width: W, height: H, background: "linear-gradient(110deg,#f2e2d0 0%,#f6dcc0 45%,#efc9a8 100%)" }}>
      <div className="absolute inset-0" style={{ filter: `blur(${focus}px)` }}>
        {/* sidebar */}
        <div className="absolute inset-y-0 left-0 w-[250px] bg-[#c99a73]/40" />
        <div className="absolute left-[40px] top-[40px] h-12 w-12 rounded-full bg-[#e7a065]" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute left-[40px] h-6 rounded-full bg-white/60" style={{ top: 150 + i * 70, width: i === 0 ? 170 : 120 }} />
        ))}
        {/* cards that light up one after another */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute top-[140px] h-[260px] w-[250px] rounded-[30px] transition-[background-color,transform] duration-1000"
            style={{ left: 320 + i * 285, background: i === lit ? "#b8662f" : "rgb(255 255 255 / 0.7)", transform: i === lit ? "translateY(-6px)" : "none" }}
          />
        ))}
        {/* progress */}
        <div className="absolute left-[320px] right-[60px] top-[480px] h-5 rounded-full bg-white/70">
          <div className="h-full rounded-full bg-gradient-to-r from-[#5b3a2a] to-[#e8903f] transition-[width] duration-300" style={{ width: `${p * 100}%` }} />
        </div>
      </div>
      {/* the warm light the screen gives off; brighter when someone joins */}
      <div className={`absolute inset-0 transition-opacity duration-[1600ms] [background:radial-gradient(70%_80%_at_30%_50%,rgb(255_190_120/0.55),transparent_70%)] ${glow ? "opacity-100" : "opacity-40"}`} />
      <div className="build-pulse absolute inset-0 bg-[#ffcf9a]" />
    </div>
  );
}

export const BUILD_SIZE = { w: W, h: H };
