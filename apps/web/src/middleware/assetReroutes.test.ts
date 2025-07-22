import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { assetReroutes } from './assetReroutes';

// Mock the busterRoutes module
vi.mock('@/routes/busterRoutes', () => ({
  BusterRoutes: {
    AUTH_LOGIN: '/auth/login'
  },
  createBusterRoute: vi.fn(({ route }) => route),
  isPublicPage: vi.fn(),
  isShareableAssetPage: vi.fn(),
  getEmbedAssetRedirect: vi.fn()
}));

import {
  isPublicPage,
  isShareableAssetPage,
  getEmbedAssetRedirect,
  createBusterRoute
} from '@/routes/busterRoutes';

describe('assetReroutes', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  let mockUser: User;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create mock request with a URL
    mockRequest = new NextRequest('https://example.com/dashboard');
    mockResponse = NextResponse.next();

    // Create a mock user
    mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    } as User;
  });

  it('should return original response when user exists', async () => {
    // Test case: Authenticated user should proceed normally
    const result = await assetReroutes(mockRequest, mockResponse, mockUser);

    expect(result).toBe(mockResponse);
    // Verify that auth-related functions weren't called since user exists
    expect(isPublicPage).not.toHaveBeenCalled();
    expect(isShareableAssetPage).not.toHaveBeenCalled();
  });

  it('should redirect to login when user does not exist and page requires authentication', async () => {
    // Test case: Unauthenticated user on protected (non-public) page
    vi.mocked(isPublicPage).mockReturnValue(false);

    const result = await assetReroutes(mockRequest, mockResponse, null);

    expect(isPublicPage).toHaveBeenCalledWith(mockRequest);
    expect(result).toBeInstanceOf(NextResponse);

    // Verify redirect URL contains login path and next parameter
    const redirectUrl = result.headers.get('location');
    expect(redirectUrl).toContain('/auth/login');
    expect(redirectUrl).toContain('next=');
  });

  it('should redirect to embed asset when user does not exist on shareable asset page with embed redirect', async () => {
    // Test case: Unauthenticated user on shareable page with available embed redirect
    vi.mocked(isPublicPage).mockReturnValue(true);
    vi.mocked(isShareableAssetPage).mockReturnValue(true);
    vi.mocked(getEmbedAssetRedirect).mockReturnValue('/embed/dashboard/123');

    const result = await assetReroutes(mockRequest, mockResponse, null);

    expect(isPublicPage).toHaveBeenCalledWith(mockRequest);
    expect(isShareableAssetPage).toHaveBeenCalledWith(mockRequest);
    expect(getEmbedAssetRedirect).toHaveBeenCalledWith(mockRequest);
    expect(result).toBeInstanceOf(NextResponse);

    // Verify redirect to embed URL
    const redirectUrl = result.headers.get('location');
    expect(redirectUrl).toContain('/embed/dashboard/123');
  });

  it('should redirect to login when user does not exist on shareable asset page without embed redirect', async () => {
    // Test case: Unauthenticated user on shareable page with no embed redirect available
    vi.mocked(isPublicPage).mockReturnValue(true);
    vi.mocked(isShareableAssetPage).mockReturnValue(true);
    vi.mocked(getEmbedAssetRedirect).mockReturnValue(undefined);

    const result = await assetReroutes(mockRequest, mockResponse, null);

    expect(isPublicPage).toHaveBeenCalledWith(mockRequest);
    expect(isShareableAssetPage).toHaveBeenCalledWith(mockRequest);
    expect(getEmbedAssetRedirect).toHaveBeenCalledWith(mockRequest);
    expect(result).toBeInstanceOf(NextResponse);

    // Verify fallback redirect to login with next parameter
    const redirectUrl = result.headers.get('location');
    expect(redirectUrl).toContain('/auth/login');
    expect(redirectUrl).toContain('next=');
  });
});
