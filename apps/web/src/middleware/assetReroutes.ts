import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import {
  BusterRoutes,
  createBusterRoute,
  getEmbedAssetRedirect,
  isPublicPage,
  isShareableAssetPage
} from '@/routes/busterRoutes';

const createLoginRedirect = (request: NextRequest): NextResponse => {
  const originalUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const loginUrl = new URL(createBusterRoute({ route: BusterRoutes.AUTH_LOGIN }), request.url);
  loginUrl.searchParams.set('next', encodeURIComponent(originalUrl));
  return NextResponse.redirect(loginUrl);
};

export const assetReroutes = async (
  request: NextRequest,
  response: NextResponse,
  user: User | null
) => {
  const userExists = !!user && !!user.id;
  if (!userExists && !isPublicPage(request)) {
    return createLoginRedirect(request);
  }

  if (!userExists && isShareableAssetPage(request)) {
    const redirect = getEmbedAssetRedirect(request);
    if (redirect) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    return createLoginRedirect(request);
  }

  return response;
};
