'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

type RequestItem = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
  created_at_label: string;
  participant_count: number;
  session_title: string | null;
  conversation_id: string | null;
};

export function RequestsClient({
  initialRequests,
  mode,
}: {
  initialRequests: RequestItem[];
  mode: 'host' | 'requester';
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const [requests, setRequests] =
    React.useState<RequestItem[]>(initialRequests);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const emptyLabel =
    mode === 'host' ? 'Aucune demande en attente.' : 'Aucune demande envoyée.';

  const handleDecision = async (
    request: RequestItem,
    decision: 'accepted' | 'declined',
  ) => {
    setLoadingId(request.id);
    const { data: userData } = await supabase.auth.getUser();
    const { data: updatedRequest, error: updateError } = await supabase
      .from('session_requests')
      .update({ status: decision })
      .eq('id', request.id)
      .select('id, status')
      .maybeSingle();

    if (updateError || !updatedRequest) {
      toast({
        title: 'Erreur',
        description:
          updateError?.message ?? 'Mise à jour refusée par les règles RLS.',
        variant: 'destructive',
      });
      setLoadingId(null);
      return;
    }

    if (decision === 'accepted') {
      const { error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: request.session_id,
          user_id: request.user_id,
          role: 'participant',
        });

      if (participantError) {
        toast({
          title: 'Erreur',
          description: participantError.message,
          variant: 'destructive',
        });
      }

      const hostId = userData?.user?.id;
      if (hostId) {
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
        } else if (existingConversation?.id) {
          setRequests((current) =>
            current.map((item) =>
              item.id === request.id
                ? { ...item, conversation_id: existingConversation.id }
                : item,
            ),
          );
        } else {
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
          } else if (createdConversation?.id) {
            setRequests((current) =>
              current.map((item) =>
                item.id === request.id
                  ? { ...item, conversation_id: createdConversation.id }
                  : item,
              ),
            );
          } else {
            const { data: fallbackConversation } = await supabase
              .from('conversations')
              .select('id')
              .eq('session_id', request.session_id)
              .eq('user_a', userA)
              .eq('user_b', userB)
              .maybeSingle();
            if (fallbackConversation?.id) {
              setRequests((current) =>
                current.map((item) =>
                  item.id === request.id
                    ? { ...item, conversation_id: fallbackConversation.id }
                    : item,
                ),
              );
            }
          }
        }
      }
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === request.id ? { ...item, status: decision } : item,
      ),
    );
    toast({
      title: 'Mise à jour',
      description: `Demande ${decision === 'accepted' ? 'acceptée' : 'refusée'}.`,
    });
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-sm text-muted-foreground">{emptyLabel}</div>
      ) : (
        requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-(--radius) border border-border bg-white p-4"
          >
            <div>
              <div className="text-sm text-muted-foreground">Session</div>
              <div className="font-medium">
                {request.session_title ?? 'Session'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Statut: {request.status}</span>
              <span>•</span>
              <span>{request.created_at_label}</span>
              <span>•</span>
              <span>Participants: {request.participant_count}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === 'host' ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleDecision(request, 'accepted')}
                    disabled={
                      loadingId === request.id || request.status !== 'pending'
                    }
                  >
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDecision(request, 'declined')}
                    disabled={
                      loadingId === request.id || request.status !== 'pending'
                    }
                  >
                    Refuser
                  </Button>
                </>
              ) : null}
              {request.status === 'accepted' ? (
                request.conversation_id ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/app/chat/${request.conversation_id}`}>
                      Ouvrir le chat
                    </Link>
                  </Button>
                ) : null
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
