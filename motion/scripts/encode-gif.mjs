#!/usr/bin/env node
// Encodes rendered PNG frames into the GitHub-delivery GIF (gifenc, one global
// palette sampled across the loop for stability, no dithering — the brand's
// dark flat fields quantize cleanly). Usage: node scripts/encode-gif.mjs [scale]

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { decode } from "fast-png";
import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;

const DIR = process.env.FRAMES_DIR ?? "frames";
const FPS = Number(process.env.FPS ?? 12);
const SCALE = Number(process.argv[2] ?? 1);
const OUT = process.env.GIF_OUT ?? "../assets/hero-motion.gif";

const files = readdirSync(DIR).filter((f) => f.endsWith(".png")).sort();
if (!files.length) throw new Error(`no frames in ${DIR}`);

function loadRGBA(file) {
  const { data, width, height } = decode(readFileSync(`${DIR}/${file}`));
  let rgba = data, w = width, h = height;
  if (data.length === width * height * 3) {
    rgba = new Uint8Array(width * height * 4);
    for (let i = 0, j = 0; j < data.length; i += 4, j += 3) {
      rgba[i] = data[j]; rgba[i + 1] = data[j + 1]; rgba[i + 2] = data[j + 2]; rgba[i + 3] = 255;
    }
  }
  if (SCALE !== 1) {
    const sw = Math.round(w * SCALE), sh = Math.round(h * SCALE);
    const out = new Uint8Array(sw * sh * 4);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const sx = Math.min(w - 1, Math.round(x / SCALE)), sy = Math.min(h - 1, Math.round(y / SCALE));
        const si = (sy * w + sx) * 4, di = (y * sw + x) * 4;
        out[di] = rgba[si]; out[di + 1] = rgba[si + 1]; out[di + 2] = rgba[si + 2]; out[di + 3] = 255;
      }
    }
    return { rgba: out, w: sw, h: sh };
  }
  return { rgba, w, h };
}

// Build one global palette from frames sampled across the whole loop.
const samples = [];
for (let i = 0; i < files.length; i += Math.ceil(files.length / 8)) samples.push(loadRGBA(files[i]).rgba);
const merged = new Uint8Array(samples.reduce((n, s) => n + s.length, 0));
samples.reduce((off, s) => (merged.set(s, off), off + s.length), 0);
const palette = quantize(merged, 256);

const gif = GIFEncoder();
const delay = Math.round(1000 / FPS);
let dims;
for (const [i, f] of files.entries()) {
  const { rgba, w, h } = loadRGBA(f);
  dims = { w, h };
  gif.writeFrame(applyPalette(rgba, palette), w, h, { palette, delay, repeat: 0 });
  if (i % 24 === 0) console.log(`encoded ${i}/${files.length}`);
}
gif.finish();
const buf = Buffer.from(gif.bytes());
writeFileSync(OUT, buf);
console.log(`${OUT}: ${dims.w}x${dims.h}, ${files.length} frames @ ${FPS}fps, ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
