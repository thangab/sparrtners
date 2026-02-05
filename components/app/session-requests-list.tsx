'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { SessionReviewModal } from '@/components/app/session-review-modal';

type SessionRequestItem = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
  participant_count: number;
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
};

export function SessionRequestsList({
  requests,
  sessionDisabled = false,
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
    const { data: conversation, error } = await supabase
      .from('conversations')
      .upsert(
        {
          session_id: request.session_id,
          user_a: userA,
          user_b: userB,
        },
        { onConflict: 'session_id,user_a,user_b' },
      )
      .select('id')
      .maybeSingle();

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      setLoadingId(null);
      return;
    }

    if (conversation?.id) {
      setItems((current) =>
        current.map((item) =>
          item.id === request.id
            ? { ...item, conversation_id: conversation.id }
            : item,
        ),
      );
      router.push(`/app/chat/${conversation.id}`);
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
    <div className="space-y-2">
      {items.map((request) => {
        const requesterName =
          request.requester?.display_name ?? 'Sportif';
        const requestDate = new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Europe/Paris',
        }).format(new Date(request.created_at));
        return (
          <div
            key={request.id}
            className="flex flex-col gap-2 rounded-2xl border border-border bg-slate-50 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium text-foreground">
                <Link
                  href={`/profile/${request.user_id}`}
                  className="hover:underline"
                >
                  {requesterName}
                </Link>
              </div>
              <Badge variant="outline">{request.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {requestDate} · {request.participant_count ?? 1} participant(s)
            </div>
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
                  variant="outline"
                  onClick={() => handleOpenChat(request)}
                  disabled={sessionDisabled || loadingId === request.id}
                >
                  Ouvrir le chat
                </Button>
              ) : null}
              {request.can_review && !request.reviewed ? (
                <SessionReviewModal
                  sessionId={request.session_id}
                  reviewedUserId={request.user_id}
                  reviewedUserName={requesterName}
                  triggerLabel="Noter"
                  disabled={loadingId === request.id}
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
