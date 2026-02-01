'use client';

import Image from 'next/image';
import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  PlaceAutocomplete,
  PlaceSuggestion,
} from '@/components/app/place-autocomplete';
import { Slider } from '@/components/ui/slider';

type Option = { id: number; name: string };
type DisciplineEntry = { disciplineId: string; skillLevelId: string };

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
      : [{ disciplineId: '', skillLevelId: '' }],
  );
  const hasHeightDefault = typeof defaultValues.height_cm === 'number';
  const hasWeightDefault = typeof defaultValues.weight_kg === 'number';
  const [heightTouched, setHeightTouched] = React.useState(hasHeightDefault);
  const [weightTouched, setWeightTouched] = React.useState(hasWeightDefault);
  const [heightValue, setHeightValue] = React.useState(() =>
    typeof defaultValues.height_cm === 'number' ? defaultValues.height_cm : 175,
  );
  const [weightValue, setWeightValue] = React.useState(() =>
    typeof defaultValues.weight_kg === 'number' ? defaultValues.weight_kg : 70,
  );
  const [avatarUrl, setAvatarUrl] = React.useState(
    defaultValues.avatar_url ?? '',
  );
  const [storedAvatarUrl, setStoredAvatarUrl] = React.useState(
    defaultValues.avatar_url ?? '',
  );
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [googleAvatarUrl, setGoogleAvatarUrl] = React.useState('');
  const [step, setStep] = React.useState(1);
  const showStep1 = step === 1;
  const showStep2 = step === 2;
  const showStep3 = step === 3;

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
    const languagesRaw = String(formData.get('languages') || '')
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean);

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

    toast({
      title: 'Profil mis à jour',
      description: 'Tes infos sont enregistrées.',
    });
    setLoading(false);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-600">
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
          <span className={step === 1 ? 'text-slate-900' : ''}>
            Infos perso
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
          <span className={step === 2 ? 'text-slate-900' : ''}>
            Infos sportives
          </span>
        </button>
        <div className="h-px flex-1 bg-slate-200" />
        <button
          type="button"
          onClick={() => setStep(3)}
          className="flex items-center gap-2"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              step === 3
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            3
          </span>
          <span className={step === 3 ? 'text-slate-900' : ''}>
            Infos physiques
          </span>
        </button>
      </div>
      <div className={showStep1 ? 'space-y-6' : 'hidden'}>
        <p>Informations personnelles</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4 md:col-span-2 md:grid-cols-[auto_1fr]">
            <div className="space-y-2">
              <Label htmlFor="avatar">Photo de profil</Label>
              <div className="flex flex-wrap items-center gap-4 rounded-(--radius) border border-border bg-white p-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-slate-100">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={56}
                      height={56}
                      className="h-full w-full  rounded-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
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
                      if (file) {
                        setAvatarUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Nom public</Label>
              <Input
                id="display_name"
                name="display_name"
                placeholder="Ex: Samira K."
                defaultValue={defaultValues.display_name ?? ''}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstname">Prénom</Label>
            <Input
              id="firstname"
              name="firstname"
              defaultValue={defaultValues.firstname ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastname">Nom</Label>
            <Input
              id="lastname"
              name="lastname"
              defaultValue={defaultValues.lastname ?? ''}
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
            <Label htmlFor="gender">Genre</Label>
            <Select
              id="gender"
              name="gender"
              defaultValue={defaultValues.gender ?? ''}
            >
              <SelectItem value="" disabled>
                Choisir
              </SelectItem>
              <SelectItem value="female">Femme</SelectItem>
              <SelectItem value="male">Homme</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdate">Date de naissance</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              defaultValue={defaultValues.birthdate ?? ''}
            />
          </div>
          <div className="space-y-2">
            <PlaceAutocomplete
              label="Ville"
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
          <div className="space-y-2">
            <Label htmlFor="languages">Langues</Label>
            <Input
              id="languages"
              name="languages"
              placeholder="fr, en"
              defaultValue={defaultValues.languages?.join(', ') ?? ''}
            />
          </div>
        </div>
      </div>
      <div className={showStep2 ? 'space-y-6' : 'hidden'}>
        <p>Informations sportives</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club">Club</Label>
            <Input
              id="club"
              name="club"
              placeholder="Nom du club (optionnel)"
              defaultValue={defaultValues.club ?? ''}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">
                Disciplines & niveaux
              </div>
              <div className="text-xs text-muted-foreground">
                Ajoute toutes tes disciplines, chacune avec un niveau
                spécifique.
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
                  required
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
                  required
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
      </div>
      <div className={showStep3 ? 'space-y-6' : 'hidden'}>
        <p>Informations physiques</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="height_cm">Taille (cm)</Label>
            <Slider
              id="height_cm"
              min={140}
              max={210}
              step={1}
              value={[heightValue]}
              onValueChange={(value) => {
                setHeightValue(value[0] ?? 175);
                setHeightTouched(true);
              }}
            />
            <div className="text-xs text-muted-foreground">
              {heightTouched ? `${heightValue} cm` : '—'}
            </div>
            <input
              type="hidden"
              name="height_cm"
              value={heightTouched ? String(heightValue) : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Poids (kg)</Label>
            <Slider
              id="weight_kg"
              min={30}
              max={150}
              step={1}
              value={[weightValue]}
              onValueChange={(value) => {
                setWeightValue(value[0] ?? 70);
                setWeightTouched(true);
              }}
            />
            <div className="text-xs text-muted-foreground">
              {weightTouched ? `${weightValue} kg` : '—'}
            </div>
            <input
              type="hidden"
              name="weight_kg"
              value={weightTouched ? String(weightValue) : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dominant_hand">Main forte</Label>
            <Select
              id="dominant_hand"
              name="dominant_hand"
              defaultValue={defaultValues.dominant_hand ?? ''}
            >
              <SelectItem value="" disabled>
                Choisir
              </SelectItem>
              <SelectItem value="right">Droitier</SelectItem>
              <SelectItem value="left">Gaucher</SelectItem>
              <SelectItem value="both">Les deux</SelectItem>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">Plus d&apos;informations</Label>
            <textarea
              id="bio"
              name="bio"
              className="min-h-30 w-full rounded-(--radius) border border-border bg-white px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={defaultValues.bio ?? ''}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
        >
          Retour
        </Button>
        {step < 3 ? (
          <div className="flex gap-2">
            <Button
              type="button"
              formNoValidate
              onClick={(event) => {
                event.preventDefault();
                setStep((current) => current + 1);
              }}
            >
              Etape suivante
            </Button>
            <Button type="submit" disabled={loading}>
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button type="submit" disabled={loading}>
            Enregistrer
          </Button>
        )}
      </div>
    </form>
  );
}
