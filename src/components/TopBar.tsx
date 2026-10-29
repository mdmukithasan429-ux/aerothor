import React from 'react';
import { ExternalLink, Store, Shield } from 'lucide-react';

export type WorkspaceTab =
  | 'storefront'
  | 'admin_inventory'
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
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onTabChange, productCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onTabChange('storefront')}
              className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              <span>AeroThor</span>
              <span className="text-emerald-400 font-light">Commerce</span>
            </button>
            <span className="hidden md:inline-block text-[11px] font-mono text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
              B2C Headless Store
            </span>
          </div>

          {/* Zone 2: Navigation Links (Desktop 1440px) */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Desktop Navigation">
            <button
              onClick={() => onTabChange('storefront')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'storefront'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>

            <button
              onClick={() => onTabChange('admin_inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'admin_inventory'
                  ? 'bg-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Inventory</span>
            </button>

            <button
              onClick={() => onTabChange('gmc_feed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'gmc_feed'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              GMC Feed ({productCount})
            </button>

            <button
              onClick={() => onTabChange('csv_upload')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'csv_upload'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              CSV Ingestion (PapaParse)
            </button>

            <button
              onClick={() => onTabChange('nextjs_code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'nextjs_code'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Next.js Routes
            </button>

            <button
              onClick={() => onTabChange('cj_sync')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'cj_sync'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              API Sync (CJ &amp; Any)
            </button>

            <button
              onClick={() => onTabChange('pmax_audit')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'pmax_audit'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              PMax &amp; GMC Audit
            </button>

            <button
              onClick={() => onTabChange('ai_chat')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'ai_chat'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Growth AI Chat
            </button>

            <button
              onClick={() => onTabChange('creative_studio')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'creative_studio'
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Creative Studio
            </button>
          </nav>

          {/* Zone 3: Quick Feed & Sitemap Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/api/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-emerald-400 transition-colors whitespace-nowrap"
            >
              <span>Sitemap XML</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="/api/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/10"
            >
              <span>Live XML Feed</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Scroll Tab Row */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2.5 pt-1 no-scrollbar border-t border-slate-900" aria-label="Mobile Navigation">
          <button
            onClick={() => onTabChange('storefront')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'storefront'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Storefront
          </button>

          <button
            onClick={() => onTabChange('admin_inventory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'admin_inventory'
                ? 'bg-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Admin Inventory
          </button>

          <button
            onClick={() => onTabChange('csv_upload')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'csv_upload'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CSV Ingestion
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
            Next.js Routes
          </button>

          <button
            onClick={() => onTabChange('cj_sync')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'cj_sync'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            API Sync (CJ &amp; Any)
          </button>

          <button
            onClick={() => onTabChange('pmax_audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'pmax_audit'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PMax Audit
          </button>

          <button
            onClick={() => onTabChange('ai_chat')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'ai_chat'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Chat
          </button>

          <button
            onClick={() => onTabChange('creative_studio')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'creative_studio'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Creative Studio
          </button>
        </div>
      </div>
    </header>
  );
};
