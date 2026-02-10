'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Clock3,
  Hand,
  Ruler,
  SlidersHorizontal,
  Target,
  Weight,
} from 'lucide-react';

const DEFAULT_RADIUS = 25;
const DEFAULT_HEIGHT_RANGE: [number, number] = [0, 250];
const DEFAULT_WEIGHT_RANGE: [number, number] = [0, 200];
const DEFAULT_DURATION = 60;

const DISCIPLINE_OPTIONS = [
  { value: 'boxing', label: 'Boxe anglaise' },
  { value: 'pieds-poings', label: 'Pieds-poings' },
  { value: 'mma', label: 'MMA' },
  { value: 'wrestling', label: 'Lutte' },
];

const DOMINANT_HAND_OPTIONS = [
  { value: 'right', label: 'Droitier' },
  { value: 'left', label: 'Gaucher' },
  { value: 'both', label: 'Ambidextre' },
];

const toggleArrayValue = (current: string[], next: string) => {
  if (current.includes(next)) {
    return current.filter((value) => value !== next);
  }
  return [...current, next];
};

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
  const [selectedDominantHand, setSelectedDominantHand] = React.useState(
    defaultDominantHands[0] ?? '',
  );
  const submitFrameRef = React.useRef<number | null>(null);

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

  const scheduleSubmit = React.useCallback(() => {
    if (submitFrameRef.current !== null) {
      cancelAnimationFrame(submitFrameRef.current);
    }
    submitFrameRef.current = requestAnimationFrame(() => {
      submitFrameRef.current = null;
      submitFilters();
    });
  }, [submitFilters]);

  React.useEffect(() => {
    return () => {
      if (submitFrameRef.current !== null) {
        cancelAnimationFrame(submitFrameRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    setRadiusValue(radiusKm);
  }, [radiusKm]);

  React.useEffect(() => {
    setHeightValue(heightRange);
  }, [heightRange]);

  React.useEffect(() => {
    setWeightValue(weightRange);
  }, [weightRange]);

  React.useEffect(() => {
    setDurationValue(defaultDurationValue);
  }, [defaultDurationValue]);

  React.useEffect(() => {
    setDateStartValue(defaultDateStart ?? '');
  }, [defaultDateStart]);

  React.useEffect(() => {
    setDateEndValue(defaultDateEnd ?? '');
  }, [defaultDateEnd]);

  React.useEffect(() => {
    setSelectedTrainingTypes(defaultTrainingTypeIds);
  }, [defaultTrainingTypeIds]);

  React.useEffect(() => {
    setSelectedDisciplines(defaultDisciplines);
  }, [defaultDisciplines]);

  React.useEffect(() => {
    setSelectedDominantHand(defaultDominantHands[0] ?? '');
  }, [defaultDominantHands]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (dateStartValue) count += 1;
    if (dateEndValue) count += 1;
    if (selectedTrainingTypes.length > 0) count += 1;
    if (selectedDisciplines.length > 0) count += 1;
    if (selectedDominantHand) count += 1;
    if (durationValue !== DEFAULT_DURATION) count += 1;
    if (radiusValue !== DEFAULT_RADIUS) count += 1;
    if (
      heightValue[0] !== DEFAULT_HEIGHT_RANGE[0] ||
      heightValue[1] !== DEFAULT_HEIGHT_RANGE[1]
    ) {
      count += 1;
    }
    if (
      weightValue[0] !== DEFAULT_WEIGHT_RANGE[0] ||
      weightValue[1] !== DEFAULT_WEIGHT_RANGE[1]
    ) {
      count += 1;
    }
    return count;
  }, [
    dateStartValue,
    dateEndValue,
    selectedTrainingTypes.length,
    selectedDisciplines.length,
    selectedDominantHand,
    durationValue,
    radiusValue,
    heightValue,
    weightValue,
  ]);

  const resetFilters = React.useCallback(() => {
    setRadiusValue(DEFAULT_RADIUS);
    setHeightValue(DEFAULT_HEIGHT_RANGE);
    setWeightValue(DEFAULT_WEIGHT_RANGE);
    setDurationValue(DEFAULT_DURATION);
    setDateStartValue('');
    setDateEndValue('');
    setSelectedTrainingTypes([]);
    setSelectedDisciplines([]);
    setSelectedDominantHand('');
    router.replace('/find-sessions');
  }, [router]);

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-sm lg:p-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Filtres</p>
              <p className="text-xs text-slate-500">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} actif${activeFiltersCount > 1 ? 's' : ''}`
                  : 'Aucun actif'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
            onClick={resetFilters}
          >
            Reinitialiser
          </Button>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          Date
        </div>
        <div className="grid gap-2">
          <input
            type="date"
            name={dateStartValue ? 'date_start' : undefined}
            value={dateStartValue}
            onChange={(event) => {
              setDateStartValue(event.target.value);
              scheduleSubmit();
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm shadow-sm"
          />
          <input
            type="date"
            name={dateEndValue ? 'date_end' : undefined}
            value={dateEndValue}
            onChange={(event) => {
              setDateEndValue(event.target.value);
              scheduleSubmit();
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="text-sm font-semibold text-slate-800">
          Type d&apos;entraînement
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          {trainingTypes.map((type) => (
            <label
              key={type.id}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedTrainingTypes.includes(String(type.id))
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                name="training_type_id"
                value={type.id}
                checked={selectedTrainingTypes.includes(String(type.id))}
                onChange={() => {
                  setSelectedTrainingTypes((current) => {
                    return toggleArrayValue(current, String(type.id));
                  });
                  scheduleSubmit();
                }}
                className="sr-only"
              />
              {type.name}
            </label>
          ))}
          {trainingTypes.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun type disponible.</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock3 className="h-4 w-4 text-slate-500" />
          Durée de la session
        </div>
        <Slider
          min={30}
          max={240}
          step={15}
          value={[durationValue]}
          onValueChange={(value) => setDurationValue(value[0] ?? DEFAULT_DURATION)}
          onValueCommit={(value) => {
            setDurationValue(value[0] ?? DEFAULT_DURATION);
            scheduleSubmit();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>30 min</span>
          <span>{durationValue} min</span>
          <span>240 min</span>
        </div>
        <input
          type="hidden"
          name={durationValue !== DEFAULT_DURATION ? 'duration_max' : undefined}
          value={durationValue}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Target className="h-4 w-4 text-slate-500" />
          Distance autour de moi
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[radiusValue]}
          onValueChange={(value) => setRadiusValue(value[0] ?? DEFAULT_RADIUS)}
          onValueCommit={(value) => {
            setRadiusValue(value[0] ?? DEFAULT_RADIUS);
            scheduleSubmit();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>1 km</span>
          <span>{radiusValue} km</span>
          <span>100 km</span>
        </div>
        <input
          type="hidden"
          name={radiusValue !== DEFAULT_RADIUS ? 'radius_km' : undefined}
          value={radiusValue}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Ruler className="h-4 w-4 text-slate-500" />
          Taille
        </div>
        <Slider
          min={0}
          max={250}
          step={1}
          value={heightValue}
          onValueChange={(value) => setHeightValue(value as [number, number])}
          onValueCommit={(value) => {
            setHeightValue(value as [number, number]);
            scheduleSubmit();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{heightValue[0]} cm</span>
          <span>{heightValue[1]} cm</span>
        </div>
        <input
          type="hidden"
          name={
            heightValue[0] !== DEFAULT_HEIGHT_RANGE[0]
              ? 'height_min'
              : undefined
          }
          value={heightValue[0]}
          form="find-sessions-form"
        />
        <input
          type="hidden"
          name={
            heightValue[1] !== DEFAULT_HEIGHT_RANGE[1]
              ? 'height_max'
              : undefined
          }
          value={heightValue[1]}
          form="find-sessions-form"
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Weight className="h-4 w-4 text-slate-500" />
          Poids
        </div>
        <Slider
          min={0}
          max={200}
          step={1}
          value={weightValue}
          onValueChange={(value) => setWeightValue(value as [number, number])}
          onValueCommit={(value) => {
            setWeightValue(value as [number, number]);
            scheduleSubmit();
          }}
        />
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{weightValue[0]} kg</span>
          <span>{weightValue[1]} kg</span>
        </div>
        <input
          type="hidden"
          name={
            weightValue[0] !== DEFAULT_WEIGHT_RANGE[0]
              ? 'weight_min'
              : undefined
          }
          value={weightValue[0]}
        />
        <input
          type="hidden"
          name={
            weightValue[1] !== DEFAULT_WEIGHT_RANGE[1]
              ? 'weight_max'
              : undefined
          }
          value={weightValue[1]}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="text-sm font-semibold text-slate-800">
          Disciplines recherchées
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          {DISCIPLINE_OPTIONS.map((item) => (
            <label
              key={item.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedDisciplines.includes(item.value)
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                name="disciplines"
                value={item.value}
                checked={selectedDisciplines.includes(item.value)}
                onChange={() => {
                  setSelectedDisciplines((current) => {
                    return toggleArrayValue(current, item.value);
                  });
                  scheduleSubmit();
                }}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Hand className="h-4 w-4 text-slate-500" />
          Main forte
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-slate-700">
          {DOMINANT_HAND_OPTIONS.map((item) => (
            <label
              key={item.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedDominantHand === item.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="dominant_hand"
                value={item.value}
                checked={selectedDominantHand === item.value}
                onChange={(event) => {
                  setSelectedDominantHand(event.target.value);
                  scheduleSubmit();
                }}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
