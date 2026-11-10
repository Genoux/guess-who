/**
 * The teams a teammate picks from on their card. The teams table is seeded from this list; a
 * name change goes through `formerName` so the row, and the people on it, stay.
 */
export const TEAM_DEFINITIONS = [
  {
    name: "Creative",
    color: "#46BDF0",
    tint: "#B5E5F9",
  },
  {
    name: "UGC",
    color: "#A67C52",
    tint: "#E3D2BE",
  },
  {
    name: "Strategy",
    color: "#157428",
    tint: "#A1C8A9",
  },
  {
    name: "Client Services",
    color: "#9B8CE8",
    tint: "#DAD3F7",
  },
  {
    name: "Talent",
    color: "#FF97AB",
    tint: "#FFD5DD",
  },
  {
    name: "Paid & Search",
    formerName: "Paid",
    color: "#FFC592",
    tint: "#FFE8D3",
  },
  {
    name: "Sales",
    color: "#C2415A",
    tint: "#EBB4BF",
  },
  {
    name: "Ops",
    color: "#95B9AD",
    tint: "#D5E3DE",
  },
  {
    name: "People",
    color: "#2A9D8F",
    tint: "#B3DED9",
  },
] as const;

export type TeamName = (typeof TEAM_DEFINITIONS)[number]["name"];
