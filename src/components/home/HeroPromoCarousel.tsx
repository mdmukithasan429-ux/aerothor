import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, ChevronLeft, ChevronRight, Tag, ShieldCheck, Megaphone } from 'lucide-react';
import { Campaign, INITIAL_CAMPAIGNS } from '../../lib/campaigns';

export function HeroPromoCarousel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    INITIAL_CAMPAIGNS.filter((c) => c.placement === 'HERO_BANNER' && c.isActive)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.campaigns)) {
          const heroBanners = data.campaigns.filter((c: Campaign) => c.placement === 'HERO_BANNER' && c.isActive);
          if (heroBanners.length > 0) {
            setCampaigns(heroBanners);
            return;
          }
        }
      })
      .catch(() => {
        // Fallback already initialized
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (campaigns.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [campaigns.length, isPaused]);

  if (campaigns.length === 0) return null;

  const current = campaigns[currentIndex] || campaigns[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  return (
    <section
      className="relative mb-8 rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute top-0 right-0 -mt-12 -mr-12 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-72 w-72 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center min-h-[340px] p-6 sm:p-8 lg:p-10 gap-6 sm:gap-8"
        >
          {/* Content Left (Col 1-7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider border border-amber-500/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {current.badgeText || 'Impact Partner'}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Featured Brand Promotion
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400/90 block">
                {current.brandName}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {current.promoTitle}
              </h2>
            </div>

            {current.discountCode && (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Impact Promo Code: <strong className="text-white font-bold">{current.discountCode}</strong></span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={current.vanityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>{current.ctaText || 'Claim Impact Deal'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Official Store Link</span>
              </div>
            </div>
          </div>

          {/* Image Right (Col 8-12) */}
          <div className="lg:col-span-5 relative group">
            <a
              href={current.vanityLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl group-hover:border-amber-400/60 transition-colors"
            >
              <img
                src={current.imageUrl.includes('fm=') ? current.imageUrl : `${current.imageUrl}&fm=webp`}
                alt={current.brandName}
                width={800}
                height={450}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-amber-300 font-mono bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30">
                <span className="truncate">{current.brandName}</span>
                <span className="flex items-center gap-1 shrink-0 font-bold">
                  Impact Vanity Link <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel Controls & Indicators */}
      {campaigns.length > 1 && (
        <div className="relative z-20 flex items-center justify-between px-6 pb-4 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            {campaigns.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
