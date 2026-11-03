type ClueAccessInput = {
  number: number;
  /** They are the welcomer of a started, running mission. */
  welcoming: boolean;
};

/**
 * What a teammate may do with their own clue: write it freely, until they welcome a started
 * mission; then it is locked, so the player never meets a clue that moved. Clue 1 is generated.
 */
export function welcomerClueAccess({ number, welcoming }: ClueAccessInput) {
  if (number === 1) return { editable: false, locked: false };
  return { editable: !welcoming, locked: welcoming };
}
