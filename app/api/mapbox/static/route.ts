import { NextResponse } from 'next/server';

const MAPBOX_STATIC_URL =
  'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static';

const toNumber = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET(request: Request) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing MAPBOX_ACCESS_TOKEN' },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const lat = toNumber(url.searchParams.get('lat'));
  const lng = toNumber(url.searchParams.get('lng'));

  if (lat == null || lng == null) {
    return NextResponse.json(
      { error: 'Invalid lat/lng parameters' },
      { status: 400 },
    );
  }

  const zoom = toNumber(url.searchParams.get('zoom')) ?? 14;
  const width = Math.round(toNumber(url.searchParams.get('width')) ?? 900);
  const height = Math.round(toNumber(url.searchParams.get('height')) ?? 320);

  const clampedWidth = Math.max(200, Math.min(1280, width));
  const clampedHeight = Math.max(120, Math.min(1280, height));
  const marker = `pin-s+111827(${lng},${lat})`;
  const mapPath = `${marker}/${lng},${lat},${zoom},0/${clampedWidth}x${clampedHeight}`;
  const staticUrl = `${MAPBOX_STATIC_URL}/${mapPath}?access_token=${encodeURIComponent(
    token,
  )}`;

  const response = await fetch(staticUrl, {
    method: 'GET',
    headers: {
      Accept: 'image/png,image/*;q=0.8',
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: 'Mapbox static image request failed', detail },
      { status: response.status },
    );
  }

  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'image/png',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    },
  });
}
