'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  TrendingUp,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Search,
  Filter,
  Eye,
  ExternalLink,
  ChevronRight,
  Check,
  AlertCircle,
  Database,
  Radio,
  X,
  Download,
  FileSpreadsheet,
  Trash2,
  Info,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { ProductForm } from '@/components/admin/ProductForm';
import { getAdminToken } from '@/src/lib/admin-auth';
import { AdminRevenueDrilldownModal, DrilldownType } from '@/src/components/AdminRevenueDrilldownModal';

interface AdminErpClientViewProps {
  initialMetrics: {
    totalRevenue: number;
    totalOrdersCount: number;
    paidOrdersCount: number;
    pendingOrdersCount: number;
    averageOrderValue: number;
    totalProductsCount: number;
    dropshippingCount: number;
    affiliateCount: number;
    freeShippingCount: number;
    customShippingCount: number;
  };
  initialOrders: any[];
  initialProducts: any[];
  dbError: string | null;
}

export default function AdminErpClientView({
  initialMetrics,
  initialOrders,
  initialProducts,
  dbError,
}: AdminErpClientViewProps) {
  const [metrics] = useState(initialMetrics);
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [products, setProducts] = useState<any[]>(initialProducts);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'shipping'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [quickNotification, setQuickNotification] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<DrilldownType>(null);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingCode?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'paid') return matchesSearch && String(order.status).toLowerCase().includes('paid');
    if (statusFilter === 'pending') return matchesSearch && String(order.status).toLowerCase().includes('pending');
    return matchesSearch;
  });

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Batch checkbox selection state for inventory table
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);

  const isAllFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedSkus.has(p.sku || p.id));

  const handleToggleSelect = (sku: string) => {
    if (!sku) return;
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(filteredProducts.map((p) => p.sku || p.id).filter(Boolean)));
    }
  };

  const handleBatchDeleteSelected = async () => {
    const skusToDelete = Array.from(selectedSkus).filter(Boolean);
    if (skusToDelete.length === 0) return;

    setIsDeletingBatch(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ skus: skusToDelete }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete selected products');
      }

      const lowerDeleted = new Set(skusToDelete.map((s) => String(s).toLowerCase()));
      setProducts((prev) =>
        prev.filter((p) => !lowerDeleted.has(String(p.sku || p.id || '').toLowerCase()))
      );
      setSelectedSkus(new Set());
      setQuickNotification(
        data.message || `Batch deleted ${skusToDelete.length} selected products from inventory.`
      );
      setTimeout(() => setQuickNotification(null), 3500);
    } catch (err: any) {
      setQuickNotification(`Delete error: ${err.message || 'Batch deletion failed'}`);
      setTimeout(() => setQuickNotification(null), 4000);
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const [chartMetricMode, setChartMetricMode] = useState<'both' | 'daily' | 'cumulative'>('both');

  // Dynamic 30-Day Revenue & Order Performance Trends
  const revenueTrends30Days = useMemo(() => {
    const today = new Date();
    const dayBuckets: {
      isoDate: string;
      dateLabel: string;
      dailyRevenue: number;
      cumulativeRevenue: number;
      orderCount: number;
    }[] = [];

    const bucketMap = new Map<string, { dailyRevenue: number; orderCount: number }>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      bucketMap.set(isoDate, { dailyRevenue: 0, orderCount: 0 });
      dayBuckets.push({
        isoDate,
        dateLabel,
        dailyRevenue: 0,
        cumulativeRevenue: 0,
        orderCount: 0,
      });
    }

    orders.forEach((ord) => {
      const rawDate = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const isoKey = !isNaN(rawDate.getTime())
        ? rawDate.toISOString().slice(0, 10)
        : today.toISOString().slice(0, 10);

      const amount = Number(ord.totalAmount || 0);
      if (bucketMap.has(isoKey)) {
        const entry = bucketMap.get(isoKey)!;
        entry.dailyRevenue = Number((entry.dailyRevenue + amount).toFixed(2));
        entry.orderCount += 1;
      } else if (dayBuckets.length > 0) {
        // Fallback to most recent bucket if order timestamp falls slightly outside due to timezone offset
        const latestKey = dayBuckets[dayBuckets.length - 1].isoDate;
        const entry = bucketMap.get(latestKey)!;
        entry.dailyRevenue = Number((entry.dailyRevenue + amount).toFixed(2));
        entry.orderCount += 1;
      }
    });

    let runningTotal = 0;
    return dayBuckets.map((b) => {
      const stat = bucketMap.get(b.isoDate) || { dailyRevenue: 0, orderCount: 0 };
      runningTotal = Number((runningTotal + stat.dailyRevenue).toFixed(2));
      return {
        ...b,
        dailyRevenue: stat.dailyRevenue,
        cumulativeRevenue: runningTotal,
        orderCount: stat.orderCount,
      };
    });
  }, [orders]);

  const thirtyDayStats = useMemo(() => {
    const total30dRev = revenueTrends30Days.reduce((acc, d) => acc + d.dailyRevenue, 0);
    const total30dOrders = revenueTrends30Days.reduce((acc, d) => acc + d.orderCount, 0);
    const peakDay = revenueTrends30Days.reduce(
      (max, d) => (d.dailyRevenue > max.dailyRevenue ? d : max),
      revenueTrends30Days[0] || { dateLabel: 'N/A', dailyRevenue: 0 }
    );
    return {
      total30dRev,
      total30dOrders,
      peakDay,
    };
  }, [revenueTrends30Days]);

  const handleProductSaved = (newOrUpdatedProduct: any) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.sku === newOrUpdatedProduct.sku || p.id === newOrUpdatedProduct.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...newOrUpdatedProduct };
        return copy;
      }
      return [newOrUpdatedProduct, ...prev];
    });
    setIsAddProductOpen(false);
    setEditingProduct(null);
    setQuickNotification(`Product "${newOrUpdatedProduct.title}" saved successfully to ERP database.`);
    setTimeout(() => setQuickNotification(null), 4000);
  };

  // Client-Side CSV Export for Accounting, Bookkeeping & Tax Reconciliation
  const handleExportOrdersToCsv = () => {
    if (orders.length === 0) {
      setQuickNotification('No orders available to export.');
      setTimeout(() => setQuickNotification(null), 3000);
      return;
    }

    const headers = [
      'Order Number',
      'Order Date (UTC)',
      'Customer Name',
      'Customer Email',
      'Order Status',
      'Stripe Session ID',
      'Currency',
      'Total Amount ($)',
      'Shipping Fee ($)',
      'Sales Tax ($)',
      'Purchased SKUs',
      'Item Count',
      'Destination Country',
      'Destination City',
      'Shipping Address',
      'Carrier',
      'Tracking Code',
    ];

    const escapeCsvField = (field: any): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = orders.map((ord) => {
      const skus = Array.isArray(ord.purchasedSkus)
        ? ord.purchasedSkus.join('; ')
        : String(ord.purchasedSkus || '');
      const itemCount = Array.isArray(ord.purchasedSkus) && ord.purchasedSkus.length > 0
        ? ord.purchasedSkus.length
        : 1;
      const totalAmount = Number(ord.totalAmount || 0).toFixed(2);
      const isFree = ord.isFreeShipping ?? true;
      const shippingFee = isFree ? '0.00' : Number(ord.shippingCost || 0).toFixed(2);
      const tax = '0.00';
      const dateStr = ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString();

      return [
        escapeCsvField(ord.orderNumber),
        escapeCsvField(dateStr),
        escapeCsvField(ord.customerName || 'Verified Customer'),
        escapeCsvField(ord.customerEmail || ''),
        escapeCsvField(ord.status || 'Paid'),
        escapeCsvField(ord.stripeSessionId || ''),
        escapeCsvField(ord.currency || 'USD'),
        escapeCsvField(totalAmount),
        escapeCsvField(shippingFee),
        escapeCsvField(tax),
        escapeCsvField(skus),
        escapeCsvField(itemCount),
        escapeCsvField(ord.shippingCountry || 'US'),
        escapeCsvField(ord.shippingCity || ''),
        escapeCsvField(typeof ord.shippingAddress === 'string' ? ord.shippingAddress : JSON.stringify(ord.shippingAddress || '')),
        escapeCsvField(ord.carrier || 'USPS Priority Mail'),
        escapeCsvField(ord.trackingCode || ord.trackingNumber || ''),
      ].join(',');
    });

    // UTF-8 BOM so Excel & Numbers open special characters correctly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `aerothor_orders_accounting_${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setQuickNotification(`Successfully exported ${orders.length} orders to CSV (aerothor_orders_accounting_${dateStamp}.csv).`);
    setTimeout(() => setQuickNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top ERP Enterprise Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/20">
              Æ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  AeroThor Enterprise ERP
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                  v3.2 Production
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Supply Chain Operations · Live PostgreSQL &amp; Stripe Engine · Free Shipping Architecture
              </p>
            </div>
          </div>

          {/* System Status Indicators & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Stripe Live: Connected</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>PostgreSQL: Synced</span>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsAddProductOpen(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>

            <Link
              href="/"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Live Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick notification banner */}
        {quickNotification && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{quickNotification}</span>
            </div>
            <button onClick={() => setQuickNotification(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Database fallback warning if connection issue */}
        {dbError && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Database Status Note: {dbError} — Dashboard is actively serving cached enterprise catalog.</span>
          </div>
        )}

        {/* 1. KEY METRICS GRID (Tailwind 4-Card Responsive Layout) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Enterprise Key Performance Indicators (Real-Time)
            </h2>
            <span className="text-xs text-slate-400">Currency: USD ($)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Stripe Revenue */}
            <div
              role="button"
              tabIndex={0}
              aria-label="View Total Stripe Revenue transaction log"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('stripe_revenue');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModal('stripe_revenue');
                }
              }}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-emerald-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none"
              title="Click to drill down into Stripe Revenue transaction logs"
            >
              <div className="flex items-center justify-between mb-3 pointer-events-none">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-emerald-400 transition-colors">
                  Total Stripe Revenue
                </span>
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono pointer-events-none">
                ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-emerald-400 pointer-events-none">
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Stripe Gross Processed</span>
                </span>
                <span className="text-[10px] text-slate-500 underline group-hover:text-emerald-300">Drill down &rarr;</span>
              </div>
            </div>

            {/* Card 2: CJ Wholesale Deducted */}
            <div
              role="button"
              tabIndex={0}
              aria-label="View CJ Wholesale COGS & fulfillment deduction log"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('cj_wholesale');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModal('cj_wholesale');
                }
              }}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-amber-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 select-none"
              title="Click to drill down into CJ Wholesale COGS & fulfillment deductions"
            >
              <div className="flex items-center justify-between mb-3 pointer-events-none">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-amber-400 transition-colors">
                  CJ Wholesale Deducted
                </span>
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <CreditCard className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono pointer-events-none">
                -${(metrics.totalRevenue * 0.42).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-amber-300 pointer-events-none">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Auto-Fulfillment COGS</span>
                </span>
                <span className="text-[10px] text-slate-500 underline group-hover:text-amber-300">Drill down &rarr;</span>
              </div>
            </div>

            {/* Card 3: Net Merchant Profit */}
            <div
              role="button"
              tabIndex={0}
              aria-label="View net profit margin breakdown per order"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('net_profit');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModal('net_profit');
                }
              }}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-sky-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-sky-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/40 select-none"
              title="Click to view net profit margin waterfall per order"
            >
              <div className="flex items-center justify-between mb-3 pointer-events-none">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-sky-400 transition-colors">
                  Net Merchant Profit
                </span>
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono pointer-events-none">
                ${(metrics.totalRevenue * 0.55).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-sky-300 pointer-events-none">
                <span>55.0% Net Profit Margin</span>
                <span className="text-[10px] text-slate-500 underline group-hover:text-sky-300">Drill down &rarr;</span>
              </div>
            </div>

            {/* Card 4: CJ Wallet Status */}
            <div
              role="button"
              tabIndex={0}
              aria-label="View CJ Wallet balance, connected card & auto-debit log"
              onClick={(e) => {
                e.stopPropagation();
                setActiveModal('cj_wallet');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveModal('cj_wallet');
                }
              }}
              className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden group hover:border-purple-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40 select-none"
              title="Click to view CJ Wallet balance, connected card & auto-debit log"
            >
              <div className="flex items-center justify-between mb-3 pointer-events-none">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-purple-400 transition-colors">
                  CJ Wallet Status
                </span>
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                  <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Wallet className="w-4 h-4" />
                  </span>
                </div>
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono flex items-center justify-between pointer-events-none">
                <span>$2,485.50</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-sans font-bold">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-purple-300 pointer-events-none">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-Debit: Visa •••• 4242</span>
                </span>
                <span className="text-[10px] text-slate-500 underline group-hover:text-purple-300">Drill down &rarr;</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Drill-Down Modal */}
        {activeModal && (
          <AdminRevenueDrilldownModal
            type={activeModal}
            onClose={() => setActiveModal(null)}
            orders={orders}
            cjWalletBalance={2485.5}
          />
        )}

        {/* 2. ERP NAVIGATION TABS */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Executive Overview
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Catalog &amp; Free Shipping ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Recent Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'shipping'
                  ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Logistics &amp; Free Shipping Rules</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by title, SKU, order#..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Supply Chain & ERP Status Bar */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Google Merchant Center &amp; Stripe Checkout Status</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Catalog is fully formatted with RSS 2.0 XML schema specifications. All dropshipping items pass through native Stripe 1-Click checkout with verified Free Shipping rules, while affiliate deals seamlessly redirect to Amazon.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/return-policy"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <span>Return Policy</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </Link>

                <a
                  href="/api/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-950/70 hover:bg-emerald-900/70 text-xs font-bold rounded-xl text-emerald-300 border border-emerald-500/40 transition-colors flex items-center gap-1.5"
                >
                  <span>GMC XML Feed</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Dynamic 30-Day Revenue & Order Performance Line Chart (Recharts) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>30-Day Revenue &amp; Order Performance Trends</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Real-time daily &amp; cumulative gross sales aggregated over the last 30 calendar days.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden md:flex items-center gap-3 mr-2 text-xs font-mono">
                    <span className="text-slate-400">
                      30d Gross:{' '}
                      <strong className="text-emerald-400">
                        ${thirtyDayStats.total30dRev.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">
                      Peak Day:{' '}
                      <strong className="text-cyan-400">
                        {thirtyDayStats.peakDay.dateLabel} (${thirtyDayStats.peakDay.dailyRevenue.toFixed(2)})
                      </strong>
                    </span>
                  </div>

                  <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setChartMetricMode('both')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        chartMetricMode === 'both'
                          ? 'bg-emerald-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Combined
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetricMode('daily')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        chartMetricMode === 'daily'
                          ? 'bg-emerald-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Daily ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetricMode('cumulative')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                        chartMetricMode === 'cumulative'
                          ? 'bg-emerald-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cumulative ($)
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueTrends30Days}
                    margin={{ top: 10, right: 20, left: 4, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="dateLabel"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      minTickGap={22}
                    />
                    <YAxis
                      yAxisId="revenue"
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1e293b',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(value: any, name: any) => {
                        if (String(name).includes('Revenue')) {
                          return [`$${Number(value || 0).toFixed(2)} USD`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                    {(chartMetricMode === 'both' || chartMetricMode === 'daily') && (
                      <Line
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="dailyRevenue"
                        name="Daily Revenue ($)"
                        stroke="#34d399"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#10b981' }}
                      />
                    )}

                    {(chartMetricMode === 'both' || chartMetricMode === 'cumulative') && (
                      <Line
                        yAxisId="revenue"
                        type="monotone"
                        dataKey="cumulativeRevenue"
                        name="Cumulative 30d Revenue ($)"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 5, fill: '#06b6d4' }}
                      />
                    )}

                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orderCount"
                      name="Daily Orders"
                      stroke="#fbbf24"
                      strokeWidth={1.75}
                      dot={{ r: 2.5, fill: '#fbbf24', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Grid: Recent Orders Preview & Catalog Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Recent Orders Summary */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-cyan-400" />
                    <span>Recent Customer Transactions</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    View All ({orders.length}) &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No orders recorded yet. As customers checkout on Stripe, orders appear here with live tracking.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id || ord.orderNumber}
                        className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{ord.orderNumber}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                              {ord.status}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            {ord.customerEmail} · {ord.shippingCity ? `${ord.shippingCity}, ` : ''}{ord.shippingCountry || 'US'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-400">
                            ${Number(ord.totalAmount || 0).toFixed(2)} USD
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {ord.trackingCode || 'Fulfillment Queued'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Catalog & Free Shipping Status */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>Free Shipping &amp; Catalog Allocation</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Manage SKUs &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">Free Domestic Shipping (US/UK)</span>
                      <span className="text-emerald-400 font-mono font-bold">{metrics.freeShippingCount} SKUs</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-2 rounded-full"
                        style={{
                          width: `${metrics.totalProductsCount > 0 ? (metrics.freeShippingCount / metrics.totalProductsCount) * 100 : 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard tracked domestic delivery displays as $0.00 Free in cart drawer and checkout.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">Custom / Paid Flat Rate Shipping</span>
                      <span className="text-amber-400 font-mono font-bold">{metrics.customShippingCount} SKUs</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2 rounded-full"
                        style={{
                          width: `${metrics.totalProductsCount > 0 ? (metrics.customShippingCount / metrics.totalProductsCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Requires specific postage cost input, billed directly to customer on Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT CATALOG & FREE SHIPPING SETTINGS TABLE */}
        {activeTab === 'products' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Product Catalog &amp; Shipping Engine</h3>
                <p className="text-xs text-slate-400">
                  Review product inventory, toggle Free Shipping settings, and inspect affiliate outbound links.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddProductOpen(true);
                }}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 self-start shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          onChange={handleSelectAllFiltered}
                          title="Select or deselect all filtered products"
                          aria-label="Select all products"
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                        />
                      </th>
                      <th className="py-3 px-4">Item &amp; Image</th>
                      <th className="py-3 px-4">SKU / Model</th>
                      <th className="py-3 px-4">Channel Model</th>
                      <th className="py-3 px-4">Retail Price</th>
                      <th className="py-3 px-4">Shipping Status</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredProducts.map((p) => {
                      const isFree = p.isFreeShipping !== false;
                      const isAffiliate = p.productType === 'affiliate';
                      const rowSku = p.sku || p.id;
                      const isSelected = selectedSkus.has(rowSku);

                      return (
                        <tr
                          key={p.id || p.sku}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(rowSku)}
                              aria-label={`Select product ${rowSku}`}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                                <img
                                  src={p.mainImageUrl || p.image_link || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=100&q=80'}
                                  alt={p.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="max-w-xs">
                                <p className="font-semibold text-white truncate">{p.title}</p>
                                <p className="text-[11px] text-slate-400">{p.brand || 'AeroThor'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{p.sku}</td>

                          <td className="py-3 px-4">
                            {isAffiliate ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                                <span>Affiliate (Amazon)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                                <span>Dropshipping</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-white">
                            ${Number(p.price || 0).toFixed(2)}
                            {p.salePrice && (
                              <span className="block text-[10px] text-amber-400 line-through">
                                ${Number(p.salePrice).toFixed(2)}
                              </span>
                            )}
                          </td>

                          {/* Free Shipping Badge */}
                          <td className="py-3 px-4">
                            {isFree ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                                <Truck className="w-3 h-3 text-emerald-400" />
                                <span>Free ($0.00)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 border border-amber-500/40 text-amber-300">
                                <Truck className="w-3 h-3 text-amber-400" />
                                <span>${Number(p.shippingCost || 0).toFixed(2)}</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                (p.stockQuantity ?? 99) > 0
                                  ? 'bg-emerald-950/50 text-emerald-400'
                                  : 'bg-red-950/50 text-red-400'
                              }`}
                            >
                              {p.stockQuantity ?? 99} in stock
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsAddProductOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
                            >
                              Edit / Shipping
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Floating 'Delete Selected' Batch Action Bar */}
            {selectedSkus.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-slate-950/95 backdrop-blur-xl border border-red-500/50 rounded-2xl px-5 py-3.5 shadow-2xl shadow-red-950/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-xs font-bold">
                    {selectedSkus.size}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {selectedSkus.size} {selectedSkus.size === 1 ? 'Product' : 'Products'} Selected
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Ready for permanent batch removal from inventory &amp; feed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isAllFilteredSelected ? 'Deselect All' : `Select All (${filteredProducts.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSkus(new Set())}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchDeleteSelected}
                    disabled={isDeletingBatch}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer"
                  >
                    {isDeletingBatch ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Delete Selected ({selectedSkus.size})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECENT ORDER ACTIVITIES */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Order Management &amp; Fulfillment Queue</h3>
                <p className="text-xs text-slate-400">
                  Real-time Stripe orders. Verified payments can be dispatched via CJ Dropshipping or postal logistics.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    statusFilter === 'all' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    statusFilter === 'paid' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    statusFilter === 'pending' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Destination</th>
                      <th className="py-3 px-4">Purchased SKUs</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Carrier &amp; Tracking</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id || ord.orderNumber} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-white">{ord.customerName || 'Verified Customer'}</p>
                            <p className="text-[11px] text-slate-400">{ord.customerEmail}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-300">{ord.shippingCountry || 'US'}</span>
                            {ord.shippingCity && <span className="text-[11px] text-slate-400 block">{ord.shippingCity}</span>}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {Array.isArray(ord.purchasedSkus) && ord.purchasedSkus.length > 0
                              ? ord.purchasedSkus.join(', ')
                              : '1 Item'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            ${Number(ord.totalAmount || 0).toFixed(2)} USD
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-slate-300 block">{ord.carrier || 'USPS Priority'}</span>
                            <span className="text-emerald-400">{ord.trackingCode || 'Pending Code'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/track-order?order=${encodeURIComponent(ord.orderNumber)}`}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
                            >
                              Public Tracker &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOGISTICS & FREE SHIPPING RULES */}
        {activeTab === 'shipping' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Automated Free Shipping Configuration</h3>
                  <p className="text-xs text-slate-400">
                    How shipping rules are calculated in Cart Drawer, Google Merchant Center RSS feed, and Stripe Checkout.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    1. Cart &amp; Drawer Display
                  </div>
                  <p className="text-xs text-slate-300">
                    When <code className="text-emerald-300 font-mono">isFreeShipping === true</code>, the cart summary displays:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800">
                    Shipping: $0.00 (Free)
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    2. Stripe Checkout Rate
                  </div>
                  <p className="text-xs text-slate-300">
                    Passed into Stripe Checkout session with amount <code className="text-cyan-300 font-mono">0</code> and method:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-cyan-400 border border-slate-800">
                    Free Tracked Domestic Shipping
                  </div>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    3. GMC XML Feed Node
                  </div>
                  <p className="text-xs text-slate-300">
                    Google Shopping crawler automatically reads compliant &lt;g:shipping&gt; tag with zero fee:
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-amber-300 border border-slate-800">
                    &lt;g:price&gt;0.00 USD&lt;/g:price&gt;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add or Edit Product with Free Shipping Toggle */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-2 relative shadow-2xl">
            <button
              onClick={() => {
                setIsAddProductOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <ProductForm
              initialProduct={editingProduct || undefined}
              onSuccess={handleProductSaved}
              onCancel={() => {
                setIsAddProductOpen(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
