'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  Lock,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Zap,
  RotateCcw,
  Plus,
  Minus,
  MapPin,
  Check,
  ArrowRight,
} from 'lucide-react';

export interface CheckoutProduct {
  id: string;
  title: string;
  price: string | number;
  sale_price?: string | number;
  image_link: string;
  brand?: string;
}

export interface CheckoutItem {
  product: CheckoutProduct;
  quantity: number;
}

interface ExpressCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckoutItem[];
  onUpdateQuantity?: (productId: string, delta: number) => void;
  onClearCart?: () => void;
}

export const ExpressCheckoutDrawer: React.FC<ExpressCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onClearCart,
}) => {
  const [formData, setFormData] = useState({
    email: 'customer@example.com',
    fullName: 'Alex Vance',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace',
    apartment: 'Apt 4B',
    city: 'Springfield',
    state: 'OR',
    zipCode: '97477',
    country: 'US',
    shippingMethod: 'free' as 'free' | 'express',
    paymentMethod: 'card' as 'apple_pay' | 'google_pay' | 'card',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState<any>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => {
    const rawPrice = typeof item.product.price === 'number'
      ? item.product.price
      : parseFloat(String(item.product.sale_price || item.product.price).replace(/[^0-9.]/g, '') || '0');
    return sum + rawPrice * item.quantity;
  }, 0);

  const shippingCost = formData.shippingMethod === 'express' ? 7.99 : 0.0;
  const total = subtotal + shippingCost;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const orderId = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const trackingNumber =
      formData.country === 'GB'
        ? `RM-48-${Math.floor(10000000 + Math.random() * 90000000)}GB`
        : `9400 1118 9956 ${Math.floor(1000 + Math.random() * 9000)} 00`;

    setTimeout(() => {
      setIsProcessing(false);
      setOrderConfirmed(true);
      setConfirmedOrderDetails({
        orderId,
        trackingNumber,
        carrier: formData.country === 'GB' ? 'Royal Mail Tracked 48' : 'USPS Priority Mail',
        estimatedDelivery: formData.shippingMethod === 'express' ? '2 to 3 Business Days' : '3 to 5 Business Days',
        totalPaid: total.toFixed(2),
      });
      if (onClearCart) onClearCart();
    }, 1200);
  };

  const handleReset = () => {
    setOrderConfirmed(false);
    setConfirmedOrderDetails(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl relative text-slate-200 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {orderConfirmed ? 'Order Confirmed' : 'Express Checkout (1-Click)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Google Merchant Center Certified · Domestic US &amp; UK Fulfillment
              </p>
            </div>
          </div>
          <button onClick={handleReset} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {orderConfirmed && confirmedOrderDetails ? (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-extrabold text-white">Payment Authorized &amp; Dispatched!</h4>
                <p className="text-xs text-slate-300">
                  Tracking telemetry dispatched to <span className="text-emerald-400 font-semibold">{formData.email}</span>.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-[11px]">
                <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span>Order Reference</span>
                  <span className="text-white font-bold">{confirmedOrderDetails.orderId}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span>Courier Carrier</span>
                  <span className="text-emerald-400">{confirmedOrderDetails.carrier}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800 text-slate-400">
                  <span>Live Tracking</span>
                  <span className="text-white font-bold">{confirmedOrderDetails.trackingNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Total Amount Paid</span>
                  <span className="text-white font-bold text-xs">${confirmedOrderDetails.totalPaid} USD</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3.5 bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Order Items */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Order Summary ({items.reduce((a, b) => a + b.quantity, 0)})
                </span>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.product.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                      <img src={item.product.image_link} alt={item.product.title} className="w-12 h-12 object-cover rounded-lg bg-slate-950" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-xs">{item.product.title}</p>
                        <p className="text-emerald-400 font-mono text-xs font-bold mt-0.5">
                          ${(typeof item.product.price === 'number' ? item.product.price : parseFloat(String(item.product.price).replace(/[^0-9.]/g, ''))).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Form */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Domestic Delivery Address</span>
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street Address"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
                <div className="grid grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="ZIP Code"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Domestic Tracked Delivery</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm text-white font-sans">
                  <span>Total</span>
                  <span className="text-emerald-400 font-mono">${total.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || items.length === 0}
                className="w-full py-4 bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isProcessing ? 'Authorizing Payment...' : `Pay $${total.toFixed(2)} USD · Express Dispatch`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
