import React, { useState } from 'react';
import { Tag, Copy, Check, Gift, Sparkles, X, ShieldCheck } from 'lucide-react';

interface PromoCouponDrawerProps {
  onApplyCoupon?: (code: string) => void;
}

interface CouponCode {
  code: string;
  discount: string;
  description: string;
  badge: string;
}

const ACTIVE_COUPONS: CouponCode[] = [
  {
    code: 'AEROTHOR20',
    discount: '20% OFF CATALOG',
    description: 'Valid on all Titanium Flasks, Docks & Merino Thermal Gear.',
    badge: 'STOREWIDE EXCLUSIVE',
  },
  {
    code: 'SHIP48',
    discount: 'FREE 48H EXPRESS',
    description: 'Waives priority express shipping fees to US & UK Mainland.',
    badge: 'VERIFIED DISPATCH',
  },
  {
    code: 'POWER40',
    discount: 'INSTANT $30 OFF',
    description: 'Save $30 on Qi2 Workstation Docks and Fast Charging Stations.',
    badge: 'LIMITED FLASH SALE',
  },
  {
    code: 'PRIME15',
    discount: 'AMAZON PRIME EXTRA 15%',
    description: 'Extra discount voucher applied at checkout on partner deals.',
    badge: 'PARTNER VOUCHER',
  },
];

export const PromoCouponDrawer: React.FC<PromoCouponDrawerProps> = ({ onApplyCoupon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    if (onApplyCoupon) onApplyCoupon(code);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  return (
    <>
      {/* Floating Action Button (Anti-gravity Floating UI with high z-index & glowing shadow) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 text-slate-950 font-black text-xs tracking-wider uppercase rounded-2xl shadow-2xl shadow-cyan-500/40 border border-cyan-200/80 flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-2 hover:shadow-cyan-400/60 active:scale-95 cursor-pointer backdrop-blur-md group"
        title="View Corporate Coupon Vouchers"
      >
        <div className="w-5 h-5 rounded-lg bg-slate-950/20 flex items-center justify-center">
          <Gift className="w-3.5 h-3.5 fill-current text-slate-950 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <span>PROMO OFFERS (4)</span>
        <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
      </button>

      {/* Coupon Modal Overlay (Glassmorphism & Floating Card) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 relative shadow-2xl shadow-cyan-950/60 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>OFFICIAL AEROTHOR COMMERCE VOUCHERS</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Active Corporate Promo Codes</h3>
              <p className="text-xs text-slate-300">
                Click any code below to instantly copy and apply discount at checkout.
              </p>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {ACTIVE_COUPONS.map((coupon) => (
                <div
                  key={coupon.code}
                  className="p-4 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-200 shadow-md group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold rounded-md">
                        {coupon.badge}
                      </span>
                    </div>
                    <div className="font-extrabold text-white text-sm">{coupon.discount}</div>
                    <div className="text-[11px] text-slate-400 truncate">{coupon.description}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="px-3.5 py-2.5 bg-slate-950/80 hover:bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-white rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/10 hover:shadow-cyan-500/20 active:scale-95"
                  >
                    <strong className="text-cyan-400">{coupon.code}</strong>
                    {copiedCode === coupon.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Guaranteed US/UK Dispatch</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
