import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Clock, ShieldCheck, MapPin, Globe, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | AeroCommerce Global',
  description: 'Fast 3-7 day domestic dispatch to USA & UK destinations. Transparent tracking, zero hidden fees, and Google Merchant Center certified fulfillment.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
          <span>/</span>
          <span>Policies</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Shipping &amp; Delivery</span>
        </nav>

        {/* Hero Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 mb-3 border border-emerald-300 dark:border-emerald-800/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Merchant Center Certified Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Effective Date: January 1, 2026 · Last Updated: October 2026
          </p>
        </div>

        {/* Core SLA Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">US / UK Express</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              3 to 7 business days delivery via USPS Priority, FedEx Domestic, and Royal Mail 24/48.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">24-48h Order Handling</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Automated warehouse routing ensures packages depart fulfillment hubs within 1-2 business days.
            </p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Real-Time Tracking</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Full step-by-step courier telemetry sent instantly via email &amp; SMS upon dispatch.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              1. Domestic Warehouses &amp; Fulfillment Destinations
            </h2>
            <p>
              AeroCommerce operates direct partnerships with domestic fulfillment centers across the United States (California, Texas, and New Jersey) and the United Kingdom (Northampton and Birmingham).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-lg">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white">
                  <tr>
                    <th className="p-3">Destination Region</th>
                    <th className="p-3">Order Processing</th>
                    <th className="p-3">Transit Time</th>
                    <th className="p-3">Courier Partner</th>
                    <th className="p-3">Standard Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium">United States (Continental)</td>
                    <td className="p-3">24 – 48 Hours</td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">3 – 7 Business Days</td>
                    <td className="p-3">USPS Ground Advantage / FedEx</td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">FREE on orders &gt; $50 (or $4.99)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">United Kingdom</td>
                    <td className="p-3">24 – 48 Hours</td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">3 – 6 Business Days</td>
                    <td className="p-3">Royal Mail Tracked 48 / DPD</td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">FREE on orders &gt; £40 (or £3.99)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Canada &amp; Australia</td>
                    <td className="p-3">24 – 48 Hours</td>
                    <td className="p-3">7 – 12 Business Days</td>
                    <td className="p-3">Canada Post / Australia Post</td>
                    <td className="p-3">$7.99 Flat Rate</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Order Cutoff &amp; Processing Deadlines</h2>
            <p>
              Orders placed before <strong>2:00 PM EST (Monday – Friday)</strong> are handed over to our dispatch queues on the exact same business day. Orders submitted on weekends or federal holidays begin packaging on the following business morning.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Customs, Duties &amp; Taxes (No Hidden Fees)</h2>
            <p>
              In accordance with Google Merchant Center transparency policies, <strong>all import duties and sales taxes are calculated transparently at checkout</strong>. Domestic US &amp; UK orders are shipped directly from domestic hubs, eliminating surprise customs charges for the customer.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Damaged or Lost Shipments</h2>
            <p>
              Every parcel shipped includes comprehensive courier transit insurance. In the rare event of damage during transit or a missing scan beyond 10 business days, contact our priority helpdesk at <a href="mailto:support@aerocommerce.com" className="text-emerald-600 dark:text-emerald-400 underline font-medium">support@aerocommerce.com</a> for immediate replacement or a 100% refund.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
