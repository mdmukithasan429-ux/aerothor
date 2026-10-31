import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Exclusive Affiliate Deals & Partner Offers | AeroThor Direct',
  description:
    'Browse our curated collection of verified affiliate deals and partner products from Amazon and top global merchants. Live pricing and discount tracking.',
  openGraph: {
    title: 'Exclusive Affiliate Deals & Partner Offers | AeroThor Direct',
    description:
      'Curated affiliate partner deals from Amazon and premier brands. Real-time discounts on everyday carry, audio gear, and travel essentials.',
  },
};

export default async function AffiliatesNextPage() {
  let affiliateProducts: any[] = [];
  try {
    affiliateProducts = await prisma.product.findMany({
      where: {
        productType: 'affiliate',
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.warn('[Affiliates Page DB Fallback]:', err);
  }

  // Fallback items if DB is still synchronizing
  if (affiliateProducts.length === 0) {
    affiliateProducts = [
      {
        id: 'AFF-ANKER-QI2-01',
        title: 'Anker Prime 27,650mAh Power Bank (250W) with App Control',
        description: 'Ultra-high-output 250W multi-port fast charging power bank. Built with active smart display, Bluetooth companion app monitoring, and aerospace thermal regulation.',
        price: 179.99,
        salePrice: 149.99,
        brand: 'Anker',
        mainImageUrl: 'https://images.unsplash.com/photo-1622445262464-84b152477381?auto=format&fit=crop&w=800&q=80',
        affiliateUrl: 'https://www.amazon.com/dp/B0BYP2F3SG?tag=aerothor-20',
      },
      {
        id: 'AFF-STANLEY-TUMBLER-02',
        title: 'Stanley IceFlow Stainless Steel 30oz Straw Tumbler — Cold for 12 Hours',
        description: 'Double-wall vacuum insulation keeps iced drinks cold for up to 2 days. Features leak-resistant Flip Straw 2.0, ergonomic folding handle, and car cup-holder compatible base.',
        price: 45.00,
        salePrice: 38.00,
        brand: 'Stanley 1913',
        mainImageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
        affiliateUrl: 'https://www.amazon.com/dp/B09J9H4W6Y?tag=aerothor-20',
      },
      {
        id: 'AFF-OSPREY-PACK-03',
        title: 'Osprey Daylite Plus Commuter Travel Pack 20L — Ergonomic Breathable Harness',
        description: 'Everyday urban commuter pack with padded interior laptop sleeve and dual stretch-mesh side water bottle pockets. Built with bluesign-approved recycled polyester.',
        price: 75.00,
        salePrice: 64.95,
        brand: 'Osprey',
        mainImageUrl: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=800&q=80',
        affiliateUrl: 'https://www.amazon.com/dp/B08LP1N6F6?tag=aerothor-20',
      },
      {
        id: 'AFF-SONY-WH1000XM5',
        title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
        description: 'Two processors and 8 microphones for unprecedented noise cancellation. Up to 30-hour battery life with quick charging. Auto NC Optimizer automatically optimizes sound.',
        price: 399.99,
        salePrice: 348.00,
        brand: 'Sony',
        mainImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH?tag=aerothor-20',
      },
    ];
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner with Distinct Amber Color Theme */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-semibold">
          <span>Official Partner Program · Direct Merchant Fulfillment</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Curated <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">Affiliate Partner Deals</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          Top-rated hardware, audio gear, and commuter essentials available through our official affiliate partners including Amazon. Real-time prices with direct purchase links.
        </p>
        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-950/30 text-xs text-amber-200/90 leading-snug">
          <strong>Affiliate Disclosure:</strong> When you purchase through links on this page, we may earn an affiliate commission at no extra cost to you.
        </div>
      </div>

      {/* Grid of Affiliate Products with Clear Distinct Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {affiliateProducts.map((p) => {
          const targetUrl = p.affiliateUrl || `https://www.amazon.com/s?k=${encodeURIComponent(p.title)}`;
          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-slate-900/90 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-500/10 transition-all overflow-hidden"
            >
              <div>
                <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                  <img
                    src={p.mainImageUrl || p.image_link}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Distinct Affiliate Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                      Affiliate Deal
                    </span>
                  </div>
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-amber-500/30 text-[10px] font-mono text-amber-300">
                    Amazon Partner
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-semibold uppercase tracking-wider">
                    <span>{p.brand || 'Partner'}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{p.sku || p.id}</span>
                  </div>
                  <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug min-h-[2.5rem]">
                    {p.title}
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-slate-800 bg-slate-950/60 mt-auto space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono tabular-nums">
                    {p.salePrice ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-extrabold text-amber-400">
                          ${Number(p.salePrice).toFixed(2)} USD
                        </span>
                        <span className="text-xs text-slate-500 line-through">
                          ${Number(p.price).toFixed(2)} USD
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-extrabold text-white">
                        ${Number(p.price).toFixed(2)} USD
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Prime Eligible
                  </span>
                </div>

                {/* Direct Buy on Amazon / View Deal Outbound Link */}
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Buy on Amazon / View Deal ↗</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
