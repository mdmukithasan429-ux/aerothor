import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic execution for API route
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5-minute timeout for batch data processing

interface CjRawProduct {
  pid: string;
  productNameEn: string;
  productSku: string;
  productImage: string;
  productImageSet?: string[];
  sellPrice?: string | number;
  description?: string;
  categoryId?: string;
  categoryName?: string;
}

/**
 * Exchange CJ apiKey (or CJ5994755@api@...) for valid CJ-Access-Token
 */
async function getCjAccessToken(apiKey: string): Promise<string> {
  const trimmed = apiKey.trim();
  if (trimmed.startsWith('API@') || (trimmed.startsWith('eyJ') && !trimmed.includes('@api@'))) {
    return trimmed;
  }

  const authRes = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: trimmed }),
  });

  const authData: any = await authRes.json();
  if (authData.code === 200 && authData.data?.accessToken) {
    return authData.data.accessToken;
  }

  throw new Error(authData.message || 'Failed to exchange CJ Dropshipping API Key for Access Token');
}

/**
 * Clean & Sanitize descriptions for Google Merchant Center
 */
function cleanGmcDescription(raw: string | undefined, title: string): string {
  if (!raw || raw.trim().length === 0) {
    return `${title}. Engineered for superior performance, premium durability, and daily utility. Verified US/UK domestic fulfillment.`;
  }
  return raw
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);
}

/**
 * Generate a clean SEO & canonical URL slug
 */
function generateSlug(title: string, pid: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
  return `${base}-${pid.slice(-6).toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. SECURITY RULE: Validate Admin Bearer Token
    // -------------------------------------------------------------------------
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret) {
      console.error('[CJ Bulk Sync] ADMIN_SECRET_KEY is not defined in environment variables.');
      return NextResponse.json(
        { error: 'Server configuration error: ADMIN_SECRET_KEY is required' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing Bearer token in Authorization header.' },
        { status: 401 }
      );
    }

    const providedToken = authHeader.slice(7).trim();
    if (providedToken !== expectedSecret) {
      return NextResponse.json(
        { error: 'Forbidden: Invalid administrative credentials.' },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. PARSE CONFIGURATION & PAGINATION SETTINGS
    // -------------------------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const {
      apiKey = process.env.CJ_API_KEY,
      targetCount = 200,          // Target count to sync
      pageSize = 50,              // CJ max allowed is typically 50-100
      maxPages = 10,              // Max loops to prevent runaway execution
      countryCode = 'US',         // Domestic US fulfillment focus
      markupMultiplier = 2.5,     // 2.5x retail markup formula (60% gross profit)
      currency = 'USD',
      brand = 'AeroCommerce',
      categoryId,
      searchKeyword,
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'CJ_API_KEY is not configured in environment or request body.' },
        { status: 400 }
      );
    }

    // Resolve active CJ access token
    const accessToken = await getCjAccessToken(apiKey);

    // -------------------------------------------------------------------------
    // 3. PAGINATION LOOP: Fetching thousands of products
    // -------------------------------------------------------------------------
    const rawFetchedItems: CjRawProduct[] = [];
    let pageNum = 1;
    let hasMore = true;

    while (hasMore && pageNum <= maxPages && rawFetchedItems.length < targetCount) {
      const url = new URL(
        searchKeyword
          ? 'https://developers.cjdropshipping.com/api2.0/v1/product/listV2'
          : 'https://developers.cjdropshipping.com/api2.0/v1/product/list'
      );

      if (searchKeyword) {
        url.searchParams.set('page', String(pageNum));
        url.searchParams.set('size', String(pageSize));
        url.searchParams.set('keyWord', searchKeyword);
      } else {
        url.searchParams.set('pageNum', String(pageNum));
        url.searchParams.set('pageSize', String(pageSize));
      }

      if (countryCode) url.searchParams.set('countryCode', countryCode);
      if (categoryId) url.searchParams.set('categoryId', categoryId);

      const pageRes = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!pageRes.ok) {
        throw new Error(`CJ API HTTP error on page ${pageNum}: ${pageRes.statusText}`);
      }

      const pageData: any = await pageRes.json();
      if (pageData.code !== 200) {
        throw new Error(`CJ API business error: ${pageData.message || 'Unknown error'}`);
      }

      const list: CjRawProduct[] =
        pageData.data?.list ||
        pageData.data?.content?.[0]?.productList ||
        [];

      if (!list || list.length === 0) {
        hasMore = false;
        break;
      }

      rawFetchedItems.push(...list);

      // Check if we reached end of supplier catalog
      const totalAvailable = pageData.data?.total || pageData.data?.totalRecords;
      if (totalAvailable && rawFetchedItems.length >= totalAvailable) {
        hasMore = false;
        break;
      }

      pageNum++;

      // Polite QPS throttling (CJ Developer API has a 1 QPS rate limit)
      await new Promise((resolve) => setTimeout(resolve, 450));
    }

    // -------------------------------------------------------------------------
    // 4. GMC RULES MAPPING: Strictly conforming to Google Shopping RSS 2.0
    // -------------------------------------------------------------------------
    const mappedProducts = rawFetchedItems.map((item) => {
      const rawCost = typeof item.sellPrice === 'number'
        ? item.sellPrice
        : parseFloat(String(item.sellPrice || '12.00')) || 12.00;

      const calculatedRetail = Number((rawCost * markupMultiplier).toFixed(2));
      const calculatedSale = Number((calculatedRetail * 0.88).toFixed(2)); // 12% promotional discount
      const cleanTitle = (item.productNameEn || 'Premium Lifestyle Product')
        .replace(/[\r\n\t]+/g, ' ')
        .trim()
        .slice(0, 150);

      const sku = `CJ-${item.pid}`;
      const slug = generateSlug(cleanTitle, item.pid);
      const description = cleanGmcDescription(item.description, cleanTitle);

      return {
        sku,
        cjPid: item.pid,
        title: cleanTitle,
        description,
        slug,
        brand,
        costPrice: rawCost,
        price: calculatedRetail,
        salePrice: calculatedSale,
        currency,
        stockQuantity: 99,
        availability: 'in_stock', // GMC rule: 'in_stock' | 'out_of_stock' | 'preorder'
        condition: 'new',         // GMC rule: strictly 'new' for dropship
        warehouseCountry: countryCode || 'US',
        fulfillmentDaysMin: 2,
        fulfillmentDaysMax: 5,
        mainImageUrl: item.productImage,
        additionalImages: item.productImageSet || [],
        gtin: null, // Mapped if available
        mpn: sku,
        googleCategory: item.categoryName || 'Apparel & Accessories > Hardware',
        productType: item.categoryName || 'Home & Garden',
        status: 'active',
        isVisible: true,
      };
    });

    // -------------------------------------------------------------------------
    // 5. BULK INSERT: Prisma createMany with skipDuplicates: true
    // Chunking in batches of 250 to prevent hitting PostgreSQL parameter bounds
    // -------------------------------------------------------------------------
    const CHUNK_SIZE = 250;
    let totalInsertedCount = 0;

    for (let i = 0; i < mappedProducts.length; i += CHUNK_SIZE) {
      const chunk = mappedProducts.slice(i, i + CHUNK_SIZE);
      const result = await prisma.product.createMany({
        data: chunk,
        skipDuplicates: true, // Prevents crashing on existing SKU/PID conflicts
      });
      totalInsertedCount += result.count;
    }

    const durationMs = Date.now() - startTime;

    // Optional: Log sync execution for audit
    await prisma.inventorySyncLog.create({
      data: {
        productsScanned: mappedProducts.length,
        productsUpdated: totalInsertedCount,
        status: 'success',
      },
    }).catch((e) => console.warn('[Log Warning]', e.message));

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${totalInsertedCount} products into database`,
      metrics: {
        pagesScanned: pageNum - 1,
        totalFetchedFromSupplier: rawFetchedItems.length,
        totalInsertedIntoDatabase: totalInsertedCount,
        duplicatesOrSkipped: rawFetchedItems.length - totalInsertedCount,
        durationMs,
      },
      sampleProduct: mappedProducts[0] || null,
    });
  } catch (error: any) {
    console.error('[CJ Bulk Sync Fatal Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during bulk inventory sync',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
