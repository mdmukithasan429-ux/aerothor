import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  ExternalLink,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Tag,
  Eye,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Campaign, INITIAL_CAMPAIGNS } from '../lib/campaigns';
import { getAdminAuthHeaders } from '../lib/admin-auth';

export function AdminMarketingWorkspace() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form State
  const [brandName, setBrandName] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [vanityLink, setVanityLink] = useState('');
  const [placement, setPlacement] = useState<'HERO_BANNER' | 'IN_GRID'>('HERO_BANNER');
  const [isActive, setIsActive] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [ctaText, setCtaText] = useState('Claim Impact Partner Deal');
  const [badgeText, setBadgeText] = useState('Impact High-Ticket Offer');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setBrandName('');
    setPromoTitle('');
    setImageUrl('https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80');
    setVanityLink('https://impact.com/v/aerothor-partner-link');
    setPlacement('HERO_BANNER');
    setIsActive(true);
    setDiscountCode('');
    setCtaText('Claim Impact Partner Deal');
    setBadgeText('Impact Partner');
    setIsModalOpen(true);
  };

  const openEditModal = (cmp: Campaign) => {
    setEditingCampaign(cmp);
    setBrandName(cmp.brandName);
    setPromoTitle(cmp.promoTitle);
    setImageUrl(cmp.imageUrl);
    setVanityLink(cmp.vanityLink);
    setPlacement(cmp.placement);
    setIsActive(cmp.isActive);
    setDiscountCode(cmp.discountCode || '');
    setCtaText(cmp.ctaText || 'Claim Impact Partner Deal');
    setBadgeText(cmp.badgeText || 'Impact Partner');
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !promoTitle.trim() || !vanityLink.trim()) {
      alert('Please fill in Brand Name, Promo Title, and Impact Vanity Link URL.');
      return;
    }

    try {
      const payload = {
        brandName,
        promoTitle,
        imageUrl,
        vanityLink,
        placement,
        isActive,
        discountCode,
        ctaText,
        badgeText,
      };

      let res;
      if (editingCampaign) {
        res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
        setIsModalOpen(false);
      } else {
        alert(data.error || 'Failed to save campaign');
      }
    } catch (err: any) {
      alert(err.message || 'Server network error saving campaign');
    }
  };

  const handleToggleActive = async (cmp: Campaign) => {
    try {
      const res = await fetch(`/api/campaigns/${cmp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ isActive: !cmp.isActive }),
      });
      const data = await res.json();
      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err: any) {
      console.error('Failed to toggle active status', err);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketing campaign?')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
      }
    } catch (err: any) {
      console.error('Failed to delete campaign', err);
    }
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const heroCount = campaigns.filter((c) => c.placement === 'HERO_BANNER' && c.isActive).length;
  const inGridCount = campaigns.filter((c) => c.placement === 'IN_GRID' && c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
            <Megaphone className="w-4 h-4" />
            <span>Impact.com &amp; Native Advertising Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Marketing &amp; Sponsored Campaign Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Manage high-ticket Impact.com vanity links, hero promo banners, and native sponsored product grid placements with seamless external tab retention.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={fetchCampaigns}
            disabled={loading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh Campaigns"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Impact Campaign</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Active Campaigns</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {campaigns.filter((c) => c.isActive).length} / {campaigns.length}
          </div>
          <div className="text-[11px] text-slate-400">Impact.com &amp; Native Advertisements</div>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Hero Banners</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{heroCount}</div>
          <div className="text-[11px] text-slate-400">Top Carousel Framer Motion Slides</div>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In-Grid Sponsored Cards</span>
            <Tag className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">{inGridCount}</div>
          <div className="text-[11px] text-slate-400">Injected into Product Feed</div>
        </div>

        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Est. Commission Lift</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">+38.4%</div>
          <div className="text-[11px] text-slate-400">High-Ticket Impact Vanity Routing</div>
        </div>
      </div>

      {/* Campaigns Data Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Active Marketing &amp; Impact.com Campaigns
            </h3>
            <p className="text-xs text-slate-400">
              Toggle live placements or copy vanity links for direct tracking
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Showing {campaigns.length} campaigns
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Marketing Campaigns Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first Impact.com vanity promotion or native hero banner to begin monetizing store traffic.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Add Impact Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {campaigns.map((cmp) => (
              <div
                key={cmp.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-4 ${
                  cmp.isActive
                    ? cmp.placement === 'HERO_BANNER'
                      ? 'bg-slate-950/80 border-amber-500/30 hover:border-amber-400/60'
                      : 'bg-slate-950/80 border-cyan-500/30 hover:border-cyan-400/60'
                    : 'bg-slate-950/30 border-slate-800 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badge & Status Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          cmp.placement === 'HERO_BANNER'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {cmp.placement === 'HERO_BANNER' ? 'Hero Banner' : 'In-Grid Placement'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {cmp.badgeText || 'Impact Partner'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(cmp)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                        cmp.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {cmp.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Banner Image Preview & Content */}
                  <div className="flex gap-3 items-start">
                    <img
                      src={cmp.imageUrl}
                      alt={cmp.brandName}
                      className="w-20 h-20 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {cmp.brandName}
                      </div>
                      <h4 className="text-sm font-extrabold text-white line-clamp-2 leading-snug">
                        {cmp.promoTitle}
                      </h4>
                      {cmp.discountCode && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                          <Tag className="w-3 h-3" />
                          <span>Code: {cmp.discountCode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Impact Vanity Link Bar */}
                  <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono">
                    <span className="text-slate-500 truncate flex-1">{cmp.vanityLink}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(cmp.vanityLink, cmp.id)}
                      className="p-1 hover:text-white text-slate-400 transition-colors shrink-0"
                      title="Copy Link"
                    >
                      {copiedId === cmp.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={cmp.vanityLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-amber-400 text-slate-400 transition-colors shrink-0"
                      title="Test Link in New Tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {cmp.id}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(cmp)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(cmp.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                {editingCampaign ? 'Edit Impact Campaign' : 'Create Impact Campaign'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Brand / Merchant Partner Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EcoFlow Official, DJI Global, Sony Audio"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Promotional Offer Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DELTA Pro 3 Portable Power Station - Up to $800 Off"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Impact.com Vanity Link URL * (Opens in New Tab)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://impact.com/v/aerothor-dji-deals"
                  value={vanityLink}
                  onChange={(e) => setVanityLink(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  High-Res Banner / Image URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Placement Location *
                  </label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="HERO_BANNER">HERO_BANNER (Store Top Slider)</option>
                    <option value="IN_GRID">IN_GRID (Injected Grid Card)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="Impact Partner"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Button CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="Claim Impact Deal"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Discount / Voucher Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AEROTHOR100"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs text-slate-300 cursor-pointer select-none">
                  Publish campaign live on Storefront immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  {editingCampaign ? 'Save Campaign Changes' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const AdminMarketingHub = AdminMarketingWorkspace;

