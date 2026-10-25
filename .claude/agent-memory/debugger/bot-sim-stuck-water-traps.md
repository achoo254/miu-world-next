---
name: bot-sim-stuck-water-traps
description: body.sim.test stuck-share failures after a map regen came from bots dropping 3 blocks into canals/lakes with no way out; quest placement shares one RNG stream so one place change moves every target
metadata:
  type: project
---

2026-10-25: body.sim.test (truong-hoc, stuck < 5%) went red after a content-only regen. The .bin walk grid was byte-identical; only `places` moved, which changed the bots' wander trajectories. A one-way-trap audit (BFS from spawn forward vs. backward over `canStep`) showed the whole school water body (31k spots, canal + lake) reachable by a 3-block drop from feet-12 banks and never left; a bot that fell in counted ~250-300 s stuck. Seed sweep: ~25% of seeds failed on both old and new grids; after the planner refused one-way drops into water (local-path.ts), 1/24.

Placement cascade: `placeQuestTargets` draws every shuffle from one seeded stream over quests sorted by id, so a quest place that stops matching a landmark name (toan2-cd1-b01 "cửa lớp 2A" after the landmark rename) moves almost every later target and villager.

**Why:** these sim tests are chaotic; a grid trap turns luck into failure.

**How to apply:** for a stuck-share regression, first log per-bot stuckMs and height jumps; run the trap audit before blaming placement. Related: [[seeded-bot-tests-content-drift]].
