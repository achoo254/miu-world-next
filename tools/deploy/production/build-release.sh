#!/usr/bin/env bash
# Builds the production release of Miu World and lays it out in an empty directory, run at the repo root after
# `pnpm install`. Shared by the manual `deploy.sh release` and the CI deploy (.github/workflows/deploy.yml), so both
# ship the same tree:
#   tools/deploy/production/build-release.sh <out-dir>
# <out-dir> then holds apps/web/dist, apps/server/dist/server, apps/server/drizzle and content: everything the host
# needs besides Node (the server bundle inlines its dependencies). Holds and reads no secret. The host-side activation
# (tools/deploy/production/activate-incoming.sh) writes REVISION and RELEASE itself.
set -euo pipefail
export COPYFILE_DISABLE=1

OUT="${1:?usage: build-release.sh <out-dir>}"
[ -d "$OUT" ] && [ -z "$(ls -A "$OUT")" ] || { echo "build-release: $OUT must be an existing empty directory" >&2; exit 2; }

# The game only: no review page, render tool page or review screenshots in production.
pnpm --filter @miu/web build:release >/dev/null
# Only the character portraits the UI shows may remain under generated/review.
[ ! -e apps/web/dist/review.html ] && [ ! -e apps/web/dist/preview.html ] \
  && [ -z "$(find apps/web/dist/game-assets/generated/review -mindepth 1 -maxdepth 1 ! -name character 2>/dev/null)" ] \
  || { echo "release build still carries review material" >&2; exit 1; }
# Crawlers are let in, and the sitemap lists the home page and every page under /hoc/ (the subject and topic pages).
pages="$(find apps/web/dist/hoc -name index.html 2>/dev/null | wc -l | tr -d ' ')"
[ "$pages" -gt 0 ] || { echo "release build has no topic pages under /hoc" >&2; exit 1; }
if grep -Eq '^Disallow:[[:space:]]*/[[:space:]]*$' apps/web/dist/robots.txt 2>/dev/null || ! grep -q '^Sitemap: ' apps/web/dist/robots.txt 2>/dev/null; then
  echo "release build: robots.txt shuts crawlers out or names no sitemap" >&2; exit 1
fi
[ "$(grep -c '<loc>' apps/web/dist/sitemap.xml 2>/dev/null)" -eq "$((pages + 1))" ] \
  || { echo "release build: sitemap.xml does not list the home page and the $pages pages under /hoc" >&2; exit 1; }
pnpm --filter @miu/server bundle >/dev/null
pnpm -s security:dist

# Release metadata is written on the host, never carried over from an earlier local build.
rm -f apps/server/dist/server/REVISION apps/server/dist/server/RELEASE_FORCED apps/server/dist/server/RELEASE
tar --no-xattrs -cf - apps/web/dist apps/server/dist/server apps/server/drizzle content | tar -xf - -C "$OUT"
echo "build-release: $(du -sh "$OUT" | cut -f1) in $OUT"
