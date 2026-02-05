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

type TrainingTypeRow = { name: string | null };
type SessionRow = {
  id: string;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
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
        .from('sessions')
        .select(
          'id, starts_at, duration_minutes, is_published, training_type:training_types(name)',
        )
        .in('id', sessionIds)
    : { data: [] as SessionRow[] };
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
  const delay = (ms: number) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  const sentIds: string[] = [];
  const sentEmails: string[] = [];
  const results: Array<{
    notification_id: string;
    session_id?: string;
    recipient_id: string;
    reviewed_user_id: string;
    email?: string;
    status: 'sent' | 'failed' | 'skipped';
    reason?: string;
    response_status?: number;
    response_body?: string;
  }> = [];
  let skippedReviewed = 0;
  let skippedNotEligible = 0;
  const skippedDetails: Array<{
    notification_id: string;
    session_id?: string;
    recipient_id: string;
    reviewed_user_id: string;
    reason: string;
    starts_at?: string | null;
    computed_end_at?: string | null;
    now?: string;
  }> = [];

  for (const item of items) {
    const sessionId = item.data?.session_id;
    const reviewedUserId = item.data?.reviewed_user_id ?? '';
    if (!sessionId) continue;
    if (
      reviewedSet.has(`${sessionId}:${item.recipient_id}:${reviewedUserId}`)
    ) {
      skippedReviewed += 1;
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        status: 'skipped',
        reason: 'already_reviewed',
      });
      continue;
    }
    const session = sessionMap.get(sessionId);
    if (!session || !session.is_published) {
      skippedNotEligible += 1;
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        status: 'skipped',
        reason: session ? 'session_not_published' : 'session_missing',
      });
      skippedDetails.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        reason: session ? 'session_not_published' : 'session_missing',
        starts_at: session?.starts_at ?? null,
      });
      continue;
    }
    if (!session.starts_at) {
      skippedNotEligible += 1;
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        status: 'skipped',
        reason: 'missing_starts_at',
      });
      skippedDetails.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        reason: 'missing_starts_at',
        starts_at: session.starts_at ?? null,
      });
      continue;
    }
    const duration = session.duration_minutes ?? 60;
    const endAt =
      new Date(session.starts_at).getTime() + duration * 60 * 1000;
    if (endAt > now) {
      skippedNotEligible += 1;
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        status: 'skipped',
        reason: 'session_not_finished',
      });
      skippedDetails.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        reason: 'session_not_finished',
        starts_at: session.starts_at,
        computed_end_at: new Date(endAt).toISOString(),
        now: new Date(now).toISOString(),
      });
      continue;
    }

    const recipientEmail = profileMap.get(item.recipient_id);
    if (!recipientEmail) {
      skippedNotEligible += 1;
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        status: 'skipped',
        reason: 'missing_recipient_email',
      });
      skippedDetails.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        reason: 'missing_recipient_email',
        starts_at: session.starts_at,
      });
      continue;
    }

    const trainingType = Array.isArray(session.training_type)
      ? session.training_type[0]?.name
      : session.training_type?.name;
    const html = await renderSessionReviewReminderEmail({
      trainingType: trainingType ?? 'Entraînement',
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
        subject: `Laisser un avis · Session de ${trainingType ?? 'Entraînement'}`,
        html,
      }),
    });

    if (response.ok) {
      sentIds.push(item.id);
      sentEmails.push(recipientEmail);
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        email: recipientEmail,
        status: 'sent',
        response_status: response.status,
      });
    } else {
      results.push({
        notification_id: item.id,
        session_id: sessionId,
        recipient_id: item.recipient_id,
        reviewed_user_id: reviewedUserId,
        email: recipientEmail,
        status: 'failed',
        response_status: response.status,
        response_body: await response.text(),
      });
    }

    await delay(700);
  }

  if (sentIds.length > 0) {
    await supabase
      .from('notifications')
      .update({ email_sent_at: new Date().toISOString() })
      .in('id', sentIds);
  }

  return NextResponse.json({
    ok: true,
    sent: sentIds.length,
    sentEmails,
    skippedReviewed,
    skippedNotEligible,
    skippedDetails,
    results,
  });
}
