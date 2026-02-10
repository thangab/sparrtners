import type { Metadata } from 'next';
import { StaticPageShell } from '@/components/app/static-page-shell';
import { getStaticPage } from '@/lib/sanity';

export const metadata: Metadata = {
  title: 'Conditions générales | Sparrtners',
  description:
    'Consulte les Conditions générales de Sparrtners, incluant les responsabilités utilisateur et les règles d’utilisation.',
};

export default async function TermsPage() {
  const page = await getStaticPage('terms');

  return (
    <StaticPageShell
      fallbackTitle="Conditions générales"
      fallbackSubtitle="Règles et responsabilités d’utilisation de Sparrtners."
      fallbackBody={[
        'En utilisant Sparrtners, tu acceptes d’utiliser la plateforme de manière responsable et de fournir des informations exactes.',
        'Tu es responsable de ton comportement lors des échanges et des sessions organisées via l’application.',
        'Sparrtners peut mettre à jour ces conditions si nécessaire. La poursuite de l’utilisation vaut acceptation de ces mises à jour.',
      ]}
      page={page}
    />
  );
}
