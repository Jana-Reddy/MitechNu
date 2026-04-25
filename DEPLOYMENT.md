# Vercel Deployment Guide

This project is ready to deploy as a public MVP with:

- `Vercel` for the Next.js app
- `Neon` for PostgreSQL

## 1. Push the repository

Push this codebase to GitHub before importing it into Vercel.

## 2. Import the repo in Vercel

In the Vercel dashboard:

1. Click `Add New...`
2. Choose `Project`
3. Import this GitHub repository

Because this repo is a monorepo, configure the project like this:

- Framework Preset: `Next.js`
- Root Directory: `apps/web`

Vercel's monorepo docs say each app in a monorepo should be imported as its own project and configured from the dashboard.

## 3. Add environment variables

Use [`apps/web/.env.vercel.example`](c:/vscode_workspace/edtech/apps/web/.env.vercel.example) as your template.

Minimum required variables:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`
- `ACADEMY_SESSION_SECRET`
- `ACADEMY_MEDIA_SECRET`
- `POSTGRES_URL`

Apply them to:

- `Production`
- `Preview`

## 4. Update Google OAuth

In Google Cloud Console, add your public Vercel domain:

- Authorized JavaScript origin:
  `https://your-project.vercel.app`
- Authorized redirect URI:
  `https://your-project.vercel.app/api/auth/callback/google`

If you later add a custom domain, update both values again.

## 5. Deploy

After the first deployment:

1. Open the production URL
2. Test login/signup
3. Test course catalog pages
4. Create an order
5. Submit payment proof
6. Approve the order as the seeded admin

## 6. Seeded accounts

The Neon database already contains the seed data from [`packages/db/src/seed.ts`](c:/vscode_workspace/edtech/packages/db/src/seed.ts).

That includes:

- admin user: `admin@academy.dev`
- learner user: `learner@academy.dev`

## 7. Security cleanup before public launch

Rotate any secrets that were exposed during local setup, especially:

- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_SECRET`
- `AUTH_SECRET`
- `ACADEMY_SESSION_SECRET`
- `POSTGRES_URL` credentials

## Notes

- The app now uses Postgres first, with demo-store fallback only if the database is unavailable.
- The AI tutor can still function in local fallback mode even if Ollama is not deployed publicly yet.
- MinIO and Redis are not required for the first public MVP deployment.
