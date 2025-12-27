import { defineConfig } from 'vitest/config'

const enableUI = process.env.VITEST_UI === 'true';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    ui: enableUI,
    api: enableUI,
    includeSource: ['src/**/*.ts', 'src/**/*.tsx'],
    includeTaskLocation: true,
    open: enableUI,
    setupFiles: [],
    coverage: {
      //enabled: true,
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: [
        'src/components/**',
        'src/data/**',
        'src/hooks/**',
        'src/pages/**',
        'src/utils/**',
        'src/tests/helpers/**'
      ],
      exclude: [
        'src/**/*.css',
        'src/pages/TestbedPage.tsx',
        'src/hooks/useSpotify.ts',
      ]
    }
  },
})
