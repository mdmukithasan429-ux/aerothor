import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  id: 'singleton',
  isStripeEnabled: true,
  isCodEnabled: false,
  cjApiToken:
    process.env.CJ_API_KEY ||
    'CJ5994755@api@2bc8a55e048b442388da8f746d2f81f7',
  storeCurrency: 'USD',
  supportEmail: 'support@aerothor.com',
  amazonAssociateTag: 'aerothor-20',
  autoDeductEnabled: true,
};

export async function GET() {
  try {
    let settings = await (prisma as any).storeSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = await (prisma as any).storeSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.warn('[GET /api/admin/settings Fallback]:', error.message);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      isStripeEnabled,
      isCodEnabled,
      cjApiToken,
      storeCurrency,
      supportEmail,
      amazonAssociateTag,
      autoDeductEnabled,
    } = body || {};

    const updated = await (prisma as any).storeSettings.upsert({
      where: { id: 'singleton' },
      update: {
        ...(isStripeEnabled !== undefined ? { isStripeEnabled: Boolean(isStripeEnabled) } : {}),
        ...(isCodEnabled !== undefined ? { isCodEnabled: Boolean(isCodEnabled) } : {}),
        ...(cjApiToken !== undefined ? { cjApiToken: String(cjApiToken).trim() } : {}),
        ...(storeCurrency ? { storeCurrency: String(storeCurrency).toUpperCase().trim() } : {}),
        ...(supportEmail ? { supportEmail: String(supportEmail).trim() } : {}),
        ...(amazonAssociateTag ? { amazonAssociateTag: String(amazonAssociateTag).trim() } : {}),
        ...(autoDeductEnabled !== undefined ? { autoDeductEnabled: Boolean(autoDeductEnabled) } : {}),
      },
      create: {
        id: 'singleton',
        isStripeEnabled: isStripeEnabled !== undefined ? Boolean(isStripeEnabled) : true,
        isCodEnabled: isCodEnabled !== undefined ? Boolean(isCodEnabled) : false,
        cjApiToken:
          cjApiToken !== undefined
            ? String(cjApiToken).trim()
            : DEFAULT_SETTINGS.cjApiToken,
        storeCurrency: storeCurrency ? String(storeCurrency).toUpperCase().trim() : 'USD',
        supportEmail: supportEmail ? String(supportEmail).trim() : 'support@aerothor.com',
        amazonAssociateTag: amazonAssociateTag ? String(amazonAssociateTag).trim() : 'aerothor-20',
        autoDeductEnabled: autoDeductEnabled !== undefined ? Boolean(autoDeductEnabled) : true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'StoreSettings singleton updated in PostgreSQL.',
      settings: updated,
    });
  } catch (error: any) {
    console.error('[PUT /api/admin/settings Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update StoreSettings.' },
      { status: 500 }
    );
  }
}
