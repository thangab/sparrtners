import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

type RelatedName = { name: string } | { name: string }[] | null;
type SportProfileRow = {
  discipline_id: number;
  skill_level_id: number | null;
  discipline: RelatedName;
  skill_level: RelatedName;
};

function extractName(value: RelatedName) {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0]?.name : value.name;
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
  const { data: profile } = await supabase
    .from('public_profiles')
    .select(
      'display_name, city, created_at, bio, club, dominant_hand, height_cm, weight_kg, gender',
    )
    .eq('id', id)
    .maybeSingle();
  const { data: sportProfiles } = (await supabase
    .from('user_sport_profiles')
    .select(
      'discipline_id, skill_level_id, discipline:disciplines(name), skill_level:skill_levels(name)',
    )
    .eq('user_id', id)
    .order('discipline_id', { ascending: true })) as {
    data: SportProfileRow[] | null;
  };
  const { data: activeSessions } = await supabase
    .from('session_listings')
    .select('id, starts_at, place_name, city, disciplines')
    .eq('host_id', id)
    .gt('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true });
  const displayName = profile?.display_name ?? 'Non renseigné';
  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR')
    : 'Date inconnue';

  const dominantHandLabel =
    profile?.dominant_hand === 'right'
      ? 'Droitier'
      : profile?.dominant_hand === 'left'
        ? 'Gaucher'
        : profile?.dominant_hand === 'both'
          ? 'Les deux'
          : 'Non renseigné';
  const genderLabel =
    profile?.gender === 'female'
      ? 'Femme'
      : profile?.gender === 'male'
        ? 'Homme'
        : profile?.gender === 'other'
          ? 'Autre'
          : 'Non renseigné';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-6">
      <section className="grid gap-6 rounded-4xl border border-slate-200/70 bg-white/90 p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">
            {displayName}
            {profile?.city && ` · ${profile.city}`}
          </h1>
          <p className="text-slate-600">
            {profile?.height_cm ? `Taille : ${profile.height_cm} cm` : ''}
          </p>
          <p className="text-slate-600">
            {profile?.weight_kg ? `Poids : ${profile.weight_kg} kg` : ''}
          </p>
          <p className="text-slate-600">{profile?.bio ? profile.bio : ''}</p>
        </div>
        <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Infos
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div>
              <div className="text-xs text-slate-500">Genre</div>
              <div className="font-medium">{genderLabel}</div>
            </div>
            {profile?.club?.trim() && (
              <div>
                <div className="text-xs text-slate-500">Club</div>
                <div className="font-medium">{profile.club}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500">Main forte</div>
              <div className="font-medium">{dominantHandLabel}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Inscrit le</div>
              <div className="font-medium">{joinedLabel}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Score confiance</div>
              <div className="font-medium">À venir</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader>
            <CardTitle>Disciplines & niveaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {sportProfiles && sportProfiles.length > 0 ? (
              <ul className="space-y-2">
                {sportProfiles.map((profile) => (
                  <li
                    key={`${profile.discipline_id}-${profile.skill_level_id}`}
                  >
                    {extractName(profile.discipline) ?? 'Discipline'} ·{' '}
                    {extractName(profile.skill_level) ?? 'Niveau'}
                  </li>
                ))}
              </ul>
            ) : (
              <div>Ce profil n&apos;a pas encore de discipline renseignée.</div>
            )}
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader>
            <CardTitle>Sessions actives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {activeSessions && activeSessions.length > 0 ? (
              activeSessions.map((session) => {
                const disciplines = Array.isArray(session.disciplines)
                  ? session.disciplines
                  : [];
                const primary = disciplines[0] as
                  | { discipline_name?: string; skill_level_name?: string }
                  | undefined;
                const disciplineName = primary?.discipline_name ?? 'Session';
                const levelName = primary?.skill_level_name;
                const sessionTitle = levelName
                  ? `Session de ${disciplineName} - ${levelName}`
                  : `Session de ${disciplineName}`;
                const placeLabel = `${session.place_name ?? 'Lieu'}${
                  session.city ? ` · ${session.city}` : ''
                }`;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {sessionTitle}
                      </div>
                      <div className="text-xs text-slate-500">
                        {placeLabel} ·{' '}
                        {new Date(session.starts_at).toLocaleDateString(
                          'fr-FR',
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" asChild>
                        <Link href={`/sessions/${session.id}`}>
                          Plus de détails
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div>Aucune session active.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
