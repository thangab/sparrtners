import { NextResponse } from 'next/server';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getNumberParam = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const lat = getNumberParam(params.get('lat'));
  const lng = getNumberParam(params.get('lng'));
  const radiusKm = getNumberParam(params.get('radius_km')) ?? 25;
  const limit = clamp(getNumberParam(params.get('limit')) ?? 10, 1, 50);
  const offset = Math.max(getNumberParam(params.get('offset')) ?? 0, 0);
  const dateStart = params.get('date_start') || null;
  const dateEnd = params.get('date_end') || null;
  const disciplines = params.getAll('disciplines').filter(Boolean);
  const dominantHands = params.getAll('dominant_hand').filter(Boolean);
  const trainingTypeIds = params
    .getAll('training_type_id')
    .map((value) => getNumberParam(value))
    .filter((value): value is number => typeof value === 'number');
  const durationMin = getNumberParam(params.get('duration_min'));
  const durationMax = getNumberParam(params.get('duration_max'));
  const heightMin = getNumberParam(params.get('height_min'));
  const heightMax = getNumberParam(params.get('height_max'));
  const weightMin = getNumberParam(params.get('weight_min'));
  const weightMax = getNumberParam(params.get('weight_max'));

  const supabase = await createSupabaseServerClientReadOnly();
  const { data, error } = await supabase.rpc('sessions_nearby', {
    p_lat: lat ?? null,
    p_lng: lng ?? null,
    p_radius_km: radiusKm,
    p_limit: limit,
    p_offset: offset,
    p_date_start: dateStart,
    p_date_end: dateEnd,
    p_disciplines: disciplines.length > 0 ? disciplines : null,
    p_dominant_hands: dominantHands.length > 0 ? dominantHands : null,
    p_height_min: heightMin ?? null,
    p_height_max: heightMax ?? null,
    p_weight_min: weightMin ?? null,
    p_weight_max: weightMax ?? null,
    p_training_type_ids: trainingTypeIds.length > 0 ? trainingTypeIds : null,
    p_duration_min: durationMin ?? null,
    p_duration_max: durationMax ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}
