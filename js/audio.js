// Moteur sonore procédural (WebAudio). Tout est synthétisé : pas de fichier
// à charger. Si une banque de sons réelle est fournie (assets/sfx/*.mp3),
// `Sfx.load()` la substitue automatiquement aux équivalents synthétiques.

export class Sfx {
  constructor() {
    this.ctx = null; this.master = null; this.buffers = {}; this.loops = {};
    this.tension = 0; this._heartTimer = null; this._noise = null;
  }
  async start() {
    if (this.ctx) { if (this.ctx.state !== 'running') await this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    this.ctx = new C();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -12; this.comp.ratio.value = 6; this.comp.attack.value = .005; this.comp.release.value = .2;
    this.master.connect(this.comp).connect(this.ctx.destination);
    this._noise = this._makeNoise();
    await this.load();
  }
  get t() { return this.ctx.currentTime; }

  // ---------- banque optionnelle ----------
  async load() {
    const names = ['rain','wind','creak1','creak2','creak3','step1','step2','step3','slam','knock','breath','drone','static','glass','birds','laugh','whisper','scream','breaker','ring'];
    await Promise.all(names.map(async n => {
      try {
        const r = await fetch(`assets/sfx/${n}.mp3`, { cache: 'force-cache' });
        if (!r.ok) return;
        const ab = await r.arrayBuffer();
        this.buffers[n] = await this.ctx.decodeAudioData(ab);
      } catch (_) {}
    }));
  }
  has(n) { return !!this.buffers[n]; }
  _play(n, { gain = 1, loop = false, rate = 1, pan = 0, fade = 0 } = {}) {
    const b = this.buffers[n]; if (!b) return null;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = loop; s.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = fade ? 0 : gain;
    const p = this.ctx.createStereoPanner(); p.pan.value = pan;
    s.connect(g).connect(p).connect(this.master); s.start();
    if (fade) g.gain.linearRampToValueAtTime(gain, this.t + fade);
    return { src: s, gain: g, stop: (f = .5) => { g.gain.linearRampToValueAtTime(0, this.t + f); s.stop(this.t + f + .05); } };
  }

  _makeNoise() {
    const len = this.ctx.sampleRate * 4, buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    return buf;
  }
  _noiseSrc() { const s = this.ctx.createBufferSource(); s.buffer = this._noise; s.loop = true; return s; }

  // ---------- ambiances (boucles) ----------
  ambience(on = true) {
    if (!on) { Object.values(this.loops).forEach(l => l.stop(2)); this.loops = {}; if (this._heartTimer) { clearTimeout(this._heartTimer); this._heartTimer = null; } return; }
    if (this.loops.rain) return;
    if (this.has('rain')) this.loops.rain = this._play('rain', { gain: .5, loop: true, fade: 3 });
    else {
      const s = this._noiseSrc(); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4200; f.Q.value = .5;
      const f2 = this.ctx.createBiquadFilter(); f2.type = 'highpass'; f2.frequency.value = 1500;
      const g = this.ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(.045, this.t + 3);
      s.connect(f).connect(f2).connect(g).connect(this.master); s.start();
      this.loops.rain = { stop: (t = 1) => { g.gain.linearRampToValueAtTime(0, this.t + t); s.stop(this.t + t + .1); } };
    }
    if (this.has('wind')) this.loops.wind = this._play('wind', { gain: .55, loop: true, fade: 4 });
    else {
      const s = this._noiseSrc(); const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; f.Q.value = 2.5;
      const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = .07;
      const lg = this.ctx.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(f.frequency);
      const lfo2 = this.ctx.createOscillator(); lfo2.frequency.value = .21; const lg2 = this.ctx.createGain(); lg2.gain.value = 90; lfo2.connect(lg2).connect(f.frequency);
      const g = this.ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(.16, this.t + 4);
      const ag = this.ctx.createGain(); ag.gain.value = .7; const alfo = this.ctx.createOscillator(); alfo.frequency.value = .05; const alg = this.ctx.createGain(); alg.gain.value = .3; alfo.connect(alg).connect(ag.gain);
      s.connect(f).connect(ag).connect(g).connect(this.master); s.start(); lfo.start(); lfo2.start(); alfo.start();
      this.loops.wind = { stop: (t = 1) => { g.gain.linearRampToValueAtTime(0, this.t + t); s.stop(this.t + t + .1); lfo.stop(this.t + t + .1); lfo2.stop(this.t + t + .1); alfo.stop(this.t + t + .1); } };
    }
    // Drone : toujours présent, volume piloté par la tension.
    const dg = this.ctx.createGain(); dg.gain.value = 0;
    if (this.has('drone')) { const l = this._play('drone', { gain: 1, loop: true }); l.gain.disconnect(); l.gain.connect(dg); dg.connect(this.master); this.loops.drone = { gain: dg, stop: (t = 1) => { dg.gain.linearRampToValueAtTime(0, this.t + t); l.src.stop(this.t + t + .1); } }; }
    else {
      const os = [[41.2, 'sine'], [41.9, 'sine'], [82.4, 'triangle'], [123.5, 'sine']].map(([f, ty]) => { const o = this.ctx.createOscillator(); o.type = ty; o.frequency.value = f; return o; });
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      const gs = [.5, .5, .12, .05];
      os.forEach((o, i) => { const g = this.ctx.createGain(); g.gain.value = gs[i]; o.connect(g).connect(lp); o.start(); });
      lp.connect(dg).connect(this.master);
      this.loops.drone = { gain: dg, stop: (t = 1) => { dg.gain.linearRampToValueAtTime(0, this.t + t); os.forEach(o => o.stop(this.t + t + .1)); } };
    }
  }
  setTension(v) {                       // 0..1 : drone + rythme cardiaque
    this.tension = Math.max(0, Math.min(1, v));
    if (this.loops.drone) this.loops.drone.gain.gain.setTargetAtTime(this.tension * .55, this.t, .8);
    if (this.tension > .25 && !this._heartTimer) this._heart();
  }
  _heart() {
    if (this.tension <= .2) { this._heartTimer = null; return; }
    this.thump(40, .9 * this.tension); setTimeout(() => this.thump(38, .55 * this.tension), 180);
    const bpm = 55 + this.tension * 75;
    this._heartTimer = setTimeout(() => this._heart(), 60000 / bpm);
  }

  // ---------- one-shots ----------
  thump(freq = 45, gain = .8, dur = .35) {
    const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.6, this.t); o.frequency.exponentialRampToValueAtTime(freq, this.t + .08);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, this.t); g.gain.exponentialRampToValueAtTime(.001, this.t + dur);
    o.connect(g).connect(this.master); o.start(); o.stop(this.t + dur + .05);
  }
  burst(gain = .5, dur = .2, freq = 800, type = 'lowpass', pan = 0, q = 1) {
    const s = this._noiseSrc(); const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, this.t); g.gain.exponentialRampToValueAtTime(.001, this.t + dur);
    const p = this.ctx.createStereoPanner(); p.pan.value = pan;
    s.connect(f).connect(g).connect(p).connect(this.master); s.start(); s.stop(this.t + dur + .05);
  }
  click(gain = .25) { this.burst(gain, .03, 3000, 'highpass'); }
  step(pan = 0, gain = .5, far = false) {
    const n = 'step' + (1 + Math.floor(Math.random() * 3));
    if (this.has(n)) { this._play(n, { gain: gain * (far ? .4 : 1), pan, rate: far ? .85 : 1 }); return; }
    this.burst(gain * .9, .12, far ? 180 : 320, 'lowpass', pan, 2); this.thump(far ? 48 : 70, gain * .5, .2);
  }
  creak(pan = 0, gain = .35) {
    const n = 'creak' + (1 + Math.floor(Math.random() * 3));
    if (this.has(n)) { this._play(n, { gain, pan, rate: .9 + Math.random() * .3 }); return; }
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = 90 + Math.random() * 120, d = .5 + Math.random() * .9;
    o.frequency.setValueAtTime(f0, this.t); o.frequency.linearRampToValueAtTime(f0 * (1.4 + Math.random()), this.t + d * .6); o.frequency.linearRampToValueAtTime(f0 * .9, this.t + d);
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 4;
    const tr = this.ctx.createOscillator(); tr.frequency.value = 18 + Math.random() * 14; const tg = this.ctx.createGain(); tg.gain.value = .5; tr.connect(tg).connect(f.frequency);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, this.t); g.gain.linearRampToValueAtTime(gain * .5, this.t + d * .3); g.gain.linearRampToValueAtTime(0, this.t + d);
    const p = this.ctx.createStereoPanner(); p.pan.value = pan;
    o.connect(f).connect(g).connect(p).connect(this.master); o.start(); tr.start(); o.stop(this.t + d + .05); tr.stop(this.t + d + .05);
  }
  slam(gain = 1) {
    if (this.has('slam')) { this._play('slam', { gain }); return; }
    this.burst(gain, .35, 500, 'lowpass', 0, 1); this.thump(35, gain, .7); setTimeout(() => this.burst(gain * .3, .6, 200, 'lowpass'), 60);
  }
  knock(n = 3, gain = .9, gap = 420) {
    if (this.has('knock')) { this._play('knock', { gain }); return; }
    for (let i = 0; i < n; i++) setTimeout(() => { this.thump(110, gain, .18); this.burst(gain * .5, .05, 900, 'bandpass', 0, 2); }, i * gap);
  }
  glassTap(n = 2) {
    for (let i = 0; i < n; i++) setTimeout(() => {
      if (this.has('glass')) { this._play('glass', { gain: .6, pan: .4 }); return; }
      const o = this.ctx.createOscillator(); o.frequency.value = 2600 + Math.random() * 400; const g = this.ctx.createGain(); g.gain.setValueAtTime(.35, this.t); g.gain.exponentialRampToValueAtTime(.001, this.t + .09);
      const p = this.ctx.createStereoPanner(); p.pan.value = .5; o.connect(g).connect(p).connect(this.master); o.start(); o.stop(this.t + .1);
      this.burst(.15, .04, 4000, 'highpass', .5);
    }, i * 330);
  }
  breath(dur = 2.6, gain = .35, pan = 0) {
    if (this.has('breath')) { this._play('breath', { gain, pan }); return; }
    const s = this._noiseSrc(); const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1.2;
    f.frequency.linearRampToValueAtTime(1100, this.t + dur * .45); f.frequency.linearRampToValueAtTime(500, this.t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, this.t); g.gain.linearRampToValueAtTime(gain, this.t + dur * .4); g.gain.linearRampToValueAtTime(gain * .2, this.t + dur * .55); g.gain.linearRampToValueAtTime(gain * .8, this.t + dur * .8); g.gain.linearRampToValueAtTime(0, this.t + dur);
    const p = this.ctx.createStereoPanner(); p.pan.value = pan;
    s.connect(f).connect(g).connect(p).connect(this.master); s.start(); s.stop(this.t + dur + .05);
  }
  static_(dur = .5, gain = .9) {
    if (this.has('static')) { this._play('static', { gain }); return; }
    const s = this._noiseSrc(); const ws = this.ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 6); } ws.curve = c;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, this.t); g.gain.setValueAtTime(gain, this.t + dur - .05); g.gain.linearRampToValueAtTime(0, this.t + dur);
    s.connect(ws).connect(g).connect(this.master); s.start(); s.stop(this.t + dur + .02);
  }
  breaker(on) {
    if (this.has('breaker')) { this._play('breaker', { gain: .8 }); return; }
    this.click(.6); this.thump(90, .5, .12);
    if (on) { const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 50; const f = this.ctx.createBiquadFilter(); f.frequency.value = 300; const g = this.ctx.createGain(); g.gain.value = .06; o.connect(f).connect(g).connect(this.master); o.start(); this._hum = { o, g }; }
    else if (this._hum) { this._hum.g.gain.linearRampToValueAtTime(0, this.t + .05); this._hum.o.stop(this.t + .1); this._hum = null; }
  }
  stinger(gain = 1) {                    // sursaut : bruit + chute grave + cri filtré
    if (this.has('scream')) { this._play('scream', { gain }); }
    this.static_(.35, gain * .8); this.thump(30, gain, 1.2);
    const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, this.t); o.frequency.exponentialRampToValueAtTime(90, this.t + .9);
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 3;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain * .5, this.t); g.gain.exponentialRampToValueAtTime(.001, this.t + 1);
    o.connect(f).connect(g).connect(this.master); o.start(); o.stop(this.t + 1.1);
  }
  laugh() {
    if (this.has('laugh')) { this._play('laugh', { gain: .8 }); return; }
    for (let i = 0; i < 9; i++) setTimeout(() => { const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(70 + i * 3, this.t); o.frequency.exponentialRampToValueAtTime(52, this.t + .16); const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; const g = this.ctx.createGain(); g.gain.setValueAtTime(.35, this.t); g.gain.exponentialRampToValueAtTime(.001, this.t + .17); o.connect(f).connect(g).connect(this.master); o.start(); o.stop(this.t + .2); }, i * (200 + i * 25));
  }
  birds() {
    if (this.has('birds')) { this._play('birds', { gain: .35, loop: true, fade: 6 }); return; }
    const tick = () => { if (!this.birdsOn) return; const o = this.ctx.createOscillator(); const f0 = 2200 + Math.random() * 1800; o.frequency.setValueAtTime(f0, this.t); o.frequency.exponentialRampToValueAtTime(f0 * (1.3 + Math.random() * .5), this.t + .08); o.frequency.exponentialRampToValueAtTime(f0 * .8, this.t + .16); const g = this.ctx.createGain(); g.gain.setValueAtTime(0, this.t); g.gain.linearRampToValueAtTime(.05, this.t + .03); g.gain.linearRampToValueAtTime(0, this.t + .18); const p = this.ctx.createStereoPanner(); p.pan.value = Math.random() * 1.6 - .8; o.connect(g).connect(p).connect(this.master); o.start(); o.stop(this.t + .2); setTimeout(tick, 200 + Math.random() * 1400); };
    this.birdsOn = true; tick();
  }
}
