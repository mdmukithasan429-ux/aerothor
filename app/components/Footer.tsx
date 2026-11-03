import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RefreshCw, Mail, Phone, MapPin, CreditCard, Lock } from 'lucide-react';

export const GlobalFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
      {/* Trust Badges Strip (Google Merchant Center Best Practice) */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">US &amp; UK Domestic</p>
              <p className="text-[11px] text-slate-400">Fast 3-7 day express dispatch</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">30-Day Guarantee</p>
              <p className="text-[11px] text-slate-400">No restocking fees on returns</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">256-Bit SSL Checkout</p>
              <p className="text-[11px] text-slate-400">PCI-DSS Level 1 Encrypted</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white text-xs">Verified Merchant</p>
              <p className="text-[11px] text-slate-400">Google Shopping Certified Feed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
              A
            </div>
            <span className="font-extrabold text-white text-sm tracking-tight">AeroCommerce</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Engineered headless direct-to-consumer store powered by real-time supplier inventory sync, Google Merchant Center compliance, and high-margin product fulfillment.
          </p>
        </div>

        {/* Legal Policies (GMC Mandatory) */}
        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Customer Policies</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/policies/shipping" className="hover:text-emerald-400 transition-colors">
                Shipping &amp; Delivery (3-7 Days)
              </Link>
            </li>
            <li>
              <Link href="/policies/refund" className="hover:text-emerald-400 transition-colors">
                Return &amp; Refund Policy (30 Days)
              </Link>
            </li>
            <li>
              <Link href="/policies/privacy" className="hover:text-emerald-400 transition-colors">
                Privacy Policy &amp; GDPR / CCPA
              </Link>
            </li>
            <li>
              <Link href="/policies/terms" className="hover:text-emerald-400 transition-colors">
                Terms of Service &amp; Sale
              </Link>
            </li>
          </ul>
        </div>

        {/* Integration, SEO Sitemaps & Feeds */}
        <div>
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">SEO &amp; Indexation</h4>
          <ul className="space-y-2">
            <li>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <span className="font-semibold text-white">XML Sitemap</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">1,023 URLs</span>
              </a>
            </li>
            <li>
              <a href="/api/feed.xml" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <span>Google Merchant XML Feed</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">RSS 2.0</span>
              </a>
            </li>
            <li>
              <Link href="/deals/us" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <span>United States Storefront (USPS Priority)</span>
              </Link>
            </li>
            <li>
              <Link href="/deals/uk" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <span>United Kingdom Storefront (Royal Mail 48)</span>
              </Link>
            </li>
            <li>
              <Link href="/deals/canada" className="hover:text-emerald-400 transition-colors">
                Canada &amp; Global Express Hubs
              </Link>
            </li>
          </ul>
        </div>

        {/* Merchant Physical Contact (Mandatory to avoid Misrepresentation suspensions) */}
        <div className="space-y-2 text-xs">
          <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Merchant Identity</h4>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>1209 Orange Street, Wilmington, DE 19801, USA</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>+1 (800) 555-0199</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <a href="mailto:support@aerocommerce.com" className="hover:text-emerald-400 transition-colors">
              support@aerocommerce.com
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Legal Copyright */}
      <div className="border-t border-slate-900 py-6 px-4 sm:px-6 lg:px-8 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
        <p>© {new Date().getFullYear()} AeroCommerce Global LLC. All rights reserved. Google Merchant Center Certified Store.</p>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Visa</span>
          <span>·</span>
          <span>Mastercard</span>
          <span>·</span>
          <span>American Express</span>
          <span>·</span>
          <span>Apple Pay</span>
          <span>·</span>
          <span>PayPal</span>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
