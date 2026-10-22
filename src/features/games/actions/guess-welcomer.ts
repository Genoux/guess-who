"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { logger } from "@/shared/lib/logger";
import { rateLimiter } from "@/shared/lib/rate-limit";
import { guessWelcomerSchema } from "../schemas";
import { authorizePlayer } from "../server/authorize-player";
import { guessWelcomerRecord } from "../server/guess-welcomer-record";

export const guessWelcomer = action({
  name: "games.guessWelcomer",
  schema: guessWelcomerSchema,
  authorize: authorizePlayer,
  run: async ({ personId }, player) => {
    await rateLimiter.enforce(`guess:${player.personId}`, { limit: 10, window: "10 m" });
    const result = await guessWelcomerRecord({
      game: player.game,
      viewerPersonId: player.personId,
      personId,
      now: new Date(),
    });
    logger.info("welcomer guessed", { gameId: player.game.id, correct: result.correct });
    return ok(result);
  },
  revalidate: () => [ROUTES.play, ROUTES.playMission, ROUTES.playFound],
});
