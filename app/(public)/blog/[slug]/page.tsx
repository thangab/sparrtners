import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SanityBlockContent } from '@/components/app/sanity-block-content';
import { blockText, blocksToPlainText, getBlogPostBySlug } from '@/lib/sanity';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3 } from 'lucide-react';

type BlogPostPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return { title: 'Article introuvable | Sparrtners' };
  }
  const fallbackDescription =
    post.excerpt ||
    blocksToPlainText(post.body).slice(0, 160) ||
    'Article du blog Sparrtners';

  return {
    title: `${post.seoTitle || post.title} | Sparrtners`,
    description: post.seoDescription || fallbackDescription,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await Promise.resolve(params);
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const toAnchorId = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const headings = (post.body ?? [])
    .filter((block) => block._type === 'block' && (block.style === 'h2' || block.style === 'h3'))
    .map((block) => {
      const text = blockText(block);
      if (!text) return null;
      return {
        text,
        level: block.style === 'h3' ? 3 : 2,
        id: toAnchorId(text),
      };
    })
    .filter((value): value is { text: string; level: 2 | 3; id: string } => Boolean(value));

  const words = blocksToPlainText(post.body).split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(words / 220));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <article className="space-y-6">
        <section className="rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,#fff7ed_0,#ffffff_58%,#f8fafc_100%)] p-6 shadow-[0_24px_45px_-38px_rgba(15,23,42,0.45)] md:p-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au blog
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 md:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                    dateStyle: 'long',
                  })
                : 'Brouillon'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              {readingMinutes} min de lecture
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
              {post.excerpt}
            </p>
          ) : null}
        </section>

        {post.mainImage?.url ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            <Image
              src={post.mainImage.url}
              alt={post.mainImage.alt || post.title}
              width={1800}
              height={1000}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}

        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
            <SanityBlockContent blocks={post.body} />
          </div>
          {headings.length > 0 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Sommaire
                </p>
                <nav className="mt-3 space-y-2">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className={`block text-sm text-slate-600 transition hover:text-slate-900 ${
                        heading.level === 3 ? 'pl-3' : ''
                      }`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          ) : null}
        </section>
      </article>
    </main>
  );
}
