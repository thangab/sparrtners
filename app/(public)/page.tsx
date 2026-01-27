import { Button } from '@/components/ui/button';
import { PlaceSearchInput } from '@/components/app/place-search-input';

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
          <form
            action="/find-sessions"
            className="flex w-full max-w-xl flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/80 p-2 shadow-sm sm:flex-row"
          >
            <div className="flex-1 px-2">
              <PlaceSearchInput
                variant="compact"
                placeholder="Recherche par lieu..."
                defaultLabel={defaultLabel}
                inputClassName="border-none bg-transparent text-base shadow-none focus-visible:ring-0"
              />
            </div>
            <Button
              type="submit"
              className="rounded-[22px] bg-slate-900 text-white hover:bg-slate-800"
            >
              Rechercher
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
