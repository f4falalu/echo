// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
      },
      isFallback: false
    };
  }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  }
}));

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
vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      refreshSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: Date.now() / 1000 + 3600 // 1 hour from now
          }
        },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
    }
  }))
}));
