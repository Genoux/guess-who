import { describe, expect, it } from "vitest";
import { linkedPersonId } from "./seed-demo-personas";

const rows = [
  { id: "p_player", email: "player+clerk_test@inbeat.agency", clerkUserId: null },
  { id: "p_done", email: "done+clerk_test@inbeat.agency", clerkUserId: "user_done" },
];

describe("linkedPersonId", () => {
  it("links a persona's game to the people row that already exists for their email", () => {
    expect(linkedPersonId(rows, "done+clerk_test@inbeat.agency")).toBe("p_done");
  });

  it("links a row that was pre-created and has not signed in yet too, so nothing waits for a sign-in", () => {
    expect(linkedPersonId(rows, "player+clerk_test@inbeat.agency")).toBe("p_player");
  });

  it("leaves the game unlinked while nobody has a row for that email", () => {
    expect(linkedPersonId(rows, "newhire+clerk_test@inbeat.agency")).toBeNull();
  });
});
