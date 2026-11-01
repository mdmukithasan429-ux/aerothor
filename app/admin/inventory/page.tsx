'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Layers,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react';

export interface InventoryProduct {
  id: string;
  title: string;
  price: string | number;
  category?: string;
  product_type?: string;
  google_product_category?: string;
  availability: string;
  stockQuantity?: number;
  image_link?: string;
  productSource?: 'dropshipping' | 'affiliate';
  affiliateUrl?: string;
  cjPid?: string;
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'dropshipping' | 'affiliate'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.products || [];
        setProducts(items);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Extract unique categories dynamically from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const rawCat = p.category || p.product_type || p.google_product_category || 'General Merchandise';
      const topCat = rawCat.split('>')[0].trim();
      if (topCat) set.add(topCat);
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [products]);

  // Filter products by Type (Dropshipping vs Affiliate), Category, and Search Query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const source = p.productSource || (p.affiliateUrl ? 'affiliate' : 'dropshipping');
      if (selectedType !== 'all' && source !== selectedType) return false;

      if (selectedCategory !== 'ALL') {
        const rawCat = p.category || p.product_type || p.google_product_category || 'General Merchandise';
        const topCat = rawCat.split('>')[0].trim();
        if (topCat !== selectedCategory) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchId = p.id?.toLowerCase().includes(q);
        if (!matchTitle && !matchId) return false;
      }

      return true;
    });
  }, [products, selectedType, selectedCategory, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedCategory, searchQuery, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, safePage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Package className="w-6 h-6 text-emerald-400" />
              ERP Product Inventory & Categorization
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Paginated catalog management for CJ Dropshipping & Affiliate products ({filteredProducts.length} matching of {products.length} total)
            </p>
          </div>

          <button
            onClick={fetchInventory}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Catalog
          </button>
        </div>

        {/* Filter Bar: Type Tabs + Category Dropdown + Search + Page Size */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          {/* Type Tabs (All / Dropshipping / Affiliate) */}
          <div className="lg:col-span-4 flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['all', 'dropshipping', 'affiliate'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedType(tab)}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold capitalize transition-all ${
                  selectedType === tab
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'all' ? 'All Products' : tab}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="lg:col-span-3 relative">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                    {cat === 'ALL' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="lg:col-span-3 relative">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or product title..."
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rows per page */}
          <div className="lg:col-span-2 flex items-center justify-end gap-2">
            <span className="text-xs text-slate-400">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none"
            >
              {[10, 15, 25, 50].map((size) => (
                <option key={size} value={size} className="bg-slate-900">
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Product / SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Fulfillment Type</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Inventory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading paginated catalog...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No products match your active category or search filters.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const isAffiliate =
                      product.productSource === 'affiliate' || Boolean(product.affiliateUrl);
                    const rawCat =
                      product.category ||
                      product.product_type ||
                      product.google_product_category ||
                      'General Merchandise';
                    const categoryLabel = rawCat.split('>')[0].trim();

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {product.image_link ? (
                              <img
                                src={product.image_link}
                                alt={product.title}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                <Layers className="w-5 h-5 text-slate-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-100 truncate max-w-md">
                                {product.title}
                              </p>
                              <p className="text-xs font-mono text-slate-400">{product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isAffiliate ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              Affiliate Partner
                              {product.affiliateUrl && (
                                <ExternalLink className="w-3 h-3 opacity-80" />
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              CJ Dropshipping
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                          {typeof product.price === 'number'
                            ? `$${product.price.toFixed(2)}`
                            : product.price}
                        </td>
                        <td className="py-3.5 px-4">
                          {product.availability === 'in_stock' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              In Stock ({product.stockQuantity ?? 100})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Out of Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-slate-950/80 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Showing{' '}
              <span className="font-semibold text-slate-200">
                {filteredProducts.length === 0 ? 0 : (safePage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(safePage * itemsPerPage, filteredProducts.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-200">{filteredProducts.length}</span>{' '}
              products
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                Page {safePage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
