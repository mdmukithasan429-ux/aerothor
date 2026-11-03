import React from 'react';
import type { Metadata } from 'next';
import { headers, cookies } from 'next/headers';
import Script from 'next/script';
import { getRegionOrDefault } from '../src/lib/i18n-regions';
import { getStoreSettings } from '../src/lib/settings';

const BASE_DOMAIN = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  'https://aerothor.smmgrows.com'
).replace(/\/$/, '');

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.VITE_GA_MEASUREMENT_ID ||
  'G-0KS0T13HQ7';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const brandName =
    settings.storeName && settings.storeName !== 'Set up in Admin'
      ? settings.storeName
      : 'Official Direct Store';

  return {
    metadataBase: new URL(BASE_DOMAIN),
    title: {
      default: `${brandName} — Official US & UK Direct Store | Protective Skins & Tech Gear`,
      template: `%s | ${brandName}`,
    },
    description: `Shop 1,060+ verified ${brandName} 3M protective skins, precision device wraps, and top-selling US & UK tech essentials. Fast 48h domestic fulfillment in the United States and United Kingdom.`,
    keywords: [
      brandName,
      'protective skins',
      '3M vinyl wraps',
      'tech accessories',
      'everyday carry',
      'US UK tracked shipping',
      'MagSafe charging',
    ],
    alternates: {
      canonical: `${BASE_DOMAIN}/`,
      languages: {
        'en-US': `${BASE_DOMAIN}/deals/us`,
        'en-GB': `${BASE_DOMAIN}/deals/uk`,
        'x-default': `${BASE_DOMAIN}/`,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: ['en_GB'],
      url: `${BASE_DOMAIN}/`,
      siteName: brandName,
      title: `${brandName} — Official US & UK Direct Store | Fast Tracked Shipping`,
      description: `Shop verified ${brandName} protective skins, tech accessories, and lifestyle gear. Free 48h tracked dispatch across the US & UK with 30-day guarantee.`,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: `${brandName} Official US & UK Storefront`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brandName} — Official US & UK Direct Store`,
      description: `Shop verified ${brandName} protective skins, tech accessories, and lifestyle gear with 48h US & UK dispatch.`,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: [
        'googlee6a39edbc64fe5aa',
        'googlee6a39edbc64fe5aa.html',
        'XYvXZ1Kd3MsTbTSeQRzyddv22J163MNCsdavsGaW4iE',
      ],
    },
    other: {
      'geo.region': 'US-NY;GB-LND',
      'content-language': 'en-US, en-GB',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let detectedCountryCode = 'US';
  try {
    const reqHeaders = await headers();
    const reqCookies = await cookies();
    const rawCountry =
      reqHeaders.get('x-user-country') ||
      reqHeaders.get('x-vercel-ip-country') ||
      reqCookies.get('aero_geo_country')?.value ||
      'US';
    // Strictly map to US or GB for our US/UK focus
    detectedCountryCode = rawCountry.toUpperCase() === 'GB' || rawCountry.toUpperCase() === 'UK' ? 'GB' : 'US';
  } catch {
    detectedCountryCode = 'US';
  }

  const activeRegion = getRegionOrDefault(detectedCountryCode);

  return (
    <html lang={detectedCountryCode === 'GB' ? 'en-GB' : 'en-US'} className="dark">
      <head>
        {/* Strict US (en-US) & UK (en-GB) Hreflang Link Tags to filter out non-converting Asian traffic */}
        <link rel="alternate" hrefLang="x-default" href={`${BASE_DOMAIN}/`} />
        <link rel="alternate" hrefLang="en-US" href={`${BASE_DOMAIN}/deals/us`} />
        <link rel="alternate" hrefLang="en-GB" href={`${BASE_DOMAIN}/deals/uk`} />

        {/* Google Analytics 4 (GA4) Tracking Script — Deferred via lazyOnload for 0ms TBT */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `}
        </Script>
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Geo-Routed Regional Dispatch Notification Bar (US & UK Exclusive) */}
        <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span aria-hidden="true">{activeRegion.flag}</span>
              <span className="font-semibold text-emerald-400">
                Free 48h Dispatch to {activeRegion.countryNameWithArticle}
              </span>
              <span className="hidden sm:inline text-slate-500">·</span>
              <span className="hidden sm:inline text-slate-400">
                Carrier: {activeRegion.carrierName} ({activeRegion.transitDays})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden md:inline">Target Markets:</span>
              <a
                href="/deals/us"
                aria-label="Switch target market to United States (USD)"
                className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                  detectedCountryCode === 'US'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🇺🇸 US (USD)
              </a>
              <a
                href="/deals/uk"
                aria-label="Switch target market to United Kingdom (GBP)"
                className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                  detectedCountryCode === 'GB'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🇬🇧 UK (GBP)
              </a>
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
