import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { renderChatUnreadReminderEmail } from '@/lib/email-templates';

export const runtime = 'nodejs';

type ConversationRow = {
  user_a: string;
  user_b: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  conversations: ConversationRow | ConversationRow[] | null;
};

export async function POST() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: 'Missing email configuration' },
      { status: 500 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: messages } = await supabase
    .from('messages')
    .select(
      'id, conversation_id, sender_id, body, created_at, conversations(user_a, user_b)',
    )
    .is('read_at', null)
    .is('notified_at', null)
    .lte('created_at', tenMinutesAgo)
    .order('created_at', { ascending: true })
    .limit(100);

  if (!messages || messages.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const items = messages as MessageRow[];
  const senderIds = Array.from(new Set(items.map((item) => item.sender_id)));
  const recipientIds = Array.from(
    new Set(
      items.map((item) => {
        const convo = Array.isArray(item.conversations)
          ? item.conversations[0]
          : item.conversations;
        if (!convo) return null;
        return item.sender_id === convo.user_a ? convo.user_b : convo.user_a;
      }),
    ),
  ).filter((id): id is string => !!id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, firstname, lastname')
    .in('id', [...senderIds, ...recipientIds]);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  const { data: existingNotifications } = recipientIds.length
    ? await supabase
        .from('notifications')
        .select('recipient_id, data')
        .eq('type', 'chat_unread_message')
        .in('recipient_id', recipientIds)
    : { data: [] as { recipient_id: string; data: unknown }[] };
  const existingNotificationKeys = new Set(
    (existingNotifications ?? []).map((item) => {
      const data = item.data as { message_id?: string };
      return `${item.recipient_id}:${data?.message_id ?? ''}`;
    }),
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const delay = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const sentIds: string[] = [];
  const notificationsToInsert: Array<{
    recipient_id: string;
    actor_id: string;
    type: string;
    data: { conversation_id?: string; message_id?: string };
  }> = [];
  const results: Array<{
    message_id: string;
    recipient_id: string;
    status: 'sent' | 'skipped' | 'failed';
    response_status?: number;
    response_body?: string;
    reason?: string;
  }> = [];

  for (const message of items) {
    const convo = Array.isArray(message.conversations)
      ? message.conversations[0]
      : message.conversations;
    if (!convo) {
      results.push({
        message_id: message.id,
        recipient_id: '',
        status: 'skipped',
        reason: 'conversation_missing',
      });
      continue;
    }

    const recipientId =
      message.sender_id === convo.user_a ? convo.user_b : convo.user_a;
    if (!recipientId) {
      results.push({
        message_id: message.id,
        recipient_id: '',
        status: 'skipped',
        reason: 'recipient_missing',
      });
      continue;
    }

    const recipient = profileMap.get(recipientId);
    if (!recipient?.email) {
      results.push({
        message_id: message.id,
        recipient_id: recipientId,
        status: 'skipped',
        reason: 'recipient_email_missing',
      });
      continue;
    }

    const sender = profileMap.get(message.sender_id);
    const senderName =
      sender?.display_name ||
      [sender?.firstname, sender?.lastname].filter(Boolean).join(' ').trim() ||
      'Un membre';
    const messagePreview =
      message.body.length > 120
        ? `${message.body.slice(0, 120)}…`
        : message.body;
    const chatUrl = `${baseUrl}/app/chat/${message.conversation_id}`;

    const html = await renderChatUnreadReminderEmail({
      senderName,
      messagePreview,
      chatUrl,
    });

    if (
      recipientId &&
      !existingNotificationKeys.has(`${recipientId}:${message.id}`)
    ) {
      notificationsToInsert.push({
        recipient_id: recipientId,
        actor_id: message.sender_id,
        type: 'chat_unread_message',
        data: {
          conversation_id: message.conversation_id,
          message_id: message.id,
        },
      });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [recipient.email],
        subject: `Nouveau message de ${senderName}`,
        html,
      }),
    });

    if (response.ok) {
      sentIds.push(message.id);
      results.push({
        message_id: message.id,
        recipient_id: recipientId,
        status: 'sent',
        response_status: response.status,
      });
    } else {
      results.push({
        message_id: message.id,
        recipient_id: recipientId,
        status: 'failed',
        response_status: response.status,
        response_body: await response.text(),
      });
    }

    await delay(700);
  }

  if (sentIds.length > 0) {
    await supabase
      .from('messages')
      .update({ notified_at: new Date().toISOString() })
      .in('id', sentIds);
  }

  if (notificationsToInsert.length > 0) {
    await supabase.from('notifications').insert(notificationsToInsert);
  }

  return NextResponse.json({
    ok: true,
    sent: sentIds.length,
    notifications_created: notificationsToInsert.length,
    results,
  });
}
