'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SessionWithDistance = {
  id: string;
  title: string | null;
  starts_at: string;
  duration_minutes?: number | null;
  training_type_name?: string | null;
  place_name: string | null;
  city: string | null;
  place_lat: number | null;
  place_lng: number | null;
  is_boosted: boolean | null;
  disciplines: unknown;
  height_min?: number | null;
  height_max?: number | null;
  weight_min?: number | null;
  weight_max?: number | null;
  dominant_hand?: string | null;
  host_id: string | null;
  host_display_name: string | null;
  host_email: string | null;
  host_avatar_url?: string | null;
  distance_km?: number | null;
  distance: number | null;
};

type SessionsResultsProps = {
  initialSessions: SessionWithDistance[];
  hasMore: boolean;
  pageSize?: number;
  filters: {
    lat?: number | null;
    lng?: number | null;
    radiusKm: number;
    dateStart?: string | null;
    dateEnd?: string | null;
    disciplines?: string[];
    dominantHands?: string[];
    trainingTypeIds?: number[];
    durationMin?: number | null;
    durationMax?: number | null;
    heightMin?: number | null;
    heightMax?: number | null;
    weightMin?: number | null;
    weightMax?: number | null;
  };
};

function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
  });
}

function buildQueryParams(
  filters: SessionsResultsProps['filters'],
  limit: number,
  offset: number,
) {
  const params = new URLSearchParams();
  if (typeof filters.lat === 'number') params.set('lat', String(filters.lat));
  if (typeof filters.lng === 'number') params.set('lng', String(filters.lng));
  params.set('radius_km', String(filters.radiusKm));
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (filters.dateStart) params.set('date_start', filters.dateStart);
  if (filters.dateEnd) params.set('date_end', filters.dateEnd);
  if (filters.durationMin != null) {
    params.set('duration_min', String(filters.durationMin));
  }
  if (filters.durationMax != null) {
    params.set('duration_max', String(filters.durationMax));
  }
  if (filters.heightMin != null) {
    params.set('height_min', String(filters.heightMin));
  }
  if (filters.heightMax != null) {
    params.set('height_max', String(filters.heightMax));
  }
  if (filters.weightMin != null) {
    params.set('weight_min', String(filters.weightMin));
  }
  if (filters.weightMax != null) {
    params.set('weight_max', String(filters.weightMax));
  }
  (filters.disciplines ?? []).forEach((item) => {
    params.append('disciplines', item);
  });
  (filters.dominantHands ?? []).forEach((item) => {
    params.append('dominant_hand', item);
  });
  (filters.trainingTypeIds ?? []).forEach((item) => {
    params.append('training_type_id', String(item));
  });
  return params;
}

export function SessionsResults({
  initialSessions,
  hasMore: initialHasMore,
  pageSize = 10,
  filters,
}: SessionsResultsProps) {
  const [sessions, setSessions] = React.useState(initialSessions);
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [loading, setLoading] = React.useState(false);

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = buildQueryParams(filters, pageSize + 1, sessions.length);
      const response = await fetch(`/api/sessions/nearby?${params.toString()}`);
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as {
        sessions?: SessionWithDistance[];
      };
      const next = payload.sessions ?? [];
      setSessions((current) => [...current, ...next.slice(0, pageSize)]);
      setHasMore(next.length > pageSize);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucune session</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Publie une session pour commencer à matcher avec d&apos;autres sportifs.
          </CardContent>
        </Card>
      ) : (
        sessions.map((session) => {
          const hostLabel = session.host_display_name || 'Combattant';
          const disciplineLabel = Array.isArray(session.disciplines)
            ? session.disciplines
                .map(
                  (item: {
                    discipline_name?: string;
                    skill_level_name?: string;
                  }) => {
                    const name = item.discipline_name ?? 'Discipline';
                    return item.skill_level_name
                      ? `${name} - ${item.skill_level_name}`
                      : name;
                  },
                )
                .filter(Boolean)
                .join(' · ')
            : '';

          return (
            <Card key={session.id} className="border-slate-200/70 bg-white/90">
              <div className="grid gap-6 p-6 md:grid-cols-[160px_1fr]">
                <div className="flex flex-col items-start gap-3">
                  {session.host_avatar_url ? (
                    <Image
                      src={session.host_avatar_url}
                      alt={hostLabel}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-slate-200" />
                  )}
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Host
                  </div>
                  <Link
                    target="_blank"
                    href={`/profile/${session.host_id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {hostLabel}
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Session de {session.training_type_name ?? 'training'}
                    </CardTitle>
                    {session.is_boosted ? (
                      <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                        Boostée
                      </Badge>
                    ) : null}
                  </div>
                  {disciplineLabel ? (
                    <div className="text-sm text-slate-600">
                      {disciplineLabel}
                    </div>
                  ) : null}
                  {typeof session.distance === 'number' ? (
                    <div>Distance: {formatDistanceKm(session.distance)}</div>
                  ) : null}
                  <div className="text-sm text-slate-600">
                    Prévu le {formatDateTime(session.starts_at)}
                    {session.duration_minutes
                      ? ` · ${session.duration_minutes} min`
                      : ''}
                  </div>
                  <div className="text-sm text-slate-600">
                    Lieu : {session.place_name}{' '}
                    {session.city ? `· ${session.city}` : ''}
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-fit">
                    <Link href={`/sessions/${session.id}`}>Voir détail</Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      )}
      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" type="button" onClick={handleLoadMore}>
            {loading ? 'Chargement...' : 'Afficher la suite des sessions'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
