/** Hand-stuck angles, repeated down the album. */
const RESTING_ANGLES = [-2, 1.5, -1, 2, -1.5, 1];

/** A sticker's resting angle, by its place in the whole album so a filter never twists it. */
export const restingRotation = (albumIndex: number): number =>
  RESTING_ANGLES[albumIndex % RESTING_ANGLES.length] ?? 0;
