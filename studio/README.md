# Sparrtners Sanity Studio

## 1) Environment

Create `studio/.env.local` (or export in your shell):

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

If you prefer:

```bash
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
```

## 2) Install

```bash
npm install
```

## 3) Run studio

```bash
npm run dev
```

## 4) Deploy studio

```bash
npm run deploy
```

## Required slugs for static pages

- `about`
- `terms`
- `privacy-policy`
- `contact`
