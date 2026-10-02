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

| `SESSION_SECRET` | Random secret that signs login cookies (32+ characters) | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `SEED_PASSWORD_CHAIR`, `_VICE_CHAIR`, `_TREASURER`, `_SECRETARY`, `_VOLUNTEER` | Starting passwords for the 5 accounts (10+ characters) | Choose them yourself; used only by `npm run db:seed` |

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

## Login and permissions

Run `npm run db:seed` after filling the `SEED_PASSWORD_*` values. It creates five accounts with these usernames: `chair`, `vicechair`, `treasurer`, `secretary`, `volunteer`. After the first login, delete the `SEED_PASSWORD_*` lines from `.env`, set real names on the Accounts page, and change passwords in Settings.

| Action | Chair / Vice Chair | Treasurer / Secretary | Volunteer |
| --- | --- | --- | --- |
| Add goods received, distribute | Yes | Yes | Yes |
| Edit or delete past records | Yes | Yes | No |
| Create events and items | Yes | Yes | No |
| View audit log | Yes | Yes | No |
| Download CSV exports | Yes | Yes | No |
| Rename accounts, reset passwords | Yes | No | No |

All of this lives in `src/lib/permissions.ts`.

Controls a role cannot use are hidden. If someone opens a restricted page by typing its address, they see an "Access restricted" page and the attempt is recorded in the audit log as ACCESS_DENIED.

- Sessions last 12 hours. An account is locked for 15 minutes after 5 wrong passwords.
- Forgotten password: Chair or Vice Chair resets it on the Accounts page. If the Chair and Vice Chair are both locked out, set the `SEED_PASSWORD_*` value and run `npm run db:seed -- --reset-passwords`.

## Using the app

1. An officer adds **Events** and **Items** (tick "Has serial numbers" for items like T-shirts with numbered tags or devices; leave it off for stickers). Recipient types (Winner, Participant, Organizer...) are managed at the bottom of the Items page.
2. **Receive**: pick event and item, enter who it came from, then either paste serial numbers (one per line) or enter a quantity.
3. **Distribute**: pick event and item, then tick the serial numbers to give out (or enter a quantity for bulk items) and fill in the recipient. Recipient type and name are required for serial items and optional for bulk items.
4. **Stock**: received, distributed and in-stock counts by item and by event.

**Fixing mistakes (Records page).** Officers can edit a record (event, source, recipient details, remarks, and the quantity of bulk items) or delete it with a reason. Deleting a distribution puts its units back in stock. Deleting a receipt is blocked if any of its units were already given out. To change serial numbers, delete the receipt and enter it again. Nothing is erased: deleted records stay in the database and every change, with before and after values, is in the audit log. Events and items can be removed only when they have no records.

**Search.** Type a serial number to see who received that exact unit, or search by person, roll number, source or remarks. Filters: event, item, recipient type, date range.

**Audit log (officers).** Filter by person, action and type. Edits show what changed (old to new). Deleted records show the reason and serial numbers.

**CSV export (officers).** Goods received, goods distributed, serial register (every serial and where it went) and stock. Files open directly in Excel. Each download is itself recorded in the audit log.

Checks built in: a serial number cannot be added twice for an item, you cannot distribute more than is in stock, and two people distributing at the same moment cannot take the same unit.

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
| `npm test` | Run the automated checks for the helper code |
| `npm run db:backup` | Save a full database backup to `backups/` (needs `pg_dump`) |

## Look and feel

Sidebar navigation grouped as Work (Receive, Distribute), Look up (Search, Stock, Records) and Admin (Setup, Audit log, Accounts, shown by role). On phones the sidebar becomes a bottom tab bar. Lists show one calm line per item and open on click. Dark by default with a light option (sun/moon button, remembered per browser). Colours live in `src/app/globals.css`. To use the chapter's real logo, replace `public/logo.svg` (same file name), or change the path in `src/components/logo.tsx`.

## Guides

- [`docs/TESTING.md`](docs/TESTING.md): full test checklist to run before launch
- [`docs/HANDOVER.md`](docs/HANDOVER.md): yearly rollover, forgotten passwords, backups and restore, known limits
- [`docs/DEPLOY.md`](docs/DEPLOY.md): putting the app online (optional)

## Build phases

- [x] Phase 0: Project setup
- [x] Phase 1: Database design
- [x] Phase 2: Login (5 fixed accounts)
- [x] Phase 3: Core screens
- [x] Phase 4: Safety rules
- [x] Phase 5: Search, audit log, export
- [x] Phase 6: Testing and handover
