import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerothor.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core Static & Policy Routes
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/deals`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/affiliates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/return-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/policies/shipping`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/policies/refund`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/policies/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/policies/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 2. Category Landing Pages
  const categories = [
    'Tech Accessories',
    'Drinkware & Travel',
    'Outerwear & Commute',
    'CJ Marketplace',
    'Amazon Deals',
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/?category=${encodeURIComponent(category)}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // 3. Dynamic Active Products from PostgreSQL (with fallback to bundled catalog JSON)
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const dbProducts = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        updatedAt: true,
        inStock: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (dbProducts.length > 0) {
      productEntries = dbProducts.map((p) => ({
        url: `${BASE_URL}/product/${encodeURIComponent(p.sku || p.id)}`,
        lastModified: p.updatedAt || now,
        changeFrequency: 'daily',
        priority: p.inStock === false ? 0.6 : 0.9,
      }));
    }
  } catch {
    // Fallback to persisted catalog-db.json if Prisma is offline during static build
  }

  if (productEntries.length === 0) {
    try {
      const catalogPath = path.join(process.cwd(), 'data', 'catalog-db.json');
      if (fs.existsSync(catalogPath)) {
        const raw = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
        const items = Array.isArray(raw) ? raw : raw.products || [];
        productEntries = items
          .filter((item: any) => item.status !== 'archived' && item.isVisible !== false)
          .map((item: any) => ({
            url: `${BASE_URL}/product/${encodeURIComponent(item.id)}`,
            lastModified: now,
            changeFrequency: 'daily' as const,
            priority: item.availability === 'out_of_stock' ? 0.6 : 0.9,
          }));
      }
    } catch {
      // ignore fallback errors
    }
  }

  return [...staticPages, ...categoryPages, ...productEntries];
}
