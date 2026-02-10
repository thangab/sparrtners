'use client';

import * as React from 'react';
import { PlaceSearchBar } from '@/components/app/place-search-bar';

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
    <form onSubmit={handleSubmit}>
      <PlaceSearchBar defaultLabel={defaultLabel} />
    </form>
  );
}
