(function () {
  'use strict';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (start, end, amount) => start + (end - start) * amount;

  class ObstacleSystem {
    constructor() {
      this.items = [];
      this.distanceUntilNext = GameConfig.FIRST_OBSTACLE_DISTANCE;
      this.renderers = {
        rock: this.drawRock.bind(this),
        box: this.drawBox.bind(this),
        bollard: this.drawBollard.bind(this),
        grass: this.drawGrass.bind(this),
      };
    }

    reset() {
      this.items = [];
      this.distanceUntilNext = GameConfig.FIRST_OBSTACLE_DISTANCE;
    }

    safeGap(speed) {
      const speedProgress = clamp(
        (speed - GameConfig.BASE_SPEED) / (GameConfig.MAX_SPEED - GameConfig.BASE_SPEED),
        0,
        1,
      );
      const difficultyMin = lerp(
        GameConfig.MIN_OBSTACLE_GAP,
        GameConfig.MIN_GAP_AT_MAX_SPEED,
        speedProgress,
      );
      const difficultyMax = lerp(
        GameConfig.MAX_OBSTACLE_GAP,
        GameConfig.MAX_GAP_AT_MAX_SPEED,
        speedProgress,
      );
      const flightTime = (2 * Math.abs(GameConfig.JUMP_VELOCITY)) / GameConfig.GRAVITY;
      const physicsMinimum = speed * (flightTime + GameConfig.LANDING_RECOVERY_TIME);
      const minimum = Math.max(difficultyMin, physicsMinimum);
      return minimum + Math.random() * Math.max(30, difficultyMax - minimum);
    }

    create(worldWidth) {
      const types = [
        { type: 'rock', width: 44, height: 25 },
        { type: 'box', width: 40, height: 39 },
        { type: 'bollard', width: 34, height: 47 },
        { type: 'grass', width: 50, height: 28 },
      ];
      const shape = types[Math.floor(Math.random() * types.length)];
      this.items.push({ ...shape, x: worldWidth + shape.width, bottom: GameConfig.GROUND_Y });
    }

    update(dt, speed, worldWidth) {
      const movement = speed * dt;
      this.distanceUntilNext -= movement;
      if (this.distanceUntilNext <= 0) {
        this.create(worldWidth);
        this.distanceUntilNext = this.safeGap(speed);
      }

      for (const obstacle of this.items) obstacle.x -= movement;
      this.items = this.items.filter((obstacle) => obstacle.x + obstacle.width > -20);
    }

    draw(ctx) {
      for (const obstacle of this.items) {
        this.renderers[obstacle.type](ctx, obstacle);
        if (GameConfig.DEBUG_HITBOX) {
          const box = this.getHitbox(obstacle);
          ctx.save();
          ctx.strokeStyle = '#3977d1';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(box.x, box.y, box.width, box.height);
          ctx.restore();
        }
      }
    }

    collides(playerBox) {
      return this.items.some((obstacle) => {
        const box = this.getHitbox(obstacle);
        return (
          playerBox.x < box.x + box.width &&
          playerBox.x + playerBox.width > box.x &&
          playerBox.y < box.y + box.height &&
          playerBox.y + playerBox.height > box.y
        );
      });
    }

    getHitbox(obstacle) {
      const insetX = obstacle.type === 'grass' ? 8 : 4;
      const insetTop = obstacle.type === 'rock' ? 7 : 3;
      return {
        x: obstacle.x + insetX,
        y: obstacle.bottom - obstacle.height + insetTop,
        width: obstacle.width - insetX * 2,
        height: obstacle.height - insetTop,
      };
    }

    drawRock(ctx, obstacle) {
      const { x, bottom, width, height } = obstacle;
      ctx.save();
      ctx.fillStyle = '#aaa39a';
      ctx.strokeStyle = '#625d57';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, bottom);
      ctx.quadraticCurveTo(x + 5, bottom - height * 0.58, x + width * 0.28, bottom - height * 0.72);
      ctx.quadraticCurveTo(x + width * 0.48, bottom - height, x + width * 0.68, bottom - height * 0.65);
      ctx.quadraticCurveTo(x + width * 0.9, bottom - height * 0.5, x + width - 2, bottom);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + width * 0.42, bottom - height * 0.66);
      ctx.lineTo(x + width * 0.58, bottom - height * 0.33);
      ctx.strokeStyle = '#817a72';
      ctx.stroke();
      ctx.restore();
    }

    drawBox(ctx, obstacle) {
      const { x, bottom, width, height } = obstacle;
      ctx.save();
      ctx.fillStyle = '#c9aa7d';
      ctx.strokeStyle = '#665744';
      ctx.lineWidth = 2;
      ctx.fillRect(x + 1, bottom - height, width - 2, height);
      ctx.strokeRect(x + 1, bottom - height, width - 2, height);
      ctx.beginPath();
      ctx.moveTo(x + 3, bottom - height + 4);
      ctx.lineTo(x + width - 3, bottom - 4);
      ctx.moveTo(x + width - 3, bottom - height + 4);
      ctx.lineTo(x + 3, bottom - 4);
      ctx.strokeStyle = '#9d7f58';
      ctx.stroke();
      ctx.restore();
    }

    drawBollard(ctx, obstacle) {
      const { x, bottom, width, height } = obstacle;
      ctx.save();
      ctx.fillStyle = '#cf765d';
      ctx.strokeStyle = '#6e5148';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + width * 0.38, bottom - height);
      ctx.lineTo(x + width * 0.62, bottom - height);
      ctx.lineTo(x + width * 0.78, bottom - 5);
      ctx.lineTo(x + width * 0.22, bottom - 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f2ded5';
      ctx.fillRect(x + width * 0.3, bottom - height * 0.58, width * 0.4, 7);
      ctx.fillStyle = '#81766e';
      ctx.fillRect(x + 2, bottom - 5, width - 4, 5);
      ctx.restore();
    }

    drawGrass(ctx, obstacle) {
      const { x, bottom, width, height } = obstacle;
      ctx.save();
      ctx.fillStyle = '#87906c';
      ctx.strokeStyle = '#60684d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, bottom);
      ctx.quadraticCurveTo(x + 5, bottom - height * 0.65, x + width * 0.23, bottom - height * 0.38);
      ctx.quadraticCurveTo(x + width * 0.31, bottom - height, x + width * 0.47, bottom - height * 0.44);
      ctx.quadraticCurveTo(x + width * 0.63, bottom - height * 0.9, x + width * 0.72, bottom - height * 0.35);
      ctx.quadraticCurveTo(x + width * 0.91, bottom - height * 0.7, x + width - 2, bottom);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  window.ObstacleSystem = ObstacleSystem;
})();

