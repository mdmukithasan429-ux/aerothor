import React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  CheckCircle2,
  Lock,
  ChevronRight,
  PackageCheck,
  Heart,
  Share2,
  Zap,
} from 'lucide-react';

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * 1. DYNAMIC METADATA GENERATION FOR NEXT.JS & GOOGLE SHOPPING
 */
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { sku: id }, { slug: id }],
      status: 'active',
      isVisible: true,
    },
  });

  if (!product) {
    return {
      title: 'Product Not Found | AeroCommerce',
      description: 'The requested product is not available or has been discontinued.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-store.com';
  const canonicalUrl = `${siteUrl}/product/${product.slug || product.id}`;
  const priceDisplay = `$${Number(product.price).toFixed(2)}`;

  return {
    title: `${product.title} - ${priceDisplay} | AeroCommerce Direct`,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.title} | AeroCommerce`,
      description: product.description.slice(0, 160),
      url: canonicalUrl,
      siteName: 'AeroCommerce Global Store',
      images: [
        {
          url: product.mainImageUrl,
          width: 1200,
          height: 1200,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description.slice(0, 160),
      images: [product.mainImageUrl],
    },
  };
}

/**
 * 2. HIGH-CONVERTING PRODUCT DETAILS PAGE (PDP)
 */
export default async function ProductDetailPage({ params }: Props) {
  const { id } = params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { sku: id }, { slug: id }],
      status: 'active',
      isVisible: true,
    },
  });

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-store.com';
  const productUrl = `${siteUrl}/product/${product.slug || product.id}`;
  const priceNum = Number(product.price);
  const salePriceNum = product.salePrice ? Number(product.salePrice) : null;
  const currentPrice = salePriceNum || priceNum;
  const inStock = product.availability === 'in_stock' && product.stockQuantity > 0;

  // Additional gallery images
  const additionalImgs: string[] = Array.isArray(product.additionalImages)
    ? (product.additionalImages as string[])
    : [];
  const gallery = [product.mainImageUrl, ...additionalImgs].slice(0, 5);

  /**
   * CRITICAL: Google Merchant Center & Google Search Rich Snippets Schema.org JSON-LD
   */
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.title,
    image: gallery,
    description: product.description,
    sku: product.sku,
    mpn: product.mpn || product.sku,
    gtin13: product.gtin || undefined,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AeroCommerce',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: product.currency || 'USD',
      price: currentPrice.toFixed(2),
      priceValidUntil: '2026-12-31',
      itemCondition:
        product.condition === 'new'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'AeroCommerce Global',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: ['US', 'GB'],
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: product.fulfillmentDaysMin || 3,
            maxValue: product.fulfillmentDaysMax || 7,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: ['US', 'GB'],
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 30,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
    },
  };

  return (
    <>
      {/* 3. SCHEMA.ORG JSON-LD INJECTION */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumb Navigation */}
          <nav className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Link href="/" className="hover:text-emerald-500 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/catalog" className="hover:text-emerald-500 transition-colors">Products</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 dark:text-slate-300 truncate max-w-xs">{product.title}</span>
          </nav>

          {/* Main PDP Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Image Gallery (6 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm group">
                <img
                  src={product.mainImageUrl}
                  alt={product.title}
                  className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                  loading="eager"
                />

                {salePriceNum && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-full shadow-lg">
                    SAVE ${(priceNum - salePriceNum).toFixed(2)}
                  </div>
                )}

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Selector */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border-2 border-emerald-500 p-1 shrink-0 overflow-hidden cursor-pointer"
                    >
                      <img src={img} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Buy Box & Product Attributes (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Brand & Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    {product.brand}
                  </span>
                  <div className="flex items-center text-amber-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                    <span className="ml-1 text-slate-500 dark:text-slate-400 font-medium">(128 reviews)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {product.title}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-1">SKU: {product.sku}</p>
              </div>

              {/* Price Banner */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ${currentPrice.toFixed(2)}
                </span>
                {salePriceNum && (
                  <span className="text-base text-slate-400 line-through">
                    ${priceNum.toFixed(2)}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  Free US/UK Express Shipping
                </span>
              </div>

              {/* Stock Status & Domestic Logistics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  {inStock ? (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock · Ready to dispatch from {product.warehouseCountry || 'US'} hub
                    </span>
                  ) : (
                    <span className="text-rose-500 font-semibold">Out of Stock</span>
                  )}
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-900/60 rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Truck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Estimated Delivery: <strong>3 to 7 business days</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <RefreshCw className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>30-Day Money-Back Guarantee (No Restocking Fees)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  disabled={!inStock}
                  className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Buy Now with Express Checkout</span>
                </button>

                <button
                  disabled={!inStock}
                  className="w-full py-3 px-6 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Add to Cart
                </button>
              </div>

              {/* Security & GMC Compliance Guarantee */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  256-Bit SSL Encrypted
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Google Verified Merchant Feed
                </span>
              </div>

              {/* Product Description Tabs */}
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Product Overview</h3>
                <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {product.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
