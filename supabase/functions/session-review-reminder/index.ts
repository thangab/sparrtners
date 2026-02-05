const siteUrl =
  Deno.env.get('SITE_URL') ??
  Deno.env.get('NEXT_PUBLIC_SITE_URL') ??
  '';

if (!siteUrl) {
  throw new Error('Missing SITE_URL env');
}

Deno.serve(async () => {
  const response = await fetch(
    `${siteUrl}/api/notifications/session-review-reminder`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    },
  );

  const text = await response.text();
  console.log('session-review-reminder response', response.status, text);
  return new Response(text, { status: response.status });
});
