import { MetadataRoute } from 'next';
import { prisma } from '../src/lib/prisma';
import { loadPersistedCatalog } from '../src/server/storage';
import { TARGET_REGIONS } from '../src/lib/i18n-regions';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const BASE_DOMAIN = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.APP_URL ||
  'https://aerothor.smmgrows.com'
).replace(/\/$/, '');

/**
 * Dynamic Next.js Sitemap Generator (`app/sitemap.ts`)
 * Canonical domain: https://aerothor.smmgrows.com
 * Targets top international tier-1 countries (US, UK, CA, FR, DE, IT, NL, PL, ES, SE) with x-default fallback.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const regionalRootAlternates: Record<string, string> = {};
  TARGET_REGIONS.forEach((r) => {
    regionalRootAlternates[r.hreflang] = `${BASE_DOMAIN}/deals/${r.slug}`;
  });
  regionalRootAlternates['x-default'] = `${BASE_DOMAIN}`;

  // 1. Static Storefront & Regional Targeted Hubs
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_DOMAIN}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: regionalRootAlternates,
      },
    },
    {
      url: `${BASE_DOMAIN}/deals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: regionalRootAlternates,
      },
    },
    ...TARGET_REGIONS.map((r) => ({
      url: `${BASE_DOMAIN}/deals/${r.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.95,
      alternates: {
        languages: regionalRootAlternates,
      },
    })),
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
      url: `${BASE_DOMAIN}/policies/shipping`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_DOMAIN}/policies/refund`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_DOMAIN}/policies/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_DOMAIN}/policies/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
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

  // 2. Category Landing Pages
  const categories = [
    'Protective Skins & Wraps',
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

  // 3. Dynamic Active Product Pages (Database with 1,000-item verified disk fallback)
  let productEntries: Array<{ id: string; slug?: string; updatedAt?: Date; availability?: string }> = [];
  try {
    const dbProducts = await prisma.product.findMany({
      select: { id: true, slug: true, updatedAt: true, availability: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (dbProducts.length > 0) {
      productEntries = dbProducts;
    }
  } catch {
    // Fallback to persisted catalog
  }

  if (productEntries.length === 0) {
    const catalog = loadPersistedCatalog();
    productEntries = catalog
      .filter((product: any) => product.status !== 'archived' && product.isVisible !== false)
      .map((product: any) => ({
        id: product.id,
        slug: product.slug,
        updatedAt: now,
        availability: product.availability,
      }));
  }

  const productPages: MetadataRoute.Sitemap = productEntries.map((product) => {
    const identifier = product.slug || product.id;
    const encodedId = encodeURIComponent(identifier);
    const productUrl = `${BASE_DOMAIN}/product/${encodedId}`;

    const productLanguages: Record<string, string> = {};
    TARGET_REGIONS.forEach((r) => {
      productLanguages[r.hreflang] =
        r.slug === 'us' ? productUrl : `${productUrl}?region=${r.slug}`;
    });
    productLanguages['x-default'] = productUrl;

    return {
      url: productUrl,
      lastModified: product.updatedAt || now,
      changeFrequency: 'daily' as const,
      priority: product.availability === 'out_of_stock' ? 0.6 : 0.9,
      alternates: {
        languages: productLanguages,
      },
    };
  });

  return [...staticPages, ...categoryPages, ...productPages];
}
