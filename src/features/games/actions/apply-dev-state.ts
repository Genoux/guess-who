"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { ok } from "@inbeat/core/result";
import { action } from "@inbeat/next/action";
import { ROUTES } from "@/shared/config/routes";
import { db } from "@/shared/lib/db";
import { devFieldEnabled, normalizeDevState, seedDay } from "../lib/dev-state";
import { devStateSchema } from "../schemas";
import { authorizeDemoTester } from "../server/authorize-demo-tester";
import {
  clearPersonGames,
  DEMO_WELCOMER_EMAIL,
  seedDemoGame,
  setPersonCard,
} from "../server/seed-demo-game";

/** Dev-only: puts the signed-in tester's role, games and card into the state the dev panel set. */
export const applyDevState = action({
  name: "games.applyDevState",
  schema: devStateSchema,
  authorize: authorizeDemoTester,
  run: async (input, tester) => {
    const state = normalizeDevState(input);
    await clearPersonGames(db, tester.email);

    if (state.view !== "teammate") {
      const newHire = state.view === "new-hire";
      await seedDemoGame(db, {
        ...(newHire ? { player: tester.email } : { asWelcomer: tester.email }),
        welcomer: DEMO_WELCOMER_EMAIL,
        day: seedDay(state),
        fresh: !newHire || state.album === "empty",
        lastReadClue: newHire ? state.cluesRead : 0,
        outcome: state.outcome,
        introSeen: !newHire || state.introSeen,
        cluesWritten: state.cluesWritten,
      });
    }
    if (devFieldEnabled(state, "card")) {
      await setPersonCard(db, tester.email, state.card === "filled");
    }

    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(tester.userId, { publicMetadata: { role: state.role } });
    return ok();
  },
  revalidate: () => [
    ROUTES.home,
    ROUTES.play,
    ROUTES.playMission,
    ROUTES.playFound,
    ROUTES.playWelcome,
    ROUTES.welcomer,
    ROUTES.card,
    ROUTES.admin,
  ],
});
