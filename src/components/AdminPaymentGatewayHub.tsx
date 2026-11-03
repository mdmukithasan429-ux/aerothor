import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Key,
  ShieldCheck,
  Zap,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Globe,
  Sliders,
  DollarSign,
  Layers,
  Sparkles,
  Check,
  Copy,
} from 'lucide-react';
import { getAdminAuthHeaders } from '../lib/admin-auth';

export interface PaymentGatewayConfigState {
  isStripeEnabled: boolean;
  stripeMode: 'live' | 'test';
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;

  isVirtualCardEnabled: boolean;
  virtualCardProvider: 'privacy' | 'stripe_issuing' | 'revolut' | 'custom';
  virtualCardApiKey: string;
  virtualCardMonthlyLimitUsd: number;

  isCodEnabled: boolean;
  codFeeUsd: number;

  isBankWireEnabled: boolean;
  bankIban: string;
  bankSwiftBic: string;
  bankAccountName: string;

  updatedAt?: string;
}

export const AdminPaymentGatewayHub: React.FC = () => {
  const [config, setConfig] = useState<PaymentGatewayConfigState>({
    isStripeEnabled: true,
    stripeMode: 'live',
    stripeSecretKey: 'sk_live_51M0...a8Fz',
    stripePublishableKey: 'pk_live_51M0...b9Gx',
    stripeWebhookSecret: 'whsec_98f...21a',

    isVirtualCardEnabled: true,
    virtualCardProvider: 'stripe_issuing',
    virtualCardApiKey: 'iss_live_883...c91',
    virtualCardMonthlyLimitUsd: 25000,

    isCodEnabled: false,
    codFeeUsd: 4.99,

    isBankWireEnabled: true,
    bankIban: 'US89300000012345678901',
    bankSwiftBic: 'AEROTUS33',
    bankAccountName: 'AeroThor Commerce Inc. Treasury',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTestingStripe, setIsTestingStripe] = useState<boolean>(false);
  const [showStripeSecret, setShowStripeSecret] = useState<boolean>(false);
  const [showVirtualKey, setShowVirtualKey] = useState<boolean>(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPaymentConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        headers: getAdminAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig((prev) => ({ ...prev, ...data.config }));
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load payment gateway config', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentConfig();
  }, []);

  const handleSavePaymentConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ config }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('Payment Gateways & API Keys saved securely to database!');
      } else {
        throw new Error(data.error || 'Failed to save payment configurations');
      }
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestStripeConnection = async () => {
    setIsTestingStripe(true);
    try {
      const res = await fetch('/api/admin/payments/test-stripe', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          secretKey: config.stripeSecretKey,
          mode: config.stripeMode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(`Stripe API connection verified! Mode: ${config.stripeMode.toUpperCase()} (${data.accountName || 'Active Merchant'})`);
      } else {
        throw new Error(data.error || 'Stripe API key verification failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Stripe API verification failed', 'error');
    } finally {
      setIsTestingStripe(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 selection:bg-emerald-500/20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">
              Enterprise Payment Gateway &amp; Virtual Card Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Dynamically configure Stripe keys, Virtual Card issuing APIs, and Cash on Delivery without hardcoding keys in source code.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSavePaymentConfig()}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving Configurations...' : 'Save Payment Configurations'}</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Module 1: Stripe Payment Gateway Configuration */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
              S
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">1. Stripe Credit Card Gateway (256-Bit SSL Tokenized)</h2>
              <p className="text-[11px] text-slate-400">Processes Visa, Mastercard, American Express, Apple Pay, and Google Pay</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.isStripeEnabled}
                onChange={(e) => setConfig({ ...config, isStripeEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="font-semibold">{config.isStripeEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>

            <button
              type="button"
              onClick={handleTestStripeConnection}
              disabled={isTestingStripe}
              className="px-3 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isTestingStripe ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Test API Key</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Stripe Operating Environment</label>
            <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setConfig({ ...config, stripeMode: 'live' })}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  config.stripeMode === 'live'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔴 Live Production Mode
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, stripeMode: 'test' })}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                  config.stripeMode === 'test'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟡 Test Sandbox Mode
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Stripe Webhook Signing Secret</label>
            <div className="relative">
              <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={config.stripeWebhookSecret}
                onChange={(e) => setConfig({ ...config, stripeWebhookSecret: e.target.value })}
                placeholder="whsec_..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Stripe Secret Key (`sk_live_...` or `sk_test_...`)</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showStripeSecret ? 'text' : 'password'}
                value={config.stripeSecretKey}
                onChange={(e) => setConfig({ ...config, stripeSecretKey: e.target.value })}
                placeholder="sk_..."
                className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowStripeSecret(!showStripeSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showStripeSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Stripe Publishable Key (`pk_live_...` or `pk_test_...`)</label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={config.stripePublishableKey}
                onChange={(e) => setConfig({ ...config, stripePublishableKey: e.target.value })}
                placeholder="pk_..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module 2: Corporate Virtual Card Issuing & Auto-Fulfillment Payouts */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
              V
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">2. Corporate Virtual Card Issuing &amp; Wholesale Payouts</h2>
              <p className="text-[11px] text-slate-400">Generates instant single-use virtual cards for CJ dropshipping supplier wholesale auto-deductions</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={config.isVirtualCardEnabled}
              onChange={(e) => setConfig({ ...config, isVirtualCardEnabled: e.target.checked })}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
            />
            <span className="font-semibold">{config.isVirtualCardEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Virtual Card Provider</label>
            <select
              value={config.virtualCardProvider}
              onChange={(e) => setConfig({ ...config, virtualCardProvider: e.target.value as any })}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="stripe_issuing">Stripe Issuing (Corporate Visa/MC)</option>
              <option value="privacy">Privacy.com Virtual Cards</option>
              <option value="revolut">Revolut Business API</option>
              <option value="custom">Custom Corporate Treasury Card</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Issuing API Token / Secret</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showVirtualKey ? 'text' : 'password'}
                value={config.virtualCardApiKey}
                onChange={(e) => setConfig({ ...config, virtualCardApiKey: e.target.value })}
                placeholder="iss_live_..."
                className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowVirtualKey(!showVirtualKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showVirtualKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Monthly Spending Limit ($ USD)</label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                value={config.virtualCardMonthlyLimitUsd}
                onChange={(e) => setConfig({ ...config, virtualCardMonthlyLimitUsd: Number(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: Cash on Delivery & Direct Wire Transfer */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">
              C
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">3. Cash on Delivery (COD) &amp; Corporate Wire Transfer</h2>
              <p className="text-[11px] text-slate-400">Configure COD surcharge fees and B2B wire payment instructions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* COD Options */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Cash on Delivery (COD)</span>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isCodEnabled}
                  onChange={(e) => setConfig({ ...config, isCodEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                />
                <span>{config.isCodEnabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-400">COD Surcharge Fee ($ USD)</label>
              <input
                type="number"
                value={config.codFeeUsd}
                onChange={(e) => setConfig({ ...config, codFeeUsd: Number(e.target.value) || 0 })}
                className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Wire Options */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">B2B Wire / IBAN Bank Transfer</span>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isBankWireEnabled}
                  onChange={(e) => setConfig({ ...config, isBankWireEnabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                />
                <span>{config.isBankWireEnabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400">IBAN / Account #</label>
                <input
                  type="text"
                  value={config.bankIban}
                  onChange={(e) => setConfig({ ...config, bankIban: e.target.value })}
                  className="w-full py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-slate-400">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={config.bankSwiftBic}
                  onChange={(e) => setConfig({ ...config, bankSwiftBic: e.target.value })}
                  className="w-full py-1.5 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentGatewayHub;
