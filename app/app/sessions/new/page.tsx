import { SessionForm } from '@/app/app/sessions/SessionForm';
import { getEntitlements, isPremium } from '@/lib/entitlements';
import { redirect } from 'next/navigation';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export default async function NewSessionPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const entitlement = await getEntitlements(user.id);
  const premium = isPremium(entitlement);

  if (!premium) {
    const { count: monthlySessionCount } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', nextMonthStart.toISOString());

    if ((monthlySessionCount ?? 0) >= 4) {
      redirect('/pricing?limit=sessions');
    }
  }

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
