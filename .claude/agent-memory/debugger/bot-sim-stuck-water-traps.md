---
name: bot-sim-stuck-water-traps
description: body.sim.test stuck-share failures after a map regen came from bots dropping 3 blocks into canals/lakes with no way out; quest placement shares one RNG stream so one place change moves every target
metadata:
  type: project
---

2026-10-25: body.sim.test (truong-hoc, stuck < 5%) went red after a content-only regen. The .bin walk grid was byte-identical; only `places` moved, which changed the bots' wander trajectories. A one-way-trap audit (BFS from spawn forward vs. backward over `canStep`) showed the whole school water body (31k spots, canal + lake) reachable by a 3-block drop from feet-12 banks and never left; a bot that fell in counted ~250-300 s stuck. Seed sweep: ~25% of seeds failed on both old and new grids; after the planner refused one-way drops into water (local-path.ts), 1/24.

Placement cascade: `placeQuestTargets` draws every shuffle from one seeded stream over quests sorted by id, so a quest place that stops matching a landmark name (toan2-cd1-b01 "cửa lớp 2A" after the landmark rename) moves almost every later target and villager.

Follow-up the same day: the water fix changed trajectories and exposed a real lost update in memory-restart.test. `Brain.sense` faded every place's q each minute without bumping `revision`, so `MemoryKeeper.flush()` skipped a bot whose last snapshot was 7 s old and the stored q was stale (diff 1.3e-4). Fixed by bumping `changes` when a fade changes a value. To find this kind of bug, wrap `brain.snapshot` to log when the snapshot was taken and its revision; logging only the write call hides it.

Later the same day: after per-quest placement streams (63865225) the default seed measured 4.61%, but the 12-seed mean was unchanged (2.2% before and after, same .bin). About 76% of stuck time came from wander *explore* goals across the campus fence; quest targets near fences were not the driver. Each unreachable goal cost at least 6 s (3 plans, 2 s apart). The fix was a `sealed` flag on the plan (goal in the window, open list exhausted): the stepper walks as near as it can, then gives up at once (12 seeds 0.00–0.48%). Pitfall: giving up without walking the plan deadlocked leashed bots in front of a wide building (instant give-up loops, 245 s). Also report the time spent on goals that were given up (from go to the stuck event): it only fell from 2.4% to 2.1%.

**Why:** these sim tests are chaotic; a grid trap turns luck into failure.

**How to apply:** for a stuck-share regression, first log per-bot stuckMs and height jumps; run the trap audit before blaming placement. Related: [[seeded-bot-tests-content-drift]].
