# Test Report

Date: 2026-08-20

Automated browser tests were run with:

- Google Chrome 151.0.7922.138
- Microsoft Edge 151.0.4129.93
- Desktop viewport: 1280 × 800
- Mobile portrait viewport with touch: 390 × 844

Passed checks:

1. Page and all four character images load without console or page errors.
2. All four sprites use the same 340 × 481 transparent canvas.
3. All four character-content bounds end on the same foot baseline.
4. Ready screen uses `idle.png`.
5. Space starts the game and performs a physical jump.
6. Arrow Up, pointer click, and touch use the same input path.
7. Jumping uses `idle.png` and changes the player's vertical world position.
8. A second jump request in the air does not change vertical velocity.
9. Landing restores the `run_01.png` / `run_02.png` animation.
10. Obstacles spawn and move from right to left.
11. Sampled obstacle gaps at base, middle, and maximum speed all meet the
    physics-derived minimum landing interval.
12. Collision changes immediately to `hit.png`.
13. Game Over and in-place restart work.
14. Score advances and Best persists after a page reload.
15. The sound toggle switches between on and muted states.
16. The manifest and both install icons load correctly.
17. After initial caching, the PWA reloads and starts by touch with networking
    disabled.
18. Direct `file://` opening, start, and jump work without a local server.
19. Runtime HTML, CSS, JavaScript, and manifest files contain no external URL.
20. JavaScript syntax checks pass.
21. The included MIT License matches the source repository's LICENSE text.

Safari note: Windows cannot run Apple's Safari browser. The implementation uses
standard Canvas, Pointer Events, localStorage, Service Worker, and Web Audio
APIs, includes the `webkitAudioContext` fallback, and avoids external fonts and
frameworks. A final tap-through on a real iPhone/iPad or Mac Safari is still
recommended after publishing.

