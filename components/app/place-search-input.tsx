'use client';

import * as React from 'react';
import {
  PlaceAutocomplete,
  PlaceSuggestion,
} from '@/components/app/place-autocomplete';

type PlaceSearchInputProps = {
  label?: string;
  placeholder?: string;
  variant?: 'default' | 'compact';
  showSelection?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  defaultLabel?: string;
  nameLabel?: string;
  defaultCoords?: { lat: number; lng: number } | null;
};

export function PlaceSearchInput({
  label = 'Lieu',
  placeholder = 'Ville, salle, adresse',
  variant = 'default',
  showSelection,
  containerClassName,
  inputClassName,
  defaultLabel,
  nameLabel = 'place_label',
  defaultCoords = null,
}: PlaceSearchInputProps) {
  const [selected, setSelected] = React.useState<PlaceSuggestion | null>(null);
  const [coords, setCoords] = React.useState<{
    lat: number;
    lng: number;
  } | null>(defaultCoords);
  const [loading, setLoading] = React.useState(false);
  const shouldShowSelection = showSelection ?? variant === 'default';
  const isCompact = variant === 'compact';
  const [labelValue, setLabelValue] = React.useState(defaultLabel ?? '');

  return (
    <div
      className={`${isCompact ? '' : 'space-y-2'} ${containerClassName ?? ''}`.trim()}
    >
      <PlaceAutocomplete
        label={label}
        placeholder={placeholder}
        containerClassName={isCompact ? 'space-y-0' : undefined}
        labelClassName={isCompact ? 'sr-only' : undefined}
        inputClassName={inputClassName}
        defaultValue={defaultLabel}
        onQueryChange={(value) => {
          setCoords(null);
          setLabelValue(value);
        }}
        onSelect={async (place) => {
          setLabelValue(
            place.structured_formatting?.main_text ?? place.description,
          );
          setSelected(place);
          setCoords(null);

          if (!place.details?.mapbox_id || !place.details?.session_token) {
            return;
          }

          setLoading(true);
          try {
            const response = await fetch('/api/mapbox/retrieve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mapbox_id: place.details.mapbox_id,
                session_token: place.details.session_token,
              }),
            });
            if (!response.ok) return;
            const payload = (await response.json()) as {
              lat?: number;
              lng?: number;
            };
            if (
              typeof payload.lat === 'number' &&
              typeof payload.lng === 'number'
            ) {
              setCoords({ lat: payload.lat, lng: payload.lng });
            }
          } finally {
            setLoading(false);
          }
        }}
      />
      <input type="hidden" name={nameLabel} value={labelValue} />
      <input type="hidden" name="place_lat" value={coords?.lat ?? ''} />
      <input type="hidden" name="place_lng" value={coords?.lng ?? ''} />
      {selected && shouldShowSelection ? (
        <div className="text-xs text-slate-500">
          {loading
            ? 'Chargement des coordonnées...'
            : `Sélectionné: ${selected.description}`}
        </div>
      ) : null}
    </div>
  );
}
