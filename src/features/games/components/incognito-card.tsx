import { Sticker } from "@/shared/components/game/sticker";
import { TUTORIAL_WELCOMER } from "../lib/tutorial-cast";

// Ink with the shortlist yellow (--color-game-ink, --color-game-shortlist), so the card reads as the
// mission, not a teammate. Sticker colors are inline styles, so the hex values repeat the tokens.
const INCOGNITO_WELCOMER = { ...TUTORIAL_WELCOMER, tint: "#191910", tintInk: "#f9d317" };

/** The secret welcomer's card while they are still a mystery. */
export function IncognitoCard({ rot = 0 }: { rot?: number }) {
  return <Sticker person={INCOGNITO_WELCOMER} mode="locked" size="lg" rot={rot} />;
}
