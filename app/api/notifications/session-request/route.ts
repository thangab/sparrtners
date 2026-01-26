import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function formatName(profile: { firstname?: string | null; lastname?: string | null; nickname?: string | null; display_name?: string | null }) {
  const name = [profile.firstname, profile.lastname].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (profile.nickname) return profile.nickname;
  if (profile.display_name) return profile.display_name;
  return "Un membre";
}

export async function POST(request: Request) {
  const { sessionId, requesterId } = (await request.json()) as {
    sessionId?: string;
    requesterId?: string;
  };

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: "Missing email configuration" },
      { status: 500 }
    );
  }

  if (!sessionId || !requesterId) {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, title, host_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? "Session not found" }, { status: 404 });
  }

  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("email, firstname, lastname, nickname, display_name")
    .eq("id", session.host_id)
    .maybeSingle();

  if (!hostProfile?.email) {
    return NextResponse.json({ error: "Host email not found" }, { status: 404 });
  }

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("firstname, lastname, nickname, display_name")
    .eq("id", requesterId)
    .maybeSingle();

  const requesterName = requesterProfile ? formatName(requesterProfile) : "Un membre";
  const subject = `Nouvelle demande pour "${session.title}"`;

  const body = {
    from: process.env.RESEND_FROM,
    to: [hostProfile.email],
    subject,
    html: `<p>${requesterName} a demandé à rejoindre ta session.</p><p><strong>${session.title}</strong></p>`,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
