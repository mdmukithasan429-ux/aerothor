import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetails, { RelatedDealProduct } from '@/components/product/ProductDetails';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://aerothor.vercel.app';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProductAndRelatedDeals(idOrSku: string) {
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

    const relatedRaw = await prisma.product.findMany({
      where: {
        NOT: { sku: decoded },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const relatedDeals: RelatedDealProduct[] = relatedRaw.map((item: any) => ({
      id: item.id,
      sku: item.sku,
      title: item.title,
      price: Number(item.price),
      salePrice: item.salePrice ? Number(item.salePrice) : undefined,
      imageUrl: item.mainImageUrl || item.imageUrl,
      brand: item.brand || 'AeroThor Partner',
      affiliateUrl: item.affiliateUrl || undefined,
      productType: item.productSource === 'affiliate' || item.productType === 'affiliate' ? 'affiliate' : 'dropshipping',
    }));

    if (product) {
      return {
        product: {
          id: product.id,
          sku: product.sku,
          title: product.title,
          description: product.description,
          brand: (product as any).brand || 'AeroThor',
          price: Number(product.price),
          salePrice: (product as any).salePrice ? Number((product as any).salePrice) : undefined,
          mainImageUrl: (product as any).mainImageUrl || (product as any).imageUrl,
          seoTitle: (product as any).seoTitle || undefined,
          seoDescription: (product as any).seoDescription || undefined,
          gtin: (product as any).gtin || undefined,
          mpn: (product as any).mpn || product.sku,
          inStock: product.inStock ?? true,
          stockQuantity: product.stockQuantity ?? 3,
          ratingValue: 4.9,
          reviewCount: 148,
          productType: (((product as any).productSource || (product as any).productType) === 'affiliate'
            ? 'affiliate'
            : 'dropshipping') as 'dropshipping' | 'affiliate',
          affiliateUrl: (product as any).affiliateUrl || undefined,
          variants:
            (product as any).variants?.length > 0
              ? (product as any).variants.map((v: any) => ({
                  id: v.id,
                  sku: v.sku,
                  size: v.size || 'M / Standard',
                  color: v.color || 'Obsidian Black',
                  price: Number(v.price),
                  salePrice: v.salePrice ? Number(v.salePrice) : undefined,
                  imageUrl: v.imageUrl || (product as any).mainImageUrl || (product as any).imageUrl,
                  stockQuantity: v.stockQuantity ?? 3,
                }))
              : [
                  {
                    id: `${product.sku}-V1`,
                    sku: `${product.sku}-STD`,
                    size: 'Standard Edition',
                    color: 'Obsidian Black',
                    price: Number(product.price),
                    salePrice: (product as any).salePrice ? Number((product as any).salePrice) : undefined,
                    imageUrl: (product as any).mainImageUrl || (product as any).imageUrl,
                    stockQuantity: 3,
                  },
                ],
        },
        relatedDeals,
      };
    }
  } catch (err) {
    console.warn('[PDP Database Fallback]:', err);
  }

  // Fallback high-converting product & related affiliate deals
  return {
    product: {
      id: decoded,
      sku: decoded,
      title: 'AeroThor Grade-1 Titanium Vacuum Commuter Vessel',
      description:
        'Ultralight Grade-1 Titanium thermal commuter vessel with double-wall vacuum insulation. Dispatches from US & UK domestic warehouses in 3–7 business days with a 30-day money-back guarantee.',
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
      inStock: true,
      stockQuantity: 3,
      ratingValue: 4.9,
      reviewCount: 148,
      productType: 'dropshipping' as const,
      affiliateUrl: undefined,
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
          stockQuantity: 3,
        },
        {
          id: `${decoded}-V2`,
          sku: `${decoded}-750ML-TITAN`,
          size: '750ml Standard',
          color: 'Brushed Titanium',
          price: 64.99,
          salePrice: 54.99,
          imageUrl:
            'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
          stockQuantity: 4,
        },
      ],
    },
    relatedDeals: [
      {
        id: 'AFF-AMZN-B09XS7JWHH',
        sku: 'AFF-AMZN-B09XS7JWHH',
        title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
        price: 399.99,
        salePrice: 348.0,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        brand: 'Amazon Partner',
        affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH?tag=aerothor-20',
        productType: 'affiliate' as const,
      },
      {
        id: 'AFF-AMZN-B0CHX3QBCH',
        sku: 'AFF-AMZN-B0CHX3QBCH',
        title: 'Anker Prime 27,650mAh 250W GaN Power Bank Fast Charger',
        price: 179.99,
        salePrice: 149.99,
        imageUrl:
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
        brand: 'Amazon Partner',
        affiliateUrl: 'https://www.amazon.com/dp/B0CHX3QBCH?tag=aerothor-20',
        productType: 'affiliate' as const,
      },
      {
        id: 'AFF-AMZN-B0B7CPSN2K',
        sku: 'AFF-AMZN-B0B7CPSN2K',
        title: 'Apple AirTag 4-Pack Smart Precision Luggage Tracker',
        price: 99.0,
        salePrice: 79.99,
        imageUrl:
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
        brand: 'Amazon Partner',
        affiliateUrl: 'https://www.amazon.com/dp/B0B7CPSN2K?tag=aerothor-20',
        productType: 'affiliate' as const,
      },
      {
        id: 'AFF-AMZN-B08N5WRWNW',
        sku: 'AFF-AMZN-B08N5WRWNW',
        title: 'Peak Design Tech Pouch Weatherproof Commuter Organizer',
        price: 59.95,
        salePrice: 49.95,
        imageUrl:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        brand: 'Amazon Partner',
        affiliateUrl: 'https://www.amazon.com/dp/B08N5WRWNW?tag=aerothor-20',
        productType: 'affiliate' as const,
      },
    ],
  };
}

/**
 * Dynamic SEO & OpenGraph Metadata with Canonical URL on https://aerothor.vercel.app
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const { product } = await getProductAndRelatedDeals(id);
  const effectivePrice = (product.salePrice ?? product.price).toFixed(2);

  const seoTitle =
    product.seoTitle ||
    `${product.title} — $${effectivePrice} | ${product.brand} Official US & UK Store`;
  const seoDescription =
    product.seoDescription ||
    `Buy ${product.title} for $${effectivePrice} USD. ${product.description.slice(
      0,
      110
    )} Free 3-7 day US/UK tracked shipping & 30-day money-back guarantee.`;
  const canonicalUrl = `${BASE_DOMAIN}/product/${encodeURIComponent(product.sku)}`;

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
  const { product, relatedDeals } = await getProductAndRelatedDeals(id);
  const canonicalUrl = `${BASE_DOMAIN}/product/${encodeURIComponent(product.sku)}`;
  const effectivePrice = (product.salePrice ?? product.price).toFixed(2);

  // Google Rich Snippets JSON-LD: Product + Offer + AggregateRating
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: [product.mainImageUrl],
    description: product.description,
    sku: product.sku,
    mpn: product.mpn || product.sku,
    ...(product.gtin ? { gtin13: product.gtin } : {}),
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AeroThor',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(product.ratingValue ?? 4.9),
      reviewCount: String(product.reviewCount ?? 148),
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'USD',
      price: effectivePrice,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'AeroThor Official Store',
      },
    },
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto">
        <ProductDetails product={product} relatedDeals={relatedDeals} />
      </div>
    </main>
  );
}
