// Motion curves for the game layer. `--ease-game` in game-theme.css mirrors GAME_EASE for CSS
// transitions; change both together.
export const GAME_EASE = [0.2, 0.8, 0.2, 1] as const;

/** Sticker and clue flip: a slow, settling turn. */
export const FLIP_EASE = [0.3, 0.7, 0.2, 1] as const;

/** Stamps landing: a quick overshoot. */
export const STAMP_EASE = [0.2, 0.9, 0.3, 1.4] as const;
