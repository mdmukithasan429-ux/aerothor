import React, { useState, useEffect, useRef } from 'react';
import { GmcProduct } from '../lib/gmc-feed';
import { ExpressCheckoutDrawer, CheckoutItem } from './ExpressCheckoutDrawer';
import {
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Star,
  ExternalLink,
  ChevronRight,
  Plus,
  Minus,
  X,
  CreditCard,
  Lock,
  Zap,
  Search,
  Loader2,
} from 'lucide-react';

interface StoreLandingPageProps {
  products: GmcProduct[];
  onOpenFeed: () => void;
}

interface CartItem {
  product: GmcProduct;
  quantity: number;
}

const SEARCH_STORAGE_KEY = 'aerothor_store_persistent_search';
const CATEGORY_STORAGE_KEY = 'aerothor_store_persistent_category';
const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';

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
  return cleaned.startsWith('https://') || cleaned.startsWith('/') ? cleaned : FALLBACK_PRODUCT_IMAGE;
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

    let matchesCategory = true;
    if (selectedCategory === 'CJ Marketplace') {
      matchesCategory =
        Boolean(p.cj_pid) ||
        p.source === 'cj_live' ||
        (skuLower.startsWith('cj-') && !/^cj-(home|fit|trvl|tech)-\d{5}$/.test(skuLower));
    } else if (selectedCategory === 'Drinkware & Travel') {
      matchesCategory =
        titleLower.includes('flask') ||
        titleLower.includes('tumbler') ||
        titleLower.includes('pillow');
    } else if (selectedCategory === 'Tech Accessories') {
      matchesCategory =
        titleLower.includes('charge') ||
        titleLower.includes('stand') ||
        titleLower.includes('dock') ||
        titleLower.includes('wallet');
    } else if (selectedCategory === 'Outerwear & Commute') {
      matchesCategory =
        titleLower.includes('hoodie') ||
        titleLower.includes('backpack') ||
        titleLower.includes('eyewear') ||
        titleLower.includes('aviator');
    }

    if (!matchesCategory) return false;
    if (queryTokens.length === 0) return true;

    const searchable = `${titleLower} ${descLower} ${skuLower} ${brandLower}`;
    return queryTokens.every((token) => searchable.includes(token));
  });
}

export const StoreLandingPage: React.FC<StoreLandingPageProps> = ({ products, onOpenFeed }) => {
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
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<GmcProduct | null>(null);
  const [fullPdpProduct, setFullPdpProduct] = useState<GmcProduct | null>(null);
  const [activePolicyModal, setActivePolicyModal] = useState<'shipping' | 'refund' | 'privacy' | 'terms' | null>(null);

  // Express Checkout Drawer State
  const [isExpressCheckoutOpen, setIsExpressCheckoutOpen] = useState(false);
  const [expressCheckoutItems, setExpressCheckoutItems] = useState<CheckoutItem[]>([]);

  const handleBuyNow = (product: GmcProduct) => {
    setExpressCheckoutItems([{ product, quantity: 1 }]);
    setQuickViewProduct(null);
    setFullPdpProduct(null);
    setIsCartOpen(false);
    setIsExpressCheckoutOpen(true);
  };

  const categories = ['All', 'CJ Marketplace', 'Drinkware & Travel', 'Tech Accessories', 'Outerwear & Commute'];

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

        const data = await res.json();
        if (active && Array.isArray(data.products)) {
          setFilteredProducts(data.products);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (active) {
          setFilteredProducts(filterCatalogLocally(products, debouncedQuery, selectedCategory));
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

  const addToCart = (product: GmcProduct) => {
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
    const rawPrice = parseFloat(item.product.sale_price?.replace(/[^0-9.]/g, '') || item.product.price.replace(/[^0-9.]/g, '') || '0');
    return sum + rawPrice * item.quantity;
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
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-16">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AEROTHOR® OFFICIAL STORE · US &amp; UK DIRECT WAREHOUSE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Minimalist Performance Essentials for High-Velocity Commuters.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Grade 1 titanium vessels, 100% pure merino thermal wear, and Qi2 aerospace charging hardware. Engineered for the modern trans-Atlantic commuter with zero-friction 48h dispatch.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#catalog"
              className="px-6 py-3 bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/10 inline-flex items-center gap-2"
            >
              <span>Explore Collection ({products.length})</span>
              <ChevronRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-3 bg-slate-900 border border-slate-700 text-slate-200 font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>View Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            </button>
          </div>
        </div>

        {/* Trust Badges Strip (GMC Compliant Policies) */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 mt-8 border-t border-slate-800/80 text-xs">
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

      {/* Catalog Filter & Showcase */}
      <section id="catalog" className="space-y-6">
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
                onClick={() => setSelectedCategory(cat)}
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
              Showing <span className="text-emerald-400 font-semibold">{filteredProducts.length}</span> of{' '}
              <span className="text-slate-200 font-semibold">{products.length}</span> items
            </span>
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
        {filteredProducts.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProducts.map((p) => {
              const displayImage = resolveProductImage(p.image_link);
              return (
                <article
                  key={p.id}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    {/* Image Frame */}
                    <div
                      className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                      onClick={() => setQuickViewProduct(p)}
                    >
                      <img
                        src={displayImage}
                        alt={p.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                            target.src = FALLBACK_PRODUCT_IMAGE;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {p.sale_price && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold tracking-wide rounded shadow-sm">
                          SALE
                        </span>
                      )}
                      <span
                        title={p.id}
                        className="absolute top-3 right-3 max-w-[55%] truncate px-2 py-0.5 bg-slate-950/85 backdrop-blur-sm border border-slate-800/80 text-slate-300 font-mono text-[10px] rounded"
                      >
                        {p.id}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] truncate">
                          {p.brand || 'AeroThor'}
                        </span>
                        <span className="text-emerald-400 font-medium text-[11px] whitespace-nowrap shrink-0">
                          In Stock
                        </span>
                      </div>

                      <h3
                        onClick={() => setQuickViewProduct(p)}
                        className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors cursor-pointer line-clamp-2 min-h-[2.75rem] leading-snug"
                      >
                        {p.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Add to Cart Footer — Mobile Responsive without Wrapping or Crushing */}
                  <div className="px-4 py-3.5 sm:px-5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3 mt-auto">
                    <div className="font-mono tabular-nums min-w-0">
                      {p.sale_price ? (
                        <div className="flex flex-col leading-tight">
                          <span className="text-base font-extrabold text-emerald-400 whitespace-nowrap">
                            {p.sale_price}
                          </span>
                          <span className="text-[11px] line-through text-slate-500 whitespace-nowrap">
                            {p.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-extrabold text-white whitespace-nowrap">
                          {p.price}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        className="min-h-[40px] px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/70 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
                        title="Add to cart"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBuyNow(p)}
                        className="min-h-[40px] px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
                        title="Express 1-Click Checkout"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
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
                        {item.product.sale_price || item.product.price}
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
                <span className="text-emerald-400 font-semibold font-mono">FREE (Tracked 48h)</span>
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

      {/* Quick View Modal */}
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
              <div className="aspect-[4/3] md:aspect-square bg-slate-900 overflow-hidden">
                <img
                  src={resolveProductImage(quickViewProduct.image_link)}
                  alt={quickViewProduct.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                      target.src = FALLBACK_PRODUCT_IMAGE;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2 text-xs">
                  <span className="font-mono text-emerald-400">{quickViewProduct.id}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{quickViewProduct.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-xs line-clamp-4 sm:line-clamp-none">{quickViewProduct.description}</p>
                  
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>Brand: <strong className="text-white">{quickViewProduct.brand}</strong></div>
                    <div>Condition: <strong className="text-white">{quickViewProduct.condition}</strong></div>
                    <div>GTIN: <strong className="text-white font-mono">{quickViewProduct.gtin || 'GS1 Verified'}</strong></div>
                    <div>Fulfillment: <strong className="text-emerald-400">48h Domestic</strong></div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {quickViewProduct.sale_price || quickViewProduct.price}
                  </div>
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleBuyNow(quickViewProduct)}
                      className="w-full min-h-[42px] py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Buy Now with Express Checkout</span>
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          addToCart(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        className="flex-1 min-h-[40px] py-2 bg-slate-800 text-slate-200 font-semibold text-xs rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => {
                          setFullPdpProduct(quickViewProduct);
                          setQuickViewProduct(null);
                        }}
                        className="min-h-[40px] px-3 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
                        title="Inspect Next.js PDP & Schema.org JSON-LD"
                      >
                        View PDP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full PDP & Schema.org JSON-LD Modal */}
      {fullPdpProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative my-4 sm:my-8">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800/40 shrink-0">
                  app/product/[id]/page.tsx
                </span>
                <span className="text-xs font-bold text-white truncate">Next.js App Router PDP &amp; Schema.org Rich Snippet</span>
              </div>
              <button
                onClick={() => setFullPdpProduct(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="aspect-[4/3] sm:aspect-square bg-slate-900 rounded-xl overflow-hidden p-4 border border-slate-800 flex items-center justify-center">
                  <img
                    src={resolveProductImage(fullPdpProduct.image_link)}
                    alt={fullPdpProduct.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                        target.src = FALLBACK_PRODUCT_IMAGE;
                      }
                    }}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">{fullPdpProduct.brand}</span>
                    <h2 className="text-xl font-bold text-white mt-1">{fullPdpProduct.title}</h2>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">SKU: {fullPdpProduct.id}</p>
                  </div>

                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {fullPdpProduct.sale_price || fullPdpProduct.price}
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span>Domestic Dispatch: <strong>3-7 Business Days (US/UK)</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <RotateCcw className="w-4 h-4 text-emerald-400" />
                      <span>Consumer Guarantee: <strong>30-Day Free Returns (0 Restocking Fee)</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Google Merchant Center Certified Product Listing</span>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-xs">{fullPdpProduct.description}</p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleBuyNow(fullPdpProduct)}
                      className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Buy Now with Express Checkout</span>
                    </button>
                    <button
                      onClick={() => {
                        addToCart(fullPdpProduct);
                        setFullPdpProduct(null);
                      }}
                      className="w-full py-2.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Add to Cart
                    </button>
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
                  {JSON.stringify(
                    {
                      '@context': 'https://schema.org/',
                      '@type': 'Product',
                      name: fullPdpProduct.title,
                      image: [fullPdpProduct.image_link],
                      description: fullPdpProduct.description,
                      sku: fullPdpProduct.id,
                      brand: { '@type': 'Brand', name: fullPdpProduct.brand },
                      offers: {
                        '@type': 'Offer',
                        priceCurrency: 'USD',
                        price: fullPdpProduct.price.replace(/[^0-9.]/g, ''),
                        availability: 'https://schema.org/InStock',
                        itemCondition: 'https://schema.org/NewCondition',
                        shippingDetails: {
                          '@type': 'OfferShippingDetails',
                          shippingRate: { '@type': 'MonetaryAmount', value: '0.00', currency: 'USD' },
                          deliveryTime: { '@type': 'ShippingDeliveryTime', transitTime: { minValue: 3, maxValue: 7, unitCode: 'DAY' } },
                        },
                        hasMerchantReturnPolicy: {
                          '@type': 'MerchantReturnPolicy',
                          merchantReturnDays: 30,
                          returnFees: 'https://schema.org/FreeReturn',
                        },
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
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
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">Live Integrations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/api/feed.xml" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Google Merchant Center Feed</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">XML</span>
                </a>
              </li>
              <li><span className="text-slate-500">CJ Dropshipping Bulk Sync</span></li>
              <li><span className="text-slate-500">PostgreSQL (Prisma Client)</span></li>
              <li><span className="text-slate-500">PMax High-CRP Engine</span></li>
            </ul>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="text-white font-semibold text-xs mb-3 tracking-wider uppercase">Merchant Identity</h4>
            <p className="text-[11px] text-slate-300">AeroCommerce Global LLC</p>
            <p className="text-[11px] text-slate-400">1209 Orange Street, Wilmington, DE 19801, USA</p>
            <p className="text-[11px] text-slate-400">Phone: +1 (800) 555-0199</p>
            <p className="text-[11px] text-emerald-400">support@aerocommerce.com</p>
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
    </div>
  );
};
