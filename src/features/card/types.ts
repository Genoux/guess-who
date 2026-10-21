/** A teammate fills in their card; a new hire whose game ended makes theirs to join the album. */
export type CardAudience = "teammate" | "new-hire";

export type CardTeam = { id: string; name: string; color: string; tint: string };

export type CardFields = { teamId: string; location: string; fact: string; ask: string };

export type MyCard = {
  name: string;
  stickerNumber: number;
  audience: CardAudience;
  fields: CardFields;
  teams: CardTeam[];
};
