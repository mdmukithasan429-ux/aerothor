import { GmcProduct, ProductVariantOption, CANONICAL_STORE_URL } from './gmc-feed';

/**
 * CJ Dropshipping Raw Product Response Interface
 * Matching official CJ Developers API v2.0 /product/list schema
 */
export interface CjRawProduct {
  pid: string;
  productName: string;
  productNameEn?: string;
  productSku?: string;
  productImage: string;
  productImageSet?: string[] | string;
  sellPrice: string | number; // e.g. "12.50" or "12.50 -- 18.00"
  categoryName?: string;
  categoryId?: string;
  productWeight?: string | number;
  description?: string;
  entryName?: string;
  countryCode?: string;
  supplierName?: string;
}

export interface SyncOptions {
  markupMultiplier?: number; // e.g. 2.5 for 60% gross profit target
  currency?: string; // 'USD' | 'GBP'
  defaultBrand?: string;
  targetMarket?: 'US' | 'UK';
  domain?: string;
}

/**
 * Generic Field Mapping Config for "Any Platform" (Zendrop, Spocket, AliExpress, Custom Webhook)
 */
export interface GenericMappingConfig {
  platformName: string;
  endpointUrl: string;
  authHeaderName: string; // e.g. 'Authorization', 'CJ-Access-Token', 'X-API-KEY'
  authHeaderPrefix?: string; // e.g. 'Bearer '
  idPath: string; // e.g. 'id' or 'sku' or 'product_id'
  titlePath: string; // e.g. 'title' or 'productNameEn'
  pricePath: string; // e.g. 'price' or 'sellPrice' or 'variants[0].price'
  descriptionPath?: string;
  imagePath: string; // e.g. 'images[0].src' or 'productImage'
  brandPath?: string;
  gtinPath?: string;
}

/**
 * Sanitize product title for high-intent USA/UK search queries
 * Truncates to GMC 150-char max and removes excessive supplier spam
 */
export function sanitizeGmcTitle(rawTitle: string): string {
  if (!rawTitle) return 'Premium Direct-to-Consumer Gear';
  let cleaned = rawTitle.trim();

  // If raw title is a stringified JSON array e.g. ["title", "tag"]
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleaned = String(parsed[0]);
      }
    } catch {
      cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
    }
  }

  cleaned = cleaned
    .replace(/[\u4e00-\u9fa5]+/g, '') // remove Chinese characters
    .replace(/\(\s*tiktok[^)]*\)/gi, '') // remove supplier marketplace notes like (TikTok, temu pick-up service)
    .replace(/\bBan The Sale Of Amazon\b/gi, '')
    .replace(/[\[\]"']/g, '') // remove lingering brackets/quotes
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    cleaned = 'Direct-to-Consumer Precision Gear';
  }

  // GMC 150-char max
  if (cleaned.length > 150) {
    cleaned = cleaned.slice(0, 147) + '...';
  }
  return cleaned;
}

/**
 * Parse CJ sellPrice (which can be a single float string or a range like "12.50 -- 18.00")
 */
export function parseCjPrice(sellPrice: string | number): number {
  if (typeof sellPrice === 'number') return sellPrice;
  if (!sellPrice) return 19.99;

  // Handle range "12.50 -- 18.00" -> pick first or average
  const cleaned = sellPrice.toString().split('--')[0].replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed <= 0 ? 19.99 : parsed;
}

/**
 * Map raw CJ Dropshipping API item to Google Merchant Center compliant product
 * Supports both /product/list and /product/listV2 response schemas
 */
export function mapCjProductToGmc(
  cj: CjRawProduct | Record<string, any>,
  options: SyncOptions = {}
): GmcProduct {
  const multiplier = options.markupMultiplier ?? 2.5;
  const currency = options.currency ?? 'USD';
  const brand = options.defaultBrand ?? 'AeroThor';
  const rawDomain = options.domain ?? CANONICAL_STORE_URL.replace(/^https?:\/\//, '');
  const domain =
    rawDomain === 'aerothor.com' || rawDomain === 'example-store.com'
      ? CANONICAL_STORE_URL.replace(/^https?:\/\//, '')
      : rawDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const rawPrice = cj.sellPrice || (cj as any).nowPrice || (cj as any).price;
  const costPrice = parseCjPrice(rawPrice);
  const retailPriceNum = Number((costPrice * multiplier).toFixed(2));
  // 12% promotional sale price for GMC badge
  const salePriceNum = Number((retailPriceNum * 0.88).toFixed(2));

  const rawSku = (cj as any).productSku || (cj as any).sku;
  const rawPid = String((cj as any).pid || (cj as any).id || Math.random().toString(36).substring(7));
  const rawVid = String((cj as any).vid || (cj as any).variantId || '');
  const cleanRawSku = rawSku ? String(rawSku).replace(/[^a-zA-Z0-9_-]/g, '') : '';
  const sku = cleanRawSku
    ? (cleanRawSku.toUpperCase().startsWith('CJ-') ? cleanRawSku : `CJ-${cleanRawSku}`)
    : `CJ-${rawPid.slice(0, 12)}`;

  const rawTitle = (cj as any).productNameEn || (cj as any).nameEn || (cj as any).productName || 'Premium Lifestyle Accessory';
  const title = sanitizeGmcTitle(rawTitle);

  // Parse additional images
  let additionalImages: string[] = [];
  const imageSet = (cj as any).productImageSet || (cj as any).images;
  if (Array.isArray(imageSet)) {
    additionalImages = imageSet
      .filter((img) => typeof img === 'string' && img.trim().startsWith('http'))
      .map((img) => img.trim().replace(/^http:\/\//i, 'https://'));
  } else if (typeof imageSet === 'string') {
    const trimmedSet = imageSet.trim();
    if (trimmedSet.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmedSet);
        if (Array.isArray(parsed)) {
          additionalImages = parsed
            .filter((img) => typeof img === 'string' && img.trim().startsWith('http'))
            .map((img) => img.trim().replace(/^http:\/\//i, 'https://'));
        }
      } catch {
        // fallback below
      }
    }
    if (additionalImages.length === 0) {
      additionalImages = trimmedSet
        .replace(/^[\["\s]+|[\]"\s]+$/g, '')
        .split(',')
        .map((s) => s.replace(/["']/g, '').trim())
        .filter((img) => img.startsWith('http'))
        .map((img) => img.replace(/^http:\/\//i, 'https://'));
    }
  }

  // Ensure main image is clean HTTPS (handles string, JSON array string, or array)
  const rawImage = (cj as any).productImage || (cj as any).bigImage || (cj as any).image;
  let mainImage = '';
  if (Array.isArray(rawImage) && rawImage.length > 0) {
    mainImage = String(rawImage[0] || '').trim();
  } else if (typeof rawImage === 'string') {
    const trimmed = rawImage.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          mainImage = String(parsed[0] || '').trim();
        }
      } catch {
        mainImage = trimmed.replace(/^[\["\s]+|[\]"\s]+$/g, '').split(',')[0].replace(/["']/g, '').trim();
      }
    } else {
      mainImage = trimmed.split(',')[0].replace(/["']/g, '').trim();
    }
  }
  if (mainImage.startsWith('http://')) {
    mainImage = mainImage.replace(/^http:\/\//i, 'https://');
  }
  if (!mainImage.startsWith('https://')) {
    mainImage =
      additionalImages[0] ||
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
  }

  const rawDesc = (cj as any).description || (cj as any).remark;

  const baseProduct: GmcProduct = {
    id: sku,
    title,
    description:
      (typeof rawDesc === 'string' ? rawDesc.replace(/<[^>]*>/g, '').trim() : '') ||
      `${title} - Official CJ Dropshipping US/UK domestic warehouse inventory. Dispatches within 3–7 business days with 30-day money-back guarantee.`,
    link: `https://${domain}/product/${encodeURIComponent(sku)}`,
    image_link: mainImage,
    additional_image_link: additionalImages.length > 0 ? additionalImages.slice(0, 3) : undefined,
    price: `${retailPriceNum.toFixed(2)} ${currency}`,
    sale_price: `${salePriceNum.toFixed(2)} ${currency}`,
    availability: 'in_stock',
    brand,
    condition: 'new',
    gtin: undefined, // CJ provides supplier SKUs rather than GS1 barcodes
    mpn: (cj as any).productSku || (cj as any).sku || sku,
    product_type: (cj as any).categoryName || (cj as any).threeCategoryName || 'Lifestyle & Commute Gear',
    cj_pid: rawPid,
    cj_vid: rawVid || undefined,
    cj_sku: String(rawSku || sku),
    wholesale_price: costPrice,
    source: 'cj_live',
    shipping: [
      {
        country: options.targetMarket === 'UK' ? 'GB' : 'US',
        service: options.targetMarket === 'UK' ? 'Royal Mail Tracked 48' : 'USPS Priority 2-Day',
        price: `0.00 ${currency}`,
      },
    ],
  };

  // Extract explicit CJ variants if present, or synthesize default Parent-Child Size/Color variants
  const rawVariantList = (cj as any).variants || (cj as any).variantList;
  if (Array.isArray(rawVariantList) && rawVariantList.length > 0) {
    baseProduct.variants = rawVariantList.slice(0, 12).map((v: any, idx: number) => {
      const vCost = parseCjPrice(v.variantSellPrice || v.sellPrice || costPrice);
      const vRetail = Number((vCost * multiplier).toFixed(2));
      const vSale = Number((vRetail * 0.88).toFixed(2));
      const vKey = String(v.variantKey || v.variantNameEn || '').split(/[-/]/);
      return {
        id: String(v.vid || `${sku}-V${idx + 1}`),
        sku: String(v.variantSku || `${sku}-${idx + 1}`),
        cj_vid: String(v.vid || rawVid || `${rawPid}-V${idx + 1}`),
        color: (v.color || vKey[0] || ['Obsidian Black', 'Titanium Silver', 'Midnight Navy'][idx % 3]).trim(),
        size: (v.size || vKey[1] || ['Standard', 'Large', 'Pro Edition'][idx % 3]).trim(),
        price: `${vRetail.toFixed(2)} ${currency}`,
        sale_price: `${vSale.toFixed(2)} ${currency}`,
        image_link:
          (typeof v.variantImage === 'string' && v.variantImage.startsWith('http')
            ? v.variantImage.replace(/^http:\/\//i, 'https://')
            : '') ||
          additionalImages[idx % Math.max(1, additionalImages.length)] ||
          mainImage,
        stock_quantity: Number(v.variantVolume || 50),
      };
    });
  } else {
    baseProduct.variants = buildDefaultVariantsForProduct(baseProduct);
  }

  return baseProduct;
}

/**
 * Generates clean Size & Color variants for a Parent Product when raw variants are not explicitly provided
 */
export function buildDefaultVariantsForProduct(product: GmcProduct): ProductVariantOption[] {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }

  const currencyMatch = product.price.match(/[A-Z]{3}$/);
  const currency = currencyMatch ? currencyMatch[0] : 'USD';
  const basePrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 49.99;
  const baseSale = product.sale_price
    ? parseFloat(product.sale_price.replace(/[^0-9.]/g, ''))
    : Number((basePrice * 0.88).toFixed(2));

  const extraImgs =
    Array.isArray(product.additional_image_link) && product.additional_image_link.length > 0
      ? product.additional_image_link
      : [product.image_link];

  const titleLower = (product.title || '').toLowerCase();
  const isApparel =
    titleLower.includes('hoodie') ||
    titleLower.includes('jacket') ||
    titleLower.includes('parka') ||
    titleLower.includes('shirt') ||
    titleLower.includes('wear') ||
    titleLower.includes('vest');
  const isVessel =
    titleLower.includes('flask') ||
    titleLower.includes('tumbler') ||
    titleLower.includes('bottle') ||
    titleLower.includes('cup');

  const sizes = isApparel
    ? ['S', 'M', 'L', 'XL']
    : isVessel
    ? ['500ml Compact', '750ml Standard', '1000ml Expedition']
    : ['Standard', 'Pro Bundle'];

  const colors = [
    { name: 'Obsidian Black', img: product.image_link, delta: 0 },
    { name: 'Titanium Silver', img: extraImgs[0] || product.image_link, delta: 2.0 },
    { name: 'Alpine Slate', img: extraImgs[1] || product.image_link, delta: 4.0 },
  ];

  const variants: ProductVariantOption[] = [];
  let idx = 1;
  for (const color of colors) {
    for (const size of sizes) {
      const sizeDelta = size.includes('XL') || size.includes('1000ml') || size.includes('Pro') ? 5.0 : 0;
      const vPrice = Number((basePrice + color.delta + sizeDelta).toFixed(2));
      const vSale = Number((baseSale + color.delta + sizeDelta).toFixed(2));
      const cleanColorCode = color.name.split(' ')[0].toUpperCase().slice(0, 3);
      const cleanSizeCode = size.split(' ')[0].toUpperCase().slice(0, 4);
      variants.push({
        id: `${product.id}-${cleanColorCode}-${cleanSizeCode}`,
        sku: `${product.id}-${cleanColorCode}-${cleanSizeCode}`,
        cj_vid: product.cj_vid ? `${product.cj_vid}-${idx}` : `${product.cj_pid || product.id}-V${idx}`,
        color: color.name,
        size,
        price: `${vPrice.toFixed(2)} ${currency}`,
        sale_price: `${vSale.toFixed(2)} ${currency}`,
        image_link: color.img,
        stock_quantity: 45 + (idx % 30),
      });
      idx++;
    }
  }
  return variants;
}

/**
 * Normalizes a product title or CJ PID to identify duplicate variant rows
 * (e.g. "Smart Posture Corrector - Variant #142" -> "smart posture corrector")
 */
export function normalizeParentGroupKey(product: GmcProduct): string {
  if (product.cj_pid && !/^CJ-PID-\d+$/i.test(product.cj_pid)) {
    return `pid:${product.cj_pid.trim().toLowerCase()}`;
  }

  const cleanedTitle = (product.title || '')
    .toLowerCase()
    .replace(/\s*[-–|·]\s*(variant|edition|batch|model|size|color|style)\s*#?\d+.*$/i, '')
    .replace(/\s*\((variant|batch|size|color)[^)]*\)/gi, '')
    .replace(/\s+#\d+\b/g, '')
    .replace(/\b(small|medium|large|xl|xxl|black|white|silver|gray|grey|blue|red|green)\b$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  return `title:${cleanedTitle || product.id.toLowerCase()}`;
}

/**
 * PHASE 2: Logically groups duplicate items/variants (e.g., 1,656 duplicate variant rows)
 * into clean Parent Products with a consolidated `variants` array BEFORE saving to PostgreSQL.
 */
export function groupDuplicateVariantsIntoParentProducts(products: GmcProduct[]): {
  groupedProducts: GmcProduct[];
  duplicatesMergedCount: number;
} {
  const parentMap = new Map<string, GmcProduct>();
  let duplicatesMergedCount = 0;

  const sampleColors = ['Obsidian Black', 'Titanium Silver', 'Midnight Navy', 'Carbon Matte', 'Arctic White'];
  const sampleSizes = ['Standard', 'Medium', 'Large', 'XL / Pro'];

  for (const item of products) {
    const groupKey = normalizeParentGroupKey(item);
    const existingParent = parentMap.get(groupKey);

    if (!existingParent) {
      // Clean trailing "- Variant #123" from the parent title if present
      const cleanParentTitle = item.title
        .replace(/\s*[-–|·]\s*(Variant|Batch|Edition)\s*#?\d+.*$/i, '')
        .trim();

      const parentClone: GmcProduct = {
        ...item,
        title: cleanParentTitle || item.title,
        variants:
          Array.isArray(item.variants) && item.variants.length > 0
            ? [...item.variants]
            : buildDefaultVariantsForProduct({ ...item, title: cleanParentTitle || item.title }),
      };
      parentMap.set(groupKey, parentClone);
    } else {
      duplicatesMergedCount++;
      const existingVariants = existingParent.variants || [];
      const variantAlreadyExists = existingVariants.some(
        (v) => v.sku.toLowerCase() === item.id.toLowerCase()
      );

      if (!variantAlreadyExists && existingVariants.length < 16) {
        const idx = existingVariants.length;
        existingVariants.push({
          id: item.id,
          sku: item.id,
          cj_vid: item.cj_vid || item.cj_pid || `${existingParent.id}-V${idx + 1}`,
          color: sampleColors[idx % sampleColors.length],
          size: sampleSizes[idx % sampleSizes.length],
          price: item.price,
          sale_price: item.sale_price,
          image_link: item.image_link || existingParent.image_link,
          stock_quantity: 50,
        });
        existingParent.variants = existingVariants;
      }

      if (
        item.image_link &&
        item.image_link !== existingParent.image_link &&
        (!existingParent.additional_image_link ||
          !existingParent.additional_image_link.includes(item.image_link))
      ) {
        existingParent.additional_image_link = [
          ...(existingParent.additional_image_link || []),
          item.image_link,
        ].slice(0, 6);
      }
    }
  }

  return {
    groupedProducts: Array.from(parentMap.values()),
    duplicatesMergedCount,
  };
}

/**
 * Generic Map function for any platform (Zendrop, Spocket, Custom API)
 */
export function mapGenericApiProductToGmc(
  raw: Record<string, any>,
  config: GenericMappingConfig,
  options: SyncOptions = {}
): GmcProduct {
  const multiplier = options.markupMultiplier ?? 2.5;
  const currency = options.currency ?? 'USD';
  const brand = (config.brandPath ? getNestedValue(raw, config.brandPath) : undefined) || options.defaultBrand || 'AeroThor';
  const domain = options.domain ?? 'aerothor.com';

  const rawId = String(getNestedValue(raw, config.idPath) || Math.random().toString(36).substring(7));
  const rawTitle = String(getNestedValue(raw, config.titlePath) || 'Generic Direct Supplier Product');
  const rawPrice = parseCjPrice(getNestedValue(raw, config.pricePath));
  const retailPrice = Number((rawPrice * multiplier).toFixed(2));
  const rawImage = String(getNestedValue(raw, config.imagePath) || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800');
  const rawDesc = config.descriptionPath ? String(getNestedValue(raw, config.descriptionPath) || '') : '';
  const rawGtin = config.gtinPath ? String(getNestedValue(raw, config.gtinPath) || '') : undefined;

  const sku = `${config.platformName.toUpperCase().slice(0, 3)}-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const title = sanitizeGmcTitle(rawTitle);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 70);

  return {
    id: sku,
    title,
    description: rawDesc || `${title} - Direct imported consumer product with domestic 48h dispatch.`,
    link: `https://${domain}/products/${slug}`,
    image_link: rawImage,
    price: `${retailPrice.toFixed(2)} ${currency}`,
    sale_price: `${(retailPrice * 0.9).toFixed(2)} ${currency}`,
    availability: 'in_stock',
    brand,
    condition: 'new',
    gtin: rawGtin || undefined,
    mpn: sku,
    product_type: 'General Consumer Catalog',
    shipping: [
      {
        country: options.targetMarket === 'UK' ? 'GB' : 'US',
        service: 'Domestic 48h Express',
        price: `0.00 ${currency}`,
      },
    ],
  };
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => {
    // Handle array indexing e.g. images[0]
    const match = part.match(/^([a-zA-Z0-9_]+)\[(\d+)\]$/);
    if (match) {
      const arr = acc?.[match[1]];
      return Array.isArray(arr) ? arr[parseInt(match[2], 10)] : undefined;
    }
    return acc?.[part];
  }, obj);
}

/**
 * Complete, production-ready Next.js App Router API Route code
 * for CJ Dropshipping to PostgreSQL with Prisma batch upserts
 */
export function getNextJsCjSyncRouteSnippet(): string {
  return `/**
 * @file app/api/cj/sync/route.ts
 * Next.js App Router API Route: Automated CJ Dropshipping to PostgreSQL Sync
 * Strict Google Merchant Center (GMC) field mapping + Prisma atomic batch upsert
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_API_KEY = process.env.CJ_API_KEY;
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aerothor.com';
const RETAIL_MARKUP_MULTIPLIER = 2.5; // Target 60% gross profit for US/UK PMax ad margins

interface CjProductItem {
  pid: string;
  productName: string;
  productNameEn?: string;
  productSku?: string;
  productImage: string;
  productImageSet?: string[] | string;
  sellPrice: string | number;
  categoryName?: string;
  description?: string;
}

export async function GET(req: NextRequest) {
  try {
    if (!CJ_API_KEY) {
      return NextResponse.json(
        { error: 'CJ_API_KEY environment variable is not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageNum = searchParams.get('pageNum') || '1';
    const pageSize = searchParams.get('pageSize') || '50';
    const countryCode = searchParams.get('countryCode') || 'US'; // Priority for domestic US/UK 2-day delivery
    const categoryId = searchParams.get('categoryId');

    // 1. Resolve Access Token (Exchanges apiKey e.g. CJ5994755@api@... into 180-day CJ-Access-Token)
    let accessToken = CJ_API_KEY;
    if (CJ_API_KEY.includes('@api@') || !CJ_API_KEY.startsWith('API@')) {
      const authRes = await fetch(\`\${CJ_API_URL}/authentication/getAccessToken\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: CJ_API_KEY }),
      });
      const authData = await authRes.json();
      if (authData.code === 200 && authData.data?.accessToken) {
        accessToken = authData.data.accessToken;
      } else {
        throw new Error(authData.message || 'Failed to authenticate with CJ Dropshipping Developer API');
      }
    }

    // 2. Fetch live product catalog from CJ Dropshipping API v2.0
    const queryUrl = new URL(\`\${CJ_API_URL}/product/list\`);
    queryUrl.searchParams.set('pageNum', pageNum);
    queryUrl.searchParams.set('pageSize', pageSize);
    queryUrl.searchParams.set('countryCode', countryCode);
    if (categoryId) queryUrl.searchParams.set('categoryId', categoryId);

    const cjResponse = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Edge cache 1 hour
    });


    if (!cjResponse.ok) {
      throw new Error(\`CJ API responded with status \${cjResponse.status}: \${cjResponse.statusText}\`);
    }

    const cjData = await cjResponse.json();

    if (cjData.code !== 200 || !cjData.data?.list) {
      throw new Error(cjData.message || 'Failed to retrieve product list from CJ Dropshipping');
    }

    const rawList: CjProductItem[] = cjData.data.list;

    // 2. Map CJ schema directly to Google Merchant Center RSS 2.0 standards
    const mappedProducts = rawList.map((item) => {
      const wholesaleCost = parseFloat(String(item.sellPrice).split('--')[0].replace(/[^0-9.]/g, '')) || 15.0;
      const retailPrice = Number((wholesaleCost * RETAIL_MARKUP_MULTIPLIER).toFixed(2));
      const salePrice = Number((retailPrice * 0.88).toFixed(2)); // 12% discount badge for Google Shopping

      const sku = item.productSku ? \`CJ-\${item.productSku.replace(/[^a-zA-Z0-9_-]/g, '')}\` : \`CJ-\${item.pid.slice(0, 12)}\`;
      const cleanTitle = (item.productNameEn || item.productName || 'Premium Lifestyle Gear')
        .replace(/[\\u4e00-\\u9fa5]+/g, '')
        .trim()
        .slice(0, 150);

      const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 70);

      return {
        sku,
        title: cleanTitle,
        description: item.description?.replace(/<[^>]*>/g, '').trim() || \`\${cleanTitle} - Premium quality commuter hardware with domestic 48-hour delivery.\`,
        link: \`https://\${APP_DOMAIN}/products/\${slug}\`,
        imageLink: item.productImage,
        price: retailPrice,
        salePrice,
        currency: 'USD',
        availability: 'in_stock' as const,
        condition: 'new' as const,
        brand: 'AeroThor', // Consistent D2C brand identity for GMC compliance
        gtin: null, // Set if GS1 barcode exists, otherwise identifier_exists handles it
        mpn: item.productSku || sku,
        productType: item.categoryName || 'Consumer Goods',
        status: 'active',
        isVisible: true,
      };
    });

    // 3. Prisma Atomic Batch Upsert into PostgreSQL
    // Uses Prisma $transaction with upsert to prevent unique constraint collisions and preserve inventory updates
    const upsertOperations = mappedProducts.map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          title: p.title,
          description: p.description,
          price: p.price,
          salePrice: p.salePrice,
          imageLink: p.imageLink,
          availability: p.availability,
          condition: p.condition,
          brand: p.brand,
          mpn: p.mpn,
          productType: p.productType,
          status: p.status,
          updatedAt: new Date(),
        },
        create: {
          sku: p.sku,
          title: p.title,
          description: p.description,
          link: p.link,
          imageLink: p.imageLink,
          price: p.price,
          salePrice: p.salePrice,
          currency: p.currency,
          availability: p.availability,
          condition: p.condition,
          brand: p.brand,
          mpn: p.mpn,
          productType: p.productType,
          status: p.status,
          isVisible: p.isVisible,
        },
      })
    );

    await prisma.$transaction(upsertOperations);

    return NextResponse.json({
      success: true,
      message: \`Successfully synced and mapped \${mappedProducts.length} CJ products into PostgreSQL\`,
      totalSynced: mappedProducts.length,
      sampleGmcProduct: mappedProducts[0],
      feedUrl: \`https://\${APP_DOMAIN}/api/feed.xml\`,
    });
  } catch (error: any) {
    console.error('[CJ Sync Route Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while syncing CJ products' },
      { status: 500 }
    );
  }
}
`;
}

/**
 * Universal Next.js Route for "Any Platform" (Zendrop, Spocket, AliExpress, or Custom Webhook)
 */
export function getNextJsUniversalSyncRouteSnippet(): string {
  return `/**
 * @file app/api/integrations/universal-sync/route.ts
 * Next.js App Router API Route: Multi-Platform Dropshipping & Supplier Webhook Synchronizer
 * Works with CJ Dropshipping, Zendrop, Spocket, AliExpress DS, or any custom REST API
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'aerothor.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, endpointUrl, authHeader, apiKey, markupMultiplier = 2.5, mapping } = body;

    if (!endpointUrl) {
      return NextResponse.json({ error: 'endpointUrl is required' }, { status: 400 });
    }

    // 1. Fetch from supplier endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader && apiKey) {
      headers[authHeader] = apiKey;
    }

    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(\`Supplier API (\${platform}) returned status \${response.status}\`);
    }

    const data = await response.json();
    // Resolve products array (handles { data: { list: [] } }, { products: [] }, or direct array)
    const rawItems: any[] = Array.isArray(data) 
      ? data 
      : data.data?.list || data.products || data.items || data.data || [];

    if (!rawItems.length) {
      return NextResponse.json({ error: 'No product records found in supplier response' }, { status: 400 });
    }

    // 2. Dynamic JSON Field Extraction & GMC Normalization
    const mapped = rawItems.map((item) => {
      const idKey = mapping?.id || 'id';
      const titleKey = mapping?.title || 'title';
      const priceKey = mapping?.price || 'price';
      const imageKey = mapping?.image || 'image_url';

      const rawId = String(item[idKey] || item.sku || item.pid || Math.random().toString(36).slice(2, 8));
      const rawTitle = String(item[titleKey] || item.productName || item.name || 'Consumer Product');
      const rawPrice = parseFloat(String(item[priceKey] || item.sellPrice || '20').replace(/[^0-9.]/g, '')) || 20;

      const retailPrice = Number((rawPrice * Number(markupMultiplier)).toFixed(2));
      const sku = \`\${(platform || 'SUP').toUpperCase().slice(0, 4)}-\${rawId}\`;
      const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);

      return {
        sku,
        title: rawTitle.slice(0, 150),
        description: item.description || \`\${rawTitle} - High quality imported goods with fast domestic shipping.\`,
        link: \`https://\${APP_DOMAIN}/products/\${slug}\`,
        imageLink: item[imageKey] || item.productImage || 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
        price: retailPrice,
        salePrice: Number((retailPrice * 0.88).toFixed(2)),
        currency: 'USD',
        availability: 'in_stock' as const,
        condition: 'new' as const,
        brand: item.brand || 'AeroThor',
        mpn: sku,
        status: 'active',
        isVisible: true,
      };
    });

    // 3. Prisma Batch Upsert
    const operations = mapped.map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {
          title: p.title,
          price: p.price,
          salePrice: p.salePrice,
          imageLink: p.imageLink,
          updatedAt: new Date(),
        },
        create: p,
      })
    );

    await prisma.$transaction(operations);

    return NextResponse.json({
      success: true,
      platform: platform || 'Custom API',
      syncedCount: mapped.length,
      sample: mapped[0],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`;
}

/**
 * Authentic CJ Dropshipping Sample Product List
 * Used for live client-side testing and instant interactive simulation
 */
export const SAMPLE_CJ_RAW_PRODUCTS: CjRawProduct[] = [
  {
    pid: '143289012345',
    productName: 'Double Wall Vacuum Insulated Stainless Steel Tumbler with Straw 40oz',
    productNameEn: '40oz Vacuum Insulated Stainless Steel Thermal Tumbler with Spill-Proof Straw',
    productSku: 'CJ-TUMB-40OZ-BLK',
    productImage: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
    sellPrice: '14.50',
    categoryName: 'Home & Kitchen > Drinkware',
    categoryId: '1401',
    description: '40oz ultra-durable 18/8 stainless steel double wall vacuum tumbler. Fits standard automotive cup holders. Keeps beverages ice cold for up to 34 hours.',
    supplierName: 'Ningbo Premier Drinkware Factory',
  },
  {
    pid: '158902341298',
    productName: 'Fast Qi2 3-in-1 Foldable Wireless Charging Station for Apple Devices',
    productNameEn: 'Qi2 Certified 3-in-1 Foldable Magnetic Wireless Charging Stand 15W',
    productSku: 'CJ-MAG-FOLD-QI2',
    productImage: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80&fm=webp',
    sellPrice: '19.80',
    categoryName: 'Consumer Electronics > Phone Accessories',
    categoryId: '1205',
    description: 'Official Qi2 15W magnetic rapid wireless charger. Engineered with CNC aluminum hinges and intelligent thermal protection. Folds flat for travel.',
    supplierName: 'Shenzhen TechVolt Innovations',
  },
  {
    pid: '167812904532',
    productName: 'Waterproof Ballistic Cordura Sling Bag 8L Anti-Theft Crossbody Pack',
    productNameEn: 'Ballistic 1000D Cordura Waterproof Crossbody Sling Pack 8L',
    productSku: 'CJ-SLING-1000D',
    productImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    sellPrice: '16.20',
    categoryName: 'Luggage & Bags > Backpacks',
    categoryId: '1802',
    description: 'Tough 1000D ballistic nylon sling bag with YKK waterproof zippers, magnetic Fidlock strap buckle, and RFID-blocking hidden passport pocket.',
    supplierName: 'Guangzhou Apex Luggage Co.',
  },
  {
    pid: '178923450192',
    productName: 'Ultra-Light Titanium Key Carabiner Multitool with Bottle Opener & Pry',
    productNameEn: 'Aerospace Grade 5 Titanium Minimalist EDC Key Carabiner Multitool',
    productSku: 'CJ-TI-CARAB-01',
    productImage: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80&fm=webp',
    sellPrice: '8.40',
    categoryName: 'Sports & Outdoors > EDC Gear',
    categoryId: '1904',
    description: 'Precision CNC machined Grade 5 titanium keychain carabiner. Features integrated hex bit driver, metric ruler, pry tool, and bottle lifter.',
    supplierName: 'Dongguan Precision Metalware',
  },
  {
    pid: '189034561284',
    productName: 'Adaptive Memory Foam Neck Travel Pillow with Organic Cotton Cover',
    productNameEn: 'Ergonomic 360-Degree Support Adaptive Memory Foam Flight Pillow',
    productSku: 'CJ-MEM-PILLOW-AIR',
    productImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
    sellPrice: '11.90',
    categoryName: 'Travel & Luggage > Travel Comfort',
    categoryId: '1809',
    description: 'High-density viscoelastic memory foam pillow with 360-degree chin and cervical spine support. Includes washable moisture-wicking organic cover.',
    supplierName: 'Hangzhou CloudComfort Textiles',
  },
];
