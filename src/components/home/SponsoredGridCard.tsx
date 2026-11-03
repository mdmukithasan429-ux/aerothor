import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink, ShieldCheck, Tag } from 'lucide-react';
import { Campaign } from '../../lib/campaigns';

interface SponsoredGridCardProps {
  campaign: Campaign;
}

export function SponsoredGridCard({ campaign }: SponsoredGridCardProps) {
  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col justify-between rounded-2xl border border-amber-500/30 bg-slate-900/95 hover:border-amber-400/70 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-200 overflow-hidden shadow-md"
    >
      <div>
        {/* Image Frame with Sponsored Badge */}
        <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
          <img
            src={campaign.imageUrl}
            alt={campaign.brandName}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />

          {/* Sponsored Badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            {campaign.badgeText || 'Sponsored Partner'}
          </span>

          <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-950/85 backdrop-blur-sm border border-amber-500/30 text-[10px] font-mono text-amber-300 rounded">
            Impact.com Partner
          </span>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
            <span>{campaign.brandName}</span>
            <span className="text-[10px] font-mono text-slate-400">Impact Link</span>
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug min-h-[2.5rem]">
            {campaign.promoTitle}
          </h3>

          {campaign.discountCode && (
            <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Use Code: <strong>{campaign.discountCode}</strong></span>
            </div>
          )}

          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Verified Brand Offer &amp; Direct Checkout</span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-3 border-t border-slate-800 bg-slate-950/60 mt-auto">
        <a
          href={campaign.vanityLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[40px] px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-md shadow-amber-500/15 cursor-pointer"
        >
          <span>{campaign.ctaText || 'Shop Impact Partner'}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.article>
  );
}
