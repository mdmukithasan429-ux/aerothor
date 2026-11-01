import React from 'react';
import { ExternalLink, Store, Shield, Lock, LogOut, Eye, Truck, Sparkles, PackageSearch, ClipboardList, Tag, Zap, Settings } from 'lucide-react';

export type WorkspaceTab =
  | 'storefront'
  | 'affiliates'
  | 'track_order'
  | 'return_policy'
  | 'admin_inventory'
  | 'admin_orders'
  | 'admin_settings'
  | 'affiliate_auto_sync'
  | 'gmc_feed'
  | 'csv_upload'
  | 'nextjs_code'
  | 'cj_sync'
  | 'pmax_audit'
  | 'ai_chat'
  | 'creative_studio';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  productCount: number;
  isAdminAuthenticated: boolean;
  isCustomerPreviewMode: boolean;
  onToggleCustomerPreview: () => void;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onSelectStoreCategory?: (category: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  productCount,
  isAdminAuthenticated,
  isCustomerPreviewMode,
  onToggleCustomerPreview,
  onOpenAdminLogin,
  onAdminLogout,
  onSelectStoreCategory,
}) => {
  const showAdminNavigation = isAdminAuthenticated && !isCustomerPreviewMode;

  const handleCustomerCategoryClick = (category: string) => {
    if (activeTab !== 'storefront') {
      onTabChange('storefront');
    }
    if (onSelectStoreCategory) {
      onSelectStoreCategory(category);
    }
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* Admin Preview Banner if Admin is previewing Customer View */}
      {isAdminAuthenticated && isCustomerPreviewMode && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-4 py-1.5 text-[11px] text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong>Customer Storefront View (/):</strong> Admin tabs, inventory controls, and API integrations are hidden from shoppers.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCustomerPreview}
              className="px-2.5 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer"
            >
              Return to /admin
            </button>
            <button
              type="button"
              onClick={onAdminLogout}
              className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] transition-colors cursor-pointer"
            >
              Lock Admin
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onTabChange('storefront')}
              className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>AeroThor</span>
              <span className="text-emerald-400 font-light">Commerce</span>
            </button>
            {showAdminNavigation ? (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>/admin</span>
              </span>
            ) : (
              <span className="hidden md:inline-block text-[11px] font-mono text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                Official Storefront
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          {showAdminNavigation ? (
            <nav className="hidden lg:flex items-center gap-1" aria-label="Admin Navigation">
              <button
                onClick={() => onTabChange('storefront')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'storefront'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Storefront (/)</span>
              </button>

              <button
                onClick={() => onTabChange('admin_inventory')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'admin_inventory'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Inventory (/admin)</span>
              </button>

              <button
                onClick={() => onTabChange('admin_orders')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'admin_orders'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-emerald-400" />
                <span>Orders (/admin/orders)</span>
              </button>

              <button
                onClick={() => onTabChange('affiliate_auto_sync')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'affiliate_auto_sync'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Affiliate Auto-Sync (500+)</span>
              </button>

              <button
                onClick={() => onTabChange('admin_settings')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'admin_settings'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>Settings (/admin/settings)</span>
              </button>

              <button
                onClick={() => onTabChange('track_order')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'track_order'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Track (/track-order)
              </button>

              <button
                onClick={() => onTabChange('cj_sync')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'cj_sync'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                API Sync (CJ)
              </button>

              <button
                onClick={() => onTabChange('gmc_feed')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'gmc_feed'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                GMC Feed ({productCount})
              </button>

              <button
                onClick={() => onTabChange('csv_upload')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'csv_upload'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                CSV Ingestion
              </button>

              <button
                onClick={() => onTabChange('nextjs_code')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'nextjs_code'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Next.js Code
              </button>
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-1.5" aria-label="Customer Storefront Navigation">
              <button
                type="button"
                onClick={() => handleCustomerCategoryClick('All')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'storefront'
                    ? 'text-white bg-slate-900'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Shop All ({productCount})
              </button>
              <button
                type="button"
                onClick={() => handleCustomerCategoryClick('CJ Marketplace')}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-emerald-400 rounded-md hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Trending Arrivals</span>
              </button>
              <button
                type="button"
                onClick={() => handleCustomerCategoryClick('Tech Accessories')}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Tech Accessories
              </button>
              <button
                type="button"
                onClick={() => handleCustomerCategoryClick('Drinkware & Travel')}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Drinkware &amp; Travel
              </button>
              <button
                type="button"
                onClick={() => onTabChange('affiliates')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'affiliates'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-amber-300 hover:text-amber-200 bg-amber-950/40 border border-amber-500/40 hover:border-amber-400'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Affiliate Deals</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-200">
                  Amazon
                </span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange('track_order')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'track_order'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'
                }`}
              >
                <PackageSearch className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </button>
            </nav>
          )}

          {/* Zone 3: Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {showAdminNavigation ? (
              <>
                <button
                  type="button"
                  onClick={onToggleCustomerPreview}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer"
                  title="Preview what public customers see"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customer View</span>
                </button>
                <a
                  href="/api/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/10"
                >
                  <span>Live XML Feed</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onAdminLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-950/60 border border-rose-500/30 rounded-lg hover:bg-rose-900/70 transition-colors whitespace-nowrap cursor-pointer"
                  title="Lock Admin Console & return to public storefront"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock Admin</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange('track_order')}
                  className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  <PackageSearch className="w-3.5 h-3.5" />
                  <span>Track Order</span>
                </button>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 rounded-lg whitespace-nowrap">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Free 48h US &amp; UK Dispatch</span>
                </div>
                {!isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={onOpenAdminLogin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    title="Merchant Administrator Sign In (/admin)"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Admin</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Scroll Row */}
        {showAdminNavigation ? (
          <div
            className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 no-scrollbar border-t border-slate-900"
            aria-label="Mobile Admin Navigation"
          >
            <button
              onClick={() => onTabChange('storefront')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'storefront'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Storefront (/)
            </button>

            <button
              onClick={() => onTabChange('admin_inventory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'admin_inventory'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Inventory (/admin)
            </button>

            <button
              onClick={() => onTabChange('admin_orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'admin_orders'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Orders (/admin/orders)
            </button>

            <button
              onClick={() => onTabChange('affiliate_auto_sync')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
                activeTab === 'affiliate_auto_sync'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Auto-Sync (500+)</span>
            </button>

            <button
              onClick={() => onTabChange('admin_settings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 ${
                activeTab === 'admin_settings'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Settings className="w-3 h-3 text-emerald-400" />
              <span>Settings (/admin/settings)</span>
            </button>

            <button
              onClick={() => onTabChange('track_order')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'track_order'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Track Order
            </button>

            <button
              onClick={() => onTabChange('cj_sync')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'cj_sync'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API Sync (CJ)
            </button>

            <button
              onClick={() => onTabChange('gmc_feed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'gmc_feed'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GMC Feed ({productCount})
            </button>

            <button
              onClick={() => onTabChange('nextjs_code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'nextjs_code'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Next.js Code
            </button>
          </div>
        ) : (
          <div
            className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 no-scrollbar border-t border-slate-900"
            aria-label="Mobile Storefront Categories"
          >
            <button
              type="button"
              onClick={() => handleCustomerCategoryClick('All')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md whitespace-nowrap shrink-0"
            >
              All Gear ({productCount})
            </button>
            <button
              type="button"
              onClick={() => handleCustomerCategoryClick('CJ Marketplace')}
              className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-slate-900/60 rounded-md whitespace-nowrap shrink-0"
            >
              Trending Arrivals
            </button>
            <button
              type="button"
              onClick={() => onTabChange('affiliates')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeTab === 'affiliates'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Affiliate Deals</span>
            </button>
            <button
              type="button"
              onClick={() => handleCustomerCategoryClick('Tech Accessories')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-md whitespace-nowrap shrink-0"
            >
              Tech Accessories
            </button>
            <button
              type="button"
              onClick={() => handleCustomerCategoryClick('Drinkware & Travel')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-md whitespace-nowrap shrink-0"
            >
              Drinkware &amp; Travel
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
