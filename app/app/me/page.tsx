import { ProfileForm } from "@/app/app/me/ProfileForm";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: disciplines } = await supabase.from("disciplines").select("id, name").order("name");
  const { data: skillLevels } = await supabase.from("skill_levels").select("id, name").order("id");
  const { data: sportProfiles } = await supabase
    .from("user_sport_profiles")
    .select("height_cm, weight_kg, discipline_id, skill_level_id")
    .eq("user_id", user?.id ?? "")
    .order("discipline_id", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("firstname, lastname, nickname, birthdate, city, languages, bio")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Mon profil sportif</h1>
        <p className="text-muted-foreground">Gère tes infos physiques et ton niveau.</p>
      </div>
      <ProfileForm
        disciplines={disciplines ?? []}
        skillLevels={skillLevels ?? []}
        defaultValues={{
          height_cm: sportProfiles?.[0]?.height_cm ?? null,
          weight_kg: sportProfiles?.[0]?.weight_kg ?? null,
          sportProfiles: sportProfiles ?? [],
          ...(profile ?? {}),
        }}
      />
    </div>
  );
}
