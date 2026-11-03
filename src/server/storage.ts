import fs from 'fs';
import os from 'os';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { GmcProduct, CANONICAL_STORE_URL } from '../lib/gmc-feed';
import { INITIAL_PRODUCTS } from './seed-data';
import {
  buildDefaultVariantsForProduct,
  groupDuplicateVariantsIntoParentProducts,
} from '../lib/api-integrations';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });
dotenv.config();

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), 'data');
const BUNDLED_DB_FILE_PATH = path.join(BUNDLED_DATA_DIR, 'catalog-db.json');
const BUNDLED_ORDERS_FILE_PATH = path.join(BUNDLED_DATA_DIR, 'orders-db.json');

const RUNTIME_DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'aerothor-data')
  : BUNDLED_DATA_DIR;
const DB_FILE_PATH = path.join(RUNTIME_DATA_DIR, 'catalog-db.json');
const ORDERS_FILE_PATH = path.join(RUNTIME_DATA_DIR, 'orders-db.json');

export interface PersistedDatabaseState {
  updatedAt: string;
  products: GmcProduct[];
}

export interface OrderLineItem {
  sku: string;
  cjPid?: string;
  cjVid?: string;
  cjSku?: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderFulfillmentStatus =
  | 'Paid - Ready for CJ Fulfill'
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface PersistedOrder {
  id: string;
  orderNumber?: string;
  trackingCode?: string;
  status?: OrderFulfillmentStatus;
  purchasedSkus?: string[];
  stripeSessionId: string;
  cjOrderId?: string;
  cjOrderStatus: 'submitted_to_cj' | 'pending_cj_balance' | 'awaiting_fulfillment' | 'fulfilled' | 'local_inventory';
  cjApiMessage?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  shippingMethod: string;
  paymentMethod: string;
  totalAmount: number;
  currency: string;
  paymentStatus: 'paid' | 'pending';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  items: OrderLineItem[];
  createdAt: string;
  updatedAt?: string;
}

let pgPool: pg.Pool | null = null;
let pgUnavailable = false;

function disablePostgresPool(): void {
  pgUnavailable = true;
  if (pgPool) {
    const oldPool = pgPool;
    pgPool = null;
    oldPool.end().catch(() => {});
  }
}

function getPostgresPool(): pg.Pool | null {
  if (pgUnavailable) return null;
  const dbUrl = process.env.DATABASE_URL;
  if (
    !dbUrl ||
    dbUrl.includes('db.supabase.co:5432/postgres?pgbouncer=true') ||
    dbUrl.includes('[YOUR-PASSWORD]') ||
    dbUrl.includes('YOUR_PASSWORD') ||
    dbUrl.includes(':password@')
  ) {
    return null;
  }
  if (!pgPool) {
    pgPool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 3500,
      query_timeout: 4000,
      statement_timeout: 4000,
      idleTimeoutMillis: 10000,
    });
    pgPool.on('error', () => {
      disablePostgresPool();
    });
  }
  return pgPool;
}

function slugify(title: string, sku: string): string {
  const cleanSku = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 150);
  return `${base || 'product'}-${cleanSku}`.slice(0, 240);
}

/**
 * Helper to identify synthetic bulk-generated filler products vs real CJ / custom / seed products
 */
export function isSyntheticBatchProduct(p: GmcProduct): boolean {
  return /^CJ-(HOME|FIT|TRVL|TECH)-\d{5}$/i.test(p.id);
}

/**
 * Ensures real CJ Marketplace products always appear FIRST at the top of the catalog,
 * followed by custom/seed products, and synthetic 1000-product filler items last.
 */
export function prioritizeRealProductsFirst(products: GmcProduct[]): GmcProduct[] {
  const seen = new Set<string>();
  const realCjProducts: GmcProduct[] = [];
  const customAndSeedProducts: GmcProduct[] = [];
  const syntheticBatch: GmcProduct[] = [];

  for (const p of products) {
    const key = String(p.id || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const withVariants: GmcProduct = {
      ...p,
      variants:
        Array.isArray(p.variants) && p.variants.length > 0
          ? p.variants
          : buildDefaultVariantsForProduct(p),
    };

    if (isSyntheticBatchProduct(withVariants)) {
      syntheticBatch.push(withVariants);
    } else if (
      withVariants.source === 'cj_live' ||
      Boolean(withVariants.cj_pid) ||
      key.startsWith('cj-')
    ) {
      realCjProducts.push(withVariants);
    } else {
      customAndSeedProducts.push(withVariants);
    }
  }

  return [...realCjProducts, ...customAndSeedProducts, ...syntheticBatch];
}

/**
 * Ensures PostgreSQL tables (`products`, `orders`, `inventory_sync_logs`) exist on Supabase
 * and merges catalog between Supabase PostgreSQL and local disk cache without losing newly added products.
 */
export async function initSupabasePostgresCatalog(currentCatalog: GmcProduct[]): Promise<GmcProduct[]> {
  const prioritizedLocal = prioritizeRealProductsFirst(currentCatalog);
  const pool = getPostgresPool();
  if (!pool) return prioritizedLocal;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sku VARCHAR(255) UNIQUE NOT NULL,
        cj_pid VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        slug VARCHAR(255) NOT NULL,
        brand VARCHAR(128) DEFAULT 'AeroCommerce',
        cost_price NUMERIC(10, 2) DEFAULT 0.00,
        price NUMERIC(10, 2) NOT NULL,
        sale_price NUMERIC(10, 2),
        currency VARCHAR(3) DEFAULT 'USD',
        stock_quantity INT DEFAULT 99,
        availability VARCHAR(20) DEFAULT 'in_stock',
        condition VARCHAR(20) DEFAULT 'new',
        warehouse_country VARCHAR(2) DEFAULT 'US',
        fulfillment_days_min INT DEFAULT 3,
        fulfillment_days_max INT DEFAULT 7,
        main_image_url TEXT NOT NULL,
        additional_images JSONB DEFAULT '[]'::jsonb,
        gtin VARCHAR(32),
        mpn VARCHAR(64),
        google_category VARCHAR(255),
        product_type VARCHAR(255),
        seo_title TEXT,
        seo_description TEXT,
        status VARCHAR(20) DEFAULT 'active',
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_key;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(64) DEFAULT 'dropshipping';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        shipping_country VARCHAR(255) DEFAULT 'US',
        total_amount NUMERIC(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        payment_status VARCHAR(32) DEFAULT 'pending',
        items_json JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_sync_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        synced_at TIMESTAMPTZ DEFAULT NOW(),
        products_scanned INT NOT NULL,
        products_updated INT NOT NULL,
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT
      );
    `);

    const { rows } = await pool.query('SELECT * FROM products ORDER BY updated_at DESC, created_at DESC');

    if (rows.length > 0) {
      const dbProducts: GmcProduct[] = rows.map((row: any) => ({
        id: row.sku,
        title: row.title,
        description: row.description,
        link: `${process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_STORE_URL}/product/${row.sku}`,
        image_link: row.main_image_url,
        price: `${Number(row.price).toFixed(2)} ${row.currency || 'USD'}`,
        sale_price: row.sale_price ? `${Number(row.sale_price).toFixed(2)} ${row.currency || 'USD'}` : undefined,
        availability: row.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
        brand: row.brand || 'AeroCommerce',
        condition: row.condition || 'new',
        gtin: row.gtin || undefined,
        mpn: row.mpn || row.sku,
        identifier_exists: true,
        product_type: row.product_type || 'Lifestyle & Tech',
        productType: row.product_type === 'affiliate' ? 'affiliate' : 'dropshipping',
        affiliateUrl: row.affiliate_url || undefined,
        affiliate_url: row.affiliate_url || undefined,
        cj_pid: row.cj_pid || undefined,
        wholesale_price: row.cost_price ? Number(row.cost_price) : undefined,
        source: row.cj_pid ? 'cj_live' : undefined,
        seo_title: row.seo_title || undefined,
        seo_description: row.seo_description || undefined,
      }));

      // Merge local disk products (e.g. recently synced CJ items) with DB products so nothing is lost
      const merged = prioritizeRealProductsFirst([...prioritizedLocal, ...dbProducts]);
      savePersistedCatalogToDiskOnly(merged);

      // If local had items not yet in Postgres, push them up
      if (merged.length > dbProducts.length) {
        syncCatalogToPostgres(merged).catch(() => disablePostgresPool());
      }

      console.log(`[Supabase PostgreSQL] Synchronized ${merged.length} products with live database.`);
      return merged;
    } else if (prioritizedLocal.length > 0) {
      await syncCatalogToPostgres(prioritizedLocal);
      console.log(`[Supabase PostgreSQL] Seeded ${prioritizedLocal.length} products into live database.`);
    }
  } catch {
    disablePostgresPool();
  }

  return prioritizedLocal;
}

/**
 * Syncs a list of products into Supabase PostgreSQL using safe deduplicated batched upserts
 */
export async function syncCatalogToPostgres(products: GmcProduct[]): Promise<void> {
  const pool = getPostgresPool();
  if (!pool) return;

  try {
    if (products.length === 0) {
      return;
    }

    // Deduplicate by lowercase SKU within the batch so ON CONFLICT never hits the same row twice
    const uniqueMap = new Map<string, GmcProduct>();
    for (const p of products) {
      const key = String(p.id || '').trim().toLowerCase();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    }
    const dedupedProducts = Array.from(uniqueMap.values());

    const chunkSize = 80;
    for (let i = 0; i < dedupedProducts.length; i += chunkSize) {
      const chunk = dedupedProducts.slice(i, i + chunkSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      chunk.forEach((p, idx) => {
        const numPrice = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0;
        const numSale = p.sale_price
          ? parseFloat(String(p.sale_price).replace(/[^0-9.]/g, '')) || null
          : null;
        const numCost = p.wholesale_price ? Number(p.wholesale_price) : Number((numPrice * 0.4).toFixed(2));
        const sku = String(p.id || '').trim().slice(0, 240);
        const title = String(p.title || 'Product').trim().slice(0, 240);
        const cjPid = p.cj_pid ? String(p.cj_pid).trim().slice(0, 240) : null;
        const seoTitle = p.seo_title ? String(p.seo_title).trim() : null;
        const seoDesc = p.seo_description ? String(p.seo_description).trim() : null;
        const modelType = p.productType === 'affiliate' ? 'affiliate' : 'dropshipping';
        const affiliateUrl = p.affiliateUrl || p.affiliate_url || null;

        const base = idx * 16;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`
        );
        values.push(
          sku,
          cjPid,
          title,
          String(p.description || title),
          slugify(title, sku),
          String(p.brand || 'AeroThor').slice(0, 120),
          numCost,
          numPrice,
          numSale,
          p.availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
          String(p.image_link || ''),
          String(p.mpn || sku).slice(0, 60),
          modelType,
          seoTitle,
          seoDesc,
          affiliateUrl
        );
      });

      await pool.query(
        `INSERT INTO products (
          sku, cj_pid, title, description, slug, brand, cost_price, price, sale_price, availability, main_image_url, mpn, product_type, seo_title, seo_description, affiliate_url
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (sku) DO UPDATE SET
          cj_pid = COALESCE(EXCLUDED.cj_pid, products.cj_pid),
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          slug = EXCLUDED.slug,
          brand = EXCLUDED.brand,
          cost_price = EXCLUDED.cost_price,
          price = EXCLUDED.price,
          sale_price = EXCLUDED.sale_price,
          availability = EXCLUDED.availability,
          main_image_url = EXCLUDED.main_image_url,
          mpn = EXCLUDED.mpn,
          product_type = EXCLUDED.product_type,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          affiliate_url = EXCLUDED.affiliate_url,
          updated_at = NOW()`,
        values
      );
    }
  } catch {
    disablePostgresPool();
  }
}

export async function deleteSkusFromPostgres(skus: string[]): Promise<void> {
  const pool = getPostgresPool();
  if (!pool || skus.length === 0) return;

  try {
    const lowerSkus = skus.map((s) => s.trim().toLowerCase());
    await pool.query('DELETE FROM products WHERE LOWER(sku) = ANY($1)', [lowerSkus]);
  } catch {
    disablePostgresPool();
  }
}

function savePersistedCatalogToDiskOnly(products: GmcProduct[]): void {
  const payload: PersistedDatabaseState = {
    updatedAt: new Date().toISOString(),
    products,
  };
  const serialized = JSON.stringify(payload, null, 2);

  try {
    if (!fs.existsSync(RUNTIME_DATA_DIR)) {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, DB_FILE_PATH);
  } catch (err) {
    try {
      const fallbackDir = path.join(os.tmpdir(), 'aerothor-data');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      fs.writeFileSync(path.join(fallbackDir, 'catalog-db.json'), serialized, 'utf-8');
    } catch (fallbackErr) {
      console.warn('[Storage] Disk write skipped (read-only environment):', (fallbackErr as Error).message);
    }
  }
}

export function loadPersistedCatalog(): GmcProduct[] {
  try {
    const candidatePaths = [
      DB_FILE_PATH,
      BUNDLED_DB_FILE_PATH,
      path.join(os.tmpdir(), 'aerothor-data', 'catalog-db.json'),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf-8');
        const parsed: any = JSON.parse(raw);
        const list: GmcProduct[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.products)
          ? parsed.products
          : [];
        if (list.length > 0) {
          return prioritizeRealProductsFirst(list);
        }
      }
    }

    savePersistedCatalogToDiskOnly(INITIAL_PRODUCTS);
    return [...INITIAL_PRODUCTS];
  } catch (err) {
    console.warn('[Storage] Failed to read catalog-db.json, falling back to INITIAL_PRODUCTS:', err);
    return [...INITIAL_PRODUCTS];
  }
}

/**
 * Atomically writes the current catalog to disk AND syncs asynchronously to Supabase PostgreSQL.
 */
export function savePersistedCatalog(products: GmcProduct[], changedSubset?: GmcProduct[]): void {
  const ordered = prioritizeRealProductsFirst(products);
  savePersistedCatalogToDiskOnly(ordered);
  const toSync = changedSubset && changedSubset.length > 0 ? changedSubset : ordered;
  syncCatalogToPostgres(toSync).catch(() => disablePostgresPool());
}

/**
 * Mirrors Prisma's `createMany({ data, skipDuplicates: true })` behavior on both disk and Supabase PostgreSQL.
 * Places real CJ / custom products at the top of the catalog.
 */
export function createManySkipDuplicates(
  currentCatalog: GmcProduct[],
  incomingProducts: GmcProduct[]
): { insertedCount: number; skippedDuplicatesCount: number; catalog: GmcProduct[] } {
  const existingIds = new Set(currentCatalog.map((p) => p.id.toLowerCase()));
  const newUniqueProducts: GmcProduct[] = [];
  let skippedDuplicatesCount = 0;

  for (const item of incomingProducts) {
    const normalizedId = String(item.id || '').trim().toLowerCase();
    if (!normalizedId) continue;
    if (existingIds.has(normalizedId)) {
      skippedDuplicatesCount++;
      continue;
    }
    existingIds.add(normalizedId);
    newUniqueProducts.push(item);
  }

  const updatedCatalog = prioritizeRealProductsFirst([...newUniqueProducts, ...currentCatalog]);
  savePersistedCatalogToDiskOnly(updatedCatalog);

  if (newUniqueProducts.length > 0) {
    syncCatalogToPostgres(newUniqueProducts).catch(() => disablePostgresPool());
  }

  return {
    insertedCount: newUniqueProducts.length,
    skippedDuplicatesCount,
    catalog: updatedCatalog,
  };
}

/**
 * PHASE 2: Bulk Delete / Purge the messy catalog from both Disk and PostgreSQL
 */
export async function purgeCatalogFromStorage(keepCoreSeed = false): Promise<GmcProduct[]> {
  const nextCatalog = keepCoreSeed ? prioritizeRealProductsFirst([...INITIAL_PRODUCTS]) : [];
  savePersistedCatalogToDiskOnly(nextCatalog);

  const pool = getPostgresPool();
  if (pool) {
    try {
      await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
      if (keepCoreSeed && nextCatalog.length > 0) {
        await syncCatalogToPostgres(nextCatalog);
      }
    } catch {
      disablePostgresPool();
    }
  }

  return nextCatalog;
}

/**
 * PHASE 2: Deduplicate & Group 1,656+ duplicate variant rows into Parent Products with `variants` arrays
 */
export async function deduplicateAndGroupCatalogVariants(
  currentCatalog: GmcProduct[]
): Promise<{
  catalog: GmcProduct[];
  beforeCount: number;
  afterCount: number;
  duplicatesMergedCount: number;
  syntheticRemovedCount: number;
}> {
  const beforeCount = currentCatalog.length;

  // Strip synthetic CJ-HOME-00001 / CJ-TECH-00002 filler rows if real products exist
  const nonSynthetic = currentCatalog.filter((p) => !isSyntheticBatchProduct(p));
  const baseList = nonSynthetic.length > 0 ? nonSynthetic : currentCatalog;
  const syntheticRemovedCount = beforeCount - baseList.length;

  const { groupedProducts, duplicatesMergedCount } =
    groupDuplicateVariantsIntoParentProducts(baseList);

  const prioritized = prioritizeRealProductsFirst(groupedProducts);
  savePersistedCatalogToDiskOnly(prioritized);

  const pool = getPostgresPool();
  if (pool) {
    try {
      await pool.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
      await syncCatalogToPostgres(prioritized);
    } catch {
      disablePostgresPool();
    }
  }

  return {
    catalog: prioritized,
    beforeCount,
    afterCount: prioritized.length,
    duplicatesMergedCount: duplicatesMergedCount + syntheticRemovedCount,
    syntheticRemovedCount,
  };
}

// ---------------------------------------------------------------------------
// REAL ORDERS PERSISTENCE (Disk + Supabase PostgreSQL `orders` table)
// ---------------------------------------------------------------------------

const INITIAL_SEED_ORDERS: PersistedOrder[] = [];

export function normalizeOrderRecord(raw: any): PersistedOrder {
  const id = String(raw.orderNumber || raw.id || `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`).trim();
  const tracking = String(raw.trackingCode ?? raw.trackingNumber ?? '').trim();
  const validStatuses: OrderFulfillmentStatus[] = [
    'Paid - Ready for CJ Fulfill',
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
  ];
  let resolvedStatus: OrderFulfillmentStatus = 'Paid - Ready for CJ Fulfill';
  if (validStatuses.includes(raw.status)) {
    resolvedStatus = raw.status;
  } else if (raw.cjOrderStatus === 'fulfilled') {
    resolvedStatus = 'Delivered';
  } else if (raw.cjOrderStatus === 'submitted_to_cj' && tracking) {
    resolvedStatus = 'Shipped';
  } else if (raw.cjOrderStatus === 'awaiting_fulfillment') {
    resolvedStatus = 'Paid - Ready for CJ Fulfill';
  }

  const purchasedSkus: string[] = Array.isArray(raw.purchasedSkus)
    ? raw.purchasedSkus
    : Array.isArray(raw.items)
    ? raw.items.map((it: any) => String(it.sku || it.id || '').trim()).filter(Boolean)
    : [];

  return {
    ...raw,
    id,
    orderNumber: id,
    trackingCode: tracking,
    trackingNumber: tracking,
    status: resolvedStatus,
    purchasedSkus,
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  };
}

export function loadPersistedOrders(): PersistedOrder[] {
  try {
    const candidatePaths = [
      ORDERS_FILE_PATH,
      BUNDLED_ORDERS_FILE_PATH,
      path.join(os.tmpdir(), 'aerothor-data', 'orders-db.json'),
    ];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeOrderRecord);
        }
      }
    }
  } catch (err) {
    console.warn('[Orders Storage] Failed to read orders-db.json:', err);
  }
  return INITIAL_SEED_ORDERS.map(normalizeOrderRecord);
}

function saveOrdersToDisk(orders: PersistedOrder[]): void {
  const serialized = JSON.stringify(orders, null, 2);
  try {
    if (!fs.existsSync(RUNTIME_DATA_DIR)) {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    }
    const tempFile = `${ORDERS_FILE_PATH}.tmp`;
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, ORDERS_FILE_PATH);
  } catch (err) {
    try {
      const fallbackDir = path.join(os.tmpdir(), 'aerothor-data');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      fs.writeFileSync(path.join(fallbackDir, 'orders-db.json'), serialized, 'utf-8');
    } catch (fallbackErr) {
      console.warn('[Orders Storage] Disk write skipped (read-only environment):', (fallbackErr as Error).message);
    }
  }
}

export async function savePersistedOrder(order: PersistedOrder): Promise<PersistedOrder[]> {
  const normalized = normalizeOrderRecord(order);
  const existing = loadPersistedOrders();
  const nextOrders = [
    normalized,
    ...existing.filter(
      (o) =>
        o.id.toLowerCase() !== normalized.id.toLowerCase() &&
        (o.orderNumber || '').toLowerCase() !== (normalized.orderNumber || '').toLowerCase()
    ),
  ];
  saveOrdersToDisk(nextOrders);

  const pool = getPostgresPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO orders (
          stripe_session_id, customer_email, customer_name, shipping_country, total_amount, currency, payment_status, items_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (stripe_session_id) DO UPDATE SET
          payment_status = EXCLUDED.payment_status,
          items_json = EXCLUDED.items_json,
          updated_at = NOW()`,
        [
          normalized.stripeSessionId || normalized.id,
          normalized.customerEmail,
          normalized.customerName,
          (normalized.shippingCountry || 'US').slice(0, 2),
          normalized.totalAmount,
          (normalized.currency || 'USD').toUpperCase().slice(0, 3),
          normalized.paymentStatus,
          JSON.stringify(normalized),
        ]
      );
    } catch {
      disablePostgresPool();
    }
  }

  return nextOrders;
}

export async function initOrdersFromPostgres(): Promise<PersistedOrder[]> {
  const localOrders = loadPersistedOrders();
  const pool = getPostgresPool();
  if (!pool) return localOrders;

  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 200');
    const dbOrders: PersistedOrder[] = [];

    for (const row of rows) {
      const data = row.items_json;
      if (data && typeof data === 'object' && !Array.isArray(data) && data.id) {
        dbOrders.push(data as PersistedOrder);
      } else if (Array.isArray(data)) {
        dbOrders.push({
          id: `ORD-${String(row.id).slice(0, 8).toUpperCase()}`,
          stripeSessionId: row.stripe_session_id,
          cjOrderStatus: 'awaiting_fulfillment',
          customerName: row.customer_name || 'Verified Customer',
          customerEmail: row.customer_email || 'customer@example.com',
          customerPhone: '+1 (555) 019-2834',
          shippingAddress: 'Domestic Fulfillment Address',
          shippingCity: 'Wilmington',
          shippingState: 'DE',
          shippingZip: '19801',
          shippingCountry: row.shipping_country || 'US',
          shippingMethod: 'free',
          paymentMethod: 'card',
          totalAmount: Number(row.total_amount) || 0,
          currency: row.currency || 'USD',
          paymentStatus: row.payment_status === 'paid' ? 'paid' : 'pending',
          trackingNumber: `USPS-${String(row.id).slice(0, 10).toUpperCase()}`,
          carrier: 'USPS Priority Mail',
          estimatedDelivery: '3 to 5 Business Days',
          items: data,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        });
      }
    }

    const map = new Map<string, PersistedOrder>();
    for (const o of [...localOrders, ...dbOrders]) {
      if (!map.has(o.id)) {
        map.set(o.id, o);
      }
    }
    const merged = Array.from(map.values());
    saveOrdersToDisk(merged);
    return merged;
  } catch {
    disablePostgresPool();
    return localOrders;
  }
}
