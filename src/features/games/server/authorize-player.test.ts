import { AppError, isAppError } from "@inbeat/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Game } from "../types";

const mocks = vi.hoisted(() => ({
  authorizeMember: vi.fn(),
  findPersonByClerkUserId: vi.fn(),
  findLatestPlayerGame: vi.fn(),
  findLatestWelcomerGame: vi.fn(),
  finalizeExpiredGameRecord: vi.fn(async (game: unknown) => game),
}));
vi.mock("@/shared/lib/auth", () => ({ authorizeMember: mocks.authorizeMember }));
vi.mock("@/shared/lib/person-records", () => ({
  findPersonByClerkUserId: mocks.findPersonByClerkUserId,
}));
vi.mock("./game-records", () => ({
  findLatestPlayerGame: mocks.findLatestPlayerGame,
  findLatestWelcomerGame: mocks.findLatestWelcomerGame,
}));
vi.mock("./finalize-expired-game-record", () => ({
  finalizeExpiredGameRecord: mocks.finalizeExpiredGameRecord,
}));

import { authorizePlayer } from "./authorize-player";
import { authorizeWelcomer } from "./authorize-welcomer";

const game = {
  id: "game_1",
  playerPersonId: "player",
  welcomerPersonId: "welcomer",
  status: "active",
} as Game;

const signInAs = (personId: string) => {
  mocks.authorizeMember.mockResolvedValue({ userId: `user_${personId}`, role: "member" });
  mocks.findPersonByClerkUserId.mockResolvedValue({ id: personId });
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findLatestPlayerGame.mockResolvedValue(game);
  mocks.findLatestWelcomerGame.mockResolvedValue(game);
});

describe("authorizePlayer", () => {
  it("returns the player with their own game, ended if day 14 passed", async () => {
    signInAs("player");
    await expect(authorizePlayer()).resolves.toMatchObject({ personId: "player", game });
    expect(mocks.findLatestPlayerGame).toHaveBeenCalledWith("player");
    expect(mocks.finalizeExpiredGameRecord).toHaveBeenCalledWith(game, expect.any(Date));
  });

  it("refuses a signed-out viewer", async () => {
    mocks.authorizeMember.mockRejectedValue(new AppError("auth", "no session"));
    await expect(authorizePlayer()).rejects.toSatisfy((err) => isAppError(err, "auth"));
  });

  it("forbids a viewer without a game", async () => {
    signInAs("teammate");
    mocks.findLatestPlayerGame.mockResolvedValue(undefined);
    await expect(authorizePlayer()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });

  it("forbids a viewer without a person row", async () => {
    signInAs("player");
    mocks.findPersonByClerkUserId.mockResolvedValue(undefined);
    await expect(authorizePlayer()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });
});

describe("authorizeWelcomer", () => {
  it("returns the welcomer with the game they welcome", async () => {
    signInAs("welcomer");
    await expect(authorizeWelcomer()).resolves.toMatchObject({ personId: "welcomer", game });
    expect(mocks.findLatestWelcomerGame).toHaveBeenCalledWith("welcomer");
  });

  it("forbids someone who welcomes no game", async () => {
    signInAs("teammate");
    mocks.findLatestWelcomerGame.mockResolvedValue(undefined);
    await expect(authorizeWelcomer()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });

  it("forbids a game that is not theirs", async () => {
    signInAs("teammate");
    await expect(authorizeWelcomer()).rejects.toSatisfy((err) => isAppError(err, "forbidden"));
  });
});
