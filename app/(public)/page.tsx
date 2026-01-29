import { SessionSearchForm } from '@/components/app/session-search-form';

export default async function HomePage({
  searchParams,
}: {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const defaultLabel =
    typeof resolvedSearchParams?.place_label === 'string'
      ? resolvedSearchParams.place_label
      : '';
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-10">
      <section className="grid gap-10 lg:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Trouve ton sparring partenaire près de chez toi
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Rejoins ou publie tes sessions d&apos;entraînement en quelques
            clics.
          </p>
          <div className="max-w-3xl">
            <SessionSearchForm
              defaultLabel={defaultLabel}
              action="/find-sessions"
              defaultShowAdvanced={false}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
