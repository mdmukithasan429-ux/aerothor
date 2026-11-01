import { MetadataRoute } from 'next';
import { INITIAL_PRODUCTS } from '../src/server/seed-data';
import {
  TARGET_REGIONS,
  buildStorefrontHreflangAlternates,
  buildDealsHreflangAlternates,
  buildProductHreflangAlternates,
} from '../src/lib/i18n-regions';

const BASE_DOMAIN = 'https://aerothor.vercel.app';

/**
 * Dynamic Next.js Sitemap Generator (`app/sitemap.ts`)
 * Automatically indexes:
 * 1. Core Storefront & Policy Routes (with 10-country `alternates.languages`)
 * 2. All 10 Programmatic Country Landing Pages (`/deals/us`, `/deals/uk`, `/deals/canada`, etc.)
 * 3. Category Filter Routes
 * 4. Active Dropshipping & Amazon Affiliate Products (with 10-country `alternates.languages`)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const storefrontAlternates = buildStorefrontHreflangAlternates(BASE_DOMAIN);
  const dealsAlternates = buildDealsHreflangAlternates(BASE_DOMAIN);

  // 1. Static Storefront & Policy Pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_DOMAIN}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: storefrontAlternates,
      },
    },
    {
      url: `${BASE_DOMAIN}/deals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: dealsAlternates,
      },
    },
    {
      url: `${BASE_DOMAIN}/affiliates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_DOMAIN}/return-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_DOMAIN}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_DOMAIN}/track-order`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 2. Programmatic Country-Targeted SEO Landing Pages (10 Active Regions)
  const regionalDealsPages: MetadataRoute.Sitemap = TARGET_REGIONS.map((region) => ({
    url: `${BASE_DOMAIN}/deals/${region.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.95,
    alternates: {
      languages: dealsAlternates,
    },
  }));

  // 3. Category Landing Pages
  const categories = [
    'Tech Accessories',
    'Drinkware & Travel',
    'Outerwear & Commute',
    'CJ Marketplace',
    'Everyday Carry',
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_DOMAIN}/?category=${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 4. Dynamic Active Product Pages with 10-Region Hreflang Alternates
  const activeProducts = INITIAL_PRODUCTS.filter(
    (product: any) => product.status !== 'archived' && product.isVisible !== false
  );

  const productPages: MetadataRoute.Sitemap = activeProducts.map((product) => ({
    url: `${BASE_DOMAIN}/product/${encodeURIComponent(product.id)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: product.availability === 'out_of_stock' ? 0.6 : 0.9,
    alternates: {
      languages: buildProductHreflangAlternates(product.id, BASE_DOMAIN),
    },
  }));

  return [
    ...staticPages,
    ...regionalDealsPages,
    ...categoryPages,
    ...productPages,
  ];
}
