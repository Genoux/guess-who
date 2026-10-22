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

/** Cards that stay slide to their new cell without overshoot. */
export const SLIDE = { type: "spring", stiffness: 300, damping: 34 } as const;

/** A card set down on the table: a short settle from just above, critically damped, no bounce. */
export const DROP = { type: "spring", stiffness: 400, damping: 40 } as const;
export const DROP_FROM = { y: -12, scale: 1.03 } as const;

export const DROP_STAGGER_S = 0.025;
export const LEAVE_S = 0.15;

/** The open card is the album's small card zoomed to the large card's size (300 / 176). */
export const OPEN_SCALE = 1.7;
