'use client';

import * as React from 'react';
import {
  PlaceAutocomplete,
  PlaceSuggestion,
} from '@/components/app/place-autocomplete';
import { Button } from '@/components/ui/button';
import { Locate, LocateFixed } from 'lucide-react';

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
  const [locating, setLocating] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const shouldShowSelection = showSelection ?? variant === 'default';
  const isCompact = variant === 'compact';
  const [labelValue, setLabelValue] = React.useState(defaultLabel ?? '');

  const handleLocate = () => {
    setGeoError(null);
    setSelected(null);

    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLabelValue('Ma position');
        setLocating(false);
      },
      () => {
        setGeoError("Impossible d'obtenir votre position.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

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
        value={labelValue}
        trailingElement={
          <Button
            variant="ghost"
            onClick={handleLocate}
            aria-label="Me localiser"
            disabled={locating}
            className=" hover:bg-white cursor-pointer"
          >
            {locating ? (
              <LocateFixed className="h-5 w-5" />
            ) : (
              <Locate className="h-5 w-5" />
            )}
          </Button>
        }
        onQueryChange={(value) => {
          setCoords(null);
          setLabelValue(value);
          setGeoError(null);
        }}
        onSelect={async (place) => {
          setGeoError(null);
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
      {geoError ? (
        <div className="text-xs text-rose-500">{geoError}</div>
      ) : null}
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
