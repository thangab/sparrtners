import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenChatButton } from '@/components/app/open-chat-button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  Dumbbell,
  MapPin,
  Timer,
} from 'lucide-react';

type NamedRelation =
  | { name?: string | null }
  | { name?: string | null }[]
  | null;
type TrainingTypeRow =
  | { name?: string | null }
  | { name?: string | null }[]
  | null;
type PlaceRow =
  | { name?: string | null; city?: string | null }
  | { name?: string | null; city?: string | null }[]
  | null;
type SessionDisciplineRow = {
  discipline?: NamedRelation;
  skill_level?: NamedRelation;
};
type UpcomingSessionRow = {
  id: string;
  starts_at: string | null;
  duration_minutes?: number | null;
  host_id?: string;
  is_published: boolean;
  training_type?: TrainingTypeRow;
  place?: PlaceRow;
  session_disciplines?: SessionDisciplineRow[] | null;
  session_requests?: Array<{
    user_id: string;
    status: string;
    created_at: string;
  }> | null;
};
type UpcomingRequestRow = {
  id: string;
  status: string;
  session?: UpcomingSessionRow | UpcomingSessionRow[] | null;
};
type ProfileRow = {
  id: string;
  display_name: string | null;
};

type DashboardNextSessionCardProps = {
  userId?: string;
};

export async function DashboardNextSessionCard({
  userId,
}: DashboardNextSessionCardProps) {
  const normalizeOne = <T,>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
  const getRelationName = (value: NamedRelation) => normalizeOne(value)?.name;
  const formatLongDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'full',
          timeZone: 'Europe/Paris',
        }).format(new Date(value))
      : '';
  const formatTime = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat('fr-FR', {
          timeStyle: 'short',
          timeZone: 'Europe/Paris',
        }).format(new Date(value))
      : '';
  const getCountdownInfo = (value?: string | null, referenceMs?: number) => {
    if (!value) return null;
    const diffMs = new Date(value).getTime() - (referenceMs ?? 0);
    if (diffMs <= 0) {
      return {
        label: 'En cours',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      };
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (totalMinutes < 60) {
      return {
        label: `Dans ${Math.max(1, totalMinutes)} min`,
        className: 'border-rose-200 bg-rose-50 text-rose-700',
      };
    }
    if (days === 0) {
      return {
        label: `Aujourd'hui · ${Math.max(1, totalHours)}h`,
        className: 'border-amber-200 bg-amber-50 text-amber-800',
      };
    }
    if (days === 1) {
      return {
        label: `Demain · ${hours > 0 ? `${hours}h` : '0h'}`,
        className: 'border-orange-200 bg-orange-50 text-orange-800',
      };
    }

    return {
      label: `Dans ${days} jours${hours > 0 ? ` · ${hours}h` : ''}`,
      className: 'border-slate-300 bg-white text-slate-700',
    };
  };

  if (!userId) {
    return (
      <Card className="border-slate-200/80">
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Prochaine session</CardTitle>
          <p className="text-sm text-muted-foreground">
            La session à venir la plus proche de ton planning.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune session à venir pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClientReadOnly();
  const nowIso = new Date().toISOString();
  const [upcomingHostedResult, upcomingRequestedResult] = await Promise.all([
    supabase
      .from('sessions')
      .select(
        `
        id,
        starts_at,
        duration_minutes,
        host_id,
        is_published,
        training_type:training_types(name),
        place:places(name, city),
        session_disciplines (
          discipline:disciplines(name),
          skill_level:skill_levels(name)
        ),
        session_requests!inner (
          user_id,
          status,
          created_at
        )
      `,
      )
      .eq('host_id', userId)
      .eq('is_published', true)
      .eq('session_requests.status', 'accepted')
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(1),
    supabase
      .from('session_requests')
      .select(
        `
        id,
        status,
        session:sessions (
          id,
          starts_at,
          duration_minutes,
          host_id,
          is_published,
          training_type:training_types(name),
          place:places(name, city),
          session_disciplines (
            discipline:disciplines(name),
            skill_level:skill_levels(name)
          )
        )
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'accepted'),
  ]);

  const nowTimestamp = new Date(nowIso).getTime();
  const hostedUpcoming =
    (
      upcomingHostedResult as {
        data?: UpcomingSessionRow[];
      }
    ).data?.[0] ?? null;
  const requestedUpcoming = (
    (upcomingRequestedResult as { data?: UpcomingRequestRow[] }).data ?? []
  )
    .map((item) => normalizeOne(item.session))
    .filter(
      (session): session is UpcomingSessionRow =>
        !!session &&
        !!session.starts_at &&
        session.is_published &&
        new Date(session.starts_at).getTime() >= nowTimestamp,
    );

  const upcomingCandidates: Array<{
    session: UpcomingSessionRow;
    source: 'host' | 'request';
  }> = [];
  if (
    hostedUpcoming?.starts_at &&
    new Date(hostedUpcoming.starts_at).getTime() >= nowTimestamp
  ) {
    upcomingCandidates.push({ session: hostedUpcoming, source: 'host' });
  }
  requestedUpcoming.forEach((session) => {
    upcomingCandidates.push({ session, source: 'request' });
  });
  upcomingCandidates.sort(
    (a, b) =>
      new Date(a.session.starts_at ?? 0).getTime() -
      new Date(b.session.starts_at ?? 0).getTime(),
  );
  const nextUpcomingSession = upcomingCandidates[0] ?? null;
  const nextUpcomingPlace = normalizeOne(nextUpcomingSession?.session.place);
  const nextUpcomingType = normalizeOne(
    nextUpcomingSession?.session.training_type,
  );
  const nextUpcomingDisciplines = (
    nextUpcomingSession?.session.session_disciplines ?? []
  )
    .map((entry) => {
      const discipline = getRelationName(entry.discipline ?? null);
      const level = getRelationName(entry.skill_level ?? null);
      if (!discipline) return null;
      return level ? `${discipline} (${level})` : discipline;
    })
    .filter((label): label is string => Boolean(label));

  const nextUpcomingChatUserIds = (() => {
    if (!nextUpcomingSession) return [] as string[];
    if (nextUpcomingSession.source === 'request') {
      return nextUpcomingSession.session.host_id
        ? [nextUpcomingSession.session.host_id]
        : [];
    }

    return Array.from(
      new Set(
        (nextUpcomingSession.session.session_requests ?? [])
          .filter(
            (request) => request.status === 'accepted' && !!request.user_id,
          )
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
          .map((request) => request.user_id),
      ),
    );
  })();

  const { data: nextUpcomingChatProfiles } = nextUpcomingChatUserIds.length
    ? await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', nextUpcomingChatUserIds)
    : { data: [] as ProfileRow[] };
  const nextUpcomingChatProfileMap = new Map(
    (nextUpcomingChatProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const nextUpcomingChatParticipants = nextUpcomingChatUserIds.map((id) => {
    const profile = nextUpcomingChatProfileMap.get(id);
    return {
      userId: id,
      displayName:
        profile?.display_name ?? `Participant ${id.slice(0, 6).toUpperCase()}`,
    };
  });
  const nextUpcomingCountdown = getCountdownInfo(
    nextUpcomingSession?.session.starts_at,
    nowTimestamp,
  );

  return (
    <Card className="w-full max-w-full overflow-hidden rounded-3xl bg-white">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl font-black text-slate-950">
                Prochaine session
              </CardTitle>
              {nextUpcomingCountdown ? (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900 shadow-[0_8px_20px_-14px_rgba(217,119,6,0.7)]"
                >
                  <Timer className="mr-1.5 h-3.5 w-3.5" />
                  {nextUpcomingCountdown.label}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              La session à venir la plus proche de ton planning.
            </p>
          </div>
          {nextUpcomingSession ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-900 hover:bg-orange-100"
              >
                {nextUpcomingSession.source === 'host'
                  ? 'Session créée'
                  : 'Demande acceptée'}
              </Badge>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {nextUpcomingSession ? (
          <div className="space-y-4 rounded-2xl bg-linear-to-b from-white via-slate-50/60 to-white">
            <div className="rounded-2xl bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="text-lg font-black text-slate-900">
                    Session de {nextUpcomingType?.name ?? 'Entraînement'}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/sessions/${nextUpcomingSession.session.id}`}>
                    Voir la session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  <span>
                    {formatLongDate(nextUpcomingSession.session.starts_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock3 className="h-4 w-4 text-slate-400" />
                  <span>
                    {formatTime(nextUpcomingSession.session.starts_at)}
                    {nextUpcomingSession.session.duration_minutes
                      ? ` · ${nextUpcomingSession.session.duration_minutes} min`
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>
                    {nextUpcomingPlace?.name ?? 'Lieu'}
                    {nextUpcomingPlace?.city
                      ? ` · ${nextUpcomingPlace.city}`
                      : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Dumbbell className="h-4 w-4 text-slate-400" />
                  <span>{nextUpcomingType?.name ?? 'Entraînement'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Disciplines
              </p>
              {nextUpcomingDisciplines.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nextUpcomingDisciplines.map((discipline) => (
                    <Badge
                      key={discipline}
                      variant="outline"
                      className="border-slate-300 bg-white text-slate-700"
                    >
                      {discipline}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Non renseignées</p>
              )}
            </div>

            {nextUpcomingChatParticipants.length > 0 ? (
              <div className="space-y-3 rounded-2xl bg-slate-50/70 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Discuter avec les participants
                  </p>
                  <span className="text-xs text-slate-500">
                    {nextUpcomingChatParticipants.length}{' '}
                    {nextUpcomingChatParticipants.length > 1
                      ? 'contacts'
                      : 'contact'}
                  </span>
                </div>
                <div className="space-y-2">
                  {nextUpcomingChatParticipants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl bg-white px-2 py-2 shadow-sm"
                    >
                      <span className="min-w-0 truncate text-sm font-medium text-slate-700">
                        {participant.displayName}
                      </span>
                      <OpenChatButton
                        sessionId={nextUpcomingSession.session.id}
                        otherUserId={participant.userId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-muted-foreground">
            Aucune session à venir pour le moment.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
