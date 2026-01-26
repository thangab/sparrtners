"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type RequestItem = {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
  session_title: string | null;
};

export function RequestsClient({ initialRequests }: { initialRequests: RequestItem[] }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const { toast } = useToast();
  const [requests, setRequests] = React.useState<RequestItem[]>(initialRequests);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleDecision = async (request: RequestItem, decision: "accepted" | "declined") => {
    setLoadingId(request.id);
    const { data: updatedRequest, error: updateError } = await supabase
      .from("session_requests")
      .update({ status: decision })
      .eq("id", request.id)
      .select("id, status")
      .maybeSingle();

    if (updateError || !updatedRequest) {
      toast({
        title: "Erreur",
        description: updateError?.message ?? "Mise à jour refusée par les règles RLS.",
        variant: "destructive",
      });
      setLoadingId(null);
      return;
    }

    if (decision === "accepted") {
      const { error: participantError } = await supabase.from("session_participants").insert({
        session_id: request.session_id,
        user_id: request.user_id,
        role: "participant",
      });

      if (participantError) {
        toast({
          title: "Erreur",
          description: participantError.message,
          variant: "destructive",
        });
      }
    }

    setRequests((current) =>
      current.map((item) => (item.id === request.id ? { ...item, status: decision } : item))
    );
    toast({ title: "Mise à jour", description: `Demande ${decision === "accepted" ? "acceptée" : "refusée"}.` });
    setLoadingId(null);
  };

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-sm text-muted-foreground">Aucune demande en attente.</div>
      ) : (
        requests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-white p-4"
          >
            <div>
              <div className="text-sm text-muted-foreground">Session</div>
              <div className="font-medium">{request.session_title ?? "Session"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Statut: {request.status}</span>
              <span>•</span>
              <span>{new Date(request.created_at).toLocaleString("fr-FR")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleDecision(request, "accepted")}
                disabled={loadingId === request.id || request.status !== "pending"}
              >
                Accepter
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDecision(request, "declined")}
                disabled={loadingId === request.id || request.status !== "pending"}
              >
                Refuser
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
