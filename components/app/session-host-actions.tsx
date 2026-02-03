'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

type SessionHostActionsProps = {
  sessionId: string;
  initialIsPublished: boolean;
  initialIsFull: boolean;
};

export function SessionHostActions({
  sessionId,
  initialIsPublished,
  initialIsFull,
}: SessionHostActionsProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [isPublished, setIsPublished] = React.useState(initialIsPublished);
  const [isFull, setIsFull] = React.useState(initialIsFull);
  const [loading, setLoading] = React.useState(false);
  const [fullLoading, setFullLoading] = React.useState(false);

  const handleDisable = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('sessions')
      .update({ is_published: false })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setIsPublished(false);
    toast({
      title: 'Session désactivée',
      description: "Elle n'apparaît plus dans la recherche.",
    });
    router.refresh();
    setLoading(false);
  };

  const handleFullChange = async (checked: boolean) => {
    setFullLoading(true);
    const { error } = await supabase
      .from('sessions')
      .update({ is_full: checked })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      setFullLoading(false);
      return;
    }

    setIsFull(checked);
    toast({
      title: checked ? 'Session complète' : 'Session ouverte',
      description: checked
        ? 'Les demandes sont bloquées.'
        : 'Les demandes sont réouvertes.',
    });
    setFullLoading(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleDisable}
        disabled={loading || !isPublished}
      >
        {isPublished ? 'Désactiver la session' : 'Session désactivée'}
      </Button>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={isFull}
          onCheckedChange={handleFullChange}
          disabled={fullLoading || !isPublished}
        />
        <span>Session complète</span>
      </div>
    </div>
  );
}
