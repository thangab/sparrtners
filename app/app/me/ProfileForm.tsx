'use client';

import Image from 'next/image';
import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import {
  PlaceAutocomplete,
  PlaceSuggestion,
} from '@/components/app/place-autocomplete';

type Option = { id: number; name: string };
type DisciplineEntry = { disciplineId: string; skillLevelId: string };

function completionBadge() {
  return (
    <span className="ml-2 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-orange-700">
      Requis complétion
    </span>
  );
}

export function ProfileForm({
  disciplines,
  skillLevels,
  defaultValues,
}: {
  disciplines: Option[];
  skillLevels: Option[];
  defaultValues: {
    height_cm?: number | null;
    weight_kg?: number | null;
    sportProfiles?:
      | { discipline_id: number; skill_level_id: number | null }[]
      | null;
    firstname?: string | null;
    lastname?: string | null;
    nickname?: string | null;
    birthdate?: string | null;
    city?: string | null;
    languages?: string[] | null;
    bio?: string | null;
    club?: string | null;
    dominant_hand?: string | null;
    avatar_url?: string | null;
    display_name?: string | null;
    gender?: string | null;
  };
}) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [cityLabel, setCityLabel] = React.useState(defaultValues.city ?? '');
  const [entries, setEntries] = React.useState<DisciplineEntry[]>(
    defaultValues.sportProfiles && defaultValues.sportProfiles.length > 0
      ? defaultValues.sportProfiles.map((profile) => ({
          disciplineId: String(profile.discipline_id),
          skillLevelId: profile.skill_level_id
            ? String(profile.skill_level_id)
            : '',
        }))
      : [],
  );
  const [avatarUrl, setAvatarUrl] = React.useState(
    defaultValues.avatar_url ?? '',
  );
  const [storedAvatarUrl, setStoredAvatarUrl] = React.useState(
    defaultValues.avatar_url ?? '',
  );
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [, setGoogleAvatarUrl] = React.useState('');
  const [step, setStep] = React.useState(1);
  const showStep1 = step === 1;
  const showStep2 = step === 2;
  const showStep3 = step === 3;
  const [genderValue, setGenderValue] = React.useState(
    defaultValues.gender ?? '',
  );
  const [languageValues, setLanguageValues] = React.useState<string[]>(
    defaultValues.languages ?? [],
  );
  const [dominantHandValue, setDominantHandValue] = React.useState(
    defaultValues.dominant_hand ?? '',
  );
  React.useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata as
        | { avatar_url?: string; picture?: string }
        | undefined;
      const googleUrl = meta?.avatar_url ?? meta?.picture ?? '';
      if (!avatarUrl && googleUrl) {
        setAvatarUrl(googleUrl);
      }
      setGoogleAvatarUrl(googleUrl);
    };
    void loadUser();
  }, [avatarUrl, supabase]);

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

  const selectedDisciplineIds = entries
    .map((entry) => entry.disciplineId)
    .filter((value) => value.length > 0);
  const availableDisciplines = disciplines.filter(
    (discipline) => !selectedDisciplineIds.includes(String(discipline.id)),
  );
  const disciplineNameById = new Map(
    disciplines.map((discipline) => [String(discipline.id), discipline.name]),
  );

  const toggleLanguage = (language: string) => {
    setLanguageValues((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
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

    const heightRaw = String(formData.get('height_cm') || '');
    const weightRaw = String(formData.get('weight_kg') || '');
    const languagesRaw = formData
      .getAll('languages')
      .map((value) => String(value).trim())
      .filter(Boolean);

    const selectedEntries = entries.filter(
      (entry) => entry.disciplineId && entry.skillLevelId,
    );
    if (showStep2 && selectedEntries.length === 0) {
      toast({
        title: 'Discipline requise',
        description: 'Ajoute au moins une discipline avec un niveau.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    let finalAvatarUrl = storedAvatarUrl || avatarUrl;
    if (avatarFile && userData?.user) {
      const fileExt = avatarFile.name.split('.').pop() || 'jpg';
      const filePath = `${userData.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });
      if (uploadError) {
        toast({
          title: 'Upload échoué',
          description: uploadError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      finalAvatarUrl = publicUrl.publicUrl ?? '';

      const baseUrl = supabase.storage.from('avatars').getPublicUrl('')
        .data.publicUrl;
      const publicPrefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      if (
        storedAvatarUrl &&
        storedAvatarUrl.startsWith(publicPrefix) &&
        storedAvatarUrl !== finalAvatarUrl
      ) {
        const previousPath = storedAvatarUrl.replace(publicPrefix, '');
        if (previousPath) {
          await supabase.storage.from('avatars').remove([previousPath]);
        }
      }
    }

    const profilePayload = {
      id: userData.user.id,
      display_name: String(formData.get('display_name') || '').trim() || null,
      gender: String(formData.get('gender') || '').trim() || null,
      firstname: String(formData.get('firstname') || '').trim() || null,
      lastname: String(formData.get('lastname') || '').trim() || null,
      nickname: String(formData.get('nickname') || '').trim() || null,
      birthdate: String(formData.get('birthdate') || '').trim() || null,
      city: String(formData.get('city') || '').trim() || null,
      languages: languagesRaw.length ? languagesRaw : null,
      bio: String(formData.get('bio') || '').trim() || null,
      club: String(formData.get('club') || '').trim() || null,
      dominant_hand: String(formData.get('dominant_hand') || '').trim() || null,
      height_cm: heightRaw ? Number(heightRaw) : null,
      weight_kg: weightRaw ? Number(weightRaw) : null,
      avatar_url: finalAvatarUrl || null,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload);

    if (profileError) {
      toast({
        title: 'Mise à jour échouée',
        description: profileError.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    if (finalAvatarUrl && finalAvatarUrl !== storedAvatarUrl) {
      setStoredAvatarUrl(finalAvatarUrl);
    }

    if (showStep2) {
      const selectedDisciplineIds = selectedEntries.map((entry) =>
        Number(entry.disciplineId),
      );

      if (selectedDisciplineIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_sport_profiles')
          .delete()
          .eq('user_id', userData.user.id)
          .not('discipline_id', 'in', `(${selectedDisciplineIds.join(',')})`);
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

      const sportPayloads = selectedEntries.map((entry) => ({
        user_id: userData.user.id,
        discipline_id: Number(entry.disciplineId),
        skill_level_id: Number(entry.skillLevelId),
      }));

      const { error: sportError } = await supabase
        .from('user_sport_profiles')
        .upsert(sportPayloads, { onConflict: 'user_id,discipline_id' });

      if (sportError) {
        toast({
          title: 'Mise à jour échouée',
          description: sportError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    }

    toast({
      title: 'Profil mis à jour',
      description: 'Tes infos sont enregistrées.',
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-2 text-xs text-orange-800">
        Pour atteindre 100% de complétion: Nom public, genre, prénom, nom,
        date de naissance, ville, main forte, taille, poids et au moins une
        discipline avec niveau.
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {[
            { id: 1, label: 'Infos perso' },
            { id: 2, label: 'Infos sportives' },
            { id: 3, label: 'Infos physiques' },
          ].map((item, index) => (
            <React.Fragment key={item.id}>
              <button
                type="button"
                onClick={() => setStep(item.id)}
                className="inline-flex items-center gap-2"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    step === item.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.id}
                </span>
                <span
                  className={
                    step === item.id
                      ? 'font-semibold text-slate-900'
                      : 'text-slate-500'
                  }
                >
                  {item.label}
                </span>
              </button>
              {index < 2 ? <div className="h-px flex-1 bg-slate-200" /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className={showStep1 ? 'space-y-5' : 'hidden'}>
        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Informations personnelles
            </h3>
            <p className="text-sm text-slate-500">
              Complète ton profil visible par les autres sportifs.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="avatar">Photo de profil</Label>
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="h-18 w-18 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={72}
                      height={72}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : null}
                </div>
                <Input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > 2 * 1024 * 1024) {
                      toast({
                        title: 'Image trop lourde',
                        description: 'Taille max: 2 MB.',
                        variant: 'destructive',
                      });
                      event.target.value = '';
                      setAvatarFile(null);
                      return;
                    }
                    setAvatarFile(file);
                    if (file) setAvatarUrl(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">
                Nom public
                {completionBadge()}
              </Label>
              <Input
                id="display_name"
                name="display_name"
                placeholder="Ex: John S."
                required={showStep1}
                defaultValue={defaultValues.display_name ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Pseudo</Label>
              <Input
                id="nickname"
                name="nickname"
                defaultValue={defaultValues.nickname ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstname">
                Prénom
                {completionBadge()}
              </Label>
              <Input
                id="firstname"
                name="firstname"
                required={showStep1}
                defaultValue={defaultValues.firstname ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastname">
                Nom
                {completionBadge()}
              </Label>
              <Input
                id="lastname"
                name="lastname"
                required={showStep1}
                defaultValue={defaultValues.lastname ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">
                Date de naissance
                {completionBadge()}
              </Label>
              <Input
                id="birthdate"
                name="birthdate"
                type="date"
                required={showStep1}
                defaultValue={defaultValues.birthdate ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Genre
                {completionBadge()}
              </Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'female', label: 'Femme' },
                  { value: 'male', label: 'Homme' },
                  { value: 'other', label: 'Autre' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGenderValue(option.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      genderValue === option.value
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="gender" value={genderValue} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-900">
                Ville
                {completionBadge()}
              </div>
              <PlaceAutocomplete
                label="Ville"
                labelClassName="sr-only"
                placeholder="Rechercher une ville"
                defaultValue={defaultValues.city ?? ''}
                value={cityLabel}
                types="place"
                onQueryChange={(value) => setCityLabel(value)}
                onSelect={(place: PlaceSuggestion) => {
                  const label =
                    place.structured_formatting?.main_text ?? place.description;
                  setCityLabel(label);
                }}
              />
              <input type="hidden" name="city" value={cityLabel} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Langues</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'fr', label: 'Français' },
                  { value: 'en', label: 'Anglais' },
                ].map((option) => {
                  const selected = languageValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleLanguage(option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {languageValues.map((language) => (
                <input key={language} type="hidden" name="languages" value={language} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={showStep2 ? 'space-y-5' : 'hidden'}>
        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Informations sportives
            </h3>
            <p className="text-sm text-slate-500">
              Renseigne tes disciplines pour matcher avec les bonnes sessions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="club">Club</Label>
            <Input
              id="club"
              name="club"
              placeholder="Nom du club (optionnel)"
              defaultValue={defaultValues.club ?? ''}
            />
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Disciplines disponibles
              {completionBadge()}
            </div>
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
                Ajoute au moins une discipline avec un niveau pour le taux de
                complétion.
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
                            updateEntry(index, { skillLevelId: String(item.id) })
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

      <div className={showStep3 ? 'space-y-5' : 'hidden'}>
        <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Informations physiques
            </h3>
            <p className="text-sm text-slate-500">
              Facultatif, mais utile pour affiner les mises en relation.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="height_cm">
                Taille (cm)
                {completionBadge()}
              </Label>
              <Input
                id="height_cm"
                name="height_cm"
                type="number"
                min={120}
                max={230}
                required={showStep3}
                defaultValue={defaultValues.height_cm ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg">
                Poids (kg)
                {completionBadge()}
              </Label>
              <Input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min={30}
                max={200}
                required={showStep3}
                defaultValue={defaultValues.weight_kg ?? ''}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>
                Main forte
                {completionBadge()}
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'right', label: 'Droitier', src: '/droitier.webp' },
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
                          ? 'border-slate-900 bg-slate-100 text-slate-900'
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Parle de ton style, tes objectifs et ton expérience."
                defaultValue={defaultValues.bio ?? ''}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
        >
          Retour
        </Button>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button
              type="button"
              formNoValidate
              onClick={(event) => {
                event.preventDefault();
                setStep((current) => current + 1);
              }}
            >
              Étape suivante
            </Button>
          ) : null}
          <Button type="submit" disabled={loading}>
            Enregistrer
          </Button>
        </div>
      </div>
    </form>
  );
}
