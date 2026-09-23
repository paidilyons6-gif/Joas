export type ToolId =
  | "offer-builder"
  | "ideal-client"
  | "launch-planner"
  | "ceo-scorecard";

export type ToolMeta = {
  id: ToolId;
  title: string;
  blurb: string;
  membersOnly: boolean;
  badge: string;
};

export const TOOLS: ToolMeta[] = [
  {
    id: "offer-builder",
    title: "Offer builder",
    blurb: "Who, pain, promise, price, delivery — saved as a living draft.",
    membersOnly: true,
    badge: "Toolkit",
  },
  {
    id: "ideal-client",
    title: "Ideal client sketch",
    blurb: "Demographics, pains, desires, and where they hang out.",
    membersOnly: true,
    badge: "Toolkit",
  },
  {
    id: "launch-planner",
    title: "7-day launch planner",
    blurb: "Day-by-day checklist for a soft launch that gets replies.",
    membersOnly: true,
    badge: "Toolkit",
  },
  {
    id: "ceo-scorecard",
    title: "Weekly CEO scorecard",
    blurb: "Revenue, outreach, content, and energy — one honest check-in.",
    membersOnly: true,
    badge: "Members",
  },
];

export const LAUNCH_DAYS = [
  {
    day: 1,
    title: "Warm list + first invites",
    tasks: [
      "List 20 warm contacts",
      "Send 5 personal messages",
      "Post a soft 'something new' teaser",
    ],
  },
  {
    day: 2,
    title: "Teach + invite",
    tasks: [
      "Share one useful lesson publicly",
      "End with a clear CTA",
      "Follow up 3 yesterday chats",
    ],
  },
  {
    day: 3,
    title: "Proof + conversations",
    tasks: [
      "Share a win, story, or mini case",
      "Book 2 discovery chats",
      "Send 5 more warm outreaches",
    ],
  },
  {
    day: 4,
    title: "Objection day",
    tasks: [
      "Post FAQ / objection content",
      "Reply to every interested comment/DM",
      "Offer 2 chat slots",
    ],
  },
  {
    day: 5,
    title: "Close with care",
    tasks: [
      "Send payment links to warm yeses",
      "Personal follow-ups to maybes",
      "Celebrate any sale publicly (with permission)",
    ],
  },
  {
    day: 6,
    title: "Serve + social proof",
    tasks: [
      "Onboard anyone who bought",
      "Ask for early feedback",
      "Share behind-the-scenes energy",
    ],
  },
  {
    day: 7,
    title: "Review + next window",
    tasks: [
      "Count conversations, closes, cash",
      "Note what messaging worked",
      "Book your next 7-day launch window",
    ],
  },
];

export function getTool(id: string) {
  return TOOLS.find((t) => t.id === id);
}

export const defaultOfferDraft = {
  who: "",
  pain: "",
  promise: "",
  price: "",
  delivery: "",
  name: "",
};

export const defaultClientDraft = {
  who: "",
  ageLife: "",
  pains: "",
  desires: "",
  hangouts: "",
  language: "",
};

export const defaultScorecard = {
  weekOf: "",
  revenue: "",
  outreach: "",
  content: "",
  energy: "3",
  win: "",
  nextFocus: "",
};
