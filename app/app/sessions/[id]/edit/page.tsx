import Link from "next/link";
import { createSupabaseServerClientReadOnly } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionForm } from "@/app/app/sessions/SessionForm";

export default async function EditSessionPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const sessionId = resolvedParams?.id;

  if (!sessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session introuvable</CardTitle>
        </CardHeader>
        <CardContent>Identifiant manquant dans URL.</CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClientReadOnly();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, description, training_type_id, place_id, starts_at, ends_at, capacity, host_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.host_id !== user?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>Tu ne peux pas modifier cette session.</CardContent>
      </Card>
    );
  }

  const { data: sessionDisciplines } = await supabase
    .from("session_disciplines")
    .select("discipline_id, skill_level_id")
    .eq("session_id", session.id)
    .order("discipline_id", { ascending: true });

  const { data: disciplines } = await supabase
    .from("disciplines")
    .select("id, name")
    .order("name");
  const { data: skillLevels } = await supabase
    .from("skill_levels")
    .select("id, name")
    .order("id");
  const { data: trainingTypes } = await supabase
    .from("training_types")
    .select("id, name")
    .order("name");
  const { data: place } =
    session.place_id
      ? await supabase
          .from("places")
          .select("id, name, address, city")
          .eq("id", session.place_id)
          .maybeSingle()
      : { data: null };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-muted-foreground">
          <Link href="/app/sessions/requests">← Retour à mes sessions</Link>
        </div>
        <h1 className="text-2xl font-semibold">Modifier la session</h1>
        <p className="text-muted-foreground">
          Mets à jour les infos de ta session.
        </p>
      </div>
      <SessionForm
        mode="edit"
        sessionId={session.id}
        disciplines={disciplines ?? []}
        skillLevels={skillLevels ?? []}
        trainingTypes={trainingTypes ?? []}
        defaultPlace={place ?? undefined}
        defaultValues={{
          title: session.title,
          description: session.description,
          training_type_id: session.training_type_id,
          place_id: session.place_id,
          starts_at: session.starts_at,
          ends_at: session.ends_at,
          capacity: session.capacity,
          disciplines: sessionDisciplines ?? [],
        }}
      />
    </div>
  );
}
