// Opening: the card flies (FLIGHT_S) while the backdrop and its text fade in together.
// Closing: the card flies back at once while they fade out.
export const BACKDROP_FADE_S = 0.2;
// On opening, the card leaves its slot first with the album still in view, so the gap it leaves
// shows; the backdrop follows once it is about a third of the way out.
export const BACKDROP_DELAY_S = 0.1;
export const FLIGHT_S = 0.36;
export const CONTENT_FADE_S = 0.15;

// A short lift-off, then most of the travel early, then a long soft landing: it moves within a
// couple of frames of the click (an ease-in-out quart sat still for ~150ms and read as lag), yet
// still accelerates, where an ease-out or a spring starts at full speed and reads as flat.
export const FLIGHT = { duration: FLIGHT_S, ease: [0.45, 0, 0.1, 1] } as const;

export const CLEAR_S = 0.12;
export const DEAL = { duration: 0.24, ease: [0.2, 0, 0, 1] } as const;
export const DEAL_STAGGER_S = 0.04;
/** The most the deal may spread over, so a full album does not crawl. */
export const DEAL_BUDGET_S = 0.3;

/** The open card is the album's small card zoomed to the large card's size (300 / 176). */
export const OPEN_SCALE = 1.7;
