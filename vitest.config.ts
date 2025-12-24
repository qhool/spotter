import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      include: [
        'src/data/**',
        'src/hooks/**',
        'src/utils/**',
        'src/tests/helpers/**'
      ],
      exclude: [
        'src/components/**',
        'src/pages/**',
        'src/App.tsx',
        'src/main.tsx',
        'src/**/*.css',
        'src/tests/**'
      ]
    }
  },
})
