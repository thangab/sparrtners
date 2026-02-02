'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

type SessionFiltersSidebarProps = {
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

export function SessionFiltersSidebar({
  radiusKm = 25,
  heightRange = [0, 250],
  weightRange = [0, 200],
  defaultDominantHands = [],
  defaultDisciplines = [],
  defaultDateStart,
  defaultDateEnd,
  trainingTypes = [],
  defaultTrainingTypeIds = [],
  defaultDurationValue = 60,
}: SessionFiltersSidebarProps) {
  const router = useRouter();
  const [radiusValue, setRadiusValue] = React.useState(radiusKm);
  const [heightValue, setHeightValue] =
    React.useState<[number, number]>(heightRange);
  const [weightValue, setWeightValue] =
    React.useState<[number, number]>(weightRange);
  const [durationValue, setDurationValue] =
    React.useState<number>(defaultDurationValue);

  return (
    <aside className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm">
      <div className="space-y-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Trier par</div>
        <Button
          type="button"
          variant="ghost"
          className="text-xs text-slate-600 cursor-pointer"
          onClick={() => {
            setRadiusValue(25);
            setHeightValue([0, 250]);
            setWeightValue([0, 200]);
            setDurationValue(60);
            const form = document.getElementById(
              'find-sessions-form',
            ) as HTMLFormElement | null;
            form?.reset();
            router.replace('/find-sessions');
            router.refresh();
          }}
        >
          Tout effacer
        </Button>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">Date</div>
        <div className="grid gap-2">
          <input
            type="date"
            name="date_start"
            defaultValue={defaultDateStart}
            className="h-10 w-full rounded-(--radius) border border-border bg-white px-3 text-sm shadow-sm"
          />
          <input
            type="date"
            name="date_end"
            defaultValue={defaultDateEnd}
            className="h-10 w-full rounded-(--radius) border border-border bg-white px-3 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">
          Type d&apos;entraînement
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-700">
          {trainingTypes.map((type) => (
            <label key={type.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="training_type_id"
                value={type.id}
                defaultChecked={defaultTrainingTypeIds.includes(
                  String(type.id),
                )}
                className="h-4 w-4 rounded border-slate-400"
              />
              {type.name}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">
          Durée de la session
        </div>
        <Slider
          min={30}
          max={240}
          step={15}
          value={[durationValue]}
          onValueChange={(value) => setDurationValue(value[0] ?? 60)}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>30 min</span>
          <span>{durationValue} min</span>
          <span>240 min</span>
        </div>
        <input type="hidden" name="duration_max" value={durationValue} />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">
          Distance autour de moi
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[radiusValue]}
          onValueChange={(value) => setRadiusValue(value[0] ?? 25)}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>1 km</span>
          <span>{radiusValue} km</span>
          <span>100 km</span>
        </div>
        <input type="hidden" name="radius_km" value={radiusValue} />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">Taille</div>
        <Slider
          min={0}
          max={250}
          step={1}
          value={heightValue}
          onValueChange={(value) => setHeightValue(value as [number, number])}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{heightValue[0]} cm</span>
          <span>{heightValue[1]} cm</span>
        </div>
        <input
          type="hidden"
          name="height_min"
          value={heightValue[0]}
          form="find-sessions-form"
        />
        <input
          type="hidden"
          name="height_max"
          value={heightValue[1]}
          form="find-sessions-form"
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">Poids</div>
        <Slider
          min={0}
          max={200}
          step={1}
          value={weightValue}
          onValueChange={(value) => setWeightValue(value as [number, number])}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{weightValue[0]} kg</span>
          <span>{weightValue[1]} kg</span>
        </div>
        <input type="hidden" name="weight_min" value={weightValue[0]} />
        <input type="hidden" name="weight_max" value={weightValue[1]} />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">
          Disciplines recherchées
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-700">
          {[
            { value: 'boxing', label: 'Boxe anglaise' },
            { value: 'pieds-poings', label: 'Pieds-poings' },
            { value: 'mma', label: 'MMA' },
            { value: 'wrestling', label: 'Lutte' },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="disciplines"
                value={item.value}
                defaultChecked={defaultDisciplines.includes(item.value)}
                className="h-4 w-4 rounded border-slate-400"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">Main forte</div>
        <div className="flex flex-col gap-2 text-sm text-slate-700">
          {[
            { value: 'right', label: 'Droitier' },
            { value: 'left', label: 'Gaucher' },
          ].map((item) => (
            <label key={item.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="dominant_hand"
                value={item.value}
                defaultChecked={defaultDominantHands.includes(item.value)}
                className="h-4 w-4 rounded border-slate-400"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full rounded-full">
        Appliquer les filtres
      </Button>
    </aside>
  );
}
