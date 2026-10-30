/**
 * The game's teams: each groups Deel departments, with the entity in brackets (IB, CM, CA, AAG).
 * Deel's names are exact strings, suffix included. The teams table is seeded from this list.
 */
export const TEAM_DEFINITIONS = [
  {
    name: "Creative",
    color: "#46BDF0",
    tint: "#B5E5F9",
    deelDepartments: [
      "Design (IB)",
      "Video (IB)",
      "UGC (IB)",
      "Brand (IB)",
      "Performance Creative (IB)",
      "Performance Creative LT (IB)",
      "Production (CM)",
      "Production (CA)",
      "Post-Production (CM)",
    ],
  },
  {
    name: "Strategy",
    color: "#157428",
    tint: "#A1C8A9",
    deelDepartments: ["Creative Strategy (IB)", "Creative Strategy (CM)"],
  },
  {
    name: "Client Services",
    color: "#9B8CE8",
    tint: "#DAD3F7",
    deelDepartments: [
      "Account Management (IB)",
      "Account Management (CM)",
      "Project Management (IB)",
      "Project Management (CM)",
      "Client Success LT (IB)",
      "Client Delivery (AAG)",
      "Quality Assurance (IB)",
      "Capacity Planning (IB)",
      "Retention (CA)",
    ],
  },
  {
    name: "Talent",
    color: "#FF97AB",
    tint: "#FFD5DD",
    deelDepartments: ["Influencer Marketing (IB)", "Talent (CM)"],
  },
  {
    name: "Paid & Search",
    formerName: "Paid",
    color: "#FFC592",
    tint: "#FFE8D3",
    deelDepartments: ["Paid Media (IB)", "SEO (IB)", "Link Building (IB)", "Search LT (IB)"],
  },
  {
    name: "Sales",
    color: "#C2415A",
    tint: "#EBB4BF",
    deelDepartments: ["Sales (IB)", "Sales LT (IB)", "Sales Ops (IB)", "Go To Market (AAG)"],
  },
  {
    name: "Ops",
    color: "#95B9AD",
    tint: "#D5E3DE",
    deelDepartments: [
      "Business Operations (IB)",
      "Operations (CM)",
      "Operations (CA)",
      "Shared Services (AAG)",
      "Accounting (IB)",
      "FP&A (IB)",
      "Finance LT (IB)",
      "People & Talent (IB)",
      "People Strategy (IB)",
      "Talent Acquisition (IB)",
      "Management (IB)",
      "Management (CM)",
      "Management (CA)",
      "Management (AAG)",
      "Content Allies",
    ],
  },
  {
    name: "Freelancers",
    color: "#A67C52",
    tint: "#E3D2BE",
    deelDepartments: ["Freelancers Pod (IB)"],
  },
] as const;

export type TeamName = (typeof TEAM_DEFINITIONS)[number]["name"];

const TEAM_BY_DEPARTMENT = new Map<string, TeamName>(
  TEAM_DEFINITIONS.flatMap(({ name, deelDepartments }) =>
    deelDepartments.map((department): [string, TeamName] => [department, name]),
  ),
);

/** The game team of a Deel department, matched exactly; null for one we do not know. */
export function teamForDeelDepartment(department: string): TeamName | null {
  return TEAM_BY_DEPARTMENT.get(department) ?? null;
}
