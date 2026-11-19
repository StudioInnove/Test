/*
 * A finished phone, drawn in CSS around a 390×844 screen: a brushed titanium edge, a black bezel, the
 * camera island, side buttons and a soft reflection across the glass. No brand marks.
 * Scale it from outside (transform), like the screen inside it.
 */
import type { ReactNode } from "react";

export const FRAME_SIZE = { w: 390 + 30, h: 844 + 30 };

export function PhoneFrame({ children, tone = "titanium" }: { children: ReactNode; tone?: "titanium" | "graphite" }) {
  return (
    <div className={`phone-frame ${tone === "graphite" ? "is-graphite" : ""}`}>
      <span aria-hidden className="pf-btn pf-action" />
      <span aria-hidden className="pf-btn pf-vol1" />
      <span aria-hidden className="pf-btn pf-vol2" />
      <span aria-hidden className="pf-btn pf-power" />
      <div className="pf-edge">
        <div className="pf-bezel">
          <div className="pf-screen">
            {children}
            <span aria-hidden className="pf-island" />
            <span aria-hidden className="pf-glare" />
          </div>
        </div>
      </div>
    </div>
  );
}
