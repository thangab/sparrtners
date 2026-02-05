import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .is('read_at', null);

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, data, created_at, read_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false });

  const getCopy = (
    type: string,
    data?: { conversation_id?: string | null },
  ) => {
    switch (type) {
      case 'session_request_received':
        return {
          title: 'Nouvelle demande',
          body: 'Un combattant a demandé à rejoindre ta session. Va voir la page <a class="underline" href="/app/sessions/requests">Mes sessions</a> pour gérer tes demandes.',
        };
      case 'session_request_status':
        return {
          title: 'Mise à jour de demande',
          body: 'Ta demande a été mise à jour. Va voir la page <a class="underline" href="/app/sessions/requests">Mes sessions</a> pour voir ta demande.',
        };
      case 'session_request_accepted':
        return {
          title: 'Demande acceptée',
          body: 'Ta demande a été acceptée. Va voir la page <a class="underline" href="/app/sessions/requests">Mes sessions</a> pour gérer tes demandes.',
        };
      case 'session_request_refused':
        return {
          title: 'Demande refusée',
          body: 'Ta demande a été refusée. Va voir la page <a class="underline" href="/app/sessions/requests">Mes sessions</a> pour gérer tes demandes.',
        };
      case 'blog_post':
        return {
          title: 'Nouveau contenu',
          body: 'Un nouvel article est disponible.',
        };
      case 'chat_unread_message':
        if (data?.conversation_id) {
          return {
            title: 'Nouveau message',
            body: `Tu as un message en attente. <a class="underline" href="/app/chat/${data.conversation_id}">Ouvrir le chat</a>.`,
          };
        }
        return {
          title: 'Nouveau message',
          body: 'Tu as un message en attente. <a class="underline" href="/app/sessions/requests">Ouvrir l’app</a> pour répondre.',
        };
      case 'session_review_needed':
        return {
          title: 'Laisser un avis',
          body: 'Ta session est terminée. Laisse un avis depuis <a class="underline" href="/app/sessions/requests">Mes sessions</a>.',
        };
      default:
        return {
          title: 'Notification',
          body: null,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mes notifications</h1>
        <p className="text-muted-foreground">
          Retrouve ici l&apos;activité liée à tes sessions.
        </p>
      </div>
      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const copy = getCopy(
              notif.type,
              (notif.data as { conversation_id?: string | null }) ?? undefined,
            );
            return (
              <div
                key={notif.id}
                className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {copy.title}
                </div>
                {copy.body ? (
                  <div
                    className="mt-1 text-sm text-slate-600"
                    dangerouslySetInnerHTML={{ __html: copy.body }}
                  />
                ) : null}
                <div className="mt-2 text-xs text-slate-400">
                  {new Date(notif.created_at).toLocaleString('fr-FR', {
                    timeZone: 'Europe/Paris',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-600">
          Aucune notification pour le moment.
        </div>
      )}
    </div>
  );
}
