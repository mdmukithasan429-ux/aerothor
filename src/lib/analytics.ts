import { GmcProduct } from './gmc-feed';

export const GA_MEASUREMENT_ID =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GA_MEASUREMENT_ID) ||
  'G-0KS0T13HQ7';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface Ga4TrackedEventLog {
  id: string;
  timestamp: string;
  eventName: string;
  measurementId: string;
  summary: string;
  params: Record<string, any>;
}

const eventHistory: Ga4TrackedEventLog[] = [];
const listeners = new Set<(events: Ga4TrackedEventLog[]) => void>();

function notifyListeners() {
  const snapshot = [...eventHistory];
  listeners.forEach((cb) => cb(snapshot));
}

export function subscribeToGa4Events(callback: (events: Ga4TrackedEventLog[]) => void): () => void {
  listeners.add(callback);
  callback([...eventHistory]);
  return () => {
    listeners.delete(callback);
  };
}

export function getGa4EventHistory(): Ga4TrackedEventLog[] {
  return [...eventHistory];
}

function parseNumericPrice(priceStr?: string): number {
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

/**
 * Ensures gtag.js is initialized on the page and dispatches an event to GA4 Measurement ID G-0KS0T13HQ7
 */
export function sendGa4Event(
  eventName: string,
  params: Record<string, any> = {},
  summary?: string
): void {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };
  }

  const enrichedParams = {
    send_to: GA_MEASUREMENT_ID,
    ...params,
  };

  try {
    window.gtag('event', eventName, enrichedParams);
  } catch (err) {
    console.warn('[GA4 Dispatch Warning]:', err);
  }

  const entry: Ga4TrackedEventLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    eventName,
    measurementId: GA_MEASUREMENT_ID,
    summary: summary || `${eventName} dispatched to ${GA_MEASUREMENT_ID}`,
    params: enrichedParams,
  };

  eventHistory.unshift(entry);
  if (eventHistory.length > 40) {
    eventHistory.pop();
  }
  notifyListeners();
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;
  const resolvedTitle = pageTitle || document.title;
  const pageLocation = window.location.href;

  sendGa4Event(
    'page_view',
    {
      page_path: pagePath,
      page_title: resolvedTitle,
      page_location: pageLocation,
    },
    `Page view: ${pagePath} (${resolvedTitle.slice(0, 48)})`
  );
}

export function trackViewItem(product: GmcProduct): void {
  const price = parseNumericPrice(product.sale_price || product.price);
  sendGa4Event(
    'view_item',
    {
      currency: 'USD',
      value: price,
      items: [
        {
          item_id: product.id,
          item_name: product.seo_title || product.title,
          item_brand: product.brand || 'AeroThor',
          item_category: product.product_type || 'Hardware & Gear',
          price,
          quantity: 1,
        },
      ],
    },
    `Viewed product ${product.id} ($${price.toFixed(2)})`
  );
}

export function trackAddToCart(product: GmcProduct, quantity = 1): void {
  const price = parseNumericPrice(product.sale_price || product.price);
  sendGa4Event(
    'add_to_cart',
    {
      currency: 'USD',
      value: Number((price * quantity).toFixed(2)),
      items: [
        {
          item_id: product.id,
          item_name: product.seo_title || product.title,
          item_brand: product.brand || 'AeroThor',
          item_category: product.product_type || 'Hardware & Gear',
          price,
          quantity,
        },
      ],
    },
    `Added ${quantity}x ${product.id} to cart ($${(price * quantity).toFixed(2)})`
  );
}

export function trackBeginCheckout(
  items: Array<{ product: GmcProduct; quantity: number }>,
  totalValue: number,
  currency = 'USD'
): void {
  sendGa4Event(
    'begin_checkout',
    {
      currency,
      value: Number(totalValue.toFixed(2)),
      items: items.map((item) => ({
        item_id: item.product.id,
        item_name: item.product.seo_title || item.product.title,
        item_brand: item.product.brand || 'AeroThor',
        price: parseNumericPrice(item.product.sale_price || item.product.price),
        quantity: item.quantity,
      })),
    },
    `Initiated checkout (${items.length} SKU(s), $${totalValue.toFixed(2)} ${currency})`
  );
}

export function trackPurchase(
  orderId: string,
  items: Array<{ product: GmcProduct; quantity: number }>,
  totalValue: number,
  shipping = 0,
  currency = 'USD'
): void {
  sendGa4Event(
    'purchase',
    {
      transaction_id: orderId,
      currency,
      value: Number(totalValue.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      tax: 0,
      items: items.map((item) => ({
        item_id: item.product.id,
        item_name: item.product.seo_title || item.product.title,
        item_brand: item.product.brand || 'AeroThor',
        price: parseNumericPrice(item.product.sale_price || item.product.price),
        quantity: item.quantity,
      })),
    },
    `Completed purchase ${orderId} ($${totalValue.toFixed(2)} ${currency})`
  );
}

export function trackSearch(searchTerm: string, resultCount: number): void {
  const cleaned = searchTerm.trim();
  if (!cleaned) return;
  sendGa4Event(
    'search',
    {
      search_term: cleaned,
      results_count: resultCount,
    },
    `Searched "${cleaned}" (${resultCount} matches)`
  );
}

export function sendGa4VerificationPing(): void {
  trackPageView(window.location.pathname || '/', document.title);
  sendGa4Event(
    'user_engagement',
    {
      engagement_time_msec: 1200,
      verification_source: 'admin_analytics_console',
    },
    `Sent live GA4 verification ping to ${GA_MEASUREMENT_ID}`
  );
}
