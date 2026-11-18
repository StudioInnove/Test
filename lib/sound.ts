/**
 * A generative soundscape made in the browser, so no audio files are needed.
 * Outside: a soft city bed with distant traffic passing. Inside: a warm, slow chord.
 * Scene changes play a quiet bell. Everything fades; nothing is ever loud.
 */
export class Soundscape {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private outside!: GainNode;
  private inside!: GainNode;
  private timers: number[] = [];
  on = false;

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    this.master.connect(comp).connect(ctx.destination);

    // ---- outside: brown noise through a low filter = distant city ----
    this.outside = ctx.createGain();
    this.outside.gain.value = 1;
    this.outside.connect(this.master);
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.2;
      }
    }
    const bed = ctx.createBufferSource();
    bed.buffer = buf;
    bed.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.22;
    bed.connect(lp).connect(bedGain).connect(this.outside);
    bed.start();

    // distant cars passing, now and then
    const pass = () => {
      if (!this.ctx) return;
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.9;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.linearRampToValueAtTime(900, t + 1.6);
      bp.frequency.linearRampToValueAtTime(380, t + 3.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.04, t + 1.5);
      g.gain.linearRampToValueAtTime(0, t + 3.6);
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(-0.8 + Math.random() * 0.4, t);
      pan.pan.linearRampToValueAtTime(0.6 + Math.random() * 0.3, t + 3.6);
      src.connect(bp).connect(g).connect(pan).connect(this.outside);
      src.start(t, Math.random() * 3);
      src.stop(t + 3.8);
      this.timers.push(window.setTimeout(pass, 2500 + Math.random() * 5500));
    };
    this.timers.push(window.setTimeout(pass, 1200));

    // ---- inside: warm chord (Dmaj9), slowly breathing ----
    this.inside = ctx.createGain();
    this.inside.gain.value = 0;
    this.inside.connect(this.master);
    const pad = ctx.createBiquadFilter();
    pad.type = "lowpass";
    pad.frequency.value = 900;
    pad.Q.value = 0.4;
    pad.connect(this.inside);
    const notes = [146.83, 220.0, 277.18, 329.63, 440.0];
    notes.forEach((f, i) => {
      for (const det of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = det;
        const g = ctx.createGain();
        g.gain.value = (i === 0 ? 0.05 : 0.022) / 2;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.013;
        const lg = ctx.createGain();
        lg.gain.value = g.gain.value * 0.6;
        lfo.connect(lg).connect(g.gain);
        o.connect(g).connect(pad);
        o.start();
        lfo.start();
      }
    });
  }

  async toggle(next: boolean) {
    if (next && !this.ctx) this.build();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    this.on = next;
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(next ? 0.9 : 0, t, next ? 0.6 : 0.25);
  }

  /** 0 = fully outside, 1 = fully inside the studio. */
  setPlace(inside: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.outside.gain.setTargetAtTime(1 - inside * 0.85, t, 0.4);
    this.inside.gain.setTargetAtTime(inside, t, 0.6);
  }

  chime() {
    const ctx = this.ctx;
    if (!ctx || !this.on) return;
    const t = ctx.currentTime;
    for (const [f, a] of [[880, 0.035], [1318.5, 0.018]] as const) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 2.3);
    }
  }

  destroy() {
    this.timers.forEach((t) => clearTimeout(t));
    this.ctx?.close();
    this.ctx = null;
  }
}
