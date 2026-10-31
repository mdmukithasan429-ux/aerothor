import React from 'react';
import {
  RotateCcw,
  ShieldCheck,
  Truck,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';

interface ReturnPolicyViewProps {
  onBackToStore?: () => void;
  onNavigateToTracking?: () => void;
}

export const ReturnPolicyView: React.FC<ReturnPolicyViewProps> = ({
  onBackToStore,
  onNavigateToTracking,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header / Breadcrumb */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Storefront</span>
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>AeroThor</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-emerald-400 font-medium">Return &amp; Refund Policy</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Policy Header Badge */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Merchant Center Certified Policy</span>
          </span>
          <span className="text-xs text-slate-400">Effective Date: October 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
          Return &amp; Refund Policy
        </h1>
        <p className="text-base text-slate-300 leading-relaxed mb-8">
          At <strong className="text-white">AeroThor</strong>, customer satisfaction is our top priority. We offer a transparent, hassle-free <strong className="text-emerald-400">30-day return window</strong> for all dropshipping catalog items purchased through our secure native checkout.
        </p>

        {/* Quick Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-slate-400">Return Window</div>
            <div className="text-sm font-bold text-white mt-0.5">30 Calendar Days</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <Truck className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-slate-400">Defective / Damaged</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">100% Free Return</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <RotateCcw className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs text-slate-400">Refund Speed</div>
            <div className="text-sm font-bold text-white mt-0.5">5–7 Business Days</div>
          </div>
        </div>

        {/* Core Policy Body */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-8">
          {/* Section 1: 30-Day Window */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">
                1
              </span>
              <span>30-Day Return Eligibility</span>
            </h2>
            <p>
              You have <strong className="text-white">30 calendar days</strong> from the date your package is marked as delivered by the postal carrier (USPS, FedEx, Royal Mail, Canada Post, or Australia Post) to request a return or exchange.
            </p>
            <p>
              To be eligible for a full refund, your item must meet the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300 marker:text-emerald-400">
              <li>Item must be unused, unwashed, and in the exact condition received.</li>
              <li>Must be in its original manufacturer packaging with all accessories, cables, manuals, and tags intact.</li>
              <li>Accompanied by the original order confirmation number or proof of purchase.</li>
            </ul>
          </section>

          {/* Section 2: How to Initiate a Return */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">
                2
              </span>
              <span>How to Initiate a Return</span>
            </h2>
            <p>
              Initiating a return is fast and straightforward. Follow these steps:
            </p>
            <ol className="list-decimal pl-5 space-y-2 marker:text-emerald-400">
              <li>
                <strong className="text-white">Email Customer Support:</strong> Send an email to{' '}
                <a
                  href="mailto:support@aerothor.com"
                  className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold underline underline-offset-2"
                >
                  support@aerothor.com
                </a>{' '}
                with your Order Number (e.g., <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300">ORD-2026-XXXXXX</code>) and reason for return.
              </li>
              <li>
                <strong className="text-white">Photo Verification (If Damaged):</strong> If your item arrived damaged, defective, or incorrect, attach clear photographs or a short video showing the flaw and shipping label.
              </li>
              <li>
                <strong className="text-white">Return Authorization (RMA):</strong> Our support team will respond within 24 hours with an RMA confirmation number and the designated domestic return facility address.
              </li>
            </ol>
          </section>

          {/* Section 3: Return Shipping Costs */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">
                3
              </span>
              <span>Return Shipping Fee Responsibility</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Damaged / Defective / Store Error</span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Store Pays 100%:</strong> AeroThor provides a complimentary prepaid return shipping label or dispatches a free replacement immediately.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wide">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Customer Remorse / Size Change</span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Customer Pays:</strong> For change of mind, buyer remorse, or accidental ordering, the customer is responsible for standard return postage back to our warehouse.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              * Note: We never charge hidden restocking fees or processing surcharges on returns.
            </p>
          </section>

          {/* Section 4: Refund Processing Timeline */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">
                4
              </span>
              <span>Refund Processing &amp; Payout Timeline</span>
            </h2>
            <p>
              Once your returned package is received and inspected at our domestic fulfillment facility, we will notify you via email regarding the approval status.
            </p>
            <p>
              Upon approval, your refund is credited automatically to your <strong className="text-white">original payment method</strong> (Stripe, Visa, MasterCard, American Express, Apple Pay, or Google Pay) within <strong className="text-emerald-400">5 to 7 business days</strong>.
            </p>
            <p className="text-xs text-slate-400">
              Depending on your financial institution or credit card issuer, it may take an additional 2–3 business days for the credit to appear on your bank statement.
            </p>
          </section>

          {/* Section 5: Affiliate Products Policy Disclosure */}
          <section className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <ExternalLink className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold text-white">Affiliate &amp; Partner Deal Clause</h2>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Certain catalog items listed under our <strong className="text-amber-300">"Affiliate Deals"</strong> section are sold and fulfilled directly by third-party partner marketplaces (such as <strong>Amazon.com</strong> or <strong>AliExpress</strong>).
            </p>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              If you purchased an affiliate item after clicking an outbound partner deal link, your transaction, shipping, and refund process are governed strictly by the respective merchant&apos;s return policy (e.g., <em>Amazon A-to-z Guarantee</em>). For affiliate returns, please log into your account on the merchant&apos;s platform to initiate the return.
            </p>
          </section>

          {/* Section 6: Contact Information */}
          <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <span>Questions or Need Assistance?</span>
            </h2>
            <p className="text-xs text-slate-300">
              Our dedicated customer care team is available 24/7 to help with any return, replacement, or order tracking questions.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
              <a
                href="mailto:support@aerothor.com"
                className="px-4 py-2 bg-emerald-400 text-slate-950 font-bold rounded-lg hover:bg-emerald-300 transition-colors flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>support@aerothor.com</span>
              </a>
              {onNavigateToTracking && (
                <button
                  onClick={onNavigateToTracking}
                  className="px-4 py-2 bg-slate-800 text-slate-200 font-semibold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Track Your Order</span>
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} AeroThor Inc. All rights reserved. Google Merchant Center certified store.</p>
      </footer>
    </div>
  );
};

export default ReturnPolicyView;
