import { renderHook } from '@testing-library/react';
import { useAppLayout } from './AppLayoutProvider';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { BusterRoutesWithArgsRoute } from '@/routes/busterRoutes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useParams: jest.fn()
}));

describe('useAppLayout - onChangePage', () => {
  // Mock window.location
  const mockPush = jest.fn();
  let originalLocation: Location;

  beforeEach(() => {
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useParams as jest.Mock).mockReturnValue({});

    // Setup window.location mock
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: ''
    } as Location;

    // Mock window.history
    window.history.pushState = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location = originalLocation;
  });

  it('should not navigate when target URL is identical to current URL', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard');

    expect(mockPush).not.toHaveBeenCalled();
    expect(window.history.pushState).not.toHaveBeenCalled();
  });

  it('should handle shallow routing when only query params change', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard?filter=active', { shallow: true });

    expect(mockPush).not.toHaveBeenCalled();
    expect(window.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('/dashboard?filter=active')
    );
  });

  it('should navigate to new route when pathname changes', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/settings');

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('should update query parameters on same pathname', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard?filter=all';
    window.location.pathname = '/dashboard';
    window.location.search = '?filter=all';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard?filter=active');

    expect(mockPush).toHaveBeenCalledWith('/dashboard?filter=active');
  });

  it('should remove query parameters when navigating to clean URL', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard?filter=active';
    window.location.pathname = '/dashboard';
    window.location.search = '?filter=active';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard');

    expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/dashboard');
  });

  it('should handle route with dynamic parameters', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    const route: BusterRoutesWithArgsRoute = {
      route: BusterAppRoutes.APP_DASHBOARD_ID,
      dashboardId: '123'
    };

    await result.current.onChangePage(route);

    expect(mockPush).toHaveBeenCalled();
  });
});
