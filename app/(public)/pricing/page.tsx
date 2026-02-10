import { PricingSection } from '@/components/app/pricing-section';
import { PricingLimitModal } from '@/components/app/pricing-limit-modal';

export default async function PricingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 md:px-6">
      <PricingLimitModal />
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-orange-500 md:text-4xl">
          Deviens membre premium et bénéficie d’avantages supplémentaires
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-3xl font-extrabold text-slate-900">
            SPARRTNERS
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            PRO
          </span>
        </div>
      </header>

      <PricingSection checkoutFirstOnMobile />
    </div>
  );
}
