# 🎮 Word Hunt

A mobile-first, pixel/8-bit daily word game. Every game deals a **fresh random
4×4 grid** — swipe to connect adjacent letters into words and rack up the
highest score in **80 seconds**. Play again as many times as you like, beat your
best, and share it. No login, no accounts — open and play.

Built with **Next.js (App Router)** + **TypeScript** and instrumented with
**Vercel Analytics**. The whole game runs client-side; there's no backend.

## Features

- 🕹️ **Swipe to spell** — GamePigeon-style touch/mouse drag with backtracking and
  a live colored trail (green = valid word, gold = already found, red = miss).
- 🎲 **A new board every game** — no two grids repeat.
- ⏱️ **80-second rounds** with a chunky retro timer bar and end-of-round panic.
- 🪙 **Steep length-based scoring** so chasing long words pays off.
- 📖 **Real dictionary** — the full ENABLE word list (~170k words).
- 🏆 **End screen** shows every word you missed and your % of the best possible
  score, plus a one-tap share.
- 👾 **Full 8-bit Mario aesthetic** — pixel fonts, `?`-block tiles, sky + clouds
  + ground.

## Run locally

```bash
git clone https://github.com/TSKVenkat/word-hunt.git
cd word-hunt
npm install
npm run dev      # http://localhost:3000
```

## How it works

- **Random board every game** — `lib/grid.ts` rolls the classic 16-die Boggle
  set through a `mulberry32` PRNG seeded fresh on each start.
- **Swipe to select** — `components/Board.tsx` uses pointer events with center
  hit-testing for a precise swipe (with backtracking). Touch and mouse.
- **Scoring** — length-based and steep (`lib/scoring.ts`): 3 letters = 100,
  scaling to 2200+ for 8-letter monsters.
- **Validation** — the ENABLE word list (3–16 letters) ships as
  `public/dictionary.txt` and is loaded into a `Set` for instant lookups.
- **End screen** — `lib/solver.ts` finds every valid word on the board.

## Deploy to Vercel

```bash
vercel            # or import the repo at vercel.com/new
```

Vercel Analytics works automatically once deployed. Best score is kept in the
browser's `localStorage`.

## Refresh the dictionary

```bash
node scripts/build-dictionary.mjs
```

## Tech

Next.js 15 · React 19 · TypeScript · Vercel Analytics · zero runtime
dependencies beyond the framework.
