(function () {
  'use strict';

  class GameAudio {
    constructor(button) {
      this.button = button;
      this.context = null;
      this.masterGain = null;
      this.musicTimer = null;
      this.musicIndex = 0;
      this.nextMusicTime = 0;
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
        if (AudioContext) {
          this.context = new AudioContext();
          this.masterGain = this.context.createGain();
          this.masterGain.gain.value = this.muted ? 0 : 1;
          this.masterGain.connect(this.context.destination);
        }
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
      gain.connect(this.masterGain);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    startMusic() {
      if (this.muted || this.musicTimer) return;
      this.init();
      if (!this.context) return;

      const begin = () => {
        if (this.muted || this.musicTimer) return;
        this.musicIndex = 0;
        this.nextMusicTime = this.context.currentTime + 0.04;
        this.scheduleMusic();
        this.musicTimer = window.setInterval(() => this.scheduleMusic(), 80);
      };

      if (this.context.state === 'running') {
        begin();
      } else {
        this.context.resume().then(begin).catch(() => {});
      }
    }

    stopMusic() {
      if (this.musicTimer) window.clearInterval(this.musicTimer);
      this.musicTimer = null;
      this.musicIndex = 0;
    }

    scheduleMusic() {
      if (!this.context || this.muted || this.context.state !== 'running') return;
      const notes = GameConfig.MUSIC_NOTES;
      const step = GameConfig.MUSIC_STEP_DURATION;
      const scheduleUntil = this.context.currentTime + 0.2;

      while (this.nextMusicTime < scheduleUntil) {
        const frequency = notes[this.musicIndex];
        if (frequency) this.musicNote(frequency, this.nextMusicTime, step * 0.76);
        this.musicIndex = (this.musicIndex + 1) % notes.length;
        this.nextMusicTime += step;
      }
    }

    musicNote(frequency, startTime, duration) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(GameConfig.MUSIC_VOLUME, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.02);
    }

    applyMuteState() {
      if (!this.context || !this.masterGain) return;
      const now = this.context.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.012);
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
      if (this.muted) {
        this.stopMusic();
      } else {
        this.init();
      }
      this.applyMuteState();
      if (!this.muted) this.startMusic();
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

