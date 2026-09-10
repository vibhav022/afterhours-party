# Deploy on Vercel

This copy is independent from the existing Cloudflare deployment. It uses a Neon Postgres database and Vercel Functions.

## 1. Create the database

In Vercel, open **Storage** → **Marketplace** and add the Neon Postgres integration to this project. Copy the pooled connection string into the `POSTGRES_URL` environment variable.

Open the Neon SQL editor and run the contents of `sql/001_initial_schema.sql` once.

## 2. Add production environment variables

Add these values in Vercel Project Settings → Environment Variables:

```text
POSTGRES_URL=your Neon pooled connection string
ADMIN_PASSWORD=a long unique password
ADMIN_SESSION_SECRET=a random 32+ character secret
ADMIN_TOTP_SECRET=your existing authenticator-app base32 secret
```

Keep all four values private. Add them to Production, Preview, and Development if you want those environments to work too.

## 3. Deploy

Push this folder to a new GitHub repository, import that repository into Vercel, and deploy. Vercel will detect Next.js automatically and run `npm run build`.

## 4. Existing RSVP records

This migration creates a new database. Export the current RSVP list from the old admin dashboard before switching if you need to keep those records.

## Security included

- Postgres-backed IP rate limiting
- Password + TOTP admin login
- Signed HTTP-only, Secure, SameSite cookies
- Strict same-origin checks for mutating requests
- Security headers for clickjacking, content types, referrers, and device permissions
