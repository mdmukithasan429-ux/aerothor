import fs from 'fs';
import os from 'os';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { GmcProduct } from '../lib/gmc-feed';
import { INITIAL_PRODUCTS } from './seed-data';

dotenv.config({ path: '.env.local' });
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

export interface PersistedOrder {
  id: string;
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
}

let pgPool: pg.Pool | null = null;

function getPostgresPool(): pg.Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('db.supabase.co:5432/postgres?pgbouncer=true') || dbUrl.includes('[YOUR-PASSWORD]')) {
    return null;
  }
  if (!pgPool) {
    pgPool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 8000,
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

    if (isSyntheticBatchProduct(p)) {
      syntheticBatch.push(p);
    } else if (
      p.source === 'cj_live' ||
      Boolean(p.cj_pid) ||
      key.startsWith('cj-')
    ) {
      realCjProducts.push(p);
    } else {
      customAndSeedProducts.push(p);
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
        status VARCHAR(20) DEFAULT 'active',
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_key;

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
        customer_email VARCHAR(255),
        customer_name VARCHAR(255),
        shipping_country VARCHAR(2) DEFAULT 'US',
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
        link: `${process.env.APP_URL || 'https://my-store.com'}/product/${row.sku}`,
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
        cj_pid: row.cj_pid || undefined,
        wholesale_price: row.cost_price ? Number(row.cost_price) : undefined,
        source: row.cj_pid ? 'cj_live' : undefined,
      }));

      // Merge local disk products (e.g. recently synced CJ items) with DB products so nothing is lost
      const merged = prioritizeRealProductsFirst([...prioritizedLocal, ...dbProducts]);
      savePersistedCatalogToDiskOnly(merged);

      // If local had items not yet in Postgres, push them up
      if (merged.length > dbProducts.length) {
        syncCatalogToPostgres(merged).catch((e) => console.warn('[Postgres Merge Sync]:', e.message));
      }

      console.log(`[Supabase PostgreSQL] Synchronized ${merged.length} products with live database.`);
      return merged;
    } else if (prioritizedLocal.length > 0) {
      await syncCatalogToPostgres(prioritizedLocal);
      console.log(`[Supabase PostgreSQL] Seeded ${prioritizedLocal.length} products into live database.`);
    }
  } catch (err: any) {
    console.warn('[Supabase PostgreSQL Init Warning]:', err.message);
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
        const base = idx * 13;
        const numPrice = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0;
        const numSale = p.sale_price
          ? parseFloat(String(p.sale_price).replace(/[^0-9.]/g, '')) || null
          : null;
        const numCost = p.wholesale_price ? Number(p.wholesale_price) : Number((numPrice * 0.4).toFixed(2));
        const sku = String(p.id || '').trim().slice(0, 240);
        const title = String(p.title || 'Product').trim().slice(0, 240);
        const cjPid = p.cj_pid ? String(p.cj_pid).trim().slice(0, 240) : null;

        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`
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
          String(p.product_type || 'Home & Lifestyle').slice(0, 240)
        );
      });

      await pool.query(
        `INSERT INTO products (
          sku, cj_pid, title, description, slug, brand, cost_price, price, sale_price, availability, main_image_url, mpn, product_type
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
          updated_at = NOW()`,
        values
      );
    }
  } catch (err: any) {
    console.warn('[Supabase Sync Warning]:', err.message);
  }
}

export async function deleteSkusFromPostgres(skus: string[]): Promise<void> {
  const pool = getPostgresPool();
  if (!pool || skus.length === 0) return;

  try {
    const lowerSkus = skus.map((s) => s.trim().toLowerCase());
    await pool.query('DELETE FROM products WHERE LOWER(sku) = ANY($1)', [lowerSkus]);
  } catch (err: any) {
    console.warn('[Supabase Delete Warning]:', err.message);
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
        const parsed = JSON.parse(raw) as PersistedDatabaseState;
        if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
          return prioritizeRealProductsFirst(parsed.products);
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
  syncCatalogToPostgres(toSync).catch((err) =>
    console.warn('[Background Postgres Sync Error]:', err.message)
  );
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
    syncCatalogToPostgres(newUniqueProducts).catch((err) =>
      console.warn('[Background Postgres Bulk Insert Error]:', err.message)
    );
  }

  return {
    insertedCount: newUniqueProducts.length,
    skippedDuplicatesCount,
    catalog: updatedCatalog,
  };
}

// ---------------------------------------------------------------------------
// REAL ORDERS PERSISTENCE (Disk + Supabase PostgreSQL `orders` table)
// ---------------------------------------------------------------------------

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
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[Orders Storage] Failed to read orders-db.json:', err);
  }
  return [];
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
  const existing = loadPersistedOrders();
  const nextOrders = [order, ...existing.filter((o) => o.id !== order.id)];
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
          order.stripeSessionId || order.id,
          order.customerEmail,
          order.customerName,
          (order.shippingCountry || 'US').slice(0, 2),
          order.totalAmount,
          (order.currency || 'USD').toUpperCase().slice(0, 3),
          order.paymentStatus,
          JSON.stringify(order),
        ]
      );
    } catch (err: any) {
      console.warn('[Supabase Order Save Warning]:', err.message);
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
  } catch (err: any) {
    console.warn('[Supabase Orders Load Warning]:', err.message);
    return localOrders;
  }
}
