/**
 * A generative soundscape made in the browser, so no audio files are needed.
 * Outside: a soft, distant city with the odd car passing far below.
 * Inside: a warm, slow pad with a few unhurried felt-piano notes — calm, focused, feel-good.
 * Everything runs through a gentle room reverb and a limiter, and stays quiet.
 *
 * Browsers only let sound start after the visitor clicks, taps or presses a key,
 * so `start()` tries straight away and `unlock()` is called on that first gesture.
 */
export class Soundscape {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private outside!: GainNode;
  private inside!: GainNode;
  private verb!: GainNode;
  private timers: number[] = [];
  private place = -1;
  on = false;
  onChange: (audible: boolean) => void = () => {};

  get audible() {
    return !!this.ctx && this.ctx.state === "running" && this.on;
  }

  private noise(ctx: AudioContext, seconds: number, kind: "brown" | "pink") {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0, b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === "brown") {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.2;
        } else {
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.963 * b1 + w * 0.2965164;
          b2 = 0.57 * b2 + w * 1.0526913;
          d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
        }
      }
      // fade the loop seam
      const f = Math.min(2048, len >> 4);
      for (let i = 0; i < f; i++) { const k = i / f; d[i] *= k; d[len - 1 - i] *= k; }
    }
    return buf;
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    ctx.onstatechange = () => this.onChange(this.audible);

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -20;
    limiter.ratio.value = 6;
    const tone = ctx.createBiquadFilter(); // nothing sharp ever reaches the ear
    tone.type = "lowpass";
    tone.frequency.value = 5200;
    this.master.connect(tone).connect(limiter).connect(ctx.destination);

    // room reverb: a soft, dark, 3.5 s tail
    const conv = ctx.createConvolver();
    const ir = ctx.createBuffer(2, ctx.sampleRate * 3.5, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
    }
    conv.buffer = ir;
    const verbTone = ctx.createBiquadFilter();
    verbTone.type = "lowpass";
    verbTone.frequency.value = 2200;
    this.verb = ctx.createGain();
    this.verb.gain.value = 0.55;
    this.verb.connect(conv).connect(verbTone).connect(this.master);

    // ---------- outside: distant city ----------
    this.outside = ctx.createGain();
    this.outside.gain.value = 1;
    this.outside.connect(this.master);
    const brown = this.noise(ctx, 6, "brown");
    const bed = ctx.createBufferSource();
    bed.buffer = brown;
    bed.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 380;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 55;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.16;
    // the city "breathes": a very slow swell
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.035;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.04;
    swell.connect(swellGain).connect(bedGain.gain);
    bed.connect(hp).connect(lp).connect(bedGain).connect(this.outside);
    bed.start();
    swell.start();

    // a faint high air, like wind at height
    const air = ctx.createBufferSource();
    air.buffer = this.noise(ctx, 5, "pink");
    air.loop = true;
    const airBp = ctx.createBiquadFilter();
    airBp.type = "bandpass";
    airBp.frequency.value = 1400;
    airBp.Q.value = 0.5;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.012;
    air.connect(airBp).connect(airGain).connect(this.outside);
    air.start();

    // a car far below, now and then
    const pass = () => {
      if (!this.ctx) return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = brown;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.7;
      bp.frequency.setValueAtTime(260, t);
      bp.frequency.linearRampToValueAtTime(620, t + 2.2);
      bp.frequency.linearRampToValueAtTime(300, t + 4.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.018 + Math.random() * 0.016, t + 2.1);
      g.gain.linearRampToValueAtTime(0, t + 4.8);
      const pan = ctx.createStereoPanner();
      const side = Math.random() < 0.5 ? -1 : 1;
      pan.pan.setValueAtTime(-0.7 * side, t);
      pan.pan.linearRampToValueAtTime(0.7 * side, t + 4.8);
      src.connect(bp).connect(g).connect(pan).connect(this.outside);
      src.start(t, Math.random() * 4);
      src.stop(t + 5);
      this.timers.push(window.setTimeout(pass, 4000 + Math.random() * 7000));
    };
    this.timers.push(window.setTimeout(pass, 2500));

    // ---------- inside: warm focus pad + felt piano ----------
    this.inside = ctx.createGain();
    this.inside.gain.value = 0;
    this.inside.connect(this.master);
    this.inside.connect(this.verb);
    const padTone = ctx.createBiquadFilter();
    padTone.type = "lowpass";
    padTone.frequency.value = 760;
    padTone.Q.value = 0.3;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.9;
    padTone.connect(padGain).connect(this.inside);
    // D major add9, voiced low and open
    const notes = [73.42, 146.83, 220.0, 277.18, 329.63, 369.99];
    notes.forEach((f, i) => {
      for (const det of [-5, 5]) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.detune.value = det;
        const g = ctx.createGain();
        const base = (i === 0 ? 0.03 : i === 1 ? 0.026 : 0.014) / 2;
        g.gain.value = base;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.03 + i * 0.011;
        const lg = ctx.createGain();
        lg.gain.value = base * 0.7;
        lfo.connect(lg).connect(g.gain);
        o.connect(g).connect(padTone);
        o.start();
        lfo.start(ctx.currentTime + i * 1.7);
      }
    });

    // a few soft piano-like notes from the same chord, never twice in a row
    const scale = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33];
    let lastNote = -1;
    const note = () => {
      if (!this.ctx) return;
      if (this.place > 0.5) {
        let k = Math.floor(Math.random() * scale.length);
        if (k === lastNote) k = (k + 2) % scale.length;
        lastNote = k;
        const t = ctx.currentTime;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.03, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        const soft = ctx.createBiquadFilter();
        soft.type = "lowpass";
        soft.frequency.setValueAtTime(1800, t);
        soft.frequency.exponentialRampToValueAtTime(500, t + 2.5);
        for (const [mult, amp] of [[1, 1], [2, 0.18], [3, 0.05]] as const) {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = scale[k] * mult;
          const a = ctx.createGain();
          a.gain.value = amp;
          o.connect(a).connect(soft);
          o.start(t);
          o.stop(t + 4.6);
        }
        soft.connect(g).connect(this.inside);
      }
      this.timers.push(window.setTimeout(note, 3800 + Math.random() * 5200));
    };
    this.timers.push(window.setTimeout(note, 1800));
  }

  /** Switch on (or off). Starts silently suspended if the browser is still waiting for a gesture. */
  async start(next = true) {
    if (next && !this.ctx) this.build();
    const ctx = this.ctx;
    if (!ctx) return;
    this.on = next;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.setTargetAtTime(next ? 0.5 : 0, t, next ? 1.4 : 0.3);
    if (next && ctx.state === "suspended") {
      try { await ctx.resume(); } catch { /* waits for a gesture */ }
    }
    this.onChange(this.audible);
  }

  /** Call from a click, tap or key press: lets a waiting soundscape begin, with a slow fade in. */
  unlock() {
    if (!this.ctx || !this.on || this.ctx.state === "running") return;
    this.ctx.resume().then(() => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(0, t);
      this.master.gain.setTargetAtTime(0.5, t, 1.4);
      this.onChange(this.audible);
    }).catch(() => {});
  }

  /** 0 = fully outside, 1 = fully inside the studio. */
  setPlace(inside: number) {
    if (!this.ctx || Math.abs(inside - this.place) < 0.02) return;
    this.place = inside;
    const t = this.ctx.currentTime;
    this.outside.gain.setTargetAtTime(1 - inside * 0.8, t, 0.6);
    this.inside.gain.setTargetAtTime(inside, t, 0.9);
  }

  destroy() {
    this.timers.forEach((t) => clearTimeout(t));
    this.ctx?.close();
    this.ctx = null;
  }
}
