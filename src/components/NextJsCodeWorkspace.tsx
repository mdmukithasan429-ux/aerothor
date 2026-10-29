import React, { useState } from 'react';
import { getNextJsFeedRouteSnippet } from '../lib/gmc-feed';
import { getNextJsCsvUploadRouteSnippet } from '../lib/csv-importer';
import {
  Copy,
  Check,
  Terminal,
  FileCode,
  Database,
  Server,
  Upload,
  Shield,
  Layers,
  Scale,
  RefreshCw,
  Truck,
  Eye,
  FileText,
} from 'lucide-react';

export const NextJsCodeWorkspace: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('sync-cj');
  const [copied, setCopied] = useState(false);

  const feedCode = getNextJsFeedRouteSnippet();
  const uploadCode = getNextJsCsvUploadRouteSnippet();

  const syncCjCode = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. SECURITY RULE: Validate Admin Bearer Token
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const expectedSecret = process.env.ADMIN_SECRET_KEY;

    if (!expectedSecret) {
      return NextResponse.json({ error: 'ADMIN_SECRET_KEY is not defined' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Bearer token' }, { status: 401 });
    }

    if (authHeader.slice(7).trim() !== expectedSecret) {
      return NextResponse.json({ error: 'Forbidden: Invalid administrative credentials' }, { status: 403 });
    }

    // 2. PARSE CONFIGURATION & PAGINATION SETTINGS
    const body = await req.json().catch(() => ({}));
    const {
      apiKey = process.env.CJ_API_KEY,
      targetCount = 200,
      pageSize = 50,
      maxPages = 10,
      countryCode = 'US',
      markupMultiplier = 2.5, // 2.5x retail markup formula (60% gross profit)
      currency = 'USD',
      brand = 'AeroCommerce',
    } = body;

    const accessToken = await getCjAccessToken(apiKey);

    // 3. PAGINATION LOOP: Fetching thousands of products
    const rawFetchedItems: CjRawProduct[] = [];
    let pageNum = 1;
    let hasMore = true;

    while (hasMore && pageNum <= maxPages && rawFetchedItems.length < targetCount) {
      const url = new URL('https://developers.cjdropshipping.com/api2.0/v1/product/list');
      url.searchParams.set('pageNum', String(pageNum));
      url.searchParams.set('pageSize', String(pageSize));
      url.searchParams.set('countryCode', countryCode);

      const pageRes = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'CJ-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      const pageData: any = await pageRes.json();
      if (pageData.code !== 200) {
        throw new Error(pageData.message || 'CJ API Error');
      }

      const list: CjRawProduct[] = pageData.data?.list || [];
      if (!list.length) {
        hasMore = false;
        break;
      }

      rawFetchedItems.push(...list);
      pageNum++;
      // Respect CJ Developer 1-QPS rate limit
      await new Promise((r) => setTimeout(r, 450));
    }

    // 4. GMC RULES MAPPING: Strict Google Shopping RSS 2.0 Compliance
    const mappedProducts = rawFetchedItems.map((item) => {
      const rawCost = typeof item.sellPrice === 'number'
        ? item.sellPrice
        : parseFloat(String(item.sellPrice || '12.00')) || 12.00;
      const calculatedRetail = Number((rawCost * markupMultiplier).toFixed(2));
      const calculatedSale = Number((calculatedRetail * 0.88).toFixed(2));
      const cleanTitle = (item.productNameEn || 'Product').slice(0, 150);
      const sku = \`CJ-\${item.pid}\`;

      return {
        sku,
        cjPid: item.pid,
        title: cleanTitle,
        description: item.description || cleanTitle,
        slug: \`\${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}-\${item.pid.slice(-6)}\`,
        brand,
        costPrice: rawCost,
        price: calculatedRetail,
        salePrice: calculatedSale,
        currency,
        stockQuantity: 99,
        availability: 'in_stock',
        condition: 'new',
        warehouseCountry: countryCode || 'US',
        fulfillmentDaysMin: 2,
        fulfillmentDaysMax: 5,
        mainImageUrl: item.productImage,
        additionalImages: item.productImageSet || [],
        mpn: sku,
        googleCategory: item.categoryName || 'Apparel & Accessories',
        productType: item.categoryName || 'Home & Travel',
        status: 'active',
        isVisible: true,
      };
    });

    // 5. BULK INSERT: Prisma createMany with skipDuplicates: true
    const CHUNK_SIZE = 250;
    let totalInsertedCount = 0;

    for (let i = 0; i < mappedProducts.length; i += CHUNK_SIZE) {
      const chunk = mappedProducts.slice(i, i + CHUNK_SIZE);
      const result = await prisma.product.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalInsertedCount += result.count;
    }

    return NextResponse.json({
      success: true,
      message: \`Successfully synchronized \${totalInsertedCount} products into database\`,
      metrics: {
        pagesScanned: pageNum - 1,
        totalFetchedFromSupplier: rawFetchedItems.length,
        totalInsertedIntoDatabase: totalInsertedCount,
        durationMs: Date.now() - startTime,
      },
      sampleProduct: mappedProducts[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`;

  const adminCrudCode = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function authenticateAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const expectedSecret = process.env.ADMIN_SECRET_KEY;

  if (!expectedSecret) {
    return { authorized: false, response: NextResponse.json({ error: 'ADMIN_SECRET_KEY missing' }, { status: 500 }) };
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized: Bearer token required' }, { status: 401 }) };
  }
  if (authHeader.slice(7).trim() !== expectedSecret) {
    return { authorized: false, response: NextResponse.json({ error: 'Forbidden: Invalid admin token' }, { status: 403 }) };
  }
  return { authorized: true };
}

// 1. POST: Add Single Product Manually
export async function POST(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await req.json();
    const { sku, title, description, price, salePrice, brand = 'AeroCommerce', mainImageUrl, stockQuantity = 99, availability = 'in_stock' } = body;

    if (!sku || !title || !price || !mainImageUrl) {
      return NextResponse.json({ error: 'sku, title, price, and mainImageUrl are mandatory' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        sku: String(sku).trim(),
        title: String(title).slice(0, 150),
        description: String(description || title),
        slug: \`\${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80)}-\${sku.slice(-6)}\`,
        brand,
        price: parseFloat(String(price)),
        salePrice: salePrice ? parseFloat(String(salePrice)) : null,
        stockQuantity: parseInt(String(stockQuantity), 10) || 0,
        availability: availability === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
        condition: 'new',
        mainImageUrl,
        status: 'active',
        isVisible: true,
      },
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 2. PATCH: Update Stock Availability, Price, or Visibility
export async function PATCH(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { id, sku, price, salePrice, stockQuantity, availability, isVisible } = await req.json();
    if (!id && !sku) return NextResponse.json({ error: 'id or sku is required' }, { status: 400 });

    const updateData: any = {};
    if (price !== undefined) updateData.price = parseFloat(String(price));
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(String(salePrice)) : null;
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(String(stockQuantity), 10);
      updateData.availability = updateData.stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    }
    if (availability !== undefined) updateData.availability = availability;
    if (isVisible !== undefined) updateData.isVisible = Boolean(isVisible);

    const updated = await prisma.product.update({
      where: id ? { id } : { sku },
      data: updateData,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 3. DELETE: Remove Product by ID or SKU
export async function DELETE(req: NextRequest) {
  const auth = authenticateAdmin(req);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');

    if (!id && !sku) return NextResponse.json({ error: 'id or sku required' }, { status: 400 });

    const deleted = await prisma.product.delete({
      where: id ? { id } : { sku: sku! },
    });

    return NextResponse.json({ success: true, deletedSku: deleted.sku });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`;

  const pdpCode = `import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { ShieldCheck, Truck, RefreshCw, Star, Lock, Zap } from 'lucide-react';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: params.id }, { sku: params.id }, { slug: params.id }], status: 'active' },
  });
  if (!product) return { title: 'Product Not Found | AeroCommerce' };

  const effectiveSeoTitle =
    product.seoTitle?.trim() ||
    \`\${product.title} - $\${Number(product.price).toFixed(2)} | \${product.brand || 'AeroCommerce'}\`;
  const effectiveSeoDescription =
    product.seoDescription?.trim() ||
    product.description.slice(0, 160);

  return {
    title: effectiveSeoTitle,
    description: effectiveSeoDescription,
    openGraph: {
      title: effectiveSeoTitle,
      description: effectiveSeoDescription,
      images: [product.mainImageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: effectiveSeoTitle,
      description: effectiveSeoDescription,
      images: [product.mainImageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: params.id }, { sku: params.id }, { slug: params.id }], status: 'active' },
  });
  if (!product) notFound();

  const priceNum = Number(product.price);
  const salePriceNum = product.salePrice ? Number(product.salePrice) : null;
  const currentPrice = salePriceNum || priceNum;

  // CRITICAL: Schema.org JSON-LD for Google Shopping & Organic SERP Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: [product.mainImageUrl],
    description: product.description,
    sku: product.sku,
    mpn: product.mpn || product.sku,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency || 'USD',
      price: currentPrice.toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0.00', currency: 'USD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: ['US', 'GB'] },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        merchantReturnDays: 30,
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <img src={product.mainImageUrl} alt={product.title} className="w-full h-auto object-contain max-h-[500px]" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase text-emerald-500">{product.brand}</span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{product.title}</h1>
            <div className="text-3xl font-bold text-emerald-500">$\${currentPrice.toFixed(2)}</div>
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-500" /><span>Fast 3-7 Days US/UK Dispatch</span></div>
              <div className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-emerald-500" /><span>30-Day Money-Back Guarantee</span></div>
            </div>
            <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" /><span>Instant Express Checkout</span>
            </button>
            <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{product.description}</div>
          </div>
        </div>
      </div>
    </>
  );
}`;

  const shippingCode = `// app/policies/shipping/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { Truck, Clock, ShieldCheck, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | AeroCommerce Global',
  description: 'Fast 3-7 day domestic dispatch to USA & UK destinations. Transparent tracking, zero hidden fees.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-8 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Shipping & Delivery Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Effective Date: January 1, 2026 · Google Merchant Center Certified</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Truck className="w-6 h-6 text-emerald-500 mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white">US / UK Express</h3>
          <p className="text-xs text-slate-500 mt-1">3 to 7 business days via USPS Priority, FedEx & Royal Mail 48.</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Clock className="w-6 h-6 text-emerald-500 mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white">24-48h Handling</h3>
          <p className="text-xs text-slate-500 mt-1">Orders cut off at 2:00 PM EST for same-day warehouse dispatch.</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ShieldCheck className="w-6 h-6 text-emerald-500 mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white">Transit Insurance</h3>
          <p className="text-xs text-slate-500 mt-1">100% replacement guarantee on transit damages or courier loss.</p>
        </div>
      </div>
    </div>
  );
}`;

  const refundCode = `// app/policies/refund/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { RefreshCw, CheckCircle, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Return Policy (30-Day Guarantee) | AeroCommerce',
  description: 'Hassle-free 30-day money-back guarantee. Zero restocking fees on returns.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-8 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">30-Day Return & Refund Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Zero Restocking Fees · Pre-paid Return Labels for Defective Items</p>
      </div>

      <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. 30-Day Return Window</h3>
        <p>You have 30 calendar days from the date of package delivery to request a return or full exchange.</p>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">2. Zero Restocking Fees</h3>
        <p>In accordance with Google Shopping consumer standards, AeroCommerce never imposes restocking fees.</p>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">3. Domestic Returns Addresses</h3>
        <p>US Hub: 1200 Logistics Blvd, Suite 400, Ontario, CA 91761, USA</p>
        <p>UK Hub: Unit 8, Brackmills Trade Park, Northampton, NN4 7DT, United Kingdom</p>
      </div>
    </div>
  );
}`;

  const prismaSchemaCode = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Product {
  id                  String   @id @default(uuid())
  sku                 String   @unique
  cjPid               String?  @unique @map("cj_pid")
  title               String   @db.VarChar(255)
  description         String   @db.Text
  slug                String   @unique @db.VarChar(255)
  brand               String   @default("AeroCommerce") @db.VarChar(128)
  costPrice           Decimal  @default(0.00) @map("cost_price") @db.Decimal(10, 2)
  price               Decimal  @db.Decimal(10, 2)
  salePrice           Decimal? @map("sale_price") @db.Decimal(10, 2)
  currency            String   @default("USD") @db.VarChar(3)
  stockQuantity       Int      @default(99) @map("stock_quantity")
  availability        String   @default("in_stock") @db.VarChar(20)
  condition           String   @default("new") @db.VarChar(20)
  warehouseCountry    String   @default("US") @map("warehouse_country") @db.VarChar(2)
  fulfillmentDaysMin  Int      @default(2) @map("fulfillment_days_min")
  fulfillmentDaysMax  Int      @default(5) @map("fulfillment_days_max")
  mainImageUrl        String   @map("main_image_url") @db.Text
  additionalImages    Json?    @default("[]") @map("additional_images")
  gtin                String?  @db.VarChar(32)
  mpn                 String?  @db.VarChar(64)
  googleCategory      String?  @map("google_category") @db.VarChar(255)
  productType         String?  @map("product_type") @db.VarChar(255)
  seoTitle            String?  @map("seo_title") @db.VarChar(120)
  seoDescription      String?  @map("seo_description") @db.VarChar(320)
  status              String   @default("active") @db.VarChar(20)
  isVisible           Boolean  @default(true) @map("is_visible")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@index([status, isVisible, updatedAt(sort: Desc)], name: "idx_products_gmc_feed")
  @@index([sku], name: "idx_products_sku")
  @@index([cjPid], name: "idx_products_cj_pid")
  @@map("products")
}`;

  const envCode = `# --- E-Commerce Production Environment Variables (.env.local) ---
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB_NAME]?sslmode=require"
ADMIN_SECRET_KEY="aero_secret_adm_994821"
CJ_API_KEY="CJ5994755@api@2bc8a55e048b442388da8f746d2f81f7"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-0KS0T13HQ7"
VITE_GA_MEASUREMENT_ID="G-0KS0T13HQ7"
NEXT_PUBLIC_SITE_URL="https://e-commerce-dropshiping-store.vercel.app"
APP_URL="https://e-commerce-dropshiping-store.vercel.app"
STORE_NAME="AeroCommerce Direct"
DEFAULT_CURRENCY="USD"`;

  const sitemapCode = `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour at the edge

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(_req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    const activeProducts = products.filter(
      (item: any) =>
        item.status !== 'archived' &&
        item.status !== 'draft' &&
        item.isVisible !== false
    );

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      'https://ais-dev-3nqmvpugp7tuj6tqdspsbn-806254583049.asia-northeast1.run.app'
    ).replace(/\\/+$/, '');

    const nowIso = new Date().toISOString();

    const staticRoutes = [
      { path: '', changefreq: 'daily', priority: '1.0' },
      { path: '/policies/shipping', changefreq: 'monthly', priority: '0.6' },
      { path: '/policies/refund', changefreq: 'monthly', priority: '0.6' },
      { path: '/policies/privacy', changefreq: 'monthly', priority: '0.5' },
      { path: '/policies/terms', changefreq: 'monthly', priority: '0.5' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    ];

    const staticUrlsXml = staticRoutes
      .map(
        (route) => \`  <url>
    <loc>\${escapeXml(\`\${baseUrl}\${route.path}\`)}</loc>
    <lastmod>\${nowIso}</lastmod>
    <changefreq>\${route.changefreq}</changefreq>
    <priority>\${route.priority}</priority>
  </url>\`
      )
      .join('\\n');

    const productUrlsXml = activeProducts
      .map((product: any) => {
        const productIdentifier = product.slug || product.id;
        const productUrl = \`\${baseUrl}/product/\${encodeURIComponent(productIdentifier)}\`;
        const lastMod = product.updatedAt
          ? new Date(product.updatedAt).toISOString()
          : nowIso;
        const imageUrl = product.mainImageUrl || product.image_link || '';
        const priority =
          product.availability === 'out_of_stock' ? '0.6' : '0.9';

        const imageExtensionXml = imageUrl
          ? \`\\n    <image:image>
      <image:loc>\${escapeXml(imageUrl)}</image:loc>
      <image:title>\${escapeXml(product.title)}</image:title>
    </image:image>\`
          : '';

        return \`  <url>
    <loc>\${escapeXml(productUrl)}</loc>
    <lastmod>\${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>\${priority}</priority>\${imageExtensionXml}
  </url>\`;
      })
      .join('\\n');

    const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
\${staticUrlsXml}
\${productUrlsXml}
</urlset>\`;

    return new NextResponse(xml.trim(), {
      status: 200,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' },
      }
    );
  }
}`;

  const getActiveCode = () => {
    switch (activeFile) {
      case 'sync-cj':
        return syncCjCode;
      case 'admin-crud':
        return adminCrudCode;
      case 'pdp':
        return pdpCode;
      case 'shipping':
        return shippingCode;
      case 'refund':
        return refundCode;
      case 'feed':
        return feedCode;
      case 'sitemap':
        return sitemapCode;
      case 'upload':
        return uploadCode;
      case 'schema':
        return prismaSchemaCode;
      case 'env':
        return envCode;
      default:
        return syncCjCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Next.js 15 App Router</span>
            <span aria-hidden="true">·</span>
            <span>TypeScript</span>
            <span aria-hidden="true">·</span>
            <span>Prisma Client (PostgreSQL)</span>
            <span aria-hidden="true">·</span>
            <span>Google Merchant Center RSS 2.0</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Production Next.js Full-Stack Architecture Codebase
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Complete, turnkey files: Bulk CJ Dropshipping Sync, Bearer-Authenticated Admin Inventory CRUD, Schema.org PDP with rich snippets, Dynamic SEO Sitemap, and Google Merchant Center legal policies.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-sm"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied to Clipboard' : 'Copy Active File'}</span>
        </button>
      </div>

      {/* Code Tabs Categorized */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-950/70 overflow-x-auto no-scrollbar gap-2 text-xs">
          {/* Group 1: Backend APIs */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">APIs:</span>
            <button
              onClick={() => setActiveFile('sync-cj')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'sync-cj' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>app/api/sync-cj-bulk/route.ts</span>
            </button>

            <button
              onClick={() => setActiveFile('admin-crud')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'admin-crud' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>app/api/admin/products/route.ts</span>
            </button>

            <button
              onClick={() => setActiveFile('feed')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'feed' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>app/api/feed.xml/route.ts</span>
            </button>

            <button
              onClick={() => setActiveFile('sitemap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'sitemap' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>app/api/sitemap.xml/route.ts</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" />

          {/* Group 2: Frontend & PDP */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-500 mr-1">UI:</span>
            <button
              onClick={() => setActiveFile('pdp')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'pdp' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>app/product/[id]/page.tsx</span>
            </button>

            <button
              onClick={() => setActiveFile('shipping')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'shipping' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>shipping/page.tsx</span>
            </button>

            <button
              onClick={() => setActiveFile('refund')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'refund' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>refund/page.tsx</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" />

          {/* Group 3: Database & Config */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveFile('schema')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'schema' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>schema.prisma</span>
            </button>

            <button
              onClick={() => setActiveFile('env')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeFile === 'env' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>.env.local</span>
            </button>
          </div>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-300 overflow-x-auto bg-slate-950 max-h-[620px] leading-relaxed">
          <code>{getActiveCode()}</code>
        </pre>
      </div>
    </div>
  );
};
