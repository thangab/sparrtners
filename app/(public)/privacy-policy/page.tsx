import type { Metadata } from 'next';
import { StaticPageShell } from '@/components/app/static-page-shell';
import { getStaticPage } from '@/lib/sanity';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Sparrtners',
  description:
    'Comprends quelles données Sparrtners collecte, comment elles sont utilisées et quels sont tes droits.',
};

export default async function PrivacyPolicyPage() {
  const page = await getStaticPage('privacy-policy');

  return (
    <StaticPageShell
      fallbackTitle="Politique de confidentialité"
      fallbackSubtitle="Comment Sparrtners traite tes données personnelles."
      fallbackBody={[
        'Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme et à l’amélioration du matching.',
        'Tes informations sont traitées de manière sécurisée et ne sont jamais vendues à des tiers.',
        'Tu peux demander la mise à jour ou la suppression de tes données selon la réglementation applicable.',
      ]}
      page={page}
    />
  );
}
