'use client';

import React, { useState } from 'react';
import {
  Package,
  DollarSign,
  Truck,
  Link as LinkIcon,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export interface ProductFormData {
  id?: string;
  sku: string;
  title: string;
  description: string;
  price: string | number;
  salePrice?: string | number;
  brand: string;
  stockQuantity: number;
  availability: 'in_stock' | 'out_of_stock';
  mainImageUrl: string;
  productType: 'dropshipping' | 'affiliate';
  affiliateUrl?: string;
  isFreeShipping: boolean;
  shippingCost: number;
  seoTitle?: string;
  seoDescription?: string;
}

interface ProductFormProps {
  initialProduct?: Partial<ProductFormData>;
  onSuccess?: (savedProduct: any) => void;
  onCancel?: () => void;
  adminSecretToken?: string;
}

export function ProductForm({
  initialProduct,
  onSuccess,
  onCancel,
  adminSecretToken,
}: ProductFormProps) {
  const isEditing = Boolean(initialProduct?.id || initialProduct?.sku);

  const [formData, setFormData] = useState<ProductFormData>({
    id: initialProduct?.id,
    sku: initialProduct?.sku || `AERO-${Math.floor(100000 + Math.random() * 900000)}`,
    title: initialProduct?.title || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price ? String(initialProduct.price).replace(/[^0-9.]/g, '') : '',
    salePrice: initialProduct?.salePrice ? String(initialProduct.salePrice).replace(/[^0-9.]/g, '') : '',
    brand: initialProduct?.brand || 'AeroCommerce',
    stockQuantity: initialProduct?.stockQuantity !== undefined ? initialProduct.stockQuantity : 99,
    availability: initialProduct?.availability || 'in_stock',
    mainImageUrl: initialProduct?.mainImageUrl || '',
    productType: initialProduct?.productType || 'dropshipping',
    affiliateUrl: initialProduct?.affiliateUrl || '',
    isFreeShipping: initialProduct?.isFreeShipping !== undefined ? initialProduct.isFreeShipping : true,
    shippingCost: initialProduct?.shippingCost !== undefined ? Number(initialProduct.shippingCost) : 0,
    seoTitle: initialProduct?.seoTitle || '',
    seoDescription: initialProduct?.seoDescription || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerateSku = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const prefix = formData.productType === 'affiliate' ? 'AFF' : 'AERO';
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${randomCode}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.title.trim()) {
      setErrorMessage('Product Title is required.');
      return;
    }
    if (!formData.price || parseFloat(String(formData.price)) <= 0) {
      setErrorMessage('A valid positive retail price is required.');
      return;
    }
    if (!formData.mainImageUrl.trim()) {
      setErrorMessage('Main Image URL is required.');
      return;
    }
    if (formData.productType === 'affiliate' && !formData.affiliateUrl?.trim()) {
      setErrorMessage('Affiliate Target URL is required when Product Type is Affiliate.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token =
        adminSecretToken ||
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('aero_admin_token') || localStorage.getItem('aero_admin_token')
          : '');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const payload = {
        ...formData,
        price: parseFloat(String(formData.price)),
        salePrice: formData.salePrice ? parseFloat(String(formData.salePrice)) : null,
        stockQuantity: Number(formData.stockQuantity) || 0,
        shippingCost: formData.isFreeShipping ? 0 : Number(formData.shippingCost) || 0,
        isFreeShipping: Boolean(formData.isFreeShipping),
      };

      const endpoint = isEditing ? '/api/admin/product' : '/api/admin/product';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product in database.');
      }

      setSuccessMessage(
        isEditing
          ? `Product "${formData.title}" updated successfully!`
          : `Product "${formData.title}" created with Free Shipping settings applied!`
      );

      if (onSuccess) {
        onSuccess(data.product || payload);
      }
    } catch (err: any) {
      console.error('[ProductForm Error]:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while saving the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-950 border border-slate-800/90 rounded-2xl p-5 sm:p-7 shadow-2xl text-slate-100 space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {isEditing ? 'Edit Enterprise Product' : 'Add New Product to ERP Catalog'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure catalog item, variant specifications, Google Merchant Center feed fields, and shipping policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {formData.isFreeShipping ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-full">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Free Shipping Enabled</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-full">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Custom Shipping: ${Number(formData.shippingCost).toFixed(2)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Core Product Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            General Information
          </h3>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Product Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Ultra Titanium Ergonomic Mechanical Keyboard"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* SKU Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                SKU (Stock Keeping Unit) <span className="text-emerald-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto Generate</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="AERO-100234"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Brand & Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="AeroCommerce"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Stock Inventory</label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Pricing: Retail & Sale */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Retail Price ($ USD) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="49.99"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Sale Price ($ USD, Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  placeholder="39.99"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-amber-300 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description (HTML / Markdown supported)
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed product highlights, material specs, and USA/UK dispatch information..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Right Column: Catalog Type, Shipping Settings, Images */}
        <div className="space-y-5">
          {/* Section: Product Type Selector */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              E-Commerce Business Model
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productType: 'dropshipping' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.productType === 'dropshipping'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Dropshipping</span>
                  {formData.productType === 'dropshipping' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Native Stripe 1-Click Checkout</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, productType: 'affiliate' })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  formData.productType === 'affiliate'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-lg shadow-amber-900/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400">Affiliate Deal</span>
                  {formData.productType === 'affiliate' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Amazon / Partner Redirect</div>
              </button>
            </div>

            {formData.productType === 'affiliate' && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Affiliate Outbound URL (Required)</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.affiliateUrl}
                  onChange={(e) => setFormData({ ...formData, affiliateUrl: e.target.value })}
                  placeholder="https://www.amazon.com/dp/B08N5WRWNW?tag=yourtag-20"
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs text-amber-200 placeholder-amber-700/50 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            )}
          </div>

          {/* CRITICAL FEATURE: Modern Free Shipping Settings Toggle */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span>Free Shipping Integration</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set whether this product qualifies for 100% Free Shipping in Cart & Checkout.
                </p>
              </div>

              {/* Sleek iOS/Tailwind Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={formData.isFreeShipping}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isFreeShipping: !prev.isFreeShipping,
                    shippingCost: !prev.isFreeShipping ? 0 : prev.shippingCost || 4.99,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  formData.isFreeShipping ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.isFreeShipping ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.isFreeShipping ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200">
                  <p className="font-bold">Free Shipping Active ($0.00)</p>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    Customers will see <span className="font-mono font-semibold">Shipping: $0.00 (Free)</span> in cart summaries, and $0.00 shipping is passed to the Stripe Checkout session.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Custom Domestic Shipping Cost ($ USD)</span>
                  <span className="text-[10px] text-amber-400 font-mono">Billed to Customer</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.shippingCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shippingCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="4.99"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3.5 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  This exact shipping fee (${Number(formData.shippingCost || 0).toFixed(2)}) will be added to the customer's subtotal and billed on Stripe.
                </p>
              </div>
            )}
          </div>

          {/* Section: Main Image Link & Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
              <span>Main Product Image URL <span className="text-emerald-400">*</span></span>
              {formData.mainImageUrl && (
                <a
                  href={formData.mainImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Preview</span>
                </a>
              )}
            </label>
            <input
              type="url"
              required
              value={formData.mainImageUrl}
              onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />

            {formData.mainImageUrl && (
              <div className="mt-2 relative w-24 h-24 rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
                <img
                  src={formData.mainImageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-5 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-800"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving to PostgreSQL...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Product Changes' : 'Create & Publish Product'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
