import { HomeSearchForm } from '@/components/app/home-search-form';

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-2 pb-20 pt-10 md:px-6">
      <section className="grid gap-10 lg:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Trouve ton sparring partenaire près de chez toi
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Rejoins ou publie tes sessions d&apos;entraînement en un coup.
          </p>
        </div>
      </section>

      <div className="sticky top-20 z-30">
        <div className="max-w-5xl rounded-full bg-white/80 p-1 backdrop-blur-md">
          <HomeSearchForm defaultLabel={defaultLabel} />
        </div>
      </div>
    </div>
  );
}
