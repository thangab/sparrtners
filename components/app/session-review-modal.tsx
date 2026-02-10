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
import { Star } from 'lucide-react';

type SessionReviewModalProps = {
  sessionId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  sessionTitle?: string;
  sessionPlace?: string;
  sessionStartsAt?: string;
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
  sessionTitle,
  sessionPlace,
  sessionStartsAt,
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
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
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
    setHoverRating(null);
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
      <DialogContent className="max-h-[80vh] overflow-y-auto border-slate-200/80 bg-gradient-to-b from-white to-orange-50/40 p-0 sm:max-w-md">
        <DialogHeader>
          <div className="space-y-1 border-b border-slate-200/80 px-6 pt-6 pb-4">
            <DialogTitle>Donner mon avis sur {reviewedUserName}</DialogTitle>
            <DialogDescription>
              Note la session en sélectionnant une étoile.
            </DialogDescription>
            {sessionTitle || sessionPlace || sessionStartsAt ? (
              <p className="pt-2 text-xs text-slate-500">
                {(sessionTitle ?? 'Session') +
                  (sessionPlace ? ` à ${sessionPlace}` : '') +
                  (sessionStartsAt ? ` le ${sessionStartsAt}` : '')}
              </p>
            ) : null}
          </div>
        </DialogHeader>
        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-amber-200/70 bg-white/90 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Ta note</p>
            <div
              className="flex items-center gap-1"
              onMouseLeave={() => setHoverRating(null)}
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const activeValue = hoverRating ?? rating ?? 0;
                const isActive = value <= activeValue;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
                    onMouseEnter={() => setHoverRating(value)}
                    onFocus={() => setHoverRating(value)}
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <Star
                      className={`h-7 w-7 ${isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {rating
                ? `${rating}/5 sélectionné`
                : 'Sélectionne une note de 1 à 5'}
            </p>
          </div>
        </div>
        <div className="space-y-2 px-6 pb-2">
          <div className="text-sm font-medium text-slate-700">
            Commentaire (optionnel)
          </div>
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder="Partage ton ressenti sur la session."
            className="border-slate-200 bg-white/95"
          />
        </div>
        <DialogFooter className="border-t border-slate-200/80 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-linear-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600"
          >
            Envoyer mon avis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
