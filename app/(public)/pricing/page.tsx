import {
  PricingCheckout,
  type PricingPlan,
} from '@/components/app/pricing-checkout';
import { stripe } from '@/lib/stripe';

const formatPrice = (amount: number | null, currency: string) => {
  if (amount == null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

export default async function PricingPage() {
  const priceIds = {
    premium_monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    premium_yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
    premium_lifetime: process.env.STRIPE_PREMIUM_LIFETIME_PRICE_ID,
  };

  const [monthly, yearly, lifetime] = await Promise.all([
    priceIds.premium_monthly
      ? stripe.prices.retrieve(priceIds.premium_monthly)
      : null,
    priceIds.premium_yearly
      ? stripe.prices.retrieve(priceIds.premium_yearly)
      : null,
    priceIds.premium_lifetime
      ? stripe.prices.retrieve(priceIds.premium_lifetime)
      : null,
  ]);

  const plans: PricingPlan[] = [
    monthly
      ? {
          sku: 'premium_monthly',
          label: 'PRO Mensuel',
          price: formatPrice(monthly.unit_amount, monthly.currency),
          suffix: 'Facturé chaque mois',
        }
      : null,
    yearly
      ? {
          sku: 'premium_yearly',
          label: 'PRO Annuel',
          price: formatPrice(yearly.unit_amount, yearly.currency),
          suffix: 'Facturé chaque année',
        }
      : null,
    lifetime
      ? {
          sku: 'premium_lifetime',
          label: 'PRO À vie',
          price: formatPrice(lifetime.unit_amount, lifetime.currency),
          suffix: 'Paiement unique',
        }
      : null,
  ].filter(Boolean) as PricingPlan[];
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 md:px-6">
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

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <section className="order-2 md:order-1">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="grid grid-cols-[1fr_60px_60px] items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid-cols-[1fr_88px_88px]">
              <span>Fonctionnalité</span>
              <span className="text-center text-slate-400">Gratuit</span>
              <span className="text-center text-slate-900">Pro</span>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {[
                ['Inscriptions illimitées aux évènements', '✓', '✓'],
                ['Historique', '✓', '✓'],
                ['Publication d’évènement illimitée', '4 max', '✓'],
                ['Statistiques avancées des publications', '✗', '✓'],
                ['Boosts des événements', 'à l’unité', '4'],
              ].map(([label, free, pro]) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_60px_60px] items-center gap-3 border-b border-slate-200/60 pb-3 last:border-b-0 last:pb-0 md:grid-cols-[1fr_88px_88px]"
                >
                  <span>{label}</span>
                  <span className="text-center text-slate-400">{free}</span>
                  <span className="text-center text-emerald-600">{pro}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 md:order-2">
          <PricingCheckout plans={plans} />
        </section>
      </div>
    </div>
  );
}
