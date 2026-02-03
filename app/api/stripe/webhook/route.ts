import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

async function upsertEntitlement(
  userId: string,
  payload: {
    plan?: string | null;
    is_lifetime?: boolean | null;
    source?: string | null;
  },
) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from('entitlements').upsert(
    {
      user_id: userId,
      plan: payload.plan ?? null,
      is_lifetime: payload.is_lifetime ?? false,
      updated_at: new Date().toISOString(),
      source: payload.source ?? null,
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    console.error('Entitlement upsert error:', error.message);
  }
}

async function updatePremiumUntil(
  userId: string,
  premiumUntil?: string | null,
) {
  if (!premiumUntil) return;
  const supabaseAdmin = createSupabaseAdminClient();
  console.log('updatePremiumUntil ==>', premiumUntil);
  const { error } = await supabaseAdmin
    .from('entitlements')
    .update({ premium_until: premiumUntil })
    .eq('user_id', userId);
  if (error) {
    console.error('Entitlement premium_until update error:', error.message);
  }
}

async function incrementBoostCredits(userId: string, amount: number) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from('boost_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    const { error } = await supabaseAdmin.from('boost_credits').insert({
      user_id: userId,
      credits: amount,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Boost credits insert error:', error.message);
    }
    return;
  }

  const { error } = await supabaseAdmin
    .from('boost_credits')
    .update({
      credits: (data.credits ?? 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (error) {
    console.error('Boost credits update error:', error.message);
  }
}

async function grantBonusBoostsOnce(userId: string, amount: number) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: entitlement } = await supabaseAdmin
    .from('entitlements')
    .select('bonus_boosts_granted')
    .eq('user_id', userId)
    .maybeSingle();

  if (entitlement?.bonus_boosts_granted) return;

  await incrementBoostCredits(userId, amount);
  await supabaseAdmin
    .from('entitlements')
    .update({ bonus_boosts_granted: true })
    .eq('user_id', userId);
}

function getUserIdFromSession(session: Stripe.Checkout.Session) {
  return (session.metadata?.user_id ?? session.client_reference_id) as
    | string
    | undefined;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = getUserIdFromSession(session);
      const sku = session.metadata?.sku;

      if (userId && session.mode === 'subscription' && session.subscription) {
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
        try {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          const currentPeriodEnd = subscription.items.data[0].current_period_end
            ? subscription.items.data[0].current_period_end
            : null;
          console.log('currentPeriodEnd ===>', currentPeriodEnd);
          const premiumUntil = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;
          console.log('premiumUntil ==>', premiumUntil);
          await upsertEntitlement(userId, {
            plan: 'premium',
            source: premiumUntil
              ? 'stripe_subscription'
              : 'stripe_subscription_unknown',
          });
          await updatePremiumUntil(userId, premiumUntil);
          await grantBonusBoostsOnce(userId, 4);
        } catch (error) {
          console.error(
            'Subscription retrieve error:',
            (error as Error).message,
          );
        }
      }

      if (userId && sku === 'premium_lifetime') {
        await upsertEntitlement(userId, {
          plan: 'premium',
          is_lifetime: true,
          source: 'stripe_lifetime',
        });
        await grantBonusBoostsOnce(userId, 4);
      }

      if (userId && sku === 'boost_pack_5') {
        await incrementBoostCredits(userId, 5);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('subscription update:', subscription.items.data[0]);
      const userId = subscription.metadata?.user_id;
      if (userId) {
        const currentPeriodEnd = subscription.items.data[0].current_period_end
          ? subscription.items.data[0].current_period_end
          : null;
        console.log('currentPeriodEnd updated', currentPeriodEnd);
        const premiumUntil = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null;

        console.log('premiumUntil updated', premiumUntil);
        await upsertEntitlement(userId, {
          plan: 'premium',
          source: premiumUntil
            ? 'stripe_subscription'
            : 'stripe_subscription_unknown',
        });
        await updatePremiumUntil(userId, premiumUntil);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        await upsertEntitlement(userId, {
          plan: 'free',
          is_lifetime: false,
          source: 'stripe_subscription',
        });
        await updatePremiumUntil(userId, new Date().toISOString());
      }
      break;
    }
    case 'payment_intent.succeeded': {
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
