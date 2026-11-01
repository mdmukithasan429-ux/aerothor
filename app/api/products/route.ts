import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Builds a Prisma `where` clause supporting dynamic Category Tabs
 * ("All", "Clothing", "Tech Accessories", "Affiliate Deals", "Drinkware & Travel", "CJ Marketplace")
 * and search queries (`q`).
 */
export function buildProductPrismaWhere(params: {
  category?: string;
  query?: string;
  type?: string;
  includeHidden?: boolean;
}) {
  const andConditions: any[] = [];

  if (!params.includeHidden) {
    andConditions.push({ isVisible: true });
  }

  const normalizedType = (params.type || '').trim().toLowerCase();
  if (normalizedType === 'affiliate') {
    andConditions.push({
      OR: [
        { productType: { equals: 'affiliate', mode: 'insensitive' } },
        { affiliateUrl: { not: null } },
        { sku: { startsWith: 'AFF-', mode: 'insensitive' } },
      ],
    });
  } else if (normalizedType === 'dropshipping') {
    andConditions.push({
      productType: { not: 'affiliate' },
      affiliateUrl: null,
    });
  }

  const cat = (params.category || 'All').trim();
  const catLower = cat.toLowerCase();

  if (cat && catLower !== 'all') {
    if (catLower === 'affiliate deals' || catLower === 'affiliate') {
      andConditions.push({
        OR: [
          { productType: { equals: 'affiliate', mode: 'insensitive' } },
          { affiliateUrl: { not: null } },
          { sku: { startsWith: 'AFF-', mode: 'insensitive' } },
        ],
      });
    } else if (catLower === 'clothing' || catLower === 'outerwear & commute') {
      andConditions.push({
        OR: [
          { productType: { contains: 'Clothing', mode: 'insensitive' } },
          { productType: { contains: 'Apparel', mode: 'insensitive' } },
          { title: { contains: 'Hoodie', mode: 'insensitive' } },
          { title: { contains: 'Jacket', mode: 'insensitive' } },
          { title: { contains: 'Shirt', mode: 'insensitive' } },
          { title: { contains: 'Merino', mode: 'insensitive' } },
          { title: { contains: 'Backpack', mode: 'insensitive' } },
          { title: { contains: 'Aviator', mode: 'insensitive' } },
          { title: { contains: 'Eyewear', mode: 'insensitive' } },
        ],
      });
    } else if (catLower === 'tech accessories') {
      andConditions.push({
        OR: [
          { productType: { contains: 'Tech', mode: 'insensitive' } },
          { productType: { contains: 'Electronics', mode: 'insensitive' } },
          { title: { contains: 'Charge', mode: 'insensitive' } },
          { title: { contains: 'Stand', mode: 'insensitive' } },
          { title: { contains: 'Dock', mode: 'insensitive' } },
          { title: { contains: 'Adapter', mode: 'insensitive' } },
          { title: { contains: 'SSD', mode: 'insensitive' } },
          { title: { contains: 'Audio', mode: 'insensitive' } },
          { title: { contains: 'Power', mode: 'insensitive' } },
          { title: { contains: 'Wallet', mode: 'insensitive' } },
        ],
      });
    } else if (catLower === 'drinkware & travel') {
      andConditions.push({
        OR: [
          { productType: { contains: 'Drinkware', mode: 'insensitive' } },
          { productType: { contains: 'Travel', mode: 'insensitive' } },
          { title: { contains: 'Flask', mode: 'insensitive' } },
          { title: { contains: 'Tumbler', mode: 'insensitive' } },
          { title: { contains: 'Pillow', mode: 'insensitive' } },
        ],
      });
    } else if (catLower === 'cj marketplace') {
      andConditions.push({
        OR: [
          { cjPid: { not: null } },
          { sku: { startsWith: 'CJ-', mode: 'insensitive' } },
        ],
      });
    } else {
      andConditions.push({
        OR: [
          { productType: { contains: cat, mode: 'insensitive' } },
          { title: { contains: cat, mode: 'insensitive' } },
          { description: { contains: cat, mode: 'insensitive' } },
        ],
      });
    }
  }

  const q = (params.query || '').trim();
  if (q) {
    andConditions.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

/**
 * GET /api/products
 * Supports server-side pagination (`page`, `limit` / `take`, `skip`) and `category` / `q` filtering via Prisma.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const take = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || searchParams.get('take') || '20', 10) || 20)
    );
    const explicitSkip = searchParams.get('skip');
    const skip =
      explicitSkip !== null && !isNaN(parseInt(explicitSkip, 10))
        ? Math.max(0, parseInt(explicitSkip, 10))
        : (page - 1) * take;

    const category = searchParams.get('category') || 'All';
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || '';

    const where = buildProductPrismaWhere({
      category,
      query,
      type,
      includeHidden: false,
    });

    const [totalCount, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { variants: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return NextResponse.json({
      success: true,
      page,
      pageSize: take,
      skip,
      take,
      totalCount,
      totalPages,
      category,
      query,
      count: items.length,
      products: items,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch paginated products',
      },
      { status: 500 }
    );
  }
}
