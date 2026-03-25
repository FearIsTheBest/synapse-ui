#!/usr/bin/env node
// Minimal stub: themes are loaded via Vite at runtime, so we skip pre-build.
// Supports --watch to stay alive when invoked by "npm run watch:themes".

const watch = process.argv.includes('--watch')

console.log('[build-themes] Skipping theme pre-build; themes load at runtime.')

if (watch) {
  console.log('[build-themes] Watch mode enabled; keeping process alive (noop).')
  setInterval(() => {}, 1 << 30)
}
