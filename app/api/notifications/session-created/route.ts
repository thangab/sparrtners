import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { to, sessionTitle, startsAt } = (await request.json()) as {
    to?: string;
    sessionTitle?: string;
    startsAt?: string;
  };

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: "Missing email configuration" },
      { status: 500 }
    );
  }

  if (!to) {
    return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
  }

  const subject = sessionTitle
    ? `Session créée : ${sessionTitle}`
    : "Session créée";

  const body = {
    from: process.env.RESEND_FROM,
    to: [to],
    subject,
    html: `<p>Ta session est bien créée.</p><p><strong>${sessionTitle ?? "Session"}</strong><br/>${
      startsAt ?? ""
    }</p>`,
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
