/** Resolves after `seconds`, the unit the motion files use. */
export const wait = (seconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
