const apiVersion = '2024-01-01';

export type SanityBlock = {
  _type: 'block';
  style?: string;
  listItem?: 'bullet' | 'number';
  level?: number;
  children?: Array<{ _type: 'span'; text?: string }>;
};

export type SanityStaticPage = {
  title?: string | null;
  subtitle?: string | null;
  body?: SanityBlock[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type SanityBlogPostSummary = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
};

export type SanityBlogPost = SanityBlogPostSummary & {
  body?: SanityBlock[] | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

const readEnv = (key: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : null;
};

const sanityConfig = {
  projectId:
    readEnv('NEXT_PUBLIC_SANITY_PROJECT_ID') ?? readEnv('SANITY_PROJECT_ID'),
  dataset: readEnv('NEXT_PUBLIC_SANITY_DATASET') ?? readEnv('SANITY_DATASET'),
  token: readEnv('SANITY_API_READ_TOKEN'),
};

export function isSanityConfigured() {
  return Boolean(sanityConfig.projectId && sanityConfig.dataset);
}

type FetchOptions = {
  query: string;
  params?: Record<string, string | number | boolean | null>;
  revalidate?: number;
};

export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 60,
}: FetchOptions): Promise<T | null> {
  if (!isSanityConfigured()) return null;
  const projectId = sanityConfig.projectId as string;
  const dataset = sanityConfig.dataset as string;

  const url = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
  );
  url.searchParams.set('query', query);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  });

  const response = await fetch(url.toString(), {
    headers: sanityConfig.token
      ? { Authorization: `Bearer ${sanityConfig.token}` }
      : undefined,
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`Sanity fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as { result?: T };
  return payload.result ?? null;
}

export function blockText(block?: SanityBlock | null) {
  if (!block?.children || block.children.length === 0) return '';
  return block.children.map((child) => child.text ?? '').join('');
}

export function blocksToPlainText(blocks?: SanityBlock[] | null) {
  if (!blocks || blocks.length === 0) return '';
  return blocks
    .map((block) => blockText(block))
    .filter(Boolean)
    .join(' ')
    .trim();
}

export async function getStaticPage(slug: string) {
  return sanityFetch<SanityStaticPage>({
    query: `*[_type == "staticPage" && slug.current == $slug][0]{
      title,
      subtitle,
      body,
      "seoTitle": seo.title,
      "seoDescription": seo.description
    }`,
    params: { slug },
  });
}

export async function getBlogPosts() {
  return sanityFetch<SanityBlogPostSummary[]>({
    query: `*[
      _type == "post" &&
      (
        !defined(status) ||
        status == "published"
      )
    ] | order(coalesce(publishedAt, _updatedAt) desc){
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt
    }`,
  });
}

export async function getBlogPostBySlug(slug: string) {
  return sanityFetch<SanityBlogPost>({
    query: `*[
      _type == "post" &&
      slug.current == $slug &&
      (
        !defined(status) ||
        status == "published"
      )
    ][0]{
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      body,
      "seoTitle": seo.title,
      "seoDescription": seo.description
    }`,
    params: { slug },
  });
}
