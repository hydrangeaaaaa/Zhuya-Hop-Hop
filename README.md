# Little Runner

A small, responsive endless runner for desktop and mobile browsers. The game
uses four supplied hand-drawn character frames, Canvas-drawn obstacles, and
Web Audio API tones. It has no external runtime dependencies or network-loaded
assets.

## Start the game

For a quick desktop check, open `index.html` in a browser. Gameplay works when
opened directly from disk.

For offline installation and service-worker testing, serve the folder over
HTTP. One option is:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080/`.

Controls:

- Desktop: Space, Arrow Up, mouse click
- Mobile: tap the game area
- Sound: select the top-right speaker button

There is no double jump. The player must land before jumping again.

## Adjust the character size

Open `js/config.js` and change:

```js
PLAYER_SCALE: 0.20,
```

This is the sprite canvas height as a fraction of the 420-unit game height.
Because the aligned sprite includes a small transparent safety margin, the
current visible character is approximately 17–19% of the game area. Try
`0.18` for smaller or `0.22` for larger.

## Adjust the jump

Open `js/config.js`:

```js
GRAVITY: 1800,
JUMP_VELOCITY: -570,
MAX_FALL_SPEED: 900,
```

A more negative `JUMP_VELOCITY` jumps higher. A larger `GRAVITY` produces a
shorter, sharper jump. Change one value at a time and keep the velocity
negative.

## Adjust game speed

Open `js/config.js`:

```js
BASE_SPEED: 250,
MAX_SPEED: 480,
SPEED_INCREASE: 0.45,
```

`BASE_SPEED` is the starting speed. `MAX_SPEED` is the hard cap.
`SPEED_INCREASE` controls how slowly the speed rises with score.

Obstacle gaps include a physics-derived safety minimum based on jump airtime,
so later combinations remain theoretically passable.

## Debug collision boxes

In `js/config.js`, change:

```js
DEBUG_HITBOX: true,
```

Red shows the player hitbox and blue shows obstacle hitboxes.

## Replace obstacles later

Obstacle creation, drawing, movement, safe spacing, and collision are isolated
in `js/obstacles.js`. The `renderers` object maps an obstacle type to its Canvas
renderer. To use your own PNG later:

1. Put the PNG in `assets/obstacles/`.
2. Preload it in `js/game.js` alongside the player images.
3. Add a renderer in `js/obstacles.js` that calls `drawImage`.
4. Set that obstacle's `width`, `height`, and `getHitbox` inset.

No player or game-loop code needs to change.

## Publish as a link

Any static website host works because the project has no build step.

For GitHub Pages:

1. Create a GitHub repository and upload the contents of this folder.
2. Open the repository's **Settings → Pages**.
3. Choose **Deploy from a branch**, select the main branch and root folder.
4. GitHub will provide an HTTPS link after deployment.

HTTPS also enables installation. On Android Chrome, choose **Install app** or
**Add to Home screen**. On iPhone Safari, choose **Share → Add to Home Screen**.

## Assets and licensing

- Player artwork: four user-supplied original images, technically cropped,
  background-cleared, and aligned without redrawing.
- Obstacles: original Canvas geometry in this project.
- Sounds: generated at runtime with the Web Audio API.
- Game logic foundation: Rabbit Run by Vivek Naskar, MIT License.

See `THIRD_PARTY_NOTICES.md` and `LICENSE`.

