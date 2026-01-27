import { NextResponse } from 'next/server';

const MAPBOX_RETRIEVE_URL =
  'https://api.mapbox.com/search/searchbox/v1/retrieve';

type MapboxRetrieveResponse = {
  features?: {
    geometry?: { coordinates?: [number, number] };
    properties?: { mapbox_id?: string };
  }[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    mapbox_id?: string;
    session_token?: string;
  };

  if (!body.mapbox_id || !body.session_token) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing MAPBOX_ACCESS_TOKEN' },
      { status: 500 },
    );
  }

  const url = new URL(
    `${MAPBOX_RETRIEVE_URL}/${encodeURIComponent(body.mapbox_id)}`,
  );
  url.searchParams.set('access_token', token);
  url.searchParams.set('session_token', body.session_token);
  url.searchParams.set('language', 'fr');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: 'Mapbox retrieve error', details: errorText },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as MapboxRetrieveResponse;
  const [lng, lat] = payload.features?.[0]?.geometry?.coordinates ?? [];

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Invalid coords' }, { status: 502 });
  }

  return NextResponse.json({ lat, lng });
}
