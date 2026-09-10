# Afterhours Party

Vercel-ready party RSVP site with a Neon Postgres backend, database-backed rate limiting, and password + authenticator-code admin access.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

You need the environment variables from `.env.example` before the RSVP and admin API routes can access the database.

## Deploy

Read [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) before deploying. It explains how to create the Neon database, run the SQL schema, and configure Vercel environment variables.
