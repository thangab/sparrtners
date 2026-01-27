import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { PlaceSearchInput } from '@/components/app/place-search-input';

type SearchCoords = { lat: number; lng: number };
type SessionWithDistance = {
  id: string;
  title: string;
  starts_at: string;
  place_name: string | null;
  city: string | null;
  place_lat: number | null;
  place_lng: number | null;
  is_boosted: boolean | null;
  disciplines: unknown;
  host_id: string | null;
  host_display_name: string | null;
  host_email: string | null;
  distance: number | null;
};

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: SearchCoords, b: SearchCoords) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
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
  const searchCoords =
    typeof latParam === 'number' &&
    !Number.isNaN(latParam) &&
    typeof lngParam === 'number' &&
    !Number.isNaN(lngParam)
      ? { lat: latParam, lng: lngParam }
      : null;

  const supabase = await createSupabaseServerClientReadOnly();
  const { data: sessions, error } = await supabase
    .from('session_listings')
    .select(
      'id, title, starts_at, place_name, city, place_lat, place_lng, is_boosted, disciplines, host_id, host_display_name, host_email',
    )
    .order('is_boosted', { ascending: false })
    .order('starts_at', { ascending: true });
  const safeSessions = (sessions ?? []).filter((session) => !!session?.id);
  const sessionsWithDistance: SessionWithDistance[] = safeSessions.map(
    (session) => {
      const lat = session.place_lat;
      const lng = session.place_lng;
      if (searchCoords && typeof lat === 'number' && typeof lng === 'number') {
        return {
          ...session,
          distance: distanceKm(searchCoords, { lat, lng }),
        } as SessionWithDistance;
      }
      return { ...session, distance: null } as SessionWithDistance;
    },
  );
  const sortedSessions = searchCoords
    ? [...sessionsWithDistance].sort((a, b) => {
        const aDist = a.distance ?? Number.POSITIVE_INFINITY;
        const bDist = b.distance ?? Number.POSITIVE_INFINITY;
        return aDist - bDist;
      })
    : sessionsWithDistance;
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
        <form className="flex flex-col gap-3 md:flex-row" method="get">
          <PlaceSearchInput
            variant="compact"
            placeholder="Recherche par lieu..."
            inputClassName="bg-white"
            defaultLabel={defaultLabel}
            defaultCoords={defaultCoords}
          />
          <Button type="submit" variant="outline">
            Filtrer
          </Button>
        </form>
        <form
          className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white p-6 md:grid-cols-3"
          method="get"
        >
          <input type="hidden" name="place_label" value={defaultLabel} />
          <input type="hidden" name="place_lat" value={placeLatValue} />
          <input type="hidden" name="place_lng" value={placeLngValue} />
          <div className="space-y-2">
            <Label htmlFor="level">Niveau</Label>
            <Select id="level" name="level" defaultValue="">
              <SelectItem value="" disabled>
                Tous niveaux
              </SelectItem>
              <SelectItem value="beginner">Débutant</SelectItem>
              <SelectItem value="intermediate">Intermédiaire</SelectItem>
              <SelectItem value="advanced">Avancé</SelectItem>
              <SelectItem value="pro">Pro / Compétition</SelectItem>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="training_type">Type d&apos;entraînement</Label>
            <Select id="training_type" name="training_type" defaultValue="">
              <SelectItem value="" disabled>
                Tous types
              </SelectItem>
              <SelectItem value="sparring">Sparring</SelectItem>
              <SelectItem value="technique">Technique</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="grappling">Grappling</SelectItem>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trust">Score de confiance minimum</Label>
            <Select id="trust" name="trust" defaultValue="">
              <SelectItem value="" disabled>
                Tous scores
              </SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="4.5">4.5+</SelectItem>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_min">Poids (kg)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="weight_min"
                name="weight_min"
                placeholder="Min"
                type="number"
              />
              <Input
                id="weight_max"
                name="weight_max"
                placeholder="Max"
                type="number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height_min">Taille (cm)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="height_min"
                name="height_min"
                placeholder="Min"
                type="number"
              />
              <Input
                id="height_max"
                name="height_max"
                placeholder="Max"
                type="number"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discipline">Discipline</Label>
            <Select id="discipline" name="discipline" defaultValue="">
              <SelectItem value="" disabled>
                Toutes disciplines
              </SelectItem>
              <SelectItem value="boxing">Boxe anglaise</SelectItem>
              <SelectItem value="muay-thai">Muay thaï</SelectItem>
              <SelectItem value="kickboxing">Kickboxing</SelectItem>
              <SelectItem value="mma">MMA</SelectItem>
              <SelectItem value="grappling">Grappling</SelectItem>
            </Select>
          </div>
          <div className="md:col-span-3 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              Appliquer les filtres
            </Button>
            <Button type="reset" variant="outline">
              Réinitialiser
            </Button>
          </div>
        </form>
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
          sortedSessions.map((session) => {
            const hostLabel =
              session.host_display_name ||
              session.host_email ||
              (session.host_id
                ? `Combattant ${session.host_id.slice(0, 6).toUpperCase()}`
                : 'Combattant');

            return (
              <Card
                key={session.id}
                className="border-slate-200/70 bg-white/90"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{session.title}</CardTitle>
                    {session.is_boosted ? (
                      <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                        Boostée
                      </Badge>
                    ) : null}
                  </div>
                  {typeof session.distance === 'number' ? (
                    <div>
                      Distance: {formatDistance(session.distance * 1000)}
                    </div>
                  ) : null}
                  <div>Par {hostLabel}</div>
                  <div className="text-sm text-slate-600">
                    {(Array.isArray(session.disciplines)
                      ? session.disciplines
                          .map(
                            (item: {
                              discipline_name?: string;
                              skill_level_name?: string;
                            }) => {
                              const name = item.discipline_name ?? 'Discipline';
                              return item.skill_level_name
                                ? `${name} (${item.skill_level_name})`
                                : name;
                            },
                          )
                          .filter(Boolean)
                          .join(' · ')
                      : '') || 'Disciplines'}{' '}
                    · {new Date(session.starts_at).toLocaleString('fr-FR')}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm text-slate-600">
                  <div>
                    {session.place_name}{' '}
                    {session.city ? `· ${session.city}` : ''}
                  </div>

                  <Button variant="outline" size="sm" asChild className="w-fit">
                    <Link href={`/sessions/${session.id}`}>Voir détail</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
