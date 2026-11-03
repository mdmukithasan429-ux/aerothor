import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateAdminPassword } from '../auth/route';
import { buildProductPrismaWhere, clearRouteMemoryCache } from '../../products/route';
import { deleteSkusFromPostgres } from '@/src/server/storage';

export const dynamic = 'force-dynamic';

/**
 * Validate Bearer Token or session cookie strictly against Vercel environment variables
 * (process.env.ADMIN_SECURE_PASSWORD / process.env.ADMIN_SECRET_KEY / process.env.ADMIN_PASSWORD)
 * with zero hardcoded fallback strings.
 */
function authenticateAdmin(req: NextRequest): { authorized: boolean; response?: NextResponse } {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const cookieToken = req.cookies.get('admin_session')?.value || '';

  const token =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : cookieToken;

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing or malformed Bearer token.' },
        { status: 401 }
      ),
    };
  }

  if (!validateAdminPassword(token)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden: Invalid administrative credentials.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}

/**
 * 0. GET: Paginated & Category-Filtered Admin Inventory Query (Prisma `skip`, `take`, `where`)
 */
export async function GET(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(req.url);

    // Support single SKU / ID direct query
    const targetSku = searchParams.get('sku') || searchParams.get('id');
    if (targetSku) {
      const singleProduct = await prisma.product.findUnique({
        where: { sku: targetSku },
        include: { variants: true },
      });
      if (singleProduct) {
        return NextResponse.json({ success: true, product: singleProduct });
      }
    }

    const hasPaginationParams =
      searchParams.has('page') ||
      searchParams.has('limit') ||
      searchParams.has('take') ||
      searchParams.has('skip');

    const isAll =
      searchParams.get('all') === 'true' ||
      searchParams.get('limit') === 'all' ||
      searchParams.get('take') === 'all' ||
      !hasPaginationParams;

    const rawLimit = searchParams.get('limit') || searchParams.get('take');
    const parsedLimit = rawLimit ? parseInt(rawLimit, 10) : NaN;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const take = isAll
      ? 2000
      : !isNaN(parsedLimit)
      ? Math.min(2000, Math.max(1, parsedLimit))
      : 24;

    const explicitSkip = searchParams.get('skip');
    const skip =
      explicitSkip !== null && !isNaN(parseInt(explicitSkip, 10))
        ? Math.max(0, parseInt(explicitSkip, 10))
        : isAll
        ? 0
        : (page - 1) * take;

    const category = searchParams.get('category') || 'All';
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';

    const where = buildProductPrismaWhere({
      category,
      query,
      type,
      includeHidden: true,
    });

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { variants: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      page,
      pageSize: take,
      skip,
      take,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / take)),
      category,
      query,
      products,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch paginated admin inventory.' },
      { status: 500 }
    );
  }
}

/**
 * 1. POST: Add Single Product or Batch Products
 * Aligned with Google Merchant Center RSS 2.0 fields
 */
export async function POST(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();

    // Batch insertion mode
    if (Array.isArray(body.products)) {
      const items = body.products.map((item: any) => {
        const numericPrice = parseFloat(String(item.price || '0'));
        const title = String(item.title || 'Product').trim().slice(0, 150);
        const sku = String(item.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`).trim();
        const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}-${sku.slice(-6).toLowerCase()}`;

        return {
          sku,
          title,
          description: String(item.description || title).trim(),
          slug,
          brand: String(item.brand || 'AeroCommerce').trim(),
          price: numericPrice,
          salePrice: item.salePrice ? parseFloat(String(item.salePrice)) : null,
          currency: (item.currency || 'USD').toUpperCase(),
          stockQuantity: parseInt(String(item.stockQuantity), 10) || 0,
          availability: item.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
          mainImageUrl: String(item.mainImageUrl || item.image_link || '').trim(),
          additionalImgs: Array.isArray(item.additionalImages) ? item.additionalImages : [],
          productType: item.productType || 'dropshipping',
          affiliateUrl: item.affiliateUrl || null,
          isVisible: true,
        };
      });

      const result = await prisma.product.createMany({
        data: items,
        skipDuplicates: true,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Batch created ${result.count} products successfully.`,
          insertedCount: result.count,
        },
        { status: 201 }
      );
    }

    // Single item insertion mode
    const {
      sku,
      title,
      description,
      price,
      salePrice,
      currency = 'USD',
      brand = 'AeroCommerce',
      mainImageUrl,
      additionalImages = [],
      stockQuantity = 99,
      availability = 'in_stock',
      productType = 'dropshipping',
      affiliateUrl,
    } = body;

    if (!sku || !title || !price || !mainImageUrl) {
      return NextResponse.json(
        { error: 'Missing required GMC fields: sku, title, price, and mainImageUrl are mandatory.' },
        { status: 400 }
      );
    }

    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid price: must be a positive decimal number.' },
        { status: 400 }
      );
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}-${sku.slice(-6).toLowerCase()}`;

    const newProduct = await prisma.product.create({
      data: {
        sku: String(sku).trim(),
        title: String(title).trim().slice(0, 150),
        description: String(description || title).trim(),
        slug,
        brand: String(brand).trim(),
        price: numericPrice,
        salePrice: salePrice ? parseFloat(String(salePrice)) : null,
        currency: currency.toUpperCase(),
        stockQuantity: parseInt(String(stockQuantity), 10) || 0,
        availability: availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
        mainImageUrl: String(mainImageUrl).trim(),
        additionalImgs: Array.isArray(additionalImages) ? additionalImages : [],
        productType,
        affiliateUrl: affiliateUrl || null,
        isVisible: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Product ${newProduct.sku} created successfully.`,
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[Admin Product Create Error]:', err);
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate error: A product with this SKU or slug already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Failed to create product.' },
      { status: 500 }
    );
  }
}

/**
 * 2. PATCH: Update Stock Availability, Price, or Product Status (Single or Batch)
 */
export async function PATCH(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();

    // Batch update mode
    if (Array.isArray(body.items)) {
      const updates = body.items;
      let updatedCount = 0;

      for (const item of updates) {
        const { id, sku, price, salePrice, stockQuantity, availability, isVisible, title, description } = item;
        const targetWhere = id ? { id } : sku ? { sku } : null;
        if (!targetWhere) continue;

        const dataToUpdate: any = {};
        if (price !== undefined) dataToUpdate.price = parseFloat(String(price));
        if (salePrice !== undefined) dataToUpdate.salePrice = salePrice ? parseFloat(String(salePrice)) : null;
        if (stockQuantity !== undefined) {
          const qty = parseInt(String(stockQuantity), 10);
          dataToUpdate.stockQuantity = qty;
          if (availability === undefined) dataToUpdate.availability = qty > 0 ? 'in_stock' : 'out_of_stock';
        }
        if (availability !== undefined) dataToUpdate.availability = availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
        if (isVisible !== undefined) dataToUpdate.isVisible = Boolean(isVisible);
        if (title !== undefined) dataToUpdate.title = String(title).slice(0, 150);
        if (description !== undefined) dataToUpdate.description = String(description);

        await prisma.product
          .update({
            where: targetWhere,
            data: dataToUpdate,
          })
          .then(() => updatedCount++)
          .catch((e) => console.warn('[Batch Item Skip]:', e.message));
      }

      return NextResponse.json({
        success: true,
        message: `Batch updated ${updatedCount} products successfully.`,
        updatedCount,
      });
    }

    // Single update mode
    const { id, sku, price, salePrice, stockQuantity, availability, isVisible, title, description } = body;

    if (!id && !sku) {
      return NextResponse.json(
        { error: 'Must provide either product id (UUID) or sku to identify the target product.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (price !== undefined) updateData.price = parseFloat(String(price));
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(String(salePrice)) : null;
    if (stockQuantity !== undefined) {
      const parsedStock = parseInt(String(stockQuantity), 10);
      updateData.stockQuantity = parsedStock;
      if (availability === undefined) {
        updateData.availability = parsedStock > 0 ? 'in_stock' : 'out_of_stock';
      }
    }
    if (availability !== undefined) {
      updateData.availability = availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
    }
    if (isVisible !== undefined) updateData.isVisible = Boolean(isVisible);
    if (title !== undefined) updateData.title = String(title).slice(0, 150);
    if (description !== undefined) updateData.description = String(description);

    const updated = await prisma.product.update({
      where: id ? { id } : { sku },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Product ${updated.sku} updated successfully.`,
      product: updated,
    });
  } catch (err: any) {
    console.error('[Admin Product Update Error]:', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update product.' }, { status: 500 });
  }
}

/**
 * 3. DELETE: Remove Product by ID, SKU, or Batch List of SKUs
 */
export async function DELETE(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');
    const skusParam = searchParams.get('skus');

    let bodySkus: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.skus)) bodySkus = body.skus;
    } catch {
      // Body may be empty in DELETE requests
    }

    const combinedSkus = [
      ...(skusParam ? skusParam.split(',').map((s) => s.trim()).filter(Boolean) : []),
      ...bodySkus,
    ];

    if (combinedSkus.length > 0) {
      const [result] = await Promise.all([
        prisma.product.deleteMany({
          where: {
            sku: { in: combinedSkus },
          },
        }),
        deleteSkusFromPostgres(combinedSkus).catch(() => 0),
      ]);
      clearRouteMemoryCache();

      return NextResponse.json({
        success: true,
        message: `Batch deleted ${result.count || combinedSkus.length} products from catalog and GMC feed.`,
        deletedCount: result.count || combinedSkus.length,
        deletedSkus: combinedSkus,
      });
    }

    if (!id && !sku) {
      return NextResponse.json(
        { error: 'Query parameter "id", "sku", or "skus" list is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = await prisma.product.delete({
      where: id ? { id } : { sku: sku! },
    });
    if (deleted?.sku) {
      await deleteSkusFromPostgres([deleted.sku]).catch(() => 0);
    }
    clearRouteMemoryCache();

    return NextResponse.json({
      success: true,
      message: `Product ${deleted.sku} removed from catalog and GMC feed.`,
      deletedId: deleted.id,
      deletedSku: deleted.sku,
    });
  } catch (err: any) {
    console.error('[Admin Product Delete Error]:', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: err.message || 'Failed to delete product.' }, { status: 500 });
  }
}
