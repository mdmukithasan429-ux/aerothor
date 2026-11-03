import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadPersistedCatalog } from '@/src/server/storage';
import { TARGET_REGIONS } from '@/src/lib/i18n-regions';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour at the edge

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_req: NextRequest) {
  try {
    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      'https://aerothor.smmgrows.com'
    ).replace(/\/+$/, '');

    const nowIso = new Date().toISOString();

    // 1. Fetch products from database with automatic disk persistence fallback
    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
      });
    } catch {
      products = [];
    }

    if (!Array.isArray(products) || products.length === 0) {
      try {
        products = loadPersistedCatalog();
      } catch {
        products = [];
      }
    }

    // Filter active storefront products
    const activeProducts = products.filter(
      (item: any) =>
        item.status !== 'archived' &&
        item.status !== 'draft' &&
        item.isVisible !== false
    );

    // 2. High-Intent Regional & Category Static URLs with Hreflang Alternates
    const staticRoutes = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/deals', changefreq: 'daily', priority: '0.9' },
      ...TARGET_REGIONS.map((r) => ({
        path: `/deals/${r.slug}`,
        changefreq: 'daily',
        priority: '0.95',
      })),
      { path: '/affiliates', changefreq: 'weekly', priority: '0.8' },
      { path: '/return-policy', changefreq: 'monthly', priority: '0.7' },
      { path: '/policies/shipping', changefreq: 'monthly', priority: '0.7' },
      { path: '/policies/refund', changefreq: 'monthly', priority: '0.7' },
      { path: '/policies/privacy', changefreq: 'monthly', priority: '0.5' },
      { path: '/policies/terms', changefreq: 'monthly', priority: '0.5' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
      { path: '/track-order', changefreq: 'monthly', priority: '0.6' },
      { path: '/?category=Tech%20Accessories', changefreq: 'daily', priority: '0.85' },
      { path: '/?category=Drinkware%20%26%20Travel', changefreq: 'daily', priority: '0.85' },
      { path: '/?category=Outerwear%20%26%20Commute', changefreq: 'daily', priority: '0.85' },
      { path: '/?category=CJ%20Marketplace', changefreq: 'daily', priority: '0.85' },
    ];

    const dealsHreflangXml = TARGET_REGIONS.map(
      (r) =>
        `\n    <xhtml:link rel="alternate" hreflang="${r.hreflang}" href="${escapeXml(`${baseUrl}/deals/${r.slug}`)}" />`
    ).join('') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${baseUrl}/deals`)}" />`;

    const staticUrlsXml = staticRoutes
      .map((route) => {
        const isDealsRoute = route.path === '/deals' || route.path.startsWith('/deals/');
        return `  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${isDealsRoute ? dealsHreflangXml : ''}
  </url>`;
      })
      .join('\n');

    // 3. Dynamic Active Product URLs with Google Image & Country Hreflang Tags
    const productUrlsXml = activeProducts
      .map((product: any) => {
        const productIdentifier = product.slug || product.id || product.sku;
        const productUrl = `${baseUrl}/product/${encodeURIComponent(productIdentifier)}`;
        const lastMod = product.updatedAt
          ? new Date(product.updatedAt).toISOString()
          : nowIso;
        const imageUrl = product.mainImageUrl || product.image_link || '';
        const priority =
          product.availability === 'out_of_stock' ? '0.6' : '0.9';

        const imageExtensionXml = imageUrl
          ? `\n    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(product.title || 'Product')}</image:title>
    </image:image>`
          : '';

        const productHreflangXml =
          TARGET_REGIONS.map((r) => {
            const altHref =
              r.slug === 'us'
                ? productUrl
                : `${productUrl}?region=${r.slug}`;
            return `\n    <xhtml:link rel="alternate" hreflang="${r.hreflang}" href="${escapeXml(altHref)}" />`;
          }).join('') +
          `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(productUrl)}" />`;

        return `  <url>
    <loc>${escapeXml(productUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>${imageExtensionXml}${productHreflangXml}
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticUrlsXml}
${productUrlsXml}
</urlset>`;

    return new NextResponse(xml.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        'X-Total-Sitemap-URLs': String(staticRoutes.length + activeProducts.length),
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error generating sitemap XML: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
