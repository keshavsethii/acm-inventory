# ACM Inventory Manager

Inventory manager for the ACM Student Chapter, IIIT Una. Tracks goods received for events (with source and serial numbers where applicable) and how they are distributed to winners, participants and organizers.

**Stack:** Next.js (App Router, TypeScript, Tailwind) + Prisma 6 + PostgreSQL

## Getting started

1. Install Node.js 20 or newer.
2. Install dependencies (this also runs `prisma generate`):
   ```bash
   npm install
   ```
3. Create your env file and fill it in (see below):
   ```bash
   cp .env.example .env
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 and then http://localhost:3000/api/health. You should see `{"status":"ok","database":"connected"}`.

## Environment variables

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `DATABASE_URL` | Pooled Postgres connection string, used by the running app | Neon dashboard, your project, **Connect**, turn **Connection pooling ON**, copy the string |
| `DIRECT_URL` | Direct (non-pooled) connection string, used by `prisma migrate` | Same place, turn **Connection pooling OFF**, copy the string |

Notes:
- The pooled string has `-pooler` in its hostname; the direct one does not.
- Both must end with `?sslmode=require`.
- `.env` is git-ignored. Never commit it. Only `.env.example` goes to GitHub.

## Database setup (first time, after filling `.env`)

```bash
npm run db:migrate -- --name init
npm run db:seed
```

The first command creates the tables in Neon and writes a `prisma/migrations/` folder. Commit that folder to GitHub.
After this, `npm run db:studio` lets you browse the tables.

## Data model

| Table | Purpose |
| --- | --- |
| `users` | The 5 fixed logins (Chair, Vice Chair, Treasurer, Secretary, Volunteer), one per role |
| `events` | Event name, date, academic year |
| `items` | Item name and whether it is serialized or bulk |
| `recipient_types` | Dropdown values: Winner, Participant, Organizer (editable) |
| `receipts` | Goods received: event, item, from whom, quantity, remarks |
| `serial_units` | One row per serialized unit; links to its receipt and, once given out, its distribution |
| `distributions` | Goods given out: event, item, quantity, recipient type, name, roll number, remarks |
| `audit_logs` | Who did what and when |

Rules built into the design:
- Stock is never stored. It is calculated as received minus distributed.
- A serial number is unique per item.
- Serialized items need recipient details; bulk items (stickers) need only a count.
- Records use `deletedAt` (soft delete) instead of being removed.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app locally |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Create and apply a migration (use `-- --name <short_name>` to name it) |
| `npm run db:seed` | Add the default recipient types (Winner, Participant, Organizer) |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:studio` | Open Prisma Studio to browse the data |

## Build phases

- [x] Phase 0: Project setup
- [x] Phase 1: Database design
- [ ] Phase 2: Login (5 fixed accounts)
- [ ] Phase 3: Core screens
- [ ] Phase 4: Safety rules
- [ ] Phase 5: Search, audit log, export
- [ ] Phase 6: Testing and handover
