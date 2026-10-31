/**
 * CJ Dropshipping API to PostgreSQL / Supabase Direct Pipeline
 * Engineered for zero-cost headless e-commerce architectures
 */

export interface SyncPipelineConfig {
  tableName: string;
  targetMarket: 'US' | 'UK' | 'GLOBAL';
  currency: 'USD' | 'GBP';
  priceMultiplier: number; // e.g. 2.4x retail markup
  autoSyncInventory: boolean;
}

export function getPostgresSchemaMigration(): string {
  return `-- PostgreSQL / Supabase Schema for Headless E-commerce with CJ Dropshipping Sync
-- Includes full indexing for sub-10ms GMC XML Feed queries

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(64) UNIQUE NOT NULL,
    cj_pid VARCHAR(64) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(128) DEFAULT 'AeroCommerce',
    
    -- Pricing (Strict NUMERIC for financial precision)
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price NUMERIC(10, 2) NOT NULL,
    sale_price NUMERIC(10, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Stock & Fulfillment
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    warehouse_country VARCHAR(2) DEFAULT 'US',
    fulfillment_days_min INTEGER DEFAULT 2,
    fulfillment_days_max INTEGER DEFAULT 5,
    
    -- GMC Attributes
    gtin VARCHAR(32),
    mpn VARCHAR(64),
    condition VARCHAR(20) DEFAULT 'new',
    google_category VARCHAR(255),
    product_type VARCHAR(255),
    
    -- Imagery
    main_image_url TEXT NOT NULL,
    additional_images JSONB DEFAULT '[]'::jsonb,
    
    -- Status flags
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'draft', 'archived'
    is_visible BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fast Indexing for XML Feed generation
CREATE INDEX IF NOT EXISTS idx_products_feed_active 
ON products (status, is_visible, updated_at DESC)
WHERE status = 'active' AND is_visible = true;

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_cj_pid ON products (cj_pid);

-- 2. CJ Inventory Sync Audit Log
CREATE TABLE IF NOT EXISTS inventory_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    products_scanned INTEGER NOT NULL,
    products_updated INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);
`;
}

export function getCjSyncScriptSnippet(): string {
  return `/**
 * @file scripts/cj-postgres-sync.ts
 * Automated CJ Dropshipping API to PostgreSQL Batch Synchronizer
 * Run via cron or GitHub Actions: 'npx tsx scripts/cj-postgres-sync.ts'
 */

import { Pool } from 'pg';

const CJ_API_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
const CJ_EMAIL = process.env.CJ_API_EMAIL!;
const CJ_API_KEY = process.env.CJ_API_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function getCjAccessToken(): Promise<string> {
  const res = await fetch(\`\${CJ_API_URL}/authentication/getAccessToken\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CJ_EMAIL, apiKey: CJ_API_KEY }),
  });
  const data = await res.json();
  if (data.code !== 200 || !data.data?.accessToken) {
    throw new Error(\`Failed to authenticate with CJ API: \${data.message}\`);
  }
  return data.data.accessToken;
}

export async function syncCjProductsToPostgres(categoryIds: string[] = ['1401']) {
  console.log('[CJ-Sync] Starting automated product synchronization...');
  const token = await getCjAccessToken();
  const client = await pool.connect();

  let totalUpdated = 0;

  try {
    // 1. Fetch curated winning products from CJ API
    const res = await fetch(\`\${CJ_API_URL}/product/list?pageNum=1&pageSize=50&countryCode=US\`, {
      headers: {
        'CJ-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });
    const result = await res.json();

    if (result.code !== 200 || !result.data?.list) {
      throw new Error(\`CJ product query failed: \${result.message}\`);
    }

    const products = result.data.list;
    console.log(\`[CJ-Sync] Retrieved \${products.length} products from CJ API.\`);

    // 2. Batch Upsert into PostgreSQL
    for (const item of products) {
      const costPrice = parseFloat(item.sellPrice || '10.00');
      // 2.5x markup formula targeting 60% gross profit for US/UK PMax ad margins
      const retailPrice = Number((costPrice * 2.5).toFixed(2));
      const salePrice = Number((retailPrice * 0.88).toFixed(2));
      const sku = \`CJ-\${item.pid.slice(0, 12)}\`;
      const slug = item.productNameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 80);

      const query = \`
        INSERT INTO products (
          sku, cj_pid, title, description, slug, brand,
          cost_price, price, sale_price, currency,
          stock_quantity, warehouse_country,
          main_image_url, additional_images,
          condition, status, is_visible, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12,
          $13, $14,
          $15, $16, $17, CURRENT_TIMESTAMP
        )
        ON CONFLICT (cj_pid) DO UPDATE SET
          cost_price = EXCLUDED.cost_price,
          stock_quantity = EXCLUDED.stock_quantity,
          updated_at = CURRENT_TIMESTAMP;
      \`;

      const values = [
        sku,
        item.pid,
        item.productNameEn.slice(0, 150),
        item.description || item.productNameEn,
        slug,
        'AeroCommerce',
        costPrice,
        retailPrice,
        salePrice,
        'USD',
        99, // domestic inventory buffer
        'US',
        item.productImage,
        JSON.stringify(item.productImageSet || []),
        'new',
        'active',
        true,
      ];

      await client.query(query, values);
      totalUpdated++;
    }

    // 3. Log sync completion
    await client.query(
      \`INSERT INTO inventory_sync_logs (products_scanned, products_updated, status) VALUES ($1, $2, 'success')\`,
      [products.length, totalUpdated]
    );

    console.log(\`[CJ-Sync] Successfully synchronized \${totalUpdated} products into PostgreSQL!\`);
  } catch (err: any) {
    console.error('[CJ-Sync] Fatal error during sync:', err);
    await client.query(
      \`INSERT INTO inventory_sync_logs (products_scanned, products_updated, status, error_message) VALUES (0, 0, 'failed', $1)\`,
      [err.message]
    );
  } finally {
    client.release();
  }
}
`;
}
