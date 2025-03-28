import { NextRequest, NextResponse } from 'next/server';

export async function pathnameMiddleware(request: NextRequest, resonse: NextResponse) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}
