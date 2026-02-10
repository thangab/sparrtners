'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { SessionReviewModal } from '@/components/app/session-review-modal';
import { MessageCircle } from 'lucide-react';

type SessionRequestItem = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
  participant_count: number;
  message?: string | null;
  conversation_id?: string | null;
  can_review?: boolean;
  reviewed?: boolean;
  requester?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

type SessionRequestsListProps = {
  requests: SessionRequestItem[];
  sessionDisabled?: boolean;
  sessionTitle?: string;
  sessionPlace?: string;
  sessionStartsAt?: string;
};

export function SessionRequestsList({
  requests,
  sessionDisabled = false,
  sessionTitle,
  sessionPlace,
  sessionStartsAt,
}: SessionRequestsListProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = React.useState<SessionRequestItem[]>(requests);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleDecision = async (
    request: SessionRequestItem,
    decision: 'accepted' | 'declined',
  ) => {
    setLoadingId(request.id);
    const { error: rpcError } = await supabase.rpc('accept_session_request', {
      p_request_id: request.id,
      p_decision: decision,
    });

    if (rpcError) {
      toast({
        title: 'Erreur',
        description: rpcError.message,
        variant: 'destructive',
      });
      setLoadingId(null);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: decision } : item,
      ),
    );
    toast({
      title: 'Mise à jour',
      description: `Demande ${decision === 'accepted' ? 'acceptée' : 'refusée'}.`,
    });
    try {
      await fetch('/api/notifications/session-request-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          decision,
        }),
      });
    } catch (error) {
      console.warn('Session request status email failed', error);
    }
    setLoadingId(null);
  };

  const handleCancelAcceptance = async (request: SessionRequestItem) => {
    setLoadingId(request.id);
    const { error } = await supabase.rpc('cancel_accepted_session_request', {
      p_request_id: request.id,
      p_reason: null,
    });

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      setLoadingId(null);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: 'declined' } : item,
      ),
    );
    toast({
      title: 'Acceptation annulée',
      description: 'La demande est repassée en refusée.',
    });
    try {
      await fetch('/api/notifications/session-request-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          decision: 'declined',
        }),
      });
    } catch (error) {
      console.warn('Session request status email failed', error);
    }
    setLoadingId(null);
  };

  const handleOpenChat = async (request: SessionRequestItem) => {
    if (request.conversation_id) {
      router.push(`/app/chat/${request.conversation_id}`);
      return;
    }

    setLoadingId(request.id);
    const { data: userData } = await supabase.auth.getUser();
    const hostId = userData?.user?.id;
    if (!hostId) {
      setLoadingId(null);
      return;
    }
    const [userA, userB] = [hostId, request.user_id].sort();

    const { data: existingConversation, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', request.session_id)
      .eq('user_a', userA)
      .eq('user_b', userB)
      .maybeSingle();

    if (existingError) {
      toast({
        title: 'Erreur',
        description: existingError.message,
        variant: 'destructive',
      });
      setLoadingId(null);
      return;
    }

    if (existingConversation?.id) {
      setItems((current) =>
        current.map((item) =>
          item.id === request.id
            ? { ...item, conversation_id: existingConversation.id }
            : item,
        ),
      );
      router.push(`/app/chat/${existingConversation.id}`);
      setLoadingId(null);
      return;
    }

    const { data: createdConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        session_id: request.session_id,
        user_a: userA,
        user_b: userB,
      })
      .select('id')
      .maybeSingle();

    if (createError && (createError as { code?: string }).code !== '23505') {
      toast({
        title: 'Erreur',
        description: createError.message,
        variant: 'destructive',
      });
      setLoadingId(null);
      return;
    }

    if (createdConversation?.id) {
      setItems((current) =>
        current.map((item) =>
          item.id === request.id
            ? { ...item, conversation_id: createdConversation.id }
            : item,
        ),
      );
      router.push(`/app/chat/${createdConversation.id}`);
      setLoadingId(null);
      return;
    }

    const { data: fallbackConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', request.session_id)
      .eq('user_a', userA)
      .eq('user_b', userB)
      .maybeSingle();

    if (fallbackConversation?.id) {
      setItems((current) =>
        current.map((item) =>
          item.id === request.id
            ? { ...item, conversation_id: fallbackConversation.id }
            : item,
        ),
      );
      router.push(`/app/chat/${fallbackConversation.id}`);
    }
    setLoadingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucune demande pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((request) => {
        const requesterName = request.requester?.display_name ?? 'Sportif';
        const requestDate = new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Europe/Paris',
        }).format(new Date(request.created_at));
        return (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-foreground">
                <Link
                  href={`/profile/${request.user_id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {requesterName}
                </Link>
              </div>
              <Badge variant="outline" className="capitalize">
                {request.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {requestDate} · {request.participant_count ?? 1} participant(s)
            </div>
            {request.message ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                {request.message}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleDecision(request, 'accepted')}
                disabled={
                  sessionDisabled ||
                  loadingId === request.id ||
                  request.status !== 'pending'
                }
              >
                Accepter
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDecision(request, 'declined')}
                disabled={
                  sessionDisabled ||
                  loadingId === request.id ||
                  request.status !== 'pending'
                }
              >
                Refuser
              </Button>
              {request.status === 'accepted' ? (
                <Button
                  size="sm"
                  className="bg-linear-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600"
                  onClick={() => handleOpenChat(request)}
                  disabled={sessionDisabled || loadingId === request.id}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Discuter maintenant
                </Button>
              ) : null}
              {request.status === 'accepted' ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelAcceptance(request)}
                  disabled={sessionDisabled || loadingId === request.id}
                >
                  Annuler la demande
                </Button>
              ) : null}
              {request.can_review && !request.reviewed ? (
                <SessionReviewModal
                  sessionId={request.session_id}
                  reviewedUserId={request.user_id}
                  reviewedUserName={requesterName}
                  sessionTitle={sessionTitle}
                  sessionPlace={sessionPlace}
                  sessionStartsAt={sessionStartsAt}
                  triggerLabel="Donner mon avis"
                  disabled={loadingId === request.id}
                  autoOpen={false}
                  onReviewed={() =>
                    setItems((current) =>
                      current.map((item) =>
                        item.id === request.id
                          ? { ...item, reviewed: true }
                          : item,
                      ),
                    )
                  }
                />
              ) : null}
              {request.reviewed ? (
                <Badge variant="secondary">Avis envoyé</Badge>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
