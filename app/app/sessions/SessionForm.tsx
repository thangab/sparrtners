'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

type Option = { id: number; name: string };

type DisciplineEntry = { disciplineId: string; skillLevelId: string };

type SessionDefaults = {
  title?: string;
  description?: string;
  training_type_id?: number | null;
  place_id?: number | null;
  starts_at?: string;
  ends_at?: string;
  capacity?: number;
  disciplines?: { discipline_id: number; skill_level_id: number | null }[];
};

type SessionFormMode = 'create' | 'edit';

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
  places,
  defaultValues,
}: {
  mode: SessionFormMode;
  sessionId?: string;
  disciplines: Option[];
  skillLevels: Option[];
  trainingTypes: Option[];
  places: Option[];
  defaultValues?: SessionDefaults;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = React.useState(false);
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
    const startsAtValue = String(formData.get('starts_at'));
    const endsAtValue = String(formData.get('ends_at'));

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
        title: String(formData.get('title') || ''),
        description: String(formData.get('description') || ''),
        discipline_id: Number(primaryEntry.disciplineId),
        skill_level_id: Number(primaryEntry.skillLevelId),
        training_type_id: Number(formData.get('training_type_id')),
        place_id: Number(formData.get('place_id')),
        starts_at: new Date(startsAtValue).toISOString(),
        ends_at: new Date(endsAtValue).toISOString(),
        capacity: Number(formData.get('capacity')),
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
              sessionTitle: payload.title,
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

    const payload = {
      title: String(formData.get('title') || ''),
      description: String(formData.get('description') || ''),
      discipline_id: Number(primaryEntry.disciplineId),
      skill_level_id: Number(primaryEntry.skillLevelId),
      training_type_id: Number(formData.get('training_type_id')),
      place_id: Number(formData.get('place_id')),
      starts_at: new Date(startsAtValue).toISOString(),
      ends_at: new Date(endsAtValue).toISOString(),
      capacity: Number(formData.get('capacity')),
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

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues?.title ?? ''}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            defaultValue={defaultValues?.capacity ?? 2}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="training_type_id">Type dentraînement</Label>
          <Select
            id="training_type_id"
            name="training_type_id"
            required
            defaultValue={defaultValues?.training_type_id ?? ''}
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
          <Label htmlFor="place_id">Lieu</Label>
          <Select
            id="place_id"
            name="place_id"
            required
            defaultValue={defaultValues?.place_id ?? ''}
          >
            <SelectItem value="" disabled>
              Choisir
            </SelectItem>
            {places.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="starts_at">Début</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalDateTimeInput(defaultValues?.starts_at)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends_at">Fin</Label>
          <Input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalDateTimeInput(defaultValues?.ends_at)}
            required
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

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ''}
          required
        />
      </div>
      <Button type="submit" disabled={loading}>
        {mode === 'create' ? 'Publier la session' : 'Mettre à jour'}
      </Button>
    </form>
  );
}
