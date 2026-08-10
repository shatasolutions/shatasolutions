import { useEffect, useRef } from "react";
import { animate, stagger } from "motion/react";
import type { AnimationPlaybackControls } from "motion/react";
import { C, SANS, MONO, STAGE, LOOP, PLATFORM_NODES, PRODUCTS } from "./tokens";

/**
 * The master timeline is ONE scrubbable Motion sequence: state is a pure
 * function of `controls.time`, which makes the browser experience and the
 * frame-exported GIF/MP4 pixel-identical by construction.
 * state(0) === state(LOOP), so the loop wraps seamlessly.
 */
export function buildTimeline(opts: { paused: boolean } = { paused: true }): AnimationPlaybackControls {
  const ease = "easeOut" as const;
  const controls = animate([
    // Scene 1 — initialization: scan sweep + status signals over the ambient grid.
    ["#scanline", { y: [-60, 540] }, { at: 0.25, duration: 1.05, ease: "linear" }],
    ["#scanline", { opacity: [0, 0.13, 0.13, 0] }, { at: 0.25, duration: 1.05, ease: "linear" }],
    // Scene 2 — core ignition. Wordmark is dimly present from frame 0 (readable
    // first frame), then ignites; restrained camera push runs underneath.
    ["#world", { scale: [1, 1.035] }, { at: 0, duration: 7.6, ease: "linear" }],
    ["#wordmark", { opacity: [0.18, 1], letterSpacing: ["0.16em", "0.05em"], y: [6, 0] }, { at: 1.0, duration: 0.9, ease }],
    ["#coreGlow", { opacity: [0, 0.55], scale: [0.5, 1] }, { at: 1.25, duration: 1.0, ease }],
    [".corering", { opacity: [0, 1], scale: [0.4, 1] }, { at: 1.35, delay: stagger(0.12), duration: 0.7, ease: "backOut" }],
    // Scene 3 — platform assembly: connectors draw, then nodes pop in.
    [".connector", { scaleX: [0, 1], opacity: [0, 0.5] }, { at: 2.45, delay: stagger(0.1), duration: 0.55, ease }],
    [".pnode", { opacity: [0, 1], scale: [0.6, 1] }, { at: 2.7, delay: stagger(0.12), duration: 0.5, ease: "backOut" }],
    // Scene 4 — industry systems rise along the bottom.
    ["#beam", { opacity: [0, 0.35, 0], scaleY: [0.2, 1, 1] }, { at: 4.45, duration: 0.9, ease }],
    [".chip", { opacity: [0, 1], y: [26, 0] }, { at: 4.7, delay: stagger(0.16), duration: 0.6, ease: "backOut" }],
    // Scene 5 — operating model: human always, AI optional. Ring recedes politely.
    ["#platformGroup", { opacity: [1, 0.3] }, { at: 6.55, duration: 0.5, ease }],
    ["#humanPill", { opacity: [0, 1], x: [-24, 0] }, { at: 6.7, duration: 0.6, ease }],
    ["#aiPill", { opacity: [0, 1], x: [24, 0] }, { at: 6.95, duration: 0.6, ease }],
    // Scene 6 — recede and final lock-up.
    ["#world", { scale: 1 }, { at: 7.9, duration: 0.8, ease: "easeInOut" }],
    ["#coreGroup", { opacity: 0 }, { at: 7.9, duration: 0.7, ease: "easeInOut" }],
    ["#platformGroup", { opacity: 0 }, { at: 7.9, duration: 0.7, ease: "easeInOut" }],
    ["#chipsRow", { opacity: 0 }, { at: 8.0, duration: 0.7, ease: "easeInOut" }],
    ["#pillsGroup", { opacity: 0 }, { at: 8.0, duration: 0.7, ease: "easeInOut" }],
    ["#wordmark", { opacity: 0 }, { at: 8.05, duration: 0.6, ease: "easeInOut" }],
    ["#lockup1", { opacity: [0, 1], y: [16, 0] }, { at: 8.45, duration: 0.65, ease }],
    ["#lockup2", { opacity: [0, 1], y: [12, 0] }, { at: 8.95, duration: 0.6, ease }],
    // Hold for reading, then return to the exact t=0 ambient state (loop seam).
    ["#lockup1", { opacity: 0 }, { at: 10.45, duration: 0.45, ease: "easeIn" }],
    ["#lockup2", { opacity: 0 }, { at: 10.45, duration: 0.4, ease: "easeIn" }],
    ["#wordmark", { opacity: 0.18, letterSpacing: "0.16em", y: 6 }, { at: 10.55, duration: 0.45, ease }],
  ]);
  // Pausing at construction is only safe for scrub modes (export / reduced
  // motion): in live playback, play()-after-immediate-pause never starts the
  // sequence in real browsers, so live mode keeps the native autoplay.
  if (opts.paused) controls.pause();
  return controls;
}

/** Ambient layers are pure functions of timeline time; loop-periodic by design. */
export function applyAmbient(t: number) {
  const tau = Math.PI * 2;
  const g1 = document.getElementById("grid1");
  const g2 = document.getElementById("grid2");
  // Drift speeds are 64k/LOOP px/s so the 64px grid wraps exactly per loop.
  const s1 = 64 / LOOP;
  const s2 = (64 * 2) / LOOP;
  if (g1) g1.style.transform = `translate(${-((t * s1) % 64)}px, ${-((t * s1 * 0.5 * 2) % 64) / 2}px)`;
  if (g2) g2.style.transform = `translate(${(t * s2) % 64}px, ${-((t * s2) % 64)}px)`;
  // System signal dots: integer cycle counts keep the seam invisible.
  document.querySelectorAll<SVGCircleElement>(".signal").forEach((el, i) => {
    const m = 2 + (i % 3);
    const phase = i * 2.1;
    el.style.opacity = String(0.12 + 0.3 * Math.max(0, Math.sin(tau * (m * t) / LOOP + phase)));
  });
}

const nodePos = PLATFORM_NODES.map((_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / PLATFORM_NODES.length;
  return { x: 640 + 250 * Math.cos(a), y: 272 + 96 * Math.sin(a) };
});

/** Static composition — every element mounted; the timeline owns visibility. */
export default function Hero({ onReady }: { onReady?: () => void }) {
  const ready = useRef(false);
  useEffect(() => {
    if (!ready.current) { ready.current = true; onReady?.(); }
  }, [onReady]);

  return (
    <div id="world" style={{ position: "relative", width: STAGE.w, height: STAGE.h, background: C.bg, overflow: "hidden", fontFamily: SANS, transformOrigin: "50% 55%" }}>
      {/* ambient dot grids (two parallax layers) */}
      <svg id="grid1" width={STAGE.w + 128} height={STAGE.h + 128} style={{ position: "absolute", left: -64, top: -64, opacity: 0.4 }} aria-hidden="true">
        <defs>
          <pattern id="p1" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect x="32" y="32" width="1.6" height="1.6" fill={C.border} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p1)" />
      </svg>
      <svg id="grid2" width={STAGE.w + 128} height={STAGE.h + 128} style={{ position: "absolute", left: -64, top: -64, opacity: 0.22 }} aria-hidden="true">
        <defs>
          <pattern id="p2" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect x="8" y="8" width="1.2" height="1.2" fill={C.accent} opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#p2)" />
      </svg>
      {/* vignette for depth */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 75% 85% at 50% 45%, transparent 55%, ${C.bg} 100%)` }} />
      {/* scanline sweep */}
      <div id="scanline" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 90, opacity: 0, background: `linear-gradient(180deg, transparent, ${C.accent}, transparent)` }} />
      {/* system signals + status */}
      <svg width={STAGE.w} height={STAGE.h} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {[[112, 84], [1180, 96], [200, 396], [1094, 380], [86, 236], [1206, 250], [420, 70], [880, 62], [330, 428], [960, 434]].map(([x, y], i) => (
          <circle key={i} className="signal" cx={x} cy={y} r={1.8} fill={C.accent} style={{ opacity: 0.12 }} />
        ))}
      </svg>
      <div id="status" style={{ position: "absolute", top: 22, right: 28, display: "flex", gap: 10, alignItems: "center", fontFamily: MONO, fontSize: 13, color: C.dim }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: "#22C55E", display: "inline-block" }} />
        systems nominal
      </div>

      {/* wordmark */}
      <div id="wordmark" style={{ position: "absolute", top: 74, width: "100%", textAlign: "center", opacity: 0.18, letterSpacing: "0.16em", fontSize: 54, fontWeight: 700, color: C.text }}>
        SHATA <span style={{ color: C.accent }}>SOLUTIONS</span>
      </div>

      {/* core */}
      <div id="coreGroup" style={{ position: "absolute", inset: 0 }}>
        <div id="coreGlow" style={{ position: "absolute", left: 640 - 130, top: 272 - 130, width: 260, height: 260, opacity: 0, borderRadius: "50%", background: `radial-gradient(circle, ${C.brand}55 0%, ${C.brand}18 45%, transparent 70%)` }} />
        <svg width={STAGE.w} height={STAGE.h} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          {[16, 30, 44].map((r, i) => (
            <circle key={r} className="corering" cx={640} cy={272} r={r} fill="none" stroke={i === 0 ? C.accent : C.border} strokeWidth={i === 0 ? 2 : 1.2} style={{ opacity: 0, transformOrigin: "640px 272px" }} />
          ))}
          <circle cx={640} cy={272} r={5} fill={C.accent} className="corering" style={{ opacity: 0, transformOrigin: "640px 272px" }} />
        </svg>
      </div>

      {/* platform ring */}
      <div id="platformGroup" style={{ position: "absolute", inset: 0 }}>
        {nodePos.map((p, i) => {
          const dx = p.x - 640, dy = p.y - 272;
          const len = Math.hypot(dx, dy);
          const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <div key={`c${i}`} style={{ position: "absolute", left: 640, top: 272, width: len, height: 1.2, transform: `rotate(${ang}deg)`, transformOrigin: "0 50%" }} aria-hidden="true">
              <div className="connector" style={{ width: "100%", height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.brand})`, opacity: 0, transformOrigin: "0 50%", transform: "scaleX(0)" }} />
            </div>
          );
        })}
        <svg width={STAGE.w} height={STAGE.h} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          {nodePos.map((p, i) => (
            <circle key={`n${i}`} className="pnode" cx={p.x} cy={p.y} r={4.5} fill={C.panel} stroke={C.accent} strokeWidth={1.5} style={{ opacity: 0, transformOrigin: `${p.x}px ${p.y}px` }} />
          ))}
        </svg>
        {nodePos.map((p, i) => (
          <div key={`l${i}`} className="pnode" style={{ position: "absolute", left: p.x - 90, top: p.y + (p.y > 272 ? 12 : -34), width: 180, textAlign: "center", fontFamily: MONO, fontSize: 15, color: C.dim, opacity: 0 }}>
            {PLATFORM_NODES[i]}
          </div>
        ))}
      </div>

      {/* beam + industry chips */}
      <div id="beam" style={{ position: "absolute", left: 639, top: 300, width: 2, height: 110, opacity: 0, transformOrigin: "top", background: `linear-gradient(180deg, ${C.accent}, transparent)` }} />
      <div id="chipsRow" style={{ position: "absolute", bottom: 30, width: "100%", display: "flex", justifyContent: "center", gap: 14 }}>
        {PRODUCTS.map((p) => (
          <div key={p.name} className="chip" style={{ opacity: 0, display: "flex", alignItems: "center", gap: 9, padding: "9px 16px", borderRadius: 9, background: C.panel, border: `1px solid ${C.border}`, fontSize: 19, fontWeight: 600, color: C.text }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: p.accent, display: "inline-block" }} />
            {p.name}
          </div>
        ))}
      </div>

      {/* operating-model pills */}
      <div id="pillsGroup" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div id="humanPill" style={{ position: "absolute", left: 120, top: 250, opacity: 0, padding: "13px 22px", borderRadius: 11, background: C.panel, border: `1px solid ${C.border}`, color: C.text, fontSize: 21, fontWeight: 600 }}>
          Human Operations <span style={{ color: C.dim, fontWeight: 400 }}>· always available</span>
        </div>
        <div id="aiPill" style={{ position: "absolute", right: 120, top: 250, opacity: 0, padding: "13px 22px", borderRadius: 11, background: "transparent", border: `1.5px solid ${C.accent}`, color: C.text, fontSize: 21, fontWeight: 600 }}>
          AI Intelligence <span style={{ color: C.dim, fontWeight: 400 }}>· optional</span>
        </div>
      </div>

      {/* final lock-up */}
      <div id="lockup1" style={{ position: "absolute", top: 196, width: "100%", textAlign: "center", opacity: 0, fontSize: 41, fontWeight: 700, color: C.text }}>
        Building intelligent operating systems for real-world industries.
      </div>
      <div id="lockup2" style={{ position: "absolute", top: 262, width: "100%", textAlign: "center", opacity: 0, fontSize: 23, color: C.dim }}>
        AI-powered when useful. Fully human-operable by design.
      </div>
    </div>
  );
}
