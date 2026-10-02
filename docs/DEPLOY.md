# Putting the app online (optional, when you are ready)

Until you do this, the app only runs on one computer with `npm run dev`. These are the usual steps for Vercel plus Neon. Check each service's current pricing and terms before you rely on it.

## 1. Use a separate production database
Keep your test data away from the real records.
1. In Neon, create a second project (or branch) named `production`.
2. Copy its pooled and direct connection strings (see the README table).

## 2. Create the tables and accounts in production (once)
In PowerShell, from the project folder. The values you set here take priority over `.env`, so your test database is not touched:

```powershell
$env:DATABASE_URL = "<production pooled string>"
$env:DIRECT_URL = "<production direct string>"
$env:SEED_PASSWORD_CHAIR = "<10+ characters>"
$env:SEED_PASSWORD_VICE_CHAIR = "<10+ characters>"
$env:SEED_PASSWORD_TREASURER = "<10+ characters>"
$env:SEED_PASSWORD_SECRETARY = "<10+ characters>"
$env:SEED_PASSWORD_VOLUNTEER = "<10+ characters>"
npx prisma migrate deploy
npx tsx prisma/seed.ts
```
Then close that PowerShell window so the passwords are not left behind.

## 3. Deploy the app
1. Push the project to GitHub.
2. In Vercel, import the repository (Next.js is detected automatically).
3. Add these environment variables for production: `DATABASE_URL` (pooled), `DIRECT_URL` (direct), `SESSION_SECRET` (a new random value, different from your local one). Do **not** add the `SEED_PASSWORD_*` values.
4. Deploy, then open `/api/health`: it should say the database is connected.
5. Log in with each account, then change every password in Settings.

## 4. Later changes
- Code changes: push to GitHub and the host redeploys.
- Database changes (a new phase with a schema change): run `npx prisma migrate deploy` against production using the PowerShell variables from step 2, before or right after deploying.
- Take a backup (`npm run db:backup` with the production `DIRECT_URL`) before any database change.
