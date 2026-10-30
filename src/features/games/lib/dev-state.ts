import { ROUTES } from "@/shared/config/routes";

export type DevGame = {
  /** The tester plays the mission, or secretly welcomes the seeded player Léa. */
  as: "player" | "welcomer";
  /** Today's game day; day 15 is past the day-14 reveal. */
  day: number;
  outcome: "active" | "found" | "revealed";
  lastReadClue: number;
  /** An empty album instead of 5 stickers, 2 maybes and 1 ruled out. */
  fresh: boolean;
};

type DevScenario = {
  role: "Player" | "Teammate";
  state: string;
  stage?: string;
  hint: string;
  landing: (typeof ROUTES)[keyof typeof ROUTES];
  game: DevGame | null;
  cardFilled: boolean;
};

const playing = (game: Partial<DevGame>): DevGame => ({
  as: "player",
  day: 7,
  outcome: "active",
  lastReadClue: 0,
  fresh: false,
  ...game,
});

const welcoming = (game: Partial<DevGame>): DevGame => ({
  as: "welcomer",
  day: 7,
  outcome: "active",
  lastReadClue: 0,
  fresh: true,
  ...game,
});

/**
 * Dev-only: one real situation per entry, seeded at its start; the tester plays the rest through
 * the UI. Days avoid 3, 6, 9, 12 and 14, where something lands at 09:00, so the hour never matters.
 */
const SCENARIOS = {
  "welcome-tour": {
    role: "Player",
    state: "Welcome tour",
    hint: "First visit: the tour, then the mission.",
    landing: ROUTES.playWelcome,
    game: playing({ day: 1, fresh: true }),
    cardFilled: false,
  },
  "playing-day-2": {
    role: "Player",
    state: "Playing",
    stage: "Day 2",
    hint: "No clue out yet. 5 stickers, 2 maybes, 1 ruled out.",
    landing: ROUTES.play,
    game: playing({ day: 2 }),
    cardFilled: false,
  },
  "playing-day-4": {
    role: "Player",
    state: "Playing",
    stage: "Day 4",
    hint: "Clue 1, the welcomer's team, just landed.",
    landing: ROUTES.play,
    game: playing({ day: 4 }),
    cardFilled: false,
  },
  "playing-day-7": {
    role: "Player",
    state: "Playing",
    stage: "Day 7",
    hint: "Clue 2 just landed.",
    landing: ROUTES.play,
    game: playing({ day: 7, lastReadClue: 1 }),
    cardFilled: false,
  },
  "playing-day-10": {
    role: "Player",
    state: "Playing",
    stage: "Day 10",
    hint: "Clue 3 just landed.",
    landing: ROUTES.play,
    game: playing({ day: 10, lastReadClue: 2 }),
    cardFilled: false,
  },
  "playing-day-13": {
    role: "Player",
    state: "Playing",
    stage: "Day 13",
    hint: "Clue 4 just landed; the reveal is tomorrow.",
    landing: ROUTES.play,
    game: playing({ day: 13, lastReadClue: 3 }),
    cardFilled: false,
  },
  found: {
    role: "Player",
    state: "Found",
    hint: "Guessed right on day 10 with 3 clues. Their own sticker comes next.",
    landing: ROUTES.playMission,
    game: playing({ day: 10, lastReadClue: 3, outcome: "found" }),
    cardFilled: false,
  },
  "times-up": {
    role: "Player",
    state: "Time’s up",
    hint: "Day 14 passed unfound. The reveal plays once.",
    landing: ROUTES.playMission,
    game: playing({ day: 15, lastReadClue: 4, outcome: "revealed" }),
    cardFilled: false,
  },
  "teammate-first-visit": {
    role: "Teammate",
    state: "First visit",
    hint: "No mission, empty sticker card.",
    landing: ROUTES.card,
    game: null,
    cardFilled: false,
  },
  "teammate-card-filled": {
    role: "Teammate",
    state: "Card filled",
    hint: "No mission, back to edit their sticker.",
    landing: ROUTES.card,
    game: null,
    cardFilled: true,
  },
  "welcomer-picked": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Just picked",
    hint: "Day 2. Their three clues are locked in.",
    landing: ROUTES.welcomer,
    game: welcoming({ day: 2 }),
    cardFilled: true,
  },
  "welcomer-set": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Clues set",
    hint: "Day 7, waiting to be found.",
    landing: ROUTES.welcomer,
    game: welcoming({ day: 7 }),
    cardFilled: true,
  },
  "welcomer-found": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Found",
    hint: "Léa guessed them on day 10.",
    landing: ROUTES.welcomer,
    game: welcoming({ day: 10, outcome: "found" }),
    cardFilled: true,
  },
  "welcomer-times-up": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Time’s up",
    hint: "Day 14 passed, so they were revealed.",
    landing: ROUTES.welcomer,
    game: welcoming({ day: 15, outcome: "revealed" }),
    cardFilled: true,
  },
} satisfies Record<string, DevScenario>;

export type DevScenarioId = keyof typeof SCENARIOS;

export const DEV_SCENARIOS: Record<DevScenarioId, DevScenario> = SCENARIOS;

// Object.keys is typed string[]; the keys are exactly the ids, in display order.
export const DEV_SCENARIO_IDS = Object.keys(SCENARIOS) as [DevScenarioId, ...DevScenarioId[]];

const STEPS = ["role", "state", "stage"] as const;

/**
 * The pills for each step of the picker, with the selected one; a pill leads to the first
 * scenario matching it and every earlier step.
 */
export function devScenarioSteps(id: DevScenarioId) {
  const selected = DEV_SCENARIOS[id];
  return STEPS.flatMap((step, depth) => {
    const value = selected[step];
    if (value === undefined) return [];
    const options = DEV_SCENARIO_IDS.filter((candidate) =>
      STEPS.slice(0, depth).every(
        (earlier) => DEV_SCENARIOS[candidate][earlier] === selected[earlier],
      ),
    )
      .flatMap((candidate) => {
        const label = DEV_SCENARIOS[candidate][step];
        return label === undefined ? [] : [{ label, id: candidate }];
      })
      .filter(
        (option, index, all) => all.findIndex(({ label }) => label === option.label) === index,
      );
    return [{ step, value, options }];
  });
}

/** The widest top bar, for the dev pages: a mission, an admin and a welcomer in one. */
export const DEV_TOP_NAV = {
  hasMission: true,
  hasNewClue: false,
  collectedCount: 5,
  total: 19,
  admin: true,
  welcomer: true,
  locked: false,
};
