import type { Metadata } from 'next';
import { ContactForm } from '@/components/app/contact-form';
import { getStaticPage } from '@/lib/sanity';
import { SanityBlockContent } from '@/components/app/sanity-block-content';

export const metadata: Metadata = {
  title: 'Contact | Sparrtners',
  description:
    'Contacte l’équipe Sparrtners pour le support, les partenariats ou tes questions produit.',
};

export default async function ContactPage() {
  const page = await getStaticPage('contact');

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Sparrtners
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {page?.title?.trim() || 'Nous contacter'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          {page?.subtitle?.trim() ||
            'Une question, un partenariat ou un besoin de support ? Nous te répondons rapidement.'}
        </p>

        {page?.body && page.body.length > 0 ? (
          <div className="mt-6">
            <SanityBlockContent blocks={page.body} />
          </div>
        ) : null}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
