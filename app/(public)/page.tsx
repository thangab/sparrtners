import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const stats = [
  { label: 'Clubs & gyms', value: '80+' },
  { label: 'Sessions à venir', value: '260+' },
  { label: 'Sparring verified', value: '140' },
];

const features = [
  {
    title: 'Annonces comme Blablacar',
    text: 'Publie une annonce pour un sparring et précise le lieu, le niveau et le format.',
  },
  {
    title: 'Matching par profil',
    text: "Filtre par niveau, poids, taille, type d'entraînement et score de confiance.",
  },
  {
    title: 'Communauté fiable',
    text: "Notes, profils vérifiés et historique de sessions pour t'entraîner sereinement.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-10">
      <section className="grid gap-10 lg:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Trouve ton sparring partenaire près de chez toi
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Rejoins ou publie tes sessions d&apos;entraînement en quelques
            clics.
          </p>
          <form
            action="/find-sessions"
            className="flex w-full max-w-xl flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/80 p-2 shadow-sm sm:flex-row"
          >
            <Input
              name="q"
              placeholder="Recherche par discipline, ville, type d'entraînement..."
              className="border-none bg-transparent text-base shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              className="rounded-[22px] bg-slate-900 text-white hover:bg-slate-800"
            >
              Rechercher
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
