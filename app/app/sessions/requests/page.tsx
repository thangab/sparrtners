import { createSupabaseServerClient } from '@/lib/supabase/server';
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
  duration_minutes: number | null;
  is_published: boolean;
  is_full: boolean;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
  place: PlaceRow | PlaceRow[] | null;
  session_requests: SessionRequestRow[] | null;
};

type RequestedSessionRow = {
  id: string;
  starts_at: string;
  duration_minutes: number | null;
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
  const supabase = await createSupabaseServerClient();
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
          duration_minutes,
          is_published,
          is_full,
          training_type:training_types(name),
          place:places(name, city),
          session_requests (
            id,
            user_id,
            status,
            created_at,
            participant_count,
            message
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
            duration_minutes,
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
  const requestedHostIds = Array.from(
    new Set(
      (myRequests ?? [])
        .map((item) => normalizeOne(item.session)?.host_id)
        .filter((value): value is string => !!value),
    ),
  );
  const allSessionIds = Array.from(
    new Set([...createdSessionIds, ...requestedSessionIds]),
  );
  const { data: existingReviews } =
    userId && allSessionIds.length > 0
      ? await supabase
          .from('reviews')
          .select('session_id, reviewed_user_id')
          .eq('reviewer_id', userId)
          .in('session_id', allSessionIds)
      : { data: [] as { session_id: string | null; reviewed_user_id: string }[] };
  const reviewMap = new Set(
    (existingReviews ?? [])
      .filter((review) => !!review.session_id)
      .map((review) => `${review.session_id}:${review.reviewed_user_id}`),
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
  const { data: hostProfiles } = requestedHostIds.length
    ? await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', requestedHostIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const hostMap = new Map(
    (hostProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const { data: sessionStats } = createdSessionIds.length
    ? await supabase
        .from('session_stats')
        .select('session_id, impressions, detail_clicks')
        .in('session_id', createdSessionIds)
    : {
        data: [] as {
          session_id: string;
          impressions: number;
          detail_clicks: number;
        }[],
      };
  const statsMap = new Map(
    (sessionStats ?? []).map((stat) => [stat.session_id, stat]),
  );

  const formatSessionDate = (value: string) =>
    new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(value));
  const nowTimestamp = Date.parse(new Date().toISOString());
  const sessionIsFinished = (startsAt: string, durationMinutes: number | null) =>
    new Date(startsAt).getTime() +
      (durationMinutes ?? 60) * 60 * 1000 <=
    nowTimestamp;

  const createdItems = (createdSessions ?? []).map((session) => {
    const finished = sessionIsFinished(
      session.starts_at,
      session.duration_minutes,
    );
    const stats = statsMap.get(session.id);
    const requests = (session.session_requests ?? []).map(
      (request: SessionRequestRow) => {
        const key = `${session.id}:${[userId, request.user_id].sort().join(':')}`;
        const reviewed = reviewMap.has(`${session.id}:${request.user_id}`);
        return {
          ...request,
          session_id: session.id,
          requester: requesterMap.get(request.user_id) ?? null,
          conversation_id: conversationMap.get(key) ?? null,
          can_review:
            request.status === 'accepted' && finished && session.is_published,
          reviewed,
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
      starts_at_raw: session.starts_at,
      duration_minutes: session.duration_minutes,
      is_finished: finished,
      place: `${normalizeOne(session.place)?.name ?? 'Lieu'}${
        normalizeOne(session.place)?.city
          ? ` · ${normalizeOne(session.place)?.city}`
          : ''
      }`,
      impressions: stats?.impressions ?? 0,
      detail_clicks: stats?.detail_clicks ?? 0,
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
      request_id: item.request.id,
      title: `Session de ${
        normalizeOne(item.session!.training_type)?.name ?? 'Entraînement'
      }`,
      starts_at: formatSessionDate(item.session!.starts_at),
      starts_at_raw: item.session!.starts_at,
      duration_minutes: item.session!.duration_minutes,
      is_finished: sessionIsFinished(
        item.session!.starts_at,
        item.session!.duration_minutes,
      ),
      place: `${normalizeOne(item.session!.place)?.name ?? 'Lieu'}${
        normalizeOne(item.session!.place)?.city
          ? ` · ${normalizeOne(item.session!.place)?.city}`
          : ''
      }`,
      is_published: item.session!.is_published,
      status: item.request.status,
      participant_count: item.request.participant_count ?? 1,
      host_id: item.session!.host_id,
      host_display_name:
        hostMap.get(item.session!.host_id)?.display_name ?? null,
      can_review:
        item.request.status === 'accepted' &&
        sessionIsFinished(
          item.session!.starts_at,
          item.session!.duration_minutes,
        ) &&
        item.session!.is_published,
      reviewed: reviewMap.has(`${item.session!.id}:${item.session!.host_id}`),
      conversation_id: conversationMap.get(
        `${item.session!.id}:${[userId, item.session!.host_id].sort().join(':')}`,
      ),
    }));

  const completedItems = [...createdItems, ...requestedItems]
    .filter((item) => {
      if (item.kind === 'requester') {
        const requesterInactive =
          !['pending', 'accepted'].includes((item.status ?? '').toLowerCase());
        return item.is_finished || !item.is_published || requesterInactive;
      }
      return item.is_finished || !item.is_published;
    })
    .sort((a, b) => {
      const aTime = a.starts_at_raw ? new Date(a.starts_at_raw).getTime() : 0;
      const bTime = b.starts_at_raw ? new Date(b.starts_at_raw).getTime() : 0;
      return bTime - aTime;
    });

  const totalItems = createdItems.length + requestedItems.length;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#ffffff_45%,#f8fafc_100%)] px-6 py-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.3)] md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Sessions
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          Mes sessions et demandes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
          Pilote tes publications, réponds rapidement aux demandes et laisse
          tes avis de session au bon moment.
        </p>
      </section>

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
          <Card className="rounded-3xl border-dashed border-slate-300 bg-slate-50/70">
            <CardHeader>
              <CardTitle>Aucune session</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Crée une session ou envoie une demande pour commencer.
            </CardContent>
          </Card>
        ) : (
          <SessionRequestsTable
            created={createdItems}
            requested={requestedItems}
            completed={completedItems}
          />
        )}
      </div>
    </div>
  );
}
