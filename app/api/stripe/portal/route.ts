import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json(
      { error: "Impossible d'ouvrir le portail de facturation sans email." },
      { status: 400 },
    );
  }

  const customers = await stripe.customers.list({
    email: user.email,
    limit: 20,
  });

  const customer =
    customers.data.find((item) => item.metadata?.user_id === user.id) ??
    customers.data[0];

  if (!customer?.id) {
    return NextResponse.json(
      {
        error:
          "Aucun client Stripe trouvé pour ce compte. Contacte le support si besoin.",
      },
      { status: 404 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${siteUrl}/app/settings/account`,
  });

  return NextResponse.json({ url: session.url });
}
