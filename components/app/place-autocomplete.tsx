'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type PlaceSuggestion = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
  details?: {
    mapbox_id?: string;
    name?: string;
    address?: string;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
    session_token?: string;
  };
};

type PlaceAutocompleteProps = {
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  types?: string;
  onSelect: (place: PlaceSuggestion) => void;
  onQueryChange?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  trailingElement?: React.ReactNode;
};

export function PlaceAutocomplete({
  label,
  placeholder,
  required,
  defaultValue,
  value,
  types,
  onSelect,
  onQueryChange,
  containerClassName,
  labelClassName,
  inputClassName,
  dropdownClassName,
  trailingElement,
}: PlaceAutocompleteProps) {
  const [query, setQuery] = React.useState(defaultValue ?? '');
  const [suggestions, setSuggestions] = React.useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [suppressNextSearch, setSuppressNextSearch] = React.useState(false);
  const [sessionToken, setSessionToken] = React.useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const debounceRef = React.useRef<number | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (typeof value !== 'string') return;
    if (value === query) return;
    setQuery(value);
  }, [value, query]);

  React.useEffect(() => {
    if (!hasInteracted) return;

    if (suppressNextSearch) {
      setSuppressNextSearch(false);
      return;
    }

    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      setSessionToken(null);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!sessionToken) {
      setSessionToken(crypto.randomUUID());
    }

    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const token = sessionToken ?? crypto.randomUUID();
        if (!sessionToken) setSessionToken(token);

        const params = new URLSearchParams({
          q: query,
          session_token: token,
        });
        if (types) params.set('types', types);

        const response = await fetch(
          `/api/mapbox/autocomplete?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        const payload = (await response.json()) as {
          predictions?: PlaceSuggestion[];
        };
        const enriched = (payload.predictions ?? []).map((item) => ({
          ...item,
          details: {
            ...item.details,
            session_token: token,
          },
        }));
        setSuggestions(enriched);
        setOpen(true);
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  return (
    <div className={`space-y-2 ${containerClassName ?? ''}`.trim()}>
      <Label className={labelClassName}>{label}</Label>
      <div className="flex items-start gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholder}
            value={value ?? query}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
              setHasInteracted(true);
            }}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              onQueryChange?.(value);
              setOpen(true);
              setHasInteracted(true);
            }}
            required={required}
            className={inputClassName}
          />
          {open && suggestions.length > 0 ? (
            <div
              className={`absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg ${dropdownClassName ?? ''}`.trim()}
            >
              {suggestions.map((item) => {
                const mainText =
                  item.structured_formatting?.main_text ?? item.description;
                const secondaryText =
                  item.structured_formatting?.secondary_text ?? '';

                return (
                  <button
                    key={item.place_id}
                    type="button"
                    className="flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
                    onClick={() => {
                      const label =
                        item.structured_formatting?.main_text ??
                        item.description;
                      setQuery(label);
                      setSuppressNextSearch(true);
                      setOpen(false);
                      setSuggestions([]);
                      abortRef.current?.abort();
                      onSelect(item);
                    }}
                  >
                    <span className="font-medium text-slate-900">
                      {mainText}
                    </span>
                    {secondaryText ? (
                      <span className="text-xs text-slate-500">
                        {secondaryText}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
          {loading ? (
            <div className="absolute right-3 top-3 text-xs text-slate-400">
              Chargement...
            </div>
          ) : null}
        </div>
        {trailingElement ? (
          <div className="pt-0.5">{trailingElement}</div>
        ) : null}
      </div>
    </div>
  );
}
