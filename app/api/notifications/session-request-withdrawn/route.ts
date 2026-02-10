import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { renderSessionRequestWithdrawnEmail } from '@/lib/email-templates';

export const runtime = 'nodejs';

function formatName(profile: {
  firstname?: string | null;
  lastname?: string | null;
  nickname?: string | null;
  display_name?: string | null;
}) {
  const name = [profile.firstname, profile.lastname]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (name) return name;
  if (profile.nickname) return profile.nickname;
  if (profile.display_name) return profile.display_name;
  return 'Un membre';
}

export async function POST(request: Request) {
  const { requestId, sendEmail } = (await request.json()) as {
    requestId?: string;
    sendEmail?: boolean;
  };

  if (!requestId) {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: requestRow, error: requestError } = await supabase
    .from('session_requests')
    .select('id, session_id, user_id')
    .eq('id', requestId)
    .maybeSingle();

  if (requestError || !requestRow) {
    return NextResponse.json(
      { error: requestError?.message ?? 'Request not found' },
      { status: 404 },
    );
  }

  const { data: session } = await supabase
    .from('session_listings')
    .select('id, host_id, training_type_name, starts_at, duration_minutes, place_id, place_name, city')
    .eq('id', requestRow.session_id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await supabase.from('notifications').insert({
    recipient_id: session.host_id,
    actor_id: requestRow.user_id,
    type: 'session_request_withdrawn',
    data: {
      session_id: requestRow.session_id,
      request_id: requestRow.id,
      status: 'withdrawn',
    },
  });

  if (!sendEmail) {
    return NextResponse.json({ ok: true });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json({ ok: true });
  }

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('email, firstname, lastname, nickname, display_name')
    .eq('id', session.host_id)
    .maybeSingle();
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('firstname, lastname, nickname, display_name')
    .eq('id', requestRow.user_id)
    .maybeSingle();

  if (!hostProfile?.email) {
    return NextResponse.json({ ok: true });
  }

  const requesterName = requesterProfile ? formatName(requesterProfile) : 'Un participant';
  const startsAt = session.starts_at
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Paris',
      }).format(new Date(session.starts_at))
    : null;
  const subject = `Participation annulée : Session de ${
    session.training_type_name ?? 'Entraînement'
  }`;
  const placeLabel = session.place_name
    ? `${session.place_name}${session.city ? ` · ${session.city}` : ''}`
    : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const html = await renderSessionRequestWithdrawnEmail({
    requesterName,
    trainingType: session.training_type_name ?? 'Entraînement',
    startsAt,
    durationMinutes: session.duration_minutes,
    place: placeLabel,
    sessionsUrl: siteUrl ? `${siteUrl}/app/sessions/requests?tab=host` : null,
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [hostProfile.email],
      subject,
      html,
    }),
  });

  return NextResponse.json({ ok: true });
}
