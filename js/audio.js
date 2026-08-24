(function () {
  'use strict';

  class GameAudio {
    constructor(button) {
      this.button = button;
      this.context = null;
      this.resumePromise = null;
      try {
        this.muted = localStorage.getItem('littleRunnerMuted') === 'true';
      } catch (_) {
        this.muted = false;
      }
      this.updateButton();
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

    jump() {
      this.tone({ frequency: 340, endFrequency: 680, duration: 0.13, type: 'sine', volume: 0.18 });
    }

    hit() {
      this.tone({ frequency: 170, endFrequency: 52, duration: 0.28, type: 'triangle', volume: 0.24 });
    }

    toggle() {
      this.muted = !this.muted;
      try {
        localStorage.setItem('littleRunnerMuted', String(this.muted));
      } catch (_) {
        // Muting still works for this session when storage is unavailable.
      }
      if (!this.muted) this.init();
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

