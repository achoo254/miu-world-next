---
name: project-release-script-hardcoded-paths
description: Miu World deploy.sh release hard-codes public page paths (dist/bai) and nginx needs `setup`; CI never runs it — grep tools/deploy when public routes move
metadata:
  type: project
---

`tools/deploy/production/deploy.sh release` checks the built dist itself (page count under a fixed directory, sitemap `<loc>` count, robots.txt) and CI never executes it, so renaming a public route passes every gate and only fails at release time. Also `release` does not install nginx: any `nginx-prod.conf` / include change needs `deploy.sh setup` first, otherwise old nginx serves the new dist.

**Why:** 2026-10-25 review of the `/bai/` → `/hoc/` move: deploy.sh:249-256 still ran `find apps/web/dist/bai`, which would have aborted deploy batch 1; the 301 map only works after `setup`.

**How to apply:** whenever a diff moves public pages, sitemap, robots or nginx config, grep `tools/deploy/` for the old path and check the release order (setup before release) is written in docs/deployment-guide.md. Related: [[project-plan-review-heuristics]].
