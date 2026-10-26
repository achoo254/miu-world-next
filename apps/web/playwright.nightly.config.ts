import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// The nightly CI run (`e2e:nightly`, CI `schedule` and `workflow_dispatch`): every project but the by-hand ones,
// with E2E_ALL_MAPS=1 set by the workflow so the map test opens every map. Screens only record (kept as a CI
// artifact); the reviewed copies are still made on the dev machine. No suite budget; each test keeps its own limit.

/**
 * Projects never run on CI: the app stores' screenshots (docs/store/), and perf and the render budget, which need a
 * real GPU (on the CI software renderer the scene never gets ready and they time out).
 */
const MANUAL_PROJECTS = new Set(['store', 'perf', 'budget']);

export default defineConfig({
  ...base,
  retries: 0,
  projects: (base.projects ?? []).filter((project) => !MANUAL_PROJECTS.has(project.name ?? '')),
});
