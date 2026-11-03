import { describe, expect, it } from "vitest";
import { type DeelPerson, deelPersonSchema } from "./deel-person";
import { toRosterChange } from "./to-roster-change";

const person = (overrides: Record<string, unknown> = {}): DeelPerson =>
  deelPersonSchema.parse({
    id: "deel-1",
    first_name: "Samuel",
    last_name: "Seed",
    preferred_first_name: "Sam",
    emails: [
      { type: "work", value: " Sam@Work.Example " },
      { type: "personal", value: "sam@gmail.example" },
    ],
    hiring_status: "active",
    start_date: "2026-01-05",
    country: "CA",
    department: { id: "d1", name: "Design (IB)" },
    client_legal_entity: { id: "e1", name: "9434-1641 QUEBEC INC." },
    ...overrides,
  });

const NOW = new Date("2026-11-03T15:00:00Z");
const classify = (deelId: string, candidate: DeelPerson | null) =>
  toRosterChange(deelId, candidate, NOW);

describe("toRosterChange", () => {
  it("upserts an active person of a legal entity with the Deel-owned fields", () => {
    expect(classify("deel-1", person())).toEqual({
      kind: "upsert",
      person: {
        deelId: "deel-1",
        name: "Sam Seed",
        team: "Creative",
        location: "Canada",
        email: "sam@work.example",
        personalEmail: "sam@gmail.example",
        startDate: "2026-01-05",
      },
    });
  });

  it.each([
    "9434-1641 QUEBEC INC.",
    "9490-4943 Québec inc DBA Creative Milkshake",
    "9490-4943 quebec inc dba creative milkshake.",
    "CONTENT ALLIES, INC.",
    "Waving Banner, LLC",
  ])("treats %s as in scope", (name) => {
    expect(classify("deel-1", person({ client_legal_entity: { id: "x", name } })).kind).toBe(
      "upsert",
    );
  });

  it.each([
    ["another entity", { client_legal_entity: { id: "x", name: "Other Corp" } }],
    ["no entity", { client_legal_entity: null }],
  ])("ignores an active person with %s", (_label, overrides) => {
    expect(classify("deel-1", person(overrides))).toEqual({
      kind: "ignore",
      reason: "out of scope",
    });
  });

  it("removes an inactive person", () => {
    expect(classify("deel-1", person({ hiring_status: "inactive" }))).toEqual({
      kind: "remove",
      deelId: "deel-1",
    });
  });

  it.each([
    "termination_last_day",
    "last_day_of_work_local_date",
    "worker_termination_last_date_of_work",
  ])("removes someone with no active contract once %s has passed", (field) => {
    expect(
      classify("deel-1", person({ hiring_status: "no_active_contracts", [field]: "2026-11-02" })),
    ).toEqual({ kind: "remove", deelId: "deel-1" });
  });

  it("prefers termination_last_day over the other end dates", () => {
    const leaving = person({
      hiring_status: "no_active_contracts",
      termination_last_day: "2026-12-01",
      last_day_of_work_local_date: "2026-01-01",
    });
    expect(classify("deel-1", leaving)).toEqual({
      kind: "ignore",
      reason: "no active contract, end date not reached",
    });
  });

  it("keeps someone with no active contract whose end date is today or later (Montréal)", () => {
    for (const end of ["2026-11-03", "2026-11-30"]) {
      expect(
        classify(
          "deel-1",
          person({ hiring_status: "no_active_contracts", termination_last_day: end }),
        ),
      ).toMatchObject({ kind: "ignore" });
    }
  });

  it("keeps someone with no active contract and no end date", () => {
    expect(classify("deel-1", person({ hiring_status: "no_active_contracts" }))).toEqual({
      kind: "ignore",
      reason: "no active contract, no end date",
    });
  });

  it("removes a person Deel no longer knows", () => {
    expect(classify("deel-9", null)).toEqual({ kind: "remove", deelId: "deel-9" });
  });

  it.each(["onboarding", "offboarding", "pending_invite", "something_new"])(
    "keeps a person who is %s",
    (hiring_status) => {
      expect(classify("deel-1", person({ hiring_status }))).toEqual({
        kind: "ignore",
        reason: "not active or leaver",
      });
    },
  );

  it("maps an unmapped department to no team", () => {
    const change = classify("deel-1", person({ department: { id: "d", name: "Unknown" } }));
    expect(change).toMatchObject({ kind: "upsert", person: { team: null } });
  });

  it("stores the personal email as the email when there is no work email", () => {
    const change = classify(
      "deel-1",
      person({ emails: [{ type: "personal", value: "Sam@Gmail.example" }] }),
    );
    expect(change).toMatchObject({
      kind: "upsert",
      person: { email: "sam@gmail.example", personalEmail: null },
    });
  });

  it("leaves the personal email empty when it equals the work email", () => {
    const change = classify(
      "deel-1",
      person({
        emails: [
          { type: "work", value: "sam@x.example" },
          { type: "personal", value: "SAM@x.example" },
        ],
      }),
    );
    expect(change).toMatchObject({ person: { personalEmail: null } });
  });

  it("ignores an active person with no usable email", () => {
    expect(classify("deel-1", person({ emails: [{ type: "primary", value: "p@x" }] }))).toEqual({
      kind: "ignore",
      reason: "no email",
    });
  });

  it("falls back to first and last names, then the full name", () => {
    expect(classify("deel-1", person({ preferred_first_name: null }))).toMatchObject({
      person: { name: "Samuel Seed" },
    });
    expect(
      classify(
        "deel-1",
        person({
          preferred_first_name: null,
          first_name: null,
          last_name: null,
          full_name: "Full Name",
        }),
      ),
    ).toMatchObject({ person: { name: "Full Name" } });
  });

  it("ignores an active person with no name", () => {
    const change = classify(
      "deel-1",
      person({ preferred_first_name: null, first_name: null, last_name: null, full_name: null }),
    );
    expect(change).toEqual({ kind: "ignore", reason: "no name" });
  });

  it("leaves location and start date empty when Deel has none or garbage", () => {
    const change = classify("deel-1", person({ country: "??", start_date: "soon" }));
    expect(change).toMatchObject({ person: { location: null, startDate: null } });
  });
});
