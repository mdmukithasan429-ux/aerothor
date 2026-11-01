import { NextRequest, NextResponse } from 'next/server';
import { getRegionOrDefault } from './src/lib/i18n-regions';

/**
 * Next.js Edge Middleware (`middleware.ts`)
 * Detects the visitor's country via Vercel Edge `req.geo` or `x-vercel-ip-country` / `cf-ipcountry` headers
 * and personalizes the storefront notification bar ("Free 48h Dispatch to [User's Country]")
 * plus regional currency & Amazon Associates marketplace routing.
 */
export function middleware(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // 1. Allow explicit ?country= or ?region= query parameter override for testing or campaign links
  const queryOverride =
    searchParams.get('region') || searchParams.get('country');

  // 2. Detect country from Vercel Edge `req.geo` or CDN geo headers
  const geoCountry =
    queryOverride ||
    (req as NextRequest & { geo?: { country?: string } }).geo?.country ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.cookies.get('aero_geo_country')?.value ||
    'US';

  const matchedRegion = getRegionOrDefault(geoCountry);

  // Clone request headers so downstream Server Components (`app/layout.tsx`, `app/product/[id]/page.tsx`) can read them
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-country', matchedRegion.isoCode);
  requestHeaders.set('x-user-country-name', matchedRegion.countryName);
  requestHeaders.set('x-user-region-slug', matchedRegion.slug);
  requestHeaders.set('x-user-hreflang', matchedRegion.hreflang);
  requestHeaders.set('x-user-currency', matchedRegion.currencyCode);
  requestHeaders.set(
    'x-geo-dispatch-banner',
    `Free 48h Dispatch to ${matchedRegion.countryNameWithArticle}`
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Expose headers & client-readable cookie for client-side notification bar personalization
  response.headers.set('x-user-country', matchedRegion.isoCode);
  response.headers.set('x-user-region-slug', matchedRegion.slug);
  response.headers.set(
    'x-geo-dispatch-banner',
    `Free 48h Dispatch to ${matchedRegion.countryNameWithArticle}`
  );

  response.cookies.set('aero_geo_country', matchedRegion.isoCode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all storefront, product, and regional deal routes except static assets and internal Next.js files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
