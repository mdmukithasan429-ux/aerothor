import React from 'react';
import type { Metadata } from 'next';
import { headers, cookies } from 'next/headers';
import Script from 'next/script';
import {
  TARGET_REGIONS,
  buildStorefrontHreflangAlternates,
  getRegionOrDefault,
} from '../src/lib/i18n-regions';

const BASE_DOMAIN = 'https://aerothor.vercel.app';
const GA_MEASUREMENT_ID = 'G-0KS0T13HQ7';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_DOMAIN),
  title: {
    default: 'AeroThor — Official US, UK & EU Direct Store | Fast Tracked Shipping',
    template: '%s | AeroThor',
  },
  description:
    'Shop verified AeroThor performance essentials, tech accessories, and curated Amazon Associate deals across US, UK, Canada, France, Germany, Italy, Netherlands, Poland, Spain & Sweden.',
  keywords: [
    'AeroThor',
    'tech accessories',
    'everyday carry',
    'EDC gear',
    'Amazon tech deals',
    'US UK Canada EU tracked shipping',
    'MagSafe charging',
    'performance gear',
  ],
  alternates: {
    canonical: `${BASE_DOMAIN}/`,
    languages: buildStorefrontHreflangAlternates(BASE_DOMAIN),
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: [
      'en_GB',
      'en_CA',
      'fr_FR',
      'de_DE',
      'it_IT',
      'nl_NL',
      'pl_PL',
      'es_ES',
      'sv_SE',
    ],
    url: `${BASE_DOMAIN}/`,
    siteName: 'AeroThor Commerce',
    title: 'AeroThor — Official US, UK & EU Direct Store | Fast Tracked Shipping',
    description:
      'Shop verified AeroThor performance essentials, tech accessories, and lifestyle gear. Free 48h tracked dispatch across 10 international regions and 30-day money-back guarantee.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'AeroThor Official Direct Store & Global Deals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AeroThor — Official US, UK & EU Direct Store',
    description:
      'Shop verified AeroThor performance essentials, tech accessories, and lifestyle gear with 48h regional dispatch.',
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
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect user country injected by Edge Middleware (middleware.ts) or Vercel geo headers
  let detectedCountryCode = 'US';
  try {
    const reqHeaders = await headers();
    const reqCookies = await cookies();
    detectedCountryCode =
      reqHeaders.get('x-user-country') ||
      reqHeaders.get('x-vercel-ip-country') ||
      reqCookies.get('aero_geo_country')?.value ||
      'US';
  } catch {
    detectedCountryCode = 'US';
  }

  const activeRegion = getRegionOrDefault(detectedCountryCode);

  return (
    <html lang={activeRegion.hreflang} className="dark">
      <head>
        {/* Explicit Hreflang Link Tags for all 10 Target Amazon Associates & Dropshipping Regions */}
        <link rel="alternate" hrefLang="x-default" href={`${BASE_DOMAIN}/`} />
        {TARGET_REGIONS.map((region) => (
          <link
            key={region.hreflang}
            rel="alternate"
            hrefLang={region.hreflang}
            href={
              region.slug === 'us'
                ? `${BASE_DOMAIN}/`
                : `${BASE_DOMAIN}/deals/${region.slug}`
            }
          />
        ))}

        {/* Google Analytics 4 (GA4) Tracking Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
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
        {/* Geo-Routed Regional Dispatch Notification Bar */}
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
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-400 hidden md:inline">Regional Deals:</span>
              {TARGET_REGIONS.map((r) => (
                <a
                  key={r.slug}
                  href={`/deals/${r.slug}`}
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    r.slug === activeRegion.slug
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={r.localizedDealsH1}
                >
                  {r.isoCode}
                </a>
              ))}
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
