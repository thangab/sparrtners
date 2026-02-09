'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarClock, MapPin, Route, UserRound } from 'lucide-react';
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
  const seenImpressionsRef = React.useRef(new Set<string>());
  const impressionQueueRef = React.useRef(new Set<string>());
  const flushTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setSessions(initialSessions);
    setHasMore(initialHasMore);
    seenImpressionsRef.current.clear();
    impressionQueueRef.current.clear();
    if (flushTimeoutRef.current != null) {
      window.clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
  }, [initialSessions, initialHasMore]);

  const sendStats = React.useCallback(
    (updates: Array<{ session_id: string; impressions?: number; detail_clicks?: number }>) => {
      if (updates.length === 0) return;
      const body = JSON.stringify({ updates });
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/sessions/stats', blob);
        return;
      }
      fetch('/api/sessions/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    },
    [],
  );

  const flushImpressions = React.useCallback(() => {
    const ids = Array.from(impressionQueueRef.current);
    impressionQueueRef.current.clear();
    if (ids.length === 0) return;
    sendStats(ids.map((id) => ({ session_id: id, impressions: 1 })));
  }, [sendStats]);

  React.useEffect(() => {
    sessions.forEach((session) => {
      if (!session?.id) return;
      if (seenImpressionsRef.current.has(session.id)) return;
      seenImpressionsRef.current.add(session.id);
      impressionQueueRef.current.add(session.id);
    });
    if (flushTimeoutRef.current == null) {
      flushTimeoutRef.current = window.setTimeout(() => {
        flushTimeoutRef.current = null;
        flushImpressions();
      }, 800);
    }
  }, [sessions, flushImpressions]);

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

  const handleDetailClick = React.useCallback(
    (sessionId: string) => {
      sendStats([{ session_id: sessionId, detail_clicks: 1 }]);
    },
    [sendStats],
  );

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.dateStart) count += 1;
    if (filters.dateEnd) count += 1;
    if (filters.durationMin != null || filters.durationMax != null) count += 1;
    if (filters.heightMin != null || filters.heightMax != null) count += 1;
    if (filters.weightMin != null || filters.weightMax != null) count += 1;
    if ((filters.disciplines?.length ?? 0) > 0) count += 1;
    if ((filters.dominantHands?.length ?? 0) > 0) count += 1;
    if ((filters.trainingTypeIds?.length ?? 0) > 0) count += 1;
    if (filters.radiusKm !== 25) count += 1;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
            Résultats
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {sessions.length} session{sessions.length > 1 ? 's' : ''} affichée
            {sessions.length > 1 ? 's' : ''}
          </p>
        </div>
        {activeFiltersCount > 0 ? (
          <Badge variant="secondary">
            {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif
            {activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        ) : null}
      </div>
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
          const disciplines = Array.isArray(session.disciplines)
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
            : [];

          const title = `Session de ${session.training_type_name ?? 'training'}`;
          const place = `${session.place_name ?? 'Lieu'}${
            session.city ? ` · ${session.city}` : ''
          }`;
          const schedule = `Prévu le ${formatDateTime(session.starts_at)}${
            session.duration_minutes ? ` · ${session.duration_minutes} min` : ''
          }`;

          const profileHref = session.host_id
            ? `/profile/${session.host_id}`
            : '/find-sessions';

          const sessionHref = `/sessions/${session.id}`;
          const distanceLabel =
            typeof session.distance === 'number'
              ? formatDistanceKm(session.distance)
              : null;

          const heightLabel =
            session.height_min != null || session.height_max != null
              ? `${session.height_min ?? '?'} - ${session.height_max ?? '?'} cm`
              : null;
          const weightLabel =
            session.weight_min != null || session.weight_max != null
              ? `${session.weight_min ?? '?'} - ${session.weight_max ?? '?'} kg`
              : null;
          const dominantHandLabel = session.dominant_hand
            ? session.dominant_hand === 'right'
              ? 'Droitier'
              : session.dominant_hand === 'left'
                ? 'Gaucher'
                : 'Ambidextre'
            : '';

          return (
            <Card key={session.id} className="border-slate-200/70 bg-white/90">
              <div className="grid gap-5 p-5 md:grid-cols-[180px_1fr]">
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-slate-900 shadow-sm">
                  <div className="mb-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Host de la session
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {session.host_avatar_url ? (
                        <Image
                          src={session.host_avatar_url}
                          alt={hostLabel}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
                          <UserRound className="h-6 w-6 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {hostLabel}
                      </p>
                      <Link
                        target="_blank"
                        href={profileHref}
                        className="text-xs text-slate-700 underline underline-offset-2"
                      >
                        Voir le profil
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-xl">{title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {distanceLabel ? (
                        <Badge variant="outline" className="gap-1">
                          <Route className="h-3.5 w-3.5" />
                          {distanceLabel}
                        </Badge>
                      ) : null}
                      {session.is_boosted ? (
                        <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                          Boostée
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {disciplines.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {disciplines.map((discipline) => (
                        <span
                          key={`${session.id}-${discipline}`}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                        >
                          {discipline}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Infos session
                      </p>
                      <div className="grid gap-2 text-sm text-slate-600">
                        <div className="flex items-start gap-2">
                          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                          <span>{schedule}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                          <span>{place}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Profil recherché
                      </p>
                      <div className="grid gap-1 text-sm text-slate-600">
                        {heightLabel ? <p>Taille: {heightLabel}</p> : null}
                        {weightLabel ? <p>Poids: {weightLabel}</p> : null}
                        {dominantHandLabel ? (
                          <p>Main forte: {dominantHandLabel}</p>
                        ) : null}
                        {!heightLabel && !weightLabel && !dominantHandLabel ? (
                          <p className="text-slate-500">Aucun critère spécifique.</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-fit">
                    <Link
                      href={sessionHref}
                      onClick={() => handleDetailClick(session.id)}
                    >
                      Voir la session
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      )}
      {hasMore ? (
        <div className="flex justify-center py-2">
          <Button variant="outline" type="button" onClick={handleLoadMore}>
            {loading ? 'Chargement...' : 'Afficher plus de sessions'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
