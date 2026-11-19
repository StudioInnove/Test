/*
 * Living light: drawn over a picture, never instead of it, so the photo stays perfectly sharp.
 *   - now and then a city light glints and settles, like the lights in the footer
 *   - lamps breathe very slowly
 *   - a few specks of dust drift in the lamp light
 *   - on the views of the city, a car's lights glide along the road once in a while
 * Everything is faint, additive light on a transparent canvas.
 */
import lightsData from "./lights.json";

type Light = { u: number; v: number; r: number; c: [number, number, number]; level: number; target: number; base: number };
type Mote = { u: number; v: number; vu: number; vv: number; a: number; ph: number };
type Car = { path: [number, number][]; t: number; speed: number; next: number; warm: boolean };

const LIGHTS = lightsData as Record<string, { lights: number[][] }>;

/** Lamps and lights that breathe slowly: u, v, radius (share of the picture's width), strength. */
export const GLOWS: Record<string, [number, number, number, number][]> = {
  s3: [[0.5, 0.3, 0.12, 0.16], [0.5, 0.36, 0.3, 0.05]],
  s4: [[0.92, 0.13, 0.13, 0.16]],
  s5: [[0.11, 0.13, 0.12, 0.1], [0.3, 0.2, 0.12, 0.1], [0.45, 0.27, 0.1, 0.09]],
  s6: [[0.5, 0.53, 0.2, 0.09]],
  s2: [[0.55, 0.45, 0.2, 0.07]],
  "w-web": [[0.54, 0.06, 0.16, 0.14], [0.23, 0.33, 0.08, 0.07]],
  "w-mobile": [[0.8, 0.02, 0.12, 0.12]],
  "w-how": [[0.42, 0.26, 0.16, 0.08], [0.62, 0.08, 0.1, 0.08], [0.95, 0.82, 0.1, 0.06]],
  "w-orig": [[0.5, 0.5, 0.36, 0.07]],
};

/** Roads where a car's lights pass now and then (points along the road, u, v). */
const ROADS: Record<string, [number, number][][]> = {
  s2: [[[0.9, 0.604], [0.95, 0.608], [0.983, 0.634], [0.971, 0.66], [0.929, 0.701], [0.888, 0.746], [0.846, 0.791]]],
  s1n: [[[0.769, 0.705], [0.82, 0.675], [0.857, 0.64], [0.86, 0.62], [0.84, 0.6], [0.82, 0.6]], [[0.767, 0.752], [0.88, 0.79], [1.0, 0.832]]],
  s1d: [[[0.769, 0.705], [0.82, 0.675], [0.857, 0.64], [0.86, 0.62], [0.84, 0.6], [0.82, 0.6]], [[0.767, 0.752], [0.88, 0.79], [1.0, 0.832]]],
};

/** A soft round sprite, tinted later. */
function sprite(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.7)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

const along = (path: [number, number][], t: number): [number, number] => {
  const n = path.length - 1;
  const x = Math.min(n - 1e-6, Math.max(0, t * n));
  const i = Math.floor(x), f = x - i;
  return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
};

export class LivingLight {
  private ctx: CanvasRenderingContext2D;
  private key: string | null = null;
  private lights: Light[] = [];
  private motes: Mote[] = [];
  private cars: Car[] = [];
  private tints = new Map<string, HTMLCanvasElement>();
  private base: HTMLCanvasElement;
  private w = 1;
  private h = 1;
  private dpr = 1;
  /** 0..1, how present the living light is (fades in after arriving, out when moving) */
  amount = 0;
  /** overall strength: kept faint */
  strength = 0.55;

  constructor(private canvas: HTMLCanvasElement, private touch: boolean) {
    this.ctx = canvas.getContext("2d")!;
    this.base = sprite(64);
  }

  resize(w: number, h: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, this.touch ? 1.5 : 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  private tinted(r: number, g: number, b: number) {
    const k = `${r >> 4},${g >> 4},${b >> 4}`;
    let c = this.tints.get(k);
    if (!c) {
      c = document.createElement("canvas");
      c.width = c.height = 64;
      const x = c.getContext("2d")!;
      x.drawImage(this.base, 0, 0);
      x.globalCompositeOperation = "source-in";
      x.fillStyle = `rgb(${(r >> 4) * 16 + 8},${(g >> 4) * 16 + 8},${(b >> 4) * 16 + 8})`;
      x.fillRect(0, 0, 64, 64);
      this.tints.set(k, c);
    }
    return c;
  }

  /** Which picture to bring to life (a film still id, or a close-up key such as "w-web"). */
  setStill(key: string | null) {
    if (key === this.key) return;
    this.key = key;
    const pts = key ? LIGHTS[key]?.lights ?? [] : [];
    // phones get fewer lights: less to draw, same feeling
    const keep = this.touch ? pts.filter((_, i) => i % 2 === 0) : pts;
    this.lights = keep.map(([u, v, r, R, G, B]) => ({ u, v, r, c: [R, G, B], level: 0, target: 0, base: 0 }));
    const glows = key ? GLOWS[key] ?? [] : [];
    this.motes = [];
    if (glows.length && !this.touch) {
      const [gu, gv, gr] = glows[0];
      for (let i = 0; i < 10; i++) {
        this.motes.push({ u: gu + (Math.random() - 0.5) * gr * 1.2, v: gv + Math.random() * gr * 1.4, vu: (Math.random() - 0.5) * 0.0018, vv: (Math.random() - 0.3) * 0.0012, a: 0.25 + Math.random() * 0.45, ph: Math.random() * 6.28 });
      }
    }
    const now = performance.now() / 1000;
    this.cars = (key ? ROADS[key] ?? [] : []).map((path, i) => ({ path, t: -1, speed: 0, next: now + 1.5 + i * 4 + Math.random() * 3, warm: Math.random() < 0.5 }));
  }

  /**
   * Draw one frame. `map` turns a point on the picture into screen pixels; `scale` is how many
   * screen pixels one picture-width is (it grows when the camera steps closer).
   */
  draw(t: number, map: (u: number, v: number) => [number, number], scale: number, reduce: boolean) {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    if (!this.key || this.amount <= 0.001) return;
    const A = this.amount * this.strength;
    c.globalCompositeOperation = "lighter";

    // lamps breathing
    for (const [u, v, r, s] of GLOWS[this.key] ?? []) {
      const [x, y] = map(u, v);
      const breath = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.5 + u * 9);
      const rad = r * scale;
      const g = c.createRadialGradient(x, y, 0, x, y, rad);
      const a = s * (0.6 + 0.4 * breath) * A;
      g.addColorStop(0, `rgba(255,190,120,${a})`);
      g.addColorStop(0.5, `rgba(255,160,90,${a * 0.35})`);
      g.addColorStop(1, "rgba(255,150,80,0)");
      c.fillStyle = g;
      c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    // a light glints now and then and settles
    if (!reduce && Math.random() < 0.7) {
      const L = this.lights[(Math.random() * this.lights.length) | 0];
      if (L && L.target === L.base) L.target = 0.45 + Math.random() * 0.4;
    }
    for (const L of this.lights) {
      L.level += (L.target - L.level) * (L.target > L.level ? 0.08 : 0.03);
      if (Math.abs(L.target - L.level) < 0.02 && L.target !== L.base) L.target = L.base;
      if (L.level < 0.02) continue;
      const [x, y] = map(L.u, L.v);
      if (x < -40 || y < -40 || x > this.w + 40 || y > this.h + 40) continue;
      // big soft bokeh lights glint more gently than the small sharp ones
      const big = L.r * scale > 10;
      const rad = Math.max(3, L.r * scale * (big ? 1.6 : 2.6));
      c.globalAlpha = Math.min(1, L.level * (big ? 0.35 : 0.8) * A);
      const [R, G, B] = L.c;
      c.drawImage(this.tinted(Math.min(255, R + 30), Math.min(255, G + 20), B), x - rad, y - rad, rad * 2, rad * 2);
    }
    c.globalAlpha = 1;

    // a car passing on the road below
    if (!reduce) {
      for (const car of this.cars) {
        if (car.t < 0) {
          if (t > car.next) {
            car.t = 0;
            car.speed = 0.06 + Math.random() * 0.04;
            car.warm = Math.random() < 0.55;
          }
          continue;
        }
        car.t += car.speed * 0.033;
        if (car.t >= 1) {
          car.t = -1;
          car.next = t + 6 + Math.random() * 10;
          continue;
        }
        const fade = Math.min(1, car.t * 6, (1 - car.t) * 6);
        for (let k = 0; k < 6; k++) {
          const [x, y] = map(...along(car.path, Math.max(0, car.t - k * 0.012)));
          const rad = Math.max(2.5, scale * 0.0022) * (1 - k * 0.12);
          c.globalAlpha = 0.55 * fade * (1 - k / 6) * A;
          c.drawImage(car.warm ? this.tinted(255, 120, 90) : this.tinted(255, 240, 220), x - rad * 2, y - rad * 2, rad * 4, rad * 4);
        }
      }
      c.globalAlpha = 1;
    }

    // dust in the lamp light
    for (const m of this.motes) {
      const k = reduce ? 0 : t;
      const [x, y] = map(m.u + Math.sin(k * 0.13 + m.ph) * m.vu * 9, m.v + Math.sin(k * 0.09 + m.ph * 1.7) * m.vv * 12 - ((k * 0.002 + m.ph) % 0.03));
      const tw = 0.5 + 0.5 * Math.sin(t * 1.3 + m.ph);
      c.fillStyle = `rgba(255,225,190,${m.a * tw * 0.5 * A})`;
      c.beginPath();
      c.arc(x, y, 1.1, 0, 6.283);
      c.fill();
    }
    c.globalCompositeOperation = "source-over";
  }
}
