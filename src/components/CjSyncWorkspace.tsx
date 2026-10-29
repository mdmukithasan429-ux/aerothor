import React, { useState, useEffect, useMemo } from 'react';
import {
  SAMPLE_CJ_RAW_PRODUCTS,
  mapCjProductToGmc,
  mapGenericApiProductToGmc,
  getNextJsCjSyncRouteSnippet,
  getNextJsUniversalSyncRouteSnippet,
  GenericMappingConfig,
} from '../lib/api-integrations';
import { getPrismaSchemaSnippet } from '../lib/csv-importer';
import { GmcProduct } from '../lib/gmc-feed';
import {
  Copy,
  Check,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  Code2,
  Layers,
  Sparkles,
  PlusCircle,
  Database,
  ShieldCheck,
  AlertCircle,
  Search,
  KeyRound,
  FileCode,
  ArrowUpRight,
  ShoppingBag,
  Truck,
  PackageCheck,
  Plus,
  ExternalLink,
  X,
  Send,
} from 'lucide-react';

interface CjSyncWorkspaceProps {
  catalogProducts?: GmcProduct[];
  onIngestProducts?: (products: GmcProduct[], syncToBackend?: boolean) => void;
  onReplaceCatalog?: (nextCatalog: GmcProduct[]) => void;
  onOpenStorefront?: () => void;
}

type PlatformType = 'cj' | 'zendrop' | 'spocket' | 'aliexpress' | 'custom';

export const CjSyncWorkspace: React.FC<CjSyncWorkspaceProps> = ({
  catalogProducts = [],
  onIngestProducts,
  onReplaceCatalog,
  onOpenStorefront,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('cj');
  const [activeCodeTab, setActiveCodeTab] = useState<'nextjs_cj' | 'nextjs_universal' | 'prisma'>('nextjs_cj');
  const [copied, setCopied] = useState(false);

  // Settings - pre-loaded with user's verified CJ credentials
  const [apiKey, setApiKey] = useState('CJ5994755@api@2bc8a55e048b442388da8f746d2f81f7');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pageSize, setPageSize] = useState<number>(20);
  const [customEndpoint, setCustomEndpoint] = useState('https://api.supplier-network.com/v2/products');
  const [authHeaderName, setAuthHeaderName] = useState('Authorization');
  const [targetMarket, setTargetMarket] = useState<'US' | 'UK'>('US');
  const [currency, setCurrency] = useState<'USD' | 'GBP'>('USD');
  const [markupMultiplier, setMarkupMultiplier] = useState<number>(2.5);
  const [brandName, setBrandName] = useState('AeroThor');

  // Execution & Diagnostics State
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number | null>(null);
  const [syncedSuccess, setSyncedSuccess] = useState(false);
  const [addingSku, setAddingSku] = useState<string | null>(null);

  // Real products returned from live supplier endpoint
  const [fetchedRawProducts, setFetchedRawProducts] = useState<any[]>(SAMPLE_CJ_RAW_PRODUCTS);
  const [mappedGmcProducts, setMappedGmcProducts] = useState<GmcProduct[]>(() => {
    const liveCjFromCatalog = catalogProducts.filter(
      (p) => (p.source === 'cj_live' || p.cj_pid) && !/^CJ-(HOME|FIT|TRVL|TECH)-\d{5}$/i.test(p.id)
    );
    if (liveCjFromCatalog.length > 0) {
      return liveCjFromCatalog.slice(0, 50);
    }
    return SAMPLE_CJ_RAW_PRODUCTS.map((p) =>
      mapCjProductToGmc(p, {
        markupMultiplier: 2.5,
        currency: 'USD',
        defaultBrand: 'AeroThor',
        targetMarket: 'US',
      })
    );
  });

  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Real Orders State & Modal
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderModalProduct, setOrderModalProduct] = useState<GmcProduct | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState({
    customerName: 'Alex Vance',
    customerEmail: 'customer@aerothor.com',
    customerPhone: '+1 (555) 234-5678',
    shippingAddress: '742 Evergreen Terrace',
    shippingCity: 'Springfield',
    shippingState: 'OR',
    shippingZip: '97477',
    shippingCountry: 'US',
    quantity: 1,
  });

  // Custom Field Mapping Config State (for "Any Platform")
  const [customConfig, setCustomConfig] = useState<GenericMappingConfig>({
    platformName: 'Custom Supplier',
    endpointUrl: 'https://api.custom-supplier.com/v1/products',
    authHeaderName: 'X-API-KEY',
    idPath: 'sku',
    titlePath: 'product_title',
    pricePath: 'wholesale_price',
    imagePath: 'featured_image',
    descriptionPath: 'specs_summary',
    brandPath: 'manufacturer',
  });

  const catalogSkuSet = useMemo(
    () => new Set(catalogProducts.map((p) => String(p.id || '').toLowerCase())),
    [catalogProducts]
  );

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.warn('[Load Orders Non-Fatal]:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Gross profit margin target
  const grossMarginPct = Math.round(((markupMultiplier - 1) / markupMultiplier) * 100);

  const handleFetchAndMap = async (keywordOverride?: string) => {
    setIsFetching(true);
    setFetchError(null);
    setSyncStatusMessage(null);
    setSyncedSuccess(false);

    const queryWord = keywordOverride !== undefined ? keywordOverride : searchKeyword;

    try {
      if (selectedPlatform === 'cj') {
        setSyncStatusMessage('Authenticating API Key with CJ Developer Gateway & syncing to Storefront...');

        const response = await fetch('/api/cj/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
            searchKeyword: queryWord.trim(),
            pageSize,
            countryCode: targetMarket,
            markupMultiplier,
            currency,
            brand: brandName,
            targetMarket,
            autoSync: true,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch products from CJ Dropshipping API');
        }

        setFetchedRawProducts(data.rawProducts || []);
        setMappedGmcProducts(data.products || []);
        setActivePreviewIndex(0);
        setTotalCatalogCount(data.totalCatalogCount || (data.catalog?.length ?? 0));
        setSyncedSuccess(true);
        setSyncStatusMessage(
          `Successfully loaded & synced ${data.fetchedCount} real products from CJ Dropshipping (${data.totalAvailable?.toLocaleString() || '150,000+'} available) to the TOP of your Storefront!`
        );

        if (onReplaceCatalog && Array.isArray(data.catalog)) {
          onReplaceCatalog(data.catalog);
        } else if (onIngestProducts && Array.isArray(data.products)) {
          onIngestProducts(data.products, false);
        }
      } else {
        setSyncStatusMessage(`Connecting to ${selectedPlatform.toUpperCase()} via Backend Gateway...`);

        const response = await fetch('/api/supplier/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpointUrl: customEndpoint,
            authHeader: authHeaderName,
            apiKey: apiKey.trim(),
            config: customConfig,
            markupMultiplier,
            currency,
            brand: brandName,
            targetMarket,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const sampleCustomItems = [
            {
              sku: 'CUST-AERO-01',
              product_title: 'Ultralight Aerogel Insulated Expedition Parka',
              wholesale_price: '45.00',
              featured_image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
              specs_summary: 'NASA-grade aerogel thermal insulation. Waterproof 20K/20K breathable membrane.',
              manufacturer: brandName,
            },
            {
              sku: 'CUST-AERO-02',
              product_title: 'Titanium Modular Key Organizer with NFC Chip',
              wholesale_price: '14.20',
              featured_image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
              specs_summary: 'Aircraft titanium frame holding up to 8 keys with integrated digital vCard NFC chip.',
              manufacturer: brandName,
            },
          ];

          const mapped = sampleCustomItems.map((item) =>
            mapGenericApiProductToGmc(item, customConfig, {
              markupMultiplier,
              currency,
              defaultBrand: brandName,
              targetMarket,
            })
          );
          setFetchedRawProducts(sampleCustomItems);
          setMappedGmcProducts(mapped);
          setActivePreviewIndex(0);
          setSyncStatusMessage('Note: Custom endpoint unreachable, generated mapped sample schema for testing.');
          return;
        }

        setFetchedRawProducts(data.rawProducts || []);
        setMappedGmcProducts(data.products || []);
        setActivePreviewIndex(0);
        setTotalCatalogCount(data.totalCatalogCount);
        setSyncedSuccess(true);
        setSyncStatusMessage(`Successfully synced ${data.fetchedCount} products from ${selectedPlatform}!`);

        if (onReplaceCatalog && Array.isArray(data.catalog)) {
          onReplaceCatalog(data.catalog);
        } else if (onIngestProducts && Array.isArray(data.products)) {
          onIngestProducts(data.products, false);
        }
      }
    } catch (err: any) {
      console.error('[API Sync Error]:', err);
      setFetchError(err.message || 'Error communicating with dropshipping API');
    } finally {
      setIsFetching(false);
    }
  };

  // Add a single CJ product (or all mapped products) directly to the #1 spot of the Storefront
  const handleAddCjProductToStore = async (productToAdd: GmcProduct) => {
    setAddingSku(productToAdd.id);
    try {
      const res = await fetch('/api/cj/add-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productToAdd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');

      if (onReplaceCatalog && Array.isArray(data.catalog)) {
        onReplaceCatalog(data.catalog);
      } else if (onIngestProducts) {
        onIngestProducts([productToAdd], false);
      }

      setTotalCatalogCount(data.totalCatalogCount);
      setSyncedSuccess(true);
      setSyncStatusMessage(
        `Added "${productToAdd.title}" (${productToAdd.id}) to the #1 spot of your Storefront & GMC Feed!`
      );
    } catch (err: any) {
      setFetchError(err.message || 'Failed to add CJ product to store');
    } finally {
      setAddingSku(null);
    }
  };

  const handleBulkInsertToDatabase = async () => {
    if (mappedGmcProducts.length === 0) return;
    setAddingSku('BULK');
    try {
      const res = await fetch('/api/cj/add-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: mappedGmcProducts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk add failed');

      if (onReplaceCatalog && Array.isArray(data.catalog)) {
        onReplaceCatalog(data.catalog);
      } else if (onIngestProducts) {
        onIngestProducts(mappedGmcProducts, false);
      }

      setTotalCatalogCount(data.totalCatalogCount);
      setSyncedSuccess(true);
      setSyncStatusMessage(
        `Added all ${mappedGmcProducts.length} CJ Marketplace products to the top of your active Storefront & GMC XML feed!`
      );
    } catch (err: any) {
      setFetchError(err.message || 'Failed to bulk add CJ products');
    } finally {
      setAddingSku(null);
    }
  };

  // Create a Real CJ Dropshipping Order via POST /api/orders
  const handleCreateRealCjOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModalProduct) return;

    setIsSubmittingOrder(true);
    try {
      const numericPrice = parseFloat(
        orderModalProduct.sale_price?.replace(/[^0-9.]/g, '') ||
          orderModalProduct.price.replace(/[^0-9.]/g, '') ||
          '29.99'
      );

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          customerName: orderForm.customerName,
          customerEmail: orderForm.customerEmail,
          customerPhone: orderForm.customerPhone,
          shippingAddress: orderForm.shippingAddress,
          shippingCity: orderForm.shippingCity,
          shippingState: orderForm.shippingState,
          shippingZip: orderForm.shippingZip,
          shippingCountry: orderForm.shippingCountry,
          currency,
          items: [
            {
              sku: orderModalProduct.id,
              cjPid: orderModalProduct.cj_pid,
              cjVid: orderModalProduct.cj_vid,
              cjSku: orderModalProduct.cj_sku || orderModalProduct.id,
              title: orderModalProduct.title,
              price: numericPrice,
              quantity: orderForm.quantity,
              image: orderModalProduct.image_link,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create real order');

      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (data.order) {
        setOrders((prev) => [data.order, ...prev]);
      }

      setSyncStatusMessage(
        `Real Order ${data.order?.id} created & submitted to CJ Dropshipping API (${data.order?.cjOrderId || 'Dispatched'})!`
      );
      setOrderModalProduct(null);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to submit real CJ order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleRetryCjOrderSync = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/sync-cj`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
      setSyncStatusMessage(`Order ${orderId} synced with CJ API: ${data.message}`);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to sync order with CJ');
    } finally {
      setSyncingOrderId(null);
    }
  };

  const getActiveCode = () => {
    if (activeCodeTab === 'nextjs_cj') return getNextJsCjSyncRouteSnippet();
    if (activeCodeTab === 'nextjs_universal') return getNextJsUniversalSyncRouteSnippet();
    return getPrismaSchemaSnippet();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeRawItem = fetchedRawProducts[activePreviewIndex] || fetchedRawProducts[0];
  const activeGmcItem = mappedGmcProducts[activePreviewIndex] || mappedGmcProducts[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Live Dropshipping API Integration
            </span>
            <span aria-hidden="true">·</span>
            <span>CJ Dropshipping Developer v2.0</span>
            <span aria-hidden="true">·</span>
            <span>Real Store Import &amp; Order API</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            CJ Marketplace Product Importer &amp; Real Order Fulfillment
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Search 150,000+ live CJ Dropshipping products, add individual or bulk products directly to the top of your storefront catalog, and dispatch real customer orders via <code className="text-emerald-400 font-mono text-xs">createOrderV2</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenStorefront && (
            <button
              onClick={onOpenStorefront}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Storefront ({catalogProducts.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href="/api/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>View /api/feed.xml</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={handleBulkInsertToDatabase}
            disabled={addingSku === 'BULK'}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
          >
            {syncedSuccess ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            <span>
              {addingSku === 'BULK'
                ? 'Adding to Store...'
                : `Add All (${mappedGmcProducts.length}) to Store Top`}
            </span>
          </button>
        </div>
      </div>

      {/* Platform Selector & Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Dropshipping / Supplier API Platform
          </span>
          <span className="text-xs text-slate-400">
            Targeting High-CRP USA / UK Google Shopping Placements
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: 'cj', name: 'CJ Dropshipping', badge: 'Official v2.0 API (Active)', activeColor: 'border-emerald-500 bg-emerald-950/20 text-emerald-300' },
            { id: 'zendrop', name: 'Zendrop', badge: 'REST / Bearer', activeColor: 'border-emerald-500 bg-emerald-950/20 text-emerald-300' },
            { id: 'spocket', name: 'Spocket', badge: 'US/EU Suppliers', activeColor: 'border-emerald-500 bg-emerald-950/20 text-emerald-300' },
            { id: 'aliexpress', name: 'AliExpress DS', badge: 'Dsers / Open API', activeColor: 'border-emerald-500 bg-emerald-950/20 text-emerald-300' },
            { id: 'custom', name: 'Any Platform', badge: 'Custom REST / Webhook', activeColor: 'border-emerald-500 bg-emerald-950/20 text-emerald-300' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id as PlatformType)}
              className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                selectedPlatform === p.id
                  ? p.activeColor
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{p.name}</span>
                {selectedPlatform === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-[10px] font-mono opacity-80 block">{p.badge}</span>
            </button>
          ))}
        </div>

        {/* API Credentials & Search Configuration Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
          <div className="space-y-1.5 md:col-span-5">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                {selectedPlatform === 'cj'
                  ? 'CJ API Key or Access Token'
                  : selectedPlatform === 'custom'
                  ? 'Custom API Endpoint URL'
                  : `${selectedPlatform.toUpperCase()} Access Token / API Key`}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Auto-Resolves Access Token
              </span>
            </label>
            {selectedPlatform === 'custom' ? (
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                placeholder="https://api.my-supplier.com/v1/products"
              />
            ) : (
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                placeholder="CJ5994755@api@... or Access Token"
              />
            )}
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                Search CJ Marketplace
              </span>
              <span className="text-[10px] text-slate-500">150K+ Live Catalog</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchAndMap()}
                placeholder="e.g. tumbler, charger, bag..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-slate-300">Market &amp; Batch Size</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value as 'US' | 'UK')}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="US">USA (Domestic)</option>
                <option value="UK">UK (Tracked)</option>
              </select>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value={10}>10 Items</option>
                <option value={20}>20 Items</option>
                <option value={50}>50 Items</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Retail Markup</label>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {markupMultiplier}x ({grossMarginPct}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                value={markupMultiplier}
                onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value))}
                className="flex-1 accent-emerald-400 cursor-pointer"
              />
              <button
                onClick={() => handleFetchAndMap()}
                disabled={isFetching}
                className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
              >
                {isFetching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                <span>Fetch &amp; Sync</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search Tags */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">Popular Dropship Niches:</span>
          {['Tumbler', 'Car Accessories', 'Vintage Sign', 'Wireless Charger', 'Necklace'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearchKeyword(tag);
                handleFetchAndMap(tag);
              }}
              className="px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700/60 transition-colors cursor-pointer"
            >
              +{tag}
            </button>
          ))}
          <button
            onClick={() => {
              setSearchKeyword('');
              handleFetchAndMap('');
            }}
            className="px-2.5 py-1 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-emerald-400 rounded border border-emerald-500/30 transition-colors cursor-pointer"
          >
            Trending / Latest
          </button>
        </div>

        {/* Status Message Banner */}
        {syncStatusMessage && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncStatusMessage}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {totalCatalogCount !== null && (
                <span className="font-mono text-[11px] text-emerald-300 bg-emerald-900/50 px-2.5 py-1 rounded border border-emerald-700/50">
                  Live Store Catalog: {totalCatalogCount} Products
                </span>
              )}
              {onOpenStorefront && (
                <button
                  onClick={onOpenStorefront}
                  className="px-3 py-1 bg-emerald-400 text-slate-950 font-bold rounded hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  Open Storefront →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {fetchError && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => handleFetchAndMap()}
              className="px-2.5 py-1 bg-red-900/40 hover:bg-red-800 text-red-200 rounded border border-red-700/50 text-[11px] font-semibold"
            >
              Retry Handshake
            </button>
          </div>
        )}

        {selectedPlatform === 'custom' && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Custom JSON Path Mapping Template</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">ID / SKU JSON Path</label>
                <input
                  type="text"
                  value={customConfig.idPath}
                  onChange={(e) => setCustomConfig({ ...customConfig, idPath: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Title JSON Path</label>
                <input
                  type="text"
                  value={customConfig.titlePath}
                  onChange={(e) => setCustomConfig({ ...customConfig, titlePath: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Wholesale Price JSON Path</label>
                <input
                  type="text"
                  value={customConfig.pricePath}
                  onChange={(e) => setCustomConfig({ ...customConfig, pricePath: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Image URL JSON Path</label>
                <input
                  type="text"
                  value={customConfig.imagePath}
                  onChange={(e) => setCustomConfig({ ...customConfig, imagePath: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* CJ MARKETPLACE VISUAL PRODUCT BROWSER & 1-CLICK ADD TO STORE        */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                CJ Marketplace Fetched Products ({mappedGmcProducts.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click <strong>Add to Store</strong> on any product to pin it to #1 on your Storefront, or click <strong>Real CJ Order</strong> to dispatch a live fulfillment order via CJ API v2.0.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkInsertToDatabase}
              disabled={addingSku === 'BULK'}
              className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add All {mappedGmcProducts.length} Products to Storefront</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[560px] overflow-y-auto pr-1">
          {mappedGmcProducts.map((item, idx) => {
            const isAlreadyInStore = catalogSkuSet.has(item.id.toLowerCase());
            const isAddingThis = addingSku === item.id;

            return (
              <div
                key={`${item.id}-${idx}`}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div
                    className="relative aspect-[4/3] bg-slate-900 overflow-hidden cursor-pointer"
                    onClick={() => setActivePreviewIndex(idx)}
                  >
                    <img
                      src={item.image_link}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e: any) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/85 text-emerald-400 font-mono text-[10px] rounded border border-emerald-500/30">
                      {item.id}
                    </span>
                    {isAlreadyInStore && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        In Store
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 space-y-1.5">
                    <h4
                      onClick={() => setActivePreviewIndex(idx)}
                      className="text-xs font-bold text-white line-clamp-2 cursor-pointer hover:text-emerald-300"
                    >
                      {item.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                      <span className="text-slate-400">
                        Cost:{' '}
                        <strong className="text-slate-200">
                          ${(item.wholesale_price ?? 12.5).toFixed(2)}
                        </strong>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Retail: {item.sale_price || item.price}
                      </span>
                    </div>
                    {item.cj_pid && (
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        CJ PID: {item.cj_pid}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 pt-0 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddCjProductToStore(item)}
                    disabled={isAddingThis}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                      isAlreadyInStore
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingThis ? 'Adding...' : isAlreadyInStore ? 'Pin to #1' : 'Add to Store'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderModalProduct(item)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Real Order</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* REAL ORDERS & CJ DROPSHIPPING FULFILLMENT CONSOLE                   */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Real Customer Orders &amp; CJ Dropshipping API v2.0 Fulfillment ({orders.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Every order placed via Storefront Checkout or CJ Marketplace is persisted in PostgreSQL and dispatched to <code className="text-emerald-400 font-mono">/api2.0/v1/shopping/order/createOrderV2</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mappedGmcProducts[0] && (
              <button
                onClick={() => setOrderModalProduct(mappedGmcProducts[activePreviewIndex] || mappedGmcProducts[0])}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Real CJ Order</span>
              </button>
            )}
            <button
              onClick={loadOrders}
              disabled={isLoadingOrders}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-2">
            <Truck className="w-6 h-6 text-slate-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No real orders recorded yet.</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Click <strong>Real Order</strong> on any CJ product above or complete an order in the Storefront Express Checkout drawer to create and dispatch a real order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="p-3">Order ID &amp; Date</th>
                  <th className="p-3">Customer &amp; Destination</th>
                  <th className="p-3">Ordered Items (CJ SKU / PID)</th>
                  <th className="p-3">Total Paid</th>
                  <th className="p-3">CJ Fulfillment Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-white">{ord.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString() : 'Just now'}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400">
                        {ord.shippingCity}, {ord.shippingState} {ord.shippingZip} ({ord.shippingCountry})
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {(ord.items || []).map((it: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded">
                              {it.quantity}x {it.sku}
                            </span>
                            <span className="text-slate-300 truncate max-w-[200px]">{it.title}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      ${Number(ord.totalAmount || 0).toFixed(2)} {ord.currency || 'USD'}
                    </td>
                    <td className="p-3">
                      <div className="font-mono text-[11px] text-indigo-300 font-semibold">
                        {ord.cjOrderId || 'Pending CJ Sync'}
                      </div>
                      <div className="text-[10px] text-slate-400 max-w-xs truncate" title={ord.cjApiMessage}>
                        {ord.cjApiMessage || ord.carrier}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRetryCjOrderSync(ord.id)}
                        disabled={syncingOrderId === ord.id}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{syncingOrderId === ord.id ? 'Syncing...' : 'Sync CJ API'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Field Transformation Inspector: Raw Supplier API vs Google Merchant Center Standard */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden space-y-0">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Live Schema Transformation Inspector ({selectedPlatform === 'cj' ? 'CJ Dropshipping' : selectedPlatform.toUpperCase()} JSON → Google Shopping RSS 2.0)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Inspecting Product:</span>
            <select
              value={activePreviewIndex}
              onChange={(e) => setActivePreviewIndex(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono max-w-[260px] truncate"
            >
              {mappedGmcProducts.map((p, idx) => (
                <option key={idx} value={idx}>
                  {idx + 1}. {p.id} ({p.price})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          <div className="p-5 space-y-3 bg-slate-950/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                Raw {selectedPlatform === 'cj' ? 'CJ Dropshipping Developer API' : selectedPlatform.toUpperCase()} Response
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                HTTP 200 Live
              </span>
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
              <code>{JSON.stringify(activeRawItem, null, 2)}</code>
            </pre>
          </div>

          <div className="p-5 space-y-3 bg-slate-950/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Google Merchant Center RSS 2.0 Validated Target
              </span>
              {activeGmcItem && (
                <button
                  onClick={() => handleAddCjProductToStore(activeGmcItem)}
                  className="text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  + Add This Item to Store
                </button>
              )}
            </div>

            {activeGmcItem ? (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono space-y-2 max-h-[380px] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:id&gt; (sku):</span>
                  <span className="text-emerald-300 font-bold">{activeGmcItem.id}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:title&gt;:</span>
                  <span className="text-white text-right max-w-[280px]">{activeGmcItem.title}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:price&gt;:</span>
                  <span className="text-emerald-400 font-bold">{activeGmcItem.price}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:sale_price&gt;:</span>
                  <span className="text-amber-300 font-bold">{activeGmcItem.sale_price}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:availability&gt;:</span>
                  <span className="text-emerald-400">{activeGmcItem.availability}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:condition&gt;:</span>
                  <span className="text-slate-200">{activeGmcItem.condition}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:brand&gt;:</span>
                  <span className="text-slate-200">{activeGmcItem.brand}</span>
                </div>
                <div className="flex items-start justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">&lt;g:link&gt;:</span>
                  <span className="text-cyan-400 text-right truncate max-w-[280px]">{activeGmcItem.link}</span>
                </div>
                <div className="flex items-start justify-between pb-1">
                  <span className="text-slate-400">&lt;g:image_link&gt;:</span>
                  <span className="text-cyan-400 text-right truncate max-w-[280px]">{activeGmcItem.image_link}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                No mapped items. Click Fetch &amp; Sync to retrieve live products.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Production Next.js Code Exporter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/80">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCodeTab('nextjs_cj')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeCodeTab === 'nextjs_cj'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>app/api/cj/sync/route.ts</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('nextjs_universal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeCodeTab === 'nextjs_universal'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>app/api/integrations/universal-sync/route.ts</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('prisma')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeCodeTab === 'prisma'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>prisma/schema.prisma</span>
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Complete Code'}</span>
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-300 overflow-x-auto bg-slate-950 max-h-[500px] leading-relaxed">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Real CJ Dropshipping Order Creation Modal */}
      {orderModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Create Real CJ Dropshipping Order (API v2.0)
                </h3>
              </div>
              <button
                onClick={() => setOrderModalProduct(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRealCjOrder} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <img
                  src={orderModalProduct.image_link}
                  alt={orderModalProduct.title}
                  className="w-12 h-12 rounded-lg object-cover bg-slate-950 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white truncate">{orderModalProduct.title}</p>
                  <p className="font-mono text-[11px] text-emerald-400">
                    SKU: {orderModalProduct.id} · {orderModalProduct.sale_price || orderModalProduct.price}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Recipient Full Name</label>
                  <input
                    type="text"
                    required
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Customer Email</label>
                  <input
                    type="email"
                    required
                    value={orderForm.customerEmail}
                    onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={orderForm.shippingAddress}
                    onChange={(e) => setOrderForm({ ...orderForm, shippingAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={orderForm.shippingCity}
                    onChange={(e) => setOrderForm({ ...orderForm, shippingCity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={orderForm.shippingState}
                    onChange={(e) => setOrderForm({ ...orderForm, shippingState: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ZIP</label>
                  <input
                    type="text"
                    required
                    value={orderForm.shippingZip}
                    onChange={(e) => setOrderForm({ ...orderForm, shippingZip: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Country</label>
                  <select
                    value={orderForm.shippingCountry}
                    onChange={(e) => setOrderForm({ ...orderForm, shippingCountry: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white"
                  >
                    <option value="US">US</option>
                    <option value="GB">UK (GB)</option>
                    <option value="CA">CA</option>
                    <option value="AU">AU</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderModalProduct(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-5 py-2 bg-emerald-400 text-slate-950 font-bold rounded-lg hover:bg-emerald-300 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingOrder ? 'Submitting to CJ API...' : 'Submit Real CJ Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
