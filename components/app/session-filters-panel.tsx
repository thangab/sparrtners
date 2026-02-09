'use client';

import * as React from 'react';
import { SessionFiltersSidebar } from '@/components/app/session-filters-sidebar';
import { Button } from '@/components/ui/button';

type SessionFiltersPanelProps = {
  radiusKm?: number;
  heightRange?: [number, number];
  weightRange?: [number, number];
  defaultDominantHands?: string[];
  defaultDisciplines?: string[];
  defaultDateStart?: string;
  defaultDateEnd?: string;
  trainingTypes?: { id: number; name: string }[];
  defaultTrainingTypeIds?: string[];
  defaultDurationValue?: number;
};

export function SessionFiltersPanel(props: SessionFiltersPanelProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="h-fit self-start lg:sticky lg:top-24">
      <div className="flex justify-end lg:hidden">
        <Button
          type="button"
          variant="ghost"
          className="underline"
          onClick={() => setOpen(true)}
        >
          Filtrer
        </Button>
      </div>

      <div
        className={`fixed inset-0 z-60 transition lg:static lg:block lg:p-0 ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100'
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 transition lg:hidden ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />
        <div className="relative z-10 h-full w-full lg:h-auto lg:w-auto">
          <div className="flex h-full flex-col bg-white lg:block lg:bg-transparent">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 lg:hidden">
              <div className="text-base font-semibold text-slate-900">
                Filtres
              </div>
              <Button
                type="button"
                variant="ghost"
                className="h-8 px-2 text-xs text-slate-500"
                onClick={() => setOpen(false)}
              >
                Fermer
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:px-0 lg:pb-0 lg:pt-0 lg:pr-1">
              <SessionFiltersSidebar {...props} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
