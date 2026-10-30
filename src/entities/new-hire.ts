export const LOCKED_MESSAGE = "Finish your mission first.";

/**
 * The rite of passage: a new hire earns their card and clues by playing, so while `new_hire` is
 * set they are closed. The flag clears when the mission ends, found or revealed. One rule for the
 * tabs, the pages and the actions; teammates who are not new hires are never locked.
 */
export const isLockedNewHire = ({ newHire }: { newHire: boolean }) => newHire;
