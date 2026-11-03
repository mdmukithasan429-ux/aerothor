import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Tag, Zap, Copy, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { GmcProduct } from '../../lib/gmc-feed';
import { formatPriceForDisplay } from '../../lib/currency';

interface PromoSlide {
  id: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'blue' | 'purple';
  headline: string;
  subheadline: string;
  tagline: string;
  couponCode?: string;
  discountText: string;
  image: string;
  targetCategory: string;
  featuredProductId?: string;
  primaryCtaText: string;
  secondaryCtaText?: string;
}

const PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'titanium-flagship',
    badge: 'CORPORATE FLAGSHIP LAUNCH',
    badgeColor: 'emerald',
    headline: 'Aerospace Grade 1 Titanium Vault Thermal Flask',
    subheadline: 'Engineered for 34-hour thermal insulation with zero metallic taste transfer.',
    tagline: 'Dispatches within 48h to US & UK Mainland',
    couponCode: 'AEROTHOR20',
    discountText: 'SAVE 20% WITH CODE',
    image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Drinkware & Travel',
    featuredProductId: 'CJ-TUMB-40OZ-BLK',
    primaryCtaText: 'Shop Titanium Flask',
    secondaryCtaText: 'View Spec Sheet',
  },
  {
    id: 'qi2-power-dock',
    badge: 'LIMITED TIME PROMOTION · 40% OFF',
    badgeColor: 'amber',
    headline: '15W MagSafe Qi2 Multi-Device Fast Station',
    subheadline: 'Anodized aluminum body with intelligent thermal management for iPhone & AirPods.',
    tagline: 'Official US & UK Warehouse Clearance',
    couponCode: 'POWER40',
    discountText: 'INSTANT $30 DISCOUNT',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Tech Accessories',
    featuredProductId: 'AERO-TECH-001',
    primaryCtaText: 'Claim 40% Off Power Station',
    secondaryCtaText: 'Explore Tech Gear',
  },
  {
    id: 'merino-thermal',
    badge: 'EXECUTIVE COMMUTE EDITION',
    badgeColor: 'blue',
    headline: '100% Australian Merino Wool Thermal Hoodie',
    subheadline: 'Ultra-lightweight thermoregulation for trans-Atlantic commuters and tech professionals.',
    tagline: 'Zero Restocking Fee Return Policy',
    couponCode: 'SHIP48',
    discountText: 'FREE PRIORITY EXPRESS SHIPPING',
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Clothing',
    featuredProductId: 'AERO-CLOTH-002',
    primaryCtaText: 'Shop Merino Collection',
    secondaryCtaText: 'View Size Guide',
  },
  {
    id: 'amazon-affiliate-deals',
    badge: 'AMAZON VERIFIED PARTNER OFFER',
    badgeColor: 'purple',
    headline: 'Handpicked Amazon Prime Tech & Lifestyle Deals',
    subheadline: 'Direct 1-click access to highest-rated Amazon deals with Prime 2-day delivery.',
    tagline: 'Curated Daily by AeroThor Growth Team',
    couponCode: 'PRIME15',
    discountText: 'UP TO 50% OFF PRIME DEALS',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    targetCategory: 'Affiliate Deals',
    primaryCtaText: 'Explore Amazon Partner Deals',
    secondaryCtaText: 'Browse All Affiliate Offers',
  },
];

interface HeroPromotionCarouselProps {
  onSelectCategory: (category: string) => void;
  onSelectProduct?: (product: GmcProduct) => void;
  products?: GmcProduct[];
}

export const HeroPromotionCarousel: React.FC<HeroPromotionCarouselProps> = ({
  onSelectCategory,
  onSelectProduct,
  products = [],
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = PROMO_SLIDES[activeSlideIndex];

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handleCopyCoupon = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  const handleSlideCta = (slide: PromoSlide) => {
    if (slide.featuredProductId && products.length > 0 && onSelectProduct) {
      const match = products.find(
        (p) =>
          p.id.toLowerCase() === slide.featuredProductId?.toLowerCase() ||
          p.title.toLowerCase().includes(slide.targetCategory.toLowerCase())
      );
      if (match) {
        onSelectProduct(match);
        return;
      }
    }
    onSelectCategory(slide.targetCategory);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl shadow-slate-950/80 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image Container with Soft Dark Gradient Overlay */}
      <div className="relative min-h-[440px] sm:min-h-[480px] lg:min-h-[520px] flex items-center">
        <div className="absolute inset-0 bg-slate-950 z-0" />

        {PROMO_SLIDES.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === activeSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={slide.image.includes('fm=') ? slide.image : `${slide.image}&fm=webp`}
              alt={slide.headline}
              width={1200}
              height={675}
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'low'}
              decoding={idx === 0 ? 'sync' : 'async'}
              sizes="100vw"
              className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-10000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
          </div>
        ))}

        {/* Foreground Corporate Promo Content */}
        <div className="relative z-20 max-w-4xl p-6 sm:p-10 lg:p-14 space-y-5">
          {/* Badge & Discount Chip */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase shadow-md ${
                currentSlide.badgeColor === 'emerald'
                  ? 'bg-emerald-400 text-slate-950'
                  : currentSlide.badgeColor === 'amber'
                  ? 'bg-amber-400 text-slate-950'
                  : currentSlide.badgeColor === 'purple'
                  ? 'bg-purple-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{currentSlide.badge}</span>
            </span>

            {currentSlide.couponCode && (
              <button
                type="button"
                onClick={(e) => handleCopyCoupon(currentSlide.couponCode!, e)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 rounded-md transition-all cursor-pointer shadow-sm group/code"
                title="Click to copy promotion coupon code"
              >
                <Tag className="w-3 h-3 text-emerald-400" />
                <span>CODE: </span>
                <strong className="text-white font-extrabold tracking-wide">{currentSlide.couponCode}</strong>
                {copiedCode === currentSlide.couponCode ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 text-[11px] font-sans">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 group-hover/code:text-emerald-400 transition-colors" />
                )}
              </button>
            )}
          </div>

          {/* Main Headline & Subhead */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {currentSlide.headline}
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              {currentSlide.subheadline}
            </p>
          </div>

          {/* Tagline & Guarantee */}
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{currentSlide.tagline}</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => handleSlideCta(currentSlide)}
              className="px-6 py-3 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-extrabold text-sm rounded-lg transition-all shadow-xl shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{currentSlide.primaryCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {currentSlide.secondaryCtaText && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory(currentSlide.targetCategory);
                  const catalogEl = document.getElementById('catalog');
                  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{currentSlide.secondaryCtaText}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={() => setActiveSlideIndex((prev) => (prev === 0 ? PROMO_SLIDES.length - 1 : prev - 1))}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-full border border-slate-800 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
        aria-label="Previous promotional banner slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => setActiveSlideIndex((prev) => (prev + 1) % PROMO_SLIDES.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white rounded-full border border-slate-800 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
        aria-label="Next promotional banner slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators & Auto-Play Progress Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full backdrop-blur-md">
        {PROMO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveSlideIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              idx === activeSlideIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
            }`}
            aria-label={`Jump to promotion banner slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
