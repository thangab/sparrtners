import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarClock,
  Hand,
  MapPin,
  Scale,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { BackLink } from '@/components/app/back-link';
import { TrustScore } from '@/components/app/trust-score';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { RequestJoinButton, BoostSessionButton } from './SessionActions';

function formatDominantHand(value?: string | null) {
  if (!value) return 'Non renseigné';
  if (value === 'right') return 'Droitier';
  if (value === 'left') return 'Gaucher';
  return 'Ambidextre';
}

function formatRange(min?: number | null, max?: number | null, unit = '') {
  if (min == null && max == null) return 'Non renseigné';
  if (min != null && max != null) return `${min} - ${max}${unit}`;
  if (min != null) return `Min ${min}${unit}`;
  return `Max ${max}${unit}`;
}

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  if (!id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session introuvable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Identifiant manquant dans URL.
        </CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listing } = await supabase
    .from('session_listings')
    .select(
      'id, title, description, starts_at, duration_minutes, capacity, host_id, host_display_name, host_email, host_avatar_url, training_type_name, place_id, place_name, city, place_lat, place_lng, is_boosted, is_full, disciplines, weight_min, weight_max, height_min, height_max, dominant_hand, glove_size',
    )
    .eq('id', id)
    .maybeSingle();

  if (!listing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session introuvable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Cette session n&apos;est plus disponible.
        </CardContent>
      </Card>
    );
  }

  const [
    hostProfileResult,
    requestStatusResult,
    conversationResult,
    acceptedCountResult,
    pendingCountResult,
    hostPublishedCountResult,
    hostTrustResult,
    placeDetailsResult,
  ] = await Promise.all([
    supabase
      .from('public_profiles')
      .select('display_name, city, dominant_hand, height_cm, weight_kg')
      .eq('id', listing.host_id)
      .maybeSingle(),
    user?.id
      ? supabase
          .from('session_requests')
          .select('status')
          .eq('session_id', listing.id)
          .eq('user_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user?.id
      ? supabase
          .from('conversations')
          .select('id')
          .eq('session_id', listing.id)
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('session_requests')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', listing.id)
      .eq('status', 'accepted'),
    supabase
      .from('session_requests')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', listing.id)
      .eq('status', 'pending'),
    supabase
      .from('session_listings')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', listing.host_id)
      .not('id', 'is', null),
    supabase
      .from('user_trust_scores')
      .select('score, review_count')
      .eq('user_id', listing.host_id)
      .maybeSingle(),
    listing.place_id
      ? supabase
          .from('places')
          .select('name, address, city')
          .eq('id', listing.place_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const hostProfile = hostProfileResult.data;
  const requestStatus = requestStatusResult.data;
  const conversation = conversationResult.data;
  const acceptedCount = acceptedCountResult.count ?? 0;
  const pendingCount = pendingCountResult.count ?? 0;
  const hostPublishedCount = hostPublishedCountResult.count ?? 0;
  const hostTrust = hostTrustResult.data;
  const placeDetails = placeDetailsResult.data;

  const isHost = user?.id === listing.host_id;
  const canChat = requestStatus?.status === 'accepted' && conversation?.id;

  const hostLabel =
    hostProfile?.display_name ||
    listing.host_display_name ||
    listing.host_email ||
    (listing.host_id
      ? `Combattant ${listing.host_id.slice(0, 6).toUpperCase()}`
      : 'Combattant');

  const titleLabel =
    listing.title?.trim() ||
    (listing.training_type_name
      ? `Session de ${listing.training_type_name}`
      : 'Session');

  const disciplineLabels = Array.isArray(listing.disciplines)
    ? listing.disciplines
        .map(
          (item: { discipline_name?: string; skill_level_name?: string }) => {
            const disciplineName = item.discipline_name ?? 'Discipline';
            const levelName = item.skill_level_name;
            return levelName
              ? `${disciplineName} (${levelName})`
              : disciplineName;
          },
        )
        .filter(Boolean)
    : [];

  const placeName = placeDetails?.name ?? listing.place_name ?? 'Lieu';
  const placeAddress =
    placeDetails?.address ??
    (placeDetails?.city ?? listing.city ?? 'Adresse non renseignée');

  const scheduleLabel = `${new Date(listing.starts_at).toLocaleString('fr-FR')}${
    listing.duration_minutes ? ` · ${listing.duration_minutes} min` : ''
  }`;

  const locationHref =
    listing.place_lat != null && listing.place_lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${listing.place_lat},${listing.place_lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${placeName} ${placeDetails?.city ?? listing.city ?? ''}`,
        )}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-20 pt-6 md:px-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <BackLink label="Retour" fallbackHref="/find-sessions" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {listing.training_type_name ? (
                  <Badge variant="outline">{listing.training_type_name}</Badge>
                ) : null}
                {listing.is_full ? (
                  <Badge variant="secondary">Session complète</Badge>
                ) : null}
                {listing.is_boosted ? (
                  <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                    Boostée
                  </Badge>
                ) : null}
              </div>
              <CardTitle className="text-2xl leading-tight md:text-3xl">
                {titleLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <CalendarClock className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Date & heure
                      </p>
                      <p className="font-medium text-slate-900">{scheduleLabel}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Lieu
                      </p>
                      <p className="font-medium text-slate-900">{placeName}</p>
                      <p className="text-xs text-slate-500">{placeAddress}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Participants
                      </p>
                      <p className="font-medium text-slate-900">
                        {acceptedCount} accepté(s) · {pendingCount} en attente
                      </p>
                      <p className="text-xs text-slate-500">
                        Capacité cible: {listing.capacity ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                        Disciplines
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {disciplineLabels.length > 0 ? (
                          disciplineLabels.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                            >
                              {label}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">
                            Non renseigné
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {listing.description ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                  {listing.description}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Profil recherché</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <Scale className="h-4 w-4" />
                  Poids
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {formatRange(listing.weight_min, listing.weight_max, ' kg')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <UserRound className="h-4 w-4" />
                  Taille
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {formatRange(listing.height_min, listing.height_max, ' cm')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <Hand className="h-4 w-4" />
                  Main forte
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {formatDominantHand(listing.dominant_hand)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                  Gants
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {listing.glove_size || 'Non renseigné'}
                </p>
              </div>
            </CardContent>
          </Card>

          {listing.place_lat != null && listing.place_lng != null ? (
            <Card className="border-slate-200/70 bg-white/95">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-lg">Localisation</CardTitle>
                <Link
                  href={locationHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium underline"
                >
                  Ouvrir dans Maps
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <Image
                    src={`/api/mapbox/static?lat=${listing.place_lat}&lng=${listing.place_lng}&zoom=14&width=900&height=320`}
                    alt={`Carte de ${placeName}`}
                    width={900}
                    height={320}
                    className="h-64 w-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle>Host</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {listing.host_avatar_url ? (
                  <Image
                    src={listing.host_avatar_url}
                    alt={hostLabel}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
                    <UserRound className="h-6 w-6 text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {hostLabel}
                  </p>
                  <Link
                    href={`/profile/${listing.host_id}`}
                    className="text-sm text-slate-600 underline"
                  >
                    Voir le profil
                  </Link>
                </div>
              </div>
              <div className="grid gap-2 text-xs text-slate-600">
                <p>Ville: {hostProfile?.city ?? 'Non renseigné'}</p>
                <p>Main forte: {formatDominantHand(hostProfile?.dominant_hand)}</p>
                <p>
                  Taille:{' '}
                  {hostProfile?.height_cm
                    ? `${hostProfile.height_cm} cm`
                    : 'Non renseigné'}
                </p>
                <p>
                  Poids:{' '}
                  {hostProfile?.weight_kg
                    ? `${hostProfile.weight_kg} kg`
                    : 'Non renseigné'}
                </p>
                <p>
                  Sessions publiées:{' '}
                  <span className="font-medium">{hostPublishedCount}</span>
                </p>
                <div className="pt-1">
                  <p className="mb-1 text-xs text-slate-500">Confiance</p>
                  <TrustScore
                    score={hostTrust?.score}
                    reviewCount={hostTrust?.review_count}
                    size="sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {isHost ? (
                <BoostSessionButton sessionId={listing.id} />
              ) : (
                <RequestJoinButton sessionId={listing.id} isFull={listing.is_full} />
              )}
              {canChat ? (
                <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                  <Link href={`/app/chat/${conversation?.id}`}>Ouvrir le chat</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
