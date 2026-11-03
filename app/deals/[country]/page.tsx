import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INITIAL_PRODUCTS } from '../../../src/server/seed-data';
import {
  TARGET_REGIONS,
  findRegionBySlugOrIso,
  buildDealsHreflangAlternates,
  formatRegionalPrice,
  localizeAmazonAffiliateUrl,
  buildRegionalDealsJsonLd,
} from '../../../src/lib/i18n-regions';

const BASE_DOMAIN = 'https://aerothor.vercel.app';

interface CountryDealsPageProps {
  params: Promise<{ country: string }>;
}

/**
 * Pre-renders all 10 Amazon Associates / Dropshipping target country landing pages at build time
 * (/deals/us, /deals/uk, /deals/canada, /deals/france, /deals/germany, /deals/italy,
 *  /deals/netherlands, /deals/poland, /deals/spain, /deals/sweden)
 */
export async function generateStaticParams() {
  return TARGET_REGIONS.map((region) => ({
    country: region.slug,
  }));
}

/**
 * Dynamic International SEO Metadata + 10-Country Hreflang Alternates for `/deals/[country]`
 */
export async function generateMetadata({
  params,
}: CountryDealsPageProps): Promise<Metadata> {
  const { country } = await params;
  const region = findRegionBySlugOrIso(country);

  if (!region) {
    return {
      title: 'Regional Deals Not Found | AeroThor',
      description: 'The requested regional deals page could not be found.',
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `${BASE_DOMAIN}/deals/${region.slug}`;
  const hreflangAlternates = buildDealsHreflangAlternates(BASE_DOMAIN);
  const title = `${region.localizedDealsH1} | Fast Dispatch & Amazon.${region.amazonDomain.replace(/^amazon\./, '')} Deals`;
  const description = `${region.localizedDealsSubtitle} Shop verified everyday carry, GaN chargers, and tech gear in ${region.currencyCode} (${region.currencySymbol}) with ${region.dispatchBannerText}.`;

  return {
    title,
    description,
    keywords: [
      region.localizedDealsH1,
      ...region.seoKeywords,
      `Amazon ${region.countryName} tech deals`,
      `buy tech accessories in ${region.countryName}`,
      region.fastShippingKeyword,
    ],
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangAlternates,
    },
    openGraph: {
      type: 'website',
      locale: region.hreflang.replace('-', '_'),
      alternateLocale: TARGET_REGIONS.map((r) => r.hreflang.replace('-', '_')),
      url: canonicalUrl,
      siteName: 'AeroThor Commerce',
      title,
      description,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
          width: 1200,
          height: 630,
          alt: region.localizedDealsH1,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80',
      ],
    },
  };
}

/**
 * Programmatic Country-Targeted SEO Landing Page (`app/deals/[country]/page.tsx`)
 */
export default async function CountryDealsLandingPage({
  params,
}: CountryDealsPageProps) {
  const { country } = await params;
  const region = findRegionBySlugOrIso(country);

  if (!region) {
    notFound();
  }

  // Prioritize verified Amazon Affiliate items + top-rated Direct Dropshipping products
  const sortedProducts = [...INITIAL_PRODUCTS].sort((a, b) => {
    const aIsAff =
      a.productType === 'affiliate' ||
      Boolean(a.affiliateUrl) ||
      Boolean(a.affiliate_url)
        ? 1
        : 0;
    const bIsAff =
      b.productType === 'affiliate' ||
      Boolean(b.affiliateUrl) ||
      Boolean(b.affiliate_url)
        ? 1
        : 0;
    return bIsAff - aIsAff;
  });

  const featuredProducts = sortedProducts.slice(0, 24);
  const hreflangAlternates = buildDealsHreflangAlternates(BASE_DOMAIN);
  const regionalJsonLd = buildRegionalDealsJsonLd(
    region,
    featuredProducts,
    BASE_DOMAIN
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hreflang Link Tags for all 10 Target Regions */}
      {Object.entries(hreflangAlternates).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Localized Schema.org JSON-LD (CollectionPage + ItemList + Regional Offers) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(regionalJsonLd) }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* 10-Country Programmatic Navigation Switcher */}
        <nav
          aria-label="International Region Selector"
          className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-slate-800"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <a
              href="/"
              className="hover:text-emerald-400 transition-colors font-medium"
            >
              AeroThor Home
            </a>
            <span>/</span>
            <span className="text-slate-300">Regional Deals</span>
            <span>/</span>
            <span className="text-emerald-400 font-semibold">
              {region.flag} {region.countryName} ({region.hreflang})
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {TARGET_REGIONS.map((target) => {
              const isActive = target.slug === region.slug;
              return (
                <a
                  key={target.slug}
                  href={`/deals/${target.slug}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {target.flag} {target.countryName}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Localized Country Hero Section */}
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-10 lg:p-12 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-emerald-400">
            <span>
              {region.flag} {region.countryName.toUpperCase()} STOREFRONT ({region.hreflang})
            </span>
            <span className="text-slate-600">·</span>
            <span>CURRENCY: {region.currencyCode} ({region.currencySymbol})</span>
            <span className="text-slate-600">·</span>
            <span>AMAZON MARKETPLACE: {region.amazonDomain.toUpperCase()}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {region.localizedDealsH1}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            {region.localizedDealsSubtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300 border-t border-slate-800/80">
            <div>
              <span className="text-slate-500 block">Regional Carrier</span>
              <strong className="text-white">{region.carrierName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Estimated Delivery</span>
              <strong className="text-emerald-400">{region.transitDays}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Dispatch Guarantee</span>
              <strong className="text-white">{region.dispatchBannerText}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Buyer Protection</span>
              <strong className="text-white">30-Day Money-Back Guarantee</strong>
            </div>
          </div>
        </header>

        {/* Localized Product Grid */}
        <section aria-labelledby="regional-catalog-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2
                id="regional-catalog-heading"
                className="text-xl sm:text-2xl font-bold text-white"
              >
                Verified {region.countryName} Deals &amp; Direct Dispatch Inventory
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Showing {featuredProducts.length} high-demand products localized in{' '}
                {region.currencyCode} ({region.currencySymbol}) for {region.countryNameWithArticle}.
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              Affiliate Disclosure: Qualifying purchases via {region.amazonDomain} earn AeroThor a commission at no extra cost to you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((item) => {
              const isAffiliate =
                item.productType === 'affiliate' ||
                Boolean(item.affiliateUrl) ||
                Boolean(item.affiliate_url);
              const regionalPrice = formatRegionalPrice(
                item.sale_price || item.price,
                region
              );
              const comparePrice = formatRegionalPrice(
                (parseFloat(
                  String(item.sale_price || item.price || '29.99').replace(
                    /[^0-9.]/g,
                    ''
                  )
                ) || 29.99) * 1.28,
                region
              );
              const localizedAmazonHref = localizeAmazonAffiliateUrl(
                item.affiliateUrl || item.affiliate_url,
                item.title,
                region
              );
              const productDetailHref = `/product/${encodeURIComponent(item.id)}?region=${region.slug}`;

              return (
                <article
                  key={item.id}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col overflow-hidden"
                >
                  <a
                    href={productDetailHref}
                    className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden block"
                  >
                    <img
                      src={item.image_link}
                      alt={`${item.title} - ${region.countryName}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                        {item.brand || 'AeroThor'} ·{' '}
                        {isAffiliate
                          ? `Amazon.${region.amazonDomain.replace(/^amazon\./, '')}`
                          : `${region.isoCode} Direct`}
                      </p>
                      <h3 className="text-base font-semibold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        <a href={productDetailHref}>{item.title}</a>
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-white font-mono tabular-nums">
                            {regionalPrice.formatted}
                          </span>
                          <span className="text-xs text-slate-500 line-through font-mono tabular-nums">
                            {comparePrice.formatted}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          In Stock ({region.isoCode})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={localizedAmazonHref}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#FF9900] hover:bg-[#e68a00] text-slate-950 font-bold text-xs transition-colors text-center"
                        >
                          <span>Buy on {region.amazonDomain}</span>
                        </a>
                        <a
                          href={productDetailHref}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors text-center"
                        >
                          <span>View Specs</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Regional SEO Internal Linking Footer Block */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Explore AeroThor International Storefronts (10 Active Regions)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {TARGET_REGIONS.map((r) => (
              <a
                key={r.slug}
                href={`/deals/${r.slug}`}
                className="p-3 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:border-emerald-500/40 transition-colors block"
              >
                <div className="text-xs font-bold text-white">
                  {r.flag} {r.countryName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {r.hreflang} · {r.currencyCode} ({r.currencySymbol})
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
