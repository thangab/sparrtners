import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Sku =
  | 'premium_monthly'
  | 'premium_yearly'
  | 'premium_lifetime'
  | 'boost_pack_5';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.json(
      { error: 'Authentication required', redirect: `${siteUrl}/login` },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { sku?: Sku };
  const sku = body.sku ?? 'premium_yearly';

  const priceMap: Record<Sku, string | undefined> = {
    premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    premium_lifetime: process.env.STRIPE_PREMIUM_LIFETIME_PRICE_ID,
    boost_pack_5: process.env.STRIPE_BOOST_PACK_5_PRICE_ID,
  };

  const priceId = priceMap[sku];
  if (!priceId) {
    return NextResponse.json({ error: 'Price ID manquant' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const successUrl = `${siteUrl}/app?checkout=success`;
  const cancelUrl = `${siteUrl}/pricing?checkout=cancel`;

  const mode: Stripe.Checkout.SessionCreateParams.Mode =
    sku === 'premium_monthly' || sku === 'premium_yearly'
      ? 'subscription'
      : 'payment';

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      sku,
      user_id: user.id,
    },
    subscription_data:
      mode === 'subscription'
        ? {
            metadata: {
              sku,
              user_id: user.id,
            },
          }
        : undefined,
  });

  return NextResponse.json({ url: session.url });
}
