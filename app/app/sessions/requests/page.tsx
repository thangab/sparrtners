import Link from 'next/link';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SessionRequestsList } from '@/components/app/session-requests-list';
import { OpenChatButton } from '@/components/app/open-chat-button';

type SessionRequestRow = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  participant_count: number;
};

type TrainingTypeRow = { name: string | null };
type PlaceRow = { name: string | null; city: string | null };

type CreatedSessionRow = {
  id: string;
  starts_at: string;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
  place: PlaceRow | PlaceRow[] | null;
  session_requests: SessionRequestRow[] | null;
};

type RequestedSessionRow = {
  id: string;
  starts_at: string;
  host_id: string;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
  place: PlaceRow | PlaceRow[] | null;
};

type MyRequestRow = {
  id: string;
  status: string;
  created_at: string;
  participant_count: number;
  session: RequestedSessionRow | RequestedSessionRow[] | null;
  host_display_name?: string | null;
};

type RequesterProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default async function RequestsPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? '';
  const { data: createdSessions, error: createdSessionsError } = userId
    ? await supabase
        .from('sessions')
        .select(
          `
          id,
          starts_at,
          training_type:training_types(name),
          place:places(name, city),
          session_requests (
            id,
            user_id,
            status,
            created_at,
            participant_count
          )
        `,
        )
        .eq('host_id', userId)
        .order('starts_at', { ascending: true })
    : { data: [] as CreatedSessionRow[] };
  const { data: myRequests, error: myRequestsError } = userId
    ? await supabase
        .from('session_requests')
        .select(
          `
          id,
          status,
          created_at,
          participant_count,
          session:sessions (
            id,
            starts_at,
            host_id,
            training_type:training_types(name),
            place:places(name, city)
          )
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    : { data: [] as MyRequestRow[] };

  const normalizeOne = <T,>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

  const requesterIds = Array.from(
    new Set(
      (createdSessions ?? []).flatMap((session) =>
        (session.session_requests ?? []).map(
          (request: { user_id: string }) => request.user_id,
        ),
      ),
    ),
  );
  const createdSessionIds = (createdSessions ?? []).map(
    (session) => session.id,
  );
  const requestedSessionIds = (myRequests ?? [])
    .map((item) => normalizeOne(item.session)?.id)
    .filter(Boolean) as string[];
  const allSessionIds = Array.from(
    new Set([...createdSessionIds, ...requestedSessionIds]),
  );
  const { data: conversations } =
    allSessionIds.length > 0
      ? await supabase
          .from('conversations')
          .select('id, session_id, user_a, user_b')
          .in('session_id', allSessionIds)
          .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      : { data: [] };
  const conversationMap = new Map<string, string>();
  (conversations ?? []).forEach((conversation) => {
    const [userA, userB] = [conversation.user_a, conversation.user_b].sort();
    const key = `${conversation.session_id}:${userA}:${userB}`;
    conversationMap.set(key, conversation.id);
  });
  const { data: requesterProfiles } = requesterIds.length
    ? await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', requesterIds)
    : { data: [] as RequesterProfile[] };
  const requesterMap = new Map(
    (requesterProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const hostIds = Array.from(
    new Set(
      (myRequests ?? [])
        .map((item) => normalizeOne(item.session)?.host_id)
        .filter(Boolean),
    ),
  ) as string[];
  const { data: hostProfiles } = hostIds.length
    ? await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', hostIds)
    : { data: [] as Array<{ id: string; display_name: string | null }> };
  const hostMap = new Map(
    (hostProfiles ?? []).map((profile) => [profile.id, profile]),
  );

  const createdItems = (createdSessions ?? []).map((session) => ({
    type: 'host' as const,
    id: session.id,
    starts_at: session.starts_at,
    training_type: normalizeOne(session.training_type),
    place: normalizeOne(session.place),
    requests: (session.session_requests ?? [])
      .map((request: SessionRequestRow) => {
        const key = `${session.id}:${[userId, request.user_id].sort().join(':')}`;
        return {
          ...request,
          session_id: session.id,
          requester: requesterMap.get(request.user_id) ?? null,
          conversation_id: conversationMap.get(key) ?? null,
        };
      })
      .sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
  }));

  const requestedItems = (myRequests ?? [])
    .map((item) => ({
      session: normalizeOne(item.session),
      request: item,
    }))
    .filter((item) => item.session)
    .map((item) => ({
      type: 'requester' as const,
      id: item.session!.id,
      starts_at: item.session!.starts_at,
      training_type: normalizeOne(item.session!.training_type),
      place: normalizeOne(item.session!.place),
      myRequest: {
        ...item.request,
        conversation_id: conversationMap.get(
          `${item.session!.id}:${[userId, item.session!.host_id]
            .sort()
            .join(':')}`,
        ),
        host_display_name:
          hostMap.get(item.session!.host_id)?.display_name ?? null,
      },
    }));

  const allItems = [...createdItems, ...requestedItems].sort((a, b) => {
    const aDate = new Date(a.starts_at).getTime();
    const bDate = new Date(b.starts_at).getTime();
    return aDate - bDate;
  });

  const formatSessionDate = (value: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes sessions</h1>
        <p className="text-muted-foreground">
          Gère tes publications et demandes.
        </p>
      </div>
      <div className="space-y-4">
        {createdSessionsError || myRequestsError ? (
          <Card>
            <CardHeader>
              <CardTitle>Erreur de chargement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {createdSessionsError?.message || myRequestsError?.message}
            </CardContent>
          </Card>
        ) : allItems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucune session</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Crée une session ou envoie une demande pour commencer.
            </CardContent>
          </Card>
        ) : (
          allItems.map((item) => {
            const trainingLabel = item.training_type?.name ?? 'Entraînement';
            const placeLabel = item.place?.name ?? 'Lieu';
            const cityLabel = item.place?.city ? ` · ${item.place.city}` : '';
            const sessionTitle = `Session de ${trainingLabel}`;

            const requestSession =
              item.type === 'requester'
                ? normalizeOne(item.myRequest.session)
                : null;
            return (
              <Card key={`${item.type}-${item.id}`}>
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{sessionTitle}</CardTitle>
                      <Badge variant="outline">
                        {item.type === 'host'
                          ? 'Session créée'
                          : 'Session demandée'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatSessionDate(item.starts_at)} · {placeLabel}
                      {cityLabel}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.type === 'host' ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/app/sessions/${item.id}/edit`}>
                          Modifier
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/sessions/${item.id}`}>Voir la session</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {item.type === 'host' ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        Demandes reçues
                      </div>
                      <SessionRequestsList requests={item.requests} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">
                        Ma demande
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge variant="outline">{item.myRequest.status}</Badge>
                        <span className="text-muted-foreground">
                          {new Intl.DateTimeFormat('fr-FR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'Europe/Paris',
                          }).format(new Date(item.myRequest.created_at))}
                        </span>
                        <span className="text-muted-foreground">
                          {item.myRequest.participant_count ?? 1} participant(s)
                        </span>
                      </div>
                      {requestSession?.host_id ? (
                        <div className="text-sm text-muted-foreground">
                          Hôte:{' '}
                          <Link
                            href={`/profile/${requestSession.host_id}`}
                            className="text-foreground hover:underline"
                          >
                            {item.myRequest.host_display_name ?? 'Voir le profil'}
                          </Link>
                        </div>
                      ) : null}

                      {item.myRequest.status === 'accepted' &&
                      requestSession?.host_id ? (
                        <OpenChatButton
                          sessionId={item.id}
                          otherUserId={requestSession.host_id}
                          conversationId={item.myRequest.conversation_id}
                        />
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
