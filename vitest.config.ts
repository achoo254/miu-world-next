import { configDefaults, defineConfig } from 'vitest/config';

/**
 * Tests that generate a whole 800 x 800 map again and compare it with the committed one. They run as their own
 * project so CI gives them machines of their own (job `maps`): next to hundreds of other files their generation
 * outgrows its limit. `pnpm test` still runs every project. The CI job splits them by file name (`tools/world/zone-maps`
 * and `tools/world/generate-`, .github/workflows/ci.yml): a new pattern here must match one of the two.
 */
const MAP_GENERATION_TESTS = ['tools/world/generate-*-map.test.ts', 'tools/world/zone-maps.test.ts', 'tools/world/generate-world-overview.test.ts'];

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: ['tools/**/*.test.ts', 'packages/**/*.test.ts', 'apps/*/src/**/*.test.ts', 'apps/*/*.test.ts', 'apps/server/test/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'apps/web/src/**', ...MAP_GENERATION_TESTS],
          // One migrated PGlite for the whole run (see the file); a file's database then boots in a
          // fraction of a second. The limits leave room for a machine under full load: a server route
          // test making dozens of requests can take seconds when every core is busy.
          globalSetup: ['apps/server/test/pglite-template.ts'],
          hookTimeout: 30_000,
          testTimeout: 20_000,
        },
      },
      {
        test: {
          name: 'maps',
          include: MAP_GENERATION_TESTS,
          hookTimeout: 30_000,
          testTimeout: 20_000,
        },
      },
      'apps/web/vitest.config.ts',
    ],
  },
});
