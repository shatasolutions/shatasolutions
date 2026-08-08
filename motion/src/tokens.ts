// Brand tokens — single source: shatasolutions/.github handbook/17-visual-identity.md.
export const C = {
  bg: "#020617",
  panel: "#0F172A",
  border: "#334155",
  blue900: "#1E3A8A",
  brand: "#1D4ED8",
  accent: "#3B82F6",
  text: "#E2E8F0",
  dim: "#94A3B8",
} as const;

export const SANS = `-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
export const MONO = `ui-monospace,'SF Mono',Menlo,Consolas,monospace`;

export const STAGE = { w: 1280, h: 480 } as const;

/** Total loop length in seconds. state(0) === state(LOOP) by construction. */
export const LOOP = 11;

export const PLATFORM_NODES = [
  "Engineering Core",
  "Identity",
  "Finance",
  "Automation",
  "Data",
  "AI Runtime",
  "Offline / Edge",
] as const;

export const PRODUCTS: ReadonlyArray<{ name: string; accent: string }> = [
  { name: "Codingo", accent: "#3B82F6" },
  { name: "Restaurant OS", accent: "#F97316" },
  { name: "Automotive OS", accent: "#EF4444" },
  { name: "Energy OS", accent: "#F59E0B" },
  { name: "Hospitality OS", accent: "#EAB308" },
  { name: "Trade OS", accent: "#14B8A6" },
  { name: "Shata Pay", accent: "#10B981" },
];
