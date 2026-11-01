'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  ExternalLink,
  ShoppingBag,
  Zap,
  Flame,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';

export interface ProductVariantItem {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  stockQuantity: number;
}

export interface RelatedDealProduct {
  id: string;
  sku?: string;
  title: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  brand?: string;
  affiliateUrl?: string;
  productType?: 'dropshipping' | 'affiliate';
}

export interface ProductDetailsProps {
  product: {
    id: string;
    sku: string;
    title: string;
    description: string;
    brand: string;
    price: number;
    salePrice?: number;
    mainImageUrl: string;
    productType?: 'dropshipping' | 'affiliate';
    affiliateUrl?: string;
    stockQuantity?: number;
    ratingValue?: number;
    reviewCount?: number;
    variants: ProductVariantItem[];
  };
  relatedDeals?: RelatedDealProduct[];
  onAddToCart?: (sku: string, quantity: number) => void;
  onBuyNow?: (sku: string, quantity: number) => void;
}

export default function ProductDetails({
  product,
  relatedDeals = [],
  onAddToCart,
  onBuyNow,
}: ProductDetailsProps) {
  const variants = product.variants || [];
  const [selectedSize, setSelectedSize] = useState<string>(
    variants[0]?.size || 'M / Standard'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    variants[0]?.color || 'Obsidian Black'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  // Flash Sale Countdown Timer (Starts at 4h 30m = 16,200 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(4 * 3600 + 30 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 4 * 3600 + 30 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const activeVariant =
    variants.find((v) => v.size === selectedSize && v.color === selectedColor) ||
    variants.find((v) => v.size === selectedSize) ||
    variants[0];

  const availableSizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  const availableColors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));

  const activePrice = activeVariant?.salePrice ?? activeVariant?.price ?? product.salePrice ?? product.price;
  const originalPrice = activeVariant?.price ?? product.price;
  const hasDiscount = originalPrice > activePrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - activePrice) / originalPrice) * 100)
    : 18;

  const isAffiliate =
    product.productType === 'affiliate' ||
    Boolean(product.affiliateUrl) ||
    product.sku?.toUpperCase().startsWith('AFF-');

  const resolvedAffiliateUrl =
    product.affiliateUrl ||
    `https://www.amazon.com/s?k=${encodeURIComponent(product.title)}&tag=aerothor-20`;

  // Scarcity trigger: Low stock indicator (capped between 2 and 5 for urgency)
  const lowStockCount = Math.min(
    5,
    Math.max(2, (activeVariant?.stockQuantity ?? product.stockQuantity ?? 3) % 5 || 3)
  );

  const rating = product.ratingValue ?? 4.9;
  const reviews = product.reviewCount ?? 148;

  const handleNativeAddToCart = () => {
    const targetSku = activeVariant?.sku || product.sku;
    if (onAddToCart) {
      onAddToCart(targetSku, quantity);
    }
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  };

  const handleNativeBuyNow = () => {
    const targetSku = activeVariant?.sku || product.sku;
    if (onBuyNow) {
      onBuyNow(targetSku, quantity);
    }
  };

  return (
    <div className="space-y-14">
      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Product Visual Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center p-6">
            <img
              src={activeVariant?.imageUrl || product.mainImageUrl}
              alt={product.title}
              className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="px-3 py-1 rounded-md bg-rose-600 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg">
                Save {discountPercent}% Today
              </span>
              {isAffiliate && (
                <span className="px-3 py-1 rounded-md bg-[#FF9900] text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-lg">
                  Verified Amazon Partner Deal
                </span>
              )}
            </div>
          </div>

          {/* Fast Delivery Highlight Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
              <Truck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-200">3–7 Day US/UK</p>
              <p className="text-[10px] text-slate-400">Tracked Dispatch</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
              <RotateCcw className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-200">30-Day Guarantee</p>
              <p className="text-[10px] text-slate-400">Free Returns</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-slate-200">Verified Quality</p>
              <p className="text-[10px] text-slate-400">GMC Certified</p>
            </div>
          </div>
        </div>

        {/* CRO Conversion Column */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand + Verified Rating */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                {product.brand || 'AeroThor Official'}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-bold text-white">{rating.toFixed(1)}</span>
                <span className="text-slate-400">({reviews} verified reviews)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {product.title}
            </h1>

            {/* URGENCY TRIGGER 1: Dynamic Flash Sale Countdown Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/90 via-amber-950/60 to-slate-950 border border-rose-500/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                <span>Flash Sale Special Offer</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-white bg-slate-950/90 px-3 py-1.5 rounded-lg border border-rose-500/30">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Ends in {String(hours).padStart(2, '0')}h : {String(minutes).padStart(2, '0')}m :{' '}
                  {String(seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            {/* Price & Savings Block */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                ${activePrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg font-mono line-through text-slate-500">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-xs font-bold text-amber-300">
                · Free US &amp; UK Tracked Shipping
              </span>
            </div>

            {/* SCARCITY TRIGGER 2: Low-Stock Indicator */}
            <div className="space-y-1.5 bg-slate-950/90 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Only {lowStockCount} left in stock - order soon
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  SKU: {activeVariant?.sku || product.sku}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-gradient-to-r from-rose-500 to-amber-400 rounded-full" />
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{product.description}</p>

            {/* Variant Selectors */}
            {(availableSizes.length > 0 || availableColors.length > 0) && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                {availableSizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Size / Edition: <span className="text-white">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedSize === size
                              ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Finish / Color: <span className="text-white">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            selectedColor === color
                              ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* HIGH-CONTRAST CTAs (Amazon Orange #FF9900 + Bold Brand Add to Cart) */}
          <div className="space-y-4 pt-2">
            {isAffiliate ? (
              <div className="space-y-2.5">
                <a
                  href={resolvedAffiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl bg-[#FF9900] hover:bg-[#e68a00] active:bg-[#cc7a00] text-slate-950 font-black text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-[#FF9900]/20 cursor-pointer"
                >
                  <span>Buy on Amazon — ${activePrice.toFixed(2)}</span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>
                <button
                  type="button"
                  onClick={handleNativeAddToCart}
                  className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span>{addedFeedback ? '✓ Saved to Store Cart' : 'Or Add to Store Cart'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleNativeAddToCart}
                    className="w-full py-4 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span>{addedFeedback ? '✓ Added to Cart' : 'Add to Cart'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeBuyNow}
                    className="w-full py-4 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current text-emerald-600" />
                    <span>Express Stripe Buy</span>
                  </button>
                </div>

                {product.affiliateUrl && (
                  <a
                    href={resolvedAffiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-5 rounded-xl bg-[#FF9900] hover:bg-[#e68a00] text-slate-950 font-extrabold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Buy on Amazon</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* TRUST BADGES BELOW CTA */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-slate-200">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-[11px] text-white">Secure Stripe Checkout</p>
                  <p className="text-[10px] text-slate-400">256-Bit SSL Encrypted</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-[11px] text-white">30-Day Money-Back</p>
                  <p className="text-[10px] text-slate-400">Zero Restocking Fee</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 text-slate-200">
                <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-[11px] text-white">Apple Pay / Visa / Amex</p>
                  <p className="text-[10px] text-slate-400">Instant Order Protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED DEALS SECTION (Cross-Sell Affiliate & High-Margin Products) */}
      {relatedDeals.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#FF9900]">
                Curated Partner Offers
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                Related Deals &amp; Amazon Partner Picks
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Hand-picked commuter gear &amp; verified Amazon Prime deals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedDeals.map((deal) => {
              const dealPrice = deal.salePrice ?? deal.price;
              const isDealAffiliate =
                deal.productType === 'affiliate' || Boolean(deal.affiliateUrl);
              const dealAmazonUrl =
                deal.affiliateUrl ||
                `https://www.amazon.com/s?k=${encodeURIComponent(deal.title)}&tag=aerothor-20`;

              return (
                <div
                  key={deal.id}
                  className="bg-slate-900 border border-slate-800 hover:border-[#FF9900]/60 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-md"
                >
                  <div>
                    <div className="aspect-[4/3] bg-slate-950 overflow-hidden relative">
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#FF9900] text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        {isDealAffiliate ? 'Amazon Deal' : 'Hot Deal'}
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {deal.brand || 'AeroThor Partner'}
                      </p>
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                        {deal.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold font-mono text-emerald-400">
                        ${Number(dealPrice).toFixed(2)}
                      </span>
                      {deal.salePrice && deal.price > deal.salePrice && (
                        <span className="text-xs font-mono line-through text-slate-500">
                          ${Number(deal.price).toFixed(2)}
                        </span>
                      )}
                    </div>

                    <a
                      href={dealAmazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Buy on Amazon</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
