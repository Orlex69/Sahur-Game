class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.5;
  }

  init() {
    if (this.ctx) return;
    // Initialize AudioContext on first user interaction
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playEat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1200,
      this.ctx.currentTime + 0.08
    );

    gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playEject() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      150,
      this.ctx.currentTime + 0.12
    );

    gain.gain.setValueAtTime(this.volume * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playSplit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(this.volume * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playExplode() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Synthesize brown noise explosion
    const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Filter to approximate brown noise
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Amplify
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noiseNode.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start();
  }

  playEatPlayer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // MLG Airhorn synth (multi-oscillator blast!)
    const frequencies = [293.66, 392.0, 440.0, 587.33]; // D4, G4, A4, D5 chord
    const now = this.ctx.currentTime;

    frequencies.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Pitch wobble
      osc.frequency.linearRampToValueAtTime(freq * 1.02, now + 0.05);
      osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 0.12);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.25);

      gain.gain.setValueAtTime(this.volume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.25);
    });
  }

  playAdhan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Siren alarm alert for Fajr pre-dawn call
    const now = this.ctx.currentTime;
    const duration = 1.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    // Pulsating siren pitch
    for (let t = 0; t < duration; t += 0.3) {
      osc.frequency.linearRampToValueAtTime(650, now + t + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + t + 0.3);
    }

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + duration - 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(now + duration);
  }
}

export const soundManager = new SoundManager();
