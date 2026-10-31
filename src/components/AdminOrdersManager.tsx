import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Truck,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Save,
  Copy,
  Check,
  X,
  Clock,
  Shield,
  Download,
} from 'lucide-react';
import { getAdminAuthHeaders } from '../lib/admin-auth';
import { OrderStatusType, TrackedOrderResult } from './OrderTrackingPage';

interface AdminOrdersManagerProps {
  onOpenPublicTracker?: (orderNumber: string) => void;
}

const ORDER_STATUS_OPTIONS: OrderStatusType[] = [
  'Paid - Ready for CJ Fulfill',
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
];

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({
  onOpenPublicTracker,
}) => {
  const [orders, setOrders] = useState<TrackedOrderResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatusType>('All');
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Local editable row state keyed by orderNumber
  const [draftEdits, setDraftEdits] = useState<
    Record<string, { status: OrderStatusType; trackingCode: string; carrier: string }>
  >({});

  // Create New Order Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    orderNumber: `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    customerName: 'Jordan Taylor',
    customerEmail: 'jordan.taylor@example.com',
    trackingCode: `940011189956${Math.floor(100000 + Math.random() * 900000)}`,
    carrier: 'USPS Priority Mail',
    status: 'Processing' as OrderStatusType,
    totalAmount: '64.99',
    productTitle: 'AeroThor Grade-1 Titanium Vacuum Commuter Flask',
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: getAdminAuthHeaders(),
      });
      const rawText = await res.text();
      const data = rawText ? JSON.parse(rawText) : {};
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        const nextDrafts: Record<
          string,
          { status: OrderStatusType; trackingCode: string; carrier: string }
        > = {};
        data.orders.forEach((o: any) => {
          const key = o.orderNumber || o.id;
          nextDrafts[key] = {
            status: o.status || 'Processing',
            trackingCode: o.trackingCode || o.trackingNumber || '',
            carrier: o.carrier || 'USPS Priority Mail',
          };
        });
        setDraftEdits(nextDrafts);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSaveOrderRow = async (orderNumber: string) => {
    const draft = draftEdits[orderNumber];
    if (!draft) return;

    setSavingOrderId(orderNumber);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, {
        method: 'PATCH',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          status: draft.status,
          trackingCode: draft.trackingCode.trim(),
          carrier: draft.carrier.trim(),
        }),
      });

      const rawText = await res.text();
      const data = rawText ? JSON.parse(rawText) : {};
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order');
      }

      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (data.order) {
        setOrders((prev) =>
          prev.map((o) =>
            (o.orderNumber || o.id) === orderNumber ? data.order : o
          )
        );
      }
      showToast(
        `Saved ${orderNumber}: Status="${draft.status}", Tracking="${draft.trackingCode || 'None'}"`
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update order tracking', 'error');
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          orderNumber: newOrderForm.orderNumber.trim(),
          trackingCode: newOrderForm.trackingCode.trim(),
          status: newOrderForm.status,
          carrier: newOrderForm.carrier.trim(),
          customerName: newOrderForm.customerName.trim(),
          customerEmail: newOrderForm.customerEmail.trim(),
          items: [
            {
              sku: 'AERO-CUSTOM-01',
              title: newOrderForm.productTitle.trim(),
              price: parseFloat(newOrderForm.totalAmount) || 49.99,
              quantity: 1,
            },
          ],
        }),
      });
      const rawText = await res.text();
      const data = rawText ? JSON.parse(rawText) : {};
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }
      await fetchOrders();
      setIsCreateModalOpen(false);
      showToast(`Created order ${newOrderForm.orderNumber} with tracking ${newOrderForm.trackingCode}`);
      setNewOrderForm((prev) => ({
        ...prev,
        orderNumber: `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        trackingCode: `940011189956${Math.floor(100000 + Math.random() * 900000)}`,
      }));
    } catch (err: any) {
      showToast(err.message || 'Failed to create order', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const ordNum = (o.orderNumber || o.id || '').toLowerCase();
      const trk = (o.trackingCode || (o as any).trackingNumber || '').toLowerCase();
      const email = (o.customerEmail || '').toLowerCase();
      const name = (o.customerName || '').toLowerCase();

      if (statusFilter !== 'All' && o.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          ordNum.includes(q) ||
          trk.includes(q) ||
          email.includes(q) ||
          name.includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportOrdersToCsv = () => {
    const targetOrders = filteredOrders.length > 0 ? filteredOrders : orders;
    if (targetOrders.length === 0) {
      showToast('No orders available to export.', 'error');
      return;
    }

    const headers = [
      'Order Number',
      'Order Date (UTC)',
      'Customer Name',
      'Customer Email',
      'Order Status',
      'Currency',
      'Total Amount ($)',
      'Destination Country',
      'Destination City',
      'Carrier',
      'Tracking Code',
    ];

    const escapeCsvField = (field: unknown): string => {
      if (field === null || field === undefined) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = targetOrders.map((ord) => [
      escapeCsvField(ord.orderNumber || ord.id || ''),
      escapeCsvField(ord.createdAt ? new Date(ord.createdAt).toISOString() : new Date().toISOString()),
      escapeCsvField(ord.customerName || 'Verified Customer'),
      escapeCsvField(ord.customerEmail || ''),
      escapeCsvField(ord.status || 'Paid - Ready for CJ Fulfill'),
      escapeCsvField(ord.currency || 'USD'),
      escapeCsvField(Number(ord.totalAmount || 0).toFixed(2)),
      escapeCsvField(ord.shippingCountry || 'US'),
      escapeCsvField(ord.shippingCity || ''),
      escapeCsvField(ord.carrier || 'USPS Priority Mail'),
      escapeCsvField(ord.trackingCode || (ord as any).trackingNumber || ''),
    ]);

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `aerothor-orders-accounting-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${targetOrders.length} orders to CSV for accounting.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>PROTECTED ADMIN ROUTE · /admin/orders</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Order Fulfillment &amp; Tracking Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Manage customer orders, update fulfillment status (<code className="text-emerald-400 font-mono">Pending</code>,{' '}
            <code className="text-emerald-400 font-mono">Processing</code>,{' '}
            <code className="text-emerald-400 font-mono">Shipped</code>,{' '}
            <code className="text-emerald-400 font-mono">Delivered</code>), and assign carrier{' '}
            <code className="text-emerald-400 font-mono">trackingCode</code> values synced with <code className="text-slate-200 font-mono">/track-order</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleExportOrdersToCsv}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Orders to CSV</span>
          </button>
          <button
            type="button"
            onClick={fetchOrders}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(['All', 'Pending', 'Processing', 'Shipped', 'Delivered'] as const).map((st) => {
          const count =
            st === 'All'
              ? orders.length
              : orders.filter((o) => (o.status || 'Processing') === st).length;
          const active = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                active
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{st}</p>
              <p className="text-xl font-extrabold font-mono text-white mt-0.5">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by orderNumber (ORD-2026-...), trackingCode, or customerEmail..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          Showing <strong className="text-emerald-400">{filteredOrders.length}</strong> of{' '}
          <strong className="text-white">{orders.length}</strong> orders
        </span>
      </div>

      {/* Orders Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Order Number</th>
                <th className="py-3.5 px-4">Customer Email</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Tracking Code &amp; Carrier</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const key = order.orderNumber || order.id;
                  const draft = draftEdits[key] || {
                    status: order.status || 'Processing',
                    trackingCode: order.trackingCode || (order as any).trackingNumber || '',
                    carrier: order.carrier || 'USPS Priority Mail',
                  };
                  const isDirty =
                    draft.status !== (order.status || 'Processing') ||
                    draft.trackingCode !== (order.trackingCode || (order as any).trackingNumber || '') ||
                    draft.carrier !== (order.carrier || 'USPS Priority Mail');

                  return (
                    <tr key={key} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white">{key}</span>
                          <button
                            type="button"
                            onClick={() => copyText(key)}
                            className="text-slate-500 hover:text-slate-300"
                            title="Copy orderNumber"
                          >
                            {copiedId === key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-slate-200">{order.customerName}</p>
                        <p className="font-mono text-[11px] text-emerald-400">{order.customerEmail}</p>
                        <p className="text-[10px] text-slate-500">
                          {order.shippingCity}, {order.shippingCountry}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top font-mono font-bold text-white">
                        ${Number(order.totalAmount || 0).toFixed(2)} {order.currency || 'USD'}
                        <p className="text-[10px] text-slate-500 font-normal">
                          {(order.items || []).length} item(s)
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setDraftEdits((prev) => ({
                              ...prev,
                              [key]: {
                                ...draft,
                                status: e.target.value as OrderStatusType,
                              },
                            }))
                          }
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                        >
                          {ORDER_STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col sm:flex-row gap-1.5 max-w-xs">
                          <input
                            type="text"
                            value={draft.trackingCode}
                            onChange={(e) =>
                              setDraftEdits((prev) => ({
                                ...prev,
                                [key]: {
                                  ...draft,
                                  trackingCode: e.target.value,
                                },
                              }))
                            }
                            placeholder="Enter trackingCode..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveOrderRow(key)}
                            disabled={savingOrderId === key}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isDirty
                                ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{savingOrderId === key ? 'Saving...' : 'Save'}</span>
                          </button>
                          {onOpenPublicTracker && (
                            <button
                              type="button"
                              onClick={() => onOpenPublicTracker(key)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                              title="View on Public /track-order Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Create Tracked Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Order Number
                </label>
                <input
                  type="text"
                  required
                  value={newOrderForm.orderNumber}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, orderNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newOrderForm.customerEmail}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Fulfillment Status
                  </label>
                  <select
                    value={newOrderForm.status}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, status: e.target.value as OrderStatusType })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {ORDER_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tracking Code
                  </label>
                  <input
                    type="text"
                    value={newOrderForm.trackingCode}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, trackingCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 rounded-lg border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg cursor-pointer"
                >
                  {isCreating ? 'Creating...' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
