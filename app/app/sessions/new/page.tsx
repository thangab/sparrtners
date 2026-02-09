import { SessionForm } from '@/app/app/sessions/SessionForm';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export default async function NewSessionPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const { data: disciplines } = await supabase
    .from('disciplines')
    .select('id, name')
    .order('name');
  const { data: skillLevels } = await supabase
    .from('skill_levels')
    .select('id, name')
    .order('id');
  const { data: trainingTypes } = await supabase
    .from('training_types')
    .select('id, name')
    .order('id');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-200/70 bg-white/85 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Créer une session
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Publie une annonce claire pour trouver les bons partenaires
          rapidement.
        </p>
      </div>
      <SessionForm
        mode="create"
        disciplines={disciplines ?? []}
        skillLevels={skillLevels ?? []}
        trainingTypes={trainingTypes ?? []}
      />
    </div>
  );
}
