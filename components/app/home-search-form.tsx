'use client';

import * as React from 'react';
import { PlaceSearchInput } from '@/components/app/place-search-input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type HomeSearchFormProps = {
  action?: string;
  defaultLabel?: string;
};

export function HomeSearchForm({
  action = '/find-sessions',
  defaultLabel,
}: HomeSearchFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const params = new URLSearchParams();
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (!trimmed) continue;
      params.append(key, trimmed);
    }

    const query = params.toString();
    const target = query ? `${action}?${query}` : action;
    window.location.assign(target);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-row items-stretch gap-0">
      <PlaceSearchInput
        variant="compact"
        placeholder="Où ?"
        containerClassName="flex-1"
        inputClassName="h-11 rounded-full bg-white rounded-r-none"
        defaultLabel={defaultLabel}
      />
      <Button
        type="submit"
        className="h-11 rounded-full bg-slate-900 px-6 text-white hover:bg-slate-800 rounded-l-none"
      >
        <Search className="h-4 w-4 md:hidden" />
        <span className="hidden md:flex">Rechercher</span>
      </Button>
    </form>
  );
}
