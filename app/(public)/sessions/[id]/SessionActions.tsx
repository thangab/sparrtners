'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';

export function RequestJoinButton({
  sessionId,
  isFull = false,
}: {
  sessionId: string;
  isFull?: boolean;
}) {
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [participants, setParticipants] = React.useState('1');
  const [alreadyRequested, setAlreadyRequested] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const checkRequested = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data } = await supabase
        .from('session_requests')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userData.user.id)
        .maybeSingle();
      if (active && data) {
        setAlreadyRequested(true);
      }
    };
    void checkRequested();
    return () => {
      active = false;
    };
  }, [sessionId, supabase]);

  const handleRequest = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push('/login');
      setLoading(false);
      return;
    }

    const count = Math.max(1, Number.parseInt(participants, 10) || 1);
    const { error } = await supabase.from('session_requests').insert({
      session_id: sessionId,
      user_id: userData.user.id,
      status: 'pending',
      participant_count: count,
    });

    if (error) {
      toast({
        title: 'Demande refusée',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      await fetch('/api/notifications/session-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, requesterId: userData.user.id }),
      });
    } catch (err) {
      console.warn('Session request email failed', err);
    }

    toast({
      title: 'Demande envoyée',
      description: 'Le host va recevoir ta demande.',
    });
    setAlreadyRequested(true);
    setOpen(false);
    setLoading(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={loading || alreadyRequested || isFull}
          className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {isFull
            ? 'Session complète'
            : alreadyRequested
              ? 'Demande envoyée'
              : 'Demander à rejoindre'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="space-y-3">
        <div className="text-sm font-medium text-slate-900">
          Nombre de participants
        </div>
        <Input
          type="number"
          min={1}
          value={participants}
          onChange={(event) => setParticipants(event.target.value)}
        />
        <Button
          onClick={handleRequest}
          disabled={loading}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
        >
          Confirmer la demande
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function BoostSessionButton({ sessionId }: { sessionId: string }) {
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = React.useState(false);

  const handleBoost = async () => {
    setLoading(true);
    const { error } = await supabase.rpc('boost_session', {
      p_session_id: sessionId,
    });
    if (error) {
      toast({
        title: 'Boost impossible',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Session boostée',
      description: 'Elle est boostée pour 24h.',
    });
    setLoading(false);
  };

  return (
    <Button
      variant="secondary"
      onClick={handleBoost}
      disabled={loading}
      className="border border-slate-200/80 bg-white text-slate-900 hover:bg-slate-50"
    >
      Booster 24h
    </Button>
  );
}
