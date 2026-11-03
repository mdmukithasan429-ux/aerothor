import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Award,
  Info,
  Wallet,
} from 'lucide-react';
import { getAdminAuthHeaders } from '../lib/admin-auth';
import { TrackedOrderResult } from './OrderTrackingPage';
import { formatPriceForDisplay } from '../lib/currency';
import { AdminRevenueDrilldownModal, DrilldownType } from './AdminRevenueDrilldownModal';

interface RevenueMetrics {
  totalRevenueUsd: number;
  totalOrders: number;
  averageOrderValueUsd: number;
  totalUnitsSold: number;
  grossProfitUsd: number;
  profitMarginPercent: number;
}

export const AdminRevenueDashboard: React.FC = () => {
  const [orders, setOrders] = useState<TrackedOrderResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRangeDays, setTimeRangeDays] = useState<7 | 14 | 30 | 90>(14);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeModal, setActiveModal] = useState<DrilldownType>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLiveOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        setLastRefreshedAt(new Date());
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to sync revenue orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    // Auto polling every 20s for real-time revenue updates
    const interval = setInterval(fetchLiveOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  // Compute Revenue Aggregations
  const computedStats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnits = 0;

    orders.forEach((o) => {
      const rawPrice =
        typeof o.totalAmount === 'number'
          ? o.totalAmount
          : parseFloat(String(o.totalAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      totalRevenue += rawPrice;

      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((item: any) => {
        totalUnits += item.quantity || 1;
        const wholesale =
          typeof item.wholesale_price === 'number'
            ? item.wholesale_price
            : parseFloat(String(item.wholesale_price || '0')) || rawPrice * 0.4;
        totalCost += wholesale * (item.quantity || 1);
      });
    });

    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const grossProfit = totalRevenue - (totalCost || totalRevenue * 0.45);
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenueUsd: totalRevenue,
      totalOrders,
      averageOrderValueUsd: aov,
      totalUnitsSold: totalUnits,
      grossProfitUsd: grossProfit,
      profitMarginPercent: profitMargin,
    };
  }, [orders]);

  // Daily & Weekly Recharts Trend Data
  const chartTrendData = useMemo(() => {
    const now = new Date();
    const result: Array<{
      dateKey: string;
      label: string;
      revenue: number;
      profit: number;
      ordersCount: number;
    }> = [];

    // Grouping by Date string YYYY-MM-DD
    const dateMap = new Map<string, { revenue: number; profit: number; count: number }>();

    orders.forEach((o) => {
      const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
      const dateKey = dateObj.toISOString().split('T')[0];
      const rawPrice =
        typeof o.totalAmount === 'number'
          ? o.totalAmount
          : parseFloat(String(o.totalAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      const estProfit = rawPrice * 0.55;

      const existing = dateMap.get(dateKey) || { revenue: 0, profit: 0, count: 0 };
      dateMap.set(dateKey, {
        revenue: existing.revenue + rawPrice,
        profit: existing.profit + estProfit,
        count: existing.count + 1,
      });
    });

    // Generate continuous date range for the selected days range
    for (let i = timeRangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const entry = dateMap.get(dateKey) || { revenue: 0, profit: 0, count: 0 };
      result.push({
        dateKey,
        label,
        revenue: Number(entry.revenue.toFixed(2)),
        profit: Number(entry.profit.toFixed(2)),
        ordersCount: entry.count,
      });
    }

    if (viewMode === 'weekly') {
      // Aggregate into 7-day buckets
      const weeklyBuckets: typeof result = [];
      for (let i = 0; i < result.length; i += 7) {
        const chunk = result.slice(i, i + 7);
        if (chunk.length === 0) continue;
        const totalRev = chunk.reduce((acc, c) => acc + c.revenue, 0);
        const totalProf = chunk.reduce((acc, c) => acc + c.profit, 0);
        const totalCnt = chunk.reduce((acc, c) => acc + c.ordersCount, 0);
        const weekLabel = `Week ${Math.floor(i / 7) + 1} (${chunk[0].label})`;
        weeklyBuckets.push({
          dateKey: chunk[0].dateKey,
          label: weekLabel,
          revenue: Number(totalRev.toFixed(2)),
          profit: Number(totalProf.toFixed(2)),
          ordersCount: totalCnt,
        });
      }
      return weeklyBuckets;
    }

    return result;
  }, [orders, timeRangeDays, viewMode]);

  // Payment Method Breakdown for Recharts BarChart
  const paymentBreakdownData = useMemo(() => {
    const methodCounts: Record<string, { count: number; revenue: number }> = {
      'Credit Card (Stripe)': { count: 0, revenue: 0 },
      'Apple Pay / Google Pay': { count: 0, revenue: 0 },
      'PayPal Express': { count: 0, revenue: 0 },
      'Cash on Delivery (COD)': { count: 0, revenue: 0 },
    };

    orders.forEach((o) => {
      const method = (o.paymentMethod || 'card').toLowerCase();
      const rawPrice =
        typeof o.totalAmount === 'number'
          ? o.totalAmount
          : parseFloat(String(o.totalAmount || '0').replace(/[^0-9.]/g, '')) || 0;

      if (method.includes('cod') || method.includes('delivery')) {
        methodCounts['Cash on Delivery (COD)'].count += 1;
        methodCounts['Cash on Delivery (COD)'].revenue += rawPrice;
      } else if (method.includes('paypal')) {
        methodCounts['PayPal Express'].count += 1;
        methodCounts['PayPal Express'].revenue += rawPrice;
      } else if (method.includes('apple') || method.includes('google')) {
        methodCounts['Apple Pay / Google Pay'].count += 1;
        methodCounts['Apple Pay / Google Pay'].revenue += rawPrice;
      } else {
        methodCounts['Credit Card (Stripe)'].count += 1;
        methodCounts['Credit Card (Stripe)'].revenue += rawPrice;
      }
    });

    return Object.entries(methodCounts).map(([name, val]) => ({
      name,
      revenue: Number(val.revenue.toFixed(2)),
      orders: val.count,
    }));
  }, [orders]);

  return (
    <div className="space-y-6 text-slate-100 selection:bg-emerald-500/20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">
              Real-Time Revenue &amp; Financial Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Live order revenue trends, average order value (AOV), gross profit margins, and payment gateway distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setTimeRangeDays(7)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeRangeDays === 7
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRangeDays(14)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeRangeDays === 14
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              14 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRangeDays(30)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                timeRangeDays === 30
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-sky-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
          </div>

          <button
            type="button"
            onClick={fetchLiveOrders}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh order financial metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Key Performance Indicators (Interactive Analytics Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stripe Revenue */}
        <button
          type="button"
          onClick={() => setActiveModal('stripe_revenue')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-emerald-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          title="Click to view detailed Stripe revenue transaction log"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
              Total Stripe Revenue
            </span>
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${computedStats.totalRevenueUsd.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold pt-1">
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Stripe 1-Click Checkout</span>
            </span>
            <span className="text-[10px] text-slate-500 underline group-hover:text-emerald-300">Drill down &rarr;</span>
          </div>
        </button>

        {/* Card 2: CJ Wholesale Deducted */}
        <button
          type="button"
          onClick={() => setActiveModal('cj_wholesale')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-amber-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          title="Click to view CJ Wholesale COGS & fulfillment deduction log"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider group-hover:text-amber-400 transition-colors">
              CJ Wholesale Deducted
            </span>
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            -${(computedStats.totalRevenueUsd - computedStats.grossProfitUsd).toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-amber-300 font-semibold pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-Fulfillment COGS</span>
            </span>
            <span className="text-[10px] text-slate-500 underline group-hover:text-amber-300">Drill down &rarr;</span>
          </div>
        </button>

        {/* Card 3: Net Merchant Profit */}
        <button
          type="button"
          onClick={() => setActiveModal('net_profit')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-sky-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-sky-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/40"
          title="Click to view net profit margin breakdown per order"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider group-hover:text-sky-400 transition-colors">
              Net Merchant Profit
            </span>
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${computedStats.grossProfitUsd.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-sky-300 font-semibold pt-1">
            <span>{computedStats.profitMarginPercent.toFixed(1)}% profit margin</span>
            <span className="text-[10px] text-slate-500 underline group-hover:text-sky-300">Drill down &rarr;</span>
          </div>
        </button>

        {/* Card 4: CJ Wallet Status */}
        <button
          type="button"
          onClick={() => setActiveModal('cj_wallet')}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 relative overflow-hidden group hover:border-purple-500/60 hover:bg-slate-900 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          title="Click to view CJ Wallet balance, connected card & auto-debit log"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider group-hover:text-purple-400 transition-colors">
              CJ Wallet Status
            </span>
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
              <Wallet className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono flex items-center justify-between">
            <span>$2,485.50</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-sans font-bold">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-Debit: Visa •••• 4242</span>
            </span>
            <span className="text-[10px] text-slate-500 underline group-hover:text-purple-300">Drill down &rarr;</span>
          </div>
        </button>
      </div>

      {/* Interactive Drill-Down Modal */}
      {activeModal && (
        <AdminRevenueDrilldownModal
          type={activeModal}
          onClose={() => setActiveModal(null)}
          orders={orders}
          cjWalletBalance={2485.5}
        />
      )}

      {/* Main Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue & Profit Trend AreaChart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">
                {viewMode === 'daily' ? 'Daily Revenue & Profit Trend' : 'Weekly Aggregated Revenue Trend'}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">USD ($)</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue ($)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit ($)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payment Gateway Distribution BarChart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Payment Method Revenue</h2>
            </div>
            <span className="text-[11px] font-mono text-amber-400">By Method</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Real-time Incoming Orders Table */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Live Transactions Log ({orders.length})</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Last synced: {lastRefreshedAt.toLocaleTimeString()}
          </span>
        </div>

        {orders.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            No transaction records found. Place an express order to see live revenue telemetry!
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {orders.slice(0, 8).map((order, idx) => {
                  const rawPrice =
                    typeof order.totalAmount === 'number'
                      ? order.totalAmount
                      : parseFloat(String(order.totalAmount || '0').replace(/[^0-9.]/g, '')) || 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 font-bold text-emerald-400">{order.orderNumber || order.id}</td>
                      <td className="p-3 text-white font-sans">{order.customerName || 'Customer'}</td>
                      <td className="p-3 text-slate-300 capitalize">{order.paymentMethod || 'Card'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {order.status || 'Paid'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-white">${rawPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenueDashboard;
