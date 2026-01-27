'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ChatClient({
  conversationId,
  initialMessages,
  currentUserId,
}: {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [text, setText] = React.useState('');
  const endRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  React.useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    const subscribe = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }

      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            console.log('realtime message', payload);
            const newMessage = payload.new as Message;
            setMessages((current) => {
              if (current.some((message) => message.id === newMessage.id)) {
                return current;
              }
              return [...current, newMessage];
            });
          },
        )
        .subscribe((status) => {
          console.log('realtime status', status);
        });
    };

    void subscribe();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, supabase]);

  const handleSend = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: value,
      })
      .select('id, sender_id, body, created_at')
      .maybeSingle();
    if (data) {
      setMessages((current) => {
        if (current.some((message) => message.id === data.id)) {
          return current;
        }
        return [...current, data];
      });
    }
  };

  return (
    <div className="flex h-[60vh] flex-col gap-4">
      <div className="flex-1 space-y-3 overflow-auto rounded-2xl border border-border bg-white p-4">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Pas encore de message.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === currentUserId
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  message.sender_id === currentUserId
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                {message.body}
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Écrire un message..."
        />
        <Button onClick={handleSend}>Envoyer</Button>
      </div>
    </div>
  );
}
