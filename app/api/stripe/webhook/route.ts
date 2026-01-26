import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function upsertEntitlement(
  userId: string,
  payload: {
    plan?: string | null;
    premium_until?: string | null;
    is_lifetime?: boolean | null;
    source?: string | null;
  }
) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("entitlements").upsert({
    user_id: userId,
    plan: payload.plan ?? null,
    premium_until: payload.premium_until ?? null,
    is_lifetime: payload.is_lifetime ?? false,
    updated_at: new Date().toISOString(),
    source: payload.source ?? null,
  });
  if (error) {
    console.error("Entitlement upsert error:", error.message);
  }
}

async function incrementBoostCredits(userId: string, amount: number) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("boost_credits")
    .select("credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    const { error } = await supabaseAdmin.from("boost_credits").insert({
      user_id: userId,
      credits: amount,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Boost credits insert error:", error.message);
    }
    return;
  }

  const { error } = await supabaseAdmin
    .from("boost_credits")
    .update({
      credits: (data.credits ?? 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) {
    console.error("Boost credits update error:", error.message);
  }
}

function getUserIdFromSession(session: Stripe.Checkout.Session) {
  return (session.metadata?.user_id ?? session.client_reference_id) as string | undefined;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = getUserIdFromSession(session);
      const sku = session.metadata?.sku;

      if (userId && session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const currentPeriodEnd = "current_period_end" in subscription
            ? (subscription as { current_period_end?: number | null }).current_period_end
            : null;
          const premiumUntil = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;
          await upsertEntitlement(userId, {
            plan: "premium",
            premium_until: premiumUntil,
            source: premiumUntil ? "stripe_subscription" : "stripe_subscription_unknown",
          });
        } catch (error) {
          console.error("Subscription retrieve error:", (error as Error).message);
        }
      }

      if (userId && sku === "premium_lifetime") {
        await upsertEntitlement(userId, {
          plan: "premium",
          is_lifetime: true,
          source: "stripe_lifetime",
        });
      }

      if (userId && sku === "boost_pack_5") {
        await incrementBoostCredits(userId, 5);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        let currentPeriodEnd =
          "current_period_end" in subscription
            ? (subscription as { current_period_end?: number | null }).current_period_end
            : null;
        if (!currentPeriodEnd && subscription.id) {
          try {
            const fresh = await stripe.subscriptions.retrieve(subscription.id);
            currentPeriodEnd =
              "current_period_end" in fresh
                ? (fresh as { current_period_end?: number | null }).current_period_end
                : null;
          } catch (error) {
            console.error("Subscription refresh error:", (error as Error).message);
          }
        }
        const premiumUntil = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
        await upsertEntitlement(userId, {
          plan: "premium",
          premium_until: premiumUntil,
          source: premiumUntil ? "stripe_subscription" : "stripe_subscription_unknown",
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        await upsertEntitlement(userId, {
          plan: "free",
          premium_until: new Date().toISOString(),
          is_lifetime: false,
          source: "stripe_subscription",
        });
      }
      break;
    }
    case "payment_intent.succeeded": {
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
