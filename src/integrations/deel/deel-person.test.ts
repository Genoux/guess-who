import { describe, expect, it } from "vitest";
import { deelPersonSchema, personalEmail, workEmail } from "./deel-person";

const rawPerson = {
  id: "seed-person-1",
  first_name: "Sam",
  last_name: "Seed",
  preferred_first_name: null,
  preferred_last_name: null,
  full_name: "Sam Seed",
  emails: [
    { type: "primary", value: "sam@gmail.example" },
    { type: "work", value: "sam@work.example" },
    { type: "personal", value: "sam@gmail.example" },
  ],
  hiring_status: "some_future_status",
  start_date: "2026-01-05",
  country: "CA",
  department: { id: "d1", name: "Design (IB)", extra: true },
  client_legal_entity: { id: "e1", name: "Seed Entity" },
  job_title: "ignored",
};

describe("deelPersonSchema", () => {
  it("reads the pinned fields and keeps an unknown hiring status", () => {
    const person = deelPersonSchema.parse(rawPerson);
    expect(person.hiring_status).toBe("some_future_status");
    expect(person.department?.name).toBe("Design (IB)");
    expect(person.client_legal_entity?.name).toBe("Seed Entity");
  });

  it("rejects a person without an id", () => {
    expect(deelPersonSchema.safeParse({ ...rawPerson, id: undefined }).success).toBe(false);
  });
});

describe("email helpers", () => {
  const person = deelPersonSchema.parse(rawPerson);

  it("finds the work and personal email by type", () => {
    expect(workEmail(person)).toBe("sam@work.example");
    expect(personalEmail(person)).toBe("sam@gmail.example");
  });

  it("returns null when the type is absent", () => {
    const withoutEmails = deelPersonSchema.parse({ ...rawPerson, emails: [] });
    expect(workEmail(withoutEmails)).toBeNull();
    expect(personalEmail(withoutEmails)).toBeNull();
  });
});
