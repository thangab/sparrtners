'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { PlaceSearchInput } from '@/components/app/place-search-input';

type SessionSearchFormProps = {
  defaultLabel?: string;
  defaultCoords?: { lat: number; lng: number } | null;
  defaultShowAdvanced?: boolean;
  action?: string;
};

export function SessionSearchForm({
  defaultLabel = '',
  defaultCoords = null,
  defaultShowAdvanced = false,
  action,
}: SessionSearchFormProps) {
  const [showAdvanced, setShowAdvanced] =
    React.useState(defaultShowAdvanced);
  const [heightRange, setHeightRange] = React.useState<[number, number]>([
    0, 250,
  ]);
  const [weightRange, setWeightRange] = React.useState<[number, number]>([
    0, 200,
  ]);
  const [radiusKm, setRadiusKm] = React.useState(25);

  return (
    <form
      className="flex flex-col gap-6 rounded-3xl border border-slate-900/20 bg-white p-6"
      method="get"
      action={action}
    >
      <div className="space-y-2">
        <h2 className="text-xl font-medium text-slate-900">
          Choisis le lieu et la date de ton prochain entraînement
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PlaceSearchInput
          label="Où ?"
          placeholder="Où ?"
          variant="compact"
          inputClassName="h-12 rounded-2xl text-base"
          defaultLabel={defaultLabel}
          defaultCoords={defaultCoords}
        />
        <div className="relative">
          <Input
            name="date"
            type="date"
            placeholder="Quand ?"
            className="h-12 rounded-2xl text-base"
          />
        </div>
      </div>

      <button
        type="button"
        className="w-fit text-sm font-medium text-slate-900 underline"
        onClick={() => setShowAdvanced((current) => !current)}
      >
        Recherche avancée
      </button>

      {showAdvanced ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-slate-900">
              Disciplines recherchées
            </h3>
            <div className="flex flex-wrap gap-6 text-sm text-slate-700">
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
                    className="h-4 w-4 rounded border-slate-400"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">
              Caractéristiques recherchées
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">Taille</div>
                <Slider
                  min={0}
                  max={250}
                  step={1}
                  value={heightRange}
                  onValueChange={(value) =>
                    setHeightRange(value as [number, number])
                  }
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{heightRange[0]} cm</span>
                  <span>{heightRange[1]} cm</span>
                </div>
                <input type="hidden" name="height_min" value={heightRange[0]} />
                <input type="hidden" name="height_max" value={heightRange[1]} />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">Poids</div>
                <Slider
                  min={0}
                  max={200}
                  step={1}
                  value={weightRange}
                  onValueChange={(value) =>
                    setWeightRange(value as [number, number])
                  }
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{weightRange[0]} kg</span>
                  <span>{weightRange[1]} kg</span>
                </div>
                <input type="hidden" name="weight_min" value={weightRange[0]} />
                <input type="hidden" name="weight_max" value={weightRange[1]} />
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="text-sm font-medium text-slate-700">
                  Distance autour de moi
                </div>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={[radiusKm]}
                  onValueChange={(value) => setRadiusKm(value[0] ?? 25)}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>1 km</span>
                  <span>{radiusKm} km</span>
                  <span>100 km</span>
                </div>
                <input type="hidden" name="radius_km" value={radiusKm} />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-700">
                  Main forte
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-slate-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="dominant_hand"
                      value="right"
                      className="h-4 w-4 rounded border-slate-400"
                    />
                    Droitier
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="dominant_hand"
                      value="left"
                      className="h-4 w-4 rounded border-slate-400"
                    />
                    Gaucher
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          Rechercher
        </Button>
        <Button type="reset" variant="outline">
          Réinitialiser
        </Button>
      </div>
    </form>
  );
}
