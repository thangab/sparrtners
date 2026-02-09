import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenChatButton } from '@/components/app/open-chat-button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

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
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Prochaine session</CardTitle>
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
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>Prochaine session</CardTitle>
          {nextUpcomingSession ? (
            <Badge variant="secondary">
              {nextUpcomingSession.source === 'host'
                ? 'Session créée'
                : 'Demande acceptée'}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          La session à venir la plus proche de ton planning.
        </p>
      </CardHeader>
      <CardContent>
        {nextUpcomingSession ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium text-foreground">Date:</span>{' '}
              {formatLongDate(nextUpcomingSession.session.starts_at)}
            </p>
            <p>
              <span className="font-medium text-foreground">Heure:</span>{' '}
              {formatTime(nextUpcomingSession.session.starts_at)}
              {nextUpcomingSession.session.duration_minutes
                ? ` · ${nextUpcomingSession.session.duration_minutes} min`
                : ''}
            </p>
            <p>
              <span className="font-medium text-foreground">Lieu:</span>{' '}
              {nextUpcomingPlace?.name ?? 'Lieu'}
              {nextUpcomingPlace?.city ? ` · ${nextUpcomingPlace.city}` : ''}
            </p>
            <p>
              <span className="font-medium text-foreground">Type:</span>{' '}
              {nextUpcomingType?.name ?? 'Entraînement'}
            </p>
            <p>
              <span className="font-medium text-foreground">Disciplines:</span>{' '}
              {nextUpcomingDisciplines.length > 0
                ? nextUpcomingDisciplines.join(' · ')
                : 'Non renseignées'}
            </p>
            <div className="pt-1">
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/sessions/${nextUpcomingSession.session.id}`}>
                    Voir la session
                  </Link>
                </Button>
                {nextUpcomingChatParticipants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-2 rounded-md border px-2 py-1"
                  >
                    <span className="text-xs text-muted-foreground">
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
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune session à venir pour le moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
