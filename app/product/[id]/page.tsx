import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ProductVariantClientView } from './ProductVariantClientView';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProductWithVariants(idOrSku: string) {
  const decoded = decodeURIComponent(idOrSku).trim();
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: decoded }, { sku: decoded }],
      },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (product) {
      return {
        id: product.id,
        sku: product.sku,
        title: product.title,
        description: product.description,
        brand: product.brand,
        price: Number(product.price),
        salePrice: product.salePrice ? Number(product.salePrice) : undefined,
        mainImageUrl: product.mainImageUrl,
        seoTitle: product.seoTitle || undefined,
        seoDescription: product.seoDescription || undefined,
        gtin: product.gtin || undefined,
        mpn: product.mpn || product.sku,
        productType: ((product as any).productType || 'dropshipping') as 'dropshipping' | 'affiliate',
        affiliateUrl: (product as any).affiliateUrl || undefined,
        variants:
          product.variants.length > 0
            ? product.variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                cjVid: v.cjVid || undefined,
                size: v.size || 'M / Standard',
                color: v.color || 'Obsidian Black',
                price: Number(v.price),
                salePrice: v.salePrice ? Number(v.salePrice) : undefined,
                imageUrl: v.imageUrl || product.mainImageUrl,
                stockQuantity: v.stockQuantity,
              }))
            : [
                {
                  id: `${product.sku}-V1`,
                  sku: `${product.sku}-S-BLK`,
                  size: 'S / Compact',
                  color: 'Obsidian Black',
                  price: Math.max(9.99, Number(product.price) - 2),
                  salePrice: product.salePrice ? Math.max(7.99, Number(product.salePrice) - 2) : undefined,
                  imageUrl: product.mainImageUrl,
                  stockQuantity: 45,
                },
                {
                  id: `${product.sku}-V2`,
                  sku: `${product.sku}-M-BLK`,
                  size: 'M / Standard',
                  color: 'Obsidian Black',
                  price: Number(product.price),
                  salePrice: product.salePrice ? Number(product.salePrice) : undefined,
                  imageUrl: product.mainImageUrl,
                  stockQuantity: 64,
                },
                {
                  id: `${product.sku}-V3`,
                  sku: `${product.sku}-L-TITAN`,
                  size: 'L / Extended',
                  color: 'Brushed Titanium',
                  price: Number(product.price) + 5,
                  salePrice: product.salePrice ? Number(product.salePrice) + 5 : undefined,
                  imageUrl: product.mainImageUrl,
                  stockQuantity: 38,
                },
              ],
      };
    }
  } catch (err) {
    console.warn('[PDP Database Fallback]:', err);
  }

  return {
    id: decoded,
    sku: decoded,
    title: 'AeroThor Grade-1 Titanium Vacuum Commuter Vessel',
    description:
      'Ultralight Grade-1 Titanium thermal commuter vessel with double-wall vacuum insulation. Dispatches from US & UK domestic warehouses in 3-7 business days.',
    brand: 'AeroThor',
    price: 64.99,
    salePrice: 54.99,
    mainImageUrl:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
    seoTitle: 'AeroThor Grade-1 Titanium Vacuum Commuter Vessel — $54.99 | AeroThor',
    seoDescription:
      'Shop AeroThor Grade-1 Titanium Vacuum Commuter Vessel. Free 3-7 day US/UK domestic tracked shipping and 30-day money-back guarantee.',
    gtin: '00850012345012',
    mpn: decoded,
    variants: [
      {
        id: `${decoded}-V1`,
        sku: `${decoded}-500ML-BLK`,
        size: '500ml Compact',
        color: 'Obsidian Black',
        price: 59.99,
        salePrice: 49.99,
        imageUrl:
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
        stockQuantity: 52,
      },
      {
        id: `${decoded}-V2`,
        sku: `${decoded}-750ML-BLK`,
        size: '750ml Standard',
        color: 'Obsidian Black',
        price: 64.99,
        salePrice: 54.99,
        imageUrl:
          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
        stockQuantity: 84,
      },
      {
        id: `${decoded}-V3`,
        sku: `${decoded}-1000ML-TITAN`,
        size: '1000ml Expedition',
        color: 'Brushed Titanium',
        price: 74.99,
        salePrice: 62.99,
        imageUrl:
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
        stockQuantity: 39,
      },
    ],
  };
}

/**
 * PHASE 3: Next.js generateMetadata for Dynamic SEO Titles, Descriptions, and OpenGraph Tags
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductWithVariants(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerothor.vercel.app';
  const displayPrice = (product.salePrice ?? product.price).toFixed(2);

  const seoTitle =
    product.seoTitle || `${product.title} — $${displayPrice} | ${product.brand}`;
  const seoDescription =
    product.seoDescription ||
    `${product.description.slice(0, 125)} Free 3-7 day US/UK shipping & 30-day returns.`;
  const canonicalUrl = `${siteUrl}/product/${encodeURIComponent(product.sku)}`;

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: 'AeroThor Official Store',
      images: [
        {
          url: product.mainImageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [product.mainImageUrl],
    },
  };
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductWithVariants(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerothor.vercel.app';

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: [product.mainImageUrl],
    description: product.description,
    sku: product.sku,
    mpn: product.mpn,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'AggregateOffer',
      url: `${siteUrl}/product/${encodeURIComponent(product.sku)}`,
      priceCurrency: 'USD',
      lowPrice: Math.min(...product.variants.map((v) => v.salePrice ?? v.price)).toFixed(2),
      highPrice: Math.max(...product.variants.map((v) => v.price)).toFixed(2),
      offerCount: product.variants.length,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto">
        <ProductVariantClientView product={product} />
      </div>
    </main>
  );
}
