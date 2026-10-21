import { describe, expect, it } from "vitest";
import { canSeeGameSecrets } from "./can-see-game-secrets";

const game = { playerPersonId: "player", welcomerPersonId: "welcomer" };

describe("canSeeGameSecrets", () => {
  it("lets the welcomer see them", () => {
    expect(canSeeGameSecrets(game, { personId: "welcomer", role: "member" })).toBe(true);
  });

  it("lets an admin who is not the player see them", () => {
    expect(canSeeGameSecrets(game, { personId: "admin", role: "admin" })).toBe(true);
  });

  it.each(["member", "admin"] as const)("hides them from the player (%s)", (role) => {
    expect(canSeeGameSecrets(game, { personId: "player", role })).toBe(false);
  });

  it("hides them from other teammates", () => {
    expect(canSeeGameSecrets(game, { personId: "teammate", role: "member" })).toBe(false);
  });

  it("still hides them from teammates before the player signs in", () => {
    const unclaimed = { ...game, playerPersonId: null };
    expect(canSeeGameSecrets(unclaimed, { personId: "teammate", role: "member" })).toBe(false);
  });
});
