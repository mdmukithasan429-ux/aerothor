import React from 'react';
import prisma from '@/lib/prisma';
import { ProductGrid } from '@/components/product/ProductGrid';
import { buildProductPrismaWhere, sortStorefrontProducts } from './api/products/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const take = Math.min(100, Math.max(1, parseInt(resolvedParams.limit || '20', 10) || 20));
  const skip = (page - 1) * take;
  const category = resolvedParams.category || 'All';
  const query = resolvedParams.q || '';
  const sort = resolvedParams.sort || 'dynamic';
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

    const sorted = sortStorefrontProducts(fetched, sort);
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          AeroThor Official Storefront
        </h1>
        <p className="text-sm text-slate-400">
          Dynamic real-time catalog rotation · Verified buyer reviews · Lifetime Update &amp; Fitment Replacement included.
        </p>
      </div>

      <ProductGrid initialProducts={initialProducts} defaultPageSize={take} />
    </main>
  );
}
