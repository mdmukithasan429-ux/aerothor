import React, { useState, useEffect } from 'react';
import { TopBar, WorkspaceTab } from './components/TopBar';
import { StoreLandingPage } from './components/StoreLandingPage';
import { GmcFeedWorkspace } from './components/GmcFeedWorkspace';
import { CsvUploadWorkspace } from './components/CsvUploadWorkspace';
import { NextJsCodeWorkspace } from './components/NextJsCodeWorkspace';
import { CjSyncWorkspace } from './components/CjSyncWorkspace';
import { PMaxAuditWorkspace } from './components/PMaxAuditWorkspace';
import { AiChatWorkspace } from './components/AiChatWorkspace';
import { CreativeStudioWorkspace } from './components/CreativeStudioWorkspace';
import { AdminInventoryDashboard } from './components/AdminInventoryDashboard';
import { INITIAL_PRODUCTS } from './server/seed-data';
import { GmcProduct } from './lib/gmc-feed';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('storefront');
  const [products, setProducts] = useState<GmcProduct[]>(INITIAL_PRODUCTS);

  useEffect(() => {
    // Keep client storefront strictly synced with persisted backend database
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.warn('[Product Hydration Non-Fatal]:', err));
  }, []);

  const handleAddProduct = (newProduct: GmcProduct) => {
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
  };

  const handleUpdateProduct = (updated: GmcProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(console.warn);
  };

  const handleBatchUpdate = (updatedList: GmcProduct[]) => {
    setProducts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      updatedList.forEach((up) => map.set(up.id, up));
      return Array.from(map.values());
    });
  };

  const handleBatchDelete = (deletedSkus: string[]) => {
    const skuSet = new Set(deletedSkus.map((s) => s.toLowerCase()));
    setProducts((prev) => prev.filter((p) => !skuSet.has(p.id.toLowerCase())));
    fetch('/api/admin/products', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer aero_secret_adm_994821',
      },
      body: JSON.stringify({ skus: deletedSkus }),
    }).catch(console.warn);
  };

  const handleIngestProducts = (newProducts: GmcProduct[], syncToBackend = true) => {
    setProducts((prev) => {
      const incomingIds = new Set(newProducts.map((np) => String(np.id || '').trim().toLowerCase()));
      const remaining = prev.filter((p) => !incomingIds.has(String(p.id || '').trim().toLowerCase()));
      const combined = [...newProducts, ...remaining];
      if (syncToBackend) {
        fetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: newProducts }),
        }).catch((err) => console.warn('[Backend Sync Non-Fatal]:', err));
      }
      return combined;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 3-Zone Top Navigation Contract */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        productCount={products.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'storefront' && (
          <StoreLandingPage
            products={products}
            onOpenFeed={() => setActiveTab('gmc_feed')}
          />
        )}

        {activeTab === 'admin_inventory' && (
          <AdminInventoryDashboard
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBatchUpdate={handleBatchUpdate}
            onBatchDelete={handleBatchDelete}
            onReplaceCatalog={(nextCatalog) => setProducts(nextCatalog)}
          />
        )}

        {activeTab === 'gmc_feed' && (
          <GmcFeedWorkspace
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'csv_upload' && (
          <CsvUploadWorkspace
            onIngestProducts={handleIngestProducts}
            currentProductCount={products.length}
          />
        )}

        {activeTab === 'nextjs_code' && <NextJsCodeWorkspace />}

        {activeTab === 'cj_sync' && (
          <CjSyncWorkspace
            catalogProducts={products}
            onIngestProducts={handleIngestProducts}
            onReplaceCatalog={(nextCatalog) => setProducts(nextCatalog)}
            onOpenStorefront={() => setActiveTab('storefront')}
          />
        )}

        {activeTab === 'pmax_audit' && <PMaxAuditWorkspace />}

        {activeTab === 'ai_chat' && <AiChatWorkspace />}

        {activeTab === 'creative_studio' && <CreativeStudioWorkspace />}
      </main>

      {/* Footer strictly compliant with GMC merchant transparency requirements */}
      <footer className="border-t border-slate-900 py-8 px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">
                AeroThor Commerce Inc. · USA &amp; UK Operations
              </p>
              <p className="text-[11px] text-slate-400">
                Registered Office: 1209 Orange St, Wilmington, DE 19801, USA · UK Entity: 71-75 Shelton St, Covent Garden, London WC2H 9JQ
              </p>
              <p className="text-[11px] text-slate-400">
                Support: support@aerothor.com · Mon–Fri 9am–6pm EST / GMT · Tel: +1 (800) 555-0199
              </p>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-emerald-400">
              <span>GMC Status: Fully Compliant</span>
              <span aria-hidden="true">·</span>
              <span>48h Domestic Dispatch</span>
            </div>
          </div>
          <div className="border-t border-slate-900/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>© 2026 AeroThor Commerce. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-slate-200 cursor-pointer">30-Day Return Policy</span>
              <span>·</span>
              <span className="hover:text-slate-200 cursor-pointer">Shipping &amp; Tax Terms</span>
              <span>·</span>
              <span className="hover:text-slate-200 cursor-pointer">Privacy &amp; Security</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
