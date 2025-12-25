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
        'src/components/**',
        'src/data/**',
        'src/hooks/**',
        'src/pages/**',
        'src/utils/**',
        'src/tests/helpers/**'
      ],
      exclude: [
        'src/**/*.css'
      ]
    }
  },
})
