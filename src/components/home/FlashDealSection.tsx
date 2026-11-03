import React, { useState, useEffect } from 'react';
import { Flame, Clock, Zap, ShoppingBag, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { GmcProduct } from '../../lib/gmc-feed';
import { formatPriceForDisplay } from '../../lib/currency';
import { SocialShare } from '../SocialShare';

interface FlashDealSectionProps {
  products: GmcProduct[];
  onSelectProduct: (product: GmcProduct) => void;
  onAddToCart: (product: GmcProduct) => void;
  onBuyNow: (product: GmcProduct) => void;
}

export const FlashDealSection: React.FC<FlashDealSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(7 * 3600 + 42 * 60 + 19);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 12 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const secs = secondsRemaining % 60;

  // Pick a featured deal product (or fallback)
  const dealProduct =
    products.find((p) => p.sale_price || p.id === 'CJ-TUMB-40OZ-BLK') ||
    products[0] ||
    null;

  if (!dealProduct) return null;

  const normalPrice = parseFloat(dealProduct.price.replace(/[^0-9.]/g, '') || '49.99');
  const salePrice = dealProduct.sale_price
    ? parseFloat(dealProduct.sale_price.replace(/[^0-9.]/g, '') || '34.99')
    : Number((normalPrice * 0.7).toFixed(2));

  const discountPercent = Math.round(((normalPrice - salePrice) / normalPrice) * 100) || 30;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 lg:p-10 shadow-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Countdown & Deal Details */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-md shadow-md">
              <Flame className="w-4 h-4 fill-current" />
              <span>FLASH SALE DEAL OF THE DAY</span>
            </span>

            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded">
              SAVE {discountPercent}% TODAY
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug">
            {dealProduct.title}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
            {dealProduct.description}
          </p>

          {/* Countdown Clock Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl max-w-md space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>OFFER EXPIRES IN:</span>
              </span>
              <span className="text-emerald-400 font-bold">LIMITED QUANTITY</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <span className="text-xl sm:text-2xl font-black text-white">{String(hours).padStart(2, '0')}</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">HOURS</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <span className="text-xl sm:text-2xl font-black text-white">{String(minutes).padStart(2, '0')}</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">MINUTES</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <span className="text-xl sm:text-2xl font-black text-amber-400">{String(secs).padStart(2, '0')}</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">SECONDS</span>
              </div>
            </div>
          </div>

          {/* Claimed Stock Bar */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-semibold">
                🔥 84% Claimed <span className="text-slate-400 font-normal">(Only 8 Units Left in Stock)</span>
              </span>
              <span className="text-amber-400 font-bold">Fast Dispatch</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full w-[84%] transition-all duration-500" />
            </div>
          </div>

          {/* Price & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="font-mono">
              <div className="text-xs text-slate-400">Flash Price</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400">
                  {formatPriceForDisplay(`${salePrice} USD`)}
                </span>
                <span className="text-sm text-slate-500 line-through">
                  {formatPriceForDisplay(`${normalPrice} USD`)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onBuyNow(dealProduct)}
                className="px-5 py-3 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-extrabold text-sm rounded-lg transition-colors shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Buy Now (1-Click)</span>
              </button>

              <button
                type="button"
                onClick={() => onAddToCart(dealProduct)}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Product Card Preview */}
        <div className="lg:col-span-5">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl p-4 space-y-4">
            <div
              className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => onSelectProduct(dealProduct)}
            >
              <img
                src={dealProduct.image_link}
                alt={dealProduct.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black rounded-md shadow-md">
                -{discountPercent}% OFF
              </span>
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-lg border border-slate-700 shadow-lg">
                  View Deal Details →
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-mono text-emerald-400">SKU: {dealProduct.id}</span>
              <span className="text-slate-300">Free 48h US &amp; UK Shipping</span>
            </div>

            {/* Pinterest & Reddit Social Share Integration */}
            <div className="pt-2 border-t border-slate-900">
              <SocialShare
                variant="card"
                productId={dealProduct.id}
                productTitle={dealProduct.title}
                imageUrl={dealProduct.image_link}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
