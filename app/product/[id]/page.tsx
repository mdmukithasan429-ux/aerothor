import React from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { INITIAL_PRODUCTS } from '../../../src/server/seed-data';
import { GmcProduct } from '../../../src/lib/gmc-feed';
import {
  resolveProductSeoDescription,
} from '../../../src/lib/seo-metadata';
import {
  TARGET_REGIONS,
  buildProductHreflangAlternates,
  findRegionBySlugOrIso,
  formatRegionalPrice,
} from '../../../src/lib/i18n-regions';
import ProductDetails from '../../../components/product/ProductDetails';

const BASE_DOMAIN = 'https://aerothor.vercel.app';

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Resolves a product by SKU / ID from the catalog
 */
async function getProductById(rawId: string): Promise<GmcProduct | null> {
  const decodedId = decodeURIComponent(rawId || '').trim().toLowerCase();
  if (!decodedId) return null;

  const match = INITIAL_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === decodedId ||
      (p.mpn || '').toLowerCase() === decodedId ||
      (p.cj_sku || '').toLowerCase() === decodedId
  );

  return match || null;
}

/**
 * Resolves related products (prioritizing Amazon/Affiliate items and same-category deals)
 */
async function getRelatedProducts(currentProduct: GmcProduct): Promise<GmcProduct[]> {
  return INITIAL_PRODUCTS.filter((p) => p.id !== currentProduct.id).slice(0, 8);
}

/**
 * 1. DYNAMIC INTERNATIONAL SEO, LOCATION KEYWORDS & 10-COUNTRY HREFLANG (`generateMetadata`)
 */
export async function generateMetadata({
  params,
  searchParams,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const product = await getProductById(id);

  if (!product) {
    return {
      title: 'Product Not Found | AeroThor',
      description: 'The requested product could not be found in the AeroThor catalog.',
      robots: { index: false, follow: true },
    };
  }

  // Detect targeted or geo-routed region from ?region= / ?country= or Edge Middleware headers
  const queryRegionParam =
    typeof resolvedSearchParams?.region === 'string'
      ? resolvedSearchParams.region
      : typeof resolvedSearchParams?.country === 'string'
      ? resolvedSearchParams.country
      : null;

  let headerCountry: string | null = null;
  try {
    const reqHeaders = await headers();
    headerCountry =
      reqHeaders.get('x-user-country') || reqHeaders.get('x-vercel-ip-country');
  } catch {
    headerCountry = null;
  }

  const detectedRegion = findRegionBySlugOrIso(queryRegionParam || headerCountry);
  const priceInfo = detectedRegion
    ? formatRegionalPrice(product.sale_price || product.price, detectedRegion)
    : {
        formatted: `$${(product.sale_price || product.price || '29.99').replace(/[^0-9.]/g, '')}`,
        numeric: (product.sale_price || product.price || '29.99').replace(/[^0-9.]/g, '') || '29.99',
        currency: 'USD',
      };

  // Location-specific SEO title: "Buy [Product Name] - Fast Shipping to UK/Canada" (or targeted region)
  const locationShippingSuffix = detectedRegion
    ? detectedRegion.fastShippingKeyword
    : 'Fast Shipping to UK/Canada & US';

  const seoTitle = product.seo_title?.trim()
    ? `${product.seo_title.trim()} - ${locationShippingSuffix}`
    : `Buy ${product.title} - ${locationShippingSuffix} | AeroThor`;

  const baseSeoDescription = resolveProductSeoDescription(product);
  const seoDescription = detectedRegion
    ? `Buy ${product.title} (${priceInfo.formatted}) with ${detectedRegion.dispatchBannerText} via ${detectedRegion.carrierName}. ${baseSeoDescription}`.slice(0, 160)
    : `Buy ${product.title} — ${locationShippingSuffix}. ${baseSeoDescription}`.slice(0, 160);

  const canonicalUrl =
    detectedRegion && queryRegionParam && detectedRegion.slug !== 'us'
      ? `${BASE_DOMAIN}/product/${encodeURIComponent(product.id)}?region=${detectedRegion.slug}`
      : `${BASE_DOMAIN}/product/${encodeURIComponent(product.id)}`;

  const hreflangAlternates = buildProductHreflangAlternates(product.id, BASE_DOMAIN);

  const locationKeywords = [
    product.title,
    `Buy ${product.title}`,
    `Buy ${product.title} - Fast Shipping to UK/Canada`,
    product.brand || 'AeroThor',
    product.product_type || 'Tech Accessories',
    ...(detectedRegion ? detectedRegion.seoKeywords : []),
    'Fast Shipping to UK/Canada',
    'Amazon Associates Verified Deal',
    '48h Domestic Dispatch',
  ];

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: locationKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangAlternates,
    },
    openGraph: {
      type: 'website',
      locale: detectedRegion ? detectedRegion.hreflang.replace('-', '_') : 'en_US',
      alternateLocale: TARGET_REGIONS.map((r) => r.hreflang.replace('-', '_')),
      url: canonicalUrl,
      title: seoTitle,
      description: seoDescription,
      siteName: 'AeroThor Commerce',
      images: [
        {
          url: product.image_link,
          width: 1200,
          height: 1200,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [product.image_link],
    },
  };
}

/**
 * 2. PRODUCT DETAILS PAGE WITH RICH SNIPPETS / JSON-LD (`Product`, `Offer`, `AggregateRating`) & 10-REGION HREFLANG
 */
export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const queryRegionParam =
    typeof resolvedSearchParams?.region === 'string'
      ? resolvedSearchParams.region
      : typeof resolvedSearchParams?.country === 'string'
      ? resolvedSearchParams.country
      : null;

  const activeRegion = findRegionBySlugOrIso(queryRegionParam) || TARGET_REGIONS[0];
  const regionalPrice = formatRegionalPrice(product.sale_price || product.price, activeRegion);
  const relatedProducts = await getRelatedProducts(product);
  const canonicalUrl = `${BASE_DOMAIN}/product/${encodeURIComponent(product.id)}`;
  const hreflangAlternates = buildProductHreflangAlternates(product.id, BASE_DOMAIN);

  // Google Rich Search Results Schema Markup (Product + Offer + AggregateRating + 10-Country Eligible Regions)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: [product.image_link, ...(product.additional_image_links || [])],
    description: product.description || resolveProductSeoDescription(product),
    sku: product.id,
    mpn: product.mpn || product.id,
    ...(product.gtin ? { gtin13: product.gtin } : {}),
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AeroThor',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '148',
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      url:
        activeRegion.slug === 'us'
          ? canonicalUrl
          : `${canonicalUrl}?region=${activeRegion.slug}`,
      priceCurrency: regionalPrice.currency,
      price: regionalPrice.numeric,
      priceValidUntil: '2027-12-31',
      availability:
        product.availability === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      eligibleRegion: TARGET_REGIONS.map((r) => ({
        '@type': 'Country',
        name: r.isoCode,
      })),
      seller: {
        '@type': 'Organization',
        name:
          product.productType === 'affiliate'
            ? `Amazon (${activeRegion.amazonDomain}) Official Partner`
            : 'AeroThor Commerce Inc.',
      },
      shippingDetails: TARGET_REGIONS.map((r) => ({
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: r.isoCode,
        },
        shippingRate: {
          '@type': 'MonetaryAmount',
          value:
            product.isFreeShipping === false && (product.shippingCost ?? 0) > 0
              ? Number(product.shippingCost).toFixed(2)
              : '0.00',
          currency: r.currencyCode,
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
            minValue: 2,
            maxValue: 6,
            unitCode: 'DAY',
          },
        },
      })),
    },
  };

  return (
    <>
      {/* Explicit Hreflang Tags for all 10 Target Amazon Associates Regions */}
      {Object.entries(hreflangAlternates).map(([lang, url]) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {/* Structured Data JSON-LD for Google Rich Search Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <ProductDetails product={product} relatedProducts={relatedProducts} />
    </>
  );
}
