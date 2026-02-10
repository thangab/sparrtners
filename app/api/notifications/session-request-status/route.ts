import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  renderSessionHostCalendarInviteEmail,
  renderSessionRequestStatusEmail,
} from '@/lib/email-templates';

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
  const { requestId, decision } = (await request.json()) as {
    requestId?: string;
    decision?: 'accepted' | 'declined';
  };

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: 'Missing email configuration' },
      { status: 500 },
    );
  }

  if (!requestId || !decision) {
    return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
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
    .select(
      'id, host_id, place_id, training_type_name, starts_at, duration_minutes, place_name, city',
    )
    .eq('id', requestRow.session_id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await supabase.from('notifications').insert({
    recipient_id: requestRow.user_id,
    actor_id: session.host_id,
    type: decision === 'accepted' ? 'session_request_accepted' : 'session_request_refused',
    data: {
      session_id: requestRow.session_id,
      request_id: requestRow.id,
      status: decision,
    },
  });

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('email, firstname, lastname, nickname, display_name')
    .eq('id', requestRow.user_id)
    .maybeSingle();

  if (!requesterProfile?.email) {
    return NextResponse.json(
      { error: 'Requester email not found' },
      { status: 404 },
    );
  }

  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('email, firstname, lastname, nickname, display_name')
    .eq('id', session.host_id)
    .maybeSingle();

  const hostName = hostProfile ? formatName(hostProfile) : 'Le host';
  const subject =
    decision === 'accepted'
      ? `Demande acceptée : Session de ${session.training_type_name ?? 'Entraînement'}`
      : `Demande refusée : Session de ${session.training_type_name ?? 'Entraînement'}`;

  const formattedDate = session.starts_at
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Paris',
      }).format(new Date(session.starts_at))
    : null;
  const { data: place } = session.place_id
    ? await supabase
        .from('places')
        .select('name, address, city')
        .eq('id', session.place_id)
        .maybeSingle()
    : { data: null };
  const placeName = place?.name ?? session.place_name ?? null;
  const placeLabel = placeName
    ? place?.address
      ? `${placeName} · ${place.address}`
      : session.city
        ? `${placeName} · ${session.city}`
        : placeName
    : null;
  const html = await renderSessionRequestStatusEmail({
    hostName,
    trainingType: session.training_type_name ?? 'Entraînement',
    startsAt: formattedDate,
    durationMinutes: session.duration_minutes,
    place: placeLabel,
    decision,
  });

  const attachments = [];
  if (decision === 'accepted' && session.starts_at) {
    const startDate = new Date(session.starts_at);
    const durationMinutes = session.duration_minutes ?? 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const toUtc = (date: Date) =>
      date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');
    const summary = `Session de ${session.training_type_name ?? 'Entraînement'} · Sparrtners`;
    const location = placeLabel ?? '';
    const description = 'Chat dispo dans l’app';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sparrtners//Session//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${requestRow.id}@sparrtners`,
      `DTSTAMP:${toUtc(new Date())}`,
      `DTSTART:${toUtc(startDate)}`,
      `DTEND:${toUtc(endDate)}`,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : '',
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');

    attachments.push({
      filename: 'invitation.ics',
      content: Buffer.from(ics).toString('base64'),
      contentType: 'text/calendar; charset=utf-8',
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
      to: [requesterProfile.email],
      subject,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  if (decision === 'accepted' && hostProfile?.email) {
    const hostHtml = await renderSessionHostCalendarInviteEmail({
      trainingType: session.training_type_name ?? 'Entraînement',
      startsAt: formattedDate,
      durationMinutes: session.duration_minutes,
      place: placeLabel,
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
        subject: `Invitation calendrier · Session de ${
          session.training_type_name ?? 'Entraînement'
        }`,
        html: hostHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
