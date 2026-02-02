type ProfileCompletionInput = {
  profile?: {
    display_name?: string | null;
    gender?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    nickname?: string | null;
    birthdate?: string | null;
    city?: string | null;
    dominant_hand?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    avatar_url?: string | null;
  } | null;
  sportProfiles?: { discipline_id: number; skill_level_id: number | null }[] | null;
};

const hasText = (value?: string | null) => !!value && value.trim().length > 0;
const hasNumber = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value);

export function getProfileCompletion({
  profile,
  sportProfiles,
}: ProfileCompletionInput) {
  const requiredChecks = [
    hasText(profile?.display_name),
    hasText(profile?.gender),
    hasText(profile?.firstname),
    hasText(profile?.lastname),
    hasText(profile?.nickname),
    hasText(profile?.birthdate),
    hasText(profile?.city),
    hasText(profile?.dominant_hand),
    hasNumber(profile?.height_cm),
    hasNumber(profile?.weight_kg),
    hasText(profile?.avatar_url),
    (sportProfiles ?? []).some(
      (item) => item.discipline_id && item.skill_level_id,
    ),
  ];

  const total = requiredChecks.length;
  const completed = requiredChecks.filter(Boolean).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { total, completed, percent };
}
