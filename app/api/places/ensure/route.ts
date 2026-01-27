import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

const MAPBOX_RETRIEVE_URL =
  'https://api.mapbox.com/search/searchbox/v1/retrieve';

type PlacePayload = {
  mapbox_id?: string;
  session_token?: string;
};

type MapboxRetrieveResponse = {
  features?: {
    geometry?: { coordinates?: [number, number] };
    properties?: {
      mapbox_id?: string;
      name?: string;
      full_address?: string;
      place_formatted?: string;
      address?: string;
      context?: {
        place?: { name?: string };
        locality?: { name?: string };
        district?: { name?: string };
      };
    };
  }[];
};

function extractCity(context: {
  place?: { name?: string };
  locality?: { name?: string };
  district?: { name?: string };
} = {}) {
  return (
    context.place?.name ??
    context.locality?.name ??
    context.district?.name ??
    null
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { place?: PlacePayload };
  const place = body.place;

  if (!place?.mapbox_id || !place?.session_token) {
    return NextResponse.json({ error: 'Missing place data' }, { status: 400 });
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing MAPBOX_ACCESS_TOKEN' },
      { status: 500 },
    );
  }

  const retrieveUrl = new URL(
    `${MAPBOX_RETRIEVE_URL}/${encodeURIComponent(place.mapbox_id)}`,
  );
  retrieveUrl.searchParams.set('access_token', token);
  retrieveUrl.searchParams.set('session_token', place.session_token);
  retrieveUrl.searchParams.set('language', 'fr');

  const retrieveResponse = await fetch(retrieveUrl.toString());
  if (!retrieveResponse.ok) {
    return NextResponse.json(
      { error: 'Mapbox retrieve error' },
      { status: 502 },
    );
  }

  const retrievePayload =
    (await retrieveResponse.json()) as MapboxRetrieveResponse;
  const feature = retrievePayload.features?.[0];
  const properties = feature?.properties;

  if (!properties?.mapbox_id || !properties?.name) {
    return NextResponse.json({ error: 'Invalid place details' }, { status: 502 });
  }

  const [lng, lat] = feature?.geometry?.coordinates ?? [];
  const city = extractCity(properties.context ?? {});

  const admin = createSupabaseAdminClient();
  const { data: existingPlace, error: existingError } = await admin
    .from('places')
    .select('id, name, address, city, lat, lng, mapbox_place_id')
    .eq('mapbox_place_id', properties.mapbox_id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingPlace) {
    return NextResponse.json({ place: existingPlace });
  }

  const { data: createdPlace, error: insertError } = await admin
    .from('places')
    .insert({
      name: properties.name,
      address: properties.full_address ?? properties.place_formatted ?? null,
      city,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      mapbox_place_id: properties.mapbox_id,
    })
    .select('id, name, address, city, lat, lng, mapbox_place_id')
    .maybeSingle();

  if (insertError || !createdPlace) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Place insert failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ place: createdPlace });
}
