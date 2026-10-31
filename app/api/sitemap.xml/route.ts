import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Filter for active storefront products
    const activeProducts = products.filter(
      (item: any) =>
        item.status !== 'archived' &&
        item.status !== 'draft' &&
        item.isVisible !== false
    );

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      'https://aerothor.vercel.app'
    ).replace(/\/+$/, '');

    const nowIso = new Date().toISOString();

    // 1. Static Storefront & Legal Trust Pages for Google Search / GMC Indexation
    const staticRoutes = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/policies/shipping', changefreq: 'monthly', priority: '0.6' },
      { path: '/policies/refund', changefreq: 'monthly', priority: '0.6' },
      { path: '/policies/privacy', changefreq: 'monthly', priority: '0.5' },
      { path: '/policies/terms', changefreq: 'monthly', priority: '0.5' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    ];

    const staticUrlsXml = staticRoutes
      .map(
        (route) => `  <url>
    <loc>${escapeXml(`${baseUrl}${route.path}`)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
      )
      .join('\n');

    // 2. Dynamic Active Product URLs with Google Image Sitemap Extensions
    const productUrlsXml = activeProducts
      .map((product: any) => {
        const productIdentifier = product.slug || product.id;
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
      <image:title>${escapeXml(product.title)}</image:title>
    </image:image>`
          : '';

        return `  <url>
    <loc>${escapeXml(productUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${priority}</priority>${imageExtensionXml}
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrlsXml}
${productUrlsXml}
</urlset>`;

    return new NextResponse(xml.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new NextResponse(errorXml.trim(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}
