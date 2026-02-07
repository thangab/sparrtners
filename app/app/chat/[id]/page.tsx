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
    .select('id, user_a, user_b')
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
      />
    </div>
  );
}
