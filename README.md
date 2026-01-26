# Sparrtners MVP

MVP Next.js App Router avec Supabase + Stripe.

## Stack

- Next.js App Router + TypeScript
- TailwindCSS + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- Stripe (Checkout + Webhooks)

## Setup local

```bash
npm install
npm run dev
```

## Variables d'environnement

Copie `.env.example` vers `.env.local` et configure :

- Supabase URL + ANON KEY + SERVICE ROLE
- Stripe Secret Key + Webhook Secret
- Price IDs Stripe

## Supabase CLI

```bash
supabase init
supabase link --project-ref <your-project-ref>
supabase db push
supabase start # optionnel
```

## Stripe

- Crée les Price IDs pour `premium_monthly`, `premium_yearly`, `premium_lifetime`, `boost_pack_5`.
- Configure le webhook Stripe vers `/api/stripe/webhook`.
- En local: stripe listen --forward-to localhost:3000/api/stripe/webhook

## Routes principales

- `/` landing
- `/login`
- `/app` dashboard
- `/app/sessions/new`
- `/find-sessions`
- `/sessions/[id]`
- `/app/me`

## Auth Supabase

- OAuth Google + email/password
- Callback: `/api/auth/callback`
- Logout: `/api/auth/logout`

# Sparrtners MVP

MVP Next.js App Router avec Supabase + Stripe.

## Stack

- Next.js App Router + TypeScript
- TailwindCSS + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- Stripe (Checkout + Webhooks)

## Setup local

```bash
npm install
npm run dev
```

## Variables d'environnement

Copie `.env.example` vers `.env.local` et configure :

- Supabase URL + ANON KEY + SERVICE ROLE
- Stripe Secret Key + Webhook Secret
- Price IDs Stripe

## Supabase CLI

```bash
supabase init
supabase link --project-ref <your-project-ref>
supabase db push
supabase start # optionnel
```

## Stripe

- Crée les Price IDs pour `premium_monthly`, `premium_yearly`, `premium_lifetime`, `boost_pack_5`.
- Configure le webhook Stripe vers `/api/stripe/webhook`.
- En local: stripe listen --forward-to localhost:3000/api/stripe/webhook

## Routes principales

- `/` landing
- `/login`
- `/app` dashboard
- `/app/sessions/new`
- `/find-sessions`
- `/sessions/[id]`
- `/app/me`

## Auth Supabase

- OAuth Google + email/password
- Callback: `/api/auth/callback`
- Logout: `/api/auth/logout`
