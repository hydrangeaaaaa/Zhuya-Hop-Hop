(function () {
  'use strict';

  const AUDIO_SAMPLE_RATE = 16000;

  function writeAscii(view, offset, value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  function makeToneDataUri({ frequency, endFrequency, duration, volume, triangle = false }) {
    const sampleCount = Math.max(1, Math.floor(AUDIO_SAMPLE_RATE * duration));
    const buffer = new ArrayBuffer(44 + sampleCount * 2);
    const view = new DataView(buffer);
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + sampleCount * 2, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, AUDIO_SAMPLE_RATE, true);
    view.setUint32(28, AUDIO_SAMPLE_RATE * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, sampleCount * 2, true);

    let phase = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const progress = index / sampleCount;
      const currentFrequency = frequency + (endFrequency - frequency) * progress;
      phase += currentFrequency / AUDIO_SAMPLE_RATE;
      const sine = Math.sin(phase * Math.PI * 2);
      const wave = triangle ? (2 / Math.PI) * Math.asin(sine) : sine;
      const attack = Math.min(1, progress / 0.035);
      const decay = Math.pow(1 - progress, 1.5);
      const sample = Math.max(-1, Math.min(1, wave * volume * attack * decay));
      view.setInt16(44 + index * 2, Math.round(sample * 32767), true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 1024) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 1024));
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }

  class GameAudio {
    constructor(button) {
      this.button = button;
      this.context = null;
      this.resumePromise = null;
      this.jumpElement = this.createAudioElement({
        frequency: 340,
        endFrequency: 720,
        duration: 0.15,
        volume: 0.58,
      });
      this.hitElement = this.createAudioElement({
        frequency: 180,
        endFrequency: 48,
        duration: 0.30,
        volume: 0.68,
        triangle: true,
      });
      try {
        this.muted = localStorage.getItem('littleRunnerMuted') === 'true';
      } catch (_) {
        this.muted = false;
      }
      this.updateButton();
    }

    createAudioElement(options) {
      try {
        if (typeof Audio === 'undefined') return null;
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = 0.9;
        audio.src = makeToneDataUri(options);
        audio.load();
        return audio;
      } catch (_) {
        return null;
      }
    }

    init() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      }
      if (!this.context) return Promise.resolve(false);
      if (this.context.state === 'running') return Promise.resolve(true);
      if (this.context.state === 'closed') return Promise.resolve(false);

      if (!this.resumePromise) {
        this.resumePromise = this.context
          .resume()
          .then(() => this.context.state === 'running')
          .catch(() => false)
          .finally(() => {
            this.resumePromise = null;
          });
      }
      return this.resumePromise;
    }

    tone({ frequency, endFrequency, duration, type = 'sine', volume = 0.055 }) {
      if (this.muted) return;
      this.init().then((ready) => {
        if (!ready || this.muted || !this.context) return;

        const now = this.context.currentTime + 0.005;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(now);
        oscillator.stop(now + duration + 0.01);
      });
    }

    playSound(element, options) {
      if (this.muted) return;
      this.init();
      if (!element) {
        this.tone(options);
        return;
      }

      try {
        element.pause();
        element.currentTime = 0;
        const attempt = element.play();
        if (attempt && typeof attempt.catch === 'function') {
          attempt.catch(() => this.tone(options));
        }
      } catch (_) {
        this.tone(options);
      }
    }

    jump() {
      this.playSound(this.jumpElement, {
        frequency: 340,
        endFrequency: 720,
        duration: 0.15,
        type: 'sine',
        volume: 0.22,
      });
    }

    hit() {
      this.playSound(this.hitElement, {
        frequency: 180,
        endFrequency: 48,
        duration: 0.30,
        type: 'triangle',
        volume: 0.28,
      });
    }

    toggle() {
      this.muted = !this.muted;
      try {
        localStorage.setItem('littleRunnerMuted', String(this.muted));
      } catch (_) {
        // Muting still works for this session when storage is unavailable.
      }
      if (!this.muted) {
        this.init();
      } else {
        for (const element of [this.jumpElement, this.hitElement]) {
          if (!element) continue;
          element.pause();
          element.currentTime = 0;
        }
      }
      this.updateButton();
      return this.muted;
    }

    updateButton() {
      if (!this.button) return;
      this.button.textContent = this.muted ? '🔇' : '🔊';
      this.button.setAttribute('aria-label', this.muted ? 'Turn sound on' : 'Turn sound off');
      this.button.setAttribute('aria-pressed', String(this.muted));
    }
  }

  window.GameAudio = GameAudio;
})();

