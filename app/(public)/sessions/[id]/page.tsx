import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { RequestJoinButton, BoostSessionButton } from './SessionActions';

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
      'id, title, description, starts_at, duration_minutes, host_id, host_display_name, host_email, host_avatar_url, training_type_name, place_name, city, is_boosted, disciplines',
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
  const { data: hostProfile } = await supabase
    .from('public_profiles')
    .select('display_name, city, dominant_hand, height_cm, weight_kg')
    .eq('id', listing.host_id)
    .maybeSingle();

  const isHost = user?.id === listing.host_id;
  const hostLabel =
    hostProfile?.display_name ||
    listing.host_display_name ||
    listing.host_email ||
    (listing.host_id
      ? `Combattant ${listing.host_id.slice(0, 6).toUpperCase()}`
      : 'Combattant');
  const isBoosted = !!listing.is_boosted;
  const sessionTitle = listing.training_type_name
    ? `Session de ${listing.training_type_name}`
    : 'Session';
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

  const { data: requestStatus } = user?.id
    ? await supabase
        .from('session_requests')
        .select('status')
        .eq('session_id', listing.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  const { data: conversation } = user?.id
    ? await supabase
        .from('conversations')
        .select('id')
        .eq('session_id', listing.id)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle()
    : { data: null };

  const canChat = requestStatus?.status === 'accepted' && conversation?.id;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link className="transition hover:text-slate-900" href="/find-sessions">
          ← Retour
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader>
            <CardTitle>Host</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
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
                <div className="h-14 w-14 rounded-full bg-slate-200" />
              )}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Profil
                </div>
                <Link
                  href={`/profile/${listing.host_id}`}
                  className="text-base font-medium text-slate-900 underline"
                >
                  {hostLabel}
                </Link>
              </div>
            </div>
            <div className="grid gap-2 text-xs text-slate-500">
              <div>Ville : {hostProfile?.city ?? 'Non renseigné'}</div>
              <div>
                Main forte :{' '}
                {hostProfile?.dominant_hand
                  ? hostProfile.dominant_hand === 'right'
                    ? 'Droitier'
                    : hostProfile.dominant_hand === 'left'
                      ? 'Gaucher'
                      : 'Les deux'
                  : 'Non renseigné'}
              </div>
              <div>
                Taille :{' '}
                {hostProfile?.height_cm
                  ? `${hostProfile.height_cm} cm`
                  : 'Non renseigné'}
              </div>
              <div>
                Poids :{' '}
                {hostProfile?.weight_kg
                  ? `${hostProfile.weight_kg} kg`
                  : 'Non renseigné'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-2xl">{sessionTitle}</CardTitle>
              {isBoosted ? (
                <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                  Boostée
                </Badge>
              ) : null}
            </div>
            <div className="text-sm text-slate-600">
              {disciplineLabels.length > 0
                ? disciplineLabels.join(' · ')
                : 'Disciplines'}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div>
              {new Date(listing.starts_at).toLocaleString('fr-FR')}
              {listing.duration_minutes
                ? ` · ${listing.duration_minutes} min`
                : ''}
            </div>
            <div>
              {listing.place_name ?? 'Lieu'}{' '}
              {listing.city ? `· ${listing.city}` : ''}
            </div>
            {listing.description ? (
              <p className="leading-relaxed">{listing.description}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {isHost ? (
          <BoostSessionButton sessionId={listing.id} />
        ) : (
          <RequestJoinButton sessionId={listing.id} />
        )}
        {canChat ? (
          <Button
            asChild
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <Link href={`/app/chat/${conversation?.id}`}>Ouvrir le chat</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
