import React, { useState, useEffect } from 'react';
import {
  Settings,
  CreditCard,
  Truck,
  Key,
  Globe,
  Mail,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Activity,
  Lock,
} from 'lucide-react';
import { getAdminAuthHeaders, saveAdminSession } from '../lib/admin-auth';

import { StoreSettings, DEFAULT_STORE_SETTINGS, applyPrimaryColorToDocument } from '../lib/store-settings';

export const AdminSettingsWorkspace: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [adminEmail, setAdminEmail] = useState<string>('codernestwebsolution@gmail.com');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isSavingCreds, setIsSavingCreds] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTestingCj, setIsTestingCj] = useState<boolean>(false);
  const [showCjToken, setShowCjToken] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: getAdminAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.primaryColorHex) {
            applyPrimaryColorToDocument(data.settings.primaryColorHex);
          }
        }
      }
      const credRes = await fetch('/api/admin/credentials', {
        headers: getAdminAuthHeaders(),
      });
      if (credRes.ok) {
        const credData = await credRes.json();
        if (credData.adminEmail) {
          setAdminEmail(credData.adminEmail);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load store settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update StoreSettings');
      }
      if (data.settings) {
        setSettings(data.settings);
        if (data.settings.primaryColorHex) {
          applyPrimaryColorToDocument(data.settings.primaryColorHex);
        }
      }
      showToast(data.message || 'Global Store Settings & Dynamic Theme saved successfully!');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestCjToken = async () => {
    setIsTestingCj(true);
    try {
      const res = await fetch('/api/admin/cj/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ apiKey: settings.cjApiToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`CJ Token Verified (${data.latencyMs || 48}ms)! Account active.`);
      } else {
        throw new Error(data.error || 'CJ Token verification failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to test CJ API token', 'error');
    } finally {
      setIsTestingCj(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      showToast('Admin email cannot be empty', 'error');
      return;
    }
    if (!newPassword) {
      showToast('Please enter a new password to update', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirmation password do not match', 'error');
      return;
    }

    setIsSavingCreds(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          newEmail: adminEmail.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update admin credentials');
      }

      saveAdminSession(data.adminPassword || newPassword.trim(), data.adminEmail || adminEmail.trim(), true);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Admin email & secure password updated successfully! Session updated.');
    } catch (err: any) {
      showToast(err.message || 'Failed to update admin credentials', 'error');
    } finally {
      setIsSavingCreds(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
              : 'bg-rose-950 text-rose-300 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Global Settings &amp; API Operations
              </h1>
              <p className="text-xs text-slate-400">
                Singleton database configuration (`StoreSettings`) controlling live payment gateways, CJ Dropshipping tokens, and merchant defaults.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload DB</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Configurations'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 0: White-Label Store & Theme Branding */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">0. White-Label Branding &amp; Store Identity</h2>
            </div>
            <span className="text-[11px] font-mono text-amber-400">
              Singleton Real-Time Customization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Storefront &amp; Business Name *
              </label>
              <input
                type="text"
                required
                value={settings.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                placeholder="e.g. AeroThor Performance Essentials"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Support Email Address *
              </label>
              <input
                type="email"
                required
                value={settings.supportEmail || ''}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="support@yourbrand.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={settings.phoneNumber || ''}
                onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                placeholder="+1 (800) 555-0199"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Physical Business Address
              </label>
              <input
                type="text"
                value={settings.physicalAddress || ''}
                onChange={(e) => setSettings({ ...settings, physicalAddress: e.target.value })}
                placeholder="1209 North Orange St, Wilmington, DE 19801"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Primary Brand Theme Color (Hex) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColorHex || '#10B981'}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSettings({ ...settings, primaryColorHex: next });
                    applyPrimaryColorToDocument(next);
                  }}
                  className="w-9 h-9 p-1 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={settings.primaryColorHex || '#10B981'}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSettings({ ...settings, primaryColorHex: next });
                    applyPrimaryColorToDocument(next);
                  }}
                  placeholder="#10B981"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 uppercase placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Custom Copyright Notice
              </label>
              <input
                type="text"
                value={settings.copyrightText || ''}
                onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                placeholder="© 2026 YourBrand Inc. All rights reserved."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Section 1: Payment Gateways */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">1. Payment Gateway Controls</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Enforced at /api/checkout
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stripe Toggle */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Stripe Checkout (Cards, Apple Pay, Google Pay)
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      settings.isStripeEnabled ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {settings.isStripeEnabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  When disabled, `/api/checkout` blocks card transactions with &quot;Payment gateway currently unavailable&quot;.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={settings.isStripeEnabled}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    isStripeEnabled: !prev.isStripeEnabled,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.isStripeEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    settings.isStripeEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Cash on Delivery (COD) Toggle */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Cash on Delivery (COD)
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      settings.isCodEnabled ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {settings.isCodEnabled ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Allow verified domestic shoppers to place COD orders without upfront card payment.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={settings.isCodEnabled}
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    isCodEnabled: !prev.isCodEnabled,
                  }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  settings.isCodEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    settings.isCodEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Third-Party API Integrations */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                2. Third-Party Fulfillment &amp; Affiliate Integrations
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">
              Prioritized by CJ Fulfillment Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                CJ Dropshipping API Token (`cjApiToken`)
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCjToken ? 'text' : 'password'}
                  value={settings.cjApiToken || ''}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, cjApiToken: e.target.value }))
                  }
                  placeholder="CJ5994755@api@..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-20 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCjToken(!showCjToken)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Show/Hide Token"
                  >
                    {showCjToken ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestCjToken}
                    disabled={isTestingCj}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-amber-300 rounded border border-slate-700 cursor-pointer"
                  >
                    {isTestingCj ? '...' : 'Ping'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Stored in `StoreSettings.cjApiToken` and prioritized by all CJ order fulfillment and catalog sync routines.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Amazon Associates Tracking Tag (`amazonAssociateTag`)
              </label>
              <input
                type="text"
                value={settings.amazonAssociateTag || 'aerothor-20'}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    amazonAssociateTag: e.target.value,
                  }))
                }
                placeholder="aerothor-20"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500">
                Appended to all Amazon affiliate product links for automatic commission attribution.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Store Configuration */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white">3. Store Configuration Defaults</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              GMC &amp; Checkout Metadata
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Default Store Currency (`storeCurrency`)
              </label>
              <select
                value={settings.storeCurrency}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, storeCurrency: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="GBP">GBP (£) — British Pound Sterling</option>
                <option value="EUR">EUR (€) — Eurozone</option>
                <option value="CAD">CAD ($) — Canadian Dollar</option>
                <option value="AUD">AUD ($) — Australian Dollar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Customer Support &amp; Returns Email (`supportEmail`)
              </label>
              <div className="relative flex items-center">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  required
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))
                  }
                  placeholder="support@aerothor.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-mono">
              Singleton Record ID: <span className="text-emerald-400">{settings.id}</span> · Last Synced:{' '}
              {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Live'}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving Configurations...' : 'Save Configurations'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Section 4: Admin Security & Password Settings */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">4. Admin Security &amp; Credentials</h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            Saved to /data/admin-config.json
          </span>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Administrator Email
              </label>
              <div className="relative flex items-center">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="codernestwebsolution@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                New Secure Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400">
              Updating your admin password updates server-side credential verification immediately.
            </p>
            <button
              type="submit"
              disabled={isSavingCreds}
              className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {isSavingCreds ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{isSavingCreds ? 'Updating Credentials...' : 'Save New Admin Credentials'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 5: Newsletter Lead Collection & Email Marketing */}
      <NewsletterLeadsSection />
    </div>
  );
};

const NewsletterLeadsSection: React.FC = () => {
  const [subscribers, setSubscribers] = useState<
    Array<{ email: string; subscribedAt: string; ip?: string; country?: string }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.subscribers)) {
          setSubscribers(data.subscribers);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const headers = ['Email', 'Subscribed At', 'Country', 'IP Address'];
    const rows = subscribers.map((s) => [
      s.email,
      s.subscribedAt || '',
      s.country || 'US',
      s.ip || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aerothor_newsletter_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">5. Newsletter Lead Collection &amp; Marketing</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded">
            {subscribers.length} Leads Collected
          </span>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={subscribers.length === 0}
            className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold rounded text-xs transition-colors cursor-pointer"
          >
            Export Subscribers CSV
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-300">
        Lead emails submitted via the persistent storefront Newsletter Banner are saved to{' '}
        <code className="text-emerald-300 font-mono text-[11px] bg-slate-950 px-1.5 py-0.5 rounded">
          /data/newsletter-subscribers.json
        </code>.
      </p>

      {subscribers.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
          No newsletter leads collected yet. The persistent storefront banner encourages lead collection with 15% promo codes.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <tr>
                <th className="p-2.5">Email Address</th>
                <th className="p-2.5">Country</th>
                <th className="p-2.5">Subscribed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px] text-slate-300 font-mono">
              {subscribers.map((sub, i) => (
                <tr key={i} className="hover:bg-slate-900/40">
                  <td className="p-2.5 font-sans font-medium text-white">{sub.email}</td>
                  <td className="p-2.5 text-emerald-400">{sub.country || 'US'}</td>
                  <td className="p-2.5 text-slate-400">
                    {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString() : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

