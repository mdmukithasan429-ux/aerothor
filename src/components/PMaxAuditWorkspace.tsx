import React, { useState } from 'react';
import {
  KNOWN_GMC_POLICY_ISSUES,
  generatePMaxOptimizedTitle,
  PMaxTitleInput,
  OptimizedPMaxResult,
} from '../lib/pmax-audit';
import { ShieldAlert, Sparkles, Copy, Check, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PMaxAuditWorkspace: React.FC = () => {
  const [selectedIssueId, setSelectedIssueId] = useState<string>(KNOWN_GMC_POLICY_ISSUES[0].id);

  // Title generator state
  const [titleInput, setTitleInput] = useState<PMaxTitleInput>({
    brand: 'AeroThermal',
    productType: 'Vacuum Insulated Travel Flask',
    materialOrFeature: 'Grade 1 Titanium 750ml',
    variantOrSize: 'Matte Charcoal Grey',
    targetMarket: 'US',
    highIntentKeyword: 'Fast 2-Day Shipping',
  });

  const [copiedTitle, setCopiedTitle] = useState(false);

  const activeIssue = KNOWN_GMC_POLICY_ISSUES.find((i) => i.id === selectedIssueId) || KNOWN_GMC_POLICY_ISSUES[0];

  const pmaxResult: OptimizedPMaxResult = generatePMaxOptimizedTitle(titleInput);

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(pmaxResult.optimizedTitle);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Google Merchant Center</span>
            <span aria-hidden="true">·</span>
            <span>Policy Hardening</span>
            <span aria-hidden="true">·</span>
            <span>Performance Max (PMax)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            GMC Suspension Diagnostic &amp; High-Intent PMax Optimizer
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Immediate remediation protocols for Merchant Center account suspensions, GTIN errors, and high-intent title optimization engineered for USA/UK shopping algorithms.
          </p>
        </div>
      </div>

      {/* Main Grid: Policy Troubleshooter & Title Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Policy Suspension Troubleshooter */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">GMC Suspension &amp; Policy Fixer</h3>
          </div>

          {/* Issue Selector Tabs */}
          <div className="space-y-2">
            <label className="block text-slate-400 text-xs">Select Suspension Reason</label>
            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
              {KNOWN_GMC_POLICY_ISSUES.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                    selectedIssueId === issue.id
                      ? 'bg-slate-800 border-rose-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-medium truncate mr-2">{issue.title}</span>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{issue.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Diagnostic Detail */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Root Cause Trigger</span>
              <p className="text-slate-300 leading-relaxed">{activeIssue.rootCause}</p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-emerald-400 block text-[11px] font-semibold mb-1">
                Actionable Fix (CTO/CMO Execution)
              </span>
              <p className="text-slate-200 leading-relaxed font-mono text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800">
                {activeIssue.exactFix}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-end">
              <a
                href={activeIssue.docLink}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 text-[11px]"
              >
                <span>Google Merchant Official Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Section 2: PMax / Shopping Title Formula Optimizer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">USA/UK High-Intent Title &amp; Feed Optimizer</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Brand</label>
                <input
                  type="text"
                  value={titleInput.brand}
                  onChange={(e) => setTitleInput({ ...titleInput, brand: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Product Type</label>
                <input
                  type="text"
                  value={titleInput.productType}
                  onChange={(e) => setTitleInput({ ...titleInput, productType: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Key Feature / Material</label>
                <input
                  type="text"
                  value={titleInput.materialOrFeature}
                  onChange={(e) => setTitleInput({ ...titleInput, materialOrFeature: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Variant / Color / Size</label>
                <input
                  type="text"
                  value={titleInput.variantOrSize}
                  onChange={(e) => setTitleInput({ ...titleInput, variantOrSize: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Target Market</label>
                <select
                  value={titleInput.targetMarket}
                  onChange={(e: any) => setTitleInput({ ...titleInput, targetMarket: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                >
                  <option value="US">USA (USD / 2-Day)</option>
                  <option value="UK">UK (GBP / Royal Mail)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Search Intent Hook</label>
                <input
                  type="text"
                  value={titleInput.highIntentKeyword}
                  onChange={(e) => setTitleInput({ ...titleInput, highIntentKeyword: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Generated Result */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">
                Optimized Title ({pmaxResult.charCount}/150 Chars)
              </span>
              <button
                onClick={handleCopyTitle}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {copiedTitle ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTitle ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-emerald-300 font-semibold text-xs leading-relaxed">
              {pmaxResult.optimizedTitle}
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-0.5">Mobile First 70 Characters (Google SERP Viewport)</span>
              <div className="p-2 bg-slate-900/60 border border-slate-800/60 rounded text-slate-300 text-xs">
                {pmaxResult.mobileHeadline}...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
