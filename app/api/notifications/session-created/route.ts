import { NextResponse } from 'next/server';
import { renderSessionCreatedEmail } from '@/lib/email-templates';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type TrainingTypeRow = { name: string | null };
type PlaceRow = { name: string | null; city: string | null };
type DisciplineRow = {
  discipline?: { name?: string | null };
  skill_level?: { name?: string | null };
};

type SessionEmailRow = {
  id: string;
  starts_at: string | null;
  duration_minutes: number | null;
  capacity: number | null;
  weight_min: number | null;
  weight_max: number | null;
  height_min: number | null;
  height_max: number | null;
  dominant_hand: string | null;
  glove_size: string | null;
  training_type: TrainingTypeRow | TrainingTypeRow[] | null;
  place: PlaceRow | PlaceRow[] | null;
  session_disciplines: DisciplineRow[] | null;
};

export async function POST(request: Request) {
  const { to, sessionId } = (await request.json()) as {
    to?: string;
    sessionId?: string;
  };

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: 'Missing email configuration' },
      { status: 500 },
    );
  }

  if (!to || !sessionId) {
    return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: sessionRaw, error: sessionError } = await supabase
    .from('sessions')
    .select(
      `
      id,
      starts_at,
      duration_minutes,
      capacity,
      weight_min,
      weight_max,
      height_min,
      height_max,
      dominant_hand,
      glove_size,
      training_type:training_types(name),
      place:places(name, city),
      session_disciplines (
        discipline:disciplines(name),
        skill_level:skill_levels(name)
      )
    `,
    )
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !sessionRaw) {
    return NextResponse.json(
      { error: sessionError?.message ?? 'Session not found' },
      { status: 404 },
    );
  }

  const session = sessionRaw as SessionEmailRow;
  const trainingTypeName = Array.isArray(session.training_type)
    ? session.training_type[0]?.name
    : session.training_type?.name;
  const place = Array.isArray(session.place) ? session.place[0] : session.place;
  const placeLabel = place?.name
    ? place.city
      ? `${place.name} · ${place.city}`
      : place.name
    : null;
  const disciplines = (session.session_disciplines ?? [])
    .map(
      (entry: {
        discipline?: { name?: string | null };
        skill_level?: { name?: string | null };
      }) => {
        const disciplineName = entry.discipline?.name ?? 'Discipline';
        const levelName = entry.skill_level?.name;
        return levelName ? `${disciplineName} - ${levelName}` : disciplineName;
      },
    )
    .filter(Boolean);

  const formattedDate = session.starts_at
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Paris',
      }).format(new Date(session.starts_at))
    : null;

  const subject = trainingTypeName
    ? `Nouvelle session créée : ${trainingTypeName}`
    : 'Session créée';
  const sessionUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/sessions/${session.id}`;

  const body = {
    from: process.env.RESEND_FROM,
    to: [to],
    subject,
    html: await renderSessionCreatedEmail({
      trainingType: trainingTypeName ?? 'Entraînement',
      sessionUrl,
      startsAt: formattedDate,
      place: placeLabel,
      disciplines,
      capacity: session.capacity,
      durationMinutes: session.duration_minutes,
      profile: {
        weightMin: session.weight_min,
        weightMax: session.weight_max,
        heightMin: session.height_min,
        heightMax: session.height_max,
        dominantHand: session.dominant_hand,
        gloveSize: session.glove_size,
      },
    }),
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
