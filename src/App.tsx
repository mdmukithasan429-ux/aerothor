import React, { useState, useEffect } from 'react';
import { TopBar, WorkspaceTab } from './components/TopBar';
import { StoreLandingPage } from './components/StoreLandingPage';
import { AffiliatesPage } from './components/AffiliatesPage';
import { OrderTrackingPage } from './components/OrderTrackingPage';
import { AdminOrdersManager } from './components/AdminOrdersManager';
import { GmcFeedWorkspace } from './components/GmcFeedWorkspace';
import { CsvUploadWorkspace } from './components/CsvUploadWorkspace';
import { NextJsCodeWorkspace } from './components/NextJsCodeWorkspace';
import { CjSyncWorkspace } from './components/CjSyncWorkspace';
import { PMaxAuditWorkspace } from './components/PMaxAuditWorkspace';
import { AiChatWorkspace } from './components/AiChatWorkspace';
import { CreativeStudioWorkspace } from './components/CreativeStudioWorkspace';
import { AdminInventoryDashboard } from './components/AdminInventoryDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ReturnPolicyView } from './components/ReturnPolicyView';
import { INITIAL_PRODUCTS } from './server/seed-data';
import { GmcProduct } from './lib/gmc-feed';
import { trackPageView } from './lib/analytics';
import {
  getAdminSession,
  clearAdminSession,
  getAdminAuthHeaders,
} from './lib/admin-auth';

function resolveInitialTabFromPath(): WorkspaceTab {
  if (typeof window === 'undefined') return 'storefront';
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/return-policy') return 'return_policy';
  if (pathname === '/affiliates' || pathname === '/deals') return 'affiliates';
  if (pathname === '/track-order') return 'track_order';
  if (pathname === '/admin/orders') return 'admin_orders';
  if (pathname === '/admin') return 'admin_inventory';
  return 'storefront';
}

function mapTabToPathname(tab: WorkspaceTab): string {
  switch (tab) {
    case 'storefront':
      return '/';
    case 'return_policy':
      return '/return-policy';
    case 'affiliates':
      return '/affiliates';
    case 'track_order':
      return '/track-order';
    case 'admin_inventory':
      return '/admin';
    case 'admin_orders':
      return '/admin/orders';
    default:
      return `/admin/${tab.replace(/_/g, '-')}`;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => resolveInitialTabFromPath());
  const [products, setProducts] = useState<GmcProduct[]>(INITIAL_PRODUCTS);
  const [externalCategory, setExternalCategory] = useState<string | null>(null);
  const [trackingQueryPrefill, setTrackingQueryPrefill] = useState<string>('');

  // Role-based Admin Authentication State (Default: Customer Mode for public visitors)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(
    () => getAdminSession().isAuthenticated
  );
  const [isCustomerPreviewMode, setIsCustomerPreviewMode] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [pendingAdminTab, setPendingAdminTab] = useState<WorkspaceTab | null>(null);

  // Sync browser URL path and GA4 page_view when activeTab changes
  useEffect(() => {
    const targetPath = mapTabToPathname(activeTab);
    try {
      if (window.location.pathname !== targetPath) {
        const search = activeTab === 'storefront' || activeTab === 'affiliates' || activeTab === 'track_order' ? window.location.search : '';
        window.history.pushState({}, '', `${targetPath}${search}`);
      }
    } catch {
      // ignore in restricted iframe contexts
    }
    trackPageView(targetPath, document.title);
  }, [activeTab]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const nextTab = resolveInitialTabFromPath();
      const isPublic = nextTab === 'storefront' || nextTab === 'affiliates' || nextTab === 'track_order';
      if (!isPublic && !getAdminSession().isAuthenticated) {
        setPendingAdminTab(nextTab);
        setIsAdminLoginModalOpen(true);
        setActiveTab('storefront');
      } else {
        setActiveTab(nextTab);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Verify existing admin session token against backend on boot & gate /admin routes
  useEffect(() => {
    const session = getAdminSession();
    const initialTab = resolveInitialTabFromPath();
    const isAdminRoute = initialTab !== 'storefront' && initialTab !== 'affiliates' && initialTab !== 'track_order';

    if (session.isAuthenticated && session.token) {
      fetch('/api/admin/auth/verify', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
        .then((res) => {
          if (!res.ok) {
            clearAdminSession();
            setIsAdminAuthenticated(false);
            if (isAdminRoute) {
              setPendingAdminTab(initialTab);
              setIsAdminLoginModalOpen(true);
              setActiveTab('storefront');
            }
          }
        })
        .catch(() => {
          // non-fatal offline fallback
        });
    } else if (isAdminRoute) {
      setPendingAdminTab(initialTab);
      setIsAdminLoginModalOpen(true);
      setActiveTab('storefront');
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === '1') {
        if (!session.isAuthenticated) {
          setPendingAdminTab('admin_inventory');
          setIsAdminLoginModalOpen(true);
        } else {
          setActiveTab('admin_inventory');
        }
      }
    } catch {
      // ignore
    }
  }, []);

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

  // Guard tab navigation: public storefront, tracking, affiliates, and return policy require no admin auth
  const handleProtectedTabChange = (nextTab: WorkspaceTab) => {
    if (
      nextTab === 'storefront' ||
      nextTab === 'track_order' ||
      nextTab === 'affiliates' ||
      nextTab === 'return_policy'
    ) {
      setActiveTab(nextTab);
      return;
    }

    if (!isAdminAuthenticated) {
      setPendingAdminTab(nextTab);
      setIsAdminLoginModalOpen(true);
      return;
    }

    setIsCustomerPreviewMode(false);
    setActiveTab(nextTab);
  };

  const handleAdminLogout = () => {
    clearAdminSession();
    setIsAdminAuthenticated(false);
    setIsCustomerPreviewMode(false);
    setActiveTab('storefront');
  };

  const handleAddProduct = (newProduct: GmcProduct) => {
    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
  };

  const handleUpdateProduct = (updated: GmcProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    }).catch(console.warn);
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
      headers: getAdminAuthHeaders(),
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
          headers: getAdminAuthHeaders(),
          body: JSON.stringify({ products: newProducts }),
        }).catch((err) => console.warn('[Backend Sync Non-Fatal]:', err));
      }
      return combined;
    });
  };

  const isPublicTab = activeTab === 'storefront' || activeTab === 'track_order';
  const effectiveTab: WorkspaceTab =
    (!isAdminAuthenticated || isCustomerPreviewMode) && !isPublicTab
      ? 'storefront'
      : activeTab;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Role-Based Top Navigation Bar (Customer Storefront vs Protected Admin Console) */}
      <TopBar
        activeTab={effectiveTab}
        onTabChange={handleProtectedTabChange}
        productCount={products.length}
        isAdminAuthenticated={isAdminAuthenticated}
        isCustomerPreviewMode={isCustomerPreviewMode}
        onToggleCustomerPreview={() => {
          const nextPreview = !isCustomerPreviewMode;
          setIsCustomerPreviewMode(nextPreview);
          if (nextPreview && !isPublicTab) {
            setActiveTab('storefront');
          }
        }}
        onOpenAdminLogin={() => {
          setPendingAdminTab('admin_inventory');
          setIsAdminLoginModalOpen(true);
        }}
        onAdminLogout={handleAdminLogout}
        onSelectStoreCategory={(cat) => setExternalCategory(cat)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {effectiveTab === 'storefront' && (
          <StoreLandingPage
            products={products}
            onOpenFeed={() => handleProtectedTabChange('gmc_feed')}
            isAdminAuthenticated={isAdminAuthenticated && !isCustomerPreviewMode}
            externalCategory={externalCategory}
            onClearExternalCategory={() => setExternalCategory(null)}
            onOpenAdminPortal={() => handleProtectedTabChange('admin_inventory')}
          />
        )}

        {effectiveTab === 'affiliates' && (
          <AffiliatesPage
            products={products}
            onNavigateToStorefront={() => setActiveTab('storefront')}
            onSelectCategory={(cat) => {
              setExternalCategory(cat);
              setActiveTab('storefront');
            }}
          />
        )}

        {effectiveTab === 'track_order' && (
          <OrderTrackingPage
            onBackToStore={() => setActiveTab('storefront')}
            initialQuery={trackingQueryPrefill}
          />
        )}

        {effectiveTab === 'return_policy' && (
          <ReturnPolicyView
            onBackToStore={() => setActiveTab('storefront')}
            onNavigateToTracking={() => setActiveTab('track_order')}
          />
        )}

        {effectiveTab === 'admin_inventory' && isAdminAuthenticated && (
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

        {effectiveTab === 'admin_orders' && isAdminAuthenticated && (
          <AdminOrdersManager
            onOpenPublicTracker={(orderNumber) => {
              setTrackingQueryPrefill(orderNumber);
              setActiveTab('track_order');
            }}
          />
        )}

        {effectiveTab === 'gmc_feed' && isAdminAuthenticated && (
          <GmcFeedWorkspace
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {effectiveTab === 'csv_upload' && isAdminAuthenticated && (
          <CsvUploadWorkspace
            onIngestProducts={handleIngestProducts}
            currentProductCount={products.length}
          />
        )}

        {effectiveTab === 'nextjs_code' && isAdminAuthenticated && <NextJsCodeWorkspace />}

        {effectiveTab === 'cj_sync' && isAdminAuthenticated && (
          <CjSyncWorkspace
            catalogProducts={products}
            onIngestProducts={handleIngestProducts}
            onReplaceCatalog={(nextCatalog) => setProducts(nextCatalog)}
            onOpenStorefront={() => setActiveTab('storefront')}
          />
        )}

        {effectiveTab === 'pmax_audit' && isAdminAuthenticated && <PMaxAuditWorkspace />}

        {effectiveTab === 'ai_chat' && isAdminAuthenticated && <AiChatWorkspace />}

        {effectiveTab === 'creative_studio' && isAdminAuthenticated && <CreativeStudioWorkspace />}
      </main>

      {/* Admin Portal Authentication Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => {
          setIsAdminLoginModalOpen(false);
          setPendingAdminTab(null);
        }}
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          setIsCustomerPreviewMode(false);
          setIsAdminLoginModalOpen(false);
          if (pendingAdminTab) {
            setActiveTab(pendingAdminTab);
            setPendingAdminTab(null);
          } else {
            setActiveTab('admin_inventory');
          }
        }}
      />

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
              <span>Verified Authentic Gear</span>
              <span aria-hidden="true">·</span>
              <span>48h Domestic Dispatch</span>
            </div>
          </div>
          <div className="border-t border-slate-900/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <p>© 2026 AeroThor Commerce. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('affiliates')}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                Affiliate Deals (/affiliates)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setActiveTab('track_order')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Track Your Order (/track-order)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setActiveTab('return_policy')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Return Policy (/return-policy)
              </button>
              <span>·</span>
              <span className="hover:text-slate-200 cursor-pointer">Privacy &amp; Security</span>
              <span>·</span>
              {isAdminAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleProtectedTabChange('admin_inventory')}
                    className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Admin (/admin)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => handleProtectedTabChange('admin_orders')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    Orders (/admin/orders)
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPendingAdminTab('admin_inventory');
                    setIsAdminLoginModalOpen(true);
                  }}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Admin Login (/admin)
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
