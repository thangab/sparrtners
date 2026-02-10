# Sanity Setup

This project reads content from Sanity via the Content Lake API.

## Required document types

- `post` (for `/blog` and `/blog/[slug]`)
- `staticPage` (for `/about`, `/terms`, `/privacy-policy`, `/contact`)

Schemas are available in:

- `sanity/schemas/post.ts`
- `sanity/schemas/static-page.ts`
- `sanity/schemas/index.ts`

## Required slugs for static pages

- `about`
- `terms`
- `privacy-policy`
- `contact`

## Environment variables

Set these variables in `.env.local`:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_READ_TOKEN` (optional, required for private datasets)

For contact form email:

- `RESEND_API_KEY`
- `RESEND_FROM`
- `CONTACT_EMAIL` (optional fallback target)
