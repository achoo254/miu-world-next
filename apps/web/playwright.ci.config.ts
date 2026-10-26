import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The smoke suite, run on every push and pull request (`e2e:ci`, one GitHub runner, one worker): the main journeys a
// release must hold, from sign-in to a paid purchase. Every other project (learning mechanics, bosses, co-op, worksheets,
// every map, perf, render budget, screens) runs nightly through playwright.nightly.config.ts; its behaviour is locked
// on every push by the Node tests listed in docs/code-standards.md "Kiểm thử".

/** The whole run's budget (docs/code-standards.md "Ngân sách thời gian test"): over it, the run fails. */
export const E2E_SUITE_BUDGET_SECONDS = 180;

/** The smoke journeys, plus `setup` (the parent session the signed-in ones start from). */
const SMOKE_PROJECTS = new Set(['setup', 'account', 'invite', 'maps', 'quest-flow', 'shop']);

export default defineConfig({
  ...base,
  reporter: [['list'], ['./e2e/time-budget-reporter.ts', { suiteBudgetSeconds: E2E_SUITE_BUDGET_SECONDS }]],
  // A test of a smoke spec tagged `@nightly` is a longer walk through the same journey: nightly only.
  grepInvert: /@nightly/,
  // No retry: a failure is a bug (or a flaky test to fix), and a retry doubled the time of every real failure.
  // No cap on failures either: every smoke journey runs and reports, none is left "did not run".
  retries: 0,
  projects: (base.projects ?? []).filter((project) => SMOKE_PROJECTS.has(project.name ?? '')),
});
