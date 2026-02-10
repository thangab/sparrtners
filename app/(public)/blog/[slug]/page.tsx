import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SanityBlockContent } from '@/components/app/sanity-block-content';
import { blocksToPlainText, getBlogPostBySlug } from '@/lib/sanity';

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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs text-slate-500">
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                dateStyle: 'long',
              })
            : 'Brouillon'}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {post.title}
        </h1>
        {post.excerpt ? (
          <p className="mt-3 text-sm text-slate-600 md:text-base">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-8">
          <SanityBlockContent blocks={post.body} />
        </div>
      </article>
    </main>
  );
}
