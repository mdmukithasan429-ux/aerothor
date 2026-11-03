import React from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import prisma from '@/lib/prisma';
import { buildProductPrismaWhere, sortAndShuffleStorefrontProducts } from './api/products/route';

const ProductGrid = nextDynamic(
  () => import('@/components/product/ProductGrid').then((m) => m.ProductGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-h-[600px]">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-[380px] rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
          />
        ))}
      </div>
    ),
  }
);

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface StorefrontPageProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    category?: string;
    q?: string;
    sort?: string;
    tag?: string;
  }>;
}

export default async function StorefrontHomePage({ searchParams }: StorefrontPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1);
  const take = Math.min(1000, Math.max(1, parseInt(resolvedParams.limit || '24', 10) || 24));
  const skip = (page - 1) * take;
  const category = resolvedParams.category || 'All';
  const query = resolvedParams.q || '';
  const sort = (resolvedParams.sort || 'trending') as any;
  const tag = resolvedParams.tag || '';

  let initialProducts: any[] = [];

  try {
    const where = buildProductPrismaWhere({
      category,
      query,
      tag,
      includeHidden: false,
    });

    const fetched = await prisma.product.findMany({
      where,
    });

    const sorted = sortAndShuffleStorefrontProducts(fetched, sort);
    const paginated = sorted.slice(skip, skip + take);

    initialProducts = paginated.map((p: any) => ({
      id: p.sku || p.id,
      sku: p.sku || p.id,
      title: p.title,
      description: p.description,
      brand: p.brand,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      mainImageUrl: p.mainImageUrl || p.image_link,
      image_link: p.mainImageUrl || p.image_link,
      availability: p.availability,
      productType: p.productType,
      product_type: p.product_type,
      affiliateUrl: p.affiliateUrl,
      cjPid: p.cjPid,
      isTrending: Boolean(p.isTrending),
      isBestSelling: Boolean(p.isBestSelling),
      trendingScore: p.trendingScore ?? 90,
      salesCount: p.salesCount ?? 350,
      tags: Array.isArray(p.tags) ? p.tags : ['trending', 'lifetime-update'],
      rating: p.rating ?? 4.94,
      reviewCount: p.reviewCount ?? 180,
      reviews: Array.isArray(p.reviewsJson) ? p.reviewsJson : p.reviews || [],
      hasLifetimeUpdateAccess: p.hasLifetimeUpdateAccess ?? true,
    }));
  } catch {
    initialProducts = [];
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AeroThor Performance Gear & Hardware Catalog',
    url: 'https://aerothor.smmgrows.com',
    numberOfItems: initialProducts.length,
    itemListElement: initialProducts.slice(0, 12).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://aerothor.smmgrows.com/product/${encodeURIComponent(item.id)}`,
      name: item.title,
    })),
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* High-Conversion Above-the-Fold Hero Banner with Next/Image Priority for 100/100 LCP */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <span>⚡ Express 48h US/UK/EU Domestic Dispatch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            AeroThor Official Storefront
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Precision titanium EDC, Qi2 magnetic power stations, and verified partner deals. Backed by 48-hour domestic dispatch and a 30-day free replacement guarantee.
          </p>
        </div>
        <div className="lg:col-span-5 relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
          <Image
            src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80&fm=webp"
            alt="AeroThor CNC Aluminum Workstation & Precision Tech Hardware Collection"
            width={1200}
            height={675}
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      <ProductGrid initialProducts={initialProducts} defaultPageSize={take} />
    </main>
  );
}

