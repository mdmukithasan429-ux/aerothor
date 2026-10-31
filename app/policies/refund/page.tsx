import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCw, CheckCircle, HelpCircle, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Return Policy (30-Day Guarantee) | AeroCommerce',
  description: 'Hassle-free 30-day money-back guarantee. Transparent return address, pre-paid labels for defective products, and instant refund processing.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
          <span>/</span>
          <span>Policies</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Refund &amp; Return Policy</span>
        </nav>

        {/* Hero Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 mb-3 border border-emerald-300 dark:border-emerald-800/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>GMC Consumer Protection Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Return &amp; Refund Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            30-Day Money-Back Guarantee · Zero Restocking Fees for Defective Items
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <RefreshCw className="w-6 h-6 text-emerald-500 mb-2" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">30-Day Window</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Request a return within 30 calendar days from the date of package delivery.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Zero Restocking Fee</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              We never charge restocking fees on returns, exchanges, or warranty replacements.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Mail className="w-6 h-6 text-emerald-500 mb-2" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">3-5 Day Payout</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Refunds credit back directly to your original payment method within 3 to 5 business days.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Eligibility Criteria for Returns</h2>
            <p>
              To qualify for a full refund or direct exchange under our 30-day customer satisfaction guarantee:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>Item must be in original condition with all original packaging, cords, and documentation.</li>
              <li>Must have been purchased directly through our official AeroCommerce storefront.</li>
              <li>Proof of purchase (Order ID or confirmation email) must be provided.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Return Shipping Costs &amp; Labels</h2>
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <strong>Defective, Broken, or Incorrect Items:</strong> AeroCommerce covers 100% of return shipping costs. We email a pre-paid printable return shipping label instantly.
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  <strong>Change of Mind / Customer Remorse:</strong> The customer is responsible for standard return postage back to our regional domestic hub (US or UK warehouse).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. How to Initiate a Return (Step-by-Step)</h2>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>Send an email to <strong>returns@aerocommerce.com</strong> stating your Order Number (e.g. #ORD-2026-XXXX) and reason for return.</li>
              <li>Our dedicated returns desk responds within 12-24 business hours with an RMA (Return Merchandise Authorization) number and regional return address.</li>
              <li>Securely pack the item and attach the provided RMA slip.</li>
              <li>Upon arrival at our California or UK warehouse, our quality control team inspects and triggers your refund within 48 hours.</li>
            </ol>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Physical Return Address (US &amp; UK Hubs)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white font-sans mb-1">🇺🇸 United States Returns Hub:</p>
                <p>AeroCommerce Logistics LLC</p>
                <p>Attn: RMA Department</p>
                <p>1200 Logistics Boulevard, Suite 400</p>
                <p>Ontario, CA 91761, United States</p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white font-sans mb-1">🇬🇧 United Kingdom Returns Hub:</p>
                <p>AeroCommerce UK Distribution</p>
                <p>Unit 8, Brackmills Trade Park</p>
                <p>Northampton, NN4 7DT</p>
                <p>United Kingdom</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
