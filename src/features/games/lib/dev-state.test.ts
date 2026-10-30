import { describe, expect, it } from "vitest";
import { CLUE_NUMBERS, GAME_DAYS } from "@/entities/game-schedule";
import {
  DEV_SCENARIO_IDS,
  DEV_SCENARIOS,
  type DevGame,
  type DevScenarioId,
  devScenarioSteps,
} from "./dev-state";
import { clueDay } from "./game-clues";

const scenarios = DEV_SCENARIO_IDS.map((id) => ({ id, ...DEV_SCENARIOS[id] }));
const games = scenarios.flatMap(({ id, game }) => (game ? [{ id, game }] : []));

const cluesOut = (game: DevGame) =>
  game.outcome === "revealed"
    ? CLUE_NUMBERS.length
    : CLUE_NUMBERS.filter((number) => clueDay(number) < game.day).length;

describe("DEV_SCENARIOS", () => {
  it("never seeds a day where a clue or the reveal lands at 09:00, so any hour looks the same", () => {
    const boundaries = [...CLUE_NUMBERS.map(clueDay), GAME_DAYS];
    for (const { game } of games) {
      if (game.outcome === "revealed") {
        expect(game.day).toBe(GAME_DAYS + 1);
      } else {
        expect(game.day).toBeGreaterThanOrEqual(1);
        expect(game.day).toBeLessThan(GAME_DAYS);
        expect(boundaries).not.toContain(game.day);
      }
    }
  });

  it("never reads a clue that is not out yet", () => {
    for (const { game } of games) {
      expect(game.lastReadClue).toBeLessThanOrEqual(cluesOut(game));
    }
  });

  it("never finds the welcomer with an empty album", () => {
    for (const { game } of games.filter(({ game }) => game.as === "player")) {
      if (game.outcome === "found") expect(game.fresh).toBe(false);
    }
  });

  it("keeps a player's own card empty and fills the welcomer's", () => {
    for (const { game, cardFilled } of scenarios) {
      if (game?.as === "player") expect(cardFilled).toBe(false);
      if (game?.as === "welcomer") expect(cardFilled).toBe(true);
    }
  });

  it("never seeds the same state twice", () => {
    const seeds = scenarios.map(({ game, cardFilled }) => JSON.stringify({ game, cardFilled }));
    expect(new Set(seeds).size).toBe(seeds.length);
  });

  it("gives each scenario its own path, and a state either all stages or one scenario", () => {
    const paths = scenarios.map(({ role, state, stage }) => [role, state, stage].join("/"));
    expect(new Set(paths).size).toBe(paths.length);
    for (const { role, state } of scenarios) {
      const siblings = scenarios.filter((other) => other.role === role && other.state === state);
      expect(siblings.length === 1 || siblings.every(({ stage }) => stage)).toBe(true);
    }
  });

  it("lands each person where they play, welcome or edit their card", () => {
    for (const { role, game, landing } of scenarios) {
      if (game?.as === "player") expect(role).toBe("Player");
      if (game?.as === "player") expect(landing).toMatch(/^\/play/);
      if (game?.as === "welcomer") expect(role).toBe("Teammate");
      if (game?.as === "welcomer") expect(landing).toBe("/welcomer");
      if (!game) expect(landing).toBe("/card");
    }
  });
});

describe("devScenarioSteps", () => {
  const labelsOf = (id: DevScenarioId) =>
    devScenarioSteps(id).map(({ step, value, options }) => ({
      step,
      value,
      options: options.map(({ label }) => label),
    }));

  it("walks a playing day through role, state and stage", () => {
    expect(labelsOf("playing-day-7")).toEqual([
      { step: "role", value: "Player", options: ["Player", "Teammate"] },
      {
        step: "state",
        value: "Playing",
        options: ["Welcome tour", "Playing", "Found", "Time’s up"],
      },
      {
        step: "stage",
        value: "Day 7",
        options: ["Day 2", "Day 4", "Day 7", "Day 10", "Day 13"],
      },
    ]);
  });

  it("stops at the state when it has no stages", () => {
    expect(devScenarioSteps("found").map(({ step }) => step)).toEqual(["role", "state"]);
  });

  it("leads each pill to the first scenario that matches it", () => {
    const [role, state] = devScenarioSteps("found");
    expect(role?.options.find(({ label }) => label === "Teammate")?.id).toBe(
      "teammate-first-visit",
    );
    expect(state?.options.find(({ label }) => label === "Playing")?.id).toBe("playing-day-2");
  });
});
