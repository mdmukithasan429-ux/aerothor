import { GmcProduct } from './gmc-feed';

export const DEFAULT_STORE_TITLE =
  'Ecom-Growth-Agent — Headless E-commerce & GMC Growth Architect';
export const DEFAULT_STORE_DESCRIPTION =
  'Elite CTO/CMO architecture for zero-cost headless B2C e-commerce, Google Merchant Center RSS 2.0 feeds, dropshipping supplier CSV ingestion with live progress, and automated catalog syndication.';

/**
 * Generates an optimal SEO Meta Title (target 30–60 chars) when a custom seo_title is not set
 */
export function buildDefaultSeoTitle(product: GmcProduct): string {
  const brand = (product.brand || 'AeroThor').trim();
  const cleanTitle = (product.title || 'Product').trim();
  const rawPrice = (product.sale_price || product.price || '').replace(/\s*USD$/i, '').trim();
  const priceDisplay = rawPrice ? `$${rawPrice.replace(/^\$/, '')}` : '';

  const candidateWithPrice = priceDisplay
    ? `${cleanTitle} — ${priceDisplay} | ${brand}`
    : `${cleanTitle} | ${brand}`;

  if (candidateWithPrice.length <= 60) {
    return candidateWithPrice;
  }

  const suffix = ` | ${brand}`;
  const maxBaseLen = Math.max(20, 60 - suffix.length);
  const truncatedTitle =
    cleanTitle.length > maxBaseLen
      ? `${cleanTitle.slice(0, maxBaseLen - 1).trim()}…`
      : cleanTitle;
  return `${truncatedTitle}${suffix}`;
}

/**
 * Generates an optimal SEO Meta Description (target 120–160 chars) when a custom seo_description is not set
 */
export function buildDefaultSeoDescription(product: GmcProduct): string {
  const cleanDesc = (product.description || product.title || '').replace(/\s+/g, ' ').trim();
  if (cleanDesc.length >= 120 && cleanDesc.length <= 160) {
    return cleanDesc;
  }
  if (cleanDesc.length > 160) {
    return `${cleanDesc.slice(0, 157).trim()}...`;
  }
  const cta = ' Free 48h US & UK tracked dispatch + 30-day returns.';
  const combined = `${cleanDesc}${cta}`.trim();
  return combined.length <= 160 ? combined : `${combined.slice(0, 157).trim()}...`;
}

/**
 * Resolves the effective SEO Meta Title for a product (uses custom seo_title if present, otherwise generated default)
 */
export function resolveProductSeoTitle(product: GmcProduct): string {
  const custom = product.seo_title?.trim();
  return custom && custom.length > 0 ? custom : buildDefaultSeoTitle(product);
}

/**
 * Resolves the effective SEO Meta Description for a product (uses custom seo_description if present, otherwise generated default)
 */
export function resolveProductSeoDescription(product: GmcProduct): string {
  const custom = product.seo_description?.trim();
  return custom && custom.length > 0 ? custom : buildDefaultSeoDescription(product);
}

export interface GeneratedProductPageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: 'product' | 'website';
    image: string;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  jsonLd: Record<string, any>;
}

/**
 * Builds the complete product page metadata structure (HTML meta tags + OpenGraph + Twitter Card + Schema.org Product JSON-LD)
 * strictly reflecting any custom `seo_title` and `seo_description` configured in AdminInventoryDashboard.
 */
export function generateProductPageMetadata(
  product: GmcProduct,
  baseUrl?: string
): GeneratedProductPageMetadata {
  const origin = (
    baseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'https://aerothor.vercel.app'
  ).replace(/\/+$/, '');

  const seoTitle = resolveProductSeoTitle(product);
  const seoDescription = resolveProductSeoDescription(product);
  const canonicalUrl = `${origin}/product/${encodeURIComponent(product.id)}`;
  const numericPrice = (product.sale_price || product.price || '0.00')
    .replace(/[^0-9.]/g, '') || '0.00';

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: seoTitle,
    alternateName: product.title,
    image: [product.image_link],
    description: seoDescription,
    sku: product.id,
    mpn: product.mpn || product.id,
    ...(product.gtin ? { gtin13: product.gtin } : {}),
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AeroThor',
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'USD',
      price: numericPrice,
      availability:
        product.availability === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'USD',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        merchantReturnDays: 30,
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  };

  return {
    title: seoTitle,
    description: seoDescription,
    canonicalUrl,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      type: 'product',
      image: product.image_link,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      image: product.image_link,
    },
    jsonLd,
  };
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Synchronizes the live browser DOM `<head>` (`<title>`, `<meta name="description">`, OpenGraph, Twitter Cards,
 * `<link rel="canonical">`, and `<script id="product-jsonld" type="application/ld+json">`) with the active product's
 * SEO metadata, or restores the default store metadata when no product is active.
 */
export function applyProductMetadataToDocumentHead(product: GmcProduct | null): void {
  if (typeof document === 'undefined') return;

  if (!product) {
    document.title = DEFAULT_STORE_TITLE;
    upsertMetaTag('name', 'description', DEFAULT_STORE_DESCRIPTION);
    upsertMetaTag('property', 'og:title', DEFAULT_STORE_TITLE);
    upsertMetaTag('property', 'og:description', DEFAULT_STORE_DESCRIPTION);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('name', 'twitter:title', DEFAULT_STORE_TITLE);
    upsertMetaTag('name', 'twitter:description', DEFAULT_STORE_DESCRIPTION);

    const canonicalEl = document.getElementById('canonical-link') as HTMLLinkElement | null;
    if (canonicalEl && typeof window !== 'undefined') {
      canonicalEl.href = `${window.location.origin}/`;
    }

    const existingJsonLd = document.getElementById('product-jsonld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }
    return;
  }

  const meta = generateProductPageMetadata(product);
  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('property', 'og:title', meta.openGraph.title);
  upsertMetaTag('property', 'og:description', meta.openGraph.description);
  upsertMetaTag('property', 'og:type', 'product');
  upsertMetaTag('property', 'og:url', meta.openGraph.url);
  if (meta.openGraph.image) {
    upsertMetaTag('property', 'og:image', meta.openGraph.image);
  }
  upsertMetaTag('name', 'twitter:title', meta.twitter.title);
  upsertMetaTag('name', 'twitter:description', meta.twitter.description);
  if (meta.twitter.image) {
    upsertMetaTag('name', 'twitter:image', meta.twitter.image);
  }

  let canonicalEl = document.getElementById('canonical-link') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.id = 'canonical-link';
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = meta.canonicalUrl;

  let scriptEl = document.getElementById('product-jsonld') as HTMLScriptElement | null;
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'product-jsonld';
    scriptEl.type = 'application/ld+json';
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(meta.jsonLd);
}
