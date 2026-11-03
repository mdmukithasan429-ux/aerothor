export interface StoreSettings {
  id: string;
  storeName: string;
  supportEmail: string;
  phoneNumber: string;
  physicalAddress: string;
  logoUrl: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  copyrightText: string;
  isStripeEnabled: boolean;
  isCodEnabled: boolean;
  cjApiToken: string;
  storeCurrency: string;
  amazonAssociateTag: string;
  autoDeductEnabled: boolean;
  updatedAt?: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'singleton',
  storeName: 'AeroThor Performance Essentials',
  supportEmail: 'support@aerothor.com',
  phoneNumber: '+1 (800) 555-0199',
  physicalAddress: '1209 North Orange St, Wilmington, DE 19801',
  logoUrl: '',
  primaryColorHex: '#10B981',
  secondaryColorHex: '#059669',
  copyrightText: '© 2026 AeroThor Operations Inc. All rights reserved.',
  isStripeEnabled: true,
  isCodEnabled: false,
  cjApiToken: 'CJ5994755@api@2bc8a55e048b442388da8f746d2f81f7',
  storeCurrency: 'USD',
  amazonAssociateTag: 'aerothor-20',
  autoDeductEnabled: true,
  updatedAt: new Date().toISOString(),
};

/**
  Injects or updates CSS custom variables on the document head
  mapping primaryColorHex to live theme highlights.
 */
export function applyPrimaryColorToDocument(hexColor?: string) {
  if (typeof document === 'undefined') return;
  const targetColor = hexColor && /^#[0-9A-F]{6}$/i.test(hexColor) ? hexColor : '#10B981';

  let styleTag = document.getElementById('aero-theme-dynamic-styles') as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'aero-theme-dynamic-styles';
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    :root {
      --brand-primary: ${targetColor};
    }
    .bg-brand-primary {
      background-color: var(--brand-primary) !important;
    }
    .text-brand-primary {
      color: var(--brand-primary) !important;
    }
    .border-brand-primary {
      border-color: var(--brand-primary) !important;
    }
  `;
}
