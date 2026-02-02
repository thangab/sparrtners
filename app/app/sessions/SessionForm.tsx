'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Slider } from '@/components/ui/slider';
import {
  PlaceAutocomplete,
  PlaceSuggestion,
} from '@/components/app/place-autocomplete';

type Option = { id: number; name: string };

type DisciplineEntry = { disciplineId: string; skillLevelId: string };

type SessionDefaults = {
  title?: string;
  description?: string;
  training_type_id?: number | null;
  place_id?: number | null;
  starts_at?: string;
  duration_minutes?: number | null;
  capacity?: number;
  weight_min?: number | null;
  weight_max?: number | null;
  height_min?: number | null;
  height_max?: number | null;
  dominant_hand?: string | null;
  glove_size?: string | null;
  disciplines?: { discipline_id: number; skill_level_id: number | null }[];
};

type SessionFormMode = 'create' | 'edit';
type PlaceDetails = {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
};

function toLocalDateTimeInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function SessionForm({
  mode,
  sessionId,
  disciplines,
  skillLevels,
  trainingTypes,
  defaultValues,
  defaultPlace,
}: {
  mode: SessionFormMode;
  sessionId?: string;
  disciplines: Option[];
  skillLevels: Option[];
  trainingTypes: Option[];
  defaultValues?: SessionDefaults;
  defaultPlace?: PlaceDetails | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = React.useState(false);
  const isCreate = mode === 'create';
  const [step, setStep] = React.useState(isCreate ? 1 : 1);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const showStep1 = !isCreate || step === 1;
  const showStep2 = !isCreate || step === 2;
  const requireStep1 = !isCreate || showStep1;
  const [entries, setEntries] = React.useState<DisciplineEntry[]>(
    defaultValues?.disciplines && defaultValues.disciplines.length > 0
      ? defaultValues.disciplines.map((entry) => ({
          disciplineId: String(entry.discipline_id),
          skillLevelId: entry.skill_level_id
            ? String(entry.skill_level_id)
            : '',
        }))
      : [{ disciplineId: '', skillLevelId: '' }],
  );
  const [selectedPlace, setSelectedPlace] = React.useState<PlaceDetails | null>(
    defaultPlace ?? null,
  );
  const [placeLoading, setPlaceLoading] = React.useState(false);
  const [descriptionText, setDescriptionText] = React.useState(
    defaultValues?.description ?? '',
  );
  const [dominantHandValue, setDominantHandValue] = React.useState(
    defaultValues?.dominant_hand ?? '',
  );
  const hasWeightDefaults =
    typeof defaultValues?.weight_min === 'number' ||
    typeof defaultValues?.weight_max === 'number';
  const hasHeightDefaults =
    typeof defaultValues?.height_min === 'number' ||
    typeof defaultValues?.height_max === 'number';
  const [weightTouched, setWeightTouched] = React.useState(hasWeightDefaults);
  const [heightTouched, setHeightTouched] = React.useState(hasHeightDefaults);
  const [weightRange, setWeightRange] = React.useState<[number, number]>(() => {
    const minDefault =
      typeof defaultValues?.weight_min === 'number'
        ? defaultValues.weight_min
        : typeof defaultValues?.weight_max === 'number'
          ? defaultValues.weight_max
          : 60;
    const maxDefault =
      typeof defaultValues?.weight_max === 'number'
        ? defaultValues.weight_max
        : typeof defaultValues?.weight_min === 'number'
          ? defaultValues.weight_min
          : 90;
    return [Math.min(minDefault, maxDefault), Math.max(minDefault, maxDefault)];
  });
  const [heightRange, setHeightRange] = React.useState<[number, number]>(() => {
    const minDefault =
      typeof defaultValues?.height_min === 'number'
        ? defaultValues.height_min
        : typeof defaultValues?.height_max === 'number'
          ? defaultValues.height_max
          : 165;
    const maxDefault =
      typeof defaultValues?.height_max === 'number'
        ? defaultValues.height_max
        : typeof defaultValues?.height_min === 'number'
          ? defaultValues.height_min
          : 190;
    return [Math.min(minDefault, maxDefault), Math.max(minDefault, maxDefault)];
  });

  const handlePlaceSelect = async (place: PlaceSuggestion) => {
    if (!place.details?.mapbox_id || !place.details?.session_token) {
      toast({
        title: 'Lieu introuvable',
        description: 'Merci de sélectionner une suggestion valide.',
        variant: 'destructive',
      });
      return;
    }

    setPlaceLoading(true);
    try {
      const response = await fetch('/api/places/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place: {
            mapbox_id: place.details.mapbox_id,
            session_token: place.details.session_token,
          },
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Lieu introuvable');
      }
      const payload = (await response.json()) as { place: PlaceDetails };
      setSelectedPlace(payload.place);
    } catch (error) {
      toast({
        title: 'Lieu introuvable',
        description:
          error instanceof Error ? error.message : 'Merci de réessayer.',
        variant: 'destructive',
      });
      setSelectedPlace(null);
    } finally {
      setPlaceLoading(false);
    }
  };

  const addEntry = () => {
    setEntries((current) => [
      ...current,
      { disciplineId: '', skillLevelId: '' },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((current) => current.filter((_, idx) => idx !== index));
  };

  const updateEntry = (index: number, patch: Partial<DisciplineEntry>) => {
    setEntries((current) =>
      current.map((entry, idx) =>
        idx === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const validateBasics = (formData: FormData) => {
    const startsAtValue = String(formData.get('starts_at') ?? '').trim();
    const trainingTypeValue = String(formData.get('training_type_id') ?? '');
    const capacityValue = String(formData.get('capacity') ?? '');
    const durationValue = String(formData.get('duration_minutes') ?? '');
    const selectedEntries = entries.filter(
      (entry) => entry.disciplineId && entry.skillLevelId,
    );

    if (selectedEntries.length === 0) {
      toast({
        title: 'Discipline requise',
        description: 'Ajoute au moins une discipline avec un niveau.',
        variant: 'destructive',
      });
      return false;
    }

    if (!selectedPlace?.id) {
      toast({
        title: 'Lieu requis',
        description: 'Choisis un lieu via la recherche.',
        variant: 'destructive',
      });
      return false;
    }

    if (!startsAtValue) {
      toast({
        title: 'Date requise',
        description: 'Choisis la date et l’heure de la session.',
        variant: 'destructive',
      });
      return false;
    }

    if (!trainingTypeValue) {
      toast({
        title: "Type d'entraînement requis",
        description: "Choisis un type d'entraînement.",
        variant: 'destructive',
      });
      return false;
    }

    if (!capacityValue) {
      toast({
        title: 'Capacité requise',
        description: 'Indique la capacité de la session.',
        variant: 'destructive',
      });
      return false;
    }

    if (!durationValue) {
      toast({
        title: 'Durée requise',
        description: 'Indique la durée de la session.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const submitSession = async (
    form: HTMLFormElement,
    options?: { skipOptional?: boolean },
  ) => {
    setLoading(true);

    const formData = new FormData(form);
    if (isCreate && !validateBasics(formData)) {
      setLoading(false);
      return;
    }
    const startsAtValue = String(formData.get('starts_at'));
    const descriptionValue = String(formData.get('description') ?? '').trim();
    const toOptionalInt = (value: FormDataEntryValue | null) => {
      if (value === null) return null;
      const trimmed = String(value).trim();
      if (!trimmed) return null;
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? null : parsed;
    };
    const weightMin = options?.skipOptional
      ? null
      : toOptionalInt(formData.get('weight_min'));
    const weightMax = options?.skipOptional
      ? null
      : toOptionalInt(formData.get('weight_max'));
    const heightMin = options?.skipOptional
      ? null
      : toOptionalInt(formData.get('height_min'));
    const heightMax = options?.skipOptional
      ? null
      : toOptionalInt(formData.get('height_max'));
    const dominantHand = options?.skipOptional
      ? null
      : String(formData.get('dominant_hand') ?? '').trim() || null;
    const gloveSize = options?.skipOptional
      ? null
      : String(formData.get('glove_size') ?? '').trim() || null;

    const selectedEntries = entries.filter(
      (entry) => entry.disciplineId && entry.skillLevelId,
    );
    if (selectedEntries.length === 0) {
      toast({
        title: 'Discipline requise',
        description: 'Ajoute au moins une discipline avec un niveau.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!selectedPlace?.id) {
      toast({
        title: 'Lieu requis',
        description: 'Choisis un lieu via la recherche.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const primaryEntry = selectedEntries[0];

    if (mode === 'create') {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        toast({
          title: 'Connexion requise',
          description: 'Merci de vous reconnecter.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const titleValue = String(formData.get('title') ?? '').trim();
      const titleLabel = titleValue || 'Session';
      const payload = {
        host_id: userData.user.id,
        title: titleValue || null,
        description: descriptionValue || null,
        discipline_id: Number(primaryEntry.disciplineId),
        skill_level_id: Number(primaryEntry.skillLevelId),
        training_type_id: Number(formData.get('training_type_id')),
        place_id: selectedPlace.id,
        starts_at: new Date(startsAtValue).toISOString(),
        duration_minutes: Number(formData.get('duration_minutes')),
        capacity: Number(formData.get('capacity')),
        weight_min: weightMin,
        weight_max: weightMax,
        height_min: heightMin,
        height_max: heightMax,
        dominant_hand: dominantHand,
        glove_size: gloveSize,
        is_published: true,
      };

      const { data: sessionRow, error } = await supabase
        .from('sessions')
        .insert(payload)
        .select('id')
        .maybeSingle();
      if (error) {
        toast({
          title: 'Création échouée',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!sessionRow?.id) {
        toast({
          title: 'Création échouée',
          description: "Impossible de créer l'annonce.",
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const disciplinePayloads = selectedEntries.map((entry) => ({
        session_id: sessionRow.id,
        discipline_id: Number(entry.disciplineId),
        skill_level_id: Number(entry.skillLevelId),
      }));

      const { error: disciplinesError } = await supabase
        .from('session_disciplines')
        .insert(disciplinePayloads);
      if (disciplinesError) {
        toast({
          title: 'Création échouée',
          description: disciplinesError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (userData.user.email) {
        try {
          await fetch('/api/notifications/session-created', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: userData.user.email,
              sessionTitle: titleLabel,
              startsAt: payload.starts_at,
            }),
          });
        } catch (error) {
          console.warn('Session created email failed', error);
        }
      }

      toast({ title: 'Session créée', description: 'Ta session est publiée.' });
      setLoading(false);
      router.push('/find-sessions');
      return;
    }

    if (!sessionId) {
      toast({
        title: 'Mise à jour échouée',
        description: 'Session manquante.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const titleValue = String(formData.get('title') ?? '').trim();
    const payload = {
      title: titleValue || null,
      description: descriptionValue || null,
      discipline_id: Number(primaryEntry.disciplineId),
      skill_level_id: Number(primaryEntry.skillLevelId),
      training_type_id: Number(formData.get('training_type_id')),
      place_id: selectedPlace.id,
      starts_at: new Date(startsAtValue).toISOString(),
      duration_minutes: Number(formData.get('duration_minutes')),
      capacity: Number(formData.get('capacity')),
      weight_min: weightMin,
      weight_max: weightMax,
      height_min: heightMin,
      height_max: heightMax,
      dominant_hand: dominantHand,
      glove_size: gloveSize,
    };

    const { error: updateError } = await supabase
      .from('sessions')
      .update(payload)
      .eq('id', sessionId);

    if (updateError) {
      toast({
        title: 'Mise à jour échouée',
        description: updateError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const selectedIds = selectedEntries.map((entry) =>
      Number(entry.disciplineId),
    );
    if (selectedIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('session_disciplines')
        .delete()
        .eq('session_id', sessionId)
        .not('discipline_id', 'in', `(${selectedIds.join(',')})`);

      if (deleteError) {
        toast({
          title: 'Mise à jour échouée',
          description: deleteError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    }

    const disciplinePayloads = selectedEntries.map((entry) => ({
      session_id: sessionId,
      discipline_id: Number(entry.disciplineId),
      skill_level_id: Number(entry.skillLevelId),
    }));

    const { error: disciplinesError } = await supabase
      .from('session_disciplines')
      .upsert(disciplinePayloads, { onConflict: 'session_id,discipline_id' });

    if (disciplinesError) {
      toast({
        title: 'Mise à jour échouée',
        description: disciplinesError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Session mise à jour',
      description: 'Tes changements sont enregistrés.',
    });
    setLoading(false);
    router.push('/app/sessions/requests');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitSession(event.currentTarget);
  };

  const handleNextStep = () => {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    if (!validateBasics(formData)) return;
    setStep(2);
  };

  const handleSkipOptional = async () => {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    if (!validateBasics(formData)) return;
    await submitSession(form, { skipOptional: true });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit} ref={formRef}>
      {isCreate ? (
        <div className="flex w-full items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center gap-2"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step === 1
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              1
            </span>
            <span className={`hidden text-slate-900 sm:inline ${step === 1 ? '' : 'text-slate-600'}`}>
              Infos session
            </span>
          </button>
          <div className="h-px flex-1 bg-slate-200" />
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center gap-2"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                step === 2
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              2
            </span>
            <span className={`hidden text-slate-900 sm:inline ${step === 2 ? '' : 'text-slate-600'}`}>
              Profil recherché
            </span>
          </button>
        </div>
      ) : null}
      <div className={showStep1 ? 'space-y-6' : 'hidden'}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <PlaceAutocomplete
              label="Lieu"
              placeholder="Recherche un lieu (ex: Gymnase, club, adresse)"
              required={requireStep1}
              defaultValue={
                defaultPlace
                  ? `${defaultPlace.name}${
                      defaultPlace.city ? ` · ${defaultPlace.city}` : ''
                    }`
                  : ''
              }
              onSelect={handlePlaceSelect}
              onQueryChange={() => {
                if (selectedPlace) {
                  setSelectedPlace(null);
                }
              }}
            />
            <input
              type="hidden"
              name="place_id"
              value={selectedPlace?.id ?? ''}
            />
            {selectedPlace ? (
              <div className="text-xs text-muted-foreground">
                {selectedPlace.address ??
                  selectedPlace.city ??
                  'Lieu sélectionné'}
              </div>
            ) : placeLoading ? (
              <div className="text-xs text-muted-foreground">
                Vérification du lieu...
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="starts_at">Date et heure</Label>
            <Input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={toLocalDateTimeInput(defaultValues?.starts_at)}
              required={requireStep1}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="training_type_id">Type dentraînement</Label>
            <Select
              id="training_type_id"
              name="training_type_id"
              required={requireStep1}
              defaultValue={defaultValues?.training_type_id ?? 1}
            >
              <SelectItem value="" disabled>
                Choisir
              </SelectItem>
              {trainingTypes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              defaultValue={defaultValues?.capacity ?? 1}
              required={requireStep1}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="duration_minutes">Durée (minutes)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min={15}
              step={5}
              defaultValue={defaultValues?.duration_minutes ?? 60}
              required={requireStep1}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">
                Disciplines & niveaux
              </div>
              <div className="text-xs text-muted-foreground">
                Tu peux proposer plusieurs disciplines dans une même session.
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={addEntry}>
              Ajouter
            </Button>
          </div>
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={`${entry.disciplineId}-${index}`}
                className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <Select
                  value={entry.disciplineId}
                  onChange={(event) =>
                    updateEntry(index, { disciplineId: event.target.value })
                  }
                  required={requireStep1}
                >
                  <SelectItem value="" disabled>
                    Discipline
                  </SelectItem>
                  {disciplines.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  value={entry.skillLevelId}
                  onChange={(event) =>
                    updateEntry(index, { skillLevelId: event.target.value })
                  }
                  required={requireStep1}
                >
                  <SelectItem value="" disabled>
                    Niveau
                  </SelectItem>
                  {skillLevels.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeEntry(index)}
                  disabled={entries.length === 1}
                >
                  Retirer
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description_step1">Plus d&apos;infos</Label>
          <Textarea
            id="description_step1"
            name="description"
            value={descriptionText}
            onChange={(event) => setDescriptionText(event.target.value)}
          />
        </div>
      </div>

      <div className={showStep2 ? 'space-y-3' : 'hidden'}>
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div className="flex justify-center md:hidden">
            <div className="w-full max-w-[110px]">
              <Image
                src="/illustration-fighter.webp"
                alt="Sparring"
                width={110}
                height={140}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-foreground">
                Profil recherché (optionnel)
              </div>
              <div className="text-xs text-muted-foreground">
                Renseigne des critères pour ton sparring partner.
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="weight_range">Poids (kg)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setWeightTouched(false)}
                  >
                    Effacer
                  </Button>
                </div>
                <Slider
                  id="weight_range"
                  min={30}
                  max={150}
                  step={1}
                  value={weightRange}
                  onValueChange={(value) => {
                    setWeightRange(value as [number, number]);
                    setWeightTouched(true);
                  }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Min: {weightTouched ? weightRange[0] : '—'}</span>
                  <span>Max: {weightTouched ? weightRange[1] : '—'}</span>
                </div>
                <input
                  type="hidden"
                  name="weight_min"
                  value={weightTouched ? String(weightRange[0]) : ''}
                />
                <input
                  type="hidden"
                  name="weight_max"
                  value={weightTouched ? String(weightRange[1]) : ''}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="height_range">Taille (cm)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setHeightTouched(false)}
                  >
                    Effacer
                  </Button>
                </div>
                <Slider
                  id="height_range"
                  min={140}
                  max={210}
                  step={1}
                  value={heightRange}
                  onValueChange={(value) => {
                    setHeightRange(value as [number, number]);
                    setHeightTouched(true);
                  }}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Min: {heightTouched ? heightRange[0] : '—'}</span>
                  <span>Max: {heightTouched ? heightRange[1] : '—'}</span>
                </div>
                <input
                  type="hidden"
                  name="height_min"
                  value={heightTouched ? String(heightRange[0]) : ''}
                />
                <input
                  type="hidden"
                  name="height_max"
                  value={heightTouched ? String(heightRange[1]) : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Main forte</Label>
                <div className="grid gap-3 grid-cols-3">
                  {[
                    {
                      value: 'right',
                      label: 'Droitier',
                      src: '/droitier.webp',
                    },
                    { value: 'left', label: 'Gaucher', src: '/gaucher.webp' },
                    {
                      value: 'both',
                      label: 'Ambidextre',
                      src: '/ambidextre.webp',
                    },
                  ].map((option) => {
                    const isActive = dominantHandValue === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDominantHandValue(option.value)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-2 text-center text-sm transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-200 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                          <Image
                            src={option.src}
                            alt={option.label}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="font-medium">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="hidden"
                  name="dominant_hand"
                  value={dominantHandValue}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="glove_size">Taille des gants</Label>
                <Select
                  id="glove_size"
                  name="glove_size"
                  defaultValue={defaultValues?.glove_size ?? ''}
                >
                  <SelectItem value="" disabled>
                    Choisir
                  </SelectItem>
                  <SelectItem value="8oz">8 oz</SelectItem>
                  <SelectItem value="10oz">10 oz</SelectItem>
                  <SelectItem value="12oz">12 oz</SelectItem>
                  <SelectItem value="14oz">14 oz</SelectItem>
                  <SelectItem value="16oz">16 oz</SelectItem>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_step2">Plus d&apos;infos</Label>
              <Textarea
                id="description_step2"
                name="description"
                value={descriptionText}
                onChange={(event) => setDescriptionText(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-xs hidden md:block">
              <Image
                src="/illustration-fighter.webp"
                alt="Sparring"
                width={420}
                height={520}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {isCreate ? (
        step === 1 ? (
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              variant="ghost"
              onClick={handleSkipOptional}
              disabled={loading}
            >
              Ignorer l&apos;étape suivante et publier
            </Button>
            <Button type="button" onClick={handleNextStep} disabled={loading}>
              Continuer
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Retour
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>
                Publier la session
              </Button>
            </div>
          </div>
        )
      ) : (
        <Button type="submit" disabled={loading}>
          Mettre à jour
        </Button>
      )}
    </form>
  );
}
