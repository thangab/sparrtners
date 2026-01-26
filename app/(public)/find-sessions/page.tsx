import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export default async function SessionsPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const { data: sessions, error } = await supabase
    .from('session_listings')
    .select('id, title, starts_at, place_name, city, is_boosted, disciplines')
    .order('is_boosted', { ascending: false })
    .order('starts_at', { ascending: true });
  const safeSessions = (sessions ?? []).filter((session) => !!session?.id);

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
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            name="q"
            placeholder="Recherche discipline, ville, type d'entraînement"
            className="bg-white"
          />
          <Button variant="outline">Filtrer</Button>
          <Button variant="secondary">Aujourd&apos;hui</Button>
        </div>
        <form className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white p-6 md:grid-cols-3">
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
          safeSessions.map((session) => (
            <Card key={session.id} className="border-slate-200/70 bg-white/90">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{session.title}</CardTitle>
                  {session.is_boosted ? (
                    <Badge className="bg-amber-200 text-amber-900 hover:bg-amber-200">
                      Boostée
                    </Badge>
                  ) : null}
                </div>
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
                  {session.place_name} {session.city ? `· ${session.city}` : ''}
                </div>
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <Link href={`/sessions/${session.id}`}>Voir détail</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
