import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { renderSessionReviewReminderEmail } from '@/lib/email-templates';

export const runtime = 'nodejs';

type NotificationRow = {
  id: string;
  recipient_id: string;
  data: {
    session_id?: string;
    reviewed_user_id?: string;
  } | null;
};

type SessionListingRow = {
  id: string;
  training_type_name: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  is_published: boolean | null;
};

export async function POST() {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: 'Missing email configuration' },
      { status: 500 },
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, recipient_id, data')
    .eq('type', 'session_review_needed')
    .is('email_sent_at', null)
    .order('created_at', { ascending: true })
    .limit(100);

  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const items = notifications as NotificationRow[];
  const sessionIds = Array.from(
    new Set(
      items
        .map((item) => item.data?.session_id)
        .filter((id): id is string => !!id),
    ),
  );
  const recipientIds = Array.from(
    new Set(items.map((item) => item.recipient_id)),
  );

  const { data: sessions } = sessionIds.length
    ? await supabase
        .from('session_listings')
        .select('id, training_type_name, starts_at, duration_minutes, is_published')
        .in('id', sessionIds)
    : { data: [] as SessionListingRow[] };
  const sessionMap = new Map(
    (sessions ?? []).map((session) => [session.id, session]),
  );

  const { data: profiles } = recipientIds.length
    ? await supabase
        .from('profiles')
        .select('id, email')
        .in('id', recipientIds)
    : { data: [] as { id: string; email: string | null }[] };
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.email]),
  );

  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('session_id, reviewer_id, reviewed_user_id')
    .in('session_id', sessionIds)
    .in('reviewer_id', recipientIds);
  const reviewedSet = new Set(
    (existingReviews ?? [])
      .filter((review) => review.session_id)
      .map(
        (review) =>
          `${review.session_id}:${review.reviewer_id}:${review.reviewed_user_id}`,
      ),
  );

  const now = Date.now();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const sentIds: string[] = [];

  for (const item of items) {
    const sessionId = item.data?.session_id;
    const reviewedUserId = item.data?.reviewed_user_id ?? '';
    if (!sessionId) continue;
    if (
      reviewedSet.has(`${sessionId}:${item.recipient_id}:${reviewedUserId}`)
    ) {
      sentIds.push(item.id);
      continue;
    }
    const session = sessionMap.get(sessionId);
    if (!session || !session.is_published) continue;
    if (!session.starts_at) continue;
    const duration = session.duration_minutes ?? 60;
    const endAt =
      new Date(session.starts_at).getTime() + duration * 60 * 1000;
    if (endAt > now) continue;

    const recipientEmail = profileMap.get(item.recipient_id);
    if (!recipientEmail) continue;

    const html = await renderSessionReviewReminderEmail({
      trainingType: session.training_type_name ?? 'Entraînement',
      reviewUrl: `${baseUrl}/app/sessions/requests?review=1&session_id=${sessionId}&reviewed_user_id=${reviewedUserId}`,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [recipientEmail],
        subject: `Laisser un avis · Session de ${session.training_type_name ?? 'Entraînement'}`,
        html,
      }),
    });

    if (response.ok) {
      sentIds.push(item.id);
    }
  }

  if (sentIds.length > 0) {
    await supabase
      .from('notifications')
      .update({ email_sent_at: new Date().toISOString() })
      .in('id', sentIds);
  }

  return NextResponse.json({ ok: true, sent: sentIds.length });
}
