import { redirect } from 'next/navigation';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';
import { getEntitlements, isPremium } from '@/lib/entitlements';
import { AccountSettingsTabs } from '@/components/app/account-settings-tabs';

export default async function AccountSettingsPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const entitlement = await getEntitlements(user.id);
  const premium = isPremium(entitlement);
  const { data: profile } = await supabase
    .from('profiles')
    .select('firstname, lastname')
    .eq('id', user.id)
    .maybeSingle();

  const firstname = profile?.firstname?.trim() || '';
  const lastname = profile?.lastname?.trim() || '';
  const email = user.email ?? 'Non renseigné';
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR')
    : 'Non renseigné';
  const premiumUntil = entitlement?.premium_until
    ? new Date(entitlement.premium_until).toLocaleDateString('fr-FR')
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Paramètres
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Compte et abonnement
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
          Tu arrives sur tes informations de compte. Utilise l&apos;onglet dédié
          pour gérer ton abonnement et ton compte.
        </p>
      </section>

      <AccountSettingsTabs
        email={email}
        firstname={firstname}
        lastname={lastname}
        memberSince={memberSince}
        premium={premium}
        isLifetime={Boolean(entitlement?.is_lifetime)}
        premiumUntil={premiumUntil}
      />
    </div>
  );
}
