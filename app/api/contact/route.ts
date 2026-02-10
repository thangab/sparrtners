import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

export async function POST(request: Request) {
  const { name, email, message } = (await request.json()) as ContactPayload;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    return NextResponse.json(
      { error: 'Missing email configuration' },
      { status: 500 },
    );
  }

  const to =
    process.env.CONTACT_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    process.env.RESEND_FROM;

  const html = `
    <h2>New contact message</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Message:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: [to],
      reply_to: email,
      subject: `[Contact] ${name}`,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
