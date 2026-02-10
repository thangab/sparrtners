import { createSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CalendarCheck2,
  CheckCheck,
  Clock3,
  MailWarning,
  MessageCircle,
  ShieldAlert,
  Star,
} from 'lucide-react';

type NotificationData = {
  conversation_id?: string | null;
  session_id?: string | null;
  reviewed_user_id?: string | null;
};

type NotificationRow = {
  id: string;
  type: string;
  data: NotificationData | null;
  created_at: string;
  read_at: string | null;
};

type NotificationCopy = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: typeof Bell;
  tone: 'slate' | 'emerald' | 'orange' | 'rose' | 'blue' | 'amber' | 'violet';
};

function toneClasses(tone: NotificationCopy['tone']) {
  if (tone === 'emerald') {
    return 'border-emerald-200 bg-emerald-50/70 text-emerald-700';
  }
  if (tone === 'orange') {
    return 'border-orange-200 bg-orange-50/80 text-orange-700';
  }
  if (tone === 'rose') {
    return 'border-rose-200 bg-rose-50/80 text-rose-700';
  }
  if (tone === 'blue') {
    return 'border-blue-200 bg-blue-50/80 text-blue-700';
  }
  if (tone === 'amber') {
    return 'border-amber-200 bg-amber-50/80 text-amber-700';
  }
  if (tone === 'violet') {
    return 'border-violet-200 bg-violet-50/80 text-violet-700';
  }
  return 'border-slate-200 bg-slate-50/80 text-slate-700';
}

function getNotificationCopy(
  type: string,
  data?: NotificationData,
): NotificationCopy {
  switch (type) {
    case 'session_request_received':
      return {
        title: 'Nouvelle demande reçue',
        description:
          'Un sportif veut rejoindre ta session. Vérifie son profil et réponds rapidement.',
        actionLabel: 'Gérer mes demandes',
        actionHref: '/app/sessions/requests?tab=host',
        icon: MailWarning,
        tone: 'orange',
      };
    case 'session_request_status':
      return {
        title: 'Statut de demande mis à jour',
        description:
          'Une réponse est tombée sur une de tes demandes de participation.',
        actionLabel: 'Voir mes demandes',
        actionHref: '/app/sessions/requests?tab=requester',
        icon: Bell,
        tone: 'blue',
      };
    case 'session_request_accepted':
      return {
        title: 'Demande acceptée',
        description:
          'Ta participation est validée. Prépare ta session et ouvre le chat avec l’hôte.',
        actionLabel: 'Voir la session',
        actionHref: '/app/sessions/requests?tab=requester',
        icon: CheckCheck,
        tone: 'emerald',
      };
    case 'session_request_refused':
      return {
        title: 'Demande refusée',
        description:
          'Cette session n’est plus disponible pour toi. Tu peux candidater sur d’autres sessions.',
        actionLabel: 'Explorer les sessions',
        actionHref: '/find-sessions',
        icon: ShieldAlert,
        tone: 'rose',
      };
    case 'session_request_withdrawn':
      return {
        title: 'Participation annulée',
        description:
          'Un participant a retiré sa demande ou quitté la session. Tu peux rouvrir les demandes si besoin.',
        actionLabel: 'Gérer mes sessions',
        actionHref: '/app/sessions/requests?tab=host',
        icon: MailWarning,
        tone: 'orange',
      };
    case 'chat_unread_message':
      return {
        title: 'Nouveau message à lire',
        description:
          'Tu as un message non lu. Une réponse rapide aide à mieux organiser la session.',
        actionLabel: 'Ouvrir le chat',
        actionHref: data?.conversation_id
          ? `/app/chat/${data.conversation_id}`
          : '/app/sessions/requests',
        icon: MessageCircle,
        tone: 'violet',
      };
    case 'session_review_needed':
      return {
        title: 'Ton avis est attendu',
        description:
          'La session est terminée. Partage ton retour pour aider la communauté à choisir ses partenaires.',
        actionLabel: 'Donner mon avis',
        actionHref:
          data?.session_id && data?.reviewed_user_id
            ? `/app/sessions/requests?tab=completed&review=1&session_id=${data.session_id}&reviewed_user_id=${data.reviewed_user_id}`
            : '/app/sessions/requests?tab=completed',
        icon: Star,
        tone: 'amber',
      };
    case 'blog_post':
      return {
        title: 'Nouveau contenu disponible',
        description:
          'Un nouvel article est publié pour progresser sur tes entraînements.',
        actionLabel: 'Lire les articles',
        actionHref: '/blog',
        icon: CalendarCheck2,
        tone: 'blue',
      };
    default:
      return {
        title: 'Notification',
        description:
          'Une nouvelle activité est disponible sur ton compte Sparrtners.',
        actionLabel: 'Voir mes sessions',
        actionHref: '/app/sessions/requests',
        icon: Bell,
        tone: 'slate',
      };
  }
}

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, data, created_at, read_at')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (notifications ?? []) as NotificationRow[];
  const unreadCount = rows.filter((item) => !item.read_at).length;
  const markedReadAt = new Date().toISOString();

  if (unreadCount > 0) {
    await supabase
      .from('notifications')
      .update({ read_at: markedReadAt })
      .eq('recipient_id', user.id)
      .is('read_at', null);
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,#eef2ff_0,#ffffff_48%,#f8fafc_100%)] px-5 py-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] md:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Notifications
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          Ton centre d&apos;activité
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
          Toutes les actions importantes liées à tes sessions, ton chat et tes
          avis, au même endroit.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {rows.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Nouvelles
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {unreadCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Statut
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {unreadCount > 0
                ? 'Marquées comme lues à l’ouverture'
                : 'Tout est à jour'}
            </p>
          </div>
        </div>
      </section>

      {rows.length > 0 ? (
        <section className="space-y-3">
          {rows.map((notif) => {
            const data = notif.data ?? undefined;
            const copy = getNotificationCopy(notif.type, data);
            const Icon = copy.icon;
            return (
              <article
                key={notif.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneClasses(
                        copy.tone,
                      )}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 md:text-base">
                        {copy.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {copy.description}
                      </p>
                    </div>
                  </div>
                  {!notif.read_at ? (
                    <Badge className="shrink-0 bg-orange-100 text-orange-900 hover:bg-orange-100">
                      Nouveau
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(notif.created_at).toLocaleString('fr-FR', {
                      timeZone: 'Europe/Paris',
                    })}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={copy.actionHref}>{copy.actionLabel}</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
            <Bell className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Boîte vide pour l’instant
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tes prochaines notifications apparaîtront ici quand il y aura du
            nouveau sur tes sessions ou tes messages.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/app/sessions/requests">Mes sessions</Link>
            </Button>
            <Button asChild>
              <Link href="/find-sessions">Explorer les sessions</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
