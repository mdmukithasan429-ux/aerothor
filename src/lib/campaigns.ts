export type CampaignPlacement = 'HERO_BANNER' | 'IN_GRID';

export interface Campaign {
  id: string;
  brandName: string;
  promoTitle: string;
  imageUrl: string;
  vanityLink: string;
  placement: CampaignPlacement;
  isActive: boolean;
  discountCode?: string;
  ctaText?: string;
  badgeText?: string;
  createdAt: string;
}

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-impact-001',
    brandName: 'EcoFlow Official',
    promoTitle: 'DELTA Pro 3 Portable Power Station & 400W Solar Kit - Up to $800 Off',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80&fm=webp',
    vanityLink: 'https://impact.com/v/aerothor-ecoflow-delta-pro',
    placement: 'HERO_BANNER',
    isActive: true,
    discountCode: 'AEROTHOR100',
    ctaText: 'Claim Impact Partner Deal',
    badgeText: 'Impact High-Ticket Offer',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cmp-impact-002',
    brandName: 'DJI Enterprise & Expedition',
    promoTitle: 'DJI Avata 2 Fly More Combo - Exclusive Impact Partner 4K HDR Drone Bundle',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80',
    vanityLink: 'https://impact.com/v/aerothor-dji-avata-2',
    placement: 'HERO_BANNER',
    isActive: true,
    discountCode: 'DJIFLY50',
    ctaText: 'Unlock Exclusive Bundle',
    badgeText: 'Impact Official Partner',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cmp-impact-003',
    brandName: 'Jackery Solar',
    promoTitle: 'Jackery Solar Generator 2000 Plus - $600 Cashback for Expedition Members',
    imageUrl: 'https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&w=800&q=80',
    vanityLink: 'https://impact.com/v/aerothor-jackery-2000',
    placement: 'IN_GRID',
    isActive: true,
    discountCode: 'JACKERY200',
    ctaText: 'View Impact Deal',
    badgeText: 'Sponsored Impact Deal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cmp-impact-004',
    brandName: 'Peak Design',
    promoTitle: 'Everyday Backpack 30L V2 + Tech Pouch Bundle - Verified Merchant Offer',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    vanityLink: 'https://impact.com/v/aerothor-peakdesign-everyday',
    placement: 'IN_GRID',
    isActive: true,
    discountCode: 'PEAK15',
    ctaText: 'Shop Sponsored Partner',
    badgeText: 'Sponsored Placement',
    createdAt: new Date().toISOString(),
  },
];
