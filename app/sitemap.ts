import { MetadataRoute } from 'next';
import { prisma } from '../src/lib/prisma';
import { loadPersistedCatalog } from '../src/server/storage';
import { TARGET_REGIONS } from '../src/lib/i18n-regions';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const PRODUCTION_DOMAIN = 'https://aerothor.smmgrows.com';

/**
 * Dynamic Next.js Sitemap Generator (`app/sitemap.ts`)
 * Strictly uses canonical production domain: https://aerothor.smmgrows.com
 * Guarantees all 1,000 products and all regional paths (/deals/us, /deals/uk, etc.) are included.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const regionalRootAlternates: Record<string, string> = {};
  TARGET_REGIONS.forEach((r) => {
    regionalRootAlternates[r.hreflang] =
      r.slug === 'us' ? `${PRODUCTION_DOMAIN}/` : `${PRODUCTION_DOMAIN}/deals/${r.slug}`;
  });
  regionalRootAlternates['x-default'] = `${PRODUCTION_DOMAIN}/`;

  // 1. Static Storefront & Regional Targeted Hubs (/deals/uk, /deals/germany, etc.)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${PRODUCTION_DOMAIN}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: regionalRootAlternates,
      },
    },
    {
      url: `${PRODUCTION_DOMAIN}/deals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: regionalRootAlternates,
      },
    },
    ...TARGET_REGIONS.map((r) => ({
      url: `${PRODUCTION_DOMAIN}/deals/${r.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.95,
      alternates: {
        languages: regionalRootAlternates,
      },
    })),
    {
      url: `${PRODUCTION_DOMAIN}/affiliates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${PRODUCTION_DOMAIN}/return-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${PRODUCTION_DOMAIN}/policies/shipping`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${PRODUCTION_DOMAIN}/policies/refund`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${PRODUCTION_DOMAIN}/policies/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${PRODUCTION_DOMAIN}/policies/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${PRODUCTION_DOMAIN}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${PRODUCTION_DOMAIN}/track-order`,
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
    'Clothing',
    'Affiliate Deals',
    'CJ Marketplace',
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${PRODUCTION_DOMAIN}/?category=${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  // 3. Dynamic Active Product Pages — Guarantee all 1,000 products are included
  const entryMap = new Map<
    string,
    { sku: string; slug?: string; updatedAt?: Date; availability?: string }
  >();

  try {
    const dbProducts = await prisma.product.findMany({
      select: { sku: true, slug: true, updatedAt: true, stockQuantity: true, availability: true },
      orderBy: { updatedAt: 'desc' },
    });
    for (const p of dbProducts) {
      if (p.sku) {
        entryMap.set(p.sku, {
          sku: p.sku,
          slug: p.slug,
          updatedAt: p.updatedAt,
          availability: p.availability || (p.stockQuantity > 0 ? 'in_stock' : 'out_of_stock'),
        });
      }
    }
  } catch {
    // Fallback / merge with persisted catalog below
  }

  // Merge with persisted 1,000-item catalog if DB returned fewer than 1,000 items
  if (entryMap.size < 1000) {
    const catalog = loadPersistedCatalog();
    for (const product of catalog) {
      if (!product || !product.id) continue;
      if (product.status === 'archived' || product.isVisible === false) continue;
      if (!entryMap.has(product.id)) {
        entryMap.set(product.id, {
          sku: product.id,
          slug: (product as any).slug,
          updatedAt: now,
          availability: product.availability || 'in_stock',
        });
      }
    }
  }

  const productEntries = Array.from(entryMap.values());

  const productPages: MetadataRoute.Sitemap = productEntries.map((product) => {
    const encodedSku = encodeURIComponent(product.sku);
    const productUrl = `${PRODUCTION_DOMAIN}/product/${encodedSku}`;

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
