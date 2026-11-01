import React from 'react';
import prisma from '@/lib/prisma';
import { ProductGrid } from '@/components/product/ProductGrid';
import { buildProductPrismaWhere } from './api/products/route';

export const dynamic = 'force-dynamic';

interface StorefrontPageProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    category?: string;
    q?: string;
  }>;
}

export default async function StorefrontHomePage({ searchParams }: StorefrontPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(resolvedParams.limit || '20', 10) || 20));
  const skip = (page - 1) * take;
  const category = resolvedParams.category || 'All';
  const query = resolvedParams.q || '';

  let initialProducts: any[] = [];

  try {
    const where = buildProductPrismaWhere({
      category,
      query,
      includeHidden: false,
    });

    const fetched = await prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    initialProducts = fetched.map((p) => ({
      id: p.sku,
      sku: p.sku,
      title: p.title,
      description: p.description,
      brand: p.brand,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      mainImageUrl: p.mainImageUrl,
      image_link: p.mainImageUrl,
      availability: p.availability,
      productType: p.productType,
      affiliateUrl: p.affiliateUrl,
      cjPid: p.cjPid,
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
          Paginated catalog with dynamic category filtering and 48-hour domestic dispatch.
        </p>
      </div>

      <ProductGrid initialProducts={initialProducts} defaultPageSize={take} />
    </main>
  );
}
