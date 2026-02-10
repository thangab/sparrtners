import type { Metadata } from 'next';
import { StaticPageShell } from '@/components/app/static-page-shell';
import { getStaticPage } from '@/lib/sanity';

export const metadata: Metadata = {
  title: 'À propos | Sparrtners',
  description:
    'Découvre comment Sparrtners aide les sportifs à trouver des partenaires compatibles et à organiser leurs sessions.',
};

export default async function AboutPage() {
  const page = await getStaticPage('about');

  return (
    <StaticPageShell
      fallbackTitle="À propos"
      fallbackSubtitle="Pourquoi Sparrtners existe."
      fallbackBody={[
        'Sparrtners aide les sportifs de combat à trouver des partenaires compatibles selon le niveau, la discipline, la disponibilité et la localisation.',
        'Notre objectif est simple : rendre l’organisation des sessions claire, rapide et fiable, de la demande à la confirmation puis au chat.',
      ]}
      page={page}
    />
  );
}
