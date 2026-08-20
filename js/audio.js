(function () {
  'use strict';

  class GameAudio {
    constructor(button) {
      this.button = button;
      this.context = null;
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
      if (this.context && this.context.state === 'suspended') {
        this.context.resume().catch(() => {});
      }
    }

    tone({ frequency, endFrequency, duration, type = 'sine', volume = 0.055 }) {
      if (this.muted) return;
      this.init();
      if (!this.context) return;

      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    jump() {
      this.tone({ frequency: 330, endFrequency: 560, duration: 0.09, type: 'sine' });
    }

    hit() {
      this.tone({ frequency: 150, endFrequency: 58, duration: 0.22, type: 'triangle', volume: 0.075 });
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

