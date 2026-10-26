import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The nightly CI run (`e2e:nightly`, CI `schedule` and `workflow_dispatch`): every project but `store` (the app
// stores' screenshots, docs/store/), with E2E_ALL_MAPS=1 set by the workflow so the map test opens every map. Perf,
// render budget and screens only record (perf.json, map-budget.json, the screens folder, kept as a CI artifact); the
// reviewed copies are still made on the dev machine. No suite budget: perf and the render budget alone take tens of
// minutes; each test still keeps its own time limit.

/** Projects never run on CI. */
const MANUAL_PROJECTS = new Set(['store']);

export default defineConfig({
  ...base,
  retries: 0,
  projects: (base.projects ?? []).filter((project) => !MANUAL_PROJECTS.has(project.name ?? '')),
});
