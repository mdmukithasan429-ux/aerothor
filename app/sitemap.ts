import { MetadataRoute } from 'next';
import { prisma } from '../src/lib/prisma';
import { loadPersistedCatalog } from '../src/server/storage';

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
 * Strictly targets US (en-US) and UK (en-GB) search indexing with x-default fallback.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const usUkRootAlternates: Record<string, string> = {
    'en-US': `${BASE_DOMAIN}/deals/us`,
    'en-GB': `${BASE_DOMAIN}/deals/uk`,
    'x-default': `${BASE_DOMAIN}`,
  };

  // 1. Static Storefront & Regional US/UK Hubs
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_DOMAIN}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: usUkRootAlternates,
      },
    },
    {
      url: `${BASE_DOMAIN}/deals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: usUkRootAlternates,
      },
    },
    {
      url: `${BASE_DOMAIN}/deals/us`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
      alternates: {
        languages: usUkRootAlternates,
      },
    },
    {
      url: `${BASE_DOMAIN}/deals/uk`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.95,
      alternates: {
        languages: usUkRootAlternates,
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

  // 3. Dynamic Active Product Pages (Live Prisma DB with 1,060-item verified disk fallback)
  let productEntries: Array<{ id: string; updatedAt?: Date; availability?: string }> = [];
  try {
    const dbProducts = await prisma.product.findMany({
      select: { id: true, updatedAt: true },
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
        updatedAt: now,
        availability: product.availability,
      }));
  }

  const productPages: MetadataRoute.Sitemap = productEntries.map((product) => {
    const encodedId = encodeURIComponent(product.id);
    return {
      url: `${BASE_DOMAIN}/product/${encodedId}`,
      lastModified: product.updatedAt || now,
      changeFrequency: 'daily' as const,
      priority: product.availability === 'out_of_stock' ? 0.6 : 0.9,
      alternates: {
        languages: {
          'en-US': `${BASE_DOMAIN}/product/${encodedId}?region=US`,
          'en-GB': `${BASE_DOMAIN}/product/${encodedId}?region=UK`,
          'x-default': `${BASE_DOMAIN}/product/${encodedId}`,
        },
      },
    };
  });

  return [...staticPages, ...categoryPages, ...productPages];
}
