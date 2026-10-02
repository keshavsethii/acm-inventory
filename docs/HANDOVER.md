# Handover guide for the core team

ACM Inventory Manager, ACM Student Chapter IIIT Una. Keep this file up to date. Read it when the team changes.

## Who owns what
Write the current owner next to each line and update it every year.

| Thing | Owner (name, email) |
| --- | --- |
| GitHub repository | |
| Neon database account | |
| Hosting account (if deployed) | |
| Where the `.env` secrets are stored | |

Use a shared chapter email, or add two or more members, so that one graduating student cannot lock everyone out. Never keep the only copy of a password on one person's laptop.

## Yearly rollover (do this when the new core team takes over)
1. **Log in as Chair** and open **Accounts**. Set the new names for each role and reset all five passwords. Tell each person their own username and password privately.
2. **Settings:** each person changes their password at first login.
3. **Events:** add the new events with the new academic year (for example `2027-28`). Old events can stay.
4. **Backup:** run `npm run db:backup` and save the file in the chapter's shared drive. Also download all four CSV files (Records page) and store them as that year's archive.
5. **Update the ownership table above.** Remove the old team's access to GitHub, Neon and hosting.

## Forgotten passwords
- A Chair or Vice Chair resets any password on the **Accounts** page.
- If the Chair and Vice Chair are both locked out: on a computer with the project and `.env`, set `SEED_PASSWORD_CHAIR` to a new password (10+ characters) and run `npm run db:seed -- --reset-passwords`. This resets every account whose `SEED_PASSWORD_*` value is set. Then delete those lines from `.env`.
- An account locks for 15 minutes after 5 wrong passwords. Wait, or have the Chair reset the password.

## Backups
**Install once:** the PostgreSQL command line tools (`pg_dump`). On Windows, install PostgreSQL from postgresql.org and tick only "Command Line Tools", then restart the terminal. Its version must be at least as new as the database's (shown in the Neon dashboard).

**Back up:** from the project folder run `npm run db:backup`. A `.dump` file appears in `backups/`. This folder is ignored by Git on purpose, because backups contain names and roll numbers: never upload them to GitHub. Copy them to a shared drive owned by the chapter.

**How often:** before and after every big event, and at least once a month. The free database plan has only a short built-in history, so do not rely on it.

**Restore:** into a new empty database, never over the live one.
1. Create a new empty database or project in Neon and copy its direct connection string.
2. Run: `pg_restore --no-owner --clean --if-exists --dbname "<that connection string>" backups/<file>.dump`
3. Point `DATABASE_URL` and `DIRECT_URL` in `.env` (and the hosting settings, if deployed) at the new database.

## Settings that matter
- `SESSION_SECRET` signs login cookies. Changing it logs everyone out (harmless). Do not share it or commit it.
- `.env` is never committed to GitHub. Only `.env.example` is.
- Permissions are in one file, `src/lib/permissions.ts`.

## Things the app deliberately does not do
- Records are never erased: "delete" marks them as deleted and the audit log keeps the details (who, when, why).
- Serial numbers cannot be edited. To fix a wrong serial, delete that receipt (after undoing any distributions of it) and enter it again.
- There is no email password reset: the Chair or Vice Chair resets passwords.
- Stock is tracked per item overall. The "By event" table on the Stock page shows received and distributed per event, but goods from one event can be given out at another.
- Serial numbers are case-sensitive: `kb-001` and `KB-001` are different.
- Costs and budgets are not tracked here (handled elsewhere).

## If something looks wrong
1. Check the **Audit log** (who did what, when).
2. Check **Records** for the entry and use Edit or Delete (with a reason) to correct it.
3. Compare **Stock** with the serial register CSV.
4. If the data looks damaged, restore the latest backup into a new database and compare before switching.
