import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { SessionSearchForm } from '@/components/app/session-search-form';
import { Button } from '@/components/ui/button';

type SessionWithDistance = {
  id: string;
  title: string | null;
  starts_at: string;
  training_type_name?: string | null;
  place_name: string | null;
  city: string | null;
  place_lat: number | null;
  place_lng: number | null;
  is_boosted: boolean | null;
  disciplines: unknown;
  host_id: string | null;
  host_display_name: string | null;
  host_email: string | null;
  host_avatar_url?: string | null;
  distance_km?: number | null;
  distance: number | null;
};

function formatDistanceKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const defaultLabel =
    typeof resolvedSearchParams?.place_label === 'string'
      ? resolvedSearchParams.place_label
      : '';
  const placeLatValue =
    typeof resolvedSearchParams?.place_lat === 'string'
      ? resolvedSearchParams.place_lat
      : '';
  const placeLngValue =
    typeof resolvedSearchParams?.place_lng === 'string'
      ? resolvedSearchParams.place_lng
      : '';
  const defaultCoords =
    placeLatValue && placeLngValue
      ? { lat: Number(placeLatValue), lng: Number(placeLngValue) }
      : null;
  const latParam =
    typeof resolvedSearchParams?.place_lat === 'string'
      ? Number(resolvedSearchParams.place_lat)
      : null;
  const lngParam =
    typeof resolvedSearchParams?.place_lng === 'string'
      ? Number(resolvedSearchParams.place_lng)
      : null;
  const radiusParam =
    typeof resolvedSearchParams?.radius_km === 'string'
      ? Number(resolvedSearchParams.radius_km)
      : null;
  const searchCoords =
    typeof latParam === 'number' &&
    !Number.isNaN(latParam) &&
    typeof lngParam === 'number' &&
    !Number.isNaN(lngParam)
      ? { lat: latParam, lng: lngParam }
      : null;
  const radiusKm =
    typeof radiusParam === 'number' && !Number.isNaN(radiusParam)
      ? radiusParam
      : 25;

  const supabase = await createSupabaseServerClientReadOnly();
  const { data: sessions, error } = searchCoords
    ? await supabase.rpc('sessions_nearby', {
        p_lat: searchCoords.lat,
        p_lng: searchCoords.lng,
        p_radius_km: radiusKm,
      })
    : await supabase
        .from('session_listings')
        .select(
          'id, title, starts_at, training_type_name, place_name, city, place_lat, place_lng, is_boosted, disciplines, host_id, host_display_name, host_email, host_avatar_url',
        )
        .order('is_boosted', { ascending: false })
        .order('starts_at', { ascending: true })
        .limit(10);
  const safeSessions = (sessions ?? []).filter(
    (session: SessionWithDistance) => !!session?.id,
  );
  const sessionsWithDistance: SessionWithDistance[] = safeSessions.map(
    (session: SessionWithDistance) => {
      const lat = session.place_lat;
      const lng = session.place_lng;
      if (searchCoords && typeof lat === 'number' && typeof lng === 'number') {
        const distance =
          typeof session.distance_km === 'number' && session.distance_km;
        return {
          ...session,
          distance,
        } as SessionWithDistance;
      }
      return { ...session, distance: null } as SessionWithDistance;
    },
  );
  const filteredSessions =
    searchCoords && typeof radiusKm === 'number'
      ? sessionsWithDistance.filter(
          (session) =>
            typeof session.distance === 'number' &&
            session.distance <= radiusKm,
        )
      : sessionsWithDistance;
  const sortedByDistance = searchCoords
    ? [...filteredSessions].sort((a, b) => {
        const aDist = a.distance ?? Number.POSITIVE_INFINITY;
        const bDist = b.distance ?? Number.POSITIVE_INFINITY;
        return aDist - bDist;
      })
    : filteredSessions;
  const sortedSessions = searchCoords
    ? [
        ...sortedByDistance.filter((session) => session.is_boosted),
        ...sortedByDistance.filter((session) => !session.is_boosted),
      ]
    : sortedByDistance;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-6">
      <section className="flex flex-col gap-6 rounded-4xl border border-slate-200/70 bg-white/85 p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Trouve une session près de toi
            </h1>
            <p className="text-slate-600">
              Les prochaines sessions disponibles, triées par boost et date.
            </p>
          </div>
        </div>
        <SessionSearchForm
          defaultLabel={defaultLabel}
          defaultCoords={defaultCoords}
          defaultShowAdvanced={true}
        />
      </section>

      <section className="grid gap-4 grid-cols-1">
        {error ? (
          <Card>
            <CardHeader>
              <CardTitle>Erreur de chargement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Impossible de charger les sessions.
            </CardContent>
          </Card>
        ) : safeSessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucune session</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Publie une session pour commencer à matcher avec d&apos;autres
              sportifs.
            </CardContent>
          </Card>
        ) : (
          sortedSessions.map((session: SessionWithDistance) => {
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
              <Card
                key={session.id}
                className="border-slate-200/70 bg-white/90"
              >
                <div className="grid gap-6 p-6 md:grid-cols-[180px_1fr]">
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
                      Prévu le{' '}
                      {new Date(session.starts_at).toLocaleString('fr-FR')}
                    </div>
                    <div className="text-sm text-slate-600">
                      Lieu : {session.place_name}{' '}
                      {session.city ? `· ${session.city}` : ''}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-fit"
                    >
                      <Link href={`/sessions/${session.id}`}>Voir détail</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
