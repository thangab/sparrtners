import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { SessionFiltersPanel } from '@/components/app/session-filters-panel';
import { PlaceSearchInput } from '@/components/app/place-search-input';
import { SessionsResults } from '@/components/app/sessions-results';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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

export default async function SessionsPage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const getNumberParam = (value?: string | string[]) => {
    if (typeof value !== 'string') return null;
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };
  const getStringParam = (value?: string | string[]) => {
    if (typeof value !== 'string') return '';
    return value.trim();
  };
  const defaultLabel = getStringParam(resolvedSearchParams?.place_label);
  const placeLatValue = getNumberParam(resolvedSearchParams?.place_lat);
  const placeLngValue = getNumberParam(resolvedSearchParams?.place_lng);
  const defaultCoords =
    typeof placeLatValue === 'number' && typeof placeLngValue === 'number'
      ? { lat: placeLatValue, lng: placeLngValue }
      : null;
  const latParam = placeLatValue;
  const lngParam = placeLngValue;
  const radiusParam = getNumberParam(resolvedSearchParams?.radius_km);
  const heightMinParam = getNumberParam(resolvedSearchParams?.height_min);
  const heightMaxParam = getNumberParam(resolvedSearchParams?.height_max);
  const weightMinParam = getNumberParam(resolvedSearchParams?.weight_min);
  const weightMaxParam = getNumberParam(resolvedSearchParams?.weight_max);
  const dominantParam = resolvedSearchParams?.dominant_hand;
  const disciplinesParam = resolvedSearchParams?.disciplines;
  const dateStartParam = getStringParam(resolvedSearchParams?.date_start);
  const dateEndParam = getStringParam(resolvedSearchParams?.date_end);
  const searchCoords =
    typeof latParam === 'number' &&
    !Number.isNaN(latParam) &&
    typeof lngParam === 'number' &&
    !Number.isNaN(lngParam)
      ? { lat: latParam, lng: lngParam }
      : null;
  const pageSize = 10;
  const requestLimit = pageSize + 1;
  const radiusKm =
    typeof radiusParam === 'number' && !Number.isNaN(radiusParam)
      ? radiusParam
      : 25;
  const heightRange: [number, number] = [
    typeof heightMinParam === 'number' && !Number.isNaN(heightMinParam)
      ? heightMinParam
      : 0,
    typeof heightMaxParam === 'number' && !Number.isNaN(heightMaxParam)
      ? heightMaxParam
      : 250,
  ];
  const weightRange: [number, number] = [
    typeof weightMinParam === 'number' && !Number.isNaN(weightMinParam)
      ? weightMinParam
      : 0,
    typeof weightMaxParam === 'number' && !Number.isNaN(weightMaxParam)
      ? weightMaxParam
      : 200,
  ];
  const dominantHands = Array.isArray(dominantParam)
    ? dominantParam
    : dominantParam
      ? [dominantParam]
      : [];
  const disciplines = Array.isArray(disciplinesParam)
    ? disciplinesParam
    : disciplinesParam
      ? [disciplinesParam]
      : [];
  const disciplineMap: Record<string, string> = {
    boxing: 'boxe anglaise',
    'pieds-poings': 'pieds-poings',
    mma: 'mma',
    wrestling: 'lutte',
  };
  const activeDisciplines = disciplines
    .map((item) => disciplineMap[item] ?? item)
    .map((item) => item.toLowerCase());
  const dateStartKey = dateStartParam || null;
  const dateEndKey = dateEndParam || null;

  const supabase = await createSupabaseServerClientReadOnly();
  const { data: sessions, error } = await supabase.rpc('sessions_nearby', {
    p_lat: searchCoords?.lat ?? null,
    p_lng: searchCoords?.lng ?? null,
    p_radius_km: radiusKm,
    p_limit: requestLimit,
    p_offset: 0,
    p_date_start: dateStartKey,
    p_date_end: dateEndKey,
    p_disciplines: activeDisciplines.length > 0 ? activeDisciplines : null,
    p_dominant_hands: dominantHands.length > 0 ? dominantHands : null,
    p_height_min:
      typeof heightMinParam === 'number' ? heightMinParam : null,
    p_height_max:
      typeof heightMaxParam === 'number' ? heightMaxParam : null,
    p_weight_min:
      typeof weightMinParam === 'number' ? weightMinParam : null,
    p_weight_max:
      typeof weightMaxParam === 'number' ? weightMaxParam : null,
  });
  const safeSessions = (sessions ?? []).filter(
    (session: SessionWithDistance) => !!session?.id,
  );
  const sessionsWithDistance: SessionWithDistance[] = safeSessions.map(
    (session: SessionWithDistance) => ({
      ...session,
      distance:
        typeof session.distance_km === 'number' ? session.distance_km : null,
    }),
  );
  const initialSessions = sessionsWithDistance.slice(0, pageSize);
  const hasMore = sessionsWithDistance.length > pageSize;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6 pb-20 pt-6">
      <form id="find-sessions-form" method="get" className="space-y-8">
        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm md:p-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900">
              Trouve une session près de toi
            </h1>
            <div className="flex flex-row items-stretch gap-0">
              <PlaceSearchInput
                variant="compact"
                placeholder="Où ?"
                containerClassName="flex-1"
                inputClassName="h-11 rounded-full bg-white rounded-r-none"
                defaultLabel={defaultLabel}
                defaultCoords={defaultCoords}
              />
              <Button
                type="submit"
                className="h-11 rounded-full bg-slate-900 px-6 text-white rounded-l-none"
              >
                <Search className="h-4 w-4 md:hidden" />
                <span className="hidden md:flex">Rechercher</span>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-0 md:gap-8 lg:grid-cols-[300px_1fr] lg:items-start">
          <SessionFiltersPanel
            radiusKm={radiusKm}
            heightRange={heightRange}
            weightRange={weightRange}
            defaultDominantHands={dominantHands}
            defaultDisciplines={disciplines}
            defaultDateStart={dateStartParam}
            defaultDateEnd={dateEndParam}
          />
          <section className="grid gap-4">
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
              <SessionsResults
                initialSessions={initialSessions}
                hasMore={hasMore}
                pageSize={pageSize}
                filters={{
                  lat: searchCoords?.lat ?? null,
                  lng: searchCoords?.lng ?? null,
                  radiusKm,
                  dateStart: dateStartKey,
                  dateEnd: dateEndKey,
                  disciplines: activeDisciplines,
                  dominantHands,
                  heightMin:
                    typeof heightMinParam === 'number' ? heightMinParam : null,
                  heightMax:
                    typeof heightMaxParam === 'number' ? heightMaxParam : null,
                  weightMin:
                    typeof weightMinParam === 'number' ? weightMinParam : null,
                  weightMax:
                    typeof weightMaxParam === 'number' ? weightMaxParam : null,
                }}
              />
            )}
          </section>
        </div>
      </form>
    </div>
  );
}
