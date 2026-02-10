import type { Metadata } from 'next';
import Link from 'next/link';
import { getBlogPosts, isSanityConfigured } from '@/lib/sanity';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, CalendarDays } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | Sparrtners',
  description:
    'Lis les articles Sparrtners sur l’entraînement, la préparation au sparring et les routines en sports de combat.',
};

export default async function BlogPage() {
  const posts = (await getBlogPosts()) ?? [];
  const isConfigured = isSanityConfigured();
  const featuredPost = posts[0] ?? null;
  const otherPosts = posts.slice(1);

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString('fr-FR', {
          dateStyle: 'long',
        })
      : 'Date de brouillon';

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,#fff7ed_0,#ffffff_58%,#f8fafc_100%)] p-6 shadow-[0_24px_45px_-38px_rgba(15,23,42,0.45)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Blog Sparrtners
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
          Conseils, méthodes et retours terrain
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
          Découvre des contenus concrets pour progresser en sports de combat:
          sparring, technique, mindset, préparation de session et récupération.
        </p>
      </section>

      {featuredPost ? (
        <section className="mt-8">
          <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_45px_-35px_rgba(15,23,42,0.5)]">
            <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
              <div className="relative min-h-64 bg-slate-100">
                {featuredPost.mainImage?.url ? (
                  <Image
                    src={featuredPost.mainImage.url}
                    alt={featuredPost.mainImage.alt || featuredPost.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 55vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#fdba74_0,#fb923c_25%,#0f172a_100%)] p-6">
                    <span className="text-center text-2xl font-black tracking-tight text-white">
                      {featuredPost.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-between p-6 md:p-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
                    <BookOpen className="h-3.5 w-3.5" />
                    Article vedette
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt ? (
                    <p className="text-sm leading-6 text-slate-600 md:text-base">
                      {featuredPost.excerpt}
                    </p>
                  ) : null}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-xs text-slate-500 md:text-sm">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(featuredPost.publishedAt)}
                  </p>
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Lire l&apos;article
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className="mt-8">
        {posts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map((post) => (
              <article
                key={post._id}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-44 bg-slate-100">
                  {post.mainImage?.url ? (
                    <Image
                      src={post.mainImage.url}
                      alt={post.mainImage.alt || post.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-100 p-4">
                      <span className="line-clamp-2 text-center text-sm font-bold text-slate-500">
                        {post.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <p className="text-xs text-slate-500">{formatDate(post.publishedAt)}</p>
                  <h3 className="line-clamp-2 text-lg font-bold text-slate-900">
                    <Link href={`/blog/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? (
                    <p className="line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
                  ) : null}
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 transition hover:text-orange-800"
                  >
                    Lire
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
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
