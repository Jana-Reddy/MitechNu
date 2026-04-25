# Mi.Tech.Nu

Mi.Tech.Nu is an open-source-first online learning platform for tech education. It is designed as a modern academy product with a public marketing site, learner dashboard, course delivery experience, manual-payment commerce flow, admin operations, and lightweight AI-assisted study support.

This repository contains a working MVP scaffold built with a monorepo-style npm workspace setup and a Next.js web application.

## Development Warning

This repository is currently intended for development, prototyping, and MVP iteration.

Do not treat the current implementation as production-ready yet:

- persistence is still demo-store-backed
- seeded development users exist
- manual payment review is simplified
- media delivery is scaffolded but not a full production streaming pipeline
- authentication and infrastructure should be hardened further before public deployment

## Recommended Public Stack

For the fastest path to making this project public and reachable from anywhere:

- Host the Next.js app on `Vercel`
- Use `Neon` for managed PostgreSQL
- Keep the current AI tutor fallback behavior until you are ready to host Ollama separately
- Defer MinIO/private video infrastructure until after the first public launch

## What This Project Includes

- Public landing page and course catalog
- Course detail pages with curriculum preview
- Email/password signup and login
- Google sign-in with `next-auth`
- Learner dashboard with active courses, notes, orders, and certificates
- Lesson experience with progress tracking, saved notes, and AI tutor entry point
- Manual payment flow: create order, submit payment reference, admin approval
- Admin dashboard for reviewing payments and creating draft courses
- Signed media access helpers for future private streaming integration
- Docker Compose starter stack for Postgres, Redis, MinIO, Ollama, Prometheus, and Grafana

## Current Architecture

### Applications

- `apps/web`
  Next.js 15 application with the public site, auth flows, learner experience, admin pages, and API routes.

### Shared Packages

- `packages/config`
  Central environment/config access.
- `packages/db`
  Domain types, demo persistence layer, seed data, and PostgreSQL-oriented schema definitions.
- `packages/ai`
  Ollama-ready AI tutor helper with local fallback behavior.
- `packages/media`
  Signed media token generation and verification.
- `packages/ui`
  Small shared UI primitives.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- `next-auth` for Google OAuth
- Drizzle schema definitions for future PostgreSQL persistence
- Vitest for domain-level tests
- Docker Compose for local infra services

## Important Implementation Note

The app currently uses a file-backed runtime store for working MVP behavior.

That means:
- signup data
- Google-created users
- orders
- payment reviews
- progress
- notes
- certificates

are currently persisted in:

- `runtime/demo-store.json`

This is intentional for the current MVP so the full product flow works immediately without requiring database migrations first.

Production-oriented schema groundwork already exists in:

- `packages/db/src/schema.ts`

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create:

- `apps/web/.env.local`

Recommended minimum local config:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
AUTH_SECRET=replace-with-the-same-or-another-long-random-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

NEXT_PUBLIC_APP_NAME=Mi.Tech.Nu
NEXT_PUBLIC_APP_URL=http://localhost:3000

ACADEMY_SESSION_SECRET=replace-with-a-long-random-secret
ACADEMY_MEDIA_SECRET=replace-with-a-long-random-secret

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=academy-media

POSTGRES_URL=postgres://academy:academy@localhost:5432/academy
REDIS_URL=redis://localhost:6379
```

You may also keep a root `.env.local` for your own convenience, but the Next.js app should read from:

- `apps/web/.env.local`

### 3. Start the app

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Google OAuth Setup

To enable `Continue with Google`:

1. Create a Google OAuth client in Google Cloud Console.
2. Choose `Web application`.
3. Add this authorized JavaScript origin:
   `http://localhost:3000`
4. Add this authorized redirect URI:
   `http://localhost:3000/api/auth/callback/google`
5. Put the generated values into:
   - `AUTH_GOOGLE_ID`
   - `AUTH_GOOGLE_SECRET`
6. Restart the dev server after updating env vars.

## Demo Accounts

These seeded accounts are available immediately:

- Admin: `admin@academy.dev`
- Learner: `learner@academy.dev`

Passwords are intentionally omitted from this README. If you need them for local development, check the seed data in:

- `packages/db/src/seed.ts`

## Available Scripts

From the repo root:

```bash
npm run dev
npm run build
npm run start
npm test
npm run typecheck
npm run db:generate
npm run db:push
npm run db:seed
```

## Public Deployment Path: Vercel + Neon

### 1. Create a Neon database

1. Create a free Neon project.
2. Copy the Postgres connection string.
3. Save it as:
   - `POSTGRES_URL`

### 2. Push the schema and seed starter data

After setting `POSTGRES_URL` locally, run:

```bash
npm run db:push
npm run db:seed
```

This repository now includes:

- `drizzle.config.ts`
- complete PostgreSQL schema definitions in `packages/db/src/schema.ts`
- a starter seed script in `packages/db/src/postgres-seed.ts`

### 3. Deploy the app to Vercel

1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Set the root project to the monorepo root.
4. Use the default Next.js detection for `apps/web`.
5. Add the required environment variables in Vercel.

Recommended environment variables for the first public deployment:

```env
NEXTAUTH_URL=https://your-public-domain.vercel.app
NEXTAUTH_SECRET=replace-with-a-long-random-secret
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

NEXT_PUBLIC_APP_NAME=Mi.Tech.Nu
NEXT_PUBLIC_APP_URL=https://your-public-domain.vercel.app

ACADEMY_SESSION_SECRET=replace-with-a-long-random-secret
ACADEMY_MEDIA_SECRET=replace-with-a-long-random-secret

POSTGRES_URL=your-neon-connection-string
REDIS_URL=redis://localhost:6379
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=academy-media
```

### 4. Update Google OAuth before going public

In Google Cloud Console, update the OAuth app with your public domain:

- Authorized JavaScript origin:
  `https://your-public-domain.vercel.app`
- Authorized redirect URI:
  `https://your-public-domain.vercel.app/api/auth/callback/google`

### 5. Important current limitation

The app still runs its live product flows through the demo store today.

The new PostgreSQL/Neon setup added in this repository is the production foundation, but the application logic still needs to be switched from `packages/db/src/demo-store.ts` to database-backed queries before calling the project production-ready.

That migration should be the next implementation milestone.

## Docker Compose Services

The repository includes a starter `docker-compose.yml` with:

- `web`
- `postgres`
- `redis`
- `minio`
- `ollama`
- `prometheus`
- `grafana`

This gives you a path toward self-hosted development and production-style infrastructure without changing the app direction later.

## Project Flows Implemented

### Learner Flow

1. Browse courses
2. View course detail and curriculum
3. Sign up or log in
4. Create an order
5. Submit payment proof/reference
6. Wait for admin approval
7. Access lessons
8. Save notes and mark progress
9. Receive a certificate when a course is completed

### Admin Flow

1. Log in as admin
2. View platform stats
3. Review submitted payments
4. Approve or reject orders
5. Create draft courses
6. Monitor catalog and learner activity

## Verification Status

The project has been validated with:

- `npm install`
- `npm test`
- `npm run build`

## Security Notes

- Passwords are hashed before storage
- Auth failure messages are sanitized and do not expose env variable names
- Signed media helpers are included for private content delivery
- If any OAuth client secret was exposed during manual debugging, rotate it in Google Cloud Console

## Suggested Next Steps

- Replace the demo runtime store with PostgreSQL + Drizzle migrations
- Add richer admin curriculum management
- Add real video ingestion and HLS playback pipeline
- Add payment gateway integrations beyond the manual approval flow
- Add richer test coverage for auth and app routes

## License and Intent

This project is intended as an open-source-first foundation for a self-hostable tech learning platform that can grow from MVP into a more production-grade academy product.
