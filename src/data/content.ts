export type PlanId = "monthly" | "annual";

export type CurriculumModule = {
  id: string;
  phase: string;
  title: string;
  blurb: string;
  minutes: number;
  lessons: { id: string; title: string; body: string }[];
  membersOnly: boolean;
};

export const PLANS: Record<
  PlanId,
  { name: string; priceLabel: string; cadence: string; highlight?: string; features: string[] }
> = {
  monthly: {
    name: "Membership",
    priceLabel: "$49",
    cadence: "/month",
    features: [
      "Full training curriculum",
      "Live coaching replays",
      "Resource vault + templates",
      "Member community access",
      "Cancel anytime",
    ],
  },
  annual: {
    name: "Founders Year",
    priceLabel: "$397",
    cadence: "/year",
    highlight: "Best value · 2 months free",
    features: [
      "Everything in Membership",
      "Founders badge in portal",
      "Priority office-hours seats",
      "Annual strategy reset call",
      "Lock in founding pricing",
    ],
  },
};

export const CURRICULUM: CurriculumModule[] = [
  {
    id: "clarity",
    phase: "Phase 1",
    title: "Find your edge",
    blurb: "Name the offer, the customer, and why you — so you stop spinning.",
    minutes: 45,
    membersOnly: false,
    lessons: [
      {
        id: "edge-1",
        title: "Your unfair advantage",
        body: "List the skills, stories, and seasons of life only you can sell. Circle the one that can make someone money, save them time, or change how they feel — this week.",
      },
      {
        id: "edge-2",
        title: "Who it's for (and who it's not)",
        body: "Write one sentence: 'I help [person] go from [pain] to [result] without [common struggle].' If you can't say it out loud in 10 seconds, tighten it.",
      },
      {
        id: "edge-3",
        title: "The first offer sketch",
        body: "Draft a simple offer: what they get, how long it takes, and the price that feels brave but believable. Ship a draft, not a masterpiece.",
      },
    ],
  },
  {
    id: "foundation",
    phase: "Phase 2",
    title: "Build the foundation",
    blurb: "Brand basics, pricing, and a lightweight setup that feels steady on launch day.",
    minutes: 60,
    membersOnly: true,
    lessons: [
      {
        id: "found-1",
        title: "Brand that sounds like you",
        body: "Pick three words that are you (ambitious, unfiltered, warm — whatever fits). Rewrite your bio and homepage line until they sound like a text to a friend, not a brochure.",
      },
      {
        id: "found-2",
        title: "Pricing with confidence",
        body: "Price for the outcome, not the hours. Anchor against the cost of staying stuck. Test one number for 14 days before you discount.",
      },
      {
        id: "found-3",
        title: "Ops that fit real life",
        body: "Choose one calendar block, one inbox, one payment link. Fancy systems come later — consistency comes first.",
      },
    ],
  },
  {
    id: "launch",
    phase: "Phase 3",
    title: "Go live & get paid",
    blurb: "First customers, first sales, and habits that keep revenue moving.",
    minutes: 55,
    membersOnly: true,
    lessons: [
      {
        id: "launch-1",
        title: "Your launch week plan",
        body: "Map 7 days: warm outreach, one public post a day, and a clear CTA. Track conversations, not vanity metrics.",
      },
      {
        id: "launch-2",
        title: "Sales chats that feel human",
        body: "Ask more than you pitch. Discover the pain, mirror it back, then invite them into the offer. Scripts are training wheels — personality closes.",
      },
      {
        id: "launch-3",
        title: "First dollar, then systems",
        body: "Celebrate the first sale, then productize what worked: FAQ, onboarding note, delivery checklist. Repeat what sold.",
      },
    ],
  },
  {
    id: "grow",
    phase: "Phase 4",
    title: "Grow on purpose",
    blurb: "Scale income without scaling chaos — protect family time while you expand.",
    minutes: 50,
    membersOnly: true,
    lessons: [
      {
        id: "grow-1",
        title: "Offers that compound",
        body: "Add a continuity offer or upsell only after the core offer converts. Depth beats more skus.",
      },
      {
        id: "grow-2",
        title: "Content that sells quietly",
        body: "Teach one lesson publicly each week. End with a soft invite. Consistency beats virality.",
      },
      {
        id: "grow-3",
        title: "Boundaries = freedom",
        body: "Set client hours, response windows, and a weekly CEO hour. Freedom is designed, not hoped for.",
      },
    ],
  },
];

export const RESOURCES = [
  {
    id: "offer-canvas",
    title: "Offer canvas",
    type: "Template",
    blurb: "One-page worksheet to nail your customer, promise, and price.",
  },
  {
    id: "launch-checklist",
    title: "7-day launch checklist",
    type: "Checklist",
    blurb: "Daily actions for a soft launch that actually gets replies.",
  },
  {
    id: "sales-scripts",
    title: "Sales chat scripts",
    type: "Scripts",
    blurb: "Warm DM openers, discovery questions, and close lines that still sound like you.",
  },
  {
    id: "pricing-guide",
    title: "Pricing confidence guide",
    type: "Guide",
    blurb: "How to set a number you can say out loud without flinching.",
  },
];
