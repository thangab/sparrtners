import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenChatButton } from '@/components/app/open-chat-button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { CalendarClock, Clock3, Dumbbell, MapPin } from 'lucide-react';

type NamedRelation = { name?: string | null } | { name?: string | null }[] | null;
type TrainingTypeRow = { name?: string | null } | { name?: string | null }[] | null;
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
  const nextUpcomingType = normalizeOne(nextUpcomingSession?.session.training_type);
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
          .filter((request) => request.status === 'accepted' && !!request.user_id)
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
      displayName: profile?.display_name ?? `Participant ${id.slice(0, 6).toUpperCase()}`,
    };
  });

  return (
    <Card className="w-full max-w-full overflow-hidden border-slate-200/80 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black text-slate-950">
              Prochaine session
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              La session à venir la plus proche de ton planning.
            </p>
          </div>
          {nextUpcomingSession ? (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-900 hover:bg-orange-100"
            >
              {nextUpcomingSession.source === 'host'
                ? 'Session créée'
                : 'Demande acceptée'}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {nextUpcomingSession ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-4">
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <CalendarClock className="h-4 w-4 text-slate-400" />
                <span>{formatLongDate(nextUpcomingSession.session.starts_at)}</span>
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
                  {nextUpcomingPlace?.city ? ` · ${nextUpcomingPlace.city}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Dumbbell className="h-4 w-4 text-slate-400" />
                <span>{nextUpcomingType?.name ?? 'Entraînement'}</span>
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

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/sessions/${nextUpcomingSession.session.id}`}>
                    Voir la session
                  </Link>
                </Button>
              </div>
              {nextUpcomingChatParticipants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Chat rapide
                  </p>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {nextUpcomingChatParticipants.map((participant) => (
                      <div
                        key={participant.userId}
                        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 sm:w-auto sm:justify-start"
                      >
                        <span className="min-w-0 max-w-[140px] truncate text-xs text-muted-foreground">
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
