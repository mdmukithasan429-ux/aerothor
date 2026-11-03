import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ShieldAlert, Award, FileCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | AeroCommerce Global',
  description: 'Terms of service, conditions of sale, pricing transparency, and consumer protection policies for AeroCommerce.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
          <span>/</span>
          <span>Policies</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Terms of Service</span>
        </nav>

        {/* Hero Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 mb-3 border border-emerald-300 dark:border-emerald-800/50">
            <Scale className="w-3.5 h-3.5" />
            <span>Commercial Terms &amp; Conditions of Sale</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Governing Law: Delaware, United States &amp; England &amp; Wales, United Kingdom
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Overview &amp; Acceptance of Terms</h2>
            <p>
              This website is operated by AeroCommerce Global LLC. Throughout the site, the terms &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; refer to AeroCommerce. By visiting our store and/or purchasing an item, you engage in our &quot;Service&quot; and agree to be bound by the following terms and conditions.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Accurate Product Pricing &amp; Availability</h2>
            <p>
              Prices for our products are subject to change without notice. In strict compliance with Google Merchant Center policies:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>The price displayed on our website and in our Google Shopping Feed matches the final checkout price exactly.</li>
              <li>There are no unannounced surcharges, unexpected packaging fees, or forced recurring subscriptions.</li>
              <li>All items marked as &quot;in_stock&quot; are physically ready for dispatch from our domestic fulfillment network.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Billing &amp; Payment Security</h2>
            <p>
              We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and PayPal. All financial transactions are encrypted using 256-bit SSL encryption. We reserve the right to refuse or cancel any order if fraudulent activity is suspected.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Merchant Contact &amp; Business Entity</h2>
            <p>
              Questions regarding these Terms of Service should be directed to our corporate legal desk:
            </p>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs space-y-1 font-mono">
              <p className="font-bold text-slate-900 dark:text-white font-sans">AeroCommerce Global LLC</p>
              <p>Email: legal@aerocommerce.com / support@aerocommerce.com</p>
              <p>Phone: +1 (800) 555-0199 (Mon–Fri, 9am–5pm EST)</p>
              <p>Registered Address: 1209 Orange Street, Wilmington, DE 19801, USA</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
