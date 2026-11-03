"use server";

import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { db } from "@/shared/lib/db";
import { DEV_SCENARIOS } from "../lib/dev-state";
import { devStateSchema } from "../schemas";
import { authorizeDemoTester } from "../server/authorize-demo-tester";
import {
  clearPersonGames,
  DEMO_WELCOMER_EMAIL,
  seedDemoGame,
  setPersonCard,
} from "../server/seed-demo-game";

/** Dev-only: puts the signed-in tester's games and card into the scenario the dev panel picked. */
export const applyDevState = action({
  name: "games.applyDevState",
  schema: devStateSchema,
  authorize: authorizeDemoTester,
  run: async (input, tester) => {
    const { game, cardFilled } = DEV_SCENARIOS[input.scenario];
    await clearPersonGames(db, tester.email);
    if (game) {
      const { as, ...seed } = game;
      await seedDemoGame(db, {
        ...(as === "player" ? { player: tester.email } : { asWelcomer: tester.email }),
        welcomer: DEMO_WELCOMER_EMAIL,
        ...seed,
      });
    }
    await setPersonCard(db, tester.email, cardFilled);
    return ok();
  },
  revalidate: () => [
    ROUTES.home,
    ROUTES.play,
    ROUTES.playMission,
    ROUTES.playWelcome,
    ROUTES.welcomer,
    ROUTES.clues,
    ROUTES.card,
  ],
});
