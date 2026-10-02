# Test checklist

Run this on a **test database** (a second Neon project or branch), never on the database the chapter will really use. Do the whole list once before launch, and again after any big change.

Automated checks for the helper code: `npm test` (should say 10 pass, 0 fail).

## Dummy data to use
- Events: "Hackathon 2026", "Quiz Night"
- Items: "Keyboard" (serial numbers ON), "Stickers" (serial numbers OFF)
- Serials for the keyboards: `KB-001`, `KB-002`, `KB-003`
- People: a winner (`Test Winner`, roll `21001`), a participant, an organizer

## A. Login and roles
- [ ] Each of the 5 usernames (`chair`, `vicechair`, `treasurer`, `secretary`, `volunteer`) can log in.
- [ ] A wrong password shows "Wrong username or password."
- [ ] 5 wrong passwords lock that account for 15 minutes (a correct password is also refused during the lock).
- [ ] Opening any page while logged out sends you to the login page.
- [ ] Settings: changing your own password works, and the new one works at the next login.
- [ ] Chair: the Accounts page changes a name and resets another account's password.
- [ ] Treasurer: no Accounts link, and opening `/accounts` by typing the address returns to the dashboard.
- [ ] Volunteer: no Events, Items, Audit log or download buttons, and no Edit/Delete on Records.

## B. Serial-numbered item (Keyboard)
- [ ] Chair adds the event and the Keyboard item (serial numbers ON).
- [ ] Receive 3 keyboards: paste `KB-001`, `KB-002`, `KB-003`. Stock shows 3.
- [ ] Receive again with `KB-002` in the list: refused, naming `KB-002`.
- [ ] Receive with a repeated serial in the same list: refused.
- [ ] Distribute `KB-001` to "Test Winner", roll `21001`, type Winner. Stock shows 2.
- [ ] Distribute with no recipient name: refused.
- [ ] Search `KB-001`: shows Test Winner, roll 21001, event, date.
- [ ] `KB-001` no longer appears in the Distribute serial list.

## C. Bulk item (Stickers)
- [ ] Receive 100 stickers from "Sponsor X". Stock shows 100.
- [ ] Distribute 30 with no recipient: accepted. Stock shows 70.
- [ ] Distribute 71: refused ("Only 70 ... in stock").
- [ ] Distribute 5 to an organizer with a name: accepted.
- [ ] Stock page "By event" shows the right received/distributed per event.

## D. Corrections (as Chair)
- [ ] Records: delete the keyboard distribution with a reason. `KB-001` is back in the Distribute list and Stock shows 3.
- [ ] Distribute `KB-001` again, then try to delete the keyboard receipt: refused, naming `KB-001`.
- [ ] Reduce the stickers receipt to 10: refused (more than that was given out). Raise it to 120: accepted.
- [ ] Edit a distribution's remarks and recipient name: saved.
- [ ] Items page: the Keyboard "serial numbers" tick is locked. Removing the Keyboard item is refused while it has records.
- [ ] Events page: removing an event with records is refused. Removing an empty event works.

## E. Search, audit log, export
- [ ] Search by part of a name, a roll number, a source ("Sponsor X"), and with an event filter.
- [ ] Audit log: filter Action = DELETE shows your reason and the serial numbers. An edit shows old → new values.
- [ ] Download all four CSV files and open them in Excel. Check the accents/symbols look right and the serial register matches Search.
- [ ] A remark typed as `=1+1` shows as text in the CSV, not as a calculation.

## F. Two people at once
Use two browsers (for example Chrome and a private Edge window), one logged in as `chair` and one as `secretary`.
- [ ] Both open **Distribute** and choose Keyboard with the same serial ticked. Submit in the first. Submit in the second: it should be refused with a "no longer in stock" message, and stock must not go negative.
- [ ] Repeat with Stickers: both enter the full remaining quantity. The second must be refused.

## G. Backup and restore drill
- [ ] `npm run db:backup` creates a file in `backups/`.
- [ ] Create an empty second Neon database and restore into it (steps in `docs/HANDOVER.md`). Point a copy of `.env` at it and check the data shows up.

## Resetting the test database afterwards
Run this in the Neon **SQL Editor** of the **test** database only. It removes all test records but keeps the 5 accounts and the recipient types:

```sql
TRUNCATE TABLE audit_logs, serial_units, distributions, receipts, events, items;
```
