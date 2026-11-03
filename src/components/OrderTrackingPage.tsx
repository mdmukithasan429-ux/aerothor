import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';

export type OrderStatusType =
  | 'Paid - Ready for CJ Fulfill'
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface TrackedOrderItem {
  sku: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface TrackedOrderResult {
  id: string;
  orderNumber: string;
  trackingCode: string;
  status: OrderStatusType;
  customerName: string;
  customerEmail: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  carrier: string;
  estimatedDelivery: string;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
  items: TrackedOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

interface OrderTrackingPageProps {
  onBackToStore?: () => void;
  initialQuery?: string;
}

const STATUS_STEPS: {
  key: OrderStatusType;
  label: string;
  description: string;
}[] = [
  {
    key: 'Paid - Ready for CJ Fulfill',
    label: 'Paid — Ready for CJ Fulfill',
    description: 'Stripe payment verified; ready for manual CJ Dropshipping dispatch.',
  },
  {
    key: 'Processing',
    label: 'Processing at Warehouse',
    description: 'Items inspected, packed, and labeled for dispatch.',
  },
  {
    key: 'Shipped',
    label: 'Shipped & In Transit',
    description: 'Handed over to domestic carrier with live tracking.',
  },
  {
    key: 'Delivered',
    label: 'Delivered',
    description: 'Package delivered to destination address.',
  },
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  onBackToStore,
  initialQuery = '',
}) => {
  const [lookupInput, setLookupInput] = useState<string>(() => {
    if (initialQuery) return initialQuery;
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('order') || params.get('tracking') || params.get('q') || '';
    } catch {
      return '';
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrderResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleLookup = async (queryOverride?: string) => {
    const query = (queryOverride !== undefined ? queryOverride : lookupInput).trim();
    if (!query) {
      setError('Please enter your Order Number (e.g., ORD-2026-884120) or Tracking Code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' },
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error('Unexpected response from tracking server.');
      }

      if (!res.ok || !data.order) {
        throw new Error(
          data.error ||
            `No order found matching "${query}". Check your Order Number or Tracking Code and try again.`
        );
      }

      setOrder(data.order);
    } catch (err: any) {
      setOrder(null);
      setError(err.message || 'Unable to retrieve tracking information right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lookupInput.trim()) {
      handleLookup(lookupInput.trim());
    }
  }, []);

  const copyValue = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getActiveStepIndex = (status: OrderStatusType): number => {
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 1 : idx;
  };

  const activeStepIndex = order ? getActiveStepIndex(order.status) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        {onBackToStore && (
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>
        )}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Real-Time Carrier &amp; Warehouse Telemetry</span>
        </div>
      </div>

      {/* Hero Search Card */}
      <section className="p-6 sm:p-10 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            Order &amp; Shipment Tracker · /track-order
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Track Your Order Status in Real Time
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Enter your <strong className="text-slate-200">Order Number</strong> (e.g.{' '}
            <code className="text-emerald-400 font-mono">ORD-2026-884120</code>) or{' '}
            <strong className="text-slate-200">Carrier Tracking Code</strong> (e.g.{' '}
            <code className="text-emerald-400 font-mono">940011189956482100</code>) below for live warehouse and courier updates.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="Enter Order Number (ORD-2026-...) or Tracking Code..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                <span>Track Package</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Lookup Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Sample Orders:</span>
          </span>
          {[
            { label: 'ORD-2026-884120 (Shipped)', value: 'ORD-2026-884120' },
            { label: 'ORD-2026-773019 (Processing)', value: 'ORD-2026-773019' },
            { label: '940011189956901122 (Delivered)', value: '940011189956901122' },
          ].map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                setLookupInput(chip.value);
                handleLookup(chip.value);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-800 font-mono text-[11px] transition-colors cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Live Tracking Result Card */}
      {order && (
        <section className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl space-y-6 p-6 sm:p-8">
          {/* Top Summary Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                  {order.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyValue(order.orderNumber, 'orderNumber')}
                  className="p-1 text-slate-400 hover:text-white rounded bg-slate-800/80"
                  title="Copy Order Number"
                >
                  {copiedField === 'orderNumber' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    order.status === 'Delivered'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : order.status === 'Shipped'
                      ? 'bg-sky-950/80 text-sky-300 border-sky-500/40'
                      : order.status === 'Processing'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Placed on {new Date(order.createdAt).toLocaleDateString()} · Recipient:{' '}
                <strong className="text-slate-200">{order.customerName}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:items-end justify-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Carrier Tracking Code ({order.carrier || 'USPS / Royal Mail'})
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {order.trackingCode || 'Awaiting Carrier Assignment'}
                </span>
                {order.trackingCode && (
                  <button
                    type="button"
                    onClick={() => copyValue(order.trackingCode, 'trackingCode')}
                    className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
                    title="Copy Tracking Code"
                  >
                    {copiedField === 'trackingCode' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4-Stage Progress Stepper */}
          <div className="py-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= activeStepIndex;
                const isCurrent = index === activeStepIndex;
                return (
                  <div
                    key={step.key}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                        : isCompleted
                        ? 'bg-slate-950/80 border-emerald-500/20'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">{step.label}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Destination</span>
              </div>
              <p className="text-xs font-bold text-white">
                {order.shippingCity}, {order.shippingState} · {order.shippingCountry}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estimated Delivery</span>
              </div>
              <p className="text-xs font-bold text-emerald-400">
                {order.status === 'Delivered' ? 'Delivered' : order.estimatedDelivery}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Order Total</span>
              </div>
              <p className="text-xs font-bold text-white font-mono">
                ${Number(order.totalAmount || 0).toFixed(2)} {order.currency || 'USD'}
              </p>
            </div>
          </div>

          {/* Shipment Items */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Items in This Shipment ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
              {(order.items || []).map((item, idx) => (
                <div key={`${item.sku}-${idx}`} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        SKU: {item.sku} · Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-emerald-400 shrink-0">
                    ${(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
