/**
 * Root Vercel Edge Routing Middleware (`middleware.ts`)
 *
 * Uses 100% Web-standard Fetch APIs (`Request`, `Response`, `URL`, `Headers`) with zero
 * external runtime dependencies so it executes natively on Vercel's Edge Runtime without
 * requiring `next/server` in a Vite + Express deployment.
 *
 * Responsibilities:
 * 1. Detects visitor location from Vercel's `x-vercel-ip-country` header (or `?country=` / `?region=` override).
 * 2. Matches against the 10 target Amazon Associates & Dropshipping regions:
 *    US, UK (GB), Canada (CA), France (FR), Germany (DE), Italy (IT),
 *    Netherlands (NL), Poland (PL), Spain (ES), Sweden (SE).
 * 3. Rewrites generic `/deals` requests to the localized `/deals/[country]` path when a target region is detected.
 * 4. Sets client-readable cookies (`aero_geo_country`, `aero_geo_slug`, `aero_geo_banner`) and edge headers
 *    to personalize the UI notification bar ("Free 48h Dispatch to [User's Country]").
 */

interface TargetRegionEdgeConfig {
  isoCode: string;
  slug: string;
  countryName: string;
  countryNameWithArticle: string;
  currencyCode: string;
  hreflang: string;
}

const TARGET_REGIONS_BY_KEY: Record<string, TargetRegionEdgeConfig> = {
  US: {
    isoCode: 'US',
    slug: 'us',
    countryName: 'United States',
    countryNameWithArticle: 'the United States',
    currencyCode: 'USD',
    hreflang: 'en-US',
  },
  GB: {
    isoCode: 'GB',
    slug: 'uk',
    countryName: 'United Kingdom',
    countryNameWithArticle: 'the United Kingdom',
    currencyCode: 'GBP',
    hreflang: 'en-GB',
  },
  UK: {
    isoCode: 'GB',
    slug: 'uk',
    countryName: 'United Kingdom',
    countryNameWithArticle: 'the United Kingdom',
    currencyCode: 'GBP',
    hreflang: 'en-GB',
  },
  CA: {
    isoCode: 'CA',
    slug: 'canada',
    countryName: 'Canada',
    countryNameWithArticle: 'Canada',
    currencyCode: 'CAD',
    hreflang: 'en-CA',
  },
  CANADA: {
    isoCode: 'CA',
    slug: 'canada',
    countryName: 'Canada',
    countryNameWithArticle: 'Canada',
    currencyCode: 'CAD',
    hreflang: 'en-CA',
  },
  FR: {
    isoCode: 'FR',
    slug: 'france',
    countryName: 'France',
    countryNameWithArticle: 'France',
    currencyCode: 'EUR',
    hreflang: 'fr-FR',
  },
  FRANCE: {
    isoCode: 'FR',
    slug: 'france',
    countryName: 'France',
    countryNameWithArticle: 'France',
    currencyCode: 'EUR',
    hreflang: 'fr-FR',
  },
  DE: {
    isoCode: 'DE',
    slug: 'germany',
    countryName: 'Germany',
    countryNameWithArticle: 'Germany',
    currencyCode: 'EUR',
    hreflang: 'de-DE',
  },
  GERMANY: {
    isoCode: 'DE',
    slug: 'germany',
    countryName: 'Germany',
    countryNameWithArticle: 'Germany',
    currencyCode: 'EUR',
    hreflang: 'de-DE',
  },
  IT: {
    isoCode: 'IT',
    slug: 'italy',
    countryName: 'Italy',
    countryNameWithArticle: 'Italy',
    currencyCode: 'EUR',
    hreflang: 'it-IT',
  },
  ITALY: {
    isoCode: 'IT',
    slug: 'italy',
    countryName: 'Italy',
    countryNameWithArticle: 'Italy',
    currencyCode: 'EUR',
    hreflang: 'it-IT',
  },
  NL: {
    isoCode: 'NL',
    slug: 'netherlands',
    countryName: 'Netherlands',
    countryNameWithArticle: 'the Netherlands',
    currencyCode: 'EUR',
    hreflang: 'nl-NL',
  },
  NETHERLANDS: {
    isoCode: 'NL',
    slug: 'netherlands',
    countryName: 'Netherlands',
    countryNameWithArticle: 'the Netherlands',
    currencyCode: 'EUR',
    hreflang: 'nl-NL',
  },
  PL: {
    isoCode: 'PL',
    slug: 'poland',
    countryName: 'Poland',
    countryNameWithArticle: 'Poland',
    currencyCode: 'PLN',
    hreflang: 'pl-PL',
  },
  POLAND: {
    isoCode: 'PL',
    slug: 'poland',
    countryName: 'Poland',
    countryNameWithArticle: 'Poland',
    currencyCode: 'PLN',
    hreflang: 'pl-PL',
  },
  ES: {
    isoCode: 'ES',
    slug: 'spain',
    countryName: 'Spain',
    countryNameWithArticle: 'Spain',
    currencyCode: 'EUR',
    hreflang: 'es-ES',
  },
  SPAIN: {
    isoCode: 'ES',
    slug: 'spain',
    countryName: 'Spain',
    countryNameWithArticle: 'Spain',
    currencyCode: 'EUR',
    hreflang: 'es-ES',
  },
  SE: {
    isoCode: 'SE',
    slug: 'sweden',
    countryName: 'Sweden',
    countryNameWithArticle: 'Sweden',
    currencyCode: 'SEK',
    hreflang: 'sv-SE',
  },
  SWEDEN: {
    isoCode: 'SE',
    slug: 'sweden',
    countryName: 'Sweden',
    countryNameWithArticle: 'Sweden',
    currencyCode: 'SEK',
    hreflang: 'sv-SE',
  },
};

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...v] = part.trim().split('=');
    if (k === name && v.length > 0) {
      try {
        return decodeURIComponent(v.join('='));
      } catch {
        return v.join('=');
      }
    }
  }
  return null;
}

export function middleware(request: Request): Response {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // 1. Check explicit query param (?region= or ?country=), then Vercel's `x-vercel-ip-country` header, then cookie
    const queryCountry =
      url.searchParams.get('region') || url.searchParams.get('country');
    const vercelIpCountry =
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('cf-ipcountry');
    const cookieCountry = parseCookieHeader(
      request.headers.get('cookie'),
      'aero_geo_country'
    );

    const rawCandidate = (
      queryCountry ||
      vercelIpCountry ||
      cookieCountry ||
      'US'
    )
      .trim()
      .toUpperCase();

    const matchedRegion =
      TARGET_REGIONS_BY_KEY[rawCandidate] || TARGET_REGIONS_BY_KEY.US;
    const isTargetRegionMatch = Boolean(TARGET_REGIONS_BY_KEY[rawCandidate]);

    const bannerText = `Free 48h Dispatch to ${matchedRegion.countryNameWithArticle}`;
    const headers = new Headers();

    // 2. If the visitor hits `/deals` (or requests `?rewrite=deals`) and matches one of our 10 target regions,
    //    rewrite the request to `/deals/[country]`
    if (
      isTargetRegionMatch &&
      (pathname === '/deals' || url.searchParams.get('rewrite') === 'deals')
    ) {
      const rewriteUrl = new URL(`/deals/${matchedRegion.slug}`, url.origin);
      url.searchParams.forEach((value, key) => {
        if (key !== 'rewrite') {
          rewriteUrl.searchParams.set(key, value);
        }
      });
      headers.set('x-middleware-rewrite', rewriteUrl.toString());
    } else {
      headers.set('x-middleware-next', '1');
    }

    // 3. Set response headers & cookies to personalize the UI notification bar and regional currency
    headers.set('x-user-country', matchedRegion.isoCode);
    headers.set('x-user-region-slug', matchedRegion.slug);
    headers.set('x-user-currency', matchedRegion.currencyCode);
    headers.set('x-user-hreflang', matchedRegion.hreflang);
    headers.set('x-geo-dispatch-banner', bannerText);

    const cookieAttrs = 'Path=/; Max-Age=2592000; SameSite=Lax';
    headers.append(
      'Set-Cookie',
      `aero_geo_country=${encodeURIComponent(matchedRegion.isoCode)}; ${cookieAttrs}`
    );
    headers.append(
      'Set-Cookie',
      `aero_geo_slug=${encodeURIComponent(matchedRegion.slug)}; ${cookieAttrs}`
    );
    headers.append(
      'Set-Cookie',
      `aero_geo_banner=${encodeURIComponent(bannerText)}; ${cookieAttrs}`
    );

    return new Response(null, {
      status: 200,
      headers,
    });
  } catch {
    // Fail-open safeguard: never block or throw 500 MIDDLEWARE_INVOCATION_FAILED on edge invocations
    return new Response(null, {
      status: 200,
      headers: {
        'x-middleware-next': '1',
      },
    });
  }
}

export default middleware;

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|robots.txt|sitemap.xml|feed.xml).*)',
  ],
};
