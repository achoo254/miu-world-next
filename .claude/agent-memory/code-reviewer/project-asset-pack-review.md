---
name: project-asset-pack-review
description: Reviewing a new asset pack (fonts etc.) in Miu World — assets:fetch wipes all packs, Kenney roads hash drift (25/10/2026), font-check pitfalls
metadata:
  type: project
---

`pnpm assets:fetch` has no per-pack filter: it deletes and re-downloads every pack. On 2026-10-25 the upstream zip of `kenney-city-kit-roads` changed hash, so a full fetch goes red partway, after packs were already deleted. An author who adds a pack may have restored the other packs with `git checkout`.

**Why:** a broken fetch can leave half-deleted packs, or hashes that were written by hand rather than by fetch.

**How to apply:**
- When a new pack lands, re-download its URLs yourself and compare the sha256 with `sources.json`.
- Check that `git status -- assets` shows only the new pack plus `manifest.json` and `LICENSES.md`.
- For a font, measure the real metrics with fontTools. The skills venv has fontTools; run it with `-I` and call `sys.stdout.reconfigure(encoding="utf-8")` inside the script.
- `document.fonts.check()` returns true when no face matches the family, so it is a weak assertion.
- The credit line in `LICENSES.md` is hard-coded in `tools/assets/build-manifest.ts`; check that it names the new pack.

See [[project-content-review-heuristics]].
