import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { GmcProduct, ProductVariantOption, CANONICAL_STORE_URL } from '../lib/gmc-feed';
import { buildDefaultVariantsForProduct } from '../lib/api-integrations';
import { ExpressCheckoutDrawer, CheckoutItem } from './ExpressCheckoutDrawer';
import {
  applyProductMetadataToDocumentHead,
  generateProductPageMetadata,
  resolveProductSeoTitle,
  resolveProductSeoDescription,
} from '../lib/seo-metadata';
import {
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackSearch,
} from '../lib/analytics';
import { formatPriceForDisplay } from '../lib/currency';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Star,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  X,
  CreditCard,
  Lock,
  Zap,
  Search,
  Loader2,
  Globe,
  Tag,
} from 'lucide-react';
import { SocialShare } from './SocialShare';
import { motion } from 'framer-motion';
import { HeroPromoCarousel } from './home/HeroPromoCarousel';
import { SponsoredGridCard } from './home/SponsoredGridCard';
import { Campaign, INITIAL_CAMPAIGNS } from '../lib/campaigns';
import { useStoreSettings } from '../lib/useStoreSettings';
import { HeroPromotionCarousel } from './home/HeroPromotionCarousel';
import { PromoCouponDrawer } from './home/PromoCouponDrawer';
import { NewsletterBanner } from './home/NewsletterBanner';
import {
  TARGET_REGIONS,
  getRegionOrDefault,
  formatRegionalPrice,
  TargetRegionConfig,
  localizeAmazonAffiliateUrl,
} from '../lib/i18n-regions';

const FlashDealSection = React.lazy(() =>
  import('./home/FlashDealSection').then((m) => ({ default: m.FlashDealSection }))
);
const TrendingDemandSection = React.lazy(() =>
  import('./home/TrendingDemandSection').then((m) => ({ default: m.TrendingDemandSection }))
);
const CorporateAdBanners = React.lazy(() =>
  import('./home/CorporateAdBanners').then((m) => ({ default: m.CorporateAdBanners }))
);

interface StoreLandingPageProps {
  products: GmcProduct[];
  onOpenFeed: () => void;
  isAdminAuthenticated?: boolean;
  externalCategory?: string | null;
  onClearExternalCategory?: () => void;
  onOpenAdminPortal?: () => void;
  activeRegionSlug?: string | null;
  onSelectRegionSlug?: (slug: string) => void;
}

interface CartItem {
  product: GmcProduct;
  quantity: number;
}

const SEARCH_STORAGE_KEY = 'aerothor_store_persistent_search';
const CATEGORY_STORAGE_KEY = 'aerothor_store_persistent_category';
const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80&fm=webp';

function resolveProductImage(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return FALLBACK_PRODUCT_IMAGE;
  let cleaned = rawUrl.trim();
  if (cleaned.startsWith('[')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cleaned = String(parsed[0] || '').trim();
      }
    } catch {
      cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '').split(',')[0].replace(/["']/g, '').trim();
    }
  }
  if (cleaned.startsWith('http://')) {
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }
  if (cleaned.includes('images.unsplash.com') && !cleaned.includes('fm=')) {
    cleaned += cleaned.includes('?') ? '&fm=webp' : '?auto=format&fit=crop&w=800&q=80&fm=webp';
  }
  return cleaned.startsWith('https://') || cleaned.startsWith('/') ? cleaned : FALLBACK_PRODUCT_IMAGE;
}

function formatVariantPriceAmount(val?: string | number): string {
  if (val === undefined || val === null) return '0.00';
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val.toFixed(2) : '0.00';
  }
  const parsed = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}

function filterCatalogLocally(
  items: GmcProduct[],
  query: string,
  selectedCategory: string
): GmcProduct[] {
  const normalizedQuery = query.trim().toLowerCase();
  const queryTokens = normalizedQuery ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  return items.filter((p) => {
    const titleLower = (p.title || '').toLowerCase();
    const descLower = (p.description || '').toLowerCase();
    const skuLower = (p.id || '').toLowerCase();
    const brandLower = (p.brand || '').toLowerCase();
    const typeLower = (p.product_type || p.google_product_category || '').toLowerCase();
    const isAffiliate =
      p.productType === 'affiliate' ||
      Boolean(p.affiliateUrl || p.affiliate_url) ||
      skuLower.startsWith('aff-');

    let matchesCategory = true;
    if (selectedCategory === 'Affiliate Deals') {
      matchesCategory = isAffiliate;
    } else if (selectedCategory === 'Clothing' || selectedCategory === 'Outerwear & Commute') {
      matchesCategory =
        typeLower.includes('clothing') ||
        typeLower.includes('apparel') ||
        typeLower.includes('outerwear') ||
        titleLower.includes('hoodie') ||
        titleLower.includes('jacket') ||
        titleLower.includes('shirt') ||
        titleLower.includes('merino') ||
        titleLower.includes('backpack') ||
        titleLower.includes('eyewear') ||
        titleLower.includes('aviator');
    } else if (selectedCategory === 'CJ Marketplace') {
      matchesCategory =
        Boolean(p.cj_pid) ||
        p.source === 'cj_live' ||
        (skuLower.startsWith('cj-') && !/^cj-(home|fit|trvl|tech)-\d{5}$/.test(skuLower));
    } else if (selectedCategory === 'Drinkware & Travel') {
      matchesCategory =
        typeLower.includes('drinkware') ||
        titleLower.includes('flask') ||
        titleLower.includes('tumbler') ||
        titleLower.includes('pillow');
    } else if (selectedCategory === 'Tech Accessories') {
      matchesCategory =
        typeLower.includes('tech') ||
        typeLower.includes('electronics') ||
        titleLower.includes('charge') ||
        titleLower.includes('stand') ||
        titleLower.includes('dock') ||
        titleLower.includes('adapter') ||
        titleLower.includes('ssd') ||
        titleLower.includes('audio') ||
        titleLower.includes('headphone') ||
        titleLower.includes('wallet');
    } else if (selectedCategory && selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      matchesCategory =
        typeLower.includes(catLower) ||
        titleLower.includes(catLower) ||
        descLower.includes(catLower);
    }

    if (!matchesCategory) return false;
    if (queryTokens.length === 0) return true;

    const searchable = `${titleLower} ${descLower} ${skuLower} ${brandLower}`;
    return queryTokens.every((token) => searchable.includes(token));
  });
}

export const StoreLandingPage: React.FC<StoreLandingPageProps> = ({
  products,
  onOpenFeed,
  isAdminAuthenticated = false,
  externalCategory,
  onClearExternalCategory,
  onOpenAdminPortal,
  activeRegionSlug,
  onSelectRegionSlug,
}) => {
  const currentRegion = useMemo(() => getRegionOrDefault(activeRegionSlug), [activeRegionSlug]);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try {
      return localStorage.getItem(CATEGORY_STORAGE_KEY) || 'All';
    } catch {
      return 'All';
    }
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qParam = urlParams.get('q');
      if (qParam !== null) return qParam;
      return localStorage.getItem(SEARCH_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [debouncedQuery, setDebouncedQuery] = useState<string>(searchQuery);
  const [filteredProducts, setFilteredProducts] = useState<GmcProduct[]>(() =>
    filterCatalogLocally(products, searchQuery, selectedCategory)
  );
  const { settings } = useStoreSettings();
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<GmcProduct | null>(null);
  const [fullPdpProduct, setFullPdpProduct] = useState<GmcProduct | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__INITIAL_PRODUCT__) {
      return (window as any).__INITIAL_PRODUCT__ as GmcProduct;
    }
    return null;
  });
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  const [activePolicyModal, setActivePolicyModal] = useState<'shipping' | 'refund' | 'privacy' | 'terms' | null>(null);

  const openProductLinkPage = (product: GmcProduct) => {
    trackViewItem(product);
    setQuickViewProduct(null);
    setFullPdpProduct(product);
    try {
      const targetUrl = `/product/${encodeURIComponent(product.id)}`;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ productId: product.id }, '', targetUrl);
      }
    } catch {
      // ignore in restricted iframe contexts
    }
  };

  const closeProductLinkPage = () => {
    setFullPdpProduct(null);
    try {
      if (/^\/products?\/[^/]+/i.test(window.location.pathname)) {
        window.history.pushState({}, '', '/');
      }
    } catch {
      // ignore
    }
  };

  const handleCopyProductLink = (product: GmcProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const canonicalUrl = `${CANONICAL_STORE_URL}/product/${encodeURIComponent(product.id)}`;
    navigator.clipboard?.writeText(canonicalUrl).catch(() => {});
    setCopiedProductId(product.id);
    window.setTimeout(() => {
      setCopiedProductId((prev) => (prev === product.id ? null : prev));
    }, 2000);
  };

  // Express Checkout Drawer State
  const [isExpressCheckoutOpen, setIsExpressCheckoutOpen] = useState(false);
  const [expressCheckoutItems, setExpressCheckoutItems] = useState<CheckoutItem[]>([]);

  // Active Variant Selection State for PDP & QuickView Modals (Size & Color)
  const [selectedSize, setSelectedSize] = useState<string>('M / Standard');
  const [selectedColor, setSelectedColor] = useState<string>('Obsidian Black');
  const [flashSaleSeconds, setFlashSaleSeconds] = useState<number>(4 * 3600 + 30 * 60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFlashSaleSeconds((prev) => (prev > 0 ? prev - 1 : 4 * 3600 + 30 * 60));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const flashHours = Math.floor(flashSaleSeconds / 3600);
  const flashMinutes = Math.floor((flashSaleSeconds % 3600) / 60);
  const flashSecs = flashSaleSeconds % 60;

  const activeModalProduct = fullPdpProduct || quickViewProduct;

  const relatedDealsForPdp = useMemo<GmcProduct[]>(() => {
    if (!activeModalProduct) return [];
    const candidates = products.filter((p) => p.id !== activeModalProduct.id);
    const affiliates = candidates.filter(
      (p) => p.productType === 'affiliate' || Boolean(p.affiliateUrl) || Boolean(p.affiliate_url)
    );
    const others = candidates.filter(
      (p) => p.productType !== 'affiliate' && !p.affiliateUrl && !p.affiliate_url
    );
    return [...affiliates, ...others].slice(0, 4);
  }, [products, activeModalProduct]);

  const activeProductVariants = useMemo<ProductVariantOption[]>(() => {
    if (!activeModalProduct) return [];
    if (Array.isArray(activeModalProduct.variants) && activeModalProduct.variants.length > 0) {
      return activeModalProduct.variants;
    }
    return buildDefaultVariantsForProduct(activeModalProduct);
  }, [activeModalProduct]);

  const availableSizes = useMemo<string[]>(() => {
    const set = new Set<string>();
    activeProductVariants.forEach((v) => {
      if (v.size) set.add(v.size);
    });
    return Array.from(set);
  }, [activeProductVariants]);

  const availableColors = useMemo<string[]>(() => {
    const set = new Set<string>();
    activeProductVariants.forEach((v) => {
      if (v.color) set.add(v.color);
    });
    return Array.from(set);
  }, [activeProductVariants]);

  // Reset selected Size & Color to first variant whenever a new product modal opens
  useEffect(() => {
    if (activeProductVariants.length > 0) {
      setSelectedSize(activeProductVariants[0].size || 'M / Standard');
      setSelectedColor(activeProductVariants[0].color || 'Obsidian Black');
    }
  }, [activeModalProduct?.id]);

  const selectedVariant = useMemo<ProductVariantOption | null>(() => {
    if (activeProductVariants.length === 0) return null;
    return (
      activeProductVariants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      ) ||
      activeProductVariants.find((v) => v.size === selectedSize) ||
      activeProductVariants.find((v) => v.color === selectedColor) ||
      activeProductVariants[0]
    );
  }, [activeProductVariants, selectedSize, selectedColor]);

  // Build a GmcProduct snapshot reflecting the currently selected Variant (price, image, SKU, title)
  const buildVariantProductSnapshot = (
    baseProduct: GmcProduct,
    variant: ProductVariantOption | null
  ): GmcProduct => {
    if (!variant) return baseProduct;
    return {
      ...baseProduct,
      id: variant.sku || baseProduct.id,
      cj_vid: variant.cj_vid || baseProduct.cj_vid,
      title: `${baseProduct.title} (${variant.size} · ${variant.color})`,
      price: `${formatVariantPriceAmount(variant.price)} USD`,
      sale_price: variant.sale_price ? `${formatVariantPriceAmount(variant.sale_price)} USD` : undefined,
      image_link: variant.image_link || baseProduct.image_link,
    };
  };

  // Automatically resolve and open Product Detail Page when visiting /product/:id, /products/:slug, or ?product=:id
  useEffect(() => {
    if (!products || products.length === 0) return;
    const resolveFromLocation = () => {
      try {
        const pathname = window.location.pathname.replace(/\/+$/, '');
        const urlParams = new URLSearchParams(window.location.search);
        let targetKey = urlParams.get('product') || urlParams.get('sku') || '';

        if (!targetKey) {
          const match = pathname.match(/^\/products?\/([^/]+)$/i);
          if (match && match[1]) {
            targetKey = decodeURIComponent(match[1]);
          }
        }

        if (!targetKey) {
          return;
        }
        const norm = targetKey.trim().toLowerCase();

        const matched = products.find((p) => {
          const idMatch = (p.id || '').toLowerCase() === norm;
          const mpnMatch = (p.mpn || '').toLowerCase() === norm;
          const cjSkuMatch = (p.cj_sku || '').toLowerCase() === norm;
          const slugTitle = (p.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          const slugMatch =
            Boolean(slugTitle) &&
            (slugTitle === norm || slugTitle.startsWith(norm) || norm.startsWith(slugTitle.slice(0, 40)));
          const linkMatch = (p.link || '').toLowerCase().endsWith(`/${norm}`);
          return idMatch || mpnMatch || cjSkuMatch || slugMatch || linkMatch;
        });

        if (matched) {
          setFullPdpProduct(matched);
        }
      } catch {
        // ignore URL parsing errors
      }
    };

    resolveFromLocation();
    window.addEventListener('popstate', resolveFromLocation);
    return () => window.removeEventListener('popstate', resolveFromLocation);
  }, [products]);

  // Keep active modal product in sync with latest catalog edits (including SEO meta title/description updates)
  useEffect(() => {
    if (quickViewProduct) {
      const latest = products.find((p) => p.id === quickViewProduct.id);
      if (latest && latest !== quickViewProduct) setQuickViewProduct(latest);
    }
    if (fullPdpProduct) {
      const latest = products.find((p) => p.id === fullPdpProduct.id);
      if (latest && latest !== fullPdpProduct) setFullPdpProduct(latest);
    }
  }, [products]);

  // Reflect active product's SEO meta title & description in the live document <head> and JSON-LD
  useEffect(() => {
    const activeProduct = fullPdpProduct || quickViewProduct;
    applyProductMetadataToDocumentHead(activeProduct);
  }, [fullPdpProduct, quickViewProduct]);

  const handleBuyNow = (product: GmcProduct, source = 'buy_now_card') => {
    const rawPrice = parseFloat(
      String(product.sale_price || product.price || '0').replace(/[^0-9.]/g, '') || '0'
    );
    trackBeginCheckout([{ product, quantity: 1 }], rawPrice, 'USD', {
      checkoutSource: source,
    });
    setExpressCheckoutItems([{ product, quantity: 1 }]);
    setQuickViewProduct(null);
    setFullPdpProduct(null);
    setIsCartOpen(false);
    setIsExpressCheckoutOpen(true);
  };

  const [inGridCampaigns, setInGridCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.campaigns)) {
          const activeInGrid = data.campaigns.filter((c: Campaign) => c.placement === 'IN_GRID' && c.isActive);
          if (activeInGrid.length > 0) {
            setInGridCampaigns(activeInGrid);
            return;
          }
        }
        if (active) {
          setInGridCampaigns(INITIAL_CAMPAIGNS.filter((c) => c.placement === 'IN_GRID' && c.isActive));
        }
      })
      .catch(() => {
        if (active) {
          setInGridCampaigns(INITIAL_CAMPAIGNS.filter((c) => c.placement === 'IN_GRID' && c.isActive));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = [
    'All',
    'Clothing',
    'Tech Accessories',
    'Affiliate Deals',
    'Drinkware & Travel',
    'CJ Marketplace',
  ];

  // Reset pagination to page 1 when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, debouncedQuery, itemsPerPage]);

  // Strict Zero-Duplicate Image, Title, & SKU Filter + Regional Inventory Prioritization
  const deduplicatedProducts = useMemo(() => {
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const seenImages = new Set<string>();
    const uniqueList: GmcProduct[] = [];

    const activeIso = currentRegion.isoCode.toUpperCase();

    // Sort to prioritize products configured for current target region or marketplace
    const sorted = [...filteredProducts].sort((a, b) => {
      const aRegions = (a as any).targetRegions;
      const bRegions = (b as any).targetRegions;
      const aMatch = Array.isArray(aRegions) && aRegions.includes(activeIso) ? 1 : 0;
      const bMatch = Array.isArray(bRegions) && bRegions.includes(activeIso) ? 1 : 0;
      return bMatch - aMatch;
    });

    for (const p of sorted) {
      if (!p || !p.id) continue;
      const normId = String(p.id).trim().toLowerCase();
      const normTitle = String(p.title || '').trim().toLowerCase();
      const normImage = resolveProductImage(p.image_link).trim().toLowerCase();

      // Zero duplicate IDs
      if (seenIds.has(normId)) continue;
      // Zero duplicate product titles
      if (normTitle && seenTitles.has(normTitle)) continue;
      // Zero duplicate product images across catalog grid
      if (normImage && seenImages.has(normImage)) continue;

      seenIds.add(normId);
      if (normTitle) seenTitles.add(normTitle);
      if (normImage) seenImages.add(normImage);

      uniqueList.push(p);
    }

    return uniqueList;
  }, [filteredProducts, currentRegion.isoCode]);

  const totalPages = Math.max(1, Math.ceil(deduplicatedProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return deduplicatedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [deduplicatedProducts, safeCurrentPage, itemsPerPage]);

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safeCurrentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [safeCurrentPage, totalPages]);

  // Persist searchQuery and selectedCategory to localStorage & URL query string
  useEffect(() => {
    try {
      localStorage.setItem(SEARCH_STORAGE_KEY, searchQuery);
      const url = new URL(window.location.href);
      if (searchQuery.trim()) {
        url.searchParams.set('q', searchQuery.trim());
      } else {
        url.searchParams.delete('q');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore storage errors in restricted environments
    }
  }, [searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, selectedCategory);
    } catch {
      // ignore storage errors
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (externalCategory) {
      setSelectedCategory(externalCategory);
      if (onClearExternalCategory) {
        onClearExternalCategory();
      }
    }
  }, [externalCategory, onClearExternalCategory]);

  // Debounce input changes by 260ms before hitting /api/products/search
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true);
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [searchQuery, debouncedQuery]);

  // Query /api/products/search whenever debouncedQuery, selectedCategory, or products catalog changes
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const runSearch = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (debouncedQuery.trim()) {
          params.set('q', debouncedQuery.trim());
        }
        if (selectedCategory && selectedCategory !== 'All') {
          params.set('category', selectedCategory);
        }

        const res = await fetch(`/api/products/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const rawText = await res.text();
        const data = rawText ? JSON.parse(rawText) : {};
        if (active && Array.isArray(data.products)) {
          setFilteredProducts(data.products);
          if (debouncedQuery.trim()) {
            trackSearch(
              debouncedQuery.trim(),
              data.products.length,
              selectedCategory,
              'storefront_search'
            );
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (active) {
          const localMatches = filterCatalogLocally(products, debouncedQuery, selectedCategory);
          setFilteredProducts(localMatches);
          if (debouncedQuery.trim()) {
            trackSearch(
              debouncedQuery.trim(),
              localMatches.length,
              selectedCategory,
              'storefront_search_fallback'
            );
          }
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    };

    runSearch();

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedQuery, selectedCategory, products]);

  const addToCart = (product: GmcProduct, source = 'product_card') => {
    trackAddToCart(product, 1, source);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const targetItem = cart.find((item) => item.product.id === productId);
    if (targetItem) {
      if (delta > 0) {
        trackAddToCart(targetItem.product, delta, 'cart_drawer_increment');
      } else if (delta < 0) {
        trackRemoveFromCart(targetItem.product, Math.abs(delta));
      }
    }
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = cart.reduce((sum, item) => {
    const rawPrice = parseFloat(
      String(item.product.sale_price || item.product.price || '0').replace(/[^0-9.]/g, '') || '0'
    );
    return sum + (Number.isFinite(rawPrice) ? rawPrice : 0) * item.quantity;
  }, 0);

  const handleSimulateCheckout = () => {
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCart([]);
      setCheckoutSuccess(false);
      setIsCartOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-12 pb-12 font-sans text-slate-100">
      {/* Native Impact.com & Sponsored Brand Hero Banner Slider */}
      <HeroPromoCarousel />

      {/* Corporate Promotional Hero Carousel / Banner System */}
      <HeroPromotionCarousel
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onSelectProduct={(prod) => openProductLinkPage(prod)}
        products={products}
      />

      {/* Hero Intro & Trust Badges Strip */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 lg:p-12">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{(settings.storeName || 'Official Store').toUpperCase()} · OFFICIAL STORE · US &amp; UK DIRECT WAREHOUSE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Minimalist Performance Essentials for High-Velocity Commuters.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Grade 1 titanium vessels, 100% pure merino thermal wear, and Qi2 aerospace charging hardware. Engineered for the modern trans-Atlantic commuter with zero-friction 48h dispatch.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#catalog"
              className="px-5 py-2.5 bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/10 inline-flex items-center gap-2"
            >
              <span>Explore Collection ({products.length})</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 font-medium text-xs sm:text-sm rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>View Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            </button>
          </div>
        </div>

        {/* Trust Badges Strip (GMC Compliant Policies) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 mt-6 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2.5">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">48h Domestic Dispatch</p>
              <p className="text-slate-400 text-[11px]">Free US &amp; UK mainland tracked</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">30-Day Free Returns</p>
              <p className="text-slate-400 text-[11px]">Zero restocking fees guaranteed</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">GS1 GTIN Verified</p>
              <p className="text-slate-400 text-[11px]">Official Google Shopping catalog</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Encrypted Checkout</p>
              <p className="text-slate-400 text-[11px]">Apple Pay, Google Pay &amp; Visa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deal of the Day / Flash Sale Countdown Module */}
      <Suspense fallback={<div className="min-h-[320px] rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />}>
        <FlashDealSection
          products={products}
          onSelectProduct={(prod) => openProductLinkPage(prod)}
          onAddToCart={(prod) => addToCart(prod, 'flash_sale_card')}
          onBuyNow={(prod) => handleBuyNow(prod, 'flash_sale_card')}
        />
      </Suspense>

      {/* Today's High Demand Drops Engine with Framer Motion */}
      <Suspense fallback={<div className="min-h-[340px] rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />}>
        <TrendingDemandSection
          products={products}
          onSelectProduct={(prod) => openProductLinkPage(prod)}
          onAddToCart={(prod) => addToCart(prod, 'trending_high_demand')}
          onBuyNow={(prod) => handleBuyNow(prod, 'trending_high_demand')}
        />
      </Suspense>

      {/* Curated 3-Column Corporate Promotional Ad Banners */}
      <Suspense fallback={<div className="min-h-[180px] rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />}>
        <CorporateAdBanners onSelectCategory={(cat) => setSelectedCategory(cat)} />
      </Suspense>


      {/* Catalog Filter & Showcase */}
      <section id="catalog" className="space-y-6">
        {/* Country-Specific Multi-Marketplace & Domestic Fulfillment Status Bar */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 shadow-lg shadow-black/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="text-3xl select-none shrink-0" aria-hidden="true">
                {currentRegion.flag}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{currentRegion.countryName} Regional Inventory &amp; Multi-Marketplace Feed</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Currency: {currentRegion.currencyCode} ({currentRegion.currencySymbol})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    Carrier: {currentRegion.carrierName}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span className="text-emerald-400 font-semibold">{currentRegion.dispatchBannerText}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{currentRegion.transitDays}</span>
                </p>
              </div>
            </div>

            {/* Quick Country Switcher Bar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Switch Region:</span>
              {TARGET_REGIONS.map((r) => {
                const isActive = currentRegion.slug === r.slug;
                return (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => onSelectRegionSlug?.(r.slug)}
                    title={`${r.flag} ${r.countryName} (${r.currencyCode})`}
                    aria-label={`Switch region to ${r.countryName} (${r.currencyCode})`}
                    aria-pressed={isActive}
                    className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span aria-hidden="true">{r.flag}</span>
                    <span className="text-[10px] uppercase font-mono">{r.isoCode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region-Specific Marketplace Channels */}
          {currentRegion.marketplaces && currentRegion.marketplaces.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px] font-mono shrink-0">Integrated Channels:</span>
              {currentRegion.marketplaces.map((mp) => (
                <span
                  key={mp.id}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{mp.name}</span>
                  <span className="text-slate-500 text-[10px]">({mp.carrier})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Gear &amp; Hardware</h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time synchronized catalog strictly compliant with Google Merchant Center RSS 2.0.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat !== 'All') {
                    const matches = filterCatalogLocally(products, searchQuery, cat);
                    trackSearch(searchQuery.trim() || cat, matches.length, cat, 'category_filter');
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Persistent Product Search Bar (Debounced /api/products/search) */}
        <div className="sm:sticky sm:top-24 lg:top-16 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-lg shadow-slate-950/60 rounded-xl p-3">
          <div className="relative flex-1">
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  trackSearch(
                    searchQuery.trim(),
                    filteredProducts.length,
                    selectedCategory,
                    'storefront_search_enter',
                    true
                  );
                }
              }}
              placeholder="Search products by title, brand, or SKU..."
              aria-label="Search products by title, description, or SKU"
              className="w-full pl-10 pr-20 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isSearching && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                  Searching…
                </span>
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 px-1">
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              Showing{' '}
              <span className="text-emerald-400 font-semibold">
                {deduplicatedProducts.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}–
                {Math.min(safeCurrentPage * itemsPerPage, deduplicatedProducts.length)}
              </span>{' '}
              of <span className="text-slate-200 font-semibold">{deduplicatedProducts.length}</span> unique items
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              aria-label="Products per page"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
              <option value={96}>96 / page</option>
              <option value={1000}>All 1,000 / page</option>
            </select>
            {(searchQuery.trim() !== '' || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 whitespace-nowrap"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        {deduplicatedProducts.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">No matching products found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No items matched{' '}
              {searchQuery.trim() ? (
                <>
                  your search for <span className="text-slate-200 font-mono">"{searchQuery}"</span>
                </>
              ) : (
                'the selected filter'
              )}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}. Try searching by product title, keyword, or exact SKU.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Clear Search &amp; Filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {paginatedProducts.map((p, idx) => {
              const displayImage = resolveProductImage(p.image_link);
              const isAffiliate =
                p.productType === 'affiliate' ||
                Boolean(p.affiliateUrl) ||
                Boolean(p.affiliate_url) ||
                p.id.toLowerCase().startsWith('aff-');
              const affiliateLink = localizeAmazonAffiliateUrl(
                p.affiliateUrl || p.affiliate_url,
                p.title,
                currentRegion
              );
              const regPrice = formatRegionalPrice(p.price, currentRegion);
              const regSalePrice = p.sale_price ? formatRegionalPrice(p.sale_price, currentRegion) : null;

              const injectSponsored = inGridCampaigns.length > 0 && (idx + 1) % 5 === 0;
              const campaignToInject = injectSponsored
                ? inGridCampaigns[Math.floor((idx + 1) / 5 - 1) % inGridCampaigns.length]
                : null;

              return (
                <React.Fragment key={`frag-${p.id}`}>
                  {campaignToInject && <SponsoredGridCard campaign={campaignToInject} />}
                  <motion.article
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                    key={p.id}
                    className={`group bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm ${
                    isAffiliate
                      ? 'border border-amber-500/30 hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10'
                      : 'border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Image Frame */}
                    <div
                      className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                      onClick={() => openProductLinkPage(p)}
                    >
                      <img
                        src={displayImage}
                        alt={`${p.title} — ${p.brand || 'AeroThor'} (${p.id})`}
                        width={600}
                        height={450}
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        fetchPriority={idx < 3 ? 'high' : 'auto'}
                        decoding="async"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                            target.src = FALLBACK_PRODUCT_IMAGE;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* DISTINCT BADGES: AFFILIATE (AMBER) VS CJ DROPSHIPPING (EMERALD) */}
                      {isAffiliate ? (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded shadow-md flex items-center gap-1">
                          <Tag className="w-3 h-3 fill-current" />
                          <span>{currentRegion.flag} Buy on Amazon</span>
                        </span>
                      ) : (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold tracking-wide rounded shadow-sm flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          <span>Express 48h Dispatch</span>
                        </span>
                      )}
                      <span
                        title={p.id}
                        className={`absolute top-3 right-3 max-w-[55%] truncate px-2 py-0.5 bg-slate-950/85 backdrop-blur-sm text-[10px] font-mono rounded ${
                          isAffiliate
                            ? 'border border-amber-500/30 text-amber-300'
                            : 'border border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {isAffiliate ? `${currentRegion.flag} Amazon Partner` : `${currentRegion.flag} CJ Direct Hub`}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span
                          className={`font-semibold uppercase tracking-wider text-[11px] truncate ${
                            isAffiliate ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        >
                          {p.brand || 'AeroThor'}
                        </span>
                        <span
                          className={`font-medium text-[11px] whitespace-nowrap shrink-0 ${
                            isAffiliate ? 'text-amber-300' : 'text-emerald-400'
                          }`}
                        >
                          {isAffiliate ? `${currentRegion.flag} Amazon Affiliate` : `${currentRegion.flag} Express 48h Dispatch`}
                        </span>
                      </div>

                      <h3
                        onClick={() => openProductLinkPage(p)}
                        className={`text-base font-semibold text-white transition-colors cursor-pointer line-clamp-2 min-h-[2.75rem] leading-snug ${
                          isAffiliate ? 'group-hover:text-amber-300' : 'group-hover:text-emerald-300'
                        }`}
                      >
                        {p.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="pt-1 flex items-center justify-between gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => handleCopyProductLink(p, e)}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 font-mono transition-colors cursor-pointer"
                          title={`Copy Product Link: ${CANONICAL_STORE_URL}/product/${p.id}`}
                        >
                          {copiedProductId === p.id ? '✓ Link Copied' : 'Copy Product Link'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openProductLinkPage(p)}
                          className={`font-semibold underline underline-offset-2 cursor-pointer ${
                            isAffiliate ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          {isAffiliate ? 'Deal Details' : 'Product Link Page →'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price, Action & Social Share Footer */}
                  <div className="px-4 py-3.5 sm:px-5 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5 mt-auto">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono tabular-nums min-w-0">
                        {regSalePrice ? (
                          <div className="flex flex-col leading-tight">
                            <span
                              className={`text-base font-extrabold whitespace-nowrap ${
                                isAffiliate ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {regSalePrice.formatted}
                            </span>
                            <span className="text-[11px] line-through text-slate-500 whitespace-nowrap">
                              {regPrice.formatted}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-extrabold text-white whitespace-nowrap">
                            {regPrice.formatted}
                          </span>
                        )}
                      </div>

                      {/* ACTION BUTTON: DIRECT AFFILIATE OUTBOUND ("Buy on Amazon") VS CJ DROPSHIPPING ("Buy Now via CJ") */}
                      {isAffiliate ? (
                        <a
                          href={affiliateLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buy ${p.title} on Amazon`}
                          className="min-h-[44px] px-3.5 py-2 bg-[#FF9900] hover:bg-[#e68a00] active:bg-[#cc7a00] text-slate-950 text-xs font-extrabold rounded-lg transition-all inline-flex items-center justify-center gap-1.5 shadow-md shadow-[#FF9900]/20 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
                        >
                          <span>Buy on Amazon</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => addToCart(p)}
                            aria-label={`Add ${p.title} to shopping cart`}
                            className="min-h-[44px] px-2.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 text-xs font-semibold rounded-lg border border-slate-700/70 transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
                            title="Add to cart"
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Cart</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBuyNow(p)}
                            aria-label={`Buy ${p.title} now via CJ Express 48h Dispatch`}
                            className="min-h-[44px] px-3 py-2 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
                            title="Express 48h Dispatch / Buy Now via CJ"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                            <span>Buy Now via CJ</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* One-Click Social Share (Pinterest & Reddit) */}
                    <SocialShare
                      variant="card"
                      productId={p.id}
                      productTitle={p.title}
                      imageUrl={displayImage}
                    />
                  </div>
                </motion.article>
              </React.Fragment>
            );
            })}
            </div>

            {/* Storefront Pagination Bar */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <div>
                  Showing{' '}
                  <strong className="text-white">
                    {(safeCurrentPage - 1) * itemsPerPage + 1}
                  </strong>
                  –
                  <strong className="text-white">
                    {Math.min(safeCurrentPage * itemsPerPage, filteredProducts.length)}
                  </strong>{' '}
                  of <strong className="text-emerald-400">{filteredProducts.length}</strong> products
                  {selectedCategory !== 'All' && (
                    <span>
                      {' '}
                      in <strong className="text-white">{selectedCategory}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-40 font-semibold cursor-pointer transition-colors"
                  >
                    ← Prev
                  </button>

                  {visiblePageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => {
                        setCurrentPage(pageNum);
                        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                        pageNum === safeCurrentPage
                          ? 'bg-emerald-400 text-slate-950 shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800 disabled:opacity-40 font-semibold cursor-pointer transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Social Proof & Customer Reviews */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold text-white tracking-tight">Verified Purchaser Feedback</h2>
          <p className="text-xs text-slate-400 mt-1">
            Over 2,400+ 5-star deliveries across the USA &amp; UK.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              &quot;The grade 1 titanium tumbler is insanely light and kept my coffee steaming through a 6-hour train commute from London to Edinburgh.&quot;
            </p>
            <p className="text-[11px] text-slate-400 font-mono">Oliver M. · London, UK</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              &quot;Qi2 magnetic charging stand folds completely flat into my laptop sleeve. Delivered in Austin within 48 hours with real-time tracking.&quot;
            </p>
            <p className="text-[11px] text-slate-400 font-mono">Jessica T. · Austin, TX</p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center text-amber-400 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              &quot;Merino wool travel cushion is breathable and doesn&apos;t overheat on redeyes. Easily the highest quality travel gear I&apos;ve ordered this year.&quot;
            </p>
            <p className="text-[11px] text-slate-400 font-mono">James R. · Manhattan, NY</p>
          </div>
        </div>
      </section>

      {/* Cart & Checkout Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Your Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-xs">
                  Your cart is empty. Add high-CRP essentials from the collection.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3 text-xs"
                  >
                    <img
                      src={resolveProductImage(item.product.image_link)}
                      alt={item.product.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                          target.src = FALLBACK_PRODUCT_IMAGE;
                        }
                      }}
                      className="w-14 h-14 object-cover rounded-lg bg-slate-950 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{item.product.title}</p>
                      <p className="text-[11px] text-emerald-400 font-mono">
                        {formatPriceForDisplay(item.product.sale_price || item.product.price)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Action Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Domestic Shipping (US/UK)</span>
                <span className="text-emerald-400 font-semibold font-mono">
                  {cart.some((it) => it.product.isFreeShipping === false && (it.product.shippingCost ?? 0) > 0)
                    ? `$${Math.max(...cart.map((it) => (it.product.isFreeShipping === false ? it.product.shippingCost ?? 0 : 0))).toFixed(2)} USD`
                    : 'Shipping: $0.00 (Free)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-white">
                <span>Subtotal</span>
                <span className="font-mono text-emerald-400 text-base">${cartTotal.toFixed(2)} USD</span>
              </div>

              {checkoutSuccess ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Order placed! Dispatched to domestic fulfillment partner.</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    trackBeginCheckout(cart, cartTotal, 'USD', {
                      checkoutSource: 'cart_drawer_express_checkout',
                    });
                    setIsCartOpen(false);
                    setExpressCheckoutItems(cart);
                    setIsExpressCheckoutOpen(true);
                  }}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-300 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Express Checkout (Apple Pay / Card)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal with Dynamic Variant Selector */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-slate-900/90 text-slate-300 hover:text-white rounded-lg border border-slate-700/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-square bg-slate-900 overflow-hidden relative">
                <img
                  src={resolveProductImage(selectedVariant?.image_link || quickViewProduct.image_link)}
                  alt={`${quickViewProduct.title} - ${selectedColor}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                      target.src = FALLBACK_PRODUCT_IMAGE;
                    }
                  }}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {selectedVariant && (
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-emerald-400">
                    {selectedVariant.size} · {selectedVariant.color}
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-emerald-400">
                      {selectedVariant?.sku || quickViewProduct.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                      {selectedVariant ? `${selectedVariant.stock_quantity} in stock` : 'In Stock'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {quickViewProduct.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-xs line-clamp-3">
                    {quickViewProduct.description}
                  </p>

                  {/* Dynamic Variant Selector: Size */}
                  {availableSizes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">
                          Size: <strong className="text-white">{selectedSize}</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableSizes.map((sizeOpt) => (
                          <button
                            key={sizeOpt}
                            type="button"
                            onClick={() => setSelectedSize(sizeOpt)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              selectedSize === sizeOpt
                                ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {sizeOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Variant Selector: Color */}
                  {availableColors.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">
                          Finish / Color: <strong className="text-white">{selectedColor}</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {availableColors.map((colorOpt) => (
                          <button
                            key={colorOpt}
                            type="button"
                            onClick={() => setSelectedColor(colorOpt)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              selectedColor === colorOpt
                                ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {colorOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold font-mono text-emerald-400">
                      {formatRegionalPrice(
                        selectedVariant
                          ? selectedVariant.sale_price || selectedVariant.price
                          : quickViewProduct.sale_price || quickViewProduct.price,
                        currentRegion
                      ).formatted}
                    </span>
                    {selectedVariant?.sale_price && (
                      <span className="text-xs font-mono line-through text-slate-500">
                        {formatRegionalPrice(selectedVariant.price, currentRegion).formatted}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() =>
                        handleBuyNow(
                          buildVariantProductSnapshot(quickViewProduct, selectedVariant),
                          'quick_view_buy_now'
                        )
                      }
                      className="w-full min-h-[42px] py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Buy Now with Express Checkout</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          addToCart(
                            buildVariantProductSnapshot(quickViewProduct, selectedVariant),
                            'quick_view_modal'
                          );
                          setQuickViewProduct(null);
                        }}
                        className="flex-1 min-h-[40px] py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Add Selected Variant to Cart
                      </button>
                      <button
                        onClick={() => {
                          setFullPdpProduct(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        className="min-h-[40px] px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                        title="View Full Product Details"
                      >
                        Full Details
                      </button>
                    </div>

                    {/* Share this Deal (Pinterest & Reddit) */}
                    <SocialShare
                      variant="full"
                      productId={quickViewProduct.id}
                      productTitle={quickViewProduct.title}
                      imageUrl={resolveProductImage(
                        selectedVariant?.image_link || quickViewProduct.image_link
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Product Detail Modal / Dedicated Product Link Page (/product/:id) */}
      {fullPdpProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative my-4 sm:my-8">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={closeProductLinkPage}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Return to main storefront catalog"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Back to Storefront</span>
                </button>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800/40 shrink-0">
                  {fullPdpProduct.brand || 'AeroThor'}
                </span>
                <span className="text-xs font-bold text-white truncate hidden sm:inline">
                  {fullPdpProduct.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyProductLink(fullPdpProduct, e)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] transition-colors cursor-pointer"
                >
                  {copiedProductId === fullPdpProduct.id ? '✓ Copied URL' : 'Copy Product URL'}
                </button>
                <button
                  onClick={closeProductLinkPage}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
                  title="Back to Store Catalog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Canonical Product Link Bar */}
              <div className="p-2.5 px-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400 shrink-0">Canonical Product Link:</span>
                  <a
                    href={`${CANONICAL_STORE_URL}/product/${encodeURIComponent(fullPdpProduct.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-400 hover:underline truncate select-all"
                  >
                    {CANONICAL_STORE_URL}/product/{encodeURIComponent(fullPdpProduct.id)}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleCopyProductLink(fullPdpProduct, e)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 shrink-0 text-left sm:text-right cursor-pointer"
                >
                  {copiedProductId === fullPdpProduct.id ? 'Copied to Clipboard!' : 'Copy Link'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-[4/3] sm:aspect-square bg-slate-900 rounded-xl overflow-hidden p-4 border border-slate-800 flex items-center justify-center relative">
                  <img
                    src={resolveProductImage(selectedVariant?.image_link || fullPdpProduct.image_link)}
                    alt={`${fullPdpProduct.title} - ${selectedColor}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                        target.src = FALLBACK_PRODUCT_IMAGE;
                      }
                    }}
                    className="max-h-full max-w-full object-contain transition-all duration-300"
                  />
                  {selectedVariant && (
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-emerald-400">
                      Active Variant: {selectedVariant.size} · {selectedVariant.color}
                    </span>
                  )}
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                      {fullPdpProduct.brand}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">{fullPdpProduct.title}</h2>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                      Product ID: <span className="text-emerald-400">{fullPdpProduct.id}</span> · Variant SKU: <span className="text-slate-300">{selectedVariant?.sku || fullPdpProduct.id}</span>
                    </p>
                  </div>

                  {/* Dynamic Price Display */}
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {formatRegionalPrice(
                        selectedVariant
                          ? selectedVariant.sale_price || selectedVariant.price
                          : fullPdpProduct.sale_price || fullPdpProduct.price,
                        currentRegion
                      ).formatted}
                    </span>
                    {selectedVariant?.sale_price && (
                      <span className="text-sm font-mono line-through text-slate-500">
                        {formatRegionalPrice(selectedVariant.price, currentRegion).formatted}
                      </span>
                    )}
                  </div>

                  {/* CRO URGENCY & SCARCITY TRIGGERS: Flash Sale Timer + Low Stock */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/90 via-amber-950/50 to-slate-950 border border-rose-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      Flash Sale Ends Soon
                    </span>
                    <span className="font-mono font-extrabold text-white bg-slate-950/90 px-2.5 py-1 rounded-md border border-rose-500/30">
                      Ends in {String(flashHours).padStart(2, '0')}h : {String(flashMinutes).padStart(2, '0')}m :{' '}
                      {String(flashSecs).padStart(2, '0')}s
                    </span>
                  </div>

                  <div className="px-3 py-2 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-300">
                      Only 3 left in stock - order soon
                    </span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {currentRegion.flag} In Stock · Dispatches via {currentRegion.carrierName}
                    </span>
                  </div>

                  {/* Interactive Size & Color Variant Selector */}
                  <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                    {availableSizes.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          1. Select Size / Edition: <span className="text-emerald-400">{selectedSize}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((sizeOpt) => (
                            <button
                              key={sizeOpt}
                              type="button"
                              onClick={() => setSelectedSize(sizeOpt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                selectedSize === sizeOpt
                                  ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
                                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {sizeOpt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableColors.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          2. Select Finish / Color: <span className="text-emerald-400">{selectedColor}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((colorOpt) => (
                            <button
                              key={colorOpt}
                              type="button"
                              onClick={() => setSelectedColor(colorOpt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                selectedColor === colorOpt
                                  ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-sm'
                                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {colorOpt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-300 leading-relaxed text-xs">{fullPdpProduct.description}</p>

                  {/* HIGH-CONTRAST CTAs: Strictly separate Amazon Affiliate ("Buy on Amazon") vs CJ Dropshipping ("Express 48h Dispatch / Buy Now via CJ") */}
                  <div className="space-y-2.5 pt-2">
                    {fullPdpProduct.productType === 'affiliate' ||
                    Boolean(fullPdpProduct.affiliateUrl) ||
                    Boolean(fullPdpProduct.affiliate_url) ||
                    fullPdpProduct.id.toLowerCase().startsWith('aff-') ? (
                      <a
                        href={localizeAmazonAffiliateUrl(
                          fullPdpProduct.affiliateUrl || fullPdpProduct.affiliate_url,
                          fullPdpProduct.title,
                          currentRegion
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-5 bg-[#FF9900] hover:bg-[#e68a00] active:bg-[#cc7a00] text-slate-950 font-black text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF9900]/25 cursor-pointer"
                      >
                        <span>Buy on Amazon ({currentRegion.amazonDomain})</span>
                        <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                      </a>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          onClick={() => {
                            addToCart(
                              buildVariantProductSnapshot(fullPdpProduct, selectedVariant),
                              'pdp_modal'
                            );
                            setFullPdpProduct(null);
                          }}
                          className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4 text-emerald-400" />
                          <span>Add to Cart (CJ Direct)</span>
                        </button>

                        <button
                          onClick={() =>
                            handleBuyNow(
                              buildVariantProductSnapshot(fullPdpProduct, selectedVariant),
                              'pdp_modal_buy_now'
                            )
                          }
                          className="w-full py-3.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          <span>
                            Express 48h Dispatch / Buy Now via CJ —{' '}
                            {formatRegionalPrice(
                              selectedVariant
                                ? selectedVariant.sale_price || selectedVariant.price
                                : fullPdpProduct.sale_price || fullPdpProduct.price,
                              currentRegion
                            ).formatted}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* ONE-CLICK SOCIAL SHARE SECTION ("Share this Deal" - Pinterest & Reddit) */}
                    <SocialShare
                      variant="full"
                      productId={fullPdpProduct.id}
                      productTitle={fullPdpProduct.title}
                      imageUrl={resolveProductImage(
                        selectedVariant?.image_link || fullPdpProduct.image_link
                      )}
                    />

                    {/* TRUST BADGES BELOW CTA */}
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-200">
                        <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold">Secure Stripe Checkout</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-200">
                        <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold">30-Day Money-Back Guarantee</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-200">
                        <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{currentRegion.flag} {currentRegion.carrierName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RELATED DEALS SECTION (Cross-Sell Affiliate Items Below Main Product) */}
              {relatedDealsForPdp.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Related Deals &amp; Amazon Partner Offers
                    </h3>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      Verified Partner Selection
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {relatedDealsForPdp.map((rel) => {
                      const isRelAffiliate =
                        rel.productType === 'affiliate' ||
                        Boolean(rel.affiliateUrl) ||
                        Boolean(rel.affiliate_url);
                      const relAffiliateUrl =
                        rel.affiliateUrl ||
                        rel.affiliate_url ||
                        `https://www.amazon.com/s?k=${encodeURIComponent(rel.title)}&tag=aerothor-20`;

                      return (
                        <div
                          key={rel.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#FF9900]/50 flex flex-col justify-between gap-2 transition-all"
                        >
                          <div
                            className="cursor-pointer space-y-2"
                            onClick={() => openProductLinkPage(rel)}
                          >
                            <div className="aspect-[4/3] rounded-lg bg-slate-950 overflow-hidden">
                              <img
                                src={resolveProductImage(rel.image_link)}
                                alt={rel.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                              {rel.title}
                            </p>
                          </div>
                          <div className="space-y-2 pt-1">
                            <div className="text-xs font-extrabold font-mono text-emerald-400">
                              {formatPriceForDisplay(rel.sale_price || rel.price)}
                            </div>
                            {isRelAffiliate ? (
                              <a
                                href={relAffiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-1.5 px-2.5 rounded-lg bg-[#FF9900] hover:bg-[#e68a00] text-slate-950 font-extrabold text-[11px] flex items-center justify-center gap-1 transition-colors"
                              >
                                <span>Buy on Amazon</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openProductLinkPage(rel)}
                                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                View Deal →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Generated Product Page SEO Metadata (<head> & OpenGraph) — Visible to Authenticated Admins Only */}
              {isAdminAuthenticated &&
                (() => {
                  const pageMeta = generateProductPageMetadata(fullPdpProduct);
                  return (
                    <div className="space-y-4">
                      <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                          <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Admin Inspector: Generated Product Page Metadata (&lt;head&gt; &amp; OpenGraph)</span>
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">
                            {fullPdpProduct.seo_title ? 'Custom Admin SEO Active' : 'Default SEO Template'}
                          </span>
                        </div>
                        <div className="p-4 space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 font-mono text-[11px]">&lt;title&gt;: </span>
                            <span className="text-white font-semibold">{pageMeta.title}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono text-[11px]">meta[name=&quot;description&quot;]: </span>
                            <span className="text-slate-300">{pageMeta.description}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-mono text-[11px]">link[rel=&quot;canonical&quot;]: </span>
                            <span className="text-emerald-400 font-mono text-[11px]">{pageMeta.canonicalUrl}</span>
                          </div>
                        </div>
                      </div>

                      {/* Live JSON-LD Schema Snippet Viewer */}
                      <div className="border border-slate-800 rounded-xl bg-slate-900/90 overflow-hidden">
                        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                          <span className="font-mono text-emerald-400 text-[11px]">Dynamic &lt;script type=&quot;application/ld+json&quot;&gt;</span>
                          <span className="text-slate-500 text-[10px]">Google Search &amp; GMC Crawlable</span>
                        </div>
                        <pre className="p-4 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                          {JSON.stringify(pageMeta.jsonLd, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* GMC Compliant Global Footer */}
      <footer className="mt-16 border-t border-slate-800/80 pt-10 text-xs text-slate-400 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-xs">
                A
              </div>
              <span className="font-bold text-white text-sm">AeroCommerce</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Zero-cost headless direct-to-consumer store powered by live supplier inventory sync, Google Merchant Center RSS 2.0 feeds, and automated PMax margins.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">GMC Customer Policies</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActivePolicyModal('shipping')}
                  className="hover:text-emerald-400 text-left transition-colors"
                >
                  Shipping &amp; Delivery (3-7 Days US/UK)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('refund')}
                  className="hover:text-emerald-400 text-left transition-colors"
                >
                  Return &amp; Refund Policy (30 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('privacy')}
                  className="hover:text-emerald-400 text-left transition-colors"
                >
                  Privacy Policy (GDPR / CCPA)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('terms')}
                  className="hover:text-emerald-400 text-left transition-colors"
                >
                  Terms of Service &amp; Sale
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">Shop Collections</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  All Essentials ({products.length})
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('CJ Marketplace')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Trending New Arrivals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Tech Accessories')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Qi2 &amp; Tech Hardware
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Drinkware & Travel')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Titanium Drinkware &amp; Travel
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">SEO &amp; Targeted Markets</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-white font-semibold">XML Sitemap</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">1,023 URLs</span>
                </a>
              </li>
              <li>
                <a
                  href="/api/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Google Merchant XML Feed</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">RSS 2.0</span>
                </a>
              </li>
              <li>
                <a href="/deals/us" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>United States (USPS Priority)</span>
                </a>
              </li>
              <li>
                <a href="/deals/uk" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>United Kingdom (Royal Mail 48)</span>
                </a>
              </li>
              <li>
                <a href="/deals/canada" className="hover:text-emerald-400 transition-colors">
                  <span>Canada &amp; Europe Express Hubs</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">Merchant Identity</h4>
            <p className="text-[11px] text-slate-300 font-semibold">AeroCommerce Global LLC</p>
            <p className="text-[11px] text-slate-400">1209 Orange Street, Wilmington, DE 19801, USA</p>
            <p className="text-[11px] text-slate-400">Phone: +1 (800) 555-0199</p>
            <p className="text-[11px] text-emerald-400">support@aerocommerce.com</p>
            <div className="pt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                Google Verified Merchant
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} AeroCommerce Global LLC. Google Merchant Center Certified Storefront.</p>
          <div className="flex items-center gap-3">
            <span>Visa</span>
            <span>·</span>
            <span>Mastercard</span>
            <span>·</span>
            <span>Apple Pay</span>
            <span>·</span>
            <span>Google Pay</span>
            <span>·</span>
            <span>PayPal</span>
          </div>
        </div>
      </footer>

      {/* Interactive GMC Policy Modal */}
      {activePolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto text-xs space-y-4">
            <button
              onClick={() => setActivePolicyModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {activePolicyModal === 'shipping' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Truck className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Shipping &amp; Delivery Policy (US &amp; UK)</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  AeroCommerce provides domestic dispatch across the United States (USPS Priority, FedEx) and United Kingdom (Royal Mail Tracked 48).
                </p>
                <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800 text-[11px]">
                  <p><strong>Handling Time:</strong> 24 to 48 hours (Cut-off 2:00 PM EST).</p>
                  <p><strong>Transit Time:</strong> 3 to 7 business days.</p>
                  <p><strong>Shipping Cost:</strong> FREE on orders over $50 / £40 (or flat $4.99).</p>
                  <p><strong>Tracking:</strong> Real-time carrier telemetry provided via email upon courier handover.</p>
                </div>
              </div>
            )}

            {activePolicyModal === 'refund' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <RotateCcw className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">30-Day Return &amp; Refund Policy</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  We stand by our product quality with a transparent 30-day money-back guarantee.
                </p>
                <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800 text-[11px]">
                  <p><strong>Return Window:</strong> 30 calendar days from delivery date.</p>
                  <p><strong>Restocking Fees:</strong> $0.00 (Zero restocking fees on all returns).</p>
                  <p><strong>Return Shipping:</strong> Free pre-paid label for damaged/defective products.</p>
                  <p><strong>Refund Speed:</strong> Processed within 48 hours of warehouse inspection back to original card.</p>
                </div>
              </div>
            )}

            {activePolicyModal === 'privacy' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Privacy Policy (GDPR &amp; CCPA Compliant)</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  AeroCommerce never sells customer personal data. Data is used strictly for fulfillment and security.
                </p>
                <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800 text-[11px]">
                  <p><strong>Security:</strong> 256-Bit SSL tokenized checkout (Stripe / PayPal).</p>
                  <p><strong>Data Rights:</strong> Right to access and request erasure via privacy@aerocommerce.com.</p>
                </div>
              </div>
            )}

            {activePolicyModal === 'terms' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Terms of Service &amp; Sale</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  All transactions are subject to Delaware (USA) and UK commercial sales laws. Pricing in GMC feeds matches final checkout price with zero hidden fees.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Express Checkout Slide-Over Modal */}
      <ExpressCheckoutDrawer
        isOpen={isExpressCheckoutOpen}
        onClose={() => setIsExpressCheckoutOpen(false)}
        items={expressCheckoutItems}
        onUpdateQuantity={(productId, delta) => {
          setExpressCheckoutItems((prev) =>
            prev
              .map((item) => {
                if (item.product.id === productId) {
                  const newQty = item.quantity + delta;
                  return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
              })
              .filter(Boolean) as CheckoutItem[]
          );
        }}
        onClearCart={() => {
          setCart([]);
        }}
      />

      {/* Floating Corporate Voucher / Promo Coupon Drawer */}
      <PromoCouponDrawer />
    </div>
  );
};

