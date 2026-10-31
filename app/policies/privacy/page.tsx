import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Eye, Shield, Database, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | AeroCommerce Global',
  description: 'Learn how AeroCommerce protects your personal information. Fully compliant with GDPR, CCPA, and Google Merchant Center data privacy standards.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
          <span>/</span>
          <span>Policies</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Privacy Policy</span>
        </nav>

        {/* Hero Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 mb-3 border border-emerald-300 dark:border-emerald-800/50">
            <Lock className="w-3.5 h-3.5" />
            <span>GDPR, CCPA &amp; Google Merchant Security Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Last Updated: October 2026 · We Never Sell Your Personal Information
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
            <p>
              When you visit or make a purchase from AeroCommerce, we collect specific information necessary to fulfill your order and optimize your shopping experience:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Contact &amp; Shipping Details:</strong> Full name, shipping/billing address, email address, phone number for courier SMS delivery alerts.</li>
              <li><strong>Payment Processing:</strong> Transactions are tokenized and processed via PCI-DSS Level 1 compliant gateways (Stripe / PayPal). We never store raw credit card numbers on our servers.</li>
              <li><strong>Device &amp; Telemetry Data:</strong> IP address, browser type, time zone, and cookies for cart persistence and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. How We Use Your Data</h2>
            <p>
              Your information is used strictly to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>Process, dispatch, and track your e-commerce orders.</li>
              <li>Communicate order updates, tracking milestones, and customer support responses.</li>
              <li>Screen transactions for potential fraud or unauthorized activity.</li>
              <li>Comply with Google Shopping and Google Merchant Center advertiser transparency rules.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Information Sharing &amp; Third Parties</h2>
            <p>
              We only share personal data with trusted infrastructure providers required to operate our service:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Fulfillment &amp; Couriers:</strong> CJ Logistics, USPS, FedEx, and Royal Mail for physical delivery.</li>
              <li><strong>Secure Payments:</strong> Stripe and PayPal for payment settlement.</li>
              <li><strong>Analytics:</strong> Google Analytics 4 (anonymized IP) for site performance monitoring.</li>
            </ul>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Your Privacy Rights (GDPR &amp; CCPA)</h2>
            <p>
              If you are a resident of the European Union, United Kingdom, or California, you have the right to access, rectify, or request immediate erasure of your personal data. To exercise your rights, email <a href="mailto:privacy@aerocommerce.com" className="text-emerald-600 dark:text-emerald-400 underline font-medium">privacy@aerocommerce.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
