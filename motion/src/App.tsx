import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { AnimationPlaybackControls } from "motion/react";
import Hero, { buildTimeline, applyAmbient } from "./Hero";
import { C, SANS, STAGE, LOOP } from "./tokens";

const params = new URLSearchParams(location.search);
const EXPORT_T = params.has("t") ? Number(params.get("t")) : null;

export default function App() {
  const prefersReduced = useReducedMotion();
  const [playing, setPlaying] = useState(EXPORT_T === null);
  const [optedIn, setOptedIn] = useState(false);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const reduced = prefersReduced && !optedIn && EXPORT_T === null;

  useEffect(() => {
    const controls = buildTimeline();
    controlsRef.current = controls;

    if (EXPORT_T !== null) {
      // Deterministic frame export: scrub the paused timeline to ?t= and signal.
      controls.time = EXPORT_T % LOOP;
      applyAmbient(EXPORT_T % LOOP);
      const tag = document.createElement("div");
      tag.id = "export-ready";
      requestAnimationFrame(() => requestAnimationFrame(() => document.body.appendChild(tag)));
      return () => controls.cancel();
    }

    if (reduced) {
      // Reduced motion: hold the readable final lock-up, no playback.
      controls.time = 9.8;
      applyAmbient(9.8);
      return () => controls.cancel();
    }

    controls.play();
    let raf = 0;
    const tick = () => {
      const t = controls.time % LOOP;
      applyAmbient(t);
      if (controls.time >= LOOP) { controls.time = 0; controls.play(); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); controls.cancel(); };
  }, [reduced]);

  const toggle = () => {
    const c = controlsRef.current;
    if (!c) return;
    if (playing) c.pause(); else c.play();
    setPlaying(!playing);
  };
  const replay = () => {
    const c = controlsRef.current;
    if (!c) return;
    c.time = 0;
    applyAmbient(0);
    c.play();
    setPlaying(true);
  };

  const chrome = EXPORT_T === null;
  return (
    <main style={{ minHeight: chrome ? "100vh" : undefined, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: chrome ? "center" : undefined, gap: 20, background: "#01030f", fontFamily: SANS }}>
      <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        Shata Solutions — building intelligent operating systems for real-world industries. AI-powered when useful, fully human-operable by design.
      </h1>
      <div className="stage-scaler" style={{ width: "100%", maxWidth: STAGE.w, aspectRatio: `${STAGE.w}/${STAGE.h}`, position: "relative", overflow: "hidden", borderRadius: chrome ? 12 : 0 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: STAGE.w, height: STAGE.h, transform: "scale(var(--s))", transformOrigin: "0 0" }}>
          <Hero />
        </div>
      </div>
      {chrome && (
        <AnimatePresence>
          {reduced ? (
            <motion.div key="rm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ color: C.dim, fontSize: 14, display: "flex", gap: 12, alignItems: "center" }}>
              Reduced motion is on — showing the final frame.
              <button className="ctl" onClick={() => setOptedIn(true)}>Play animation anyway</button>
            </motion.div>
          ) : (
            <motion.div key="ctls" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: "flex", gap: 10 }}>
              <button className="ctl" onClick={toggle} aria-pressed={!playing}>{playing ? "Pause" : "Play"}</button>
              <button className="ctl" onClick={replay}>Replay</button>
              <a className="ctl" href="https://github.com/shatasolutions" style={{ textDecoration: "none" }}>github.com/shatasolutions →</a>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </main>
  );
}
