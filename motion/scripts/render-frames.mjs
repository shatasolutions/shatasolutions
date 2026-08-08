#!/usr/bin/env node
// Deterministic frame renderer: scrubs the built app to ?t= and screenshots each
// frame with headless Chrome. Requires `npx vite build` first and a static server
// on PORT (default 8752). Frames land in scratch dir FRAMES_DIR (not committed).

import { execFile } from "node:child_process";
import { mkdirSync } from "node:fs";
import { promisify } from "node:util";

const run = promisify(execFile);
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = process.env.PORT ?? "8752";
const FPS = Number(process.env.FPS ?? 12);
const LOOP = 11; // keep in sync with src/tokens.ts
const OUT = process.env.FRAMES_DIR ?? "frames";
const FRAMES = Math.round(LOOP * FPS);

mkdirSync(OUT, { recursive: true });

async function capture(i) {
  const t = (i / FPS).toFixed(4);
  const name = `${OUT}/f${String(i).padStart(4, "0")}.png`;
  await run(CHROME, [
    "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    "--window-size=1280,480", `--virtual-time-budget=4000`,
    `--screenshot=${name}`, `http://localhost:${PORT}/index.html?t=${t}`,
  ]);
}

const POOL = 4;
let next = 0;
async function worker() {
  while (next < FRAMES) {
    const i = next++;
    await capture(i);
    if (i % 12 === 0) console.log(`frame ${i}/${FRAMES}`);
  }
}
await Promise.all(Array.from({ length: POOL }, worker));
console.log(`rendered ${FRAMES} frames at ${FPS} fps → ${OUT}/`);
