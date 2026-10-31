export interface ProductVariantOption {
  id: string;
  sku: string;
  cj_vid?: string;
  size: string;
  color: string;
  price: string; // e.g. "49.99 USD"
  sale_price?: string; // e.g. "39.99 USD"
  image_link: string;
  stock_quantity: number;
}

export interface GmcProduct {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_link?: string[];
  price: string; // e.g. "49.99 USD" or "39.99 GBP"
  sale_price?: string; // e.g. "39.99 USD"
  availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
  brand: string;
  gtin?: string;
  mpn?: string;
  condition: 'new' | 'refurbished' | 'used';
  identifier_exists?: boolean;
  google_product_category?: string;
  product_type?: string;
  cj_pid?: string;
  cj_vid?: string;
  cj_sku?: string;
  wholesale_price?: number;
  source?: 'cj_live' | 'supplier_api' | 'manual' | 'seed' | 'cj_batch';
  seo_title?: string;
  seo_description?: string;
  productType?: 'dropshipping' | 'affiliate';
  affiliateUrl?: string;
  affiliate_url?: string;
  isFreeShipping?: boolean;
  is_free_shipping?: boolean;
  shippingCost?: number;
  shipping_cost?: number;
  variants?: ProductVariantOption[];
  shipping?: {
    country: string;
    service: string;
    price: string;
  }[];
}

export interface ChannelMeta {
  title: string;
  link: string;
  description: string;
}

export interface GmcValidationError {
  productId: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Escapes XML special characters for XML compliance
 */
export function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validates GMC products against Google Merchant Center RSS 2.0 specifications
 */
export function validateGmcProduct(product: Partial<GmcProduct>): GmcValidationError[] {
  const errors: GmcValidationError[] = [];
  const pid = product.id || 'UNKNOWN_ID';

  if (!product.id || product.id.trim() === '') {
    errors.push({ productId: pid, field: 'id', severity: 'error', message: 'Product ID (g:id) is required. Max 50 characters.' });
  } else if (product.id.length > 50) {
    errors.push({ productId: pid, field: 'id', severity: 'error', message: 'Product ID exceeds 50 characters limit.' });
  }

  if (!product.title || product.title.trim() === '') {
    errors.push({ productId: pid, field: 'title', severity: 'error', message: 'Product title (g:title) is required.' });
  } else if (product.title.length > 150) {
    errors.push({ productId: pid, field: 'title', severity: 'error', message: `Title exceeds 150 characters (${product.title.length} chars). GMC will truncate it.` });
  }

  if (!product.description || product.description.trim() === '') {
    errors.push({ productId: pid, field: 'description', severity: 'error', message: 'Product description (g:description) is required.' });
  } else if (product.description.length > 5000) {
    errors.push({ productId: pid, field: 'description', severity: 'error', message: 'Description exceeds 5000 characters maximum.' });
  }

  if (!product.link || !/^https?:\/\//i.test(product.link)) {
    errors.push({ productId: pid, field: 'link', severity: 'error', message: 'Valid canonical HTTPS URL (g:link) is required.' });
  }

  if (!product.image_link || !/^https?:\/\//i.test(product.image_link)) {
    errors.push({ productId: pid, field: 'image_link', severity: 'error', message: 'Primary image URL (g:image_link) is required (HTTPS recommended).' });
  }

  // Price validation: strictly must follow "XX.XX CUR" e.g. "49.99 USD"
  const priceRegex = /^\d+(\.\d{2})?\s+[A-Z]{3}$/;
  if (!product.price || !priceRegex.test(product.price.trim())) {
    errors.push({ productId: pid, field: 'price', severity: 'error', message: 'Price must follow strict ISO format: "[Amount] [3-letter Currency]", e.g. "49.99 USD" or "35.00 GBP".' });
  }

  if (product.sale_price && !priceRegex.test(product.sale_price.trim())) {
    errors.push({ productId: pid, field: 'sale_price', severity: 'error', message: 'Sale price must follow strict ISO format, e.g. "39.99 USD".' });
  }

  const validAvailability = ['in_stock', 'out_of_stock', 'preorder', 'backorder'];
  if (!product.availability || !validAvailability.includes(product.availability)) {
    errors.push({ productId: pid, field: 'availability', severity: 'error', message: `Availability must be one of: ${validAvailability.join(', ')}` });
  }

  const validCondition = ['new', 'refurbished', 'used'];
  if (!product.condition || !validCondition.includes(product.condition)) {
    errors.push({ productId: pid, field: 'condition', severity: 'error', message: `Condition must be one of: ${validCondition.join(', ')}` });
  }

  if (!product.brand || product.brand.trim() === '') {
    errors.push({ productId: pid, field: 'brand', severity: 'error', message: 'Brand (g:brand) is required for USA/UK feeds.' });
  }

  // GTIN & MPN validation logic:
  // If identifier_exists is false, gtin and mpn are optional. If true or undefined, at least gtin or (brand + mpn) is required.
  if (product.identifier_exists === false) {
    // Allowed without GTIN
  } else {
    if (!product.gtin && !product.mpn) {
      errors.push({
        productId: pid,
        field: 'gtin',
        severity: 'warning',
        message: 'Google requires a GTIN (UPC/EAN) or MPN + Brand. If product is custom/handmade, set g:identifier_exists to "no".'
      });
    }
  }

  return errors;
}

export const CANONICAL_STORE_URL = 'https://aerothor.vercel.app';

/**
 * Resolves a product's canonical online store URL on the verified Merchant Center domain
 */
export function resolveCanonicalProductLink(
  product: Pick<GmcProduct, 'id' | 'link'>,
  storeBaseUrl: string = CANONICAL_STORE_URL
): string {
  const cleanBase = (storeBaseUrl || CANONICAL_STORE_URL).replace(/\/+$/, '');
  const rawLink = (product.link || '').trim();
  const encodedId = encodeURIComponent(product.id);

  if (!rawLink) {
    return `${cleanBase}/product/${encodedId}`;
  }

  // Rewrite legacy/unverified domains to the verified Merchant Center store domain
  if (
    rawLink.includes('aerothor.com') ||
    rawLink.includes('example-store.com') ||
    rawLink.includes('my-store.com') ||
    rawLink.includes('e-commerce-dropshiping-store.vercel.app') ||
    rawLink.includes('.run.app')
  ) {
    return `${cleanBase}/product/${encodedId}`;
  }

  return rawLink;
}

/**
 * Cleans supplier marketplace notes (e.g. "(TikTok, temu pick-up service)", "Ban The Sale Of Amazon") from titles
 */
export function cleanMerchantTitle(rawTitle: string): string {
  return (rawTitle || '')
    .replace(/\(\s*tiktok[^)]*\)/gi, '')
    .replace(/\bBan The Sale Of Amazon\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

/**
 * Builds standard Google Merchant Center RSS 2.0 XML string
 */
export function buildGmcXmlFeed(products: GmcProduct[], channelMeta?: ChannelMeta): string {
  const rawChannelLink = channelMeta?.link || CANONICAL_STORE_URL;
  const normalizedChannelLink =
    rawChannelLink.includes('example-store.com') ||
    rawChannelLink.includes('aerothor.com') ||
    rawChannelLink.includes('e-commerce-dropshiping-store.vercel.app') ||
    rawChannelLink.includes('.run.app')
      ? CANONICAL_STORE_URL
      : rawChannelLink.replace(/\/+$/, '');

  const meta: ChannelMeta = {
    title: channelMeta?.title || 'AeroThor Global Store — Official GMC Product Feed',
    link: normalizedChannelLink,
    description:
      channelMeta?.description ||
      'Automated High-CRP US/UK Product Feed for Google Shopping & Performance Max',
  };

  const xmlItems = products.map((item) => {
    const canonicalLink = resolveCanonicalProductLink(item, normalizedChannelLink);
    const cleanTitle = cleanMerchantTitle(item.title);
    const additionalImages = (item.additional_image_link || [])
      .filter((url) => Boolean(url && url.trim()))
      .map((url) => `      <g:additional_image_link>${escapeXml(url.trim())}</g:additional_image_link>`)
      .join('\n');

    const effectiveShipping = (item.shipping && item.shipping.length > 0)
      ? item.shipping
      : [
          {
            country: 'US',
            service: item.isFreeShipping === false && (item.shippingCost ?? 0) > 0 ? 'Standard Tracked Shipping' : 'Free Standard Shipping',
            price: item.isFreeShipping === false && (item.shippingCost ?? 0) > 0 ? `${(item.shippingCost ?? 0).toFixed(2)} USD` : '0.00 USD',
          },
          {
            country: 'GB',
            service: item.isFreeShipping === false && (item.shippingCost ?? 0) > 0 ? 'Standard Tracked Shipping' : 'Free Standard Shipping',
            price: item.isFreeShipping === false && (item.shippingCost ?? 0) > 0 ? `${(item.shippingCost ?? 0).toFixed(2)} GBP` : '0.00 GBP',
          },
        ];

    const shippingLines = effectiveShipping
      .map(
        (ship) => `      <g:shipping>
        <g:country>${escapeXml(ship.country)}</g:country>
        <g:service>${escapeXml(ship.service)}</g:service>
        <g:price>${escapeXml(ship.price)}</g:price>
      </g:shipping>`
      )
      .join('\n');

    return `    <item>
      <g:id>${escapeXml(item.id)}</g:id>
      <g:title>${escapeXml(cleanTitle)}</g:title>
      <g:description><![CDATA[${item.description}]]></g:description>
      <g:link>${escapeXml(canonicalLink)}</g:link>
      <g:image_link>${escapeXml(item.image_link)}</g:image_link>
${additionalImages ? `${additionalImages}\n` : ''}      <g:condition>${escapeXml(item.condition)}</g:condition>
      <g:availability>${escapeXml(item.availability)}</g:availability>
      <g:price>${escapeXml(item.price)}</g:price>
${item.sale_price ? `      <g:sale_price>${escapeXml(item.sale_price)}</g:sale_price>\n` : ''}      <g:brand>${escapeXml(item.brand)}</g:brand>
${item.gtin ? `      <g:gtin>${escapeXml(item.gtin)}</g:gtin>\n` : ''}${item.mpn ? `      <g:mpn>${escapeXml(item.mpn)}</g:mpn>\n` : ''}      <g:identifier_exists>${item.identifier_exists === false ? 'no' : 'yes'}</g:identifier_exists>
${item.google_product_category ? `      <g:google_product_category>${escapeXml(item.google_product_category)}</g:google_product_category>\n` : ''}${item.product_type ? `      <g:product_type>${escapeXml(item.product_type)}</g:product_type>\n` : ''}${shippingLines ? `${shippingLines}\n` : ''}    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${escapeXml(meta.link)}</link>
    <description>${escapeXml(meta.description)}</description>
${xmlItems.join('\n')}
  </channel>
</rss>`;
}

/**
 * Returns complete production Next.js API route code for App Router: app/api/feed.xml/route.ts
 */
export function getNextJsFeedRouteSnippet(): string {
  return `/**
 * @file app/api/feed.xml/route.ts
 * Next.js App Router Dynamic Google Merchant Center RSS 2.0 XML Feed
 * Strictly compliant with Google Shopping & Performance Max Feed Specifications
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize cached PostgreSQL connection pool
// Reuses pool across serverless invocations for zero-overhead query execution
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Force dynamic execution or tune revalidation (e.g. 1 hour cache on CDN edge)
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache 1 hour on Vercel Edge / Cloudflare

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const startTime = Date.now();
  let client;

  try {
    // 1. Verify required environment variables
    const storeUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || 'https://my-store.com';
    const storeTitle = process.env.STORE_NAME || 'Headless E-commerce Store';
    const defaultCurrency = process.env.DEFAULT_CURRENCY || 'USD';

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }

    // 2. Acquire database client from pool
    client = await pool.connect();

    // 3. Query active products with indexed columns
    const query = \`
      SELECT 
        p.id,
        p.sku,
        p.title,
        p.description,
        p.slug,
        p.main_image_url,
        p.additional_images,
        p.price,
        p.sale_price,
        p.currency,
        p.stock_quantity,
        p.brand,
        p.gtin,
        p.mpn,
        p.condition,
        p.google_category,
        p.product_type
      FROM products p
      WHERE p.status = 'active' AND p.is_visible = true
      ORDER BY p.updated_at DESC
      LIMIT 10000;
    \`;

    const { rows } = await client.query(query);

    // 4. Construct GMC RSS 2.0 XML Items
    const itemsXml = rows.map((product) => {
      const canonicalLink = \`\${storeUrl.replace(/\\/+$/, '')}/products/\${product.slug || product.id}\`;
      const currency = product.currency || defaultCurrency;
      const priceFormatted = \`\${Number(product.price).toFixed(2)} \${currency}\`;
      const salePriceFormatted = product.sale_price && Number(product.sale_price) < Number(product.price)
        ? \`\${Number(product.sale_price).toFixed(2)} \${currency}\`
        : null;
      
      const availability = Number(product.stock_quantity) > 0 ? 'in_stock' : 'out_of_stock';
      const condition = product.condition || 'new';
      const brand = product.brand || 'Store Exclusive';

      // Additional images handling
      let additionalImages = '';
      if (Array.isArray(product.additional_images) && product.additional_images.length > 0) {
        additionalImages = product.additional_images
          .slice(0, 10)
          .map((img: string) => \`      <g:additional_image_link>\${escapeXml(img)}</g:additional_image_link>\`)
          .join('\\n');
      }

      // GTIN / MPN handling
      let identifierSection = '';
      if (product.gtin) {
        identifierSection += \`\\n      <g:gtin>\${escapeXml(product.gtin)}</g:gtin>\`;
      }
      if (product.mpn) {
        identifierSection += \`\\n      <g:mpn>\${escapeXml(product.mpn)}</g:mpn>\`;
      }
      const identifierExists = product.gtin || product.mpn ? 'yes' : 'no';

      return \`    <item>
      <g:id>\${escapeXml(product.sku || product.id)}</g:id>
      <g:title>\${escapeXml(product.title.slice(0, 150))}</g:title>
      <g:description><![CDATA[\${product.description || product.title}]]></g:description>
      <g:link>\${escapeXml(canonicalLink)}</g:link>
      <g:image_link>\${escapeXml(product.main_image_url)}</g:image_link>\${additionalImages ? '\\n' + additionalImages : ''}
      <g:condition>\${condition}</g:condition>
      <g:availability>\${availability}</g:availability>
      <g:price>\${priceFormatted}</g:price>\${salePriceFormatted ? \`\\n      <g:sale_price>\${salePriceFormatted}</g:sale_price>\` : ''}
      <g:brand>\${escapeXml(brand)}</g:brand>\${identifierSection}
      <g:identifier_exists>\${identifierExists}</g:identifier_exists>\${product.google_category ? \`\\n      <g:google_product_category>\${escapeXml(product.google_category)}</g:google_product_category>\` : ''}\${product.product_type ? \`\\n      <g:product_type>\${escapeXml(product.product_type)}</g:product_type>\` : ''}
    </item>\`;
    }).join('\\n');

    // 5. Wrap inside RSS 2.0 channel container
    const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>\${escapeXml(storeTitle)} Feed</title>
    <link>\${escapeXml(storeUrl)}</link>
    <description>Google Merchant Center Product Feed for \${escapeXml(storeTitle)}</description>
\${itemsXml}
  </channel>
</rss>\`;

    // 6. Return XML response with optimal headers
    return new NextResponse(xml.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        'X-Feed-Generation-Time': \`\${Date.now() - startTime}ms\`,
        'X-Total-Products': String(rows.length),
      },
    });
  } catch (error: any) {
    console.error('[GMC Feed Generation Error]:', error);
    
    // Return structured XML error to prevent silent failures in GMC fetcher
    const errorXml = \`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Error Generating Feed</title>
    <description>\${escapeXml(error.message || 'Database connection error')}</description>
  </channel>
</rss>\`;

    return new NextResponse(errorXml.trim(), {
      status: 500,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
      },
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
`;
}
