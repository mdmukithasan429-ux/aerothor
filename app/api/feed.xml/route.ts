import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour cache

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

    const appUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      'https://ais-dev-3nqmvpugp7tuj6tqdspsbn-806254583049.asia-northeast1.run.app'
    ).replace(/\/+$/, '');
    const lastBuildDate = new Date().toUTCString();

    const itemsXml = products
      .map((item) => {
        const numericPrice =
          typeof item.price === 'number'
            ? item.price
            : parseFloat(String(item.price)) || 0;
        const formattedPrice = `${numericPrice.toFixed(2)} USD`;

        const salePriceVal = item.salePrice
          ? typeof item.salePrice === 'number'
            ? item.salePrice
            : parseFloat(String(item.salePrice))
          : null;
        const salePriceXml =
          salePriceVal && salePriceVal > 0
            ? `\n      <g:sale_price>${salePriceVal.toFixed(2)} USD</g:sale_price>`
            : '';

        const imageUrl = item.mainImageUrl || item.image_link || '';
        const availability =
          item.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
        const condition = item.condition || 'new';
        const brand = item.brand || 'AeroThor';
        const identifierExists =
          item.identifier_exists === false ? 'no' : 'yes';

        return `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:title>${escapeXml(item.title)}</g:title>
      <g:description><![CDATA[${item.description || item.title}]]></g:description>
      <g:link>${escapeXml(`${appUrl}/product/${item.id}`)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:condition>${escapeXml(condition)}</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${formattedPrice}</g:price>${salePriceXml}
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:identifier_exists>${identifierExists}</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Domestic Tracked (3-7 Days)</g:service>
        <g:price>0.00 USD</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>Royal Mail 48 Tracked (3-5 Days)</g:service>
        <g:price>0.00 GBP</g:price>
      </g:shipping>
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>AeroThor Global Store — Official GMC Product Feed</title>
    <link>${escapeXml(appUrl)}</link>
    <description>Automated High-CRP US/UK Product Feed for Google Shopping &amp; Performance Max</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Feed Error</title>
    <description>${escapeXml(error?.message || 'Error generating feed')}</description>
  </channel>
</rss>`;

    return new NextResponse(errorXml.trim(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}

