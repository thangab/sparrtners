import Link from 'next/link';
import { BackLink } from '@/components/app/back-link';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatClient } from '@/app/app/chat/[id]/ChatClient';

export default async function ChatPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const conversationId = resolvedParams?.id;

  if (!conversationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversation introuvable</CardTitle>
        </CardHeader>
        <CardContent>Identifiant manquant dans URL.</CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connexion requise</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/login">Se connecter</Link>
        </CardContent>
      </Card>
    );
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, user_a, user_b, session_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (
    !conversation ||
    (conversation.user_a !== user.id && conversation.user_b !== user.id)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>Tu ne peux pas accéder à cette conversation.</CardContent>
      </Card>
    );
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at, read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const otherUserId =
    conversation.user_a === user.id ? conversation.user_b : conversation.user_a;

  const [{ data: otherUserProfile }, { data: sessionMeta }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', otherUserId)
      .maybeSingle(),
    conversation.session_id
      ? supabase
          .from('sessions')
          .select(
            'starts_at, training_type:training_types(name), place:places(name, city)',
          )
          .eq('id', conversation.session_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const trainingTypeRaw = sessionMeta?.training_type;
  const placeRaw = sessionMeta?.place;
  const trainingType = Array.isArray(trainingTypeRaw)
    ? trainingTypeRaw[0]
    : trainingTypeRaw;
  const place = Array.isArray(placeRaw) ? placeRaw[0] : placeRaw;
  const sessionLabel = trainingType?.name
    ? `Session de ${trainingType.name}`
    : 'Session';
  const sessionPlace = `${place?.name ?? 'Lieu'}${place?.city ? ` · ${place.city}` : ''}`;
  const sessionDate = sessionMeta?.starts_at
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Paris',
      }).format(new Date(sessionMeta.starts_at))
    : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-muted-foreground">
          <BackLink label="Retour" fallbackHref="/app/sessions/requests" />
        </div>
        <h1 className="text-2xl font-semibold">Chat</h1>
      </div>
      <ChatClient
        conversationId={conversationId}
        initialMessages={messages ?? []}
        currentUserId={user.id}
        otherUserName={otherUserProfile?.display_name ?? 'Sportif'}
        otherUserAvatarUrl={otherUserProfile?.avatar_url ?? null}
        sessionLabel={sessionLabel}
        sessionPlace={sessionPlace}
        sessionDate={sessionDate}
      />
    </div>
  );
}
