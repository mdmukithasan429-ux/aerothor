import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for 20-page bulk sync

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

interface CjRawProduct {
  pid: string;
  productSku?: string;
  productNameEn?: string;
  productImage?: string;
  sellPrice?: string | number;
  categoryName?: string;
  productWeight?: number;
}

/**
 * Exchanges a CJ API Key (e.g. CJ5994755@api@...) for an active CJ-Access-Token
 */
async function resolveCjAccessToken(rawKeyOrToken: string): Promise<string> {
  const trimmed = rawKeyOrToken.trim();
  if (trimmed.startsWith('API@') || (trimmed.startsWith('eyJ') && !trimmed.includes('@api@'))) {
    return trimmed;
  }

  const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: trimmed }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (data.code === 200 && data.data?.accessToken) {
    return data.data.accessToken;
  }

  throw new Error(data.message || 'Failed to authenticate with CJ Dropshipping API');
}

/**
 * Helper to create URL-safe unique slugs for PDP SEO routes
 */
function slugifyTitle(title: string, sku: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180);
  return `${base || 'product'}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Sanitizes raw CJ titles/descriptions and maps to strict Google Merchant Center & Prisma rules
 */
function transformCjItemToPrismaRecord(
  raw: CjRawProduct,
  markupMultiplier = 2.5,
  brand = 'AeroCommerce'
) {
  const cleanTitle = (raw.productNameEn || 'Premium Everyday Essential')
    .replace(/<[^>]*>/g, '')
    .replace(/\b(free shipping|hot sale|2024|2025|2026|new arrival|dropshipping|cheap|wholesale)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  const sku = String(raw.productSku || `CJ-${raw.pid}`).trim();
  const rawCostStr = String(raw.sellPrice || '14.00').split('-')[0].replace(/[^0-9.]/g, '');
  const baseCost = Math.max(2.0, parseFloat(rawCostStr) || 14.0);
  const retailPrice = Math.floor(baseCost * markupMultiplier) + 0.99;

  let mainImageUrl = String(raw.productImage || '').trim();
  if (mainImageUrl.startsWith('[')) {
    try {
      const parsed = JSON.parse(mainImageUrl);
      if (Array.isArray(parsed) && parsed.length > 0) mainImageUrl = parsed[0];
    } catch {
      // keep fallback
    }
  }
  if (mainImageUrl.startsWith('http://')) {
    mainImageUrl = mainImageUrl.replace('http://', 'https://');
  }
  if (!mainImageUrl.startsWith('https://')) {
    mainImageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80';
  }

  const category = raw.categoryName || 'Home, Tech & Lifestyle';

  return {
    sku,
    cjPid: String(raw.pid),
    title: cleanTitle,
    description: `${cleanTitle}. Engineered by ${brand} for durability and everyday performance. Ships directly from our domestic US & UK fulfillment centers within 3–7 business days with full courier tracking and a 30-day money-back guarantee.`,
    slug: slugifyTitle(cleanTitle, sku),
    brand,
    costPrice: Number(baseCost.toFixed(2)),
    price: Number(retailPrice.toFixed(2)),
    salePrice: null,
    currency: 'USD',
    stockQuantity: 100,
    availability: 'in_stock',
    condition: 'new',
    warehouseCountry: 'US',
    fulfillmentDaysMin: 3,
    fulfillmentDaysMax: 7,
    mainImageUrl,
    additionalImages: [mainImageUrl],
    gtin: null,
    mpn: sku,
    googleCategory: 'Apparel & Accessories',
    productType: category.slice(0, 250),
    status: 'active',
    isVisible: true,
  };
}

/**
 * POST /api/admin/sync-cj
 * Loops through 20 pages of 50 items (1,000 products total) from the CJ Dropshipping API
 * and bulk-inserts them into PostgreSQL using `prisma.product.createMany({ skipDuplicates: true })`.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. SECURITY RULE: Verify Authorization: Bearer <ADMIN_SECRET_KEY>
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_SECRET_KEY is not set in environment variables.' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or malformed Authorization Bearer header.' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7).trim();
    if (token !== adminSecret) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid ADMIN_SECRET_KEY token.' },
        { status: 403 }
      );
    }

    // 2. Parse optional parameters (defaults to 20 pages x 50 items = 1,000 products)
    const body = await req.json().catch(() => ({}));
    const totalPages = Math.min(Math.max(Number(body.pages) || 20, 1), 40);
    const pageSize = Math.min(Math.max(Number(body.pageSize) || 50, 10), 50);
    const targetProducts = totalPages * pageSize; // 20 * 50 = 1,000
    const markupMultiplier = Number(body.markupMultiplier) || 2.5;
    const brand = String(body.brand || 'AeroCommerce').trim();
    const countryCode = String(body.countryCode || 'US').trim();

    const rawCjKey = body.apiKey || process.env.CJ_API_KEY;
    if (!rawCjKey) {
      return NextResponse.json(
        { error: 'Missing CJ_API_KEY in environment variables or request body.' },
        { status: 400 }
      );
    }

    const accessToken = await resolveCjAccessToken(rawCjKey);

    // 3. Loop through CJ Dropshipping pagination (20 pages x 50 items = 1,000 products)
    const collectedRawItems: CjRawProduct[] = [];
    let pagesFetched = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const listUrl = new URL(`${CJ_BASE_URL}/product/list`);
      listUrl.searchParams.set('pageNum', String(pageNum));
      listUrl.searchParams.set('pageSize', String(pageSize));
      if (countryCode) {
        listUrl.searchParams.set('countryCode', countryCode);
      }

      const cjRes = await fetch(listUrl.toString(), {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!cjRes.ok) {
        console.warn(`[CJ 1000-Sync] Page ${pageNum} returned HTTP ${cjRes.status}`);
        break;
      }

      const cjJson = await cjRes.json();
      const pageItems: CjRawProduct[] = cjJson?.data?.list || [];

      if (cjJson.code !== 200 || pageItems.length === 0) {
        break;
      }

      collectedRawItems.push(...pageItems);
      pagesFetched++;

      if (collectedRawItems.length >= targetProducts) {
        break;
      }

      // Respect CJ API QPS rate limit (~400ms pause between page requests)
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    const slicedRawItems = collectedRawItems.slice(0, targetProducts);
    const productsToInsert = slicedRawItems.map((item) =>
      transformCjItemToPrismaRecord(item, markupMultiplier, brand)
    );

    // 4. BULK INSERT into PostgreSQL using Prisma createMany with skipDuplicates: true
    const batchResult = await prisma.product.createMany({
      data: productsToInsert,
      skipDuplicates: true,
    });

    // 5. Record sync telemetry in InventorySyncLog
    await prisma.inventorySyncLog.create({
      data: {
        productsScanned: productsToInsert.length,
        productsUpdated: batchResult.count,
        status: 'success',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully synced ${productsToInsert.length} products across ${pagesFetched} pages (${batchResult.count} new unique records inserted into PostgreSQL).`,
        stats: {
          pagesRequested: totalPages,
          pagesFetched,
          pageSize,
          totalFetched: productsToInsert.length,
          insertedCount: batchResult.count,
          skippedDuplicatesCount: productsToInsert.length - batchResult.count,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[POST /api/admin/sync-cj Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during 1000-product CJ bulk sync.',
      },
      { status: 500 }
    );
  }
}
