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
      {/* Trigger Button (Fixed Bottom Left) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-full shadow-2xl shadow-emerald-500/40 border border-emerald-300 flex items-center gap-2 transition-all duration-300 hover:scale-105 cursor-pointer"
        title="View Corporate Coupon Vouchers"
      >
        <Gift className="w-4 h-4 fill-current animate-bounce" />
        <span>PROMO OFFERS (4)</span>
      </button>

      {/* Coupon Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <Sparkles className="w-4 h-4" />
                <span>OFFICIAL AEROTHOR COMMERCE VOUCHERS</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">Active Corporate Promo Codes</h3>
              <p className="text-xs text-slate-400">
                Click any code below to instantly copy and apply discount at checkout.
              </p>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {ACTIVE_COUPONS.map((coupon) => (
                <div
                  key={coupon.code}
                  className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold rounded">
                        {coupon.badge}
                      </span>
                    </div>
                    <div className="font-extrabold text-white text-sm">{coupon.discount}</div>
                    <div className="text-[11px] text-slate-400 truncate">{coupon.description}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(coupon.code)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-white rounded-lg transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <strong className="text-emerald-400">{coupon.code}</strong>
                    {copiedCode === coupon.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Guaranteed US/UK Dispatch</span>
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-emerald-400 font-bold hover:underline"
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
