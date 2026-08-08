# Motion Hero

Cinematic Shata Solutions hero. The animation source is **Motion for React**
(`import { motion, AnimatePresence } from "motion/react"`); brand tokens come from
`shatasolutions/.github` `handbook/17-visual-identity.md` (mirrored in
`src/tokens.ts`).

## Architecture

- `src/Hero.tsx` — the composition plus **one scrubbable master sequence**
  (`animate([...])` with absolute `at` times and `stagger()`), so visual state is a
  pure function of timeline time. `state(0) === state(11)` → seamless loop.
- `src/App.tsx` — browser experience: responsive scaling, Pause/Replay
  (keyboard-accessible), `prefers-reduced-motion` → static final frame with an
  opt-in play button, `AnimatePresence` for control transitions. `?t=SECONDS`
  switches to deterministic frame-export mode (paused scrub).
- Ambient layers (grid drift, signal pulses) are loop-periodic pure functions of
  the same clock (`applyAmbient`).

## Storyboard (11 s loop)

1. **0–1.2 s Initialization** — grid, scan sweep, status signals; wordmark dimly present (readable first frame).
2. **1.0–2.4 s Core ignition** — wordmark ignites; core rings assemble; slow camera push begins.
3. **2.4–4.4 s Platform assembly** — seven platform nodes connect through drawn beams.
4. **4.4–6.4 s Industry systems** — seven product chips rise with brand accent colors.
5. **6.6–7.8 s Operating model** — *Human Operations · always available* (solid) and *AI Intelligence · optional* (outlined).
6. **7.9–11 s Lock-up** — scene recedes; positioning lines hold, then dissolve back to the ambient start state.

## Commands

```bash
npm ci            # install
npm run dev       # live Motion experience
npm run build     # typecheck + production build (dist/, deployed to GitHub Pages)
npm run render    # 132 deterministic frames via headless Chrome (needs a static
                  # server on :8752 serving dist/ — python3 -m http.server 8752 --directory dist)
npm run encode    # frames → ../assets/hero-motion.gif (gifenc, global palette)
```

MP4 + poster (after `render`):

```bash
ffmpeg -y -framerate 12 -i "$FRAMES_DIR/f%04d.png" -c:v libx264 -pix_fmt yuv420p \
  -crf 20 -movflags +faststart ../assets/hero-motion-preview.mp4
cp "$FRAMES_DIR/f0118.png" ../assets/hero-motion-poster.png
```

Frames render into `FRAMES_DIR` (default `frames/`, gitignored). Outputs: GIF
1280×480 · 132 frames · 12 fps · infinite loop (NETSCAPE2.0) · ~2.7 MB, well under
the 8 MB CI budget. No fonts are embedded (system stacks only); no network assets;
no analytics.
