'use client';

import React, { useState, useMemo } from 'react';

export interface ClientVariantItem {
  id: string;
  sku: string;
  cjVid?: string;
  size: string;
  color: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  stockQuantity: number;
}

export interface ClientProductData {
  id: string;
  sku: string;
  title: string;
  description: string;
  brand: string;
  price: number;
  salePrice?: number;
  mainImageUrl: string;
  variants: ClientVariantItem[];
  productType?: 'dropshipping' | 'affiliate';
  affiliateUrl?: string;
}

export function ProductVariantClientView({ product }: { product: ClientProductData }) {
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))),
    [product.variants]
  );
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))),
    [product.variants]
  );

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] || 'Obsidian Black');
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState<boolean>(false);

  const activeVariant = useMemo(() => {
    return (
      product.variants.find((v) => v.size === selectedSize && v.color === selectedColor) ||
      product.variants.find((v) => v.size === selectedSize) ||
      product.variants.find((v) => v.color === selectedColor) ||
      product.variants[0]
    );
  }, [product.variants, selectedSize, selectedColor]);

  const displayedPrice = activeVariant
    ? activeVariant.salePrice ?? activeVariant.price
    : product.salePrice ?? product.price;
  const compareAtPrice = activeVariant?.salePrice ? activeVariant.price : undefined;
  const displayedImage = activeVariant?.imageUrl || product.mainImageUrl;
  const displayedSku = activeVariant?.sku || product.sku;

  const handleStripeCheckout = async () => {
    setIsLoadingCheckout(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              sku: displayedSku,
              cjVid: activeVariant?.cjVid,
              title: `${product.title} (${selectedSize} / ${selectedColor})`,
              price: displayedPrice,
              quantity,
              image: displayedImage,
              size: selectedSize,
              color: selectedColor,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    const isAffiliate =
      product.productType === 'affiliate' ||
      Boolean(product.affiliateUrl) ||
      product.id.toLowerCase().startsWith('aff-');
    const outboundLink =
      product.affiliateUrl ||
      `https://www.amazon.com/s?k=${encodeURIComponent(product.title)}`;

    return (
      <div
        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-900/90 rounded-2xl p-6 sm:p-10 shadow-2xl ${
          isAffiliate ? 'border border-amber-500/30' : 'border border-slate-800'
        }`}
      >
        {/* Dynamic Product Image */}
        <div className="aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative">
          <img
            src={displayedImage}
            alt={`${product.title} - ${selectedColor}`}
            className="w-full h-full object-cover transition-all duration-300"
          />
          {isAffiliate ? (
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
              <span className="px-3 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
                Affiliate Deal
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-amber-500/40 text-[10px] font-mono text-amber-300">
                Amazon Partner
              </span>
            </div>
          ) : (
            <span className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-mono text-emerald-400">
              {selectedSize} · {selectedColor}
            </span>
          )}
        </div>

        {/* Product Details & Interactive Variant Selector */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span
                className={`uppercase tracking-wider font-bold ${
                  isAffiliate ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {product.brand}
              </span>
              <span className="text-slate-400">SKU: {displayedSku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {product.title}
            </h1>

            {/* Dynamic Variant Price */}
            <div className="flex items-baseline gap-3">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  isAffiliate ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                ${displayedPrice.toFixed(2)} USD
              </span>
              {compareAtPrice && (
                <span className="text-base font-mono line-through text-slate-500">
                  ${compareAtPrice.toFixed(2)} USD
                </span>
              )}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{product.description}</p>

          {/* Size Selector Buttons */}
          {sizes.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Size: <span className="text-emerald-400">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector Buttons */}
          {colors.length > 0 && (
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Select Color: <span className="text-emerald-400">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action CTA: Affiliate External Outbound vs Dropshipping Stripe Checkout */}
        {isAffiliate ? (
          <div className="space-y-4 pt-6 border-t border-slate-800">
            <a
              href={outboundLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
            >
              <span>Buy on Amazon / View Partner Deal</span>
              <span className="text-base">↗</span>
            </a>
            <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 leading-relaxed">
              <strong>Verified Partner Listing:</strong> Orders are placed directly on the certified merchant’s official platform. You will be redirected securely to finalize your purchase.
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-800 rounded-xl bg-slate-950">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-slate-300 hover:text-white"
                >
                  -
                </button>
                <span className="px-4 font-mono text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2.5 text-slate-300 hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={isLoadingCheckout}
                className="flex-1 py-3.5 px-6 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoadingCheckout
                  ? 'Redirecting to Stripe...'
                  : `Buy Now (Card / Apple Pay / Google Pay) — $${(displayedPrice * quantity).toFixed(2)}`}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center font-mono">
              Guaranteed 48h US &amp; UK Dispatch · 30-Day Free Returns · 256-Bit Stripe SSL
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
