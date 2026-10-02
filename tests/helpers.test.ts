import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSerialLines } from "../src/lib/serials";
import { toCsv, istStamp } from "../src/lib/csv";
import { can, ROLE_LABELS } from "../src/lib/permissions";
import { currentAcademicYear, toDateInput } from "../src/lib/format";

test("serial lines: trims, skips blanks, reports repeats", () => {
  const r = parseSerialLines("A1\r\n A2 \n\nA1\nB3\n");
  assert.deepEqual(r.serials, ["A1", "A2", "B3"]);
  assert.deepEqual(r.duplicates, ["A1"]);
});

test("serial lines: empty input gives nothing", () => {
  assert.deepEqual(parseSerialLines("  \n\n").serials, []);
});

test("csv: quotes, commas, empty cells, BOM and CRLF", () => {
  const csv = toCsv([["a", "b,c", null], [1, 'say "hi"', undefined]]);
  assert.equal(csv, '\uFEFFa,"b,c",\r\n1,"say ""hi""",\r\n');
});

test("csv: text that starts like a spreadsheet formula is neutralized", () => {
  for (const bad of ["=SUM(A1)", "+1", "-1", "@cmd"]) {
    assert.ok(toCsv([[bad]]).includes(`'${bad}`), bad);
  }
  assert.ok(toCsv([[-5]]).includes("-5"), "real numbers are untouched");
});

test("csv: Indian Standard Time stamp", () => {
  assert.equal(istStamp(new Date("2026-10-02T09:00:00Z")), "2026-10-02 14:30");
});

test("academic year runs July to June", () => {
  assert.equal(currentAcademicYear(new Date(2026, 9, 2)), "2026-27");
  assert.equal(currentAcademicYear(new Date(2026, 6, 1)), "2026-27");
  assert.equal(currentAcademicYear(new Date(2027, 2, 1)), "2026-27");
  assert.equal(currentAcademicYear(new Date(2026, 5, 30)), "2025-26");
  assert.equal(currentAcademicYear(new Date(2099, 11, 31)), "2099-00");
});

test("date input value", () => {
  assert.equal(toDateInput(new Date("2026-10-02T00:00:00Z")), "2026-10-02");
  assert.equal(toDateInput(null), "");
});

test("permissions: volunteer can add records but nothing else", () => {
  assert.equal(can("VOLUNTEER", "records:create"), true);
  for (const p of ["records:edit", "records:delete", "catalogue:manage", "audit:view", "records:export", "accounts:manage"] as const) {
    assert.equal(can("VOLUNTEER", p), false, p);
  }
});

test("permissions: officers have full record access; only chair and vice chair manage accounts", () => {
  for (const role of ["CHAIR", "VICE_CHAIR", "TREASURER", "SECRETARY"] as const) {
    for (const p of ["records:create", "records:edit", "records:delete", "catalogue:manage", "audit:view", "records:export"] as const) {
      assert.equal(can(role, p), true, `${role} ${p}`);
    }
  }
  assert.equal(can("CHAIR", "accounts:manage"), true);
  assert.equal(can("VICE_CHAIR", "accounts:manage"), true);
  assert.equal(can("TREASURER", "accounts:manage"), false);
  assert.equal(can("SECRETARY", "accounts:manage"), false);
});

test("every role has a label", () => {
  assert.deepEqual(Object.keys(ROLE_LABELS).sort(), ["CHAIR", "SECRETARY", "TREASURER", "VICE_CHAIR", "VOLUNTEER"]);
});
