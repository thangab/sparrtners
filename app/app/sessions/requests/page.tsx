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

  const { data: requests } = await supabase
    .from('session_requests')
    .select(
      'id, session_id, user_id, status, created_at, sessions!inner(title)',
    )
    .eq('sessions.host_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  const requestItems = requests ?? [];
  const sessionIds = Array.from(
    new Set(requestItems.map((item) => item.session_id)),
  );
  const hostId = user?.id ?? '';
  const { data: conversations } =
    sessionIds.length > 0 && hostId
      ? await supabase
          .from('conversations')
          .select('id, session_id, user_a, user_b')
          .in('session_id', sessionIds)
          .or(`user_a.eq.${hostId},user_b.eq.${hostId}`)
      : { data: [] };

  const conversationMap = new Map<string, string>();
  (conversations ?? []).forEach((conversation) => {
    const [userA, userB] = [conversation.user_a, conversation.user_b].sort();
    const key = `${conversation.session_id}:${userA}:${userB}`;
    conversationMap.set(key, conversation.id);
  });

  const mappedRequests = requestItems.map((item) => {
    const [userA, userB] = [hostId, item.user_id].sort();
    const key = `${item.session_id}:${userA}:${userB}`;
    return {
      id: item.id,
      session_id: item.session_id,
      user_id: item.user_id,
      status: item.status,
      created_at: item.created_at,
      session_title: item.sessions?.[0]?.title ?? null,
      conversation_id: conversationMap.get(key) ?? null,
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
                  <span>{session.title}</span>
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
            <RequestsClient initialRequests={mappedRequests} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
