import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

type RelatedName = { name: string } | { name: string }[] | null;
type SportProfileRow = {
  height_cm: number | null;
  weight_kg: number | null;
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
    .from('profiles')
    .select('display_name')
    .eq('id', id)
    .maybeSingle();
  const { data: sportProfiles } = (await supabase
    .from('user_sport_profiles')
    .select(
      'height_cm, weight_kg, discipline_id, skill_level_id, discipline:disciplines(name), skill_level:skill_levels(name)',
    )
    .eq('user_id', id)
    .order('discipline_id', { ascending: true })) as {
    data: SportProfileRow[] | null;
  };

  const displayName = profile?.display_name ?? 'Nom non renseigné';
  const primaryProfile = sportProfiles?.[0];
  const primaryDisciplineName = extractName(primaryProfile?.discipline ?? null);
  const primarySkillName = extractName(primaryProfile?.skill_level ?? null);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link className="transition hover:text-slate-900" href="/find-sessions">
          ← Retour aux sessions
        </Link>
      </div>

      <section className="grid gap-6 rounded-4xl border border-slate-200/70 bg-white/90 p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-slate-900">
            {displayName}
          </h1>
          <p className="text-slate-600">
            Profil public pour organiser des sessions de sparring et
            d&apos;entraînement.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/find-sessions">Voir les annonces</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-3 rounded-3xl border border-slate-200/70 bg-slate-50/70 p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Infos clés
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div>
              <div className="text-xs text-slate-500">Discipline</div>
              <div className="font-medium">
                {primaryDisciplineName ?? 'Non renseigné'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Niveau</div>
              <div className="font-medium">
                {primarySkillName ?? 'Non renseigné'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Poids</div>
              <div className="font-medium">
                {primaryProfile?.weight_kg
                  ? `${primaryProfile.weight_kg} kg`
                  : 'Non renseigné'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Taille</div>
              <div className="font-medium">
                {primaryProfile?.height_cm
                  ? `${primaryProfile.height_cm} cm`
                  : 'Non renseigné'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Score confiance</div>
              <div className="font-medium">À venir</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Sessions</div>
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
            <CardTitle>Dernières sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Muay thaï · Lyon 7e</span>
              <Badge variant="secondary">Validée</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Boxe anglaise · Paris 11e</span>
              <Badge variant="secondary">Validée</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Grappling · Bordeaux</span>
              <Badge variant="secondary">Validée</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
