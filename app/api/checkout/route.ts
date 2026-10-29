import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Initialize Stripe SDK with secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    })
  : null;

export interface CheckoutCartItemInput {
  id: string;
  sku?: string;
  title: string;
  price: number | string;
  quantity: number;
  image?: string;
  currency?: string;
}

/**
 * POST /api/checkout
 * Creates a Stripe Checkout Session targeting USA & UK markets.
 * Supports Cards, Apple Pay, and Google Pay automatically via Stripe Checkout.
 */
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            'Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env.local file.',
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      items,
      customerEmail,
      shippingMethod = 'free',
      currency = 'usd',
      country = 'US',
    }: {
      items: CheckoutCartItemInput[];
      customerEmail?: string;
      shippingMethod?: 'free' | 'express';
      currency?: string;
      country?: string;
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. At least one item is required to create a checkout session.' },
        { status: 400 }
      );
    }

    const normalizedCurrency = currency.toLowerCase() === 'gbp' ? 'gbp' : 'usd';

    // Map cart items to Stripe Checkout line_items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const numericPrice =
        typeof item.price === 'number'
          ? item.price
          : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;

      const unitAmountCents = Math.max(50, Math.round(numericPrice * 100));

      return {
        quantity: Math.max(1, Number(item.quantity) || 1),
        price_data: {
          currency: normalizedCurrency,
          unit_amount: unitAmountCents,
          product_data: {
            name: String(item.title || 'Product').slice(0, 150),
            description: `SKU: ${item.sku || item.id} · Fast 3-7 Day Domestic US/UK Dispatch`,
            images:
              item.image && item.image.startsWith('https://') ? [item.image] : undefined,
            metadata: {
              productId: String(item.id),
              sku: String(item.sku || item.id),
            },
          },
        },
      };
    });

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';

    // Create Stripe Checkout Session supporting Cards, Apple Pay, and Google Pay
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerEmail || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'CA', 'AU'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: normalizedCurrency,
            },
            display_name: 'Standard Domestic Dispatch (US/UK Warehouse)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 799,
              currency: normalizedCurrency,
            },
            display_name: 'Priority Express Airway (USPS / Royal Mail 48)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 3 },
            },
          },
        },
      ],
      metadata: {
        targetMarket: country,
        shippingMethod,
        itemCount: String(items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)),
      },
      success_url: `${origin}/?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?stripe_checkout=cancelled`,
    });

    return NextResponse.json(
      {
        success: true,
        sessionId: session.id,
        url: session.url,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Stripe Checkout API Error]:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create Stripe Checkout session.',
      },
      { status: 500 }
    );
  }
}
