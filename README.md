3DTetris
========

3DTetris flash project. _(Actionscript 3)_

**Play it in your browser:** https://3dtetris.codemine.be/

## About

This game is already published on newgrounds, where it is called 'IsoBlocks':
http://www.newgrounds.com/portal/view/604911

It makes use of the as3isolib:
https://code.google.com/p/as3isolib/ <br>
Since it makes use of this library, this project falls under the same licences of this library.

Feel free to use, copy or alter this code in any way you want.

## Running it today

Flash Player is gone, but the compiled `3DTetris.swf` runs unmodified in
[Ruffle](https://ruffle.rs), a Flash emulator compiled to WebAssembly. The
`site/` folder holds the player page; `scripts/build.mjs` assembles a static
site from that page, the SWF and a self-hosted copy of the Ruffle runtime.

```sh
npm install
npm test        # verifies the build output
npm start       # builds into build/ and serves it locally
```

Pushes to `master` deploy `build/` to GitHub Pages via
`.github/workflows/static.yml`.

Rebuilding the SWF from the ActionScript sources requires Flash Builder /
Flash Professional and is not covered here.
