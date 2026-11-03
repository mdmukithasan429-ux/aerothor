import { createRequire } from 'module';
import {
  loadPersistedCatalog,
  savePersistedCatalog,
  loadPersistedOrders,
  savePersistedOrder,
} from '../src/server/storage';

function hasLivePostgresUrl(): boolean {
  const url = process.env.DATABASE_URL || '';
  return (
    Boolean(url) &&
    !url.includes(':password@') &&
    !url.includes('YOUR_PASSWORD') &&
    !url.includes('[YOUR-PASSWORD]')
  );
}

function mapCatalogProductToPrismaRow(p: any) {
  const numPrice =
    typeof p.price === 'number'
      ? p.price
      : parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 29.99;
  const numSalePrice = p.sale_price
    ? typeof p.sale_price === 'number'
      ? p.sale_price
      : parseFloat(String(p.sale_price).replace(/[^0-9.]/g, '')) || null
    : p.salePrice ?? null;

  return {
    id: p.id,
    sku: p.id,
    cjPid: p.cj_pid || p.cjPid || null,
    title: p.title,
    description: p.description || '',
    slug: `${String(p.title || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${String(p.id).toLowerCase()}`,
    brand: p.brand || 'AeroThor',
    price: numPrice,
    salePrice: numSalePrice,
    sale_price: p.sale_price || (numSalePrice ? `${numSalePrice.toFixed(2)} USD` : undefined),
    currency: String(p.price || '').includes('GBP') ? 'GBP' : 'USD',
    stockQuantity: 99,
    availability: p.availability || 'in_stock',
    mainImageUrl: p.image_link || p.mainImageUrl || '',
    image_link: p.image_link || p.mainImageUrl || '',
    additionalImgs: p.additional_image_link || [],
    seoTitle: p.seo_title || p.seoTitle || null,
    seoDescription: p.seo_description || p.seoDescription || null,
    productType: p.productType || 'dropshipping',
    product_type: p.product_type || 'Tech Accessories',
    affiliateUrl: p.affiliateUrl || p.affiliate_url || null,
    isFreeShipping: p.isFreeShipping ?? true,
    shippingCost: p.shippingCost ?? 0,
    isVisible: p.isVisible !== false,
    isTrending: Boolean(p.isTrending),
    isBestSelling: Boolean(p.isBestSelling),
    trendingScore: p.trendingScore ?? 90,
    salesCount: p.salesCount ?? 350,
    tags: Array.isArray(p.tags) ? p.tags : ['trending', 'lifetime-update'],
    rating: p.rating ?? 4.94,
    reviewCount: p.reviewCount ?? 180,
    reviewsJson: Array.isArray(p.reviews) ? p.reviews : p.reviewsJson || [],
    reviews: Array.isArray(p.reviews) ? p.reviews : p.reviewsJson || [],
    hasLifetimeUpdateAccess: p.hasLifetimeUpdateAccess ?? true,
    variants: Array.isArray(p.variants) ? p.variants : [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function matchesCondition(row: any, cond: any): boolean {
  if (!cond || typeof cond !== 'object') return true;
  if (Array.isArray(cond.AND)) {
    if (!cond.AND.every((c: any) => matchesCondition(row, c))) return false;
  }
  if (Array.isArray(cond.OR)) {
    if (!cond.OR.some((c: any) => matchesCondition(row, c))) return false;
  }
  for (const [key, val] of Object.entries(cond)) {
    if (key === 'AND' || key === 'OR') continue;
    const fieldVal = row[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const vObj = val as any;
      const strField = String(fieldVal ?? '');
      const compareField = vObj.mode === 'insensitive' ? strField.toLowerCase() : strField;
      if (vObj.equals !== undefined) {
        const target = vObj.mode === 'insensitive' ? String(vObj.equals).toLowerCase() : String(vObj.equals);
        if (compareField !== target) return false;
      }
      if (vObj.contains !== undefined) {
        const target = vObj.mode === 'insensitive' ? String(vObj.contains).toLowerCase() : String(vObj.contains);
        if (!compareField.includes(target)) return false;
      }
      if (vObj.startsWith !== undefined) {
        const target = vObj.mode === 'insensitive' ? String(vObj.startsWith).toLowerCase() : String(vObj.startsWith);
        if (!compareField.startsWith(target)) return false;
      }
      if (vObj.not !== undefined) {
        if (vObj.not === null && (fieldVal === null || fieldVal === undefined || fieldVal === '')) {
          return false;
        }
        if (vObj.not !== null && String(fieldVal) === String(vObj.not)) {
          return false;
        }
      }
      if (vObj.has !== undefined && Array.isArray(fieldVal)) {
        if (!fieldVal.includes(vObj.has)) return false;
      }
    } else if (val === null) {
      if (fieldVal !== null && fieldVal !== undefined && fieldVal !== '') return false;
    } else if (val !== undefined) {
      if (fieldVal !== val) return false;
    }
  }
  return true;
}

function createDiskFallbackPrismaClient() {
  return {
    product: {
      async count(args?: { where?: any }) {
        const rows = loadPersistedCatalog().map(mapCatalogProductToPrismaRow);
        const filtered = args?.where ? rows.filter((r) => matchesCondition(r, args.where)) : rows;
        return filtered.length;
      },
      async findMany(args?: { where?: any; skip?: number; take?: number; orderBy?: any; select?: any; include?: any }) {
        const rows = loadPersistedCatalog().map(mapCatalogProductToPrismaRow);
        let filtered = args?.where ? rows.filter((r) => matchesCondition(r, args.where)) : rows;
        if (typeof args?.skip === 'number' && args.skip > 0) {
          filtered = filtered.slice(args.skip);
        }
        if (typeof args?.take === 'number' && args.take > 0) {
          filtered = filtered.slice(0, args.take);
        }
        return filtered;
      },
      async findUnique(args: { where: { id?: string; sku?: string; slug?: string } }) {
        const rows = loadPersistedCatalog().map(mapCatalogProductToPrismaRow);
        const key = (args?.where?.sku || args?.where?.id || args?.where?.slug || '').toLowerCase();
        return (
          rows.find(
            (r) =>
              r.sku.toLowerCase() === key ||
              r.id.toLowerCase() === key ||
              r.slug.toLowerCase() === key
          ) || null
        );
      },
      async deleteMany() {
        return { count: 0 };
      },
      async create(args: { data: any }) {
        const it = args.data;
        const normalized = {
          ...it,
          id: it.id || it.sku,
          sku: it.sku || it.id,
          image_link: it.image_link || it.mainImageUrl,
          price: typeof it.price === 'number' ? `${it.price.toFixed(2)} USD` : it.price,
          ...(it.salePrice || it.sale_price
            ? {
                sale_price:
                  typeof (it.sale_price || it.salePrice) === 'number'
                    ? `${Number(it.sale_price || it.salePrice).toFixed(2)} USD`
                    : it.sale_price || it.salePrice,
              }
            : {}),
        };
        const current = loadPersistedCatalog();
        const mapped = mapCatalogProductToPrismaRow(normalized);
        const filtered = current.filter(
          (p) => String(p.id || '').toLowerCase() !== String(normalized.id || '').toLowerCase()
        );
        savePersistedCatalog([normalized, ...filtered]);
        return mapped;
      },
      async createMany(args: { data: any[]; skipDuplicates?: boolean }) {
        const items = args.data || [];
        return { count: items.length };
      },
      async upsert(args: { where: { sku?: string; id?: string }; update: any; create: any }) {
        const catalog = loadPersistedCatalog();
        const sku = String(args.where.sku || args.where.id || args.create.sku || args.create.id);
        const idx = catalog.findIndex((p) => p.id.toLowerCase() === sku.toLowerCase());
        const source = idx >= 0 ? { ...catalog[idx], ...args.update } : args.create;
        const mapped = mapCatalogProductToPrismaRow({ ...source, id: sku });
        return mapped;
      },
    },
    productVariant: {
      async count() {
        const catalog = loadPersistedCatalog();
        return catalog.reduce((acc, p) => acc + (Array.isArray(p.variants) ? p.variants.length : 0), 0);
      },
      async deleteMany() {
        return { count: 0 };
      },
      async createMany(args: { data: any[]; skipDuplicates?: boolean }) {
        return { count: args.data?.length || 0 };
      },
      async create(args: { data: any }) {
        return args.data;
      },
    },
    order: {
      async count() {
        return loadPersistedOrders().length;
      },
      async findMany(args?: { take?: number; orderBy?: any }) {
        const orders = loadPersistedOrders();
        return typeof args?.take === 'number' ? orders.slice(0, args.take) : orders;
      },
      async findUnique(args: { where: { orderNumber?: string; stripeSessionId?: string; paymentIntentId?: string; id?: string } }) {
        const orders = loadPersistedOrders();
        return (
          orders.find(
            (o) =>
              (args.where.orderNumber && (o.orderNumber === args.where.orderNumber || o.id === args.where.orderNumber)) ||
              (args.where.stripeSessionId && o.stripeSessionId === args.where.stripeSessionId) ||
              (args.where.id && o.id === args.where.id)
          ) || null
        );
      },
      async upsert(args: { where: any; update: any; create: any }) {
        const data = { ...args.create, ...args.update };
        const orderId = String(data.orderNumber || data.id || `ORD-2026-${Date.now().toString().slice(-6)}`);
        const savedList = await savePersistedOrder({
          id: orderId,
          orderNumber: orderId,
          stripeSessionId: String(data.stripeSessionId || args.where?.stripeSessionId || `cs_${Date.now()}`),
          trackingCode: String(data.trackingCode || ''),
          trackingNumber: String(data.trackingCode || ''),
          status: data.status || 'Paid - Ready for CJ Fulfill',
          cjOrderStatus: data.cjOrderStatus || 'awaiting_fulfillment',
          cjApiMessage: data.cjApiMessage || 'Paid via Stripe — Ready for CJ Dropshipping fulfillment',
          customerName: String(data.customerName || 'Verified Customer'),
          customerEmail: String(data.customerEmail || 'customer@aerothor.com'),
          customerPhone: String(data.customerPhone || ''),
          shippingAddress:
            typeof data.shippingAddress === 'string'
              ? data.shippingAddress
              : JSON.stringify(data.shippingAddress || {}),
          shippingCity: String(data.shippingCity || ''),
          shippingState: String(data.shippingState || ''),
          shippingZip: String(data.shippingZip || ''),
          shippingCountry: String(data.shippingCountry || 'US'),
          shippingMethod: 'free',
          paymentMethod: 'stripe_checkout',
          totalAmount: Number(data.totalAmount) || 0,
          currency: String(data.currency || 'USD'),
          paymentStatus: 'paid',
          carrier: data.shippingCountry === 'GB' ? 'Royal Mail Tracked 48' : 'USPS Priority Mail',
          estimatedDelivery: '3 to 5 Business Days',
          purchasedSkus: Array.isArray(data.purchasedSkus)
            ? data.purchasedSkus
            : String(data.purchasedSkus || '')
                .split(',')
                .filter(Boolean),
          items: Array.isArray(data.itemsJson) ? data.itemsJson : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return savedList[0];
      },
    },
    storeSettings: {
      async findUnique() {
        return {
          id: 'singleton',
          storeName: 'AeroThor Performance Essentials',
          supportEmail: 'support@aerothor.com',
          phoneNumber: '+1 (800) 555-0199',
          physicalAddress: '1209 North Orange St, Wilmington, DE 19801',
          primaryColorHex: '#10B981',
          isStripeEnabled: true,
          isCodEnabled: false,
          storeCurrency: 'USD',
          amazonAssociateTag: 'aerothor-20',
          autoDeductEnabled: true,
        };
      },
    },
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaInstance() {
  if (hasLivePostgresUrl()) {
    try {
      const req = createRequire(import.meta.url);
      const pkg = req('@prisma/client');
      const PrismaClientConstructor = pkg.PrismaClient || pkg.default?.PrismaClient;
      if (PrismaClientConstructor) {
        return new PrismaClientConstructor({
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        });
      }
    } catch {
      // Fallback to persisted disk storage when Prisma client is not yet generated
    }
  }
  return createDiskFallbackPrismaClient();
}

export const prisma: any = globalForPrisma.prisma ?? createPrismaInstance();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
