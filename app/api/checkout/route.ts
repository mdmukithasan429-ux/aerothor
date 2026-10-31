import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * PHASE 4: POST /api/checkout
 * Generates a Stripe Checkout Session from cart items supporting Cards, Apple Pay, and Google Pay.
 * Does NOT execute CJ auto-pay API logic (orders are saved via webhook with status "Paid - Ready for CJ Fulfill").
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items = [],
      customerEmail,
      country = 'US',
      currency = 'usd',
      shippingMethod = 'free',
    } = body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Provide at least one item to start checkout.' },
        { status: 400 }
      );
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeSecret) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY environment variable.' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://e-commerce-dropshiping-store.vercel.app';

    const normalizedCurrency = String(currency).toLowerCase() === 'gbp' ? 'gbp' : 'usd';
    const orderNumber = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const sanitizedItems = items.map((item: any) => {
      const unitPrice =
        typeof item.price === 'number'
          ? item.price
          : parseFloat(String(item.price || '0').replace(/[^0-9.]/g, '')) || 29.99;
      const sku = String(item.variantSku || item.sku || item.id || 'AERO-SKU').trim();
      const variantLabel = [item.size, item.color].filter(Boolean).join(' / ');
      const title = variantLabel
        ? `${String(item.title || 'Product')} (${variantLabel})`
        : String(item.title || 'Product');

      return {
        sku,
        cjVid: item.cjVid || item.cj_vid || '',
        title: title.slice(0, 140),
        price: unitPrice,
        quantity: Math.max(1, Number(item.quantity) || 1),
        image: String(item.image || item.image_link || ''),
        size: item.size || '',
        color: item.color || '',
      };
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = sanitizedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: normalizedCurrency,
        unit_amount: Math.max(50, Math.round(item.price * 100)),
        product_data: {
          name: item.title,
          description: `SKU: ${item.sku} · Fast US/UK Tracked Dispatch`,
          images: item.image.startsWith('https://') ? [item.image] : undefined,
          metadata: {
            sku: item.sku,
            cjVid: item.cjVid,
            size: item.size,
            color: item.color,
          },
        },
      },
    }));

    // Calculate accurate shipping cost based on items' isFreeShipping and shippingCost
    const nonFreeItems = items.filter(
      (item: any) => item.isFreeShipping === false && Number(item.shippingCost) > 0
    );
    const calculatedShippingCost =
      nonFreeItems.length === 0
        ? 0
        : Math.max(...nonFreeItems.map((item: any) => Number(item.shippingCost) || 0));
    const standardShippingAmountCents = Math.round(calculatedShippingCost * 100);

    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: standardShippingAmountCents, currency: normalizedCurrency },
          display_name:
            standardShippingAmountCents === 0
              ? 'Free Domestic Tracked Shipping (3-7 Business Days)'
              : `Standard Tracked Shipping ($${calculatedShippingCost.toFixed(2)})`,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 7 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: standardShippingAmountCents + 799, currency: normalizedCurrency },
          display_name: 'Priority Express Airway (2-3 Business Days)',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 2 },
            maximum: { unit: 'business_day', value: 3 },
          },
        },
      },
    ];

    // Supports Cards, Apple Pay, and Google Pay automatically via Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: customerEmail || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'CA', 'AU'],
      },
      shipping_options: shippingOptions,
      metadata: {
        orderNumber,
        targetMarket: country,
        shippingMethod,
        isFreeShipping: String(calculatedShippingCost === 0),
        shippingCost: String(calculatedShippingCost),
        purchasedSkus: sanitizedItems.map((i) => i.sku).join(','),
        purchasedSkusJson: JSON.stringify(sanitizedItems).slice(0, 490),
      },
      success_url: `${origin}/track-order?order=${encodeURIComponent(orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      orderNumber,
      url: session.url,
    });
  } catch (err: any) {
    console.error('[POST /api/checkout Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create Stripe Checkout session' },
      { status: 500 }
    );
  }
}
