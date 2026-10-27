import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Never initialize the production Firebase app or analytics in component tests.
vi.mock('../../src/firebase_config', () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock('../../src/firebase_functions', () => ({ functions: {} }));
vi.mock('../../src/firebase_storage', () => ({ storage: {} }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
