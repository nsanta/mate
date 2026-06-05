import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['src/main.js', 'dist/**', 'tests/**'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 85,
        lines: 90,
      },
    },
  },
});
