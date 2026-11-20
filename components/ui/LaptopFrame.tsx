/*
 * A laptop drawn in CSS around a 1200×720 screen, in the same finish as the phone: a brushed aluminium
 * edge, a thin black bezel with the camera, a soft reflection across the glass and the base below it.
 * No brand marks. Scale it from outside (transform), like the screen inside it.
 */
import type { ReactNode } from "react";

export const LAPTOP_SIZE = { w: 1400, h: 806 };

export function LaptopFrame({ children }: { children: ReactNode }) {
  return (
    <div className="laptop">
      <div className="lt-lid">
        <div className="lt-bezel">
          <span aria-hidden className="lt-cam" />
          <div className="lt-screen">
            {children}
            <span aria-hidden className="lt-glare" />
          </div>
        </div>
      </div>
      <div aria-hidden className="lt-base"><span className="lt-lip" /></div>
    </div>
  );
}
