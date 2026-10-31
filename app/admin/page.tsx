import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import AdminErpClientView from './AdminErpClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Enterprise ERP Dashboard | AeroThor Operations & Supply Chain',
  description:
    'Real-time Enterprise Resource Planning dashboard for AeroThor e-commerce. Key financial metrics, multi-channel catalog health, Free Shipping rules, and order fulfillment tracking.',
};

export default async function AdminErpDashboardPage() {
  let orders: any[] = [];
  let products: any[] = [];
  let dbError: string | null = null;

  try {
    const [fetchedOrders, fetchedProducts] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Serialize Decimals and Dates for safe Next.js Server-to-Client component passing
    orders = fetchedOrders.map((o) => ({
      ...o,
      totalAmount: typeof o.totalAmount === 'object' && o.totalAmount !== null ? Number(o.totalAmount.toString()) : Number(o.totalAmount || 0),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    products = fetchedProducts.map((p) => ({
      ...p,
      price: typeof p.price === 'object' && p.price !== null ? Number(p.price.toString()) : Number(p.price || 0),
      salePrice: p.salePrice ? (typeof p.salePrice === 'object' ? Number(p.salePrice.toString()) : Number(p.salePrice)) : null,
      shippingCost: Number(p.shippingCost || 0),
      isFreeShipping: p.isFreeShipping ?? true,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));
  } catch (err: any) {
    console.error('[Prisma ERP Query Non-Fatal Fallback]:', err.message);
    dbError = err.message || 'Database connection currently initializing or using edge cache.';
  }

  // Calculate Real-Time ERP Metrics
  const totalOrdersCount = orders.length;
  const paidOrders = orders.filter((o) =>
    String(o.status || '').toLowerCase().includes('paid') ||
    String(o.status || '').toLowerCase().includes('shipped') ||
    String(o.status || '').toLowerCase().includes('delivered')
  );
  const pendingOrders = orders.filter((o) =>
    String(o.status || '').toLowerCase().includes('pending') ||
    String(o.status || '').toLowerCase().includes('processing')
  );

  const totalRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  const dropshippingCount = products.filter((p) => p.productType !== 'affiliate').length;
  const affiliateCount = products.filter((p) => p.productType === 'affiliate').length;
  const freeShippingCount = products.filter((p) => p.isFreeShipping !== false).length;
  const customShippingCount = products.filter((p) => p.isFreeShipping === false).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <AdminErpClientView
        initialMetrics={{
          totalRevenue,
          totalOrdersCount,
          paidOrdersCount: paidOrders.length,
          pendingOrdersCount: pendingOrders.length,
          averageOrderValue,
          totalProductsCount: products.length,
          dropshippingCount,
          affiliateCount,
          freeShippingCount,
          customShippingCount,
        }}
        initialOrders={orders}
        initialProducts={products}
        dbError={dbError}
      />
    </div>
  );
}
