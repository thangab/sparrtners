import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts, isSanityConfigured } from '@/lib/sanity';

export const metadata: Metadata = {
  title: 'Blog | Sparrtners',
  description:
    'Lis les articles Sparrtners sur l’entraînement, la préparation au sparring et les routines en sports de combat.',
};

export default async function BlogPage() {
  const posts = (await getBlogPosts()) ?? [];
  const isConfigured = isSanityConfigured();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Contenu
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          Blog
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 md:text-base">
          Conseils d’entraînement, organisation de session et nouveautés produit.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article
              key={post._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <p className="text-xs text-slate-500">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                    })
                  : 'Date de brouillon'}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt ? (
                <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
              ) : null}
              <div className="mt-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-orange-700 hover:text-orange-800"
                >
                  Lire l’article
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            {isConfigured
              ? 'Aucun article publié pour le moment.'
              : 'Sanity n’est pas encore configuré. Ajoute les variables d’environnement SANITY pour charger le contenu.'}
          </div>
        )}
      </section>
    </main>
  );
}
