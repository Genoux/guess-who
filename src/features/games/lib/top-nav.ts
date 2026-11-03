import { ROUTES } from "@/shared/config/routes";

export type NavPage = "album" | "mission" | "card" | "clues" | "welcomer" | "admin";

export type TopNavState = {
  /** The viewer has a mission in any state. */
  hasMission: boolean;
  /** A clue landed that the player has not opened. */
  hasNewClue: boolean;
  admin: boolean;
  /** They welcome a started active mission. */
  welcomer: boolean;
  /** A new hire: My card and My clues are closed until their mission is done, and with no mission there is nothing to open. */
  locked: boolean;
};

export type TopNavData = TopNavState & {
  /** The n / total count shown to someone with a mission. */
  collectedCount: number;
  total: number;
};

type TabLink = { href: string; label: string; current: boolean; badge?: string };

/** Album, Mission when there is one, My card, My clues, Welcomer while welcoming, People for admins: at most six. */
export function topNavTabs(
  { hasMission, hasNewClue, welcomer, admin, locked }: TopNavState,
  current: NavPage,
): TabLink[] {
  const tab = (page: NavPage, href: string, label: string, badge?: string): TabLink => ({
    href,
    label,
    current: current === page,
    badge,
  });
  return [
    // A new hire with no mission has nothing to open: no Album either.
    ...(locked && !hasMission ? [] : [tab("album", ROUTES.play, "Album")]),
    ...(hasMission
      ? [tab("mission", ROUTES.playMission, "Mission", hasNewClue ? "New clue" : undefined)]
      : []),
    ...(locked
      ? []
      : [tab("card", ROUTES.card, "My card"), tab("clues", ROUTES.clues, "My clues")]),
    ...(welcomer ? [tab("welcomer", ROUTES.welcomer, "Welcomer")] : []),
    ...(admin ? [tab("admin", ROUTES.admin, "People")] : []),
  ];
}
