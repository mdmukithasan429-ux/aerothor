import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GmcProduct } from '../lib/gmc-feed';
import {
  buildDefaultSeoTitle,
  buildDefaultSeoDescription,
  resolveProductSeoTitle,
  resolveProductSeoDescription,
  generateProductPageMetadata,
  applyProductMetadataToDocumentHead,
} from '../lib/seo-metadata';
import {
  GA_MEASUREMENT_ID,
  Ga4TrackedEventLog,
  subscribeToGa4Events,
  sendGa4VerificationPing,
} from '../lib/analytics';
import {
  Shield,
  Key,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  Package,
  Layers,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Tag,
  Truck,
  Database,
  Terminal,
  Globe,
  Sparkles,
  Activity,
  FileCode,
} from 'lucide-react';

interface AdminInventoryDashboardProps {
  products: GmcProduct[];
  onAddProduct: (product: GmcProduct) => void;
  onUpdateProduct: (product: GmcProduct) => void;
  onDeleteProduct: (id: string) => void;
  onBatchUpdate?: (updatedProducts: GmcProduct[]) => void;
  onBatchDelete?: (deletedIds: string[]) => void;
  onReplaceCatalog?: (nextCatalog: GmcProduct[]) => void;
}

interface ServerLog {
  id: string;
  timestamp: string;
  method: 'POST' | 'PATCH' | 'DELETE' | 'GET';
  endpoint: string;
  status: number;
  message: string;
}

export const AdminInventoryDashboard: React.FC<AdminInventoryDashboardProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBatchUpdate,
  onBatchDelete,
  onReplaceCatalog,
}) => {
  // Authentication & Bearer Token State
  const [adminToken, setAdminToken] = useState('aero_secret_adm_994821');
  const [showToken, setShowToken] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title-asc' | 'price-asc' | 'price-desc' | 'sku'>('newest');

  // Selection for Batch Operations
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<GmcProduct | null>(null);
  const [isBatchPriceModalOpen, setIsBatchPriceModalOpen] = useState(false);
  const [batchPriceAdjustment, setBatchPriceAdjustment] = useState<number>(10); // default +10%
  const [viewingPdpProduct, setViewingPdpProduct] = useState<GmcProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<GmcProduct | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Form State for Add Product
  const [newProductForm, setNewProductForm] = useState({
    sku: '',
    title: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
    price: '49.99',
    salePrice: '',
    brand: 'AeroCommerce',
    mainImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    stockQuantity: 99,
    availability: 'in_stock' as 'in_stock' | 'out_of_stock',
    condition: 'new' as 'new' | 'refurbished' | 'used',
    gtin: '',
    mpn: '',
  });

  // Dedicated SEO Meta Editor Section State
  const seoSectionRef = useRef<HTMLDivElement | null>(null);
  const [selectedSeoProductId, setSelectedSeoProductId] = useState<string>(() => products[0]?.id || '');
  const [seoFilterMode, setSeoFilterMode] = useState<'all' | 'custom' | 'default'>('all');
  const [seoTitleInput, setSeoTitleInput] = useState<string>('');
  const [seoDescriptionInput, setSeoDescriptionInput] = useState<string>('');
  const [seoPreviewTab, setSeoPreviewTab] = useState<'serp' | 'head' | 'jsonld'>('serp');
  const [isSavingSeo, setIsSavingSeo] = useState<boolean>(false);

  // Google Analytics 4 Live Event Stream
  const [ga4Events, setGa4Events] = useState<Ga4TrackedEventLog[]>([]);

  useEffect(() => {
    return subscribeToGa4Events((events) => {
      setGa4Events(events);
    });
  }, []);

  const selectedSeoProduct = useMemo(() => {
    return products.find((p) => p.id === selectedSeoProductId) || products[0] || null;
  }, [products, selectedSeoProductId]);

  useEffect(() => {
    if (selectedSeoProduct) {
      if (selectedSeoProduct.id !== selectedSeoProductId) {
        setSelectedSeoProductId(selectedSeoProduct.id);
      }
      setSeoTitleInput(selectedSeoProduct.seo_title || buildDefaultSeoTitle(selectedSeoProduct));
      setSeoDescriptionInput(
        selectedSeoProduct.seo_description || buildDefaultSeoDescription(selectedSeoProduct)
      );
    }
  }, [selectedSeoProduct?.id, selectedSeoProduct?.seo_title, selectedSeoProduct?.seo_description]);

  // UI Feedback & Logs
  const [logs, setLogs] = useState<ServerLog[]>([
    {
      id: 'init',
      timestamp: new Date().toLocaleTimeString(),
      method: 'GET',
      endpoint: '/api/products',
      status: 200,
      message: `Initial sync complete. Loaded ${products.length} catalog items.`,
    },
  ]);
  const [isOperating, setIsOperating] = useState(false);
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addLog = (method: ServerLog['method'], endpoint: string, status: number, message: string) => {
    const newEntry: ServerLog = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      endpoint,
      status,
      message,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 19)]);
  };

  // Unique Brands list
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Text match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            p.title.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            (p.mpn && p.mpn.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Availability match
        if (availabilityFilter !== 'all' && p.availability !== availabilityFilter) {
          return false;
        }

        // Brand match
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return 0; // preserve catalog order (newly synced CJ items first)
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '') || '0');
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '') || '0');

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'sku') return a.id.localeCompare(b.id);
        return a.title.localeCompare(b.title);
      });
  }, [products, searchQuery, availabilityFilter, selectedBrand, sortBy]);

  // Statistics
  const inStockCount = useMemo(() => products.filter((p) => p.availability === 'in_stock').length, [products]);
  const outOfStockCount = useMemo(() => products.filter((p) => p.availability === 'out_of_stock').length, [products]);
  const catalogValuation = useMemo(() => {
    return products.reduce((acc, p) => {
      const val = parseFloat(p.price.replace(/[^0-9.]/g, '') || '0');
      return acc + val;
    }, 0);
  }, [products]);

  // Selection Handlers
  const handleToggleSelect = (sku: string) => {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSkus.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleCopySku = (sku: string) => {
    navigator.clipboard.writeText(sku);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1500);
  };

  // ---------------------------------------------------------------------------
  // CRUD API Handlers (Invoking /api/admin/products with Bearer Auth)
  // ---------------------------------------------------------------------------

  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.title.trim() || !newProductForm.price) {
      showToast('Title and Price are mandatory', 'error');
      return;
    }

    setIsOperating(true);
    const generatedSku = newProductForm.sku.trim() || `AERO-${Date.now().toString().slice(-6)}`;

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({
          sku: generatedSku,
          title: newProductForm.title.trim(),
          description: newProductForm.description.trim() || newProductForm.title.trim(),
          price: parseFloat(newProductForm.price),
          salePrice: newProductForm.salePrice ? parseFloat(newProductForm.salePrice) : null,
          brand: newProductForm.brand.trim(),
          mainImageUrl: newProductForm.mainImageUrl.trim(),
          stockQuantity: newProductForm.stockQuantity,
          availability: newProductForm.availability,
          condition: newProductForm.condition,
          gtin: newProductForm.gtin.trim() || undefined,
          mpn: newProductForm.mpn.trim() || generatedSku,
          seoTitle: newProductForm.seoTitle.trim() || undefined,
          seoDescription: newProductForm.seoDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      addLog('POST', '/api/admin/products', res.status, data.message || (res.ok ? 'Product added' : data.error));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      onAddProduct(data.product);
      showToast(`Product ${data.product.id} created & synced to GMC feed!`);
      setIsAddModalOpen(false);
      setNewProductForm({
        sku: '',
        title: '',
        description: '',
        seoTitle: '',
        seoDescription: '',
        price: '49.99',
        salePrice: '',
        brand: 'AeroCommerce',
        mainImageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        stockQuantity: 99,
        availability: 'in_stock',
        condition: 'new',
        gtin: '',
        mpn: '',
      });
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleQuickAvailabilityToggle = async (product: GmcProduct) => {
    const nextStatus = product.availability === 'in_stock' ? 'out_of_stock' : 'in_stock';
    setIsOperating(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({
          sku: product.id,
          availability: nextStatus,
        }),
      });

      const data = await res.json();
      addLog('PATCH', '/api/admin/products', res.status, `${product.id} availability set to ${nextStatus}`);

      if (!res.ok) throw new Error(data.error || 'Failed to update availability');

      onUpdateProduct(data.product);
      showToast(`${product.id} marked as ${nextStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleSingleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsOperating(true);
    try {
      const rawPriceNum = parseFloat(editingProduct.price.replace(/[^0-9.]/g, ''));
      const rawSaleNum = editingProduct.sale_price ? parseFloat(editingProduct.sale_price.replace(/[^0-9.]/g, '')) : null;

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({
          sku: editingProduct.id,
          title: editingProduct.title,
          description: editingProduct.description,
          price: rawPriceNum,
          salePrice: rawSaleNum,
          availability: editingProduct.availability,
          seoTitle: editingProduct.seo_title ?? '',
          seoDescription: editingProduct.seo_description ?? '',
        }),
      });

      const data = await res.json();
      addLog('PATCH', '/api/admin/products', res.status, data.message || 'Updated product');

      if (!res.ok) throw new Error(data.error || 'Failed to update product');

      onUpdateProduct(data.product);
      if (selectedSeoProduct?.id === data.product.id) {
        applyProductMetadataToDocumentHead(data.product);
      }
      showToast(`Product ${data.product.id} updated successfully!`);
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleSaveProductSeo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSeoProduct) return;

    const trimmedTitle = seoTitleInput.trim();
    const trimmedDesc = seoDescriptionInput.trim();
    if (!trimmedTitle || !trimmedDesc) {
      showToast('Both SEO Meta Title and Meta Description are required.', 'error');
      return;
    }

    setIsSavingSeo(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({
          sku: selectedSeoProduct.id,
          seoTitle: trimmedTitle,
          seoDescription: trimmedDesc,
        }),
      });

      const data = await res.json();
      addLog(
        'PATCH',
        '/api/admin/products (SEO)',
        res.status,
        `Updated SEO meta title & description for ${selectedSeoProduct.id}`
      );

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product SEO metadata');
      }

      const updatedProduct: GmcProduct = data.product || {
        ...selectedSeoProduct,
        seo_title: trimmedTitle,
        seo_description: trimmedDesc,
      };

      onUpdateProduct(updatedProduct);
      applyProductMetadataToDocumentHead(updatedProduct);
      showToast(`Saved SEO metadata for ${updatedProduct.id} & updated live page <head>!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingSeo(false);
    }
  };

  const handleBulkAutoOptimizeSeo = async () => {
    const targetList =
      selectedSkus.size > 0
        ? products.filter((p) => selectedSkus.has(p.id))
        : products.slice(0, 50);

    if (targetList.length === 0) return;
    setIsSavingSeo(true);

    const itemsPayload = targetList.map((p) => ({
      sku: p.id,
      seoTitle: p.seo_title?.trim() || buildDefaultSeoTitle(p),
      seoDescription: p.seo_description?.trim() || buildDefaultSeoDescription(p),
    }));

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({ items: itemsPayload }),
      });

      const data = await res.json();
      addLog(
        'PATCH',
        '/api/admin/products (bulk SEO)',
        res.status,
        `Auto-optimized SEO metadata for ${itemsPayload.length} products`
      );

      if (!res.ok) throw new Error(data.error || 'Bulk SEO update failed');

      const updatedList: GmcProduct[] = targetList.map((p) => ({
        ...p,
        seo_title: p.seo_title?.trim() || buildDefaultSeoTitle(p),
        seo_description: p.seo_description?.trim() || buildDefaultSeoDescription(p),
      }));

      if (onBatchUpdate) {
        onBatchUpdate(updatedList);
      } else {
        updatedList.forEach((up) => onUpdateProduct(up));
      }

      showToast(`Generated & persisted SEO meta titles and descriptions for ${updatedList.length} products!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingSeo(false);
    }
  };

  const customSeoCount = useMemo(
    () => products.filter((p) => Boolean(p.seo_title?.trim() || p.seo_description?.trim())).length,
    [products]
  );

  const seoSelectableProducts = useMemo(() => {
    return products.filter((p) => {
      const hasCustom = Boolean(p.seo_title?.trim() || p.seo_description?.trim());
      if (seoFilterMode === 'custom') return hasCustom;
      if (seoFilterMode === 'default') return !hasCustom;
      return true;
    });
  }, [products, seoFilterMode]);

  const livePreviewProduct = useMemo<GmcProduct | null>(() => {
    if (!selectedSeoProduct) return null;
    return {
      ...selectedSeoProduct,
      seo_title: seoTitleInput.trim() || buildDefaultSeoTitle(selectedSeoProduct),
      seo_description: seoDescriptionInput.trim() || buildDefaultSeoDescription(selectedSeoProduct),
    };
  }, [selectedSeoProduct, seoTitleInput, seoDescriptionInput]);

  const liveGeneratedMeta = useMemo(() => {
    if (!livePreviewProduct) return null;
    return generateProductPageMetadata(livePreviewProduct);
  }, [livePreviewProduct]);

  const executeSingleDelete = async (sku: string) => {
    setIsOperating(true);
    try {
      const res = await fetch(`/api/admin/products?sku=${encodeURIComponent(sku)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken.trim()}`,
        },
      });

      const data = await res.json();
      addLog('DELETE', `/api/admin/products?sku=${sku}`, res.status, data.message || 'Product deleted');

      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      onDeleteProduct(sku);
      setSelectedSkus((prev) => {
        const next = new Set(prev);
        next.delete(sku);
        return next;
      });
      showToast(`Product ${sku} permanently deleted.`);
      setProductToDelete(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // BATCH Operations Handlers
  // ---------------------------------------------------------------------------

  const executeBatchDelete = async () => {
    if (selectedSkus.size === 0) return;
    const count = selectedSkus.size;
    setIsOperating(true);
    const skusList = Array.from(selectedSkus);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({ skus: skusList }),
      });

      const data = await res.json();
      addLog('DELETE', '/api/admin/products (batch)', res.status, `Batch deleted ${count} products`);

      if (!res.ok) throw new Error(data.error || 'Batch deletion failed');

      if (onBatchDelete) {
        onBatchDelete(skusList);
      } else {
        skusList.forEach((sku) => onDeleteProduct(sku));
      }

      setSelectedSkus(new Set());
      showToast(`Successfully deleted ${count} products.`);
      setIsBatchDeleteModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleBatchAvailabilityChange = async (targetStatus: 'in_stock' | 'out_of_stock') => {
    if (selectedSkus.size === 0) return;
    setIsOperating(true);
    const skusList = Array.from(selectedSkus);

    const batchPayload = skusList.map((sku) => ({
      sku,
      availability: targetStatus,
    }));

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({ items: batchPayload }),
      });

      const data = await res.json();
      addLog('PATCH', '/api/admin/products (batch status)', res.status, `Set ${skusList.length} items to ${targetStatus}`);

      if (!res.ok) throw new Error(data.error || 'Batch update failed');

      // Update state locally
      skusList.forEach((sku) => {
        const existing = products.find((p) => p.id === sku);
        if (existing) {
          onUpdateProduct({ ...existing, availability: targetStatus });
        }
      });

      showToast(`Marked ${skusList.length} products as ${targetStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}.`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleBatchPriceApply = async () => {
    if (selectedSkus.size === 0) return;
    setIsOperating(true);
    const skusList = Array.from(selectedSkus);
    const multiplier = 1 + batchPriceAdjustment / 100;

    const batchPayload = skusList.map((sku) => {
      const p = products.find((item) => item.id === sku);
      const currentVal = parseFloat(p?.price.replace(/[^0-9.]/g, '') || '20.00');
      const newVal = Math.max(0.99, Number((currentVal * multiplier).toFixed(2)));
      return {
        sku,
        price: newVal,
      };
    });

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({ items: batchPayload }),
      });

      const data = await res.json();
      addLog('PATCH', '/api/admin/products (batch price)', res.status, `Adjusted prices by ${batchPriceAdjustment}% for ${skusList.length} items`);

      if (!res.ok) throw new Error(data.error || 'Batch price update failed');

      batchPayload.forEach((item) => {
        const existing = products.find((p) => p.id === item.sku);
        if (existing) {
          onUpdateProduct({
            ...existing,
            price: `${item.price.toFixed(2)} USD`,
          });
        }
      });

      showToast(`Adjusted prices for ${skusList.length} products by ${batchPriceAdjustment > 0 ? '+' : ''}${batchPriceAdjustment}%.`);
      setIsBatchPriceModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const [isFeedSyncing, setIsFeedSyncing] = useState(false);
  const [isBulkSyncing1000, setIsBulkSyncing1000] = useState(false);
  const [bulkSyncStats, setBulkSyncStats] = useState<{
    pagesFetched: number;
    pageSize: number;
    totalFetched: number;
    insertedCount: number;
    skippedDuplicatesCount: number;
    totalCatalogCount: number;
  } | null>(null);

  const handleBulkSync1000Cj = async () => {
    setIsBulkSyncing1000(true);
    try {
      const res = await fetch('/api/admin/sync-cj', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({
          pages: 20,
          pageSize: 50,
          targetCount: 1000,
          markupMultiplier: 2.5,
          brand: 'AeroCommerce',
          countryCode: 'US',
        }),
      });
      const data = await res.json();
      addLog(
        'POST',
        '/api/admin/sync-cj',
        res.status,
        data.message || (res.ok ? '1,000 products synced' : data.error)
      );

      if (!res.ok) {
        throw new Error(data.error || '1,000-product CJ bulk sync failed');
      }

      if (data.stats) {
        setBulkSyncStats(data.stats);
      }
      if (Array.isArray(data.products) && onReplaceCatalog) {
        onReplaceCatalog(data.products);
      }
      showToast(
        `Synced 1,000 CJ Products (20 pages × 50): +${data.stats?.insertedCount ?? data.insertedOrUpdated} unique SKUs saved!`
      );
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsBulkSyncing1000(false);
    }
  };

  const handleSyncFeed = async () => {
    setIsFeedSyncing(true);
    try {
      const res = await fetch('/api/feed/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken.trim()}`,
        },
        body: JSON.stringify({ trigger: 'admin_manual' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh feed');
      addLog('POST', '/api/feed/refresh', res.status, `GMC feed auto-refreshed: ${data.log?.totalProducts || products.length} items`);
      showToast('GMC XML feed synchronized successfully with latest inventory!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsFeedSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-rose-950 text-rose-300 border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Bearer Security Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Inventory Console</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>app/api/admin/products</span>
              <span aria-hidden="true">·</span>
              <span>Batch CRUD Operations</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>PostgreSQL / Persistent Disk Active</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Inventory &amp; Product Batch Manager
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBulkSync1000Cj}
              disabled={isBulkSyncing1000}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 border border-indigo-500 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
              title="Loop 20 pages × 50 items from CJ Dropshipping API and save 1,000 products with skipDuplicates: true"
            >
              <Database className={`w-3.5 h-3.5 text-indigo-200 ${isBulkSyncing1000 ? 'animate-bounce' : ''}`} />
              <span>{isBulkSyncing1000 ? 'Syncing 20 Pages (1,000 Items)...' : '1,000-Product CJ Bulk Sync'}</span>
            </button>

            <button
              onClick={handleSyncFeed}
              disabled={isFeedSyncing}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Synchronize Google Merchant Center XML feed with current database inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isFeedSyncing ? 'animate-spin' : ''}`} />
              <span>{isFeedSyncing ? 'Syncing...' : 'Sync Feed'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>

            <a
              href="/api/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <span>View Feed</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>

        {bulkSyncStats && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">
                1,000-Product CJ Pagination Complete ({bulkSyncStats.pagesFetched} pages × {bulkSyncStats.pageSize} items)
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>Scanned: <strong className="text-white">{bulkSyncStats.totalFetched}</strong></span>
              <span>Inserted (Unique): <strong className="text-emerald-400">+{bulkSyncStats.insertedCount}</strong></span>
              <span>Skipped Duplicates: <strong className="text-amber-300">{bulkSyncStats.skippedDuplicatesCount}</strong></span>
              <span>Total Persisted DB: <strong className="text-white">{bulkSyncStats.totalCatalogCount}</strong></span>
            </div>
          </div>
        )}

        {/* Security Bearer Token Configuration Strip */}
        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-200">Admin Secret Key (Bearer Token):</span>
            <div className="relative flex items-center">
              <input
                type={showToken ? 'text' : 'password'}
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 w-52 sm:w-64"
                placeholder="ADMIN_SECRET_KEY"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 text-slate-400 hover:text-slate-200"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authorization header verified on every mutation</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Catalog Products</p>
          <p className="text-2xl font-extrabold text-white">{products.length}</p>
          <p className="text-[11px] text-slate-500">Live in GMC RSS 2.0</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <p className="text-xs text-slate-400 font-medium">In Stock (Active)</p>
          <p className="text-2xl font-extrabold text-emerald-400">{inStockCount}</p>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
            <div
              className="bg-emerald-400 h-1 rounded-full"
              style={{ width: `${products.length ? (inStockCount / products.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <p className="text-xs text-slate-400 font-medium">Out of Stock</p>
          <p className="text-2xl font-extrabold text-rose-400">{outOfStockCount}</p>
          <p className="text-[11px] text-slate-500">Auto-flagged in Google Feed</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <p className="text-xs text-slate-400 font-medium">Total Retail Valuation</p>
          <p className="text-2xl font-extrabold text-white font-mono">${catalogValuation.toFixed(2)}</p>
          <p className="text-[11px] text-emerald-400">Average: ${(catalogValuation / (products.length || 1)).toFixed(2)}</p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* PRODUCT SEO META TITLES & DESCRIPTIONS EDITOR + LIVE METADATA PREVIEW */}
      {/* --------------------------------------------------------------------- */}
      <div
        ref={seoSectionRef}
        id="admin-seo-editor"
        className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Globe className="w-3.5 h-3.5" />
                <span>Product SEO Metadata Studio</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Dynamic &lt;head&gt; &amp; Schema.org Sync</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-300">
                Custom Configured: <strong className="text-emerald-400">{customSeoCount}</strong> / {products.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              SEO Meta Title &amp; Description Editor
            </h3>
            <p className="text-xs text-slate-400">
              Customize <code className="text-emerald-300 font-mono">seo_title</code> and{' '}
              <code className="text-emerald-300 font-mono">seo_description</code> for each product. Changes persist to the database and immediately update generated product page <code className="text-slate-300 font-mono">&lt;title&gt;</code>, OpenGraph, Twitter Card, and Schema.org <code className="text-slate-300 font-mono">Product</code> JSON-LD metadata.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBulkAutoOptimizeSeo}
              disabled={isSavingSeo}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Generate and save optimal SEO meta titles and descriptions for selected or top 50 products"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {selectedSkus.size > 0
                  ? `Auto-Optimize Selected (${selectedSkus.size})`
                  : 'Bulk Auto-Optimize Catalog SEO'}
              </span>
            </button>

            {livePreviewProduct && (
              <button
                type="button"
                onClick={() => {
                  applyProductMetadataToDocumentHead(livePreviewProduct);
                  showToast(`Applied ${livePreviewProduct.id} SEO metadata to active browser <head>!`);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Sync to Active Page &lt;head&gt;</span>
              </button>
            )}
          </div>
        </div>

        {selectedSeoProduct && liveGeneratedMeta ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Product Selector & SEO Meta Inputs */}
            <form onSubmit={handleSaveProductSeo} className="lg:col-span-6 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold text-slate-300">
                    Select Product to Edit SEO Metadata
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    {(['all', 'custom', 'default'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSeoFilterMode(mode)}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          seoFilterMode === mode
                            ? 'bg-slate-800 text-emerald-400 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'all'
                          ? `All (${products.length})`
                          : mode === 'custom'
                          ? `Custom (${customSeoCount})`
                          : `Default (${products.length - customSeoCount})`}
                      </button>
                    ))}
                  </div>
                </div>

                <select
                  value={selectedSeoProduct.id}
                  onChange={(e) => setSelectedSeoProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans"
                >
                  {(seoSelectableProducts.length > 0 ? seoSelectableProducts : products)
                    .slice(0, 250)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.id}] {p.title.slice(0, 75)} {p.seo_title ? '✓ Custom SEO' : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Selected Product Mini Bar */}
              <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={selectedSeoProduct.image_link}
                    alt={selectedSeoProduct.title}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                    onError={(e: any) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{selectedSeoProduct.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      SKU: {selectedSeoProduct.id} · {selectedSeoProduct.sale_price || selectedSeoProduct.price}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                  {selectedSeoProduct.seo_title ? 'Custom SEO Active' : 'Default Template'}
                </span>
              </div>

              {/* SEO Meta Title Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    SEO Meta Title (<code className="text-emerald-400 font-mono">seo_title</code>)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSeoTitleInput(buildDefaultSeoTitle(selectedSeoProduct))}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate Optimal Title</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={seoTitleInput}
                  onChange={(e) => setSeoTitleInput(e.target.value)}
                  placeholder="e.g. Grade 1 Titanium Vacuum Travel Flask — $44.99 | AeroThor"
                  maxLength={120}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Optimal Google SERP length: <strong className="text-slate-300">30–60 characters</strong>
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      seoTitleInput.trim().length >= 30 && seoTitleInput.trim().length <= 60
                        ? 'text-emerald-400'
                        : seoTitleInput.trim().length > 60
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {seoTitleInput.trim().length} / 60 chars
                  </span>
                </div>
              </div>

              {/* SEO Meta Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">
                    SEO Meta Description (<code className="text-emerald-400 font-mono">seo_description</code>)
                  </label>
                  <button
                    type="button"
                    onClick={() => setSeoDescriptionInput(buildDefaultSeoDescription(selectedSeoProduct))}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate Optimal Description</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={seoDescriptionInput}
                  onChange={(e) => setSeoDescriptionInput(e.target.value)}
                  placeholder="Compelling 120–160 character summary with US/UK shipping SLA and primary value proposition..."
                  maxLength={320}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Optimal Google SERP length: <strong className="text-slate-300">120–160 characters</strong>
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      seoDescriptionInput.trim().length >= 120 && seoDescriptionInput.trim().length <= 160
                        ? 'text-emerald-400'
                        : seoDescriptionInput.trim().length > 160
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {seoDescriptionInput.trim().length} / 160 chars
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSeoTitleInput(buildDefaultSeoTitle(selectedSeoProduct));
                    setSeoDescriptionInput(buildDefaultSeoDescription(selectedSeoProduct));
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Reset to Default Template
                </button>

                <button
                  type="submit"
                  disabled={isSavingSeo}
                  className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingSeo ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingSeo ? 'Saving SEO Metadata...' : 'Save Product SEO Metadata'}</span>
                </button>
              </div>
            </form>

            {/* Right Column: Live SERP & Generated Product Page Metadata Inspector */}
            <div className="lg:col-span-6 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">
                  Generated Product Page Metadata Preview
                </span>
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSeoPreviewTab('serp')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      seoPreviewTab === 'serp'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Google SERP &amp; OG
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeoPreviewTab('head')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      seoPreviewTab === 'head'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    HTML &lt;head&gt; Tags
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeoPreviewTab('jsonld')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      seoPreviewTab === 'jsonld'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Schema.org JSON-LD
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {seoPreviewTab === 'serp' && (
                  <div className="space-y-4">
                    {/* Google Search Snippet Card */}
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                          A
                        </span>
                        <div className="truncate">
                          <span className="text-slate-200 font-medium">AeroThor Official Store</span>
                          <span className="mx-1.5">›</span>
                          <span className="font-mono text-slate-400">{liveGeneratedMeta.canonicalUrl}</span>
                        </div>
                      </div>
                      <h4 className="text-base font-semibold text-sky-400 hover:underline leading-snug line-clamp-1">
                        {liveGeneratedMeta.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                        <span className="text-amber-400">★★★★★ 4.9</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">
                          {selectedSeoProduct.sale_price || selectedSeoProduct.price}
                        </span>
                        <span>·</span>
                        <span>
                          {selectedSeoProduct.availability === 'in_stock' ? 'In stock' : 'Out of stock'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {liveGeneratedMeta.description}
                      </p>
                    </div>

                    {/* Social OpenGraph / Twitter Card Preview */}
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 flex items-center gap-3 p-3">
                      <img
                        src={liveGeneratedMeta.openGraph.image}
                        alt={liveGeneratedMeta.openGraph.title}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                        onError={(e: any) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div className="min-w-0 space-y-0.5 text-xs">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                          OpenGraph &amp; Twitter Card (summary_large_image)
                        </p>
                        <p className="font-bold text-white truncate">{liveGeneratedMeta.openGraph.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {liveGeneratedMeta.openGraph.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {seoPreviewTab === 'head' && (
                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-60">
{`<title>${liveGeneratedMeta.title}</title>
<meta name="description" content="${liveGeneratedMeta.description.replace(/"/g, '&quot;')}" />
<link rel="canonical" href="${liveGeneratedMeta.canonicalUrl}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${liveGeneratedMeta.openGraph.title.replace(/"/g, '&quot;')}" />
<meta property="og:description" content="${liveGeneratedMeta.openGraph.description.replace(/"/g, '&quot;')}" />
<meta property="og:url" content="${liveGeneratedMeta.openGraph.url}" />
<meta property="og:image" content="${liveGeneratedMeta.openGraph.image}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${liveGeneratedMeta.twitter.title.replace(/"/g, '&quot;')}" />
<meta name="twitter:description" content="${liveGeneratedMeta.twitter.description.replace(/"/g, '&quot;')}" />`}
                  </pre>
                )}

                {seoPreviewTab === 'jsonld' && (
                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed max-h-60">
                    {JSON.stringify(liveGeneratedMeta.jsonLd, null, 2)}
                  </pre>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>API Endpoint: /api/products/{selectedSeoProduct.id}/metadata</span>
                  <span className="text-emerald-400">Synced with Storefront PDP</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* GOOGLE ANALYTICS 4 (G-0KS0T13HQ7) LIVE DATA COLLECTION CONSOLE        */}
      {/* --------------------------------------------------------------------- */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Google Analytics 4 (gtag.js) Data Stream Active</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className="font-mono text-emerald-400 font-semibold">{GA_MEASUREMENT_ID}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Automatically collects <code className="text-slate-300 font-mono">page_view</code>,{' '}
              <code className="text-slate-300 font-mono">view_item</code>,{' '}
              <code className="text-slate-300 font-mono">add_to_cart</code>,{' '}
              <code className="text-slate-300 font-mono">begin_checkout</code>,{' '}
              <code className="text-slate-300 font-mono">purchase</code>, and{' '}
              <code className="text-slate-300 font-mono">search</code> events into Measurement ID{' '}
              <strong className="text-white font-mono">{GA_MEASUREMENT_ID}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sendGa4VerificationPing();
              showToast(`Dispatched live GA4 verification ping to ${GA_MEASUREMENT_ID}!`);
            }}
            className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Send Test Ping to {GA_MEASUREMENT_ID}</span>
          </button>
        </div>

        {ga4Events.length > 0 && (
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 font-mono text-[11px] max-h-28 overflow-y-auto space-y-1">
            {ga4Events.slice(0, 8).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-2 text-slate-300">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500">[{ev.timestamp}]</span>
                  <span className="text-emerald-400 font-semibold">{ev.eventName}</span>
                  <span className="truncate text-slate-300">{ev.summary}</span>
                </div>
                <span className="text-slate-500 shrink-0">{ev.measurementId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by SKU, Product Title, Brand, or MPN..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Availability Filter */}
            <select
              value={availabilityFilter}
              onChange={(e: any) => setAvailabilityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Availability</option>
              <option value="in_stock">In Stock ({inStockCount})</option>
              <option value="out_of_stock">Out of Stock ({outOfStockCount})</option>
            </select>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">Sort: Newest / CJ Synced First</option>
              <option value="title-asc">Sort: Title (A-Z)</option>
              <option value="price-asc">Sort: Price (Low → High)</option>
              <option value="price-desc">Sort: Price (High → Low)</option>
              <option value="sku">Sort: SKU Identifier</option>
            </select>
          </div>
        </div>

        {/* Batch Operations Ribbon (Appears when items are selected) */}
        {selectedSkus.size > 0 && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white">{selectedSkus.size} products selected</span>
              <span className="text-slate-400">· Ready for batch mutation</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleBatchAvailabilityChange('in_stock')}
                disabled={isOperating}
                className="px-2.5 py-1 bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded hover:bg-emerald-800 transition-colors font-medium text-[11px]"
              >
                Mark In Stock
              </button>

              <button
                onClick={() => handleBatchAvailabilityChange('out_of_stock')}
                disabled={isOperating}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded hover:bg-slate-700 transition-colors font-medium text-[11px]"
              >
                Mark Out of Stock
              </button>

              <button
                onClick={() => setIsBatchPriceModalOpen(true)}
                disabled={isOperating}
                className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded hover:bg-slate-700 transition-colors font-medium text-[11px] flex items-center gap-1"
              >
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span>Adjust Prices</span>
              </button>

              <button
                onClick={() => setIsBatchDeleteModalOpen(true)}
                disabled={isOperating}
                className="px-2.5 py-1 bg-rose-950/80 text-rose-300 border border-rose-800 rounded hover:bg-rose-900 transition-colors font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected ({selectedSkus.size})</span>
              </button>

              <button
                onClick={() => setSelectedSkus(new Set())}
                className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[11px]"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedSkus.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Product &amp; Image</th>
                <th className="p-3.5">SKU / ID</th>
                <th className="p-3.5">Brand</th>
                <th className="p-3.5">Price (Retail / Sale)</th>
                <th className="p-3.5">GMC Availability</th>
                <th className="p-3.5">Identifiers</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No products matching search criteria &quot;{searchQuery}&quot;.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedSkus.has(p.id);
                  const isStock = p.availability === 'in_stock';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(p.id)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Product & Image */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3 max-w-sm">
                          <img
                            src={p.image_link}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[240px] text-xs">
                              {p.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                              {p.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU / ID */}
                      <td className="p-3.5 font-mono text-[11px]">
                        <button
                          onClick={() => handleCopySku(p.id)}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 group"
                          title="Copy SKU"
                        >
                          <span>{p.id}</span>
                          {copiedSku === p.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Brand */}
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
                          {p.brand}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="p-3.5 font-mono">
                        <div>
                          <span className="font-bold text-white">{p.price}</span>
                          {p.sale_price && (
                            <div className="text-[10px] text-emerald-400 font-medium">
                              Sale: {p.sale_price}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* GMC Availability Toggle Button */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleQuickAvailabilityToggle(p)}
                          disabled={isOperating}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            isStock
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                              : 'bg-rose-950/80 text-rose-400 border-rose-800 hover:bg-rose-900'
                          }`}
                          title="Click to toggle availability in Google Merchant Center feed"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isStock ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span>{isStock ? 'in_stock' : 'out_of_stock'}</span>
                        </button>
                      </td>

                      {/* Identifiers */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        <div>MPN: {p.mpn || p.id}</div>
                        {p.gtin && <div className="text-emerald-400">GTIN: {p.gtin}</div>}
                        <div className="mt-0.5 text-[10px]">
                          SEO:{' '}
                          <span className={p.seo_title ? 'text-emerald-400' : 'text-slate-400'}>
                            {p.seo_title ? 'Custom Meta' : 'Auto Template'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedSeoProductId(p.id);
                              seoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="px-2 py-1 text-[11px] font-mono text-emerald-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                            title="Edit SEO Meta Title & Description for this product"
                          >
                            SEO
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Edit Product (PATCH)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Delete Product (DELETE)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{filteredProducts.length}</strong> of{' '}
            <strong className="text-white">{products.length}</strong> products
          </div>
          <div className="font-mono text-[11px]">
            Google Merchant Center Feed: <span className="text-emerald-400">Synchronized</span>
          </div>
        </div>
      </div>

      {/* Live Server Logs Drawer */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Admin API Activity Log (`app/api/admin/products`)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Last 20 mutations</span>
        </div>

        <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1 border border-slate-800/60">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-2">
              <span className="text-slate-500">[{log.timestamp}]</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  log.method === 'POST'
                    ? 'bg-emerald-950 text-emerald-400'
                    : log.method === 'PATCH'
                    ? 'bg-amber-950 text-amber-400'
                    : log.method === 'DELETE'
                    ? 'bg-rose-950 text-rose-400'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {log.method}
              </span>
              <span className="text-slate-400">{log.endpoint}</span>
              <span className={log.status < 300 ? 'text-emerald-400' : 'text-rose-400'}>
                {log.status}
              </span>
              <span className="text-slate-300 truncate">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* ADD PRODUCT MODAL                                                     */}
      {/* --------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Add Product to Inventory (GMC Compliant)</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleAdd} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">SKU (Identifier)</label>
                  <input
                    type="text"
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    placeholder="e.g. AERO-FLASK-750"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500">Leave blank to auto-generate</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product Title (GMC Max 150 chars)</label>
                <input
                  type="text"
                  value={newProductForm.title}
                  onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                  placeholder="e.g. AeroTitanium 750ml Vacuum Travel Flask - Midnight Black"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  maxLength={150}
                  required
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Front-load with brand, material, and color for Google Shopping algorithms</span>
                  <span>{newProductForm.title.length}/150</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description (Google Shopping Spec)</label>
                <textarea
                  rows={3}
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  placeholder="Describe material composition, dimensions, and domestic shipping SLA..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Retail Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.price}
                    onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sale Price ($ USD, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProductForm.salePrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, salePrice: e.target.value })}
                    placeholder="e.g. 39.99"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Availability</label>
                  <select
                    value={newProductForm.availability}
                    onChange={(e: any) => setNewProductForm({ ...newProductForm, availability: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Main Image URL (HTTPS White/Neutral Background)</label>
                <input
                  type="url"
                  value={newProductForm.mainImageUrl}
                  onChange={(e) => setNewProductForm({ ...newProductForm, mainImageUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOperating}
                  className="px-5 py-2 bg-emerald-400 text-slate-950 font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isOperating ? 'Creating...' : 'Save & Publish to GMC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* EDIT PRODUCT MODAL (PATCH)                                            */}
      {/* --------------------------------------------------------------------- */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Edit Product: {editingProduct.id}</h3>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleEditSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Product Title</label>
                <input
                  type="text"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Retail Price ($ USD)</label>
                  <input
                    type="text"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Sale Price ($ USD)</label>
                  <input
                    type="text"
                    value={editingProduct.sale_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: e.target.value || undefined })}
                    placeholder="e.g. 34.99 USD"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Availability Status</label>
                <select
                  value={editingProduct.availability}
                  onChange={(e: any) => setEditingProduct({ ...editingProduct, availability: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="in_stock">in_stock (Active in Shopping Ads)</option>
                  <option value="out_of_stock">out_of_stock (Paused in Shopping Ads)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>SEO Meta Title &amp; Description</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        seo_title: buildDefaultSeoTitle(editingProduct),
                        seo_description: buildDefaultSeoDescription(editingProduct),
                      })
                    }
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Auto-Fill Optimal SEO
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    SEO Meta Title (30–60 chars optimal)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.seo_title ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seo_title: e.target.value })}
                    placeholder={buildDefaultSeoTitle(editingProduct)}
                    maxLength={120}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    SEO Meta Description (120–160 chars optimal)
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.seo_description ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seo_description: e.target.value })}
                    placeholder={buildDefaultSeoDescription(editingProduct)}
                    maxLength={320}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOperating}
                  className="px-5 py-2 bg-emerald-400 text-slate-950 font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isOperating ? 'Updating...' : 'Save Changes (PATCH)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* BATCH PRICE ADJUSTMENT MODAL                                          */}
      {/* --------------------------------------------------------------------- */}
      {isBatchPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Batch Price Adjustment</h3>
              </div>
              <button
                onClick={() => setIsBatchPriceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-300">
                Adjust retail prices for all <strong className="text-emerald-400">{selectedSkus.size} selected products</strong> simultaneously:
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Percentage Change (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={batchPriceAdjustment}
                    onChange={(e) => setBatchPriceAdjustment(Number(e.target.value))}
                    className="w-32 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBatchPriceAdjustment(10)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchPriceAdjustment(20)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                    >
                      +20%
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchPriceAdjustment(-10)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                    >
                      -10%
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-400">
                Example: A $50.00 product will become{' '}
                <strong className="text-emerald-400 font-mono">
                  ${(50 * (1 + batchPriceAdjustment / 100)).toFixed(2)} USD
                </strong>.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchPriceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBatchPriceApply}
                  disabled={isOperating}
                  className="px-5 py-2 bg-emerald-400 text-slate-950 font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isOperating ? 'Applying...' : 'Apply Batch Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Single Product Deletion Modal (Iframe-Safe) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Product</h3>
                <p className="text-xs text-slate-400 font-mono">SKU: {productToDelete.id}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-2 text-xs">
              <p className="text-slate-200 font-medium line-clamp-2">{productToDelete.title}</p>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Brand: {productToDelete.brand}</span>
                <span className="font-mono text-emerald-400 font-semibold">{productToDelete.price}</span>
              </div>
            </div>

            <p className="text-xs text-rose-400/90 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
              Permanently removes this product from store inventory and the Google Merchant Center XML feed immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isOperating}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeSingleDelete(productToDelete.id)}
                disabled={isOperating}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isOperating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Batch Product Deletion Modal (Iframe-Safe) */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batch Delete Selected</h3>
                <p className="text-xs text-slate-400">{selectedSkus.size} items selected</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete all <strong className="text-white">{selectedSkus.size} selected products</strong> from your catalog?
            </p>

            <p className="text-xs text-rose-400/90 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
              All selected SKUs will be purged from the live database and the Google Merchant Center shopping feed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                disabled={isOperating}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBatchDelete}
                disabled={isOperating}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isOperating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete {selectedSkus.size} Items</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
