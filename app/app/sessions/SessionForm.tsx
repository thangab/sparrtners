'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
      : [],
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
  const [trainingTypeValue, setTrainingTypeValue] = React.useState(
    defaultValues?.training_type_id != null
      ? String(defaultValues.training_type_id)
      : '',
  );
  const [gloveSizeValue, setGloveSizeValue] = React.useState(
    defaultValues?.glove_size ?? '',
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

  React.useEffect(() => {
    if (trainingTypeValue) return;
    const sparringType = trainingTypes.find((item) =>
      item.name.toLowerCase().includes('sparring'),
    );
    if (sparringType) {
      setTrainingTypeValue(String(sparringType.id));
    }
  }, [trainingTypes, trainingTypeValue]);

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

  const addDisciplineEntry = (disciplineId: string) => {
    if (!disciplineId) return;
    setEntries((current) => {
      if (current.some((entry) => entry.disciplineId === disciplineId)) {
        return current;
      }
      return [...current, { disciplineId, skillLevelId: '' }];
    });
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

      const payload = {
        host_id: userData.user.id,
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
              sessionId: sessionRow.id,
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

  const selectedDisciplineIds = entries
    .map((entry) => entry.disciplineId)
    .filter((value) => value.length > 0);
  const availableDisciplines = disciplines.filter(
    (discipline) => !selectedDisciplineIds.includes(String(discipline.id)),
  );
  const disciplineNameById = new Map(
    disciplines.map((discipline) => [String(discipline.id), discipline.name]),
  );
  const dominantHandPreview = React.useMemo(() => {
    if (dominantHandValue === 'left') {
      return { src: '/fighter-left.webp', alt: 'Stance gaucher' };
    }
    if (dominantHandValue === 'both') {
      return { src: '/fighter-neutral.webp', alt: 'Stance ambidextre' };
    }
    if (dominantHandValue === 'right') {
      return { src: '/fighter-right.webp', alt: 'Stance droitier' };
    }
    return { src: '/fighter-neutral.webp', alt: 'Profil recherché' };
  }, [dominantHandValue]);

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit}
      ref={formRef}
      noValidate
    >
      {isCreate ? (
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 1
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                1
              </span>
              <span
                className={
                  step === 1 ? 'font-semibold text-slate-900' : 'text-slate-500'
                }
              >
                Infos session
              </span>
            </button>
            <div className="h-px flex-1 bg-slate-200" />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 2
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                2
              </span>
              <span
                className={
                  step === 2 ? 'font-semibold text-slate-900' : 'text-slate-500'
                }
              >
                Profil recherché
              </span>
            </button>
          </div>
        </div>
      ) : null}

      <div className={showStep1 ? 'space-y-5' : 'hidden'}>
        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Détails de la session
            </h3>
            <p className="text-sm text-slate-500">
              Le minimum pour publier une annonce claire.
            </p>
          </div>
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
                  if (selectedPlace) setSelectedPlace(null);
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="training_type_id">Type d&apos;entraînement</Label>
              <div className="flex flex-wrap gap-2">
                {trainingTypes.map((item) => {
                  const isActive = trainingTypeValue === String(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTrainingTypeValue(String(item.id))}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
              <input
                id="training_type_id"
                type="hidden"
                name="training_type_id"
                value={trainingTypeValue}
                required={requireStep1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Participants recherchés</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={defaultValues?.capacity ?? 1}
                required={requireStep1}
              />
            </div>
            <div className="space-y-2">
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
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Disciplines et niveaux
              </h3>
              <p className="text-sm text-slate-500">
                Ajoute une ou plusieurs disciplines avec le niveau visé.
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Disciplines disponibles
            </p>
            {availableDisciplines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableDisciplines.map((discipline) => (
                  <button
                    key={discipline.id}
                    type="button"
                    onClick={() => addDisciplineEntry(String(discipline.id))}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400"
                  >
                    + {discipline.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Toutes les disciplines disponibles ont été ajoutées.
              </p>
            )}
          </div>

          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Ajoute au moins une discipline.
              </div>
            ) : null}
            {entries.map((entry, index) => (
              <div
                key={`${entry.disciplineId}-${index}`}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">
                    {disciplineNameById.get(entry.disciplineId) ??
                      `Discipline ${index + 1}`}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeEntry(index)}
                  >
                    Retirer
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                    Niveau
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillLevels.map((item) => {
                      const isActive = entry.skillLevelId === String(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            updateEntry(index, {
                              skillLevelId: String(item.id),
                            })
                          }
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            isActive
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={showStep2 ? 'space-y-5' : 'hidden'}>
        <section className="grid gap-6 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:items-stretch">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Profil recherché (optionnel)
              </h3>
              <p className="text-sm text-slate-500">
                Affine ton matching avec des critères physiques et techniques.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
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

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: 'right',
                      label: 'Droitier',
                      src: '/right.webp',
                    },
                    { value: 'left', label: 'Gaucher', src: '/left.webp' },
                    {
                      value: 'both',
                      label: 'Ambidextre',
                      src: '/ambidextrous.webp',
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
                            ? 'border-slate-900 bg-slate-100 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="h-12 w-15">
                          <Image
                            src={option.src}
                            alt={option.label}
                            width={58}
                            height={58}
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
                <div className="grid grid-cols-3 gap-2">
                  {['8oz', '10oz', '12oz', '14oz', '16oz'].map((size) => {
                    const isActive = gloveSizeValue === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          setGloveSizeValue((current) =>
                            current === size ? '' : size,
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                          isActive
                            ? 'border-slate-900 bg-slate-100 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <input
                  id="glove_size"
                  type="hidden"
                  name="glove_size"
                  value={gloveSizeValue}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description de la session</Label>
              <Textarea
                id="description"
                name="description"
                value={descriptionText}
                onChange={(event) => setDescriptionText(event.target.value)}
                placeholder="Objectif, intensité, équipements, infos utiles..."
              />
            </div>
          </div>

          <div className="hidden md:flex md:h-full md:items-center md:justify-center">
            <div className="w-1/2">
              <Image
                src={dominantHandPreview.src}
                alt={dominantHandPreview.alt}
                width={420}
                height={520}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </section>
      </div>

      {isCreate ? (
        step === 1 ? (
          <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkipOptional}
              disabled={loading}
            >
              Publier directement
            </Button>
            <Button type="button" onClick={handleNextStep} disabled={loading}>
              Continuer
            </Button>
          </div>
        ) : (
          <div className="sticky bottom-4 z-10 flex flex-wrap justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Retour
            </Button>
            <Button type="submit" disabled={loading}>
              Publier la session
            </Button>
          </div>
        )
      ) : (
        <div className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <Button type="submit" disabled={loading}>
            Mettre à jour
          </Button>
        </div>
      )}
    </form>
  );
}
