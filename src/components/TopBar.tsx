import React, { useState } from 'react';
import {
  Store,
  Shield,
  Lock,
  LogOut,
  Eye,
  Truck,
  Sparkles,
  PackageSearch,
  ClipboardList,
  Tag,
  Zap,
  Settings,
  Globe,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Megaphone,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Layers,
  Activity,
  RefreshCw,
  Upload,
  FileCode,
  Database,
  RotateCcw,
} from 'lucide-react';
import { TARGET_REGIONS, getRegionOrDefault } from '../lib/i18n-regions';
import { useStoreSettings } from '../lib/useStoreSettings';

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
  | 'creative_studio'
  | 'international_seo'
  | 'admin_revenue'
  | 'admin_payments'
  | 'seo_audit'
  | 'marketing';

export interface TopBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  productCount: number;
  isAdminAuthenticated: boolean;
  isCustomerPreviewMode: boolean;
  onToggleCustomerPreview: () => void;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
  onSelectStoreCategory?: (category: string) => void;
  activeRegionSlug?: string | null;
  onSelectRegionSlug?: (slug: string) => void;
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
  activeRegionSlug,
  onSelectRegionSlug,
}) => {
  const { settings } = useStoreSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const showAdminNavigation = isAdminAuthenticated && !isCustomerPreviewMode;
  const activeGeoRegion = getRegionOrDefault(activeRegionSlug || 'us');

  const handleCustomerCategoryClick = (category: string) => {
    if (activeTab !== 'storefront') {
      onTabChange('storefront');
    }
    if (onSelectStoreCategory) {
      onSelectStoreCategory(category);
    }
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const handleNavClick = (tab: WorkspaceTab) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  // Nav Item component with Anti-gravity floating and neon highlights
  const NavItem = ({
    tab,
    icon: Icon,
    label,
    badge,
    badgeColor = 'cyan',
    onClick,
  }: {
    tab?: WorkspaceTab;
    icon: React.ElementType;
    label: string;
    badge?: string | number;
    badgeColor?: 'cyan' | 'amber' | 'emerald' | 'purple' | 'sky' | 'indigo';
    onClick?: () => void;
  }) => {
    const isActive = tab && activeTab === tab;
    const badgeColorClasses = {
      cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      sky: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    }[badgeColor];

    return (
      <button
        type="button"
        onClick={onClick ? onClick : () => tab && handleNavClick(tab)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer group ${
          isActive
            ? 'bg-gradient-to-r from-cyan-500/15 via-cyan-500/5 to-transparent text-cyan-300 border-l-2 border-cyan-400 shadow-md shadow-cyan-500/10 translate-x-1'
            : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] hover:translate-x-1'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span className="truncate">{label}</span>
        </div>
        {badge !== undefined && (
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border shrink-0 transition-colors ${badgeColorClasses}`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  // Full Sidebar Content for both Desktop dock and Mobile slide-in
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between space-y-6">
      {/* Top Brand & Mode Area */}
      <div className="space-y-4">
        {/* Brand Wordmark & Floating Logo */}
        <div className="flex items-center justify-between gap-3 px-2 pt-1">
          <button
            type="button"
            onClick={() => handleNavClick('storefront')}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-indigo-500 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 group-hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <span>{settings.storeName || 'AeroThor'}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Anti-Gravity UI
              </p>
            </div>
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operating Mode Status Pill */}
        <div className="px-2">
          {showAdminNavigation ? (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-mono text-[11px] font-bold">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin ERP Console</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px] font-semibold">
                <Store className="w-3.5 h-3.5 text-cyan-400" />
                <span>Official Storefront</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            </div>
          )}
        </div>

        {/* Anti-gravity Floating Regional Deals Selector Card */}
        <div className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-lg shadow-black/30 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Target Market</span>
            </span>
            <span className="text-emerald-400 font-mono font-bold text-[10px]">
              {activeGeoRegion.flag} {activeGeoRegion.isoCode} ({activeGeoRegion.currencyCode})
            </span>
          </div>

          <p className="text-[10px] text-slate-300 leading-tight">
            Free 48h to {activeGeoRegion.countryName} via {activeGeoRegion.carrierName}
          </p>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            {TARGET_REGIONS.map((region) => {
              const isSelected = activeGeoRegion.slug === region.slug;
              return (
                <button
                  key={region.slug}
                  type="button"
                  onClick={() => {
                    if (onSelectRegionSlug) {
                      onSelectRegionSlug(region.slug);
                    }
                  }}
                  className={`px-1.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md shadow-cyan-500/30 scale-105'
                      : 'text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                  }`}
                  title={`${region.countryName} (${region.currencyCode})`}
                >
                  <span aria-hidden="true">{region.flag}</span> {region.isoCode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Preview Notice if Admin is Previewing Storefront */}
        {isAdminAuthenticated && isCustomerPreviewMode && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
              <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Customer Preview Active</span>
            </div>
            <p className="text-[10px] text-emerald-200/80">
              Admin controls hidden from shoppers.
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={onToggleCustomerPreview}
                className="flex-1 py-1 px-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-[10px] transition-colors cursor-pointer text-center"
              >
                Return to /admin
              </button>
              <button
                type="button"
                onClick={onAdminLogout}
                className="py-1 px-2 bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800 rounded-lg text-[10px] transition-colors cursor-pointer"
              >
                Lock
              </button>
            </div>
          </div>
        )}

        {/* Navigation Categories Container */}
        <div className="space-y-5 pt-2">
          {/* Storefront Section */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              Storefront &amp; Deals
            </p>
            <NavItem
              tab="storefront"
              icon={Store}
              label={`Shop All Gear`}
              badge={productCount}
              badgeColor="cyan"
              onClick={() => handleCustomerCategoryClick('All')}
            />
            <NavItem
              icon={Sparkles}
              label="Trending Arrivals"
              badge="Hot"
              badgeColor="emerald"
              onClick={() => handleCustomerCategoryClick('CJ Marketplace')}
            />
            <NavItem
              icon={Zap}
              label="Tech Accessories"
              onClick={() => handleCustomerCategoryClick('Tech Accessories')}
            />
            <NavItem
              icon={PackageSearch}
              label="Drinkware & Travel"
              onClick={() => handleCustomerCategoryClick('Drinkware & Travel')}
            />
            <NavItem
              tab="affiliates"
              icon={Tag}
              label="Affiliate Partner Deals"
              badge="Amazon"
              badgeColor="amber"
            />
            <NavItem
              tab="track_order"
              icon={Truck}
              label="Track Your Order"
              badge="Live"
              badgeColor="emerald"
            />
            <NavItem
              tab="return_policy"
              icon={RotateCcw}
              label="Return & Refund Policy"
            />
          </div>

          {/* Admin Operations Section (Only when Admin is Authenticated) */}
          {showAdminNavigation && (
            <>
              {/* Group 1: Operations */}
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Operations &amp; Orders</span>
                </p>
                <NavItem
                  tab="admin_inventory"
                  icon={Shield}
                  label="Inventory Catalog"
                  badge="/admin"
                  badgeColor="amber"
                />
                <NavItem
                  tab="admin_orders"
                  icon={ClipboardList}
                  label="Orders Manager"
                  badge="Orders"
                  badgeColor="emerald"
                />
                <NavItem
                  tab="admin_revenue"
                  icon={TrendingUp}
                  label="Revenue Dashboard"
                  badge="P&L"
                  badgeColor="emerald"
                />
                <NavItem
                  tab="admin_payments"
                  icon={CreditCard}
                  label="Payment Gateway Hub"
                  badge="Stripe"
                  badgeColor="indigo"
                />
              </div>

              {/* Group 2: Marketing & Growth */}
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <Megaphone className="w-3 h-3 text-cyan-400" />
                  <span>Marketing &amp; Growth</span>
                </p>
                <NavItem
                  tab="marketing"
                  icon={Megaphone}
                  label="Marketing & Ads Hub"
                  badge="Ads"
                  badgeColor="amber"
                />
                <NavItem
                  tab="seo_audit"
                  icon={ShieldCheck}
                  label="SEO Meta Audit"
                  badge="Audit"
                  badgeColor="amber"
                />
                <NavItem
                  tab="international_seo"
                  icon={BarChart3}
                  label="SEO & Traffic Analytics"
                  badge="GA4"
                  badgeColor="sky"
                />
                <NavItem
                  tab="affiliate_auto_sync"
                  icon={Zap}
                  label="Affiliate Auto-Sync"
                  badge="500+"
                  badgeColor="emerald"
                />
              </div>

              {/* Group 3: Feeds & Integrations */}
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-purple-400" />
                  <span>Feeds &amp; Integrations</span>
                </p>
                <NavItem
                  tab="cj_sync"
                  icon={RefreshCw}
                  label="CJ Dropshipping Sync"
                  badge="API"
                  badgeColor="cyan"
                />
                <NavItem
                  tab="gmc_feed"
                  icon={Database}
                  label="Google Merchant Feed"
                  badge={productCount}
                  badgeColor="emerald"
                />
                <NavItem
                  tab="csv_upload"
                  icon={Upload}
                  label="CSV Catalog Ingestion"
                />
                <NavItem
                  tab="nextjs_code"
                  icon={FileCode}
                  label="Next.js App Router Code"
                />
              </div>

              {/* Group 4: AI & Settings */}
              <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>AI &amp; System Settings</span>
                </p>
                <NavItem
                  tab="admin_settings"
                  icon={Settings}
                  label="Store Settings"
                  badge="ERP"
                  badgeColor="cyan"
                />
                <NavItem
                  tab="ai_chat"
                  icon={Sparkles}
                  label="AI Commerce Assistant"
                  badge="AI"
                  badgeColor="purple"
                />
                <NavItem
                  tab="creative_studio"
                  icon={Layers}
                  label="Creative Ad Studio"
                />
                <NavItem
                  tab="pmax_audit"
                  icon={Activity}
                  label="PMax Performance Audit"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar Footer Controls & Admin Session Bar */}
      <div className="pt-4 border-t border-white/10 space-y-2">
        {showAdminNavigation ? (
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onToggleCustomerPreview}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Customer View</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <a
              href="/api/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] hover:text-white border border-white/10 transition-all"
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live XML Feed</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={onAdminLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer shadow-sm shadow-rose-950/40"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Lock Admin Session</span>
            </button>
          </div>
        ) : (
          <div>
            {!isAdminAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  onOpenAdminLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 hover:border-cyan-400 shadow-lg shadow-cyan-500/10 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Merchant Admin Portal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCustomerPreview}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Return to Admin (/admin)</span>
              </button>
            )}
          </div>
        )}

        <div className="pt-2 text-center text-[10px] font-mono text-slate-400 flex items-center justify-between px-2">
          <span>AeroThor OS v2.8</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            99.98% Live
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP FIXED SIDEBAR NAVIGATION (Anti-gravity Floating Glassmorphism) */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 xl:w-72 flex-col z-40 bg-slate-950/80 backdrop-blur-2xl border-r border-white/10 shadow-2xl shadow-cyan-950/30 p-4 overflow-y-auto no-scrollbar"
        aria-label="Desktop Dashboard Sidebar"
      >
        {renderSidebarContent()}
      </aside>

      {/* 2. MOBILE STICKY FLOATING HEADER (With Hamburger trigger) */}
      <header
        className="lg:hidden sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-white/10 px-4 py-3 shadow-xl shadow-black/40 flex items-center justify-between"
        aria-label="Mobile Navigation Bar"
      >
        {/* Hamburger Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-cyan-400 hover:text-cyan-300 shadow-md shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-mono font-bold hidden sm:inline">MENU</span>
        </button>

        {/* Brand Center */}
        <button
          type="button"
          onClick={() => handleNavClick('storefront')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 p-[1px] shadow-md shadow-cyan-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <span className="font-extrabold text-sm text-white tracking-tight">
            {settings.storeName || 'AeroThor'}
          </span>
        </button>

        {/* Right Quick Action: Target Market & Tracking */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleNavClick('track_order')}
            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer"
            title="Track Order"
          >
            <PackageSearch className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-2 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 font-bold">
            {activeGeoRegion.flag} {activeGeoRegion.isoCode}
          </span>
        </div>
      </header>

      {/* 3. MOBILE SLIDE-IN OVERLAY DRAWER WITH BACKDROP BLUR */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] bg-slate-950/95 backdrop-blur-2xl border-r border-cyan-500/20 shadow-2xl shadow-cyan-950/50 p-4 flex flex-col justify-between overflow-y-auto z-10 animate-in slide-in-from-left duration-300">
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
};

export const AppSidebar = TopBar;
export default TopBar;
