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

  playStrike(startTime, startFreq, endFreq, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

    gain.gain.setValueAtTime(this.volume * 0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playEat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Dual strike "Tung-Tung" drum sound
    this.playStrike(now, 160, 80, 0.12);
    this.playStrike(now + 0.14, 150, 75, 0.12);
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

    // Mega-megaphone horn buzzer blast!
    const now = this.ctx.currentTime;
    const frequencies = [200, 300, 400];
    frequencies.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, now + 0.1);
      osc.frequency.linearRampToValueAtTime(freq * 0.95, now + 0.2);

      gain.gain.setValueAtTime(this.volume * 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playAdhan() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Loud morning buzzer alarm (waking squad)
    const now = this.ctx.currentTime;
    const duration = 1.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);

    for (let t = 0; t < duration; t += 0.2) {
      osc.frequency.setValueAtTime(150, now + t);
      osc.frequency.setValueAtTime(100, now + t + 0.1);
    }

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }
}

export const soundManager = new SoundManager();
