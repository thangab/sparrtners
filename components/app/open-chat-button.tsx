'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MessageCircle } from 'lucide-react';

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

    const { data: existingConversation, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_a', userA)
      .eq('user_b', userB)
      .maybeSingle();

    if (existingError) {
      toast({
        title: 'Erreur',
        description: existingError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (existingConversation?.id) {
      router.push(`/app/chat/${existingConversation.id}`);
      setIsLoading(false);
      return;
    }

    const { data: createdConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
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
      setIsLoading(false);
      return;
    }

    if (createdConversation?.id) {
      router.push(`/app/chat/${createdConversation.id}`);
      setIsLoading(false);
      return;
    }

    const { data: fallbackConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_a', userA)
      .eq('user_b', userB)
      .maybeSingle();

    if (fallbackConversation?.id) {
      router.push(`/app/chat/${fallbackConversation.id}`);
    }
    setIsLoading(false);
  };

  return (
    <Button
      size="sm"
      variant="default"
      onClick={handleOpenChat}
      disabled={isLoading}
      className="max-w-full bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {isLoading ? (
        'Ouverture...'
      ) : (
        <>
          <span className="sm:hidden">Chat</span>
          <span className="hidden sm:inline">Discuter maintenant</span>
        </>
      )}
    </Button>
  );
}
