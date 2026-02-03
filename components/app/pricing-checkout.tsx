'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

type Sku =
  | 'premium_monthly'
  | 'premium_yearly'
  | 'premium_lifetime'
  | 'boost_pack_5';

export type PricingPlan = {
  sku: Sku;
  label: string;
  price: string;
  suffix: string;
};

export function PricingCheckout({ plans }: { plans: PricingPlan[] }) {
  const defaultSku = plans.find((plan) => plan.sku === 'premium_yearly')
    ? 'premium_yearly'
    : (plans[0]?.sku ?? 'premium_yearly');
  const [selected, setSelected] = React.useState<Sku>(defaultSku);
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: selected }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
        redirect?: string;
      };
      if (!response.ok && payload.redirect) {
        window.location.href = payload.redirect;
        return;
      }
      if (payload.url) {
        window.location.href = payload.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {plans.map((plan) => (
          <label
            key={plan.sku}
            className={`group flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 transition ${
              selected === plan.sku
                ? 'border-blue-500 bg-blue-50/40'
                : 'border-slate-200/70 bg-white hover:border-blue-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan"
                value={plan.sku}
                checked={selected === plan.sku}
                onChange={() => setSelected(plan.sku)}
                className="h-4 w-4 accent-blue-600"
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {plan.label}
                </div>
                <div className="text-sm text-slate-500">{plan.suffix}</div>
              </div>
            </div>
            <div className="text-lg font-semibold text-slate-900">
              {plan.price}
            </div>
          </label>
        ))}
      </div>

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-blue-600 py-6 text-sm font-semibold text-white hover:bg-blue-500"
      >
        {loading ? 'Redirection...' : 'Commencer'}
      </Button>
    </div>
  );
}
