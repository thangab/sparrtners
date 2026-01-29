import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RequestsClient } from '@/app/app/sessions/requests/RequestsClient';

export default async function RequestsPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, starts_at')
    .eq('host_id', user?.id ?? '')
    .order('starts_at', { ascending: true });

  const { data: incomingRequests } = await supabase
    .from('session_requests')
    .select(
      'id, session_id, user_id, status, created_at, participant_count, sessions!inner(title, host_id)',
    )
    .eq('sessions.host_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const { data: outgoingRequests } = await supabase
    .from('session_requests')
    .select(
      'id, session_id, user_id, status, created_at, participant_count, sessions!inner(title, host_id)',
    )
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const requestItems = [
    ...(incomingRequests ?? []),
    ...(outgoingRequests ?? []),
  ];
  const sessionIds = Array.from(
    new Set(requestItems.map((item) => item.session_id)),
  );
  const currentUserId = user?.id ?? '';
  const { data: conversations } =
    sessionIds.length > 0 && currentUserId
      ? await supabase
          .from('conversations')
          .select('id, session_id, user_a, user_b')
          .in('session_id', sessionIds)
          .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
      : { data: [] };

  const conversationMap = new Map<string, string>();
  (conversations ?? []).forEach((conversation) => {
    const [userA, userB] = [conversation.user_a, conversation.user_b].sort();
    const key = `${conversation.session_id}:${userA}:${userB}`;
    conversationMap.set(key, conversation.id);
  });

  const getSession = (item: {
    sessions?: { title?: string | null; host_id?: string | null }[] | { title?: string | null; host_id?: string | null } | null;
  }) => (Array.isArray(item.sessions) ? item.sessions[0] : item.sessions);

  const mappedIncomingRequests = (incomingRequests ?? []).map((item) => {
    const [userA, userB] = [currentUserId, item.user_id].sort();
    const key = `${item.session_id}:${userA}:${userB}`;
    const session = getSession(item);
    const createdAtLabel = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(item.created_at));
    return {
      id: item.id,
      session_id: item.session_id,
      user_id: item.user_id,
      status: item.status,
      created_at: item.created_at,
      created_at_label: createdAtLabel,
      participant_count: item.participant_count ?? 1,
      session_title: session?.title ?? null,
      conversation_id: conversationMap.get(key) ?? null,
    };
  });

  const mappedOutgoingRequests = (outgoingRequests ?? []).map((item) => {
    const session = getSession(item);
    const hostId = session?.host_id ?? null;
    const key =
      hostId && currentUserId
        ? `${item.session_id}:${[currentUserId, hostId].sort().join(':')}`
        : null;
    const createdAtLabel = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(item.created_at));
    return {
      id: item.id,
      session_id: item.session_id,
      user_id: item.user_id,
      status: item.status,
      created_at: item.created_at,
      created_at_label: createdAtLabel,
      participant_count: item.participant_count ?? 1,
      session_title: session?.title ?? null,
      conversation_id: key ? conversationMap.get(key) ?? null : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes sessions</h1>
        <p className="text-muted-foreground">
          Gère tes publications et demandes.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mes publications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {(sessions ?? []).length === 0 ? (
              <div>Aucune session publiée.</div>
            ) : (
              (sessions ?? []).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between"
                >
                  <span>{session.title ?? 'Session'}</span>
                  <span>
                    {new Date(session.starts_at).toLocaleDateString('fr-FR')}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/sessions/${session.id}/edit`}>Modifier</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demandes de participation</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestsClient initialRequests={mappedIncomingRequests} mode="host" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mes demandes</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestsClient
              initialRequests={mappedOutgoingRequests}
              mode="requester"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
