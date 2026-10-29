/** What each clue is for, shown where a teammate writes it. */
export const CLUE_HINTS: Record<
  1 | 2 | 3 | 4,
  { heading: string; hint: string; placeholder: string }
> = {
  1: {
    heading: "Clue 1 is your team.",
    hint: "We add it for you. You write the next three.",
    placeholder: "Add your team to your sticker and it shows up here.",
  },
  2: {
    heading: "Start broad.",
    hint: "It should fit a few people in your team.",
    placeholder: "Coffee or tea? Morning or night?",
  },
  3: {
    heading: "Narrow it down.",
    hint: "Two or three people should still fit.",
    placeholder: "A hobby, a habit, a place",
  },
  4: {
    heading: "The giveaway.",
    hint: "Make it point at you.",
    placeholder: "Something only you would say",
  },
};
