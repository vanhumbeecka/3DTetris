# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

IsoBlocks (3DTetris): an isometric 3D Tetris written in ActionScript 3 in 2013 and published on Newgrounds. Flash Player is dead, so the game is served by running the compiled `3DTetris.swf` in the [Ruffle](https://ruffle.rs) emulator. The repo therefore has two independent halves:

1. **The Flash project** (`gameUI/`, `blocks/`, `algorithms/`, `graphics/`, `exceptions/`, the vendored `as3isolib/`, `eDpLib/`, `mx/`, plus `3DTetris.fla`). **It cannot be built here.** It needs Flash Builder (`.actionScriptProperties`, Flex 4.6, `playerglobal.swc` FP11.2) and Flash Professional for the `.fla`. Several classes are empty shells for Flash IDE library symbols whose graphics, timelines and sounds live only in the `.fla`/SWF: `Background`, `ScoreHud`, `PauseScreen`, `LoadingScreen`, `StartScreen`, `GameOver`, `MyStartButton`, and the `Sound` subclasses. Treat the `.as` sources as documentation of what the SWF does, not as something you can change and ship.
2. **The web wrapper** (`site/`, `scripts/`, `test/`, `package.json`, `.github/workflows/static.yml`). This is the part that is actually developed and deployed.

The shipped artifact is `3DTetris.swf` at the repo root (SWF version 15). `3DTetris_v01..v04.swf`, `bin-debug/3DTetris.swf` and `RECOVER_3DTetris.swf` are historical copies; `3DTetris.html` and `html-template/` are the original Flash embed and are unused.

## Commands

```sh
npm install
npm test                              # all tests (node:test)
node --test test/build.test.mjs       # one test file
node --test --test-name-pattern="wasm" "test/**/*.test.mjs"   # one test by name
npm run build                         # assembles build/ (gitignored)
npm start                             # build + serve build/ locally
```

Deploy: every push to `master` runs `static.yml` (test, build, upload `build/` to GitHub Pages). Pages is configured for workflow builds; the site is https://3dtetris.codemine.be/ (custom domain via Cloudflare-proxied CNAME to `vanhumbeecka.github.io`; the github.io URL redirects there).

## Web wrapper design

- `scripts/build.mjs` exports `build(outDir)` and is also the CLI. It copies `site/index.html`, `3DTetris.swf`, and the Ruffle runtime (`ruffle.js`, `core.ruffle.*.js`, `*.wasm`, licenses; no source maps) from the `@ruffle-rs/ruffle` npm package into `outDir/ruffle/`.
- Ruffle is **pinned** (`0.5.0`) and **self-hosted**; `test/build.test.mjs` fails if the page loads any script from an external URL. Bump the pin deliberately and re-smoke-test the game in a browser, since Ruffle's AS3 compatibility is what makes this work.
- `site/index.html` sets `upgradeToHttps: true`. The SWF calls `http://www.ngads.com/gateway_v2.php`; on the HTTPS-hosted page that URL must be upgraded or the browser blocks it as mixed content.

## Game architecture (inside the SWF)

Startup is gated on Newgrounds: `Main` shows `LoadingScreen`, `MyPreloader`/`Main` call `API.connect(...)`, and only the `API_CONNECTED` handler with `event.success` builds `Game` and starts it. If the gateway fails the game sits on "Loading.." forever (observed to be flaky about 1 in 3 loads; a reload fixes it). Medal unlocks in `ScoreHud` also go through the Newgrounds API.

The playfield is defined in `gameUI/GameData.as`: 6×6 grid, 13 cells high, 20px cells. Rendering is `as3isolib` (`IsoView` → `IsoScene` → `IsoBox` per block cell); `Game.onRender` calls `scene.render()` every frame.

Flow of a piece:

- `BlockCreator` picks one of `Block1`..`Block5` (each is 4 `IsoBox` parts positioned in its constructor; part 2 is the red centre part). Every block is created twice: once in the "next block" scene as a preview, once for play.
- `Block` handles movement, rotation (`blockStates/` holds the rotation-state objects) and collision via `BoundingBoxChecker` against the list of frozen parts. When it can't go down it `freeze()`s.
- `FrozenBlockContainer` takes the frozen parts, asks `PlaneChecker` for full XY planes, removes them, drops what's above, and dispatches `"PlaneRemoved"`.
- `Game` forwards that to `ScoreHud`, which updates score/planes/level and dispatches `"AdvanceLevel"`; `Game` shortens its step `Timer` delay by 10% per level and dispatches `"EndGame"` when spawning the next block throws `BlockCreationError`. `Main` shows `GameOver`, whose `"playAgain"` triggers `Game.restart()`.

"Rotate view" (Shift+arrows) is not a camera move: `IsoBlockTurner` rotates the coordinates of every frozen box and the active block around the grid centre. Components talk via string-named `Event`s (`"PlaneRemoved"`, `"AdvanceLevel"`, `"EndGame"`, `"playAgain"`), so grep for the string to find the listener.
