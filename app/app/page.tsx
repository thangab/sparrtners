import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/app/checkout-button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { getEntitlements, isPremium } from '@/lib/entitlements';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const entitlement = user ? await getEntitlements(user.id) : null;
  const premium = isPremium(entitlement);

  const { data: creditsData } = await supabase
    .from('boost_credits')
    .select('credits')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();

  const { count: monthlySessionCount } =
    !premium && user
      ? await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('host_id', user.id)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', nextMonthStart.toISOString())
      : { count: null };

  const remainingSessions = Math.max(0, 4 - (monthlySessionCount ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground">
          Gère ton plan et tes sessions à venir.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan actuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={premium ? 'default' : 'secondary'}>
                {premium ? 'PRO' : 'Free'}
              </Badge>
              {entitlement?.is_lifetime ? (
                <span className="text-sm text-muted-foreground">Lifetime</span>
              ) : null}
              {entitlement?.premium_until ? (
                <span className="text-sm text-muted-foreground">
                  Jusquau{' '}
                  {new Date(entitlement.premium_until).toLocaleDateString(
                    'fr-FR',
                  )}
                </span>
              ) : null}
            </div>
            {!premium ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Sessions restantes ce mois-ci:{' '}
                  <span className="font-semibold text-foreground">
                    {remainingSessions} / 4
                  </span>
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <CheckoutButton sku="premium_monthly" label="PRO mensuel" />
              <CheckoutButton
                sku="premium_yearly"
                label="PRO annuel"
                variant="secondary"
              />
              <CheckoutButton
                sku="premium_lifetime"
                label="PRO à vie"
                variant="outline"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Boosts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Crédits disponibles:{' '}
              <span className="font-semibold">{creditsData?.credits ?? 0}</span>
            </p>
            <CheckoutButton
              sku="boost_pack_5"
              label="Acheter 5 boosts"
              variant="secondary"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
