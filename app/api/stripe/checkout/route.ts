import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const PRICE_IDS = {
  premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
  premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
  premium_lifetime: process.env.STRIPE_PREMIUM_LIFETIME_PRICE_ID!,
  boost_pack_5: process.env.STRIPE_BOOST_PACK_5_PRICE_ID!,
} as const;

type Sku = keyof typeof PRICE_IDS;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sku } = (await request.json()) as { sku: Sku };
  if (!sku || !PRICE_IDS[sku]) {
    return NextResponse.json({ error: 'Invalid SKU' }, { status: 400 });
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000';
  const priceId = PRICE_IDS[sku];
  const isSubscription = sku === 'premium_monthly' || sku === 'premium_yearly';

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/app?checkout=success&sku=${sku}`,
    cancel_url: `${origin}/app?checkout=cancel`,
    metadata: { user_id: user.id, sku },
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    subscription_data: isSubscription
      ? {
          metadata: { user_id: user.id, sku },
        }
      : undefined,
  });

  return NextResponse.json({ url: session.url });
}
