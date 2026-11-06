import React, { useState, useEffect } from 'react';
import { Sparkles, X, Gift, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TargetRegionConfig } from '../../lib/i18n-regions';

interface ExitIntentModalProps {
  currentRegion: TargetRegionConfig;
  onApplyCoupon?: (code: string) => void;
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ currentRegion, onApplyCoupon }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasTriggered, setHasTriggered] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Session storage prevents annoying repeat popups
    try {
      if (sessionStorage.getItem('aerothor_exit_intent_shown') === 'true') {
        return;
      }
    } catch {
      // ignore
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !hasTriggered) {
        setIsOpen(true);
        setHasTriggered(true);
        try {
          sessionStorage.setItem('aerothor_exit_intent_shown', 'true');
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasTriggered]);

  if (!isOpen) return null;

  const promoCode = `${currentRegion.isoCode}15OFF`;

  const handleCopyAndClaim = () => {
    navigator.clipboard?.writeText(promoCode).catch(() => {});
    setCopied(true);
    if (onApplyCoupon) onApplyCoupon(promoCode);
    setTimeout(() => {
      setIsOpen(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WAIT! EXCLUSIVE {currentRegion.flag} {currentRegion.countryName.toUpperCase()} OFFER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Claim 15% OFF + Free {currentRegion.flag} Express Dispatch
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Before you leave, grab an instant 15% discount voucher on your order with tracked delivery to {currentRegion.countryName}.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PROMO CODE FOR {currentRegion.isoCode}:</span>
            <span className="text-emerald-400 font-bold">100% VERIFIED</span>
          </div>
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-900 border border-emerald-500/40 rounded-xl">
            <span className="text-xl font-mono font-black tracking-wider text-emerald-400">
              {promoCode}
            </span>
            <button
              type="button"
              onClick={handleCopyAndClaim}
              className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wide rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <span>Claim Voucher</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left text-[11px] text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Applies to all Items in Cart</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>30-Day Money-Back Guarantee</span>
          </div>
        </div>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors"
          >
            No thanks, I will pay full price
          </button>
        </div>
      </div>
    </div>
  );
};
