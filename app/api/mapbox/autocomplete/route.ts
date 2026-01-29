import { NextResponse } from 'next/server';

const MAPBOX_URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';

type MapboxFeature = {
  name?: string;
  mapbox_id?: string;
  feature_type?: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    place?: { name?: string };
    locality?: { name?: string };
    district?: { name?: string };
  };
};

type MapboxResponse = {
  suggestions?: MapboxFeature[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const sessionToken = searchParams.get('session_token');
  const types = searchParams.get('types');

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Missing session_token' },
      { status: 400 },
    );
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing MAPBOX_ACCESS_TOKEN' },
      { status: 500 },
    );
  }

  const url = new URL(MAPBOX_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('access_token', token);
  url.searchParams.set('session_token', sessionToken);
  url.searchParams.set('language', 'fr');
  url.searchParams.set('country', 'fr');
  url.searchParams.set('limit', '5');
  if (types) {
    url.searchParams.set('types', types);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      {
        error: 'Mapbox error',
        status: response.status,
        details: errorText,
      },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as MapboxResponse;
  const predictions = (payload.suggestions ?? [])
    .filter((feature) => feature.mapbox_id)
    .map((feature) => {
      const displayName = feature.name ?? 'Lieu';
      const address = feature.full_address ?? feature.place_formatted ?? '';
      const secondary =
        feature.place_formatted ??
        feature.context?.place?.name ??
        feature.context?.locality?.name ??
        feature.context?.district?.name ??
        '';

      return {
        place_id: feature.mapbox_id ?? '',
        description: address || displayName,
        structured_formatting: {
          main_text: displayName,
          secondary_text: secondary || address,
        },
        details: {
          mapbox_id: feature.mapbox_id ?? '',
          name: displayName,
          address: address || null,
          city: null,
          lat: null,
          lng: null,
        },
      };
    });

  return NextResponse.json({ predictions });
}
