import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { AUTH_FILE } from './tests/e2e/helpers';

config({ path: '.env.local', quiet: true });

// E2E_BASE_URL=https://<vercel url> npm run e2e   tests the deployed app instead of starting a local server
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 15_000 }, // the first dev compile of a page can be slow
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/ },
    {
      name: 'e2e',
      testMatch: /.*\.spec\.ts/,
      // every spec starts signed in as the E2E user; signed out blocks clear it with test.use
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
});
