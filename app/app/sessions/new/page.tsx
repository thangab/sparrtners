import { SessionForm } from "@/app/app/sessions/SessionForm";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";

export default async function NewSessionPage() {
  const supabase = await createSupabaseServerClientReadOnly();
  const { data: disciplines } = await supabase.from("disciplines").select("id, name").order("name");
  const { data: skillLevels } = await supabase.from("skill_levels").select("id, name").order("id");
  const { data: trainingTypes } = await supabase.from("training_types").select("id, name").order("name");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Créer une session</h1>
        <p className="text-muted-foreground">Publie une nouvelle session pour trouver des partenaires.</p>
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
