import { GmcProduct, CANONICAL_STORE_URL } from './gmc-feed';

export interface TargetRegionConfig {
  slug:
    | 'us'
    | 'uk'
    | 'canada'
    | 'france'
    | 'germany'
    | 'italy'
    | 'netherlands'
    | 'poland'
    | 'spain'
    | 'sweden';
  isoCode: 'US' | 'GB' | 'CA' | 'FR' | 'DE' | 'IT' | 'NL' | 'PL' | 'ES' | 'SE';
  hreflang:
    | 'en-US'
    | 'en-GB'
    | 'en-CA'
    | 'fr-FR'
    | 'de-DE'
    | 'it-IT'
    | 'nl-NL'
    | 'pl-PL'
    | 'es-ES'
    | 'sv-SE';
  countryName: string;
  countryNameWithArticle: string;
  flag: string;
  currencyCode: 'USD' | 'GBP' | 'CAD' | 'EUR' | 'PLN' | 'SEK';
  currencySymbol: string;
  exchangeRateFromUsd: number;
  amazonDomain: string;
  amazonAssociateTag: string;
  dispatchBannerText: string;
  fastShippingKeyword: string;
  carrierName: string;
  transitDays: string;
  localizedDealsH1: string;
  localizedDealsSubtitle: string;
  seoKeywords: string[];
}

export const TARGET_REGIONS: TargetRegionConfig[] = [
  {
    slug: 'us',
    isoCode: 'US',
    hreflang: 'en-US',
    countryName: 'United States',
    countryNameWithArticle: 'the United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    exchangeRateFromUsd: 1.0,
    amazonDomain: 'amazon.com',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to the United States',
    fastShippingKeyword: 'Fast Shipping to US & North America',
    carrierName: 'USPS Priority Mail & UPS Ground',
    transitDays: '2–5 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in the United States (2026)',
    localizedDealsSubtitle:
      'Verified Amazon.com Prime deals and direct domestic warehouse dropshipping gear with 48-hour USPS tracked dispatch across all 50 states.',
    seoKeywords: [
      'best tech deals United States 2026',
      'Amazon US tech accessories',
      'fast USPS shipping gadgets',
      'EDC gear USA',
    ],
  },
  {
    slug: 'uk',
    isoCode: 'GB',
    hreflang: 'en-GB',
    countryName: 'United Kingdom',
    countryNameWithArticle: 'the United Kingdom',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    exchangeRateFromUsd: 0.79,
    amazonDomain: 'amazon.co.uk',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to the United Kingdom',
    fastShippingKeyword: 'Fast Shipping to UK/Canada',
    carrierName: 'Royal Mail Tracked 48 & DPD UK',
    transitDays: '2–4 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in the United Kingdom (2026)',
    localizedDealsSubtitle:
      'Hand-picked Amazon.co.uk Prime tech offers and UK domestic warehouse essentials with VAT-inclusive GBP pricing and Royal Mail Tracked 48 delivery.',
    seoKeywords: [
      'top tech deals UK 2026',
      'Amazon UK gadget deals',
      'Royal Mail 48h tech accessories',
      'best everyday carry UK',
    ],
  },
  {
    slug: 'canada',
    isoCode: 'CA',
    hreflang: 'en-CA',
    countryName: 'Canada',
    countryNameWithArticle: 'Canada',
    flag: '🇨🇦',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    exchangeRateFromUsd: 1.36,
    amazonDomain: 'amazon.ca',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to Canada',
    fastShippingKeyword: 'Fast Shipping to Canada & UK',
    carrierName: 'Canada Post Expedited & Purolator',
    transitDays: '3–6 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in Canada (2026)',
    localizedDealsSubtitle:
      'Curated Amazon.ca Prime tech markdowns and duty-cleared Canadian dropshipping gear priced in CAD with fast dispatch to Toronto, Vancouver, and Montreal.',
    seoKeywords: [
      'top tech deals Canada 2026',
      'Amazon Canada electronics deals',
      'fast shipping tech accessories Canada',
      'EDC gear Canada CAD',
    ],
  },
  {
    slug: 'france',
    isoCode: 'FR',
    hreflang: 'fr-FR',
    countryName: 'France',
    countryNameWithArticle: 'France',
    flag: '🇫🇷',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateFromUsd: 0.92,
    amazonDomain: 'amazon.fr',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to France',
    fastShippingKeyword: 'Fast Shipping to France & EU',
    carrierName: 'Colissimo Suivi & Chronopost France',
    transitDays: '3–5 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in France (2026)',
    localizedDealsSubtitle:
      'Verified Amazon.fr Prime tech selections and EU warehouse performance gear in EUR (€) with rapid Colissimo tracked delivery across metropolitan France.',
    seoKeywords: [
      'meilleures offres tech France 2026',
      'Amazon.fr accessoires high-tech',
      'livraison rapide 48h France',
      'top tech deals France',
    ],
  },
  {
    slug: 'germany',
    isoCode: 'DE',
    hreflang: 'de-DE',
    countryName: 'Germany',
    countryNameWithArticle: 'Germany',
    flag: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateFromUsd: 0.92,
    amazonDomain: 'amazon.de',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to Germany',
    fastShippingKeyword: 'Fast Shipping to Germany & EU',
    carrierName: 'DHL Paket Deutschland',
    transitDays: '2–5 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in Germany (2026)',
    localizedDealsSubtitle:
      'Precision-engineered tech accessories, GaN chargers, and Amazon.de Prime deals priced in EUR (€) with fast DHL Paket delivery throughout Germany.',
    seoKeywords: [
      'Top Tech Angebote Deutschland 2026',
      'Amazon.de Technik Deals',
      'schneller Versand Deutschland',
      'best tech deals Germany',
    ],
  },
  {
    slug: 'italy',
    isoCode: 'IT',
    hreflang: 'it-IT',
    countryName: 'Italy',
    countryNameWithArticle: 'Italy',
    flag: '🇮🇹',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateFromUsd: 0.92,
    amazonDomain: 'amazon.it',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to Italy',
    fastShippingKeyword: 'Fast Shipping to Italy & EU',
    carrierName: 'Poste Italiane & BRT Corriere Espresso',
    transitDays: '3–6 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in Italy (2026)',
    localizedDealsSubtitle:
      'Exclusive Amazon.it Prime electronics deals and Italian express-dispatched travel & desk essentials with transparent EUR (€) pricing.',
    seoKeywords: [
      'migliori offerte tech Italia 2026',
      'accessori tech Amazon.it',
      'spedizione veloce 48h Italia',
      'top tech deals Italy',
    ],
  },
  {
    slug: 'netherlands',
    isoCode: 'NL',
    hreflang: 'nl-NL',
    countryName: 'Netherlands',
    countryNameWithArticle: 'the Netherlands',
    flag: '🇳🇱',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateFromUsd: 0.92,
    amazonDomain: 'amazon.nl',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to the Netherlands',
    fastShippingKeyword: 'Fast Shipping to Netherlands & Benelux',
    carrierName: 'PostNL Track & Trace',
    transitDays: '2–4 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in the Netherlands (2026)',
    localizedDealsSubtitle:
      'Top-rated Amazon.nl tech accessories and Benelux rapid-fulfillment gear in EUR (€) with PostNL tracked dispatch to Amsterdam, Rotterdam, and Utrecht.',
    seoKeywords: [
      'beste tech deals Nederland 2026',
      'Amazon.nl elektronica aanbiedingen',
      'snelle verzending PostNL',
      'top tech deals Netherlands',
    ],
  },
  {
    slug: 'poland',
    isoCode: 'PL',
    hreflang: 'pl-PL',
    countryName: 'Poland',
    countryNameWithArticle: 'Poland',
    flag: '🇵🇱',
    currencyCode: 'PLN',
    currencySymbol: 'zł',
    exchangeRateFromUsd: 3.98,
    amazonDomain: 'amazon.pl',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to Poland',
    fastShippingKeyword: 'Fast Shipping to Poland & Central Europe',
    carrierName: 'InPost Paczkomat & DPD Polska',
    transitDays: '2–5 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in Poland (2026)',
    localizedDealsSubtitle:
      'Verified Amazon.pl Prime tech promotions and Central European hub inventory priced in Polish Złoty (PLN) with fast InPost & DPD delivery.',
    seoKeywords: [
      'najlepsze okazje technologiczne Polska 2026',
      'Amazon.pl promocje elektronika',
      'szybka wysyłka 48h Polska',
      'top tech deals Poland',
    ],
  },
  {
    slug: 'spain',
    isoCode: 'ES',
    hreflang: 'es-ES',
    countryName: 'Spain',
    countryNameWithArticle: 'Spain',
    flag: '🇪🇸',
    currencyCode: 'EUR',
    currencySymbol: '€',
    exchangeRateFromUsd: 0.92,
    amazonDomain: 'amazon.es',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to Spain',
    fastShippingKeyword: 'Fast Shipping to Spain & EU',
    carrierName: 'Correos Express & SEUR España',
    transitDays: '3–5 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in Spain (2026)',
    localizedDealsSubtitle:
      'Hand-selected Amazon.es Prime tech deals and Iberian express-shipping accessories in EUR (€) with 48-hour dispatch to Madrid, Barcelona, and Valencia.',
    seoKeywords: [
      'mejores ofertas tecnológicas España 2026',
      'accesorios tech Amazon.es',
      'envío rápido 48h España',
      'top tech deals Spain',
    ],
  },
  {
    slug: 'sweden',
    isoCode: 'SE',
    hreflang: 'sv-SE',
    countryName: 'Sweden',
    countryNameWithArticle: 'Sweden',
    flag: '🇸🇪',
    currencyCode: 'SEK',
    currencySymbol: 'kr',
    exchangeRateFromUsd: 10.45,
    amazonDomain: 'amazon.se',
    amazonAssociateTag: 'aerothor-20',
    dispatchBannerText: 'Free 48h Dispatch to Sweden',
    fastShippingKeyword: 'Fast Shipping to Sweden & Nordics',
    carrierName: 'PostNord Tracked Sweden',
    transitDays: '3–5 Business Days',
    localizedDealsH1: 'Top Tech Deals & Accessories in Sweden (2026)',
    localizedDealsSubtitle:
      'Nordic-tested everyday carry, desk hardware, and Amazon.se Prime tech offers priced in SEK (kr) with PostNord tracked delivery across Sweden.',
    seoKeywords: [
      'bästa teknikdeals Sverige 2026',
      'Amazon.se teknik och tillbehör',
      'snabb leverans PostNord',
      'top tech deals Sweden',
    ],
  },
];

export const DEFAULT_REGION = TARGET_REGIONS[0]; // United States (en-US)

/**
 * Resolves a TargetRegionConfig from a URL slug (e.g., 'uk', 'canada'), ISO code ('GB', 'CA'), or hreflang ('en-GB').
 */
export function findRegionBySlugOrIso(input?: string | null): TargetRegionConfig | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  for (const r of TARGET_REGIONS) {
    if (
      r.slug === clean ||
      r.isoCode.toLowerCase() === clean ||
      r.hreflang.toLowerCase() === clean ||
      r.countryName.toLowerCase() === clean
    ) {
      return r;
    }
  }

  // Common aliases
  if (clean === 'gb' || clean === 'great-britain' || clean === 'england' || clean === 'united-kingdom') {
    return TARGET_REGIONS.find((r) => r.slug === 'uk') || null;
  }
  if (clean === 'usa' || clean === 'united-states') {
    return TARGET_REGIONS.find((r) => r.slug === 'us') || null;
  }
  if (clean === 'ca') {
    return TARGET_REGIONS.find((r) => r.slug === 'canada') || null;
  }
  if (clean === 'fr') {
    return TARGET_REGIONS.find((r) => r.slug === 'france') || null;
  }
  if (clean === 'de' || clean === 'deutschland') {
    return TARGET_REGIONS.find((r) => r.slug === 'germany') || null;
  }
  if (clean === 'it' || clean === 'italia') {
    return TARGET_REGIONS.find((r) => r.slug === 'italy') || null;
  }
  if (clean === 'nl' || clean === 'holland') {
    return TARGET_REGIONS.find((r) => r.slug === 'netherlands') || null;
  }
  if (clean === 'pl' || clean === 'polska') {
    return TARGET_REGIONS.find((r) => r.slug === 'poland') || null;
  }
  if (clean === 'es' || clean === 'espana') {
    return TARGET_REGIONS.find((r) => r.slug === 'spain') || null;
  }
  if (clean === 'se' || clean === 'sverige') {
    return TARGET_REGIONS.find((r) => r.slug === 'sweden') || null;
  }

  return null;
}

export function getRegionOrDefault(input?: string | null): TargetRegionConfig {
  return findRegionBySlugOrIso(input) || DEFAULT_REGION;
}

/**
 * Generates Next.js `alternates.languages` map for the root storefront (`/` -> `/deals/[country]`).
 */
export function buildStorefrontHreflangAlternates(
  baseUrl: string = CANONICAL_STORE_URL
): Record<string, string> {
  const origin = baseUrl.replace(/\/+$/, '');
  const languages: Record<string, string> = {
    'x-default': `${origin}/`,
  };
  for (const region of TARGET_REGIONS) {
    languages[region.hreflang] =
      region.slug === 'us' ? `${origin}/` : `${origin}/deals/${region.slug}`;
  }
  return languages;
}

/**
 * Generates Next.js `alternates.languages` map for a specific product page (`/product/[id]`).
 */
export function buildProductHreflangAlternates(
  productId: string,
  baseUrl: string = CANONICAL_STORE_URL
): Record<string, string> {
  const origin = baseUrl.replace(/\/+$/, '');
  const encodedId = encodeURIComponent(productId);
  const languages: Record<string, string> = {
    'x-default': `${origin}/product/${encodedId}`,
  };
  for (const region of TARGET_REGIONS) {
    languages[region.hreflang] =
      region.slug === 'us'
        ? `${origin}/product/${encodedId}`
        : `${origin}/product/${encodedId}?region=${region.slug}`;
  }
  return languages;
}

/**
 * Generates Next.js `alternates.languages` map for programmatic `/deals/[country]` landing pages.
 */
export function buildDealsHreflangAlternates(
  baseUrl: string = CANONICAL_STORE_URL
): Record<string, string> {
  const origin = baseUrl.replace(/\/+$/, '');
  const languages: Record<string, string> = {
    'x-default': `${origin}/deals/us`,
  };
  for (const region of TARGET_REGIONS) {
    languages[region.hreflang] = `${origin}/deals/${region.slug}`;
  }
  return languages;
}

/**
 * Converts a base USD price into localized display & numeric strings for a target country.
 */
export function formatRegionalPrice(
  usdPriceInput: number | string,
  region: TargetRegionConfig
): { formatted: string; numeric: string; currency: string } {
  const numericUsd =
    typeof usdPriceInput === 'number'
      ? usdPriceInput
      : parseFloat(String(usdPriceInput || '0').replace(/[^0-9.]/g, '')) || 29.99;

  const converted = numericUsd * region.exchangeRateFromUsd;
  const rounded =
    region.currencyCode === 'SEK' || region.currencyCode === 'PLN'
      ? Math.round(converted) - 0.01
      : Number((Math.floor(converted) + 0.99).toFixed(2));
  const finalAmount = Math.max(1.99, rounded);
  const numericStr = finalAmount.toFixed(2);

  if (region.currencyCode === 'PLN' || region.currencyCode === 'SEK') {
    return {
      formatted: `${numericStr} ${region.currencySymbol}`,
      numeric: numericStr,
      currency: region.currencyCode,
    };
  }

  return {
    formatted: `${region.currencySymbol}${numericStr}`,
    numeric: numericStr,
    currency: region.currencyCode,
  };
}

/**
 * Rewrites an Amazon affiliate URL (or generates a localized Amazon marketplace search/product link)
 * for the target region's Amazon Associates domain and tag.
 */
export function localizeAmazonAffiliateUrl(
  rawUrl: string | undefined,
  productTitle: string,
  region: TargetRegionConfig
): string {
  const cleanTitle = (productTitle || 'AeroThor Tech Accessory').trim();
  if (rawUrl && rawUrl.trim().length > 0) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname.includes('amazon.')) {
        parsed.hostname = `www.${region.amazonDomain}`;
        parsed.searchParams.set('tag', region.amazonAssociateTag);
        return parsed.toString();
      }
      return rawUrl;
    } catch {
      // Fallback below
    }
  }

  return `https://www.${region.amazonDomain}/s?k=${encodeURIComponent(cleanTitle)}&tag=${encodeURIComponent(region.amazonAssociateTag)}`;
}

/**
 * Generates localized Schema.org JSON-LD (`CollectionPage` + `ItemList` of `Product` items)
 * for programmatic `/deals/[country]` landing pages.
 */
export function buildRegionalDealsJsonLd(
  region: TargetRegionConfig,
  products: GmcProduct[],
  baseUrl: string = CANONICAL_STORE_URL
): Record<string, any> {
  const origin = baseUrl.replace(/\/+$/, '');
  const pageUrl = `${origin}/deals/${region.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${pageUrl}#collection`,
    name: region.localizedDealsH1,
    description: region.localizedDealsSubtitle,
    url: pageUrl,
    inLanguage: region.hreflang,
    isPartOf: {
      '@type': 'WebSite',
      name: 'AeroThor Commerce',
      url: origin,
    },
    about: {
      '@type': 'Place',
      name: region.countryName,
      address: {
        '@type': 'PostalAddress',
        addressCountry: region.isoCode,
      },
    },
    mainEntity: {
      '@type': 'ItemList',
      name: region.localizedDealsH1,
      numberOfItems: products.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: products.slice(0, 24).map((product, index) => {
        const priceInfo = formatRegionalPrice(product.sale_price || product.price, region);
        const productUrl = `${origin}/product/${encodeURIComponent(product.id)}?region=${region.slug}`;
        return {
          '@type': 'ListItem',
          position: index + 1,
          url: productUrl,
          item: {
            '@type': 'Product',
            name: product.title,
            description: product.description,
            image: product.image_link,
            sku: product.id,
            mpn: product.mpn || product.id,
            brand: {
              '@type': 'Brand',
              name: product.brand || 'AeroThor',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '142',
            },
            offers: {
              '@type': 'Offer',
              url: productUrl,
              priceCurrency: priceInfo.currency,
              price: priceInfo.numeric,
              priceValidUntil: '2027-12-31',
              availability:
                product.availability === 'out_of_stock'
                  ? 'https://schema.org/OutOfStock'
                  : 'https://schema.org/InStock',
              itemCondition: 'https://schema.org/NewCondition',
              eligibleRegion: {
                '@type': 'Country',
                name: region.isoCode,
              },
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                shippingDestination: {
                  '@type': 'DefinedRegion',
                  addressCountry: region.isoCode,
                },
                shippingRate: {
                  '@type': 'MonetaryAmount',
                  value: '0.00',
                  currency: priceInfo.currency,
                },
              },
            },
          },
        };
      }),
    },
  };
}
