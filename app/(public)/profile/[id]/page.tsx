import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarClock,
  Crown,
  Dumbbell,
  Hand,
  MapPin,
  Scale,
  ShieldCheck,
  Star,
  UserRound,
  Users,
} from 'lucide-react';
import { BackLink } from '@/components/app/back-link';
import { TrustScore } from '@/components/app/trust-score';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

type SportProfileRow = {
  discipline_id: number;
  skill_level_id: number | null;
  discipline_name: string | null;
  skill_level_name: string | null;
};

type ReviewRow = {
  reviewer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type ActiveSessionRow = {
  id: string;
  starts_at: string;
  place_name: string | null;
  city: string | null;
  training_type_name: string | null;
  disciplines:
    | { discipline_name?: string; skill_level_name?: string }[]
    | null
    | unknown;
};

function fallbackName(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

function formatDominantHand(value?: string | null) {
  if (!value) return 'Non renseigné';
  if (value === 'right') return 'Droitier';
  if (value === 'left') return 'Gaucher';
  if (value === 'both') return 'Ambidextre';
  return 'Non renseigné';
}

function formatGender(value?: string | null) {
  if (!value) return 'Non renseigné';
  if (value === 'female') return 'Femme';
  if (value === 'male') return 'Homme';
  if (value === 'other') return 'Autre';
  return 'Non renseigné';
}

function getInitials(name: string) {
  const parts = name
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return 'SP';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export default async function FighterProfilePage({
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
          <CardTitle>Profil introuvable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Identifiant manquant dans l&apos;URL.
        </CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClientReadOnly();
  const nowIso = new Date().toISOString();
  const [
    profileResult,
    sportProfilesResult,
    activeSessionsResult,
    publishedSessionsCountResult,
    trustResult,
    reviewsResult,
  ] =
    await Promise.all([
      supabase
        .from('public_profiles')
        .select(
          'display_name, avatar_url, city, created_at, bio, club, dominant_hand, height_cm, weight_kg, gender',
        )
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('public_user_sport_profiles')
        .select('discipline_id, skill_level_id, discipline_name, skill_level_name')
        .eq('user_id', id)
        .order('discipline_id', { ascending: true }),
      supabase
        .from('session_listings')
        .select('id, starts_at, place_name, city, training_type_name, disciplines')
        .eq('host_id', id)
        .gt('starts_at', nowIso)
        .order('starts_at', { ascending: true })
        .limit(4),
      supabase
        .from('session_listings')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', id)
        .not('id', 'is', null),
      supabase
        .from('user_trust_scores')
        .select('score, review_count')
        .eq('user_id', id)
        .maybeSingle(),
      supabase
        .from('reviews')
        .select('reviewer_id, rating, comment, created_at')
        .eq('reviewed_user_id', id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

  const profile = profileResult.data;
  const sportProfiles = (sportProfilesResult.data ?? []) as SportProfileRow[];
  const activeSessions = (activeSessionsResult.data ?? []) as ActiveSessionRow[];
  const publishedSessionsCount = publishedSessionsCountResult.count ?? 0;
  const trustScore = trustResult.data;
  const reviews = (reviewsResult.data ?? []) as ReviewRow[];

  const reviewerIds = Array.from(
    new Set((reviews ?? []).map((review) => review.reviewer_id)),
  );
  const { data: reviewerProfiles } = reviewerIds.length
    ? await supabase
        .from('public_profiles')
        .select('id, display_name')
        .in('id', reviewerIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const reviewerMap = new Map(
    (reviewerProfiles ?? []).map((reviewerProfile) => [
      reviewerProfile.id,
      reviewerProfile,
    ]),
  );

  const displayName = profile?.display_name ?? 'Sportif';
  const cityLabel = profile?.city ?? 'Ville non renseignée';
  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR')
    : 'Date inconnue';
  const dominantHandLabel = formatDominantHand(profile?.dominant_hand);
  const genderLabel = formatGender(profile?.gender);
  const reviewCount = trustScore?.review_count ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-20 pt-6 md:px-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <BackLink label="Retour" fallbackHref="/find-sessions" />
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-bold text-slate-700">
                  {getInitials(displayName)}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  {displayName}
                </h1>
                <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {cityLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {genderLabel}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                {dominantHandLabel}
              </span>
              {profile?.club?.trim() ? (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  Club: {profile.club}
                </span>
              ) : null}
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-700">
              {profile?.bio?.trim()
                ? profile.bio
                : 'Ce sportif n’a pas encore ajouté de bio.'}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                Confiance
              </p>
              <div className="mt-2">
                <TrustScore
                  score={trustScore?.score}
                  reviewCount={trustScore?.review_count}
                  showReviewCount={false}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                Avis
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {reviewCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                Sessions publiées
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {publishedSessionsCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                Membre depuis
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {joinedLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dumbbell className="h-5 w-5 text-slate-500" />
                Disciplines et niveaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sportProfiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sportProfiles.map((sportProfile) => {
                    const discipline = fallbackName(
                      sportProfile.discipline_name,
                      'Discipline',
                    );
                    const level = fallbackName(
                      sportProfile.skill_level_name,
                      'Niveau',
                    );
                    return (
                      <span
                        key={`${sportProfile.discipline_id}-${sportProfile.skill_level_id}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                      >
                        {discipline} · {level}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Ce profil n&apos;a pas encore de discipline renseignée.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-slate-500" />
                Fiche sportive
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <Scale className="h-4 w-4" />
                  Poids
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {profile?.weight_kg ? `${profile.weight_kg} kg` : 'Non renseigné'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <UserRound className="h-4 w-4" />
                  Taille
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {profile?.height_cm ? `${profile.height_cm} cm` : 'Non renseigné'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <Hand className="h-4 w-4" />
                  Main forte
                </div>
                <p className="mt-1 font-medium text-slate-900">{dominantHandLabel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <Crown className="h-4 w-4" />
                  Club
                </div>
                <p className="mt-1 font-medium text-slate-900">
                  {profile?.club?.trim() ? profile.club : 'Non renseigné'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-slate-500" />
                Avis récents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => {
                  const reviewer =
                    reviewerMap.get(review.reviewer_id)?.display_name ?? 'Sportif';
                  return (
                    <div
                      key={`${review.reviewer_id}-${review.created_at}`}
                      className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{reviewer}</p>
                        <p className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </p>
                      </div>
                      {review.comment?.trim() ? (
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          Aucun commentaire écrit.
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-600">Aucun avis pour le moment.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-slate-500" />
                Sessions organisées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSessions.length > 0 ? (
                activeSessions.map((session) => {
                  const title = session.training_type_name?.trim()
                    ? `Session de ${session.training_type_name}`
                    : 'Session';
                  const placeLabel = `${session.place_name ?? 'Lieu'}${
                    session.city ? ` · ${session.city}` : ''
                  }`;
                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="font-medium text-slate-900">{title}</p>
                      <p className="mt-1 text-xs text-slate-600">{placeLabel}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {new Date(session.starts_at).toLocaleString('fr-FR')}
                      </p>
                      <Button variant="outline" size="sm" asChild className="mt-3">
                        <Link href={`/sessions/${session.id}`}>Voir la session</Link>
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-600">Aucune session active.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
