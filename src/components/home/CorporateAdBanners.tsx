import React from 'react';
import { Headphones, ShieldCheck, Tag, ArrowRight, Sparkles, Shirt, Zap } from 'lucide-react';

interface CorporateAdBannersProps {
  onSelectCategory: (category: string) => void;
}

export const CorporateAdBanners: React.FC<CorporateAdBannersProps> = ({ onSelectCategory }) => {
  const handleBannerClick = (category: string) => {
    onSelectCategory(category);
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Promotional Spotlight Collections</h3>
          <p className="text-xs text-slate-400">Curated corporate hardware &amp; D2C gear deals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Ad Card 1: Industrial Audio & Tech Docks */}
        <div
          onClick={() => handleBannerClick('Tech Accessories')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer min-h-[260px]"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold rounded">
              <Headphones className="w-3 h-3" />
              <span>TECH &amp; WORKSTATION GEAR</span>
            </span>

            <h4 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition-colors leading-snug">
              Qi2 Fast Wireless Docks &amp; ANC Studio Audio
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              Aerospace aluminum workstations with sub-10ms latency and 50h long-battery life.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-bold text-emerald-400 relative z-10">
            <span>Explore Tech Catalog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Ad Card 2: Merino Thermal Outerwear */}
        <div
          onClick={() => handleBannerClick('Clothing')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer min-h-[260px]"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-slate-800 text-[10px] font-mono text-blue-400 font-bold rounded">
              <Shirt className="w-3 h-3" />
              <span>COMMUTER THERMAL WEAR</span>
            </span>

            <h4 className="text-xl font-extrabold text-white group-hover:text-blue-300 transition-colors leading-snug">
              100% Australian Merino Wool Outerwear
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              Temperature adaptive thermoregulation for international commuting &amp; zero-bulk warmth.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-bold text-blue-400 relative z-10">
            <span>Shop Outerwear Gear</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Ad Card 3: Amazon Verified Partner Deals */}
        <div
          onClick={() => handleBannerClick('Affiliate Deals')}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 p-6 sm:p-7 flex flex-col justify-between hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer min-h-[260px]"
        >
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded">
              <Tag className="w-3 h-3 fill-current" />
              <span>VERIFIED AMAZON PRIME PARTNER</span>
            </span>

            <h4 className="text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors leading-snug">
              Curated Amazon Prime Deals &amp; Discounts
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hand-verified high-CRP US &amp; UK deals with 1-click Amazon checkout &amp; Prime 2-day delivery.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs font-bold text-amber-400 relative z-10">
            <span>Browse Amazon Deals</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
