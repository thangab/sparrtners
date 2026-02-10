'use client';

import { PlaceSearchInput } from '@/components/app/place-search-input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type PlaceSearchBarProps = {
  defaultLabel?: string;
  defaultCoords?: { lat: number; lng: number } | null;
  placeholder?: string;
};

export function PlaceSearchBar({
  defaultLabel,
  defaultCoords = null,
  placeholder = 'Ville, salle ou quartier... trouve ton prochain sparring',
}: PlaceSearchBarProps) {
  return (
    <div className="relative flex flex-row items-stretch gap-0 rounded-[1.1rem] border border-orange-200/70 bg-gradient-to-r from-white via-orange-50/80 to-amber-50/80 p-1 shadow-[0_14px_36px_-28px_rgba(234,88,12,0.75)] transition focus-within:border-orange-300 focus-within:shadow-[0_22px_40px_-26px_rgba(234,88,12,0.75)]">
      <PlaceSearchInput
        variant="compact"
        placeholder={placeholder}
        containerClassName="min-w-0 flex-1"
        inputClassName="h-12 rounded-[0.9rem] rounded-r-none border-0 bg-white/90 px-4 text-[15px] font-medium text-slate-900 shadow-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-0"
        defaultLabel={defaultLabel}
        defaultCoords={defaultCoords}
      />
      <Button
        type="submit"
        className="h-12 rounded-[0.9rem] rounded-l-none bg-gradient-to-r from-orange-500 to-amber-500 px-6 font-semibold text-white shadow-[0_10px_24px_-14px_rgba(245,158,11,0.9)] transition hover:from-orange-600 hover:to-amber-600"
      >
        <Search className="h-4 w-4 md:hidden" />
        <span className="hidden md:flex">Rechercher</span>
      </Button>
    </div>
  );
}
