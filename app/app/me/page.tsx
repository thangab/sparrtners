import { ProfileForm } from '@/app/app/me/ProfileForm';
import { createSupabaseServerClientReadOnly } from '@/lib/supabase/server';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: disciplines } = await supabase
    .from('disciplines')
    .select('id, name')
    .order('name');
  const { data: skillLevels } = await supabase
    .from('skill_levels')
    .select('id, name')
    .order('id');
  const { data: sportProfiles } = await supabase
    .from('user_sport_profiles')
    .select('discipline_id, skill_level_id')
    .eq('user_id', user?.id ?? '')
    .order('discipline_id', { ascending: true });

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, gender, firstname, lastname, nickname, birthdate, city, languages, bio, club, dominant_hand, height_cm, weight_kg, avatar_url',
    )
    .eq('id', user?.id ?? '')
    .maybeSingle();
  const { data: completion } = await supabase
    .from('profile_completion_scores')
    .select('percent')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();
  const completionPercent = completion?.percent ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        <p className="text-muted-foreground">
          Gère tes infos personnelles et tes préférences sportives.
        </p>
        {resolvedSearchParams?.required === '1' ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Profil requis pour accéder à l&apos;application
          </div>
        ) : null}
        <div className="mt-3 space-y-2">
          <div className="text-sm text-slate-600">
            Profil complété à {completionPercent}%
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>
      <ProfileForm
        disciplines={disciplines ?? []}
        skillLevels={skillLevels ?? []}
        defaultValues={{
          height_cm: profile?.height_cm ?? null,
          weight_kg: profile?.weight_kg ?? null,
          sportProfiles: sportProfiles ?? [],
          ...(profile ?? {}),
        }}
      />
    </div>
  );
}
