import type { TeamName } from "@/entities/teams";

/** The fake teammates and sign-in personas the `--demo` seed builds. Plain data: no database here. */

const ascii = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const portraitSlug = (name: string) =>
  ascii(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const avatarUrlOf = (name: string) => `/demo/avatars/${portraitSlug(name)}.webp`;

export const demoCastEmail = (name: string) =>
  `${ascii(name).replace(/[^a-z0-9]+/g, ".")}@example.com`;

type CastMember = {
  name: string;
  team: TeamName;
  location: string;
  fact: string;
  ask: string;
  /** Clues 2 to 4. */
  clues: readonly [string, string, string];
};

const clues = (...lines: [string, string, string]) => lines;

export const DEMO_CAST: readonly CastMember[] = [
  {
    name: "Ana Souza",
    team: "Creative",
    location: "Lisbon",
    fact: "Bikes to every meeting, rain or not.",
    ask: "Learning the cello at 30",
    clues: clues(
      "Has never owned a car.",
      "Practises an instrument at 6 am.",
      "Plays it badly on purpose.",
    ),
  },
  {
    name: "Mateo Ruiz",
    team: "Creative",
    location: "Madrid",
    fact: "Owns more records than plates.",
    ask: "Why vinyl sounds better",
    clues: clues(
      "Lives with far too many records.",
      "Has a turntable older than the team.",
      "Argues about sound with strangers.",
    ),
  },
  {
    name: "Noor Haddad",
    team: "Creative",
    location: "Toronto",
    fact: "Won a pie-eating contest by accident.",
    ask: "The best bakery in any city",
    clues: clues(
      "Once won something by mistake.",
      "Rates bakeries in every city.",
      "Always has crumbs on the keyboard.",
    ),
  },
  {
    name: "Jonah Park",
    team: "Strategy",
    location: "Seoul",
    fact: "Tracks every meal since 2019.",
    ask: "Fantasy football spreadsheets",
    clues: clues(
      "Keeps a spreadsheet for everything.",
      "Knows what they ate in March 2021.",
      "Has a tab for the office lunch order.",
    ),
  },
  {
    name: "Ines Moreau",
    team: "Strategy",
    location: "Paris",
    fact: "Grew up above a cheese shop.",
    ask: "Natural wine, politely",
    clues: clues(
      "Grew up smelling of something strong.",
      "Has opinions on rinds.",
      "Can name a cheese by its crust.",
    ),
  },
  {
    name: "Sofia Rossi",
    team: "Strategy",
    location: "Lisbon",
    fact: "Once met a president by accident.",
    ask: "Board games",
    clues: clues(
      "Has a story about a very important door.",
      "Collects games with long rules.",
      "Never loses at Catan, allegedly.",
    ),
  },
  {
    name: "Maya Chen",
    team: "Client Services",
    location: "Montreal",
    fact: "Ran a marathon in a dinosaur costume.",
    ask: "My sourdough starter",
    clues: clues(
      "Has run far in a silly outfit.",
      "Feeds something that lives in a jar.",
      "Brings bread on Fridays.",
    ),
  },
  {
    name: "Ethan Kim",
    team: "Client Services",
    location: "New York",
    fact: "Played drums in a ska band.",
    ask: "Vinyl",
    clues: clues(
      "Used to be in a band that played fast.",
      "Taps rhythms on every desk.",
      "Owns a surprising number of checkered shirts.",
    ),
  },
  {
    name: "Ava Patel",
    team: "Talent",
    location: "London",
    fact: "Has a pet tortoise named Speedy.",
    ask: "Reptiles",
    clues: clues(
      "Has a very slow housemate.",
      "Posts photos of a shell.",
      "Never rushes, on principle.",
    ),
  },
  {
    name: "Hana Lee",
    team: "Talent",
    location: "Vancouver",
    fact: "Throws pots that come out wrong on purpose.",
    ask: "Ceramics that came out wrong",
    clues: clues(
      "Makes things that are meant to wobble.",
      "Has clay under the nails.",
      "Gifts mugs nobody can drink from.",
    ),
  },
  {
    name: "Zoe Garcia",
    team: "Paid & Search",
    location: "Mexico City",
    fact: "Solves a Rubik's cube in under a minute.",
    ask: "Puzzles",
    clues: clues(
      "Can finish a famous cube fast.",
      "Fidgets with something colourful.",
      "Has timed everyone in the room.",
    ),
  },
  {
    name: "Lucas Silva",
    team: "Paid & Search",
    location: "Sao Paulo",
    fact: "Worked as a ski instructor.",
    ask: "Mountains",
    clues: clues(
      "Used to teach people to slide downhill.",
      "Misses the cold.",
      "Keeps goggles in the desk drawer.",
    ),
  },
  {
    name: "Omar Aziz",
    team: "Paid & Search",
    location: "Cairo",
    fact: "Does the crossword in pen, every day.",
    ask: "Crosswords in pen",
    clues: clues(
      "Never uses an eraser.",
      "Starts every morning with a grid.",
      "Has strong views on clue 7 down.",
    ),
  },
  {
    name: "Chloe Nguyen",
    team: "Sales",
    location: "Montreal",
    fact: "Bakes a cake for every birthday.",
    ask: "Frosting",
    clues: clues(
      "Remembers everyone's birthday.",
      "Arrives with something sweet.",
      "Has a favourite piping tip.",
    ),
  },
  {
    name: "Julia Novak",
    team: "Sales",
    location: "Prague",
    fact: "Owns a board game with a 90-page rulebook.",
    ask: "Board games with too many rules",
    clues: clues("Reads manuals for fun.", "Hosts long game nights.", "Explains the rules twice."),
  },
  {
    name: "Ben Carter",
    team: "Sales",
    location: "Austin",
    fact: "Smokes brisket for 14 hours at a time.",
    ask: "Smoking brisket",
    clues: clues(
      "Has waited a very long time for lunch.",
      "Smells faintly of woodsmoke.",
      "Will not be rushed on meat.",
    ),
  },
  {
    name: "Sam Taylor",
    team: "Ops",
    location: "Remote",
    fact: "Visited 40 countries.",
    ask: "Night trains",
    clues: clues(
      "Has a long list of stamps.",
      "Prefers sleeping while moving.",
      "Knows the overnight timetable by heart.",
    ),
  },
  {
    name: "Grace Liu",
    team: "Ops",
    location: "Singapore",
    fact: "Runs a tiny newsletter about spreadsheets.",
    ask: "Spreadsheet shortcuts",
    clues: clues(
      "Writes to a few hundred strangers.",
      "Gets excited about a keyboard shortcut.",
      "Has a formula for everything.",
    ),
  },
  {
    name: "Marta Silva",
    team: "Ops",
    location: "Porto",
    fact: "Fixes old radios on weekends.",
    ask: "Old radios",
    clues: clues(
      "Listens to things from another century.",
      "Has a soldering iron at home.",
      "Knows why it crackles.",
    ),
  },
  {
    name: "Felix Novak",
    team: "Freelancers",
    location: "Vienna",
    fact: "Sketches strangers on the tram.",
    ask: "Tram sketches",
    clues: clues(
      "Draws people who do not know it.",
      "Always has a pencil behind an ear.",
      "Commutes for the material.",
    ),
  },
  {
    name: "Theo Lindqvist",
    team: "Freelancers",
    location: "Stockholm",
    fact: "Restores bicycles from the 70s.",
    ask: "Vintage bicycles",
    clues: clues(
      "Likes things with a bell and a basket.",
      "Has grease on their cuffs.",
      "Rides to a client by the long way.",
    ),
  },
  {
    name: "Nita Rao",
    team: "Freelancers",
    location: "Bangalore",
    fact: "Learned to juggle during lockdown.",
    ask: "Juggling",
    clues: clues(
      "Picked up a hobby that drops things.",
      "Practises in the corridor.",
      "Owns three of everything.",
    ),
  },
  {
    name: "Priya Shah",
    team: "Client Services",
    location: "Mumbai",
    fact: "Has visited every metro line in the city.",
    ask: "Metro maps",
    clues: clues(
      "Knows every station by name.",
      "Draws maps for fun.",
      "Gets lost only above ground.",
    ),
  },
  {
    name: "Diego Alvarez",
    team: "Talent",
    location: "Buenos Aires",
    fact: "Dances tango on Sundays.",
    ask: "Tango",
    clues: clues(
      "Spends the weekend in a ballroom.",
      "Counts steps under their breath.",
      "Wears polished shoes indoors.",
    ),
  },
  {
    name: "Lea Dubois",
    team: "Strategy",
    location: "Lyon",
    fact: "Keeps bees on a rooftop.",
    ask: "Rooftop bees",
    clues: clues(
      "Has very small colleagues.",
      "Brings jars of something golden.",
      "Wears a veil on weekends.",
    ),
  },
];

type PersonaKey = "newhire" | "lockedhire" | "player" | "welcomer" | "teammate" | "done" | "admin";

type Persona = {
  key: PersonaKey;
  name: string;
  email: string;
  state: string;
  opens: string;
  /** The new hire flag: set until their mission ends. */
  newHire: boolean;
};

const persona = (
  key: PersonaKey,
  name: string,
  state: string,
  opens: string,
  newHire = false,
): Persona => ({
  key,
  name,
  email: `${key}+clerk_test@inbeat.agency`,
  state,
  opens,
  newHire,
});

/** Sign in with the email and the code 424242 (Clerk test emails, development instance only). */
export const DEMO_PERSONAS: readonly Persona[] = [
  persona(
    "newhire",
    "Nina Newhire",
    "new hire, mission on day 1 with a welcomer, no card yet",
    "/ (the welcome tour, then the mission)",
    true,
  ),
  persona(
    "lockedhire",
    "Leo Lockedhire",
    "new hire with no mission: nothing to open yet",
    "/ (the locked home)",
    true,
  ),
  persona(
    "player",
    "Paul Player",
    "new hire, playing day 9, 8 stickers, 1 wrong guess, clues 1 to 3 out, no card",
    "/play/mission",
    true,
  ),
  persona("welcomer", "Wendy Welcomer", "secret welcomer of Lea Dubois, clues locked", "/welcomer"),
  persona(
    "teammate",
    "Terry Teammate",
    "no mission, card and clues done, can welcome",
    "/card, /clues",
  ),
  persona("done", "Dana Done", "mission found, flag cleared, card not done", "/card, /clues"),
  persona("admin", "Alex Admin", "admin, card and clues done", "/admin"),
];

/**
 * Where each demo portrait came from: a headshot on Unsplash, used under the Unsplash License
 * (free to use, no attribution needed). Each was fetched once with Unsplash's own face-centred
 * square crop (`?fit=facearea&facepad=3&w=256&h=256&q=75&fm=webp`) and committed as
 * public/demo/avatars/<slug>.webp. Nobody here is a public figure.
 */
export const DEMO_PORTRAIT_SOURCES: Readonly<Record<string, string>> = {
  "Ana Souza": "https://images.unsplash.com/photo-1627161683077-e34782c24d81",
  "Noor Haddad": "https://images.unsplash.com/photo-1564564295391-7f24f26f568b",
  "Ines Moreau": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
  "Sofia Rossi": "https://images.unsplash.com/photo-1607569708758-0270aa4651bd",
  "Maya Chen": "https://images.unsplash.com/photo-1630939687530-241d630735df",
  "Ava Patel": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
  "Hana Lee": "https://images.unsplash.com/photo-1619193597120-1d1edb42e34b",
  "Zoe Garcia": "https://images.unsplash.com/photo-1548382131-e0ebb1f0cdea",
  "Chloe Nguyen": "https://images.unsplash.com/photo-1623717217554-72ca676de535",
  "Julia Novak": "https://images.unsplash.com/photo-1699899657680-421c2c2d5064",
  "Grace Liu": "https://images.unsplash.com/photo-1580489944761-15a19d654956",
  "Marta Silva": "https://images.unsplash.com/photo-1662850886700-4ec19bd30d11",
  "Nita Rao": "https://images.unsplash.com/photo-1573496358961-3c82861ab8f4",
  "Priya Shah": "https://images.unsplash.com/photo-1757649734013-705dd6456c02",
  "Lea Dubois": "https://images.unsplash.com/photo-1632765854612-9b02b6ec2b15",
  "Nina Newhire": "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab",
  "Wendy Welcomer": "https://images.unsplash.com/photo-1656473031961-9d5d9ee19f40",
  "Dana Done": "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1",
  "Mateo Ruiz": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  "Jonah Park": "https://images.unsplash.com/photo-1681097561932-36d0df02b379",
  "Ethan Kim": "https://images.unsplash.com/photo-1544168190-79c17527004f",
  "Lucas Silva": "https://images.unsplash.com/photo-1614321375197-c5083895b054",
  "Omar Aziz": "https://images.unsplash.com/photo-1629425733761-caae3b5f2e50",
  "Ben Carter": "https://images.unsplash.com/photo-1676989859871-150f3579862a",
  "Sam Taylor": "https://images.unsplash.com/photo-1566492031773-4f4e44671857",
  "Felix Novak": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
  "Theo Lindqvist": "https://images.unsplash.com/photo-1608649672519-e8797a9560cf",
  "Diego Alvarez": "https://images.unsplash.com/photo-1468218457742-ee484fe2fe4c",
  "Paul Player": "https://images.unsplash.com/photo-1595211877493-41a4e5f236b3",
  "Leo Lockedhire": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "Terry Teammate": "https://images.unsplash.com/photo-1533101585792-27f81a845550",
  "Alex Admin": "https://images.unsplash.com/photo-1560250097-0b93528c311a",
};
