import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckoutButton } from '@/components/app/checkout-button';
import { DashboardActivityChart } from '@/components/app/dashboard-activity-chart';
import {
  DashboardMiniTable,
  dashboardRequestsColumns,
  dashboardSessionsColumns,
  type DashboardRequestRow,
  type DashboardSessionRow,
} from '@/components/app/dashboard-mini-table';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { getEntitlements, isPremium } from '@/lib/entitlements';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  const { count: createdSessionsCount } = user
    ? await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', user.id)
    : { count: 0 };
  const { count: createdSessionsMonthCount } = user
    ? await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())
    : { count: 0 };
  const { count: sentRequestsCount } = user
    ? await supabase
        .from('session_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
    : { count: 0 };
  const { count: sentRequestsMonthCount } = user
    ? await supabase
        .from('session_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString())
        .lt('created_at', nextMonthStart.toISOString())
    : { count: 0 };

  const [recentSessionsResult, recentRequestsResult] = await Promise.all([
    user
      ? supabase
          .from('sessions')
          .select(
            `
            id,
            created_at,
            is_published,
            training_type:training_types(name)
          `,
          )
          .eq('host_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from('session_requests')
          .select(
            `
            id,
            created_at,
            status,
            session:sessions (
              training_type:training_types(name)
            )
          `,
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
  ]);

  const formatShortDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'medium',
        }).format(new Date(value))
      : '';

  const normalizeOne = <T,>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

  const recentSessions: DashboardSessionRow[] = (
    (recentSessionsResult as { data?: Array<{ id: string; created_at: string; is_published: boolean; training_type?: { name?: string | null } | { name?: string | null }[] | null }> })
      .data ?? []
  ).map((session) => ({
    id: session.id,
    title: `Session de ${normalizeOne(session.training_type)?.name ?? 'Entraînement'}`,
    created_at: formatShortDate(session.created_at),
    is_published: session.is_published,
  }));

  const recentRequests: DashboardRequestRow[] = (
    (recentRequestsResult as { data?: Array<{ id: string; created_at: string; status: string; session?: { training_type?: { name?: string | null } | { name?: string | null }[] | null } | { training_type?: { name?: string | null } | { name?: string | null }[] | null }[] | null }> })
      .data ?? []
  ).map((request) => ({
    id: request.id,
    title: `Session de ${
      normalizeOne(normalizeOne(request.session)?.training_type)?.name ??
      'Entraînement'
    }`,
    created_at: formatShortDate(request.created_at),
    status: request.status,
  }));

  const remainingSessions = Math.max(0, 4 - (monthlySessionCount ?? 0));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
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
              <Button variant="default" asChild>
                <Link href="/pricing">Upgrade mon plan</Link>
              </Button>
              {/* <CheckoutButton sku="premium_monthly" label="PRO mensuel" />
              <CheckoutButton
                sku="premium_yearly"
                label="PRO annuel"
                variant="secondary"
              />
              <CheckoutButton
                sku="premium_lifetime"
                label="PRO à vie"
                variant="outline"
              /> */}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Boosts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* <div className="flex items-center gap-2 text-sm">
              Pour mettre en avant tes sessions et attirer plus de partenaires,
              utilise les boosts pour apparaître en haut des résultats de
              recherche pendant 24 heures.
            </div> */}
            <p className="text-sm text-muted-foreground">
              Crédits disponibles:{' '}
              <span className="font-semibold">{creditsData?.credits ?? 0}</span>
            </p>
            <CheckoutButton
              sku="boost_pack_5"
              label="Acheter 5 boosts"
              variant="default"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sessions créées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-3xl">
              {createdSessionsCount ?? 0}
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {createdSessionsMonthCount ?? 0} ce mois-ci
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demandes envoyées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-3xl">
              {sentRequestsCount ?? 0}
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {sentRequestsMonthCount ?? 0} ce mois-ci
            </div>
          </CardContent>
        </Card>
      </div>
      <DashboardActivityChart />
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardMiniTable
          title="Mes sessions"
          linkHref="/app/sessions/requests"
          linkTab="host"
          linkLabel="Voir plus"
          emptyLabel="Aucune session récente."
          data={recentSessions}
          columns={dashboardSessionsColumns}
        />
        <DashboardMiniTable
          title="Mes demandes"
          linkHref="/app/sessions/requests"
          linkTab="requester"
          linkLabel="Voir plus"
          emptyLabel="Aucune demande récente."
          data={recentRequests}
          columns={dashboardRequestsColumns}
        />
      </div>
    </div>
  );
}
