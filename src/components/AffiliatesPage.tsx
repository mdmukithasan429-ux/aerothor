import React, { useState, useMemo, useEffect } from 'react';
import { GmcProduct, CANONICAL_STORE_URL } from '../lib/gmc-feed';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowUpRight,
  ShoppingBag,
  Info,
  CheckCircle2,
  X,
  Compass,
  Globe,
  Truck,
} from 'lucide-react';
import { formatPriceForDisplay } from '../lib/currency';
import {
  TARGET_REGIONS,
  findRegionBySlugOrIso,
  formatRegionalPrice,
  localizeAmazonAffiliateUrl,
  buildRegionalDealsJsonLd,
} from '../lib/i18n-regions';
import { InternationalSeoDashboard } from './InternationalSeoDashboard';

interface AffiliatesPageProps {
  products: GmcProduct[];
  onNavigateToStorefront: () => void;
  onSelectCategory?: (category: string) => void;
  selectedRegionSlug?: string | null;
  onSelectRegionSlug?: (slug: string | null) => void;
}

export const AffiliatesPage: React.FC<AffiliatesPageProps> = ({
  products,
  onNavigateToStorefront,
  selectedRegionSlug,
  onSelectRegionSlug,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerCategory, setSelectedPartnerCategory] = useState<string>('All');

  const activeRegion = useMemo(
    () => findRegionBySlugOrIso(selectedRegionSlug) || null,
    [selectedRegionSlug]
  );

  // Filter for affiliate products (and when in programmatic country mode, include top dropshipping products if affiliate list is small)
  const affiliateProducts = useMemo(() => {
    const strictAffiliates = products.filter((p) => {
      const isAff =
        p.productType === 'affiliate' ||
        Boolean(p.affiliateUrl) ||
        Boolean(p.affiliate_url) ||
        p.id.toLowerCase().startsWith('aff-');
      return isAff;
    });

    if (activeRegion && strictAffiliates.length < 12) {
      const nonAffiliates = products.filter(
        (p) => !strictAffiliates.some((a) => a.id === p.id)
      );
      return [...strictAffiliates, ...nonAffiliates.slice(0, 24 - strictAffiliates.length)];
    }

    return strictAffiliates;
  }, [products, activeRegion]);

  // Synchronize document <head> title, canonical, and localized CollectionPage JSON-LD when viewing /deals/[country]
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!activeRegion) return;

    const pageTitle = `${activeRegion.localizedDealsH1} | Fast Dispatch & Amazon.${activeRegion.amazonDomain.replace(/^amazon\./, '')} Deals`;
    document.title = pageTitle;

    const canonicalEl = document.getElementById('canonical-link') as HTMLLinkElement | null;
    if (canonicalEl) {
      canonicalEl.href = `${CANONICAL_STORE_URL}/deals/${activeRegion.slug}`;
    }

    let scriptEl = document.getElementById('regional-deals-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'regional-deals-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(
      buildRegionalDealsJsonLd(activeRegion, affiliateProducts.slice(0, 24), CANONICAL_STORE_URL)
    );

    return () => {
      const existing = document.getElementById('regional-deals-jsonld');
      if (existing) existing.remove();
    };
  }, [activeRegion, affiliateProducts]);

  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    affiliateProducts.forEach((p) => {
      if (p.product_type) {
        const parts = p.product_type.split('>');
        const mainCat = parts[parts.length - 1].trim();
        if (mainCat) list.add(mainCat);
      }
    });
    return Array.from(list);
  }, [affiliateProducts]);

  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return affiliateProducts.filter((p) => {
      const matchesCategory =
        selectedPartnerCategory === 'All' ||
        (p.product_type &&
          p.product_type.toLowerCase().includes(selectedPartnerCategory.toLowerCase()));

      if (!matchesCategory) return false;
      if (!q) return true;

      const searchable = `${p.title} ${p.description} ${p.brand} ${p.id}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [affiliateProducts, searchQuery, selectedPartnerCategory]);

  const handleCountryClick = (slug: string | null) => {
    if (onSelectRegionSlug) {
      onSelectRegionSlug(slug);
    }
    try {
      const nextPath = slug ? `/deals/${slug}` : '/affiliates';
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath);
      }
    } catch {
      // ignore in restricted iframe contexts
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 10-Country Programmatic SEO Landing Page Switcher (/deals/[country]) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">
            Amazon Associates 10-Country Programmatic SEO Pages:
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleCountryClick(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !activeRegion
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Global All
          </button>
          {TARGET_REGIONS.map((region) => {
            const isSelected = activeRegion?.slug === region.slug;
            return (
              <button
                key={region.slug}
                type="button"
                onClick={() => handleCountryClick(region.slug)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
                title={`${region.localizedDealsH1} (/deals/${region.slug})`}
              >
                {region.flag} {region.countryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Header (Localized when a country `/deals/[country]` is active) */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 sm:p-10 lg:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {activeRegion ? (
              <span>
                {activeRegion.flag} {activeRegion.countryName.toUpperCase()} STOREFRONT ({activeRegion.hreflang}) · CURRENCY: {activeRegion.currencyCode} ({activeRegion.currencySymbol}) · {activeRegion.amazonDomain.toUpperCase()}
              </span>
            ) : (
              <span>Curated Partner Deals &amp; Verified Merchant Links (10 Active Regions)</span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {activeRegion ? (
              activeRegion.localizedDealsH1
            ) : (
              <>
                Exclusive{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
                  Affiliate Deals
                </span>{' '}
                &amp; Market Drops
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {activeRegion
              ? activeRegion.localizedDealsSubtitle
              : 'Hand-selected everyday carry, pro audio, and expedition accessories from authorized global retail partners across 10 Amazon Associates marketplaces (US, UK, Canada, France, Germany, Italy, Netherlands, Poland, Spain, and Sweden).'}
          </p>

          {activeRegion && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-300 font-medium pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                {activeRegion.dispatchBannerText} ({activeRegion.carrierName})
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-slate-300">
                Canonical: /deals/{activeRegion.slug}
              </span>
            </div>
          )}

          {/* FTC Disclosure Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/30 text-xs text-amber-200/90 leading-snug">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Affiliate Disclosure:</strong> When you purchase through links on this page, we may earn an affiliate commission via{' '}
              {activeRegion ? `Amazon (${activeRegion.amazonDomain})` : 'Amazon Associates'} at no extra cost to you.
            </span>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToStorefront}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Back to Dropshipping Direct Storefront</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              {affiliateProducts.length} Verified Partner Deals Live
            </span>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedPartnerCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedPartnerCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search partner deals..."
              className="w-full pl-10 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>
            Showing <strong className="text-amber-400">{filteredDeals.length}</strong> of{' '}
            {affiliateProducts.length} partner deals
            {activeRegion ? ` for ${activeRegion.countryName} (${activeRegion.currencyCode})` : ''}
          </span>
          <span className="flex items-center gap-1.5 text-amber-300/80">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            External Checkout · Zero Card Storage
          </span>
        </div>
      </section>

      {/* Affiliate Product Grid */}
      <section>
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
            <Tag className="w-10 h-10 text-amber-400/60 mx-auto" />
            <h3 className="text-base font-bold text-white">No partner deals match your search</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords or resetting the category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPartnerCategory('All');
              }}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDeals.map((product) => {
              const targetUrl = activeRegion
                ? localizeAmazonAffiliateUrl(
                    product.affiliateUrl || product.affiliate_url,
                    product.title,
                    activeRegion
                  )
                : product.affiliateUrl ||
                  product.affiliate_url ||
                  `https://www.amazon.com/s?k=${encodeURIComponent(product.title)}`;

              const displaySalePrice = activeRegion
                ? formatRegionalPrice(product.sale_price || product.price, activeRegion).formatted
                : formatPriceForDisplay(product.sale_price || product.price);

              const displayRegularPrice = activeRegion
                ? formatRegionalPrice(
                    (parseFloat(
                      String(product.price || '39.99').replace(/[^0-9.]/g, '')
                    ) || 39.99) * 1.25,
                    activeRegion
                  ).formatted
                : formatPriceForDisplay(product.price);

              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-slate-900/90 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-200 overflow-hidden"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                      <img
                        src={product.image_link}
                        alt={product.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Partner Merchant Identifier */}
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-sm border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-amber-400" />
                        {activeRegion ? activeRegion.amazonDomain : 'Amazon Partner'}
                      </span>
                    </div>

                    {/* Product Metadata & Title */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] truncate">
                          {product.brand || 'AeroThor'}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {activeRegion ? activeRegion.isoCode : product.id}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Distinct Feature Tag */}
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          {activeRegion
                            ? `${activeRegion.dispatchBannerText}`
                            : 'Prime Shipping Eligible via Amazon'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer with Distinct Buy on Amazon Button */}
                  <div className="p-4 pt-3 border-t border-slate-800 bg-slate-950/60 mt-auto space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-mono tabular-nums">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-amber-400">
                            {displaySalePrice}
                          </span>
                          {(product.sale_price || activeRegion) && (
                            <span className="text-xs text-slate-500 line-through">
                              {displayRegularPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">
                        In Stock
                      </span>
                    </div>

                    {/* DIRECT OUTBOUND LINK TO AMAZON / AFFILIATE PARTNER */}
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="w-full py-2.5 px-3 bg-[#FF9900] hover:bg-[#e68a00] text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation group/btn"
                    >
                      <span>
                        {activeRegion
                          ? `Buy on ${activeRegion.amazonDomain}`
                          : 'Buy on Amazon / View Deal'}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* International SEO & GA4 Regional Traffic Verification Dashboard */}
      <InternationalSeoDashboard />
    </div>
  );
};
