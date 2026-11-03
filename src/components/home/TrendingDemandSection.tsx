import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Zap, ShoppingBag, ArrowRight, Eye, Star } from 'lucide-react';
import { GmcProduct } from '../../lib/gmc-feed';
import { formatPriceForDisplay } from '../../lib/currency';

interface TrendingDemandSectionProps {
  products: GmcProduct[];
  onSelectProduct: (product: GmcProduct) => void;
  onAddToCart: (product: GmcProduct) => void;
  onBuyNow: (product: GmcProduct) => void;
}

export const TrendingDemandSection: React.FC<TrendingDemandSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
}) => {
  // Filter products marked as isTrending, fallback to top 4 products if none
  const trendingProducts = React.useMemo(() => {
    const marked = products.filter((p) => p.isTrending);
    if (marked.length >= 2) return marked.slice(0, 4);
    return products.slice(0, 4);
  }, [products]);

  if (trendingProducts.length === 0) return null;

  return (
    <section className="py-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0"
          >
            <Flame className="w-5 h-5 fill-amber-400" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Today&apos;s High Demand Drops
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                Trending Fast
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time high velocity catalog items with guaranteed 48h dispatch across US &amp; UK.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Trending Cards with Framer Motion */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {trendingProducts.map((product) => {
          const formattedPrice = formatPriceForDisplay(product.sale_price || product.price);

          return (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col justify-between shadow-xl hover:shadow-amber-500/10 hover:border-amber-400 transition-colors cursor-pointer"
              onClick={() => onSelectProduct(product)}
            >
              {/* Image & High Demand Badge */}
              <div className="relative aspect-square rounded-xl bg-slate-950 overflow-hidden mb-3">
                <img
                  src={product.image_link}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e: any) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                <div className="absolute top-2.5 left-2.5 px-2 py-1 bg-slate-950/90 backdrop-blur-md border border-amber-500/50 rounded-lg text-[10px] font-bold text-amber-300 flex items-center gap-1 shadow-md">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>High Demand</span>
                </div>

                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-slate-950/90 backdrop-blur-md rounded text-[10px] font-mono text-emerald-400 border border-slate-800">
                  48h Dispatch
                </div>
              </div>

              {/* Title & Brand */}
              <div className="space-y-1 mb-3">
                <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  {product.brand || 'AeroThor'}
                </span>
                <h3 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                  {product.title}
                </h3>
              </div>

              {/* Pricing & Motion Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-white font-mono">{formattedPrice}</div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span className="font-bold">4.9</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cart</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBuyNow(product);
                    }}
                    className="py-2 px-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Buy Now</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};

export default TrendingDemandSection;
