'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Key,
  Globe,
  Mail,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface StoreSettingsPayload {
  id: string;
  isStripeEnabled: boolean;
  isCodEnabled: boolean;
  cjApiToken: string;
  storeCurrency: string;
  supportEmail: string;
  amazonAssociateTag?: string;
  autoDeductEnabled?: boolean;
  updatedAt?: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsPayload>({
    id: 'singleton',
    isStripeEnabled: true,
    isCodEnabled: false,
    cjApiToken: '',
    storeCurrency: 'USD',
    supportEmail: 'support@aerothor.com',
    amazonAssociateTag: 'aerothor-20',
    autoDeductEnabled: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCjToken, setShowCjToken] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.settings) {
          setSettings(data.settings);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load StoreSettings', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update StoreSettings');
      }
      if (data.settings) setSettings(data.settings);
      showToast('Global Store Settings & API Operations saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-rose-950 text-rose-300 border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Global Settings &amp; API Operations
              </h1>
              <p className="text-xs text-slate-400">
                Manage singleton StoreSettings, payment gateways, and CJ Dropshipping credentials.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Payment Gateways */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">1. Payment Gateways</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Stripe Checkout</p>
                  <p className="text-[11px] text-slate-400">
                    Enable Cards, Apple Pay, and Google Pay
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.isStripeEnabled}
                  onClick={() =>
                    setSettings((s) => ({ ...s, isStripeEnabled: !s.isStripeEnabled }))
                  }
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors cursor-pointer ${
                    settings.isStripeEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition mt-0.5 ${
                      settings.isStripeEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-slate-400">
                    Allow domestic orders with payment on delivery
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.isCodEnabled}
                  onClick={() =>
                    setSettings((s) => ({ ...s, isCodEnabled: !s.isCodEnabled }))
                  }
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors cursor-pointer ${
                    settings.isCodEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition mt-0.5 ${
                      settings.isCodEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Integrations */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Key className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">2. Third-Party Integrations</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                CJ Dropshipping API Token (`cjApiToken`)
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCjToken ? 'text' : 'password'}
                  value={settings.cjApiToken || ''}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, cjApiToken: e.target.value }))
                  }
                  placeholder="CJ5994755@api@..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-emerald-300"
                />
                <button
                  type="button"
                  onClick={() => setShowCjToken(!showCjToken)}
                  className="absolute right-3 text-slate-400 hover:text-white"
                >
                  {showCjToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Store Configuration */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">3. Store Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Default Store Currency
                </label>
                <select
                  value={settings.storeCurrency}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, storeCurrency: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Support / Return Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                  <input
                    type="email"
                    required
                    value={settings.supportEmail}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, supportEmail: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save Configurations'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
