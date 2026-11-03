import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { loadPersistedCatalog } from '@/src/server/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export type StorefrontSortMode = 'trending' | 'random' | 'latest' | 'price_asc' | 'price_desc';

/**
 * Determines whether a product carries the 'trending' tag or qualifies as a trending / top-selling item.
 */
export function isTrendingProduct(product: any): boolean {
  if (!product) return false;
  if (product.isTrending === true) return true;

  if (Array.isArray(product.tags)) {
    const hasTrendingTag = product.tags.some((t: any) =>
      ['trending', 'bestseller', 'top-seller', 'hot', 'featured'].includes(
        String(t || '').toLowerCase().trim()
      )
    );
    if (hasTrendingTag) return true;
  }

  const label = String(
    product.custom_label_0 || product.tag || product.badge || ''
  ).toLowerCase();
  if (
    label.includes('trending') ||
    label.includes('bestseller') ||
    label.includes('top seller') ||
    label.includes('hot')
  ) {
    return true;
  }

  const titleLower = String(product.title || '').toLowerCase();
  const typeLower = String(
    product.productType || product.product_type || product.google_product_category || ''
  ).toLowerCase();

  // Protective skins, 3M wraps, and discounted items are flagged as trending
  const hasSaleDiscount = Boolean(product.salePrice || product.sale_price);
  const isTrendingCategory =
    typeLower.includes('protective skin') ||
    typeLower.includes('vinyl') ||
    titleLower.includes('skin') ||
    titleLower.includes('wrap') ||
    titleLower.includes('magsafe') ||
    titleLower.includes('titanium');

  return hasSaleDiscount || isTrendingCategory;
}

/**
 * Enriches a product object with explicit `tags` (including `'trending'` when applicable) and `isTrending`.
 */
export function enrichProductWithTrendingTags<T extends Record<string, any>>(product: T): T & {
  isTrending: boolean;
  tags: string[];
} {
  const trending = isTrendingProduct(product);
  const existingTags: string[] = Array.isArray(product.tags)
    ? product.tags.map((t: any) => String(t))
    : [];

  const tagSet = new Set<string>(existingTags);
  if (trending) {
    tagSet.add('trending');
  }
  if (product.salePrice || product.sale_price) {
    tagSet.add('deal');
  }

  return {
    ...product,
    isTrending: trending,
    tags: Array.from(tagSet),
  };
}

/**
 * Unbiased Fisher-Yates array shuffle for dynamic storefront randomization on every request.
 */
export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Dynamically sorts and shuffles storefront products by 'trending' tag or pure random order.
 */
export function sortAndShuffleStorefrontProducts<T extends Record<string, any>>(
  items: T[],
  sortMode: StorefrontSortMode = 'trending'
): Array<T & { isTrending: boolean; tags: string[] }> {
  const enriched = items.map((item) => enrichProductWithTrendingTags(item));

  if (sortMode === 'random') {
    return shuffleArray(enriched);
  }

  if (sortMode === 'price_asc' || sortMode === 'price_desc') {
    const parseNumericPrice = (p: any): number => {
      const raw = p.salePrice ?? p.sale_price ?? p.price ?? 0;
      const num = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
      return Number.isFinite(num) ? num : 0;
    };
    return [...enriched].sort((a, b) =>
      sortMode === 'price_asc'
        ? parseNumericPrice(a) - parseNumericPrice(b)
        : parseNumericPrice(b) - parseNumericPrice(a)
    );
  }

  if (sortMode === 'latest') {
    return enriched;
  }

  // Default: 'trending' — prioritize products with the 'trending' tag first,
  // and dynamically shuffle within both the trending and standard buckets so every refresh feels alive.
  const trendingBucket = shuffleArray(enriched.filter((p) => p.isTrending));
  const standardBucket = shuffleArray(enriched.filter((p) => !p.isTrending));
  return [...trendingBucket, ...standardBucket];
}

/**
 * Builds a Prisma `where` clause supporting dynamic Category Tabs
 * ("All", "Trending", "Protective Skins & Wraps", "Clothing", "Tech Accessories", "Affiliate Deals", "Drinkware & Travel", "CJ Marketplace")
 * and search queries (`q`).
 */
export function buildProductPrismaWhere(params: {
  category?: string;
  query?: string;
  type?: string;
  tag?: string;
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

  const tagFilter = (params.tag || '').trim().toLowerCase();
  const cat = (params.category || 'All').trim();
  const catLower = cat.toLowerCase();

  if (tagFilter === 'trending' || catLower === 'trending') {
    andConditions.push({
      OR: [
        { salePrice: { not: null } },
        { productType: { contains: 'Protective Skin', mode: 'insensitive' } },
        { productType: { contains: 'Trending', mode: 'insensitive' } },
        { title: { contains: 'Skin', mode: 'insensitive' } },
        { title: { contains: 'Wrap', mode: 'insensitive' } },
        { title: { contains: 'MagSafe', mode: 'insensitive' } },
        { title: { contains: 'Titanium', mode: 'insensitive' } },
      ],
    });
  } else if (cat && catLower !== 'all') {
    if (catLower === 'protective skins & wraps' || catLower === 'protective skins') {
      andConditions.push({
        OR: [
          { productType: { contains: 'Protective Skin', mode: 'insensitive' } },
          { productType: { contains: 'Wrap', mode: 'insensitive' } },
          { title: { contains: 'Skin', mode: 'insensitive' } },
          { title: { contains: 'Wrap', mode: 'insensitive' } },
          { title: { contains: '3M', mode: 'insensitive' } },
        ],
      });
    } else if (catLower === 'affiliate deals' || catLower === 'affiliate') {
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
 * Dynamically refreshes storefront products on every request:
 * - Supports `?sort=trending` (default: prioritizes 'trending' tagged products & shuffles dynamically)
 * - Supports `?sort=random` (pure Fisher-Yates random shuffle across matched catalog)
 * - Supports `?tag=trending` or `?category=Trending` to filter strictly to trending products
 * - Supports server-side pagination (`page`, `limit` / `take`, `skip`) and `category` / `q` filtering
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
    const tag = searchParams.get('tag') || '';
    const rawSort = (searchParams.get('sort') || 'trending').toLowerCase().trim();
    const sortMode: StorefrontSortMode =
      rawSort === 'random' || rawSort === 'latest' || rawSort === 'price_asc' || rawSort === 'price_desc'
        ? rawSort
        : 'trending';

    let matchedItems: any[] = [];

    try {
      const where = buildProductPrismaWhere({
        category,
        query,
        type,
        tag,
        includeHidden: false,
      });

      const dbItems = await prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { variants: true },
      });

      if (dbItems.length > 0) {
        matchedItems = dbItems.map((p) => ({
          ...p,
          id: p.sku || p.id,
          price: Number(p.price),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          image_link: p.mainImageUrl,
        }));
      }
    } catch {
      // Fallback to verified persisted catalog if Prisma is unreachable
    }

    if (matchedItems.length === 0) {
      const persisted = loadPersistedCatalog();
      const catLower = category.trim().toLowerCase();
      const qLower = query.trim().toLowerCase();
      const tagLower = tag.trim().toLowerCase();

      matchedItems = persisted.filter((p: any) => {
        if (p.status === 'archived' || p.isVisible === false) return false;
        if (type === 'affiliate' && p.productType !== 'affiliate') return false;
        if (type === 'dropshipping' && p.productType === 'affiliate') return false;
        if ((tagLower === 'trending' || catLower === 'trending') && !isTrendingProduct(p)) {
          return false;
        }
        if (catLower && catLower !== 'all' && catLower !== 'trending') {
          const hayCat = `${p.product_type || ''} ${p.productType || ''} ${p.title || ''} ${p.description || ''}`.toLowerCase();
          if (!hayCat.includes(catLower)) return false;
        }
        if (qLower) {
          const hayQ = `${p.title || ''} ${p.description || ''} ${p.id || ''} ${p.brand || ''}`.toLowerCase();
          if (!hayQ.includes(qLower)) return false;
        }
        return true;
      });
    }

    const sortedAndShuffled = sortAndShuffleStorefrontProducts(matchedItems, sortMode);
    const totalCount = sortedAndShuffled.length;
    const paginatedItems = sortedAndShuffled.slice(skip, skip + take);
    const totalPages = Math.max(1, Math.ceil(totalCount / take));

    return NextResponse.json(
      {
        success: true,
        sort: sortMode,
        refreshedAt: new Date().toISOString(),
        page,
        pageSize: take,
        skip,
        take,
        totalCount,
        totalPages,
        category,
        query,
        count: paginatedItems.length,
        products: paginatedItems,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dynamic storefront products',
      },
      { status: 500 }
    );
  }
}
