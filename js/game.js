(function () {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  const context = canvas.getContext('2d', { alpha: false });
  const shell = document.getElementById('game-shell');
  const scoreElement = document.getElementById('score-value');
  const bestElement = document.getElementById('best-value');
  const soundButton = document.getElementById('sound-toggle');
  const statusElement = document.getElementById('game-status');

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function safeReadBest() {
    try {
      return Math.max(0, Number.parseInt(localStorage.getItem('littleRunnerBest') || '0', 10) || 0);
    } catch (_) {
      return 0;
    }
  }

  function safeSaveBest(value) {
    try {
      localStorage.setItem('littleRunnerBest', String(value));
    } catch (_) {
      // The game remains playable when storage is disabled or full.
    }
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load ${source}`));
      image.src = source;
    });
  }

  class LittleRunnerGame {
    constructor() {
      this.mode = 'loading';
      this.images = null;
      this.player = null;
      this.obstacles = new ObstacleSystem();
      this.audio = new GameAudio(soundButton);
      this.distance = 0;
      this.score = 0;
      this.best = safeReadBest();
      this.speed = GameConfig.BASE_SPEED;
      this.hitPause = 0;
      this.lastTime = performance.now();
      this.viewport = {
        cssWidth: 1,
        cssHeight: 1,
        worldWidth: 960,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        pixelRatio: 1,
      };

      bestElement.textContent = this.formatScore(this.best);
      scoreElement.textContent = this.formatScore(0);
      this.bindEvents();
      this.resize();
      this.load();
    }

    async load() {
      try {
        const [idle, run01, run02, hit] = await Promise.all([
          loadImage('assets/player/idle.png'),
          loadImage('assets/player/run_01.png'),
          loadImage('assets/player/run_02.png'),
          loadImage('assets/player/hit.png'),
        ]);
        this.images = { idle, run01, run02, hit };
        this.player = new Player(this.images);
        this.player.reset(this.viewport.worldWidth);
        this.mode = 'ready';
        this.setStatus('Ready. Tap, click, or press Space to start.');
      } catch (error) {
        this.mode = 'error';
        this.setStatus('The character images could not be loaded.');
      }
      this.lastTime = performance.now();
      requestAnimationFrame((time) => this.loop(time));
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize(), { passive: true });
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.lastTime = performance.now();
      });

      document.addEventListener('keydown', (event) => {
        if ((event.code === 'Space' || event.code === 'ArrowUp') && !event.repeat) {
          event.preventDefault();
          this.primaryAction();
        }
      });

      canvas.addEventListener(
        'pointerdown',
        (event) => {
          event.preventDefault();
          this.primaryAction();
        },
        { passive: false },
      );

      soundButton.addEventListener('pointerdown', (event) => event.stopPropagation());
      soundButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.audio.toggle();
      });
    }

    resize() {
      const rectangle = shell.getBoundingClientRect();
      const cssWidth = Math.max(1, Math.round(rectangle.width));
      const cssHeight = Math.max(1, Math.round(rectangle.height));
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * pixelRatio);
      canvas.height = Math.round(cssHeight * pixelRatio);

      const desiredWidth = GameConfig.WORLD_HEIGHT * (cssWidth / cssHeight);
      const worldWidth = clamp(
        desiredWidth,
        GameConfig.MIN_WORLD_WIDTH,
        GameConfig.MAX_WORLD_WIDTH,
      );
      const scale = Math.min(cssWidth / worldWidth, cssHeight / GameConfig.WORLD_HEIGHT);
      const offsetX = (cssWidth - worldWidth * scale) / 2;
      const offsetY = (cssHeight - GameConfig.WORLD_HEIGHT * scale) / 2;

      this.viewport = { cssWidth, cssHeight, worldWidth, scale, offsetX, offsetY, pixelRatio };
      if (this.player) this.player.resize(worldWidth);
    }

    primaryAction() {
      if (!this.player || this.mode === 'loading' || this.mode === 'error' || this.mode === 'hit-pause') {
        return;
      }

      this.audio.init();
      if (this.mode === 'ready') {
        this.start();
        this.tryJump();
      } else if (this.mode === 'running') {
        this.tryJump();
      } else if (this.mode === 'game-over') {
        this.restart();
      }
    }

    start() {
      this.mode = 'running';
      this.lastTime = performance.now();
      this.setStatus('Running. Tap, click, Space, or Arrow Up to jump.');
    }

    restart() {
      this.distance = 0;
      this.score = 0;
      this.speed = GameConfig.BASE_SPEED;
      this.hitPause = 0;
      this.obstacles.reset();
      this.player.reset(this.viewport.worldWidth);
      this.mode = 'running';
      scoreElement.textContent = this.formatScore(0);
      this.lastTime = performance.now();
      this.setStatus('Restarted.');
    }

    tryJump() {
      if (this.player.jump()) this.audio.jump();
    }

    triggerHit() {
      if (this.mode !== 'running') return;
      this.mode = 'hit-pause';
      this.hitPause = GameConfig.GAME_OVER_PAUSE;
      this.player.setHit();
      this.audio.hit();
      if (this.score > this.best) {
        this.best = this.score;
        safeSaveBest(this.best);
        bestElement.textContent = this.formatScore(this.best);
      }
      this.setStatus(`Game over. Score ${this.score}. Tap or press Space to restart.`);
    }

    finishGameOver() {
      this.mode = 'game-over';
    }

    update(dt) {
      if (this.mode === 'running') {
        this.speed = Math.min(
          GameConfig.BASE_SPEED + this.score * GameConfig.SPEED_INCREASE,
          GameConfig.MAX_SPEED,
        );
        this.player.update(dt);
        this.obstacles.update(dt, this.speed, this.viewport.worldWidth);
        this.distance += this.speed * dt;
        const nextScore = Math.floor(this.distance / GameConfig.SCORE_DISTANCE);
        if (nextScore !== this.score) {
          this.score = nextScore;
          scoreElement.textContent = this.formatScore(this.score);
        }
        if (this.obstacles.collides(this.player.getHitbox())) this.triggerHit();
      } else if (this.mode === 'hit-pause') {
        this.hitPause -= dt;
        if (this.hitPause <= 0) this.finishGameOver();
      }
    }

    loop(time) {
      const dt = clamp((time - this.lastTime) / 1000, 0, GameConfig.MAX_DELTA_TIME);
      this.lastTime = time;
      this.update(dt);
      this.draw();
      requestAnimationFrame((nextTime) => this.loop(nextTime));
    }

    beginWorldDraw() {
      const view = this.viewport;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = '#f4f0ea';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.setTransform(
        view.pixelRatio * view.scale,
        0,
        0,
        view.pixelRatio * view.scale,
        view.pixelRatio * view.offsetX,
        view.pixelRatio * view.offsetY,
      );
      context.fillStyle = '#fbfaf7';
      context.fillRect(0, 0, view.worldWidth, GameConfig.WORLD_HEIGHT);
    }

    drawGround() {
      const width = this.viewport.worldWidth;
      context.save();
      context.strokeStyle = '#5b5650';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(0, GameConfig.GROUND_Y + 0.5);
      context.lineTo(width, GameConfig.GROUND_Y + 0.5);
      context.stroke();

      const offset = -(this.distance % 74);
      context.strokeStyle = '#d7d1c9';
      context.lineWidth = 1;
      for (let x = offset; x < width + 74; x += 74) {
        context.beginPath();
        context.moveTo(x, GameConfig.GROUND_Y + 12);
        context.lineTo(x + 23, GameConfig.GROUND_Y + 12);
        context.stroke();
      }
      context.restore();
    }

    drawOverlay() {
      const centerX = this.viewport.worldWidth / 2;
      const centerY = 178;
      context.save();
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#332f2b';

      if (this.mode === 'loading') {
        context.font = '600 15px Arial, sans-serif';
        context.fillText('LOADING…', centerX, centerY);
      } else if (this.mode === 'ready') {
        context.font = '600 17px Arial, sans-serif';
        context.fillText('TAP / SPACE TO START', centerX, centerY);
        context.font = '12px Arial, sans-serif';
        context.fillStyle = '#7b746d';
        context.fillText('↑  SPACE  CLICK  TAP', centerX, centerY + 30);
      } else if (this.mode === 'game-over') {
        const boxWidth = Math.min(310, this.viewport.worldWidth - 40);
        context.fillStyle = 'rgba(251, 250, 247, 0.94)';
        context.fillRect(centerX - boxWidth / 2, centerY - 57, boxWidth, 120);
        context.strokeStyle = '#c8c1b9';
        context.lineWidth = 1;
        context.strokeRect(centerX - boxWidth / 2, centerY - 57, boxWidth, 120);
        context.fillStyle = '#332f2b';
        context.font = '700 22px Arial, sans-serif';
        context.fillText('GAME OVER', centerX, centerY - 20);
        context.font = '600 14px Arial, sans-serif';
        context.fillText('TAP TO RESTART', centerX, centerY + 22);
      } else if (this.mode === 'error') {
        context.font = '600 15px Arial, sans-serif';
        context.fillText('ASSET LOAD ERROR', centerX, centerY);
      }
      context.restore();
    }

    draw() {
      this.beginWorldDraw();
      this.drawGround();
      if (this.mode !== 'ready' && this.mode !== 'loading' && this.mode !== 'error') {
        this.obstacles.draw(context);
      }
      if (this.player) this.player.draw(context, this.mode);
      this.drawOverlay();
    }

    formatScore(value) {
      return String(value).padStart(5, '0');
    }

    setStatus(message) {
      statusElement.textContent = message;
    }
  }

  const game = new LittleRunnerGame();
  window.__littleRunnerGame = game;

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }
})();

