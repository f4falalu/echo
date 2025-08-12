// Learn more: https://github.com/testing-library/jest-dom
//import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn()
}));

vi.mock('react-markdown', () => ({
  __esModule: true,
  default: vi.fn()
}));

vi.mock('remark-gfm', () => ({
  __esModule: true,
  default: vi.fn()
}));

// Mock Supabase client to prevent environment variable errors in tests
vi.mock('@/lib/supabase/client', () => {
  const mockClient = {
    auth: {
      refreshSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
          }
        },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600
          }
        },
        error: null
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    }
  };

  return {
    createBrowserClient: vi.fn(() => mockClient),
    getBrowserClient: vi.fn(() => mockClient)
  };
});
