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
  const defaultRadius = 25;
  const defaultHeightRange: [number, number] = [0, 250];
  const defaultWeightRange: [number, number] = [0, 200];
  const defaultDuration = 60;
  const router = useRouter();
  const [radiusValue, setRadiusValue] = React.useState(radiusKm);
  const [heightValue, setHeightValue] =
    React.useState<[number, number]>(heightRange);
  const [weightValue, setWeightValue] =
    React.useState<[number, number]>(weightRange);
  const [durationValue, setDurationValue] =
    React.useState<number>(defaultDurationValue);
  const [dateStartValue, setDateStartValue] = React.useState(
    defaultDateStart ?? '',
  );
  const [dateEndValue, setDateEndValue] = React.useState(
    defaultDateEnd ?? '',
  );
  const [selectedTrainingTypes, setSelectedTrainingTypes] = React.useState(
    defaultTrainingTypeIds,
  );
  const [selectedDisciplines, setSelectedDisciplines] = React.useState(
    defaultDisciplines,
  );
  const [selectedDominantHands, setSelectedDominantHands] = React.useState(
    defaultDominantHands,
  );
  const didMountRef = React.useRef(false);
  const submitFilters = React.useCallback(() => {
    const form = document.getElementById(
      'find-sessions-form',
    ) as HTMLFormElement | null;
    if (!form) return;
    const data = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const trimmed = String(value).trim();
      if (!trimmed) continue;
      params.append(key, trimmed);
    }
    if (params.toString().length === 0) {
      router.replace('/find-sessions');
      return;
    }
    form.requestSubmit();
  }, [router]);

  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    submitFilters();
  }, [dateStartValue, dateEndValue, submitFilters]);

  React.useEffect(() => {
    setSelectedTrainingTypes(defaultTrainingTypeIds);
  }, [defaultTrainingTypeIds]);

  React.useEffect(() => {
    setSelectedDisciplines(defaultDisciplines);
  }, [defaultDisciplines]);

  React.useEffect(() => {
    setSelectedDominantHands(defaultDominantHands);
  }, [defaultDominantHands]);

  return (
    <aside className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-sm">
      <div className="space-y-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Trier par</div>
        <Button
          type="button"
          variant="ghost"
          className="text-xs text-slate-600 cursor-pointer"
          onClick={() => {
            setRadiusValue(defaultRadius);
            setHeightValue(defaultHeightRange);
            setWeightValue(defaultWeightRange);
            setDurationValue(defaultDuration);
            setDateStartValue('');
            setDateEndValue('');
            setSelectedTrainingTypes([]);
            setSelectedDisciplines([]);
            setSelectedDominantHands([]);
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
            name={dateStartValue ? 'date_start' : undefined}
            value={dateStartValue}
            onChange={(event) => setDateStartValue(event.target.value)}
            className="h-10 w-full rounded-(--radius) border border-border bg-white px-3 text-sm shadow-sm"
          />
          <input
            type="date"
            name={dateEndValue ? 'date_end' : undefined}
            value={dateEndValue}
            onChange={(event) => setDateEndValue(event.target.value)}
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
                checked={selectedTrainingTypes.includes(String(type.id))}
                onChange={() => {
                  setSelectedTrainingTypes((current) => {
                    if (current.includes(String(type.id))) {
                      return current.filter((item) => item !== String(type.id));
                    }
                    return [...current, String(type.id)];
                  });
                  submitFilters();
                }}
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
          onValueCommit={(value) => {
            setDurationValue(value[0] ?? 60);
            submitFilters();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>30 min</span>
          <span>{durationValue} min</span>
          <span>240 min</span>
        </div>
        <input
          type="hidden"
          name={durationValue !== defaultDuration ? 'duration_max' : undefined}
          value={durationValue}
        />
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
          onValueCommit={(value) => {
            setRadiusValue(value[0] ?? 25);
            submitFilters();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>1 km</span>
          <span>{radiusValue} km</span>
          <span>100 km</span>
        </div>
        <input
          type="hidden"
          name={radiusValue !== defaultRadius ? 'radius_km' : undefined}
          value={radiusValue}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700">Taille</div>
        <Slider
          min={0}
          max={250}
          step={1}
          value={heightValue}
          onValueChange={(value) => setHeightValue(value as [number, number])}
          onValueCommit={(value) => {
            setHeightValue(value as [number, number]);
            submitFilters();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{heightValue[0]} cm</span>
          <span>{heightValue[1]} cm</span>
        </div>
        <input
          type="hidden"
          name={
            heightValue[0] !== defaultHeightRange[0]
              ? 'height_min'
              : undefined
          }
          value={heightValue[0]}
          form="find-sessions-form"
        />
        <input
          type="hidden"
          name={
            heightValue[1] !== defaultHeightRange[1]
              ? 'height_max'
              : undefined
          }
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
          onValueCommit={(value) => {
            setWeightValue(value as [number, number]);
            submitFilters();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{weightValue[0]} kg</span>
          <span>{weightValue[1]} kg</span>
        </div>
        <input
          type="hidden"
          name={
            weightValue[0] !== defaultWeightRange[0]
              ? 'weight_min'
              : undefined
          }
          value={weightValue[0]}
        />
        <input
          type="hidden"
          name={
            weightValue[1] !== defaultWeightRange[1]
              ? 'weight_max'
              : undefined
          }
          value={weightValue[1]}
        />
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
                checked={selectedDisciplines.includes(item.value)}
                onChange={() => {
                  setSelectedDisciplines((current) => {
                    if (current.includes(item.value)) {
                      return current.filter((value) => value !== item.value);
                    }
                    return [...current, item.value];
                  });
                  submitFilters();
                }}
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
                checked={selectedDominantHands.includes(item.value)}
                onChange={() => {
                  setSelectedDominantHands((current) => {
                    if (current.includes(item.value)) {
                      return current.filter((value) => value !== item.value);
                    }
                    return [...current, item.value];
                  });
                  submitFilters();
                }}
                className="h-4 w-4 rounded border-slate-400"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

    </aside>
  );
}
