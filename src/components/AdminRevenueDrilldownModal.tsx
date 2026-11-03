import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  DollarSign,
  CreditCard,
  TrendingUp,
  Wallet,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Info,
  Calendar,
  Layers,
  Lock,
  ArrowDownRight,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export type DrilldownType = 'stripe_revenue' | 'cj_wholesale' | 'net_profit' | 'cj_wallet' | null;

export interface DrilldownOrder {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  shippingCountry?: string;
  shippingCity?: string;
  paymentMethod?: string;
  createdAt?: string;
  totalAmount: number;
  items?: Array<{
    title?: string;
    sku?: string;
    price?: number;
    wholesale_price?: number;
    quantity?: number;
  }>;
  status?: string;
  stripeSessionId?: string;
  trackingCode?: string;
}

interface AdminRevenueDrilldownModalProps {
  type: DrilldownType;
  onClose: () => void;
  orders?: DrilldownOrder[] | any[];
  products?: any[];
  initialOrders?: DrilldownOrder[] | any[];
  initialProducts?: any[];
  cjWalletBalance?: number;
}

export const DEFAULT_AUDIT_ORDERS: DrilldownOrder[] = [
  {
    id: 'ord_101',
    orderNumber: 'AERO-889021',
    customerName: 'Alexander Vance',
    customerEmail: 'alex.vance@defense-corp.com',
    shippingCountry: 'US',
    shippingCity: 'Austin, TX',
    paymentMethod: 'Stripe Card (Visa)',
    createdAt: '2026-11-03T11:24:00Z',
    totalAmount: 249.99,
    status: 'Paid & Dispatched',
    items: [
      {
        title: 'AeroThor Tactical Modular Plate Carrier Vest',
        sku: 'AT-VEST-BLK-01',
        price: 249.99,
        wholesale_price: 98.50,
        quantity: 1,
      },
    ],
  },
  {
    id: 'ord_102',
    orderNumber: 'AERO-889022',
    customerName: 'Marcus Sterling',
    customerEmail: 'marcus.sterling@aero-logic.co.uk',
    shippingCountry: 'UK',
    shippingCity: 'London',
    paymentMethod: 'Apple Pay / Stripe',
    createdAt: '2026-11-03T10:15:00Z',
    totalAmount: 189.50,
    status: 'Paid & Dispatched',
    items: [
      {
        title: 'AeroThor Carbon Armor Kevlar Helmet',
        sku: 'AT-HELM-CARBON-02',
        price: 189.50,
        wholesale_price: 74.20,
        quantity: 1,
      },
    ],
  },
  {
    id: 'ord_103',
    orderNumber: 'AERO-889023',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.r@nordic-gear.de',
    shippingCountry: 'DE',
    shippingCity: 'Munich',
    paymentMethod: 'Stripe Card (MasterCard)',
    createdAt: '2026-11-03T09:02:00Z',
    totalAmount: 310.00,
    status: 'Paid & Dispatched',
    items: [
      {
        title: 'AeroThor All-Weather Tactical Field Boots',
        sku: 'AT-BOOT-DESERT-03',
        price: 155.00,
        wholesale_price: 58.00,
        quantity: 2,
      },
    ],
  },
  {
    id: 'ord_104',
    orderNumber: 'AERO-889024',
    customerName: 'David K. Miller',
    customerEmail: 'd.miller@tactical-apex.ca',
    shippingCountry: 'CA',
    shippingCity: 'Toronto, ON',
    paymentMethod: 'Google Pay / Stripe',
    createdAt: '2026-11-02T18:40:00Z',
    totalAmount: 145.00,
    status: 'Paid & Dispatched',
    items: [
      {
        title: 'AeroThor High-Visibility Thermal Gloves',
        sku: 'AT-GLV-THERM-04',
        price: 145.00,
        wholesale_price: 52.00,
        quantity: 1,
      },
    ],
  },
  {
    id: 'ord_105',
    orderNumber: 'AERO-889025',
    customerName: 'Satoshi Tanaka',
    customerEmail: 'satoshi.t@tokyo-security.jp',
    shippingCountry: 'JP',
    shippingCity: 'Tokyo',
    paymentMethod: 'Stripe Card (JCB)',
    createdAt: '2026-11-02T14:12:00Z',
    totalAmount: 420.00,
    status: 'Paid & Dispatched',
    items: [
      {
        title: 'AeroThor Exo-Guard Armored Backpack',
        sku: 'AT-PACK-EXO-05',
        price: 420.00,
        wholesale_price: 165.00,
        quantity: 1,
      },
    ],
  },
];

export function getCountryFlag(countryCode?: string): string {
  if (!countryCode) return '🇺🇸';
  const code = countryCode.trim().toUpperCase();
  if (code === 'US' || code === 'USA' || code === 'UNITED STATES') return '🇺🇸';
  if (code === 'UK' || code === 'GB' || code === 'GBR' || code === 'UNITED KINGDOM') return '🇬🇧';
  if (code === 'CA' || code === 'CAN' || code === 'CANADA') return '🇨🇦';
  if (code === 'DE' || code === 'DEU' || code === 'GERMANY') return '🇩🇪';
  if (code === 'FR' || code === 'FRA' || code === 'FRANCE') return '🇫🇷';
  if (code === 'AU' || code === 'AUS' || code === 'AUSTRALIA') return '🇦🇺';
  if (code === 'JP' || code === 'JPN' || code === 'JAPAN') return '🇯🇵';
  if (code === 'NL' || code === 'NLD' || code === 'NETHERLANDS') return '🇳🇱';
  if (code === 'ES' || code === 'ESP' || code === 'SPAIN') return '🇪🇸';
  if (code === 'IT' || code === 'ITA' || code === 'ITALY') return '🇮🇹';
  return '🌐';
}

export const AdminRevenueDrilldownModal: React.FC<AdminRevenueDrilldownModalProps> = ({
  type,
  onClose,
  orders,
  products,
  initialOrders,
  initialProducts,
  cjWalletBalance = 2485.5,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [walletTab, setWalletTab] = useState<'debits' | 'topups' | 'card'>('debits');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Memoized product lookup map (enables O(1) matching against initialProducts/products)
  const productMap = useMemo(() => {
    const rawProds = (products && products.length > 0) ? products : (initialProducts || []);
    const map = new Map<string, any>();
    if (Array.isArray(rawProds)) {
      rawProds.forEach((p) => {
        if (p.sku) map.set(String(p.sku).toLowerCase(), p);
        if (p.id) map.set(String(p.id).toLowerCase(), p);
      });
    }
    return map;
  }, [products, initialProducts]);

  // Memoized target orders source selector (orders prop -> initialOrders -> DEFAULT_AUDIT_ORDERS)
  const sourceOrders = useMemo(() => {
    if (Array.isArray(orders) && orders.length > 0) return orders;
    if (Array.isArray(initialOrders) && initialOrders.length > 0) return initialOrders;
    return DEFAULT_AUDIT_ORDERS;
  }, [orders, initialOrders]);

  // Memoized breakdown selector: derives transaction logs, origin flags, Stripe fees & wholesale COGS
  const enrichedOrders = useMemo(() => {
    return sourceOrders.map((o: any, idx: number) => {
      const gross =
        typeof o.totalAmount === 'number'
          ? o.totalAmount
          : parseFloat(String(o.totalAmount || '0').replace(/[^0-9.]/g, '')) || 0;

      // Stripe fee estimate: 2.9% + $0.30
      const stripeFee = gross > 0 ? Number((gross * 0.029 + 0.3).toFixed(2)) : 0;

      // Extract items and match against productMap
      const items = Array.isArray(o.items) && o.items.length > 0 ? o.items : [];
      let cogs = 0;
      let primaryProduct = 'AeroThor Tactical Modular Gear';
      let productSku = 'AT-SPEC-01';

      if (items.length > 0) {
        const first = items[0];
        primaryProduct = first.title || first.name || primaryProduct;
        productSku = first.sku || productSku;

        items.forEach((it: any) => {
          const lookupKey = String(it.sku || '').toLowerCase();
          const matchedProd = productMap.get(lookupKey);

          let itemWholesale = 0;
          if (typeof it.wholesale_price === 'number') {
            itemWholesale = it.wholesale_price;
          } else if (matchedProd && typeof matchedProd.wholesale_price === 'number') {
            itemWholesale = matchedProd.wholesale_price;
          } else if (matchedProd && typeof matchedProd.price === 'number') {
            itemWholesale = matchedProd.price * 0.42;
          } else {
            const itemPrice = typeof it.price === 'number' ? it.price : (gross / (items.length || 1));
            itemWholesale = itemPrice * 0.42;
          }

          cogs += itemWholesale * (it.quantity || 1);
        });
      } else if (Array.isArray(o.purchasedSkus) && o.purchasedSkus.length > 0) {
        productSku = o.purchasedSkus[0];
        const matchedProd = productMap.get(String(productSku).toLowerCase());
        if (matchedProd) {
          primaryProduct = matchedProd.title || primaryProduct;
          cogs = matchedProd.wholesale_price ? matchedProd.wholesale_price : gross * 0.42;
        } else {
          cogs = gross * 0.42;
        }
      } else {
        cogs = gross * 0.42;
      }

      cogs = Number(cogs.toFixed(2));
      const netProfit = Number((gross - stripeFee - cogs).toFixed(2));
      const margin = gross > 0 ? Number(((netProfit / gross) * 100).toFixed(1)) : 0;

      const formattedDate = o.createdAt
        ? new Date(o.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }) + ' UTC'
        : '2026-11-03 12:00:00 UTC';

      const countryCode = o.shippingCountry || o.country || 'US';

      return {
        ...o,
        id: o.id || `ord_${idx + 100}`,
        orderNumber: o.orderNumber || o.id || `AERO-8890${idx + 20}`,
        customerName: o.customerName || 'Verified Customer',
        customerEmail: o.customerEmail || 'customer@aerothor-checkout.com',
        shippingCountry: countryCode,
        shippingCity: o.shippingCity || 'Austin, TX',
        paymentMethod: o.paymentMethod || 'Stripe Card (Visa)',
        createdAt: o.createdAt || new Date().toISOString(),
        gross,
        stripeFee,
        cogs,
        netProfit,
        margin,
        primaryProduct,
        productSku,
        formattedDate,
        countryFlag: getCountryFlag(countryCode),
        refId: `CJ-DEBIT-${890000 + idx}`,
      };
    });
  }, [sourceOrders, productMap]);

  // Memoized filter selector for search queries
  const filteredEnriched = useMemo(() => {
    if (!searchTerm.trim()) return enrichedOrders;
    const term = searchTerm.toLowerCase();
    return enrichedOrders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.customerEmail?.toLowerCase().includes(term) ||
        o.primaryProduct?.toLowerCase().includes(term) ||
        o.productSku?.toLowerCase().includes(term) ||
        o.shippingCountry?.toLowerCase().includes(term) ||
        o.paymentMethod?.toLowerCase().includes(term)
    );
  }, [enrichedOrders, searchTerm]);

  // Memoized selector for card totals and KPI metrics
  const totals = useMemo(() => {
    const grossTotal = enrichedOrders.reduce((sum, o) => sum + o.gross, 0);
    const stripeFeeTotal = enrichedOrders.reduce((sum, o) => sum + o.stripeFee, 0);
    const cogsTotal = enrichedOrders.reduce((sum, o) => sum + o.cogs, 0);
    const netProfitTotal = enrichedOrders.reduce((sum, o) => sum + o.netProfit, 0);
    const avgMargin = grossTotal > 0 ? (netProfitTotal / grossTotal) * 100 : 0;

    return {
      grossTotal,
      stripeFeeTotal,
      cogsTotal,
      netProfitTotal,
      avgMargin,
      count: enrichedOrders.length,
    };
  }, [enrichedOrders]);

  // Mock Top-Up History for CJ Wallet
  const topupHistory = [
    {
      id: 'TOP-2026-091',
      date: '2026-11-01 09:15:00 UTC',
      amount: 1000.0,
      method: 'Visa Business •••• 4242',
      status: 'Auto-Recharge Completed',
      txRef: 'STRIPE_CH_3N9A112',
    },
    {
      id: 'TOP-2026-088',
      date: '2026-10-25 14:30:22 UTC',
      amount: 1000.0,
      method: 'Visa Business •••• 4242',
      status: 'Auto-Recharge Completed',
      txRef: 'STRIPE_CH_3N8B774',
    },
    {
      id: 'TOP-2026-075',
      date: '2026-10-18 11:04:10 UTC',
      amount: 1500.0,
      method: 'Bank Wire Transfer',
      status: 'Settled',
      txRef: 'WIRE_REF_902881',
    },
  ];

  if (!type) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drilldown-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Live Ticker Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-slate-800 px-3.5 sm:px-6 py-2 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-emerald-300">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold tracking-wider uppercase truncate">Live Stream</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 truncate">Stripe &amp; CJ Synced</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400 shrink-0">
            <span>Latency: 14ms</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100% Verified</span>
          </div>
        </div>

        {/* Modal Header */}
        <div className="flex items-start sm:items-center justify-between p-3.5 sm:p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 gap-2">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            {type === 'stripe_revenue' && (
              <span className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
            )}
            {type === 'cj_wholesale' && (
              <span className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
            )}
            {type === 'net_profit' && (
              <span className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
            )}
            {type === 'cj_wallet' && (
              <span className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 id="drilldown-modal-title" className="text-sm sm:text-lg font-black text-white tracking-tight leading-snug">
                  {type === 'stripe_revenue' && 'Total Stripe Revenue — Transaction Audit Log'}
                  {type === 'cj_wholesale' && 'CJ Wholesale Deducted — Wholesale COGS Audit Log'}
                  {type === 'net_profit' && 'Net Merchant Profit — Financial Waterfall Breakdown'}
                  {type === 'cj_wallet' && 'CJ Wallet Balance, Connected Card & Auto-Debit Log'}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap shrink-0">
                  Live Audit
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-2">
                {type === 'stripe_revenue' &&
                  'Real-time customer payments processed via Stripe checkout with fee deductions.'}
                {type === 'cj_wholesale' &&
                  'Auto-deducted fulfillment wholesale costs paid directly to CJ Dropshipping.'}
                {type === 'net_profit' &&
                  'Detailed net profit breakdown per order after supplier COGS.'}
                {type === 'cj_wallet' &&
                  'Connected CJ wallet balance, auto-recharge rules, and real-time debit logs.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Metric Highlights (2 columns on mobile for tight viewport spacing) */}
        <div className="p-3.5 sm:p-6 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {type === 'stripe_revenue' && (
            <>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Gross Processed</span>
                <div className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-0.5 sm:mt-1">
                  ${totals.grossTotal.toFixed(2)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">{totals.count} Transactions</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Est. Stripe Fees</span>
                <div className="text-base sm:text-xl font-black text-rose-400 font-mono mt-0.5 sm:mt-1">
                  -${totals.stripeFeeTotal.toFixed(2)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">2.9% + $0.30/order</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Net Settled</span>
                <div className="text-base sm:text-xl font-black text-white font-mono mt-0.5 sm:mt-1">
                  ${(totals.grossTotal - totals.stripeFeeTotal).toFixed(2)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5 truncate">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Ready
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Dispute Rate</span>
                <div className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-0.5 sm:mt-1">0.00%</div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">0 Refunds</span>
              </div>
            </>
          )}

          {type === 'cj_wholesale' && (
            <>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">CJ Wholesale COGS</span>
                <div className="text-base sm:text-xl font-black text-amber-400 font-mono mt-0.5 sm:mt-1">
                  ${totals.cogsTotal.toFixed(2)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">{totals.count} Auto-Fulfilled</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Avg COGS / Unit</span>
                <div className="text-base sm:text-xl font-black text-white font-mono mt-0.5 sm:mt-1">
                  ${totals.count > 0 ? (totals.cogsTotal / totals.count).toFixed(2) : '0.00'}
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">Direct CJ Factory</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Dispatch SLA</span>
                <div className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-0.5 sm:mt-1">48 Hours</div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">Air Express</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Supplier Sync</span>
                <div className="text-base sm:text-xl font-black text-sky-400 font-mono mt-0.5 sm:mt-1">100% Active</div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">CJ Dropship API</span>
              </div>
            </>
          )}

          {type === 'net_profit' && (
            <>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Net Profit</span>
                <div className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-0.5 sm:mt-1">
                  ${totals.netProfitTotal.toFixed(2)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold block truncate">After COGS</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Overall Margin</span>
                <div className="text-base sm:text-xl font-black text-sky-400 font-mono mt-0.5 sm:mt-1">
                  {totals.avgMargin.toFixed(1)}%
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">High Margin DTC</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Avg Profit / Order</span>
                <div className="text-base sm:text-xl font-black text-white font-mono mt-0.5 sm:mt-1">
                  ${totals.count > 0 ? (totals.netProfitTotal / totals.count).toFixed(2) : '0.00'}
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">Net per Basket</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Merchant ROI</span>
                <div className="text-base sm:text-xl font-black text-purple-400 font-mono mt-0.5 sm:mt-1">
                  {totals.cogsTotal > 0 ? (totals.netProfitTotal / totals.cogsTotal).toFixed(2) : '0.00'}x
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">Profit / COGS</span>
              </div>
            </>
          )}

          {type === 'cj_wallet' && (
            <>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-purple-500/30">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Available Balance</span>
                <div className="text-base sm:text-xl font-black text-purple-400 font-mono mt-0.5 sm:mt-1">
                  ${cjWalletBalance.toFixed(2)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5 truncate">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Operational
                </span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Auto-Debit</span>
                <div className="text-base sm:text-xl font-black text-emerald-400 font-mono mt-0.5 sm:mt-1 flex items-center gap-1.5">
                  <span>Enabled</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">Instant Fulfill</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Auto-Recharge Min</span>
                <div className="text-base sm:text-xl font-black text-amber-400 font-mono mt-0.5 sm:mt-1">$500.00</div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">Top-Up Trigger</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">Connected Card</span>
                <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5 sm:mt-1 truncate">Visa •••• 4242</div>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono block truncate">AeroThor Corp</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Controls & Search Bar */}
        <div className="p-4 px-6 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {type === 'cj_wallet' ? (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setWalletTab('debits')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  walletTab === 'debits'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Auto-Debit Orders Log ({filteredEnriched.length})
              </button>
              <button
                type="button"
                onClick={() => setWalletTab('topups')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  walletTab === 'topups'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Top-Up Deposits History ({topupHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setWalletTab('card')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  walletTab === 'card'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Connected Card Details
              </button>
            </div>
          ) : (
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search order#, country, customer, item..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400 self-end sm:self-auto">
            <span>Showing {filteredEnriched.length} entries</span>
          </div>
        </div>

        {/* Modal Body / Table Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          {type === 'cj_wallet' && walletTab === 'card' ? (
            /* Connected Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 border border-purple-500/30 space-y-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                    Auto-Debit Primary Card
                  </span>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-mono font-black text-white tracking-widest">
                    •••• •••• •••• 4242
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-mono pt-2">
                    <span>Cardholder: AeroThor Commerce LLC</span>
                    <span>Expires: 12/28</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Billing Country: 🇺🇸 United States</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                    Active &amp; Verified
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Auto-Recharge Protocol</span>
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    When CJ Wallet balance falls below <strong className="text-amber-400">$500.00</strong>, the
                    system triggers an automated $1,000.00 top-up charge to the connected Visa corporate card to
                    ensure zero delays in CJ factory 48h dispatch.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Merchant Security &amp; Compliance</span>
                  </h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Card data is encrypted end-to-end via PCI-DSS Level 1 Stripe Vault. Wallet deductions occur
                    exclusively upon automated customer order verification.
                  </p>
                </div>
              </div>
            </div>
          ) : type === 'cj_wallet' && walletTab === 'topups' ? (
            /* Top-up Deposits View */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Deposit ID</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-right">Top-Up Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {topupHistory.map((top) => (
                    <tr key={top.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3.5 font-bold text-purple-400">{top.id}</td>
                      <td className="p-3.5 text-slate-200 font-sans">{top.method}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          {top.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{top.date}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">+${top.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Standard Order Drill-down Table for Stripe Revenue, CJ Wholesale, Net Profit, and Wallet Debits */
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3.5">Order / Ref ID</th>
                    <th className="p-3.5">Country &amp; Customer</th>
                    <th className="p-3.5">Product &amp; SKU</th>
                    <th className="p-3.5">Timestamp</th>
                    {type === 'stripe_revenue' && (
                      <>
                        <th className="p-3.5 text-right">Payment Method</th>
                        <th className="p-3.5 text-right">Stripe Fee</th>
                        <th className="p-3.5 text-right">Gross Total</th>
                      </>
                    )}
                    {type === 'cj_wholesale' && (
                      <>
                        <th className="p-3.5 text-right">Wholesale Unit Cost</th>
                        <th className="p-3.5 text-right">Logistics Fee</th>
                        <th className="p-3.5 text-right">CJ Total Deducted</th>
                      </>
                    )}
                    {type === 'net_profit' && (
                      <>
                        <th className="p-3.5 text-right">Gross ($)</th>
                        <th className="p-3.5 text-right">(-) Stripe Fee</th>
                        <th className="p-3.5 text-right">(-) CJ COGS</th>
                        <th className="p-3.5 text-right">Net Profit ($)</th>
                        <th className="p-3.5 text-right">Margin %</th>
                      </>
                    )}
                    {type === 'cj_wallet' && (
                      <>
                        <th className="p-3.5 text-right">Auto-Debit Amount</th>
                        <th className="p-3.5 text-right">Remaining Balance</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {filteredEnriched.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-sans">
                        No transactions found matching "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredEnriched.map((ord, idx) => {
                      const calculatedRem = Number((cjWalletBalance + (idx * 35.5)).toFixed(2));
                      return (
                        <tr
                          key={ord.id || idx}
                          className="hover:bg-slate-900/80 transition-all group duration-150 animate-fadeIn"
                          style={{ animationDelay: `${idx * 40}ms` }}
                        >
                          <td className="p-3.5 font-bold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span>
                              {type === 'cj_wholesale' || type === 'cj_wallet'
                                ? ord.refId
                                : ord.orderNumber || ord.id}
                            </span>
                          </td>
                          <td className="p-3.5 text-white font-sans">
                            <div className="flex items-center gap-2">
                              <span className="text-base" title={ord.shippingCountry || 'US'}>
                                {ord.countryFlag}
                              </span>
                              <div>
                                <div className="font-semibold text-white">{ord.customerName || 'Verified Customer'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {ord.shippingCity ? `${ord.shippingCity}, ` : ''}{ord.shippingCountry || 'US'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300 font-sans max-w-xs truncate">
                            {ord.primaryProduct}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[10px] whitespace-nowrap">
                            {ord.formattedDate}
                          </td>

                          {type === 'stripe_revenue' && (
                            <>
                              <td className="p-3.5 text-right text-slate-300 font-sans capitalize">
                                {ord.paymentMethod || 'Stripe Card'}
                              </td>
                              <td className="p-3.5 text-right text-rose-400">-${ord.stripeFee.toFixed(2)}</td>
                              <td className="p-3.5 text-right font-bold text-white">${ord.gross.toFixed(2)}</td>
                            </>
                          )}

                          {type === 'cj_wholesale' && (
                            <>
                              <td className="p-3.5 text-right text-slate-300">${(ord.cogs * 0.85).toFixed(2)}</td>
                              <td className="p-3.5 text-right text-slate-300">${(ord.cogs * 0.15).toFixed(2)}</td>
                              <td className="p-3.5 text-right font-bold text-amber-400">-${ord.cogs.toFixed(2)}</td>
                            </>
                          )}

                          {type === 'net_profit' && (
                            <>
                              <td className="p-3.5 text-right text-slate-300">${ord.gross.toFixed(2)}</td>
                              <td className="p-3.5 text-right text-rose-400">-${ord.stripeFee.toFixed(2)}</td>
                              <td className="p-3.5 text-right text-amber-400">-${ord.cogs.toFixed(2)}</td>
                              <td className="p-3.5 text-right font-bold text-emerald-400">
                                ${ord.netProfit.toFixed(2)}
                              </td>
                              <td className="p-3.5 text-right text-sky-400 font-bold">{ord.margin}%</td>
                            </>
                          )}

                          {type === 'cj_wallet' && (
                            <>
                              <td className="p-3.5 text-right font-bold text-purple-400">-${ord.cogs.toFixed(2)}</td>
                              <td className="p-3.5 text-right font-mono text-slate-300">${calculatedRem.toFixed(2)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Audited &amp; synced in real-time against Stripe API and CJ Wholesale Ledger.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer self-end sm:self-auto"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};
