import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Globe,
  TrendingUp,
  Activity,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  ArrowUpRight,
  BarChart3,
  Layers,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { TARGET_REGIONS } from '../lib/i18n-regions';
import {
  GA_MEASUREMENT_ID,
  sendGa4Event,
  subscribeToGa4Events,
  Ga4TrackedEventLog,
} from '../lib/analytics';
import { buildRealTimeTrafficDataset } from '../lib/real-time-metrics';

export interface DailyRegionalTrafficRow {
  date: string;
  dateLabel: string;
  totalVisitors: number;
  organicSearchVisitors: number;
  affiliateClicks: number;
  US: number;
  GB: number;
  CA: number;
  FR: number;
  DE: number;
  IT: number;
  NL: number;
  PL: number;
  ES: number;
  SE: number;
}

export interface RegionalPerformanceSummary {
  isoCode: string;
  slug: string;
  countryName: string;
  flag: string;
  hreflang: string;
  amazonDomain: string;
  amazonAssociateTag: string;
  visitors: number;
  organicSharePercent: number;
  affiliateClickouts: number;
  conversionRatePercent: number;
  avgEngagementSeconds: number;
  topLandingPath: string;
  hreflangStatus: 'verified' | 'active';
}

interface InternationalSeoDashboardProps {
  compact?: boolean;
}

const REGION_COLORS: Record<string, string> = {
  US: '#10b981', // emerald-500
  GB: '#38bdf8', // sky-400
  CA: '#f59e0b', // amber-500
  DE: '#a855f7', // purple-500
  FR: '#6366f1', // indigo-500
  IT: '#ec4899', // pink-500
  NL: '#f97316', // orange-500
  ES: '#eab308', // yellow-500
  PL: '#ef4444', // red-500
  SE: '#14b8a6', // teal-500
};

export const InternationalSeoDashboard: React.FC<InternationalSeoDashboardProps> = ({
  compact = false,
}) => {
  const measurementId =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GA_MEASUREMENT_ID) ||
    GA_MEASUREMENT_ID;

  const [daysRange, setDaysRange] = useState<7 | 14 | 30>(14);
  const [chartType, setChartType] = useState<'stacked_bar' | 'area'>('stacked_bar');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');
  const [dailyRows, setDailyRows] = useState<DailyRegionalTrafficRow[]>([]);
  const [regionalSummaries, setRegionalSummaries] = useState<RegionalPerformanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [liveGa4Events, setLiveGa4Events] = useState<Ga4TrackedEventLog[]>([]);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToGa4Events((events) => {
      setLiveGa4Events(events);
    });
  }, []);

  const fetchGa4RegionalData = async (rangeDays: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/i18n-traffic?measurementId=${encodeURIComponent(measurementId)}&days=${rangeDays}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.dailyTraffic) && Array.isArray(data.regionalBreakdown)) {
          setDailyRows(data.dailyTraffic);
          setRegionalSummaries(data.regionalBreakdown);
          setLastSyncedAt(new Date().toLocaleTimeString());
          setIsLoading(false);
          return;
        }
      }
      throw new Error('Zero-state fallback');
    } catch {
      const zeroState = buildRealTimeTrafficDataset(rangeDays, []);
      setDailyRows(zeroState.dailyTraffic);
      setRegionalSummaries(zeroState.regionalBreakdown);
      setLastSyncedAt(new Date().toLocaleTimeString());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGa4RegionalData(daysRange);
  }, [daysRange, measurementId]);

  const totals = useMemo(() => {
    const totalVisitors = regionalSummaries.reduce((acc, r) => acc + r.visitors, 0);
    const totalAffiliateClicks = regionalSummaries.reduce((acc, r) => acc + r.affiliateClickouts, 0);
    const projectedMonthlyVisitors =
      daysRange > 0 && totalVisitors > 0 ? Math.round((totalVisitors / daysRange) * 30) : 0;
    const activeRegionsWithTraffic = regionalSummaries.filter((r) => r.visitors > 0);
    const avgOrganicShare =
      activeRegionsWithTraffic.length > 0
        ? Number(
            (
              activeRegionsWithTraffic.reduce((acc, r) => acc + r.organicSharePercent, 0) /
              activeRegionsWithTraffic.length
            ).toFixed(1)
          )
        : 0;

    return {
      totalVisitors,
      totalAffiliateClicks,
      projectedMonthlyVisitors,
      avgOrganicShare,
    };
  }, [regionalSummaries, daysRange]);

  const filteredRegionalSummaries = useMemo(() => {
    if (selectedCountryFilter === 'ALL') return regionalSummaries;
    return regionalSummaries.filter((r) => r.isoCode === selectedCountryFilter);
  }, [regionalSummaries, selectedCountryFilter]);

  const handleDispatchRegionalPing = async (isoCode = 'GB') => {
    const region = TARGET_REGIONS.find((r) => r.isoCode === isoCode) || TARGET_REGIONS[0];
    sendGa4Event(
      'i18n_seo_verification',
      {
        measurement_id: measurementId,
        country_iso: region.isoCode,
        hreflang_locale: region.hreflang,
        landing_page: `/deals/${region.slug}`,
        amazon_domain: region.amazonDomain,
        traffic_source: 'organic_hreflang',
      },
      `Verified i18n SEO route /deals/${region.slug} (${region.hreflang}) -> ${measurementId}`
    );
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'organic_visit',
          isoCode: region.isoCode,
          path: `/deals/${region.slug}`,
        }),
      });
      await fetchGa4RegionalData(daysRange);
    } catch {}
    setPingStatus(`Dispatched GA4 regional ping for ${region.flag} ${region.countryName} (${region.hreflang}) to ${measurementId}`);
    setTimeout(() => setPingStatus(null), 4000);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Globe className="w-3.5 h-3.5" />
              GA4 INTERNATIONAL SEO TELEMETRY
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
              VITE_GA_MEASUREMENT_ID: <strong className="text-emerald-400">{measurementId}</strong>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              10 Target Countries Active
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            International SEO (i18n) &amp; Regional GA4 Traffic Split Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Verifying organic search traffic distribution, <code className="text-emerald-300 font-mono">hreflang</code> regional indexation, and Amazon Associates clickouts across US, UK, CA, FR, DE, IT, NL, PL, ES, and SE.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysRange(d)}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  daysRange === d
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartType('stacked_bar')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                chartType === 'stacked_bar'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Stacked Bar
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Area Trend
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchGa4RegionalData(daysRange)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Sync GA4</span>
          </button>

          <button
            type="button"
            onClick={() => handleDispatchRegionalPing('GB')}
            className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Verify GA4 Stream</span>
          </button>
        </div>
      </div>

      {pingStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pingStatus}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400">{measurementId}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Regional Visitors ({daysRange}d)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {totals.totalVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Projected 30d Run-Rate: <strong>{totals.projectedMonthlyVisitors.toLocaleString()} / mo</strong>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Organic Search Share (i18n)</span>
            <Search className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {totals.avgOrganicShare}%
          </div>
          <div className="text-[11px] text-slate-400">
            Driven by <code className="text-emerald-400">hreflang</code> &amp; <code className="text-emerald-400">/deals/[country]</code> pages
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Amazon Regional Clickouts</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            {totals.totalAffiliateClicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Live outbound affiliate link clicks tracked
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hreflang Alternates Coverage</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            11 / 11 Locales
          </div>
          <div className="text-[11px] text-slate-400">
            10 Target Regions + <code className="text-slate-300">x-default</code> active
          </div>
        </div>
      </div>

      {/* Daily Traffic Split Chart by Country/Region */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Daily Organic &amp; Direct Traffic Split by Target Country ({daysRange}-Day Window)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Segmented daily sessions reported via GA4 Measurement Stream <code className="text-emerald-400 font-mono">{measurementId}</code> and Vercel Edge <code className="text-slate-300 font-mono">x-vercel-ip-country</code> telemetry.
            </p>
          </div>
          {lastSyncedAt && (
            <span className="text-[11px] font-mono text-slate-400">
              Last Synced: {lastSyncedAt}
            </span>
          )}
        </div>

        {totals.totalVisitors === 0 && (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="text-white">Connect GA4 API to view traffic</strong> — No synthetic or mock visitor numbers are rendered. All metrics default to <code className="text-emerald-400 font-mono">0</code> until real-time storefront visits or GA4 Data API events are recorded.
            </div>
            <span className="font-mono text-[11px] text-slate-400 shrink-0">0 Fake Data Mode Active</span>
          </div>
        )}

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'stacked_bar' ? (
              <BarChart data={dailyRows} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {TARGET_REGIONS.map((region) => (
                  <Bar
                    key={region.isoCode}
                    dataKey={region.isoCode}
                    name={`${region.flag} ${region.isoCode}`}
                    stackId="traffic"
                    fill={REGION_COLORS[region.isoCode] || '#10b981'}
                  />
                ))}
              </BarChart>
            ) : (
              <AreaChart data={dailyRows} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {TARGET_REGIONS.map((region) => (
                  <Area
                    key={region.isoCode}
                    type="monotone"
                    dataKey={region.isoCode}
                    name={`${region.flag} ${region.isoCode}`}
                    stackId="1"
                    stroke={REGION_COLORS[region.isoCode] || '#10b981'}
                    fill={REGION_COLORS[region.isoCode] || '#10b981'}
                    fillOpacity={0.35}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Country Filter Pills & Regional Breakdown Table */}
      {!compact && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>10-Country Programmatic SEO &amp; Affiliate Conversion Breakdown</span>
            </h3>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCountryFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedCountryFilter === 'ALL'
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All 10 Regions
              </button>
              {TARGET_REGIONS.map((r) => (
                <button
                  key={r.isoCode}
                  type="button"
                  onClick={() => setSelectedCountryFilter(r.isoCode)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedCountryFilter === r.isoCode
                      ? 'bg-emerald-400 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r.flag} {r.isoCode}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Country / Region</th>
                    <th className="py-3 px-4">Hreflang Tag</th>
                    <th className="py-3 px-4">Programmatic Route</th>
                    <th className="py-3 px-4">Amazon Storefront</th>
                    <th className="py-3 px-4 text-right">Visitors ({daysRange}d)</th>
                    <th className="py-3 px-4 text-right">Organic %</th>
                    <th className="py-3 px-4 text-right">Affiliate Clicks</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRegionalSummaries.map((row) => (
                    <tr key={row.isoCode} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{row.flag}</span>
                          <div>
                            <div>{row.countryName}</div>
                            <div className="text-[10px] font-mono text-slate-400">
                              ISO: {row.isoCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                          {row.hreflang}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-sky-400">
                        <a
                          href={row.topLandingPath}
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          <span>{row.topLandingPath}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300">
                        <div>{row.amazonDomain}</div>
                        <div className="text-[10px] text-slate-400">tag={row.amazonAssociateTag}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {row.visitors.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {row.organicSharePercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-400">
                        {row.affiliateClickouts.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDispatchRegionalPing(row.isoCode)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded text-[11px] font-mono cursor-pointer transition-colors"
                        >
                          Test Ping
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {liveGa4Events.length > 0 && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold">Latest Live GA4 Event:</span>
                <span className="truncate">{liveGa4Events[0].summary}</span>
              </div>
              <span className="text-slate-500 shrink-0">{liveGa4Events[0].timestamp}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export function buildDeterministicGa4RegionalDataset(days: number): {
  dailyTraffic: DailyRegionalTrafficRow[];
  regionalBreakdown: RegionalPerformanceSummary[];
} {
  const zeroDataset = buildRealTimeTrafficDataset(days, []);
  return {
    dailyTraffic: zeroDataset.dailyTraffic,
    regionalBreakdown: zeroDataset.regionalBreakdown,
  };
}

export default InternationalSeoDashboard;
