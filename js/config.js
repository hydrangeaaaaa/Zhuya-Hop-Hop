(function () {
  'use strict';

  // All gameplay values use world units and seconds. Rendering scale does not
  // affect physics, so the jump feels the same on phones and computers.
  window.GameConfig = Object.freeze({
    WORLD_HEIGHT: 420,
    MIN_WORLD_WIDTH: 360,
    MAX_WORLD_WIDTH: 1180,
    GROUND_Y: 342,

    PLAYER_X_RATIO: 0.22,
    PLAYER_SCALE: 0.20,
    PLAYER_SPRITE_FOOT_MARGIN: 22,
    RUN_FRAME_DURATION: 0.13,

    GRAVITY: 1800,
    JUMP_VELOCITY: -570,
    MAX_FALL_SPEED: 900,

    BASE_SPEED: 250,
    MAX_SPEED: 480,
    SPEED_INCREASE: 0.45,
    SCORE_DISTANCE: 25,

    MIN_OBSTACLE_GAP: 350,
    MAX_OBSTACLE_GAP: 580,
    MIN_GAP_AT_MAX_SPEED: 300,
    MAX_GAP_AT_MAX_SPEED: 470,
    LANDING_RECOVERY_TIME: 0.16,
    FIRST_OBSTACLE_DISTANCE: 520,

    GAME_OVER_PAUSE: 0.42,
    MAX_DELTA_TIME: 0.033,
    DEBUG_HITBOX: false,
  });
})();

