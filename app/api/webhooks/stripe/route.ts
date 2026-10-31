import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PHASE 4: POST /api/webhooks/stripe
 * Securely listens for `checkout.session.completed`.
 * Extracts customer shipping address and purchased SKUs, then saves them into PostgreSQL
 * with status = "Paid - Ready for CJ Fulfill".
 * CRITICAL: Does NOT include any CJ auto-pay API logic (merchant manually pays CJ with US Visa).
 */
export async function POST(req: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const signature = req.headers.get('stripe-signature') || '';

    if (!stripeSecret || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });

    const rawBody = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (verifyErr: any) {
      console.error('[Stripe Webhook Signature Verification Failed]:', verifyErr.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${verifyErr.message}` },
        { status: 400 }
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderNumber =
        session.metadata?.orderNumber ||
        `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      const shippingDetails = (session as any).shipping_details || session.customer_details;
      const address = shippingDetails?.address;

      const formattedAddress = address
        ? [
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.postal_code,
            address.country,
          ]
            .filter(Boolean)
            .join(', ')
        : 'Address pending verification';

      const purchasedSkus = session.metadata?.purchasedSkus || '';
      let itemsJson: any = [];
      try {
        if (session.metadata?.purchasedSkusJson) {
          itemsJson = JSON.parse(session.metadata.purchasedSkusJson);
        }
      } catch {
        itemsJson = [{ sku: purchasedSkus }];
      }

      const totalAmount =
        typeof session.amount_total === 'number' ? session.amount_total / 100 : 0;

      // Save order into Prisma PostgreSQL with status "Paid - Ready for CJ Fulfill"
      // Intentionally NO CJ auto-pay call so merchant can manually pay CJ via US Visa.
      const savedOrder = await prisma.order.upsert({
        where: { stripeSessionId: session.id },
        update: {
          status: 'Paid - Ready for CJ Fulfill',
          customerName: shippingDetails?.name || session.customer_details?.name || 'Verified Customer',
          customerEmail: session.customer_details?.email || session.customer_email || 'customer@aerothor.com',
          customerPhone: session.customer_details?.phone || null,
          shippingAddress: formattedAddress,
          shippingCity: address?.city || null,
          shippingState: address?.state || null,
          shippingZip: address?.postal_code || null,
          shippingCountry: address?.country || 'US',
          purchasedSkus,
          itemsJson,
          totalAmount,
          currency: (session.currency || 'usd').toUpperCase(),
        },
        create: {
          orderNumber,
          stripeSessionId: session.id,
          status: 'Paid - Ready for CJ Fulfill',
          customerName: shippingDetails?.name || session.customer_details?.name || 'Verified Customer',
          customerEmail: session.customer_details?.email || session.customer_email || 'customer@aerothor.com',
          customerPhone: session.customer_details?.phone || null,
          shippingAddress: formattedAddress,
          shippingCity: address?.city || null,
          shippingState: address?.state || null,
          shippingZip: address?.postal_code || null,
          shippingCountry: address?.country || 'US',
          purchasedSkus,
          itemsJson,
          totalAmount,
          currency: (session.currency || 'usd').toUpperCase(),
        },
      });

      return NextResponse.json({
        received: true,
        orderNumber: savedOrder.orderNumber,
        status: savedOrder.status,
      });
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch (err: any) {
    console.error('[POST /api/webhooks/stripe Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Stripe Webhook handler failed' },
      { status: 500 }
    );
  }
}
