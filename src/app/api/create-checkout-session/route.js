import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Minimum amounts per currency (in smallest unit)
const CURRENCY_MINIMUMS = {
  usd: 100,  // $1.00
  eur: 100,  // €1.00
  gbp: 100,  // £1.00
  cad: 100,
  aud: 100,
  jpy: 100,  // ¥100 (yen has no decimals)
  default: 100,
};

const MAX_AMOUNT = 100000_00; // $100,000 in cents — hard ceiling

export async function POST(request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe checkout is not configured.' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    });

    const { amount, currency = 'eur' } = await request.json();

    const cur = currency.toLowerCase();
    const min = CURRENCY_MINIMUMS[cur] ?? CURRENCY_MINIMUMS.default;

    if (!amount || typeof amount !== 'number' || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: 'Amount must be a positive integer (in smallest currency unit).' },
        { status: 400 }
      );
    }

    if (amount < min) {
      return NextResponse.json(
        { error: `Minimum donation is ${min / 100} ${cur.toUpperCase()}.` },
        { status: 400 }
      );
    }

    if (amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: 'Maximum donation amount exceeded.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.marxist.info';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: cur,
            product_data: {
              name: 'Support Marxist.info',
              description:
                'Your donation helps keep the platform independent, ad-free, and growing.',
              images: [`${baseUrl}/marx.png`],
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      submit_type: 'donate',
      success_url: `${baseUrl}/?donated=true`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        source: 'marxist-info-landing',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe] create-checkout-session error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session.' },
      { status: 500 }
    );
  }
}
