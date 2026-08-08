#!/usr/bin/env node
// Zero-dependency validation for the profile README (drift prevention).
// Checks: relative asset paths resolve, asset size budgets, no private/internal
// strings, and (best-effort) that external links respond. Exit 1 on failure.

import { readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const md = readFileSync(join(root, "README.md"), "utf8");
const errors = [];

// 1. Relative links/images must exist; SVG assets must stay within budget (60 KB).
for (const m of md.matchAll(/\]\((?!https?:|mailto:|#)([^)\s]+)\)|src="(?!https?:)([^"]+)"/g)) {
  const rel = m[1] ?? m[2];
  const p = join(root, rel);
  if (!existsSync(p)) { errors.push(`missing asset: ${rel}`); continue; }
  if (rel.endsWith(".svg") && statSync(p).size > 60 * 1024)
    errors.push(`asset over 60 KB budget: ${rel} (${statSync(p).size} B)`);
}

// 2. Nothing private or environment-specific may appear on the public page.
for (const bad of [/localhost/i, /127\.0\.0\.1/, /railway/i, /supabase\.co/i,
  /AKIA[0-9A-Z]{16}/, /gh[pousr]_[A-Za-z0-9]{20,}/, /-----BEGIN/]) {
  if (bad.test(md)) errors.push(`forbidden pattern in README: ${bad}`);
}

// 3. Images must carry meaningful alt text.
for (const m of md.matchAll(/<img\b[^>]*>/g)) {
  const alt = /alt="([^"]*)"/.exec(m[0])?.[1] ?? "";
  if (alt.trim().length < 10) errors.push(`img missing meaningful alt text: ${m[0].slice(0, 60)}…`);
}

// 4. External links respond (best-effort; network flakiness is a warning, 404 fails).
const urls = [...new Set([...md.matchAll(/https:\/\/[^)\s"<>]+/g)].map((m) => m[0]))];
for (const url of urls) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow",
      signal: AbortSignal.timeout(10_000) });
    if (res.status === 404 || res.status === 410) errors.push(`dead link (${res.status}): ${url}`);
    else console.log(`link ok (${res.status}): ${url}`);
  } catch (e) { console.log(`link check skipped (${e.name}): ${url}`); }
}

if (errors.length) { for (const e of errors) console.error(`FAIL: ${e}`); process.exit(1); }
console.log(`README ok — ${urls.length} links, all checks passed`);
