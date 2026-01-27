import Link from 'next/link';
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
      'id, title, description, starts_at, ends_at, training_type_id, place_id, host_id, training_type_name, place_name, city, is_boosted, disciplines',
    )
    .eq('id', id)
    .maybeSingle();

  const { data: session } = listing
    ? { data: listing }
    : await supabase
        .from('sessions')
        .select(
          'id, title, description, starts_at, ends_at, discipline_id, training_type_id, place_id, host_id',
        )
        .eq('id', id)
        .maybeSingle();

  if (!session) {
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

  const [trainingTypeRes, placeRes, boostRes, disciplinesRes] =
    await Promise.all([
      listing?.training_type_name
        ? Promise.resolve({ data: { name: listing.training_type_name } })
        : supabase
            .from('training_types')
            .select('name')
            .eq('id', session.training_type_id)
            .maybeSingle(),
      listing?.place_name
        ? Promise.resolve({
            data: { name: listing.place_name, city: listing.city },
          })
        : supabase
            .from('places')
            .select('name, city')
            .eq('id', session.place_id)
            .maybeSingle(),
      listing
        ? Promise.resolve({
            data: {
              ends_at: listing.is_boosted ? new Date().toISOString() : null,
            },
          })
        : supabase
            .from('session_boosts')
            .select('ends_at')
            .eq('session_id', session.id)
            .gt('ends_at', new Date().toISOString())
            .order('ends_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
      Array.isArray(listing?.disciplines)
        ? Promise.resolve({ data: listing?.disciplines })
        : supabase
            .from('session_disciplines')
            .select(
              'discipline:disciplines(name), skill_level:skill_levels(name)',
            )
            .eq('session_id', session.id),
    ]);

  const isHost = user?.id === session.host_id;
  const isBoosted = !!boostRes.data?.ends_at;
  const disciplineLabels = Array.isArray(disciplinesRes.data)
    ? disciplinesRes.data
        .map(
          (item: {
            discipline_name?: string;
            skill_level_name?: string;
            discipline?: { name?: string };
            skill_level?: { name?: string };
          }) => {
            const disciplineName =
              item.discipline_name ?? item.discipline?.name ?? 'Discipline';
            const levelName = item.skill_level_name ?? item.skill_level?.name;
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
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  const { data: conversation } = user?.id
    ? await supabase
        .from('conversations')
        .select('id')
        .eq('session_id', session.id)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .maybeSingle()
    : { data: null };

  const canChat = requestStatus?.status === 'accepted' && conversation?.id;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link className="transition hover:text-slate-900" href="/find-sessions">
          ← Retour aux sessions
        </Link>
      </div>

      <Card className="border-slate-200/70 bg-white/90">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-2xl">{session.title}</CardTitle>
            {isBoosted ? (
              <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                Boostée
              </Badge>
            ) : null}
          </div>
          <div className="text-sm text-slate-600">
            {disciplineLabels.length > 0
              ? disciplineLabels.join(' · ')
              : 'Disciplines'}{' '}
            · {trainingTypeRes.data?.name ?? 'Type'}
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 text-sm text-slate-600 md:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-3">
            <p className="leading-relaxed">{session.description}</p>
            <div>
              {new Date(session.starts_at).toLocaleString('fr-FR')} →{' '}
              {new Date(session.ends_at).toLocaleString('fr-FR')}
            </div>
            <div>
              {placeRes.data?.name ?? 'Lieu'}{' '}
              {placeRes.data?.city ? `· ${placeRes.data?.city}` : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {isHost ? (
          <BoostSessionButton sessionId={session.id} />
        ) : (
          <RequestJoinButton sessionId={session.id} />
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
