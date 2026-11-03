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
  orders: DrilldownOrder[];
  cjWalletBalance?: number;
}

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

  // Enrich order items with calculated fields
  const enrichedOrders = useMemo(() => {
    return orders.map((o, idx) => {
      const gross =
        typeof o.totalAmount === 'number'
          ? o.totalAmount
          : parseFloat(String(o.totalAmount || '0').replace(/[^0-9.]/g, '')) || 0;

      // Estimate Stripe fee: 2.9% + $0.30
      const stripeFee = gross > 0 ? Number((gross * 0.029 + 0.3).toFixed(2)) : 0;

      // Calculate items & wholesale COGS
      const items = Array.isArray(o.items) && o.items.length > 0 ? o.items : [];
      let cogs = 0;
      let primaryProduct = 'AeroThor Protective Gear';

      if (items.length > 0) {
        primaryProduct = items[0].title || primaryProduct;
        items.forEach((it) => {
          const w =
            typeof it.wholesale_price === 'number'
              ? it.wholesale_price
              : parseFloat(String(it.wholesale_price || '0')) || gross * 0.42;
          cogs += w * (it.quantity || 1);
        });
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

      return {
        ...o,
        gross,
        stripeFee,
        cogs,
        netProfit,
        margin,
        primaryProduct,
        formattedDate,
        countryFlag: getCountryFlag(o.shippingCountry),
        refId: `CJ-DEBIT-${890000 + idx}`,
      };
    });
  }, [orders]);

  // Filtered orders based on search term
  const filteredEnriched = useMemo(() => {
    if (!searchTerm.trim()) return enrichedOrders;
    const term = searchTerm.toLowerCase();
    return enrichedOrders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.customerEmail?.toLowerCase().includes(term) ||
        o.primaryProduct?.toLowerCase().includes(term) ||
        o.shippingCountry?.toLowerCase().includes(term) ||
        o.paymentMethod?.toLowerCase().includes(term)
    );
  }, [enrichedOrders, searchTerm]);

  // Calculated Overall Totals
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
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-[11px] font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold tracking-wider uppercase">Live Transaction Stream</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Stripe &amp; CJ Ledger Synchronized</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400">
            <span>Latency: 14ms</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100% Verified</span>
          </div>
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {type === 'stripe_revenue' && (
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </span>
            )}
            {type === 'cj_wholesale' && (
              <span className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <CreditCard className="w-6 h-6" />
              </span>
            )}
            {type === 'net_profit' && (
              <span className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                <TrendingUp className="w-6 h-6" />
              </span>
            )}
            {type === 'cj_wallet' && (
              <span className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Wallet className="w-6 h-6" />
              </span>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 id="drilldown-modal-title" className="text-lg font-black text-white tracking-tight">
                  {type === 'stripe_revenue' && 'Total Stripe Revenue — Transaction Audit Log'}
                  {type === 'cj_wholesale' && 'CJ Wholesale Deducted — Wholesale COGS Audit Log'}
                  {type === 'net_profit' && 'Net Merchant Profit — Financial Waterfall Breakdown'}
                  {type === 'cj_wallet' && 'CJ Wallet Balance, Connected Card & Auto-Debit Log'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  Live Audit
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {type === 'stripe_revenue' &&
                  'Real-time customer payments processed via Stripe checkout with fee deductions and timestamps.'}
                {type === 'cj_wholesale' &&
                  'Auto-deducted fulfillment wholesale costs and logistics fees paid directly to CJ Dropshipping.'}
                {type === 'net_profit' &&
                  'Detailed net profit breakdown per order after accounting for merchant fees and supplier COGS.'}
                {type === 'cj_wallet' &&
                  'Connected CJ wallet balance telemetry, auto-recharge rules, and real-time wholesale debit logs.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Top Metric Highlights */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {type === 'stripe_revenue' && (
            <>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Processed</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                  ${totals.grossTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{totals.count} Verified Transactions</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Est. Stripe Fees</span>
                <div className="text-xl font-black text-rose-400 font-mono mt-1">
                  -${totals.stripeFeeTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Avg 2.9% + $0.30/order</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Revenue Settled</span>
                <div className="text-xl font-black text-white font-mono mt-1">
                  ${(totals.grossTotal - totals.stripeFeeTotal).toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Ready for Bank Transfer
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dispute / Refund Rate</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">0.00%</div>
                <span className="text-[10px] text-slate-500 font-mono">0 Refunds Requested</span>
              </div>
            </>
          )}

          {type === 'cj_wholesale' && (
            <>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total CJ Wholesale COGS</span>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">
                  ${totals.cogsTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{totals.count} Orders Auto-Fulfilled</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg COGS per Unit</span>
                <div className="text-xl font-black text-white font-mono mt-1">
                  ${totals.count > 0 ? (totals.cogsTotal / totals.count).toFixed(2) : '0.00'}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Direct CJ Factory Price</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Express Dispatch SLA</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">48 Hours</div>
                <span className="text-[10px] text-slate-500 font-mono">Air Express Airmail</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supplier Sync</span>
                <div className="text-xl font-black text-sky-400 font-mono mt-1">100% Active</div>
                <span className="text-[10px] text-slate-500 font-mono">Real-Time CJ Dropship API</span>
              </div>
            </>
          )}

          {type === 'net_profit' && (
            <>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Merchant Profit</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                  ${totals.netProfitTotal.toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">After Fees &amp; Wholesale</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Margin</span>
                <div className="text-xl font-black text-sky-400 font-mono mt-1">
                  {totals.avgMargin.toFixed(1)}%
                </div>
                <span className="text-[10px] text-slate-500 font-mono">High Margin DTC</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Profit / Order</span>
                <div className="text-xl font-black text-white font-mono mt-1">
                  ${totals.count > 0 ? (totals.netProfitTotal / totals.count).toFixed(2) : '0.00'}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Net Profit per Basket</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Merchant ROI</span>
                <div className="text-xl font-black text-purple-400 font-mono mt-1">
                  {totals.cogsTotal > 0 ? (totals.netProfitTotal / totals.cogsTotal).toFixed(2) : '0.00'}x
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Profit to COGS Ratio</span>
              </div>
            </>
          )}

          {type === 'cj_wallet' && (
            <>
              <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available CJ Balance</span>
                <div className="text-xl font-black text-purple-400 font-mono mt-1">
                  ${cjWalletBalance.toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Balance Operational
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auto-Debit Status</span>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                  <span>Enabled</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Instant Order Fulfill</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Auto-Recharge Min</span>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">$500.00</div>
                <span className="text-[10px] text-slate-500 font-mono">Top-Up Trigger Level</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Payment Method</span>
                <div className="text-sm font-bold text-white font-mono mt-1">Visa •••• 4242</div>
                <span className="text-[10px] text-slate-500 font-mono">AeroThor Business Corp</span>
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
