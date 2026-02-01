'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

type OpenChatButtonProps = {
  sessionId: string;
  otherUserId: string;
  conversationId?: string | null;
};

export function OpenChatButton({
  sessionId,
  otherUserId,
  conversationId,
}: OpenChatButtonProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleOpenChat = async () => {
    if (conversationId) {
      router.push(`/app/chat/${conversationId}`);
      return;
    }

    setIsLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    const [userA, userB] = [currentUserId, otherUserId].sort();
    const { data: conversation, error } = await supabase
      .from('conversations')
      .upsert(
        {
          session_id: sessionId,
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
      setIsLoading(false);
      return;
    }

    if (conversation?.id) {
      router.push(`/app/chat/${conversation.id}`);
    }
    setIsLoading(false);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleOpenChat}
      disabled={isLoading}
    >
      Ouvrir le chat
    </Button>
  );
}
