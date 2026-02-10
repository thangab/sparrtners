'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarClock, MapPin, SendHorizontal } from 'lucide-react';

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
};

export function ChatClient({
  conversationId,
  initialMessages,
  currentUserId,
  otherUserName,
  otherUserAvatarUrl,
  sessionLabel,
  sessionPlace,
  sessionDate,
}: {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherUserName: string;
  otherUserAvatarUrl?: string | null;
  sessionLabel?: string | null;
  sessionPlace?: string | null;
  sessionDate?: string | null;
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [avatarFailed, setAvatarFailed] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );
  const tokenRef = React.useRef<string | null>(null);
  const markReadTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  React.useEffect(() => {
    if (markReadTimeout.current) {
      clearTimeout(markReadTimeout.current);
    }
    markReadTimeout.current = setTimeout(() => {
      const markAsRead = async () => {
        const { error } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUserId)
          .is('read_at', null);
        if (error) {
          console.error('Failed to mark messages as read', error);
        }
      };
      void markAsRead();
    }, 300);

    return () => {
      if (markReadTimeout.current) {
        clearTimeout(markReadTimeout.current);
      }
    };
  }, [conversationId, currentUserId, messages.length, supabase]);

  React.useEffect(() => {
    let cancelled = false;

    const subscribe = async () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const token = data.session?.access_token ?? null;
      if (token && token !== tokenRef.current) {
        supabase.realtime.setAuth(token);
        tokenRef.current = token;
      }

      const channel = supabase
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
            const newMessage = payload.new as Message;
            setMessages((current) => {
              if (current.some((message) => message.id === newMessage.id)) {
                return current;
              }
              return [...current, newMessage];
            });
          },
        )
        .subscribe();
      channelRef.current = channel;
      if (cancelled) {
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };

    void subscribe();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, supabase]);

  React.useEffect(() => {
    setAvatarFailed(false);
  }, [otherUserAvatarUrl, otherUserName]);

  const handleSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setText('');
    setSending(true);
    const { data } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: value,
      })
      .select('id, sender_id, body, created_at, read_at')
      .maybeSingle();
    if (data) {
      setMessages((current) => {
        if (current.some((message) => message.id === data.id)) {
          return current;
        }
        return [...current, data];
      });
    }
    setSending(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return;
    event.preventDefault();
    void handleSend();
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] min-h-[560px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <header className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-orange-50/50 px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          {otherUserAvatarUrl && !avatarFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={otherUserAvatarUrl}
              alt={otherUserName}
              onError={() => setAvatarFailed(true)}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
              {otherUserName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {otherUserName}
            </p>
            <p className="truncate text-xs text-slate-500">
              Conversation liée à la session
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
          <p className="truncate font-medium text-slate-700">{sessionLabel ?? 'Session'}</p>
          <p className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{sessionPlace ?? 'Lieu'}</span>
          </p>
          <p className="inline-flex items-center gap-1 truncate">
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
            <span>{sessionDate ?? 'Date à confirmer'}</span>
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-auto bg-slate-50/60 px-4 py-4 md:px-5">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            Conversation lancée. Envoie le premier message pour coordonner la session.
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
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  message.sender_id === currentUserId
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    message.sender_id === currentUserId
                      ? 'text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {new Intl.DateTimeFormat('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Paris',
                  }).format(new Date(message.created_at))}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <footer className="border-t border-slate-200/80 bg-white p-3 md:p-4">
        <div className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message..."
          className="h-11 rounded-xl border-slate-200"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="h-11 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600"
        >
          <SendHorizontal className="mr-2 h-4 w-4" />
          Envoyer
        </Button>
        </div>
      </footer>
    </div>
  );
}
