import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolve the `@/*` path alias from tsconfig (Vite supports this natively).
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    // Unit tests only. Scoped to `src` with the `.test.ts` suffix so Vitest never
    // picks up the Playwright e2e suite (`e2e/*.spec.ts`).
    include: ['src/**/*.test.ts'],
  },
})
