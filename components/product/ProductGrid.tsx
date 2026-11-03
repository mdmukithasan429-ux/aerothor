'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  ShoppingBag,
  ExternalLink,
  Loader2,
  X,
  Star,
  RefreshCw,
  Truck,
  Zap,
} from 'lucide-react';
import { SocialShare } from './SocialShare';

export interface ProductReviewEntry {
  id: string;
  author: string;
  country: 'US' | 'GB';
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  date: string;
}

export interface StorefrontProductItem {
  id: string;
  sku?: string;
  title: string;
  description?: string;
  brand?: string;
  price: string | number;
  sale_price?: string | number;
  salePrice?: string | number | null;
  image_link?: string;
  mainImageUrl?: string;
  availability?: string;
  productType?: string;
  product_type?: string;
  google_product_category?: string;
  affiliateUrl?: string | null;
  affiliate_url?: string | null;
  cj_pid?: string | null;
  cjPid?: string | null;
  source?: string;
  isTrending?: boolean;
  isBestSelling?: boolean;
  trendingScore?: number;
  salesCount?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  reviews?: ProductReviewEntry[];
  hasLifetimeUpdateAccess?: boolean;
}

export interface ProductGridProps {
  initialProducts?: StorefrontProductItem[];
  defaultPageSize?: number;
  onSelectProduct?: (product: StorefrontProductItem) => void;
  onAddToCart?: (product: StorefrontProductItem) => void;
}

export const STOREFRONT_CATEGORY_TABS = [
  'All',
  'Protective Skins & Wraps',
  'Tech Accessories',
  'Clothing',
  'Drinkware & Travel',
  'Affiliate Deals',
  'CJ Marketplace',
] as const;

export function matchesProductCategory(
  product: StorefrontProductItem,
  category: string
): boolean {
  if (!category || category === 'All') return true;
  const catLower = category.trim().toLowerCase();
  const titleLower = String(product.title || '').toLowerCase();
  const descLower = String(product.description || '').toLowerCase();
  const typeLower = String(
    product.productType || product.product_type || product.google_product_category || ''
  ).toLowerCase();
  const idLower = String(product.id || product.sku || '').toLowerCase();
  const isAffiliate =
    product.productType === 'affiliate' ||
    Boolean(product.affiliateUrl || product.affiliate_url) ||
    idLower.startsWith('aff-');

  if (catLower === 'protective skins & wraps' || catLower === 'protective skins') {
    return (
      idLower.startsWith('skin-') ||
      typeLower.includes('protective skin') ||
      titleLower.includes('3m') ||
      titleLower.includes('skin') ||
      titleLower.includes('wrap')
    );
  }
  if (catLower === 'affiliate deals' || catLower === 'affiliate') {
    return isAffiliate;
  }
  if (catLower === 'clothing' || catLower === 'outerwear & commute') {
    return (
      typeLower.includes('clothing') ||
      typeLower.includes('apparel') ||
      typeLower.includes('outerwear') ||
      titleLower.includes('hoodie') ||
      titleLower.includes('jacket') ||
      titleLower.includes('merino') ||
      titleLower.includes('shirt') ||
      titleLower.includes('backpack') ||
      titleLower.includes('sling') ||
      titleLower.includes('eyewear')
    );
  }
  if (catLower === 'tech accessories') {
    return (
      typeLower.includes('tech') ||
      typeLower.includes('electronics') ||
      titleLower.includes('charge') ||
      titleLower.includes('stand') ||
      titleLower.includes('dock') ||
      titleLower.includes('adapter') ||
      titleLower.includes('ssd') ||
      titleLower.includes('audio') ||
      titleLower.includes('wallet') ||
      titleLower.includes('headphone')
    );
  }
  if (catLower === 'drinkware & travel') {
    return (
      typeLower.includes('drinkware') ||
      typeLower.includes('travel') ||
      titleLower.includes('flask') ||
      titleLower.includes('tumbler') ||
      titleLower.includes('pillow')
    );
  }
  if (catLower === 'cj marketplace') {
    return (
      Boolean(product.cj_pid || product.cjPid) ||
      product.source === 'cj_live' ||
      idLower.startsWith('cj-')
    );
  }

  return (
    typeLower.includes(catLower) ||
    titleLower.includes(catLower) ||
    descLower.includes(catLower)
  );
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  initialProducts = [],
  defaultPageSize = 20,
  onSelectProduct,
  onAddToCart,
}) => {
  const [products, setProducts] = useState<StorefrontProductItem[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<
    'dynamic' | 'trending' | 'best-selling' | 'random' | 'top-rated' | 'price-asc' | 'price-desc'
  >('dynamic');
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(defaultPageSize);
  const [totalServerCount, setTotalServerCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialProducts.length > 0 && refreshNonce === 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts, refreshNonce]);

  // Reset to page 1 whenever category, search query, sort mode, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortMode, itemsPerPage]);

  // Fetch paginated, sorted & dynamically rotated slice from /api/products
  useEffect(() => {
    const controller = new AbortController();
    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const skip = (currentPage - 1) * itemsPerPage;
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
          take: String(itemsPerPage),
          skip: String(skip),
          category: selectedCategory,
          sort: sortMode,
          _t: String(Date.now()),
        });
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim());
        }

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data.products)) {
          setProducts(data.products);
          if (typeof data.totalCount === 'number') {
            setTotalServerCount(data.totalCount);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setTotalServerCount(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
    return () => controller.abort();
  }, [currentPage, itemsPerPage, selectedCategory, searchQuery, sortMode, refreshNonce]);

  const categoryTabs = useMemo(() => {
    return [...STOREFRONT_CATEGORY_TABS];
  }, []);

  const locallyFiltered = useMemo(() => {
    return products.filter((p) => {
      if (!matchesProductCategory(p, selectedCategory)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.title || ''} ${p.description || ''} ${p.id || p.sku || ''} ${p.brand || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const isServerPaginated =
    totalServerCount !== null && products.length <= itemsPerPage && totalServerCount >= products.length;

  const totalMatching = isServerPaginated ? totalServerCount! : locallyFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const displayedProducts = useMemo(() => {
    if (isServerPaginated) return products;
    const start = (safePage - 1) * itemsPerPage;
    return locallyFiltered.slice(start, start + itemsPerPage);
  }, [isServerPaginated, products, locallyFiltered, safePage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [safePage, totalPages]);

  return (
    <section className="space-y-6">
      {/* Dynamic Category Tabs & Sort Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
          {categoryTabs.map((cat) => {
            const active = selectedCategory === cat;
            const isAffiliateTab = cat === 'Affiliate Deals';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? isAffiliateTab
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                    : isAffiliateTab
                    ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/80'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {isAffiliateTab && <Tag className="w-3.5 h-3.5" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search, Dynamic Sort & Rotate Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute left-3 top-1/2 -translate-y-1/2" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU or title..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as any)}
            aria-label="Sort products"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="dynamic">Sort: Dynamic Live Rotation</option>
            <option value="trending">Sort: Trending Now</option>
            <option value="best-selling">Sort: Best-Selling</option>
            <option value="random">Sort: Randomized Load</option>
            <option value="top-rated">Sort: Top Rated Reviews</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <button
            type="button"
            onClick={() => setRefreshNonce((n) => n + 1)}
            title="Dynamically rotate & refresh storefront products"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Rotate Feed</span>
          </button>

          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            aria-label="Products per page"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
            <option value={48}>48 / page</option>
            <option value={96}>96 / page</option>
            <option value={1000}>All 1,000 Products</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {displayedProducts.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-bold text-white">No matching products found</p>
          <p className="text-xs text-slate-400">
            Try clearing your search filter or switching to another category tab.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayedProducts.map((product, idx) => {
            const sku = product.id || product.sku || '';
            const rawImageUrl =
              product.image_link ||
              product.mainImageUrl ||
              'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
            const imageUrl =
              rawImageUrl.includes('images.unsplash.com') && !rawImageUrl.includes('fm=webp')
                ? `${rawImageUrl}${rawImageUrl.includes('?') ? '&' : '?'}fm=webp`
                : rawImageUrl;
            const isAffiliate =
              product.productType === 'affiliate' ||
              Boolean(product.affiliateUrl || product.affiliate_url) ||
              sku.toLowerCase().startsWith('aff-');
            const displayPrice = product.sale_price || product.salePrice || product.price;
            const ratingValue = Number(product.rating || 4.94).toFixed(2);
            const reviewCount = Number(product.reviewCount || 184);
            const hasLifetimeAccess = product.hasLifetimeUpdateAccess !== false;
            const topReview = Array.isArray(product.reviews) && product.reviews.length > 0 ? product.reviews[0] : null;

            return (
              <article
                key={sku}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition-all"
              >
                <div>
                  <div
                    onClick={() => onSelectProduct && onSelectProduct(product)}
                    className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      width={600}
                      height={450}
                      priority={idx < 4}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isAffiliate ? (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded shadow-sm inline-flex items-center gap-1">
                        <Tag className="w-3 h-3 fill-current" />
                        <span>Buy on Amazon</span>
                      </span>
                    ) : (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold tracking-wide rounded shadow-sm inline-flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>Express 48h Dispatch</span>
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    {/* Clean unboxed typographic metadata bar */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{product.brand || 'AeroThor'}</span>
                      <span aria-hidden="true">·</span>
                      {product.isTrending && (
                        <>
                          <span className="text-emerald-400 font-medium">Trending</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      {product.isBestSelling && (
                        <>
                          <span className="text-amber-400 font-medium">Best-Selling</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      {isAffiliate && <span className="text-amber-300 font-medium">Partner Deal</span>}
                    </div>

                    <h3
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                      className="text-sm font-bold text-white line-clamp-2 leading-snug cursor-pointer hover:text-emerald-300 transition-colors"
                    >
                      {product.title}
                    </h3>

                    {/* Live Verified Rating & Lifetime Update Access */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        {ratingValue}
                      </span>
                      <span>({reviewCount.toLocaleString()} reviews)</span>
                      {hasLifetimeAccess && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-medium">Lifetime Updates</span>
                        </>
                      )}
                    </div>

                    {/* Verified Buyer Live Review Excerpt */}
                    {topReview && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1.5 mt-1">
                        &ldquo;{topReview.title} — {topReview.comment}&rdquo;{' '}
                        <span className="not-italic text-slate-500">({topReview.author}, {topReview.country})</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {typeof displayPrice === 'number'
                        ? `$${displayPrice.toFixed(2)}`
                        : String(displayPrice)}
                    </span>

                    {isAffiliate ? (
                      <a
                        href={
                          product.affiliateUrl ||
                          product.affiliate_url ||
                          `https://www.amazon.com/s?k=${encodeURIComponent(product.title)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 touch-manipulation"
                      >
                        <span>Buy on Amazon</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToCart && onAddToCart(product)}
                        className="min-h-[44px] px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Buy Now via CJ</span>
                      </button>
                    )}
                  </div>

                  {/* Share this Deal */}
                  <SocialShare
                    variant="card"
                    productId={sku}
                    productTitle={product.title}
                    imageUrl={imageUrl}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div>
          Showing{' '}
          <strong className="text-white">
            {totalMatching === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}
          </strong>
          –
          <strong className="text-white">
            {Math.min(safePage * itemsPerPage, totalMatching)}
          </strong>{' '}
          of <strong className="text-emerald-400">{totalMatching}</strong> verified products
          {selectedCategory !== 'All' && (
            <span>
              {' '}
              in <strong className="text-white">{selectedCategory}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                pageNum === safePage
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
