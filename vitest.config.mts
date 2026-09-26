import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.dirname(fileURLToPath(import.meta.url)) } },
  // tests/e2e belongs to Playwright, keep Vitest on unit tests only
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
