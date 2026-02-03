import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionRequestsTable } from '@/components/app/session-requests-table';

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
  is_published: boolean;
  is_full: boolean;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
  place: PlaceRow | PlaceRow[] | null;
  session_requests: SessionRequestRow[] | null;
};

type RequestedSessionRow = {
  id: string;
  starts_at: string;
  host_id: string;
  is_published: boolean;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
  place: PlaceRow | PlaceRow[] | null;
};

type MyRequestRow = {
  id: string;
  status: string;
  created_at: string;
  participant_count: number;
  session: RequestedSessionRow | RequestedSessionRow[] | null;
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
          is_published,
          is_full,
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
            is_published,
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
    : { data: [] as { id: string; display_name: string | null; avatar_url: string | null }[] };
  const requesterMap = new Map(
    (requesterProfiles ?? []).map((profile) => [profile.id, profile]),
  );

  const formatSessionDate = (value: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(value));

  const createdItems = (createdSessions ?? []).map((session) => {
    const requests = (session.session_requests ?? []).map(
      (request: SessionRequestRow) => {
        const key = `${session.id}:${[userId, request.user_id].sort().join(':')}`;
        return {
          ...request,
          session_id: session.id,
          requester: requesterMap.get(request.user_id) ?? null,
          conversation_id: conversationMap.get(key) ?? null,
        };
      },
    );
    const pendingCount = requests.filter(
      (request: SessionRequestRow) => request.status === 'pending',
    ).length;
    return {
      kind: 'host' as const,
      id: session.id,
      title: `Session de ${normalizeOne(session.training_type)?.name ?? 'Entraînement'}`,
      starts_at: formatSessionDate(session.starts_at),
      place: `${normalizeOne(session.place)?.name ?? 'Lieu'}${
        normalizeOne(session.place)?.city
          ? ` · ${normalizeOne(session.place)?.city}`
          : ''
      }`,
      is_published: session.is_published,
      is_full: session.is_full,
      requests_count: requests.length,
      pending_count: pendingCount,
      requests,
    };
  });

  const requestedItems = (myRequests ?? [])
    .map((item) => ({
      session: normalizeOne(item.session),
      request: item,
    }))
    .filter((item) => item.session)
    .map((item) => ({
      kind: 'requester' as const,
      id: item.session!.id,
      title: `Session de ${
        normalizeOne(item.session!.training_type)?.name ?? 'Entraînement'
      }`,
      starts_at: formatSessionDate(item.session!.starts_at),
      place: `${normalizeOne(item.session!.place)?.name ?? 'Lieu'}${
        normalizeOne(item.session!.place)?.city
          ? ` · ${normalizeOne(item.session!.place)?.city}`
          : ''
      }`,
      is_published: item.session!.is_published,
      status: item.request.status,
      participant_count: item.request.participant_count ?? 1,
      host_id: item.session!.host_id,
      conversation_id: conversationMap.get(
        `${item.session!.id}:${[userId, item.session!.host_id].sort().join(':')}`,
      ),
    }));

  const totalItems = createdItems.length + requestedItems.length;

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
        ) : totalItems === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucune session</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Crée une session ou envoie une demande pour commencer.
            </CardContent>
          </Card>
        ) : (
          <SessionRequestsTable created={createdItems} requested={requestedItems} />
        )}
      </div>
    </div>
  );
}
