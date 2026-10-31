import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Validate Bearer Token against ADMIN_SECRET_KEY
 */
function authenticateAdmin(req: NextRequest): { authorized: boolean; response?: NextResponse } {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const expectedSecret = process.env.ADMIN_SECRET_KEY;

  if (!expectedSecret) {
    console.error('[Admin API] ADMIN_SECRET_KEY environment variable is missing.');
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Server misconfiguration: ADMIN_SECRET_KEY is not defined' },
        { status: 500 }
      ),
    };
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing or malformed Bearer token.' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7).trim();
  if (token !== expectedSecret) {
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
          condition: item.condition || 'new',
          mainImageUrl: String(item.mainImageUrl || item.image_link || '').trim(),
          additionalImages: Array.isArray(item.additionalImages) ? item.additionalImages : [],
          gtin: item.gtin ? String(item.gtin).trim() : null,
          mpn: item.mpn ? String(item.mpn).trim() : sku,
          googleCategory: item.googleCategory || 'Apparel & Accessories',
          productType: item.productType || 'Lifestyle & Gadgets',
          warehouseCountry: item.warehouseCountry || 'US',
          status: 'active',
          isVisible: true,
        };
      });

      const result = await prisma.product.createMany({
        data: items,
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        message: `Batch created ${result.count} products successfully.`,
        insertedCount: result.count,
      }, { status: 201 });
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
      condition = 'new',
      gtin,
      mpn,
      googleCategory = 'Apparel & Accessories',
      productType = 'Lifestyle & Gadgets',
      warehouseCountry = 'US',
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
        condition: condition || 'new',
        mainImageUrl: String(mainImageUrl).trim(),
        additionalImages: Array.isArray(additionalImages) ? additionalImages : [],
        gtin: gtin ? String(gtin).trim() : null,
        mpn: mpn ? String(mpn).trim() : String(sku).trim(),
        googleCategory,
        productType,
        warehouseCountry,
        status: 'active',
        isVisible: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Product ${newProduct.sku} created successfully.`,
      product: newProduct,
    }, { status: 201 });
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

        await prisma.product.update({
          where: targetWhere,
          data: dataToUpdate,
        }).then(() => updatedCount++).catch((e) => console.warn('[Batch Item Skip]:', e.message));
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

    // Body can also contain skus array
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

    // Batch deletion mode
    if (combinedSkus.length > 0) {
      const result = await prisma.product.deleteMany({
        where: {
          sku: { in: combinedSkus },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Batch deleted ${result.count} products from catalog and GMC feed.`,
        deletedCount: result.count,
        deletedSkus: combinedSkus,
      });
    }

    // Single deletion mode
    if (!id && !sku) {
      return NextResponse.json(
        { error: 'Query parameter "id", "sku", or "skus" list is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = await prisma.product.delete({
      where: id ? { id } : { sku: sku! },
    });

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
