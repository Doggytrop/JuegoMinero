// Audio sintetizado con Web Audio API (sin archivos externos):
// efectos con osciladores/ruido y una música chiptune distinta por zona.
const PATTERNS = [
  { notes: [57, 60, 64, 67, 64, 60, 62, 0, 57, 60, 64, 69, 67, 64, 62, 0], dur: 0.22, type: 'triangle', vol: 0.05, bass: [45, 41, 43, 40] },
  { notes: [64, 0, 71, 0, 76, 0, 71, 0, 67, 0, 74, 0, 79, 0, 74, 0], dur: 0.28, type: 'sine', vol: 0.06, bass: [40, 43] },
  { notes: [57, 0, 0, 60, 0, 0, 56, 0, 57, 0, 0, 63, 0, 62, 0, 0], dur: 0.3, type: 'square', vol: 0.025, bass: [33, 32] },
  { notes: [62, 69, 74, 77, 81, 77, 74, 69, 60, 67, 72, 76, 79, 76, 72, 67], dur: 0.25, type: 'triangle', vol: 0.045, bass: [38, 36] },
];

export class Sfx {
  constructor() { this.ctx = null; this.enabled = true; this.musicOn = true; this.zone = 0; this.timer = null; }

  // Los navegadores exigen una interacción del usuario antes de reproducir audio
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startMusic();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
  toggleMusic() { this.musicOn = !this.musicOn; return this.musicOn; }
  setZone(z) { this.zone = z; }

  tone(freq, dur, type = 'square', vol = 0.3, slideTo = null, delay = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, vol, freq, type = 'lowpass', delay = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.4); src.stop(t + dur);
  }

  // --- Efectos
  dig(hard) { this.noise(0.06, 0.28, 500 + hard * 300); }
  breakBlock() { this.noise(0.12, 0.32, 1800); this.tone(140, 0.08, 'triangle', 0.2, 70); }
  ore() { this.tone(660, 0.08, 'square', 0.16); this.tone(990, 0.12, 'square', 0.16, null, 0.07); }
  gem() { [880, 1175, 1568].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.2, null, i * 0.06)); }
  sell() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.24, null, i * 0.08)); }
  hurt() { this.tone(260, 0.3, 'sawtooth', 0.28, 50); this.noise(0.15, 0.2, 500); }
  beep() { this.tone(880, 0.06, 'square', 0.12); }
  upgrade() { this.tone(300, 0.3, 'triangle', 0.3, 1200); }
  bump() { this.tone(90, 0.06, 'square', 0.12); }
  ladder() { this.tone(520, 0.03, 'square', 0.1); this.noise(0.03, 0.12, 3000, 'highpass'); }
  land() { this.noise(0.06, 0.2, 400); }
  thud() { this.tone(80, 0.18, 'sine', 0.4, 40); this.noise(0.12, 0.3, 300); }
  rumble() { this.noise(0.5, 0.25, 200); }
  fuse() { this.noise(0.4, 0.12, 4000, 'highpass'); this.tone(1200, 0.05, 'square', 0.08); }
  explode() { this.noise(0.9, 0.6, 500); this.tone(70, 0.6, 'sine', 0.6, 30); }
  sizzle() { this.noise(0.15, 0.12, 2500, 'highpass'); }
  page() { this.noise(0.12, 0.15, 2000, 'bandpass'); this.tone(700, 0.15, 'sine', 0.1, 900); }
  quest() { [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'square', 0.14, null, i * 0.07)); }
  achievement() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.22, null, i * 0.09)); }
  zoneEnter() { this.tone(110, 1.2, 'sawtooth', 0.12, 220); this.tone(165, 1.2, 'triangle', 0.15, 330); }
  radio() { this.tone(1400, 0.05, 'square', 0.08); this.tone(1000, 0.05, 'square', 0.08, null, 0.08); }
  over() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.28, 'square', 0.2, null, i * 0.22)); }
  victory() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.25, null, i * 0.15)); }

  // --- Música: secuenciador con "lookahead" (programa notas un poco antes de tiempo)
  startMusic() {
    if (this.timer) return;
    this.nextT = this.ctx.currentTime + 0.2; this.step = 0;
    this.timer = setInterval(() => this.schedule(), 100);
  }
  schedule() {
    if (!this.ctx) return;
    const pat = PATTERNS[this.zone];
    while (this.nextT < this.ctx.currentTime + 0.3) {
      if (this.musicOn && this.enabled) {
        const n = pat.notes[this.step % pat.notes.length];
        if (n) this.note(n, this.nextT, pat.dur * 0.9, pat.type, pat.vol);
        if (this.step % 8 === 0) this.note(pat.bass[(this.step / 8) % pat.bass.length], this.nextT, pat.dur * 7, 'triangle', 0.06);
      }
      this.nextT += pat.dur; this.step++;
    }
  }
  note(midi, t, dur, type, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }
}
