'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

type SessionReviewModalProps = {
  sessionId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  triggerLabel?: string;
  disabled?: boolean;
  hideTrigger?: boolean;
  autoOpen?: boolean;
  initialOpen?: boolean;
  alreadyReviewed?: boolean;
  onReviewed?: () => void;
};

export function SessionReviewModal({
  sessionId,
  reviewedUserId,
  reviewedUserName,
  triggerLabel = 'Donner mon avis',
  disabled = false,
  hideTrigger = false,
  autoOpen = true,
  initialOpen = false,
  alreadyReviewed = false,
  onReviewed,
}: SessionReviewModalProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const [open, setOpen] = React.useState(initialOpen);
  const [rating, setRating] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!initialOpen || alreadyReviewed) return;
    setOpen(true);
  }, [initialOpen, alreadyReviewed]);

  React.useEffect(() => {
    if (!autoOpen || alreadyReviewed) return;
    const params = new URLSearchParams(window.location.search);
    const shouldOpen =
      params.get('review') === '1' &&
      params.get('session_id') === sessionId &&
      params.get('reviewed_user_id') === reviewedUserId;
    if (!shouldOpen) return;
    setOpen(true);
    params.delete('review');
    params.delete('session_id');
    params.delete('reviewed_user_id');
    const next = params.toString();
    const url = next
      ? `${window.location.pathname}?${next}`
      : window.location.pathname;
    window.history.replaceState({}, '', url);
  }, [autoOpen, alreadyReviewed, sessionId, reviewedUserId]);

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: 'Note requise',
        description: 'Sélectionne une note entre 1 et 5.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const reviewerId = userData?.user?.id;
    if (!reviewerId) {
      toast({
        title: 'Connexion requise',
        description: 'Connecte-toi pour laisser un avis.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      session_id: sessionId,
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Merci !',
      description: 'Ton avis a été envoyé.',
    });
    setLoading(false);
    setOpen(false);
    setRating(null);
    setComment('');
    onReviewed?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={disabled || alreadyReviewed}
          >
            {triggerLabel}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Donner mon avis sur {reviewedUserName}</DialogTitle>
          <DialogDescription>
            Donne une note pour cette session.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={rating === value ? 'default' : 'outline'}
              onClick={() => setRating(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">
            Commentaire (optionnel)
          </div>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Partage ton ressenti sur la session."
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
