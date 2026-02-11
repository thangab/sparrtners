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
import { DashboardNextSessionCard } from '@/components/app/dashboard-next-session-card';
import { BoostHelpPopover } from '@/components/app/boost-help-popover';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Rocket,
  Sparkles,
  Users2,
} from 'lucide-react';

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
  const nowIso = now.toISOString();

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
  const [hostCompletedRowsResult, requesterCompletedRowsResult] = user
    ? await Promise.all([
        supabase
          .from('session_requests')
          .select(
            `
            session_id,
            session:sessions!inner(
              starts_at
            )
          `,
          )
          .eq('status', 'accepted')
          .eq('session.host_id', user.id)
          .lt('session.starts_at', nowIso),
        supabase
          .from('session_requests')
          .select(
            `
            session_id,
            session:sessions!inner(
              starts_at
            )
          `,
          )
          .eq('status', 'accepted')
          .eq('user_id', user.id)
          .lt('session.starts_at', nowIso),
      ])
    : [{ data: [] }, { data: [] }];

  const completedSessionRows = [
    ...(((hostCompletedRowsResult as { data?: unknown[] }).data ??
      []) as Array<{
      session_id: string;
      session?: { starts_at?: string | null } | { starts_at?: string | null }[];
    }>),
    ...(((requesterCompletedRowsResult as { data?: unknown[] }).data ??
      []) as Array<{
      session_id: string;
      session?: { starts_at?: string | null } | { starts_at?: string | null }[];
    }>),
  ];

  const completedSessionMap = new Map<string, string>();
  completedSessionRows.forEach((row) => {
    const session = Array.isArray(row.session)
      ? (row.session[0] ?? null)
      : (row.session ?? null);
    const startsAt = session?.starts_at ?? null;
    if (!row.session_id || !startsAt) return;
    completedSessionMap.set(row.session_id, startsAt);
  });

  const completedSessionsCount = completedSessionMap.size;
  const completedSessionsMonthCount = Array.from(
    completedSessionMap.values(),
  ).filter((startsAt) => {
    const date = new Date(startsAt);
    return date >= monthStart && date < nextMonthStart && date < now;
  }).length;

  const [recentSessionsResult, recentRequestsResult] = await Promise.all([
    user
      ? supabase
          .from('sessions')
          .select(
            `
            id,
            starts_at,
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
            session_id,
            created_at,
            status,
            session:sessions (
              starts_at,
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
    (
      recentSessionsResult as {
        data?: Array<{
          id: string;
          starts_at: string | null;
          created_at: string;
          is_published: boolean;
          training_type?:
            | { name?: string | null }
            | { name?: string | null }[]
            | null;
        }>;
      }
    ).data ?? []
  ).map((session) => ({
    id: session.id,
    title: `Session de ${normalizeOne(session.training_type)?.name ?? 'Entraînement'}`,
    starts_at: formatShortDate(session.starts_at),
    is_published: session.is_published,
  }));

  const recentRequests: DashboardRequestRow[] = (
    (
      recentRequestsResult as {
        data?: Array<{
          id: string;
          session_id: string;
          created_at: string;
          status: string;
          session?:
            | {
                starts_at?: string | null;
                training_type?:
                  | { name?: string | null }
                  | { name?: string | null }[]
                  | null;
              }
            | {
                starts_at?: string | null;
                training_type?:
                  | { name?: string | null }
                  | { name?: string | null }[]
                  | null;
              }[]
            | null;
        }>;
      }
    ).data ?? []
  ).map((request) => ({
    id: request.id,
    session_id: request.session_id,
    title: `Session de ${
      normalizeOne(normalizeOne(request.session)?.training_type)?.name ??
      'Entraînement'
    }`,
    starts_at: formatShortDate(normalizeOne(request.session)?.starts_at),
    status: request.status,
  }));

  const remainingSessions = Math.max(0, 4 - (monthlySessionCount ?? 0));

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <section className="w-full max-w-full min-w-0 rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,#fff7ed_0,#ffffff_50%,#f8fafc_100%)] px-5 py-5 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.5)] md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Ton cockpit d&apos;entraînement
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 md:text-base">
              Suis ton activité, prépare ta prochaine session et active
              rapidement les actions importantes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              <Link href="/app/sessions/new">
                Créer une session
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/sessions/requests">Mes sessions</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-12">
        <Card className="border-slate-200/80 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Plan actuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={premium ? 'default' : 'secondary'}>
                {premium ? 'PRO' : 'Free'}
              </Badge>
              {entitlement?.is_lifetime ? (
                <span className="text-sm text-muted-foreground">Lifetime</span>
              ) : null}
              {entitlement?.premium_until ? (
                <span className="text-sm text-muted-foreground">
                  Jusqu&apos;au{' '}
                  {new Date(entitlement.premium_until).toLocaleDateString(
                    'fr-FR',
                  )}
                </span>
              ) : null}
              <Button asChild>
                <Link href="/pricing">Voir les offres</Link>
              </Button>
            </div>
            {!premium ? (
              <div className="rounded-xl border border-orange-100 bg-orange-50/70 px-3 py-2 text-sm text-slate-700">
                Sessions restantes ce mois-ci:{' '}
                <span className="font-semibold text-slate-900">
                  {remainingSessions} / 4
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-800">
                Tu as accès à toutes les publications et fonctionnalités.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4 text-slate-700" />
              Boosts
              <BoostHelpPopover />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Crédits disponibles:{' '}
              <span className="font-semibold text-slate-900">
                {creditsData?.credits ?? 0}
              </span>
            </p>
            <CheckoutButton
              sku="boost_pack_5"
              label="Acheter 5 boosts"
              variant="default"
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Sessions complétées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-black text-slate-900">
              {completedSessionsCount ?? 0}
            </p>
            <p className="text-sm text-slate-500">
              {completedSessionsMonthCount ?? 0} ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <Flame className="h-4 w-4 text-orange-500" />
              Sessions créées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-black text-slate-900">
              {createdSessionsCount ?? 0}
            </p>
            <p className="text-sm text-slate-500">
              {createdSessionsMonthCount ?? 0} ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-700">
              <Users2 className="h-4 w-4 text-slate-700" />
              Demandes envoyées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-black text-slate-900">
              {sentRequestsCount ?? 0}
            </p>
            <p className="text-sm text-slate-500">
              {sentRequestsMonthCount ?? 0} ce mois-ci
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1fr_1.3fr] xl:items-start">
        <DashboardNextSessionCard userId={user?.id} />
        <DashboardActivityChart />
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-2">
        <DashboardMiniTable
          title="Mes sessions"
          linkHref="/app/sessions/requests"
          linkTab="host"
          linkLabel="Voir plus"
          emptyLabel="Aucune session récente."
          data={recentSessions}
          columns={dashboardSessionsColumns}
          mobileVariant="sessions"
        />
        <DashboardMiniTable
          title="Mes demandes"
          linkHref="/app/sessions/requests"
          linkTab="requester"
          linkLabel="Voir plus"
          emptyLabel="Aucune demande récente."
          data={recentRequests}
          columns={dashboardRequestsColumns}
          mobileVariant="requests"
        />
      </section>
    </div>
  );
}
