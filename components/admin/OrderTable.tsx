'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Truck, ExternalLink } from 'lucide-react';

export type OrderStatusOption =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItemRecord {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface AdminOrderRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  createdAt: string;
  items?: OrderItemRecord[];
}

interface OrderTableProps {
  initialOrders: AdminOrderRecord[];
  adminToken?: string;
}

const STATUS_OPTIONS: OrderStatusOption[] = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

function getStatusBadgeClasses(status: string): string {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case 'DELIVERED':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    case 'SHIPPED':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
    case 'PROCESSING':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
    case 'CANCELLED':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    default:
      return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
  }
}

export default function OrderTable({ initialOrders, adminToken }: OrderTableProps) {
  const [orders, setOrders] = useState<AdminOrderRecord[]>(initialOrders);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatusOption) => {
    const previousOrders = [...orders];
    setUpdatingOrderId(orderId);

    // Optimistic UI update
    setOrders((curr) =>
      curr.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }

      const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Failed to update order #${orderId}`);
      }

      showToast('success', `Order #${orderId} status updated to ${newStatus}`);
    } catch (err: any) {
      // Revert optimistic update on failure
      setOrders(previousOrders);
      showToast('error', err?.message || 'Error updating order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Live Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-900 border-rose-500/50 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Live Status Control</th>
                <th className="py-3.5 px-4">Tracking</th>
                <th className="py-3.5 px-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No customer orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isUpdating = updatingOrderId === order.id;
                  const normalizedStatus = (
                    STATUS_OPTIONS.includes(order.status.toUpperCase() as OrderStatusOption)
                      ? order.status.toUpperCase()
                      : 'PENDING'
                  ) as OrderStatusOption;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-200">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-100">{order.customerName}</div>
                        <div className="text-xs text-slate-400">{order.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-2">
                          <select
                            value={normalizedStatus}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatusOption)
                            }
                            aria-label={`Order ${order.id} status`}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide cursor-pointer focus:outline-none transition-colors disabled:opacity-50 ${getStatusBadgeClasses(
                              normalizedStatus
                            )}`}
                          >
                            {STATUS_OPTIONS.map((statusOpt) => (
                              <option
                                key={statusOpt}
                                value={statusOpt}
                                className="bg-slate-900 text-slate-100"
                              >
                                {statusOpt}
                              </option>
                            ))}
                          </select>
                          {isUpdating && (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {order.trackingNumber ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-sky-400">
                            <Truck className="w-3.5 h-3.5" />
                            {order.trackingNumber}
                            <ExternalLink className="w-3 h-3 opacity-75" />
                          </span>
                        ) : (
                          <span className="text-slate-500">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
