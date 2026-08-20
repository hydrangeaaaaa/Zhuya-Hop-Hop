(function () {
  'use strict';

  class Player {
    constructor(images) {
      this.images = images;
      this.frame = 0;
      this.frameTimer = 0;
      this.verticalOffset = 0;
      this.verticalVelocity = 0;
      this.grounded = true;
      this.hit = false;
      this.centerX = 0;
      this.drawMetrics = null;
    }

    reset(worldWidth) {
      this.centerX = worldWidth * GameConfig.PLAYER_X_RATIO;
      this.frame = 0;
      this.frameTimer = 0;
      this.verticalOffset = 0;
      this.verticalVelocity = 0;
      this.grounded = true;
      this.hit = false;
    }

    resize(worldWidth) {
      this.centerX = worldWidth * GameConfig.PLAYER_X_RATIO;
    }

    jump() {
      if (!this.grounded || this.hit) return false;
      this.verticalVelocity = GameConfig.JUMP_VELOCITY;
      this.grounded = false;
      return true;
    }

    setHit() {
      this.hit = true;
      this.frameTimer = 0;
    }

    update(dt) {
      if (this.hit) return;

      if (!this.grounded) {
        this.verticalVelocity = Math.min(
          this.verticalVelocity + GameConfig.GRAVITY * dt,
          GameConfig.MAX_FALL_SPEED,
        );
        this.verticalOffset += this.verticalVelocity * dt;

        if (this.verticalVelocity > 0 && this.verticalOffset >= 0) {
          this.verticalOffset = 0;
          this.verticalVelocity = 0;
          this.grounded = true;
          this.frameTimer = 0;
        }
        return;
      }

      this.frameTimer += dt;
      if (this.frameTimer >= GameConfig.RUN_FRAME_DURATION) {
        this.frameTimer %= GameConfig.RUN_FRAME_DURATION;
        this.frame = 1 - this.frame;
      }
    }

    currentImage(gameState) {
      if (this.hit) return this.images.hit;
      if (gameState === 'ready' || !this.grounded) return this.images.idle;
      return this.frame === 0 ? this.images.run01 : this.images.run02;
    }

    draw(ctx, gameState) {
      const image = this.currentImage(gameState);
      const drawHeight = GameConfig.WORLD_HEIGHT * GameConfig.PLAYER_SCALE;
      const scale = drawHeight / image.naturalHeight;
      const drawWidth = image.naturalWidth * scale;
      const footMargin = GameConfig.PLAYER_SPRITE_FOOT_MARGIN * scale;
      const baseline = GameConfig.GROUND_Y + this.verticalOffset;
      const x = this.centerX - drawWidth / 2;
      const y = baseline - (drawHeight - footMargin);

      ctx.drawImage(image, x, y, drawWidth, drawHeight);
      this.drawMetrics = { x, y, width: drawWidth, height: drawHeight, baseline };

      if (GameConfig.DEBUG_HITBOX) {
        const box = this.getHitbox();
        ctx.save();
        ctx.strokeStyle = '#e05247';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.restore();
      }
    }

    getHitbox() {
      const visibleHeight = GameConfig.WORLD_HEIGHT * GameConfig.PLAYER_SCALE * 0.90;
      const width = GameConfig.WORLD_HEIGHT * GameConfig.PLAYER_SCALE * 0.34;
      const bottom = GameConfig.GROUND_Y + this.verticalOffset - 3;
      return {
        x: this.centerX - width / 2,
        y: bottom - visibleHeight * 0.70,
        width,
        height: visibleHeight * 0.70,
      };
    }
  }

  window.Player = Player;
})();

