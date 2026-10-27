import { ROUTES } from "@/shared/config/routes";

export type DevGame = {
  /** The tester plays the game, or secretly welcomes the seeded new hire Léa. */
  as: "player" | "welcomer";
  /** Today's game day; day 15 is past the day-14 reveal. */
  day: number;
  outcome: "active" | "found" | "revealed";
  /** Clues 2 to 4 the welcomer wrote, in order. */
  cluesWritten: number;
  lastReadClue: number;
  /** An empty album instead of 5 stickers, 2 maybes and 1 ruled out. */
  fresh: boolean;
  introSeen: boolean;
};

type DevScenario = {
  role: "New hire" | "Teammate";
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
  cluesWritten: 3,
  lastReadClue: 0,
  fresh: false,
  introSeen: true,
  ...game,
});

const welcoming = (game: Partial<DevGame>): DevGame => ({
  as: "welcomer",
  day: 7,
  outcome: "active",
  cluesWritten: 3,
  lastReadClue: 0,
  fresh: true,
  introSeen: true,
  ...game,
});

/**
 * Dev-only: one real situation per entry, seeded at its start; the tester plays the rest through
 * the UI. Days avoid 3, 6, 9, 12 and 14, where something lands at 09:00, so the hour never matters.
 */
const SCENARIOS = {
  "welcome-tour": {
    role: "New hire",
    state: "Welcome tour",
    hint: "Day 1, first visit: the tour, then an empty album.",
    landing: ROUTES.playWelcome,
    game: playing({ day: 1, fresh: true, introSeen: false }),
    cardFilled: false,
  },
  "playing-day-2": {
    role: "New hire",
    state: "Playing",
    stage: "Day 2",
    hint: "No clue out yet. 5 stickers, 2 maybes, 1 ruled out.",
    landing: ROUTES.play,
    game: playing({ day: 2 }),
    cardFilled: false,
  },
  "playing-day-4": {
    role: "New hire",
    state: "Playing",
    stage: "Day 4",
    hint: "Clue 1, the welcomer's team, just landed.",
    landing: ROUTES.play,
    game: playing({ day: 4 }),
    cardFilled: false,
  },
  "playing-day-7": {
    role: "New hire",
    state: "Playing",
    stage: "Day 7",
    hint: "Clue 2 just landed.",
    landing: ROUTES.play,
    game: playing({ day: 7, lastReadClue: 1 }),
    cardFilled: false,
  },
  "playing-day-10": {
    role: "New hire",
    state: "Playing",
    stage: "Day 10",
    hint: "Clue 3 just landed.",
    landing: ROUTES.play,
    game: playing({ day: 10, lastReadClue: 2 }),
    cardFilled: false,
  },
  "playing-day-13": {
    role: "New hire",
    state: "Playing",
    stage: "Day 13",
    hint: "Clue 4 just landed; the reveal is tomorrow.",
    landing: ROUTES.play,
    game: playing({ day: 13, lastReadClue: 3 }),
    cardFilled: false,
  },
  "playing-skipped-clues": {
    role: "New hire",
    state: "Playing",
    stage: "Skipped clues",
    hint: "Day 13. The welcomer only wrote clue 2, so clues 3 and 4 show as missing.",
    landing: ROUTES.playMission,
    game: playing({ day: 13, lastReadClue: 4, cluesWritten: 1 }),
    cardFilled: false,
  },
  found: {
    role: "New hire",
    state: "Found",
    hint: "Guessed right on day 10 with 3 clues. Their own sticker comes next.",
    landing: ROUTES.playMission,
    game: playing({ day: 10, lastReadClue: 3, outcome: "found" }),
    cardFilled: false,
  },
  "times-up": {
    role: "New hire",
    state: "Time’s up",
    hint: "Day 14 passed unfound. The reveal plays once.",
    landing: ROUTES.playMission,
    game: playing({ day: 15, lastReadClue: 4, outcome: "revealed" }),
    cardFilled: false,
  },
  "teammate-first-visit": {
    role: "Teammate",
    state: "First visit",
    hint: "No game, empty sticker card.",
    landing: ROUTES.card,
    game: null,
    cardFilled: false,
  },
  "teammate-card-filled": {
    role: "Teammate",
    state: "Card filled",
    hint: "No game, back to edit their sticker.",
    landing: ROUTES.card,
    game: null,
    cardFilled: true,
  },
  "welcomer-picked": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Just picked",
    hint: "Day 2. No clues written yet.",
    landing: ROUTES.welcomer,
    game: welcoming({ day: 2, cluesWritten: 0 }),
    cardFilled: true,
  },
  "welcomer-late": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Running late",
    hint: "Day 7. Clue 2 landed unwritten; clues 3 and 4 are still open.",
    landing: ROUTES.welcomer,
    game: welcoming({ day: 7, cluesWritten: 0 }),
    cardFilled: true,
  },
  "welcomer-set": {
    role: "Teammate",
    state: "Secret welcomer",
    stage: "Clues set",
    hint: "Day 7. All three written, waiting to be found.",
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
