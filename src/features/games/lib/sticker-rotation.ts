/** Hand-stuck angles, repeated down the album. */
const RESTING_ANGLES = [-2, 1.5, -1, 2, -1.5, 1];
const DROP_ANGLES = [-1.5, 1, -0.5, 1.5, -1, 0.5, 1, -1];

/** A sticker's resting angle, by its place in the whole album so a filter never twists it. */
export const restingRotation = (albumIndex: number): number =>
  RESTING_ANGLES[albumIndex % RESTING_ANGLES.length] ?? 0;

/** The angle a sticker lands with when it is dropped on the table; steady for the same sticker. */
export const dropRotation = (albumIndex: number): number =>
  DROP_ANGLES[albumIndex % DROP_ANGLES.length] ?? 0;
