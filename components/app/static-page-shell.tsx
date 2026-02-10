import { SanityStaticPage, blocksToPlainText } from '@/lib/sanity';
import { SanityBlockContent } from '@/components/app/sanity-block-content';

type StaticPageShellProps = {
  fallbackTitle: string;
  fallbackSubtitle: string;
  fallbackBody: string[];
  page?: SanityStaticPage | null;
};

export function StaticPageShell({
  fallbackTitle,
  fallbackSubtitle,
  fallbackBody,
  page,
}: StaticPageShellProps) {
  const title = page?.title?.trim() || fallbackTitle;
  const subtitle = page?.subtitle?.trim() || fallbackSubtitle;
  const hasCmsBody = Boolean(blocksToPlainText(page?.body));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Sparrtners
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">{subtitle}</p>

        <div className="mt-6">
          {hasCmsBody ? (
            <SanityBlockContent blocks={page?.body} />
          ) : (
            <div className="space-y-3 text-sm leading-7 text-slate-700 md:text-base">
              {fallbackBody.map((line) => (
                <p key={line.slice(0, 24)}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
