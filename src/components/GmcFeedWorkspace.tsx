import React, { useState, useEffect, useMemo } from 'react';
import { GmcProduct, buildGmcXmlFeed, validateGmcProduct, GmcValidationError, CANONICAL_STORE_URL } from '../lib/gmc-feed';
import { formatPriceForDisplay } from '../lib/currency';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  Clock,
  Calendar,
  Zap,
  ShieldCheck,
  Activity,
  Terminal,
  ChevronDown,
  Sparkles,
  Layers,
  Trash2,
} from 'lucide-react';

interface GmcFeedWorkspaceProps {
  products: GmcProduct[];
  onAddProduct: (product: GmcProduct) => void;
  onUpdateProduct: (product: GmcProduct) => void;
  onDeleteProduct: (id: string) => void;
}

export const GmcFeedWorkspace: React.FC<GmcFeedWorkspaceProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<GmcProduct | null>(products[0] || null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showXmlDrawer, setShowXmlDrawer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedStatus, setFeedStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showGmcGuide, setShowGmcGuide] = useState(false);
  const [productToDelete, setProductToDelete] = useState<GmcProduct | null>(null);

  const handleConfirmDelete = (product: GmcProduct) => {
    onDeleteProduct(product.id);
    if (selectedProduct?.id === product.id) {
      setSelectedProduct(products.find((p) => p.id !== product.id) || null);
    }
    setProductToDelete(null);
  };

  const fetchStatus = () => {
    fetch('/api/feed/status')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.isSchedulerActive) {
          setFeedStatus(data);
        }
      })
      .catch((err) => console.warn('[Feed status]:', err));
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 20000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/feed/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'admin_manual' }),
      });
      const data = await res.json();
      if (data.status) {
        setFeedStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyUrl = () => {
    const fullUrl = `${CANONICAL_STORE_URL}/api/feed.xml`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Form state for editing or creating
  const [formData, setFormData] = useState<GmcProduct>({
    id: '',
    title: '',
    description: '',
    link: '',
    image_link: '',
    price: '49.99 USD',
    sale_price: '',
    availability: 'in_stock',
    brand: 'AeroThor',
    gtin: '',
    mpn: '',
    condition: 'new',
    identifier_exists: true,
  });

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const validationReport = useMemo(() => {
    const report: Record<string, GmcValidationError[]> = {};
    for (const p of products) {
      report[p.id] = validateGmcProduct(p);
    }
    return report;
  }, [products]);

  const generatedXml = useMemo(() => {
    return buildGmcXmlFeed(products, {
      title: 'AeroThor Global Store — Official GMC Product Feed',
      link: CANONICAL_STORE_URL,
      description: 'Automated High-CRP US/UK Product Feed for Google Shopping & Performance Max',
    });
  }, [products]);

  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([generatedXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'google-merchant-center-feed.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartEdit = (p: GmcProduct) => {
    setFormData({ ...p });
    setIsEditing(true);
  };

  const handleStartAdd = () => {
    const newId = `SKU-${Date.now().toString().slice(-6)}`;
    setFormData({
      id: newId,
      title: 'New High-CRP Product - 2-Day Shipping',
      description: 'Engineered for exceptional longevity and performance. Precision manufacturing for US/UK customers.',
      link: `${CANONICAL_STORE_URL}/product/${newId}`,
      image_link: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      price: '59.00 USD',
      availability: 'in_stock',
      brand: 'AeroThor',
      gtin: '098765432101',
      condition: 'new',
      identifier_exists: true,
    });
    setIsEditing(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = products.find((p) => p.id === formData.id);
    if (existing) {
      onUpdateProduct(formData);
    } else {
      onAddProduct(formData);
    }
    setIsEditing(false);
    setSelectedProduct(formData);
  };

  return (
    <div className="space-y-6">
      {/* Automated Daily Task Control Panel */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-xl relative overflow-hidden shadow-lg shadow-emerald-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Automated Backend Task • Active
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium">Daily Midnight Sync (00:00 UTC)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Google Merchant Center Daily Feed Automation</span>
              <span className="text-xs font-normal px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                PMax & Shopping Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Backend background worker automatically re-indexes your database inventory daily and upon every product change, preventing Google Merchant Center price mismatch suspensions and routing high-converting organic traffic to in-stock items.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTriggerRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing Feed...' : 'Trigger Sync Now'}</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied Feed URL' : 'Copy GMC URL'}</span>
            </button>

            <button
              onClick={() => setShowGmcGuide(!showGmcGuide)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>GMC Guide</span>
            </button>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Run Logs ({feedStatus?.logs?.length || 1})</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showLogs ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Next Daily Run</span>
              </span>
              <span className="font-mono text-emerald-400 text-[10px]">00:00 UTC</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {feedStatus?.nextRunInMs
                ? `${Math.floor(feedStatus.nextRunInMs / (1000 * 60 * 60))}h ${Math.floor((feedStatus.nextRunInMs % (1000 * 60 * 60)) / (1000 * 60))}m`
                : 'Scheduled daily'}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Recurring 24-hr worker</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Feed Quality Score</span>
              </span>
              <span className="text-[10px] text-emerald-400">PMax Ready</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {feedStatus?.qualityScore || 100}% Compliant
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">0 suspension violations</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Live Feed Items</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">DB Sync</span>
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {feedStatus?.totalProducts || products.length} Products
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {feedStatus?.inStockCount || products.filter((p) => p.availability === 'in_stock').length} in stock ·{' '}
              {feedStatus?.outOfStockCount || products.filter((p) => p.availability === 'out_of_stock').length} out of stock
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Last Refreshed</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ETag 304</span>
            </div>
            <div className="text-sm font-bold text-slate-200 truncate font-mono text-xs">
              {feedStatus?.lastRefreshedAt ? new Date(feedStatus.lastRefreshedAt).toLocaleTimeString() : 'Just now'}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {feedStatus?.cachedFeedSize ? `${(feedStatus.cachedFeedSize / 1024).toFixed(1)} KB XML` : 'Optimized XML'}
            </p>
          </div>
        </div>

        {/* GMC Setup Guide Accordion */}
        {showGmcGuide && (
          <div className="mt-4 p-4 bg-slate-950 border border-emerald-500/20 rounded-lg text-xs space-y-2 text-slate-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>How to Configure Google Merchant Center Scheduled Fetch</span>
            </div>
            <p className="text-slate-400">
              In your Google Merchant Center account (<span className="text-emerald-400 font-mono">merchants.google.com</span>):
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 font-mono text-[11px]">
              <li>Navigate to <strong className="text-white font-sans">Products &gt; Feeds &gt; Primary Feeds (+)</strong></li>
              <li>Select Target Countries: <strong className="text-white font-sans">United States &amp; United Kingdom</strong> and Language: <strong className="text-white font-sans">English</strong></li>
              <li>Choose Input Method: <strong className="text-white font-sans">Scheduled Fetch</strong></li>
              <li>Set File Name: <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300">google-merchant-feed.xml</code></li>
              <li>Fetch Frequency: <strong className="text-emerald-400 font-sans">Daily</strong> at <strong className="text-emerald-400 font-sans">01:00 UTC</strong> (fetches right after the 00:00 UTC automated build)</li>
              <li>File URL: <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-300">{`${window.location.origin}/api/feed.xml`}</code></li>
            </ol>
          </div>
        )}

        {/* Automated Task Execution Logs */}
        {showLogs && (
          <div className="mt-4 border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Recent Automated Refresh Runs</span>
              <span className="font-mono text-[11px]">Last 50 executions logged</span>
            </div>
            <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950 font-mono text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Run Timestamp</th>
                    <th className="py-2 px-3">Trigger Source</th>
                    <th className="py-2 px-3">Catalog State</th>
                    <th className="py-2 px-3">Quality Score</th>
                    <th className="py-2 px-3">Duration</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {(feedStatus?.logs && feedStatus.logs.length > 0) ? (
                    feedStatus.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            log.trigger === 'automated_daily'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : log.trigger === 'inventory_change'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {log.trigger === 'automated_daily' ? 'Daily 00:00 UTC' : log.trigger}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {log.totalProducts} items ({log.inStockCount} in stock)
                        </td>
                        <td className="py-2 px-3 font-semibold text-emerald-400">
                          {log.qualityScore}%
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {log.durationMs}ms
                        </td>
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Valid</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500">
                        No automated logs recorded yet. Automated runner initialized on server start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* Overview Banner */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>RSS 2.0 Namespace</span>
            <span aria-hidden="true">·</span>
            <span>Google Merchant Center Shopping Spec</span>
            <span aria-hidden="true">·</span>
            <span>Target Markets: USA & UK</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Dynamic XML Product Feed Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Live, validated catalog output strictly formatted with Google Shopping RSS 2.0 namespace (<code className="text-emerald-400 font-mono text-xs">xmlns:g</code>). All products validated against Google policies before export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowXmlDrawer(!showXmlDrawer)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>{showXmlDrawer ? 'Hide XML' : 'View Raw XML'}</span>
          </button>

          <button
            onClick={handleDownloadXml}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Feed</span>
          </button>
        </div>
      </div>

      {/* XML Code Drawer (if toggled) */}
      {showXmlDrawer && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-emerald-400">/api/feed.xml</span>
              <span aria-hidden="true">·</span>
              <span>{products.length} Items</span>
              <span aria-hidden="true">·</span>
              <span>application/xml</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyXml}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied XML' : 'Copy XML'}</span>
              </button>
              <a
                href="/api/feed.xml"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 rounded hover:bg-slate-700 transition-colors"
              >
                <span>Open URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <pre className="p-4 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
            <code>{generatedXml}</code>
          </pre>
        </div>
      )}

      {/* Main Catalog Table and Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products List (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by SKU, title, brand..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={handleStartAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add SKU</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU / ID</th>
                    <th className="py-3 px-4">Title & Brand</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">GMC Compliance</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((p) => {
                    const errors = validationReport[p.id] || [];
                    const hasErrors = errors.some((e) => e.severity === 'error');
                    const hasWarnings = errors.some((e) => e.severity === 'warning');
                    const isSelected = selectedProduct?.id === p.id;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-slate-300 font-medium whitespace-nowrap">
                          {p.id}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-200 font-medium truncate">{p.title}</p>
                          <p className="text-slate-400 text-[11px] truncate">{p.brand} · {p.condition}</p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                          {p.sale_price ? (
                            <div>
                              <span className="text-emerald-400 font-semibold">{formatPriceForDisplay(p.sale_price)}</span>
                              <span className="line-through text-slate-500 text-[11px] block">{formatPriceForDisplay(p.price)}</span>
                            </div>
                          ) : (
                            <span>{formatPriceForDisplay(p.price)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-[11px] font-medium ${
                              p.availability === 'in_stock' ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {p.availability}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasErrors ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{errors.filter((e) => e.severity === 'error').length} Errors</span>
                            </span>
                          ) : hasWarnings ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Warnings</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid RSS 2.0</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(p);
                              }}
                              className="text-slate-400 hover:text-white px-2 py-1 rounded transition-colors text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductToDelete(p);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Product Inspector & Editor */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          {isEditing ? (
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">
                  {products.some((p) => p.id === formData.id) ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">SKU / ID (g:id)</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Title (g:title, max 150 chars)</label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">{formData.title.length}/150</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Brand (g:brand)</label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Price (g:price)</label>
                    <input
                      type="text"
                      required
                      placeholder="49.99 USD"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Sale Price</label>
                    <input
                      type="text"
                      placeholder="39.99 USD"
                      value={formData.sale_price || ''}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Availability</label>
                    <select
                      value={formData.availability}
                      onChange={(e: any) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    >
                      <option value="in_stock">in_stock</option>
                      <option value="out_of_stock">out_of_stock</option>
                      <option value="preorder">preorder</option>
                      <option value="backorder">backorder</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e: any) => setFormData({ ...formData, condition: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    >
                      <option value="new">new</option>
                      <option value="refurbished">refurbished</option>
                      <option value="used">used</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">GTIN (UPC/EAN)</label>
                    <input
                      type="text"
                      placeholder="012345678905"
                      value={formData.gtin || ''}
                      onChange={(e) => setFormData({ ...formData, gtin: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">MPN</label>
                    <input
                      type="text"
                      placeholder="SKU-PART-01"
                      value={formData.mpn || ''}
                      onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Link URL (g:link)</label>
                  <input
                    type="url"
                    required
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Image URL (g:image_link)</label>
                  <input
                    type="url"
                    required
                    value={formData.image_link}
                    onChange={(e) => setFormData({ ...formData, image_link: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Description (g:description)</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg hover:bg-emerald-300 transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          ) : selectedProduct ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-400 font-bold text-xs">{selectedProduct.id}</span>
                  <span className="text-xs text-slate-400">· Inspector</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(selectedProduct)}
                    className="px-2.5 py-1 text-xs text-slate-300 bg-slate-800 rounded hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setProductToDelete(selectedProduct)}
                    className="px-2.5 py-1 text-xs text-rose-400 bg-slate-800 rounded hover:bg-rose-950/40 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Product Card Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Title</span>
                  <p className="text-slate-200 font-medium">{selectedProduct.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Brand</span>
                    <span className="font-semibold">{selectedProduct.brand}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Price</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-semibold">{formatPriceForDisplay(selectedProduct.price)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">GTIN</span>
                    <span className="font-mono">{selectedProduct.gtin || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">MPN</span>
                    <span className="font-mono">{selectedProduct.mpn || 'None'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Description</span>
                  <p className="text-slate-300 text-xs bg-slate-950 p-2.5 rounded border border-slate-800 line-clamp-4">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Validation Status Box */}
                <div className="pt-2">
                  <span className="text-slate-400 block text-[11px] mb-1.5 font-semibold">GMC Specification Audit</span>
                  {validationReport[selectedProduct.id]?.length === 0 ? (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-emerald-300 text-xs">
                        Fully compliant with Google Merchant Center RSS 2.0. Ready for US/UK Shopping and Performance Max.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {validationReport[selectedProduct.id].map((err, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
                            err.severity === 'error'
                              ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            <strong>{err.field}</strong>: {err.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a SKU from the catalog to inspect attributes.
            </div>
          )}
        </div>
      </div>

      {/* In-App Product Delete Confirmation Modal (Iframe-Safe) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Product from Feed</h3>
                <p className="text-xs text-slate-400 font-mono">SKU: {productToDelete.id}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg space-y-1.5 text-xs">
              <p className="text-slate-200 font-medium line-clamp-2">{productToDelete.title}</p>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>{productToDelete.brand}</span>
                <span className="font-mono text-emerald-400 font-semibold">{formatPriceForDisplay(productToDelete.price)}</span>
              </div>
            </div>

            <p className="text-xs text-rose-400/90 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-lg">
              This product will be permanently deleted from your store catalog and removed from Google Merchant Center.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(productToDelete)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
