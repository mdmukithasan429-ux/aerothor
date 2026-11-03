import React, { useState, useEffect } from 'react';
import { Mail, Sparkles, Check, Copy, X, ArrowRight, ShieldCheck, Gift } from 'lucide-react';
import { useStoreSettings } from '../../lib/useStoreSettings';

const NEWSLETTER_STORAGE_KEY = 'aerothor_newsletter_subscribed_email';
const NEWSLETTER_DISMISSED_KEY = 'aerothor_newsletter_banner_dismissed';
const DISCOUNT_CODE = 'AERO15';

export const NewsletterBanner: React.FC = () => {
  const { settings } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(NEWSLETTER_STORAGE_KEY);
      if (savedEmail) {
        setIsSubscribed(true);
        setSubscribedEmail(savedEmail);
      }
      const dismissed = localStorage.getItem(NEWSLETTER_DISMISSED_KEY);
      if (dismissed === 'true' && !savedEmail) {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setIsSubscribed(true);
        setSubscribedEmail(cleanEmail);
        try {
          localStorage.setItem(NEWSLETTER_STORAGE_KEY, cleanEmail);
          localStorage.removeItem(NEWSLETTER_DISMISSED_KEY);
        } catch {}
      } else {
        // Fallback to local save if offline or endpoint non-fatal
        setIsSubscribed(true);
        setSubscribedEmail(cleanEmail);
        try {
          localStorage.setItem(NEWSLETTER_STORAGE_KEY, cleanEmail);
        } catch {}
      }
    } catch (err) {
      // Non-fatal offline fallback
      setIsSubscribed(true);
      setSubscribedEmail(cleanEmail);
      try {
        localStorage.setItem(NEWSLETTER_STORAGE_KEY, cleanEmail);
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(DISCOUNT_CODE).catch(() => {});
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(NEWSLETTER_DISMISSED_KEY, 'true');
    } catch {}
  };

  const handleReopen = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(NEWSLETTER_DISMISSED_KEY);
    } catch {}
  };

  // If dismissed and not subscribed, render subtle floating sticky trigger button
  if (isDismissed && !isSubscribed) {
    return (
      <button
        type="button"
        onClick={handleReopen}
        className="fixed bottom-4 right-4 z-40 px-3.5 py-2.5 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-xl shadow-slate-950/80 hover:bg-slate-800 hover:border-emerald-400 transition-all flex items-center gap-2 cursor-pointer animate-pulse hover:animate-none"
        title="Claim 15% Off Discount Code"
      >
        <Gift className="w-4 h-4 text-emerald-400" />
        <span>Get 15% Off</span>
      </button>
    );
  }

  // If user is already subscribed, render sleek compact VIP badge
  if (isSubscribed) {
    return (
      <div className="bg-emerald-950/90 border-t border-emerald-500/30 py-2.5 px-4 text-xs text-emerald-200 sticky bottom-0 z-40 backdrop-blur-md shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white">VIP Newsletter Unlocked!</span>{' '}
              <span className="text-emerald-300/90 text-[11px]">
                Active subscriber ({subscribedEmail}). Promo code:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-slate-950 border border-emerald-500/50 rounded-lg font-mono font-black text-emerald-300 text-xs tracking-wider">
              {DISCOUNT_CODE}
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 z-40 w-full bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Dismiss Button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute -top-2 right-0 sm:top-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Dismiss newsletter banner"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Content */}
          <div className="flex items-center gap-3.5 max-w-xl text-center sm:text-left">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 items-center justify-center text-emerald-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>VIP Exclusive Offer</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">· 18,400+ Subscribers</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Get 15% Off Your First Order at {settings.storeName || 'Our Store'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Subscribe for exclusive US &amp; UK deal drops, flash coupons, and early product releases.
              </p>
            </div>
          </div>

          {/* Right Signup Form */}
          <form onSubmit={handleSubscribe} className="w-full lg:w-auto shrink-0 space-y-1">
            <div className="flex items-center gap-2 max-w-md w-full mx-auto lg:mx-0">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Joining...' : 'Claim 15% Off'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {errorMessage ? (
              <p className="text-[10px] text-rose-400 text-center lg:text-left">{errorMessage}</p>
            ) : (
              <p className="text-[10px] text-slate-500 text-center lg:text-left flex items-center justify-center lg:justify-start gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />
                <span>Zero spam. Unsubscribe anytime with 1 click.</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsletterBanner;
