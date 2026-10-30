import { describe, expect, it } from "vitest";
import { personSubline } from "./person-line";

describe("personSubline", () => {
  it("puts the email under a person's name", () => {
    expect(personSubline({ name: "Sam Taylor", email: "sam@inbeat.agency" })).toBe(
      "sam@inbeat.agency",
    );
  });

  it("says where they came from when the name is the email, as for an invite nobody signed in to", () => {
    expect(personSubline({ name: null, email: "kim@gmail.com" })).toBe("Invited by email");
  });
});
