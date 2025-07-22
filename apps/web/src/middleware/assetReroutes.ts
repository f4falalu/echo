import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import {
  BusterRoutes,
  createBusterRoute,
  getEmbedAssetRedirect,
  isPublicPage,
  isShareableAssetPage
} from '@/routes/busterRoutes';

/**
 * Creates a login redirect URL with the current page as the 'next' parameter
 */
const createLoginRedirect = (request: NextRequest): NextResponse => {
  const originalUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL(
    createBusterRoute({ route: BusterRoutes.AUTH_LOGIN, next: originalUrl }),
    request.url
  );

  return NextResponse.redirect(loginUrl);
};

export const assetReroutes = async (
  request: NextRequest,
  response: NextResponse,
  user: User | null
) => {
  const userExists = !!user && !!user.id;

  // If user doesn't exist and page requires authentication
  if (!userExists && !isPublicPage(request)) {
    return createLoginRedirect(request);
  }

  // If user doesn't exist and it's a shareable asset page
  if (!userExists && isShareableAssetPage(request)) {
    // Try to get embed asset redirect first
    const embedRedirect = getEmbedAssetRedirect(request);
    if (embedRedirect) {
      return NextResponse.redirect(new URL(embedRedirect, request.url));
    }
    // Fall back to login redirect
    return createLoginRedirect(request);
  }

  return response;
};
