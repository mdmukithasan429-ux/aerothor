import Papa from 'papaparse';
import { GmcProduct, validateGmcProduct, CANONICAL_STORE_URL } from './gmc-feed';

export interface HeaderValidationResult {
  isValid: boolean;
  missingHeaders: string[];
  detectedHeaders: string[];
  matchedAliases: Record<string, string>;
}

export interface CsvParseResult {
  validProducts: GmcProduct[];
  errors: { row: number; field: string; message: string }[];
  totalRows: number;
  headerValidation: HeaderValidationResult;
}

// Canonical required fields and recognized dropshipper CSV synonyms
const REQUIRED_HEADER_SYNONYMS: Record<string, string[]> = {
  id: ['id', 'sku', 'product_id', 'item_id', 'variant_sku', 'variant_id', 'code'],
  title: ['title', 'name', 'product_title', 'product_name', 'item_title'],
  price: ['price', 'retail_price', 'sale_price', 'unit_price', 'cost'],
  availability: ['availability', 'stock_status', 'stock', 'inventory_status', 'quantity', 'stock_quantity'],
};

/**
 * Pre-ingestion validation: Verifies presence of essential product identifiers
 * before processing dropshipping supplier files.
 */
export function validateCsvHeaders(csvContent: string): HeaderValidationResult {
  if (!csvContent || !csvContent.trim()) {
    return {
      isValid: false,
      missingHeaders: Object.keys(REQUIRED_HEADER_SYNONYMS),
      detectedHeaders: [],
      matchedAliases: {},
    };
  }

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      isValid: false,
      missingHeaders: Object.keys(REQUIRED_HEADER_SYNONYMS),
      detectedHeaders: [],
      matchedAliases: {},
    };
  }

  // Parse only header line with PapaParse to prevent edge-case splitting
  const parsed = Papa.parse<string[]>(lines[0], {
    skipEmptyLines: true,
  });

  const rawHeaders = (parsed.data[0] || []).map((h) =>
    h.trim().toLowerCase().replace(/[\s_-]+/g, '_')
  );

  const missingHeaders: string[] = [];
  const matchedAliases: Record<string, string> = {};

  for (const [canonical, aliases] of Object.entries(REQUIRED_HEADER_SYNONYMS)) {
    const matched = rawHeaders.find((h) => aliases.includes(h));
    if (matched) {
      matchedAliases[canonical] = matched;
    } else {
      missingHeaders.push(canonical);
    }
  }

  return {
    isValid: missingHeaders.length === 0,
    missingHeaders,
    detectedHeaders: rawHeaders,
    matchedAliases,
  };
}

/**
 * Parses raw CSV string using PapaParse with pre-ingestion header validation
 */
export function parseProductCsv(csvContent: string): CsvParseResult {
  const headerValidation = validateCsvHeaders(csvContent);

  if (!headerValidation.isValid) {
    return {
      validProducts: [],
      errors: [
        {
          row: 1,
          field: 'headers',
          message: `Missing required header(s): ${headerValidation.missingHeaders.join(', ')}. Detected headers: [${headerValidation.detectedHeaders.join(', ')}]`,
        },
      ],
      totalRows: 0,
      headerValidation,
    };
  }

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/[\s_-]+/g, '_'),
  });

  const validProducts: GmcProduct[] = [];
  const errors: { row: number; field: string; message: string }[] = [];

  parsed.data.forEach((row, idx) => {
    const rowNum = idx + 2;
    const id = (
      row['sku'] ||
      row['id'] ||
      row['product_id'] ||
      row['variant_sku'] ||
      row['code'] ||
      ''
    ).trim();

    const title = (
      row['title'] ||
      row['name'] ||
      row['product_title'] ||
      row['product_name'] ||
      ''
    ).trim();

    const description = (
      row['description'] ||
      row['desc'] ||
      row['body'] ||
      title
    ).trim();

    const link = (
      row['link'] ||
      row['url'] ||
      row['canonical_url'] ||
      `${CANONICAL_STORE_URL}/product/${encodeURIComponent(id)}`
    ).trim();

    const image_link = (
      row['image_url'] ||
      row['image_link'] ||
      row['image'] ||
      row['main_image'] ||
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
    ).trim();

    let additional_image_link: string[] | undefined = undefined;
    const addImgRaw = row['additional_image_link'] || row['additional_images'] || row['extra_images'];
    if (addImgRaw) {
      additional_image_link = addImgRaw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    }

    let price = (row['price'] || row['retail_price'] || row['unit_price'] || '').trim();
    if (price && !/\s+[A-Z]{3}$/.test(price)) {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      price = Number.isFinite(numericPrice) ? `${numericPrice.toFixed(2)} USD` : `${price} USD`;
    }

    let sale_price = (row['sale_price'] || row['discount_price'] || '').trim();
    if (sale_price && !/\s+[A-Z]{3}$/.test(sale_price)) {
      const numericSale = parseFloat(sale_price.replace(/[^0-9.]/g, ''));
      sale_price = Number.isFinite(numericSale) ? `${numericSale.toFixed(2)} USD` : `${sale_price} USD`;
    }

    const availabilityRaw = (
      row['availability'] ||
      row['stock_status'] ||
      row['stock'] ||
      row['quantity'] ||
      row['stock_quantity'] ||
      'in_stock'
    ).trim().toLowerCase();

    const availability: GmcProduct['availability'] =
      availabilityRaw === 'out_of_stock' ||
      availabilityRaw === 'outofstock' ||
      availabilityRaw === 'false' ||
      availabilityRaw === '0'
        ? 'out_of_stock'
        : availabilityRaw === 'preorder'
        ? 'preorder'
        : 'in_stock';

    const brand = (row['brand'] || row['vendor'] || 'AeroThor').trim();
    const gtin = (row['gtin'] || row['upc'] || row['ean'] || row['barcode'] || '').trim() || undefined;
    const mpn = (row['mpn'] || row['part_number'] || id).trim() || undefined;
    const condition = (row['condition'] || 'new').trim().toLowerCase() as GmcProduct['condition'];
    const affiliateUrl = (row['affiliate_url'] || row['affiliate_link'] || '').trim() || undefined;
    const rawType = (row['type'] || row['fulfillment_type'] || '').trim().toLowerCase();
    const productType: 'dropshipping' | 'affiliate' =
      rawType === 'affiliate' || Boolean(affiliateUrl) || id.toLowerCase().startsWith('aff-')
        ? 'affiliate'
        : 'dropshipping';

    const product: GmcProduct = {
      id,
      title,
      description,
      link,
      image_link,
      additional_image_link,
      price,
      sale_price: sale_price || undefined,
      availability,
      brand,
      gtin,
      mpn,
      condition: condition === 'refurbished' || condition === 'used' ? condition : 'new',
      identifier_exists: Boolean(gtin || mpn),
      google_product_category: (row['google_product_category'] || row['google_category'] || '').trim() || undefined,
      product_type: (row['product_type'] || row['category'] || 'General Merchandise').trim() || undefined,
      productType,
      affiliateUrl,
      source: 'manual',
    };

    const validationErrors = validateGmcProduct(product);
    if (validationErrors.length > 0) {
      validationErrors.forEach((e) => {
        errors.push({ row: rowNum, field: e.field, message: e.message });
      });
    }

    if (id && title && price) {
      validProducts.push(product);
    }
  });

  return {
    validProducts,
    errors,
    totalRows: parsed.data.length,
    headerValidation,
  };
}

/**
 * Exact Prisma Schema Model for PostgreSQL / Supabase
 * Matching Google Merchant Center Requirements
 */
export function getPrismaSchemaSnippet(): string {
  return `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Availability {
  in_stock
  out_of_stock
  preorder
  backorder
}

enum Condition {
  new
  refurbished
  used
}

model Product {
  id                  String       @id @default(uuid()) @db.Uuid
  sku                 String       @unique @db.VarChar(64)
  title               String       @db.VarChar(150)
  description         String       @db.Text
  slug                String       @unique @db.VarChar(255)
  brand               String       @default("Store Exclusive") @db.VarChar(128)
  
  // Pricing & Currency (GMC strict numeric standard)
  costPrice           Decimal      @default(0.00) @map("cost_price") @db.Decimal(10, 2)
  price               Decimal      @db.Decimal(10, 2)
  salePrice           Decimal?     @map("sale_price") @db.Decimal(10, 2)
  currency            String       @default("USD") @db.VarChar(3)
  
  // Inventory & Fulfillment
  stockQuantity       Int          @default(0) @map("stock_quantity")
  availability        Availability @default(in_stock)
  condition           Condition    @default(new)
  
  // GMC Identifiers (GS1 GTIN / Manufacturer Part Number)
  gtin                String?      @db.VarChar(32)
  mpn                 String?      @db.VarChar(64)
  identifierExists    Boolean      @default(true) @map("identifier_exists")
  
  // Categorization
  googleCategory      String?      @map("google_category") @db.VarChar(255)
  productType         String?      @map("product_type") @db.VarChar(255)
  
  // Media Links (Canonical HTTPS URLs)
  mainImageUrl        String       @map("main_image_url") @db.Text
  additionalImages    Json         @default("[]") @map("additional_images")
  
  // Status flags
  status              String       @default("active") @db.VarChar(20)
  isVisible           Boolean      @default(true) @map("is_visible")
  
  createdAt           DateTime     @default(now()) @map("created_at")
  updatedAt           DateTime     @updatedAt @map("updated_at")

  @@index([status, isVisible, updatedAt(sort: Desc)], name: "idx_products_gmc_feed")
  @@map("products")
}
`;
}

/**
 * Next.js App Router API Route using PapaParse + Prisma Client
 * Validates required headers before ingestion and batch upserts to PostgreSQL
 */
export function getNextJsPrismaUploadRouteSnippet(): string {
  return `/**
 * @file app/api/products/upload-csv/route.ts
 * Next.js App Router API Route with PapaParse & Prisma ORM
 * Features pre-ingestion header validation and atomic batch upserts
 */

import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const REQUIRED_HEADER_SYNONYMS: Record<string, string[]> = {
  id: ['id', 'sku', 'product_id', 'item_id', 'variant_sku', 'code'],
  title: ['title', 'name', 'product_title', 'product_name'],
  price: ['price', 'retail_price', 'unit_price', 'cost'],
  availability: ['availability', 'stock_status', 'stock', 'quantity', 'stock_quantity'],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No CSV file provided in FormData ("file")' }, { status: 400 });
    }

    const csvContent = await file.text();

    // 1. Pre-Ingestion Validation: Check Required CSV Headers
    const firstLine = csvContent.split(/\\r?\\n/).find((l) => l.trim().length > 0) || '';
    const headerParse = Papa.parse<string[]>(firstLine, { skipEmptyLines: true });
    const rawHeaders = (headerParse.data[0] || []).map((h) =>
      h.trim().toLowerCase().replace(/[\\s_-]+/g, '_')
    );

    const missingHeaders: string[] = [];
    for (const [canonical, aliases] of Object.entries(REQUIRED_HEADER_SYNONYMS)) {
      const hasMatch = rawHeaders.some((h) => aliases.includes(h));
      if (!hasMatch) {
        missingHeaders.push(canonical);
      }
    }

    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: 'Pre-ingestion header validation failed.',
          missingHeaders,
          detectedHeaders: rawHeaders,
          requiredCategories: ['id/sku', 'title/name', 'price', 'availability/stock'],
        },
        { status: 422 }
      );
    }

    // 2. Full PapaParse Processing
    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\\s_-]+/g, '_'),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'Malformed CSV format', details: parsed.errors }, { status: 400 });
    }

    // 3. Transform & Batch Ingest into PostgreSQL via Prisma Transaction
    const operations = parsed.data
      .map((row) => {
        const sku = (row['sku'] || row['id'] || row['product_id'] || '').trim();
        const title = (row['title'] || row['name'] || '').trim();
        if (!sku || !title) return null;

        const description = (row['description'] || row['desc'] || title).trim();
        const slug = (row['slug'] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)).trim();
        const brand = (row['brand'] || row['vendor'] || 'Store Exclusive').trim();

        const rawPrice = (row['price'] || '0').replace(/[^0-9.]/g, '');
        const price = parseFloat(rawPrice) || 0.00;

        const rawSale = (row['sale_price'] || '').replace(/[^0-9.]/g, '');
        const salePrice = rawSale ? parseFloat(rawSale) : null;

        const currency = (row['currency'] || 'USD').trim().toUpperCase();
        const stockQuantity = parseInt(row['stock_quantity'] || row['stock'] || row['quantity'] || '10', 10);
        
        const availRaw = (row['availability'] || row['stock_status'] || 'in_stock').toLowerCase();
        const availability =
          availRaw === 'out_of_stock' || availRaw === '0' || stockQuantity <= 0
            ? 'out_of_stock'
            : 'in_stock';

        const mainImageUrl = (row['image_url'] || row['image_link'] || row['image'] || '').trim();
        const gtin = (row['gtin'] || row['upc'] || row['ean'] || '').trim() || null;
        const mpn = (row['mpn'] || '').trim() || null;
        const googleCategory = (row['google_product_category'] || row['google_category'] || '').trim() || null;
        const productType = (row['product_type'] || row['category'] || '').trim() || null;

        return prisma.product.upsert({
          where: { sku },
          create: {
            sku,
            title: title.slice(0, 150),
            description,
            slug,
            brand,
            price,
            salePrice,
            currency,
            stockQuantity,
            availability,
            condition: 'new',
            mainImageUrl,
            gtin,
            mpn,
            identifierExists: Boolean(gtin || mpn),
            googleCategory,
            productType,
            status: 'active',
            isVisible: true,
          },
          update: {
            title: title.slice(0, 150),
            description,
            price,
            salePrice,
            stockQuantity,
            availability,
            mainImageUrl,
            gtin,
            mpn,
            updatedAt: new Date(),
          },
        });
      })
      .filter(Boolean);

    // Atomic transaction ensures zero partial-state writes
    const results = await prisma.$transaction(operations as any[]);

    return NextResponse.json({
      success: true,
      message: \`Successfully ingested \${results.length} products into PostgreSQL via Prisma.\`,
      totalRows: parsed.data.length,
      upsertedCount: results.length,
      validatedHeaders: rawHeaders,
    });
  } catch (error: any) {
    console.error('[Prisma CSV Ingestion Error]:', error);
    return NextResponse.json({ error: error.message || 'Database ingestion error' }, { status: 500 });
  }
}
`;
}

export const getNextJsCsvUploadRouteSnippet = getNextJsPrismaUploadRouteSnippet;
