# Speak Up — agent notes

PWA that encourages speaking up in pressured situations (companion to ~/stop-stuttering "Speak Freely").
Design: `docs/plans/2026-11-24-speak-up-design.md`.

## Commands

- `npm run dev` — dev server
- `npm test` — Vitest (jsdom + fake-indexeddb)
- `npm run build` — `tsc -b` + Vite build (PWA). `BASE_PATH=/speak-up/` for GitHub Pages
- `npm run lint` — oxlint

Verify with test, build, and lint before committing.

This machine's npm registry is an internal mirror that GitHub Actions cannot reach. After any `npm install`,
make sure every `resolved` URL in `package-lock.json` points to `https://registry.npmjs.org/` before committing
(run `npm config get registry` to see the mirror prefix, then replace it with sed). Never commit the mirror hostname.

## Conventions

- English UI. Orange accent (`orange-600`), stone neutrals.
- Data is local only (IndexedDB key-value store via `src/lib/storage.ts`). Persistence request, backup reminder
  (7 days) and export/import protect it.
- Reward attempts to speak, not fluency. Never shame "not this time" entries.
- Deploy: `.github/workflows/deploy.yml` publishes to GitHub Pages on push to `main`.
  Remote: https://github.com/zirui-huang73/speak-up (site: https://zirui-huang73.github.io/speak-up/).
- Commit identity: `Zirui Huang <ziruih73@gmail.com>`, passed with `git -c user.name=... -c user.email=...`
  (the global git identity is a work account; do not use it here).
