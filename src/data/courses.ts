export type CourseLesson = {
  id: string;
  title: string;
  duration: number;
  membersOnly: boolean;
  objectives: string[];
  sections: { heading: string; body: string }[];
  action: string;
  worksheetPrompt: string;
};

export type CourseTrack = {
  id: string;
  title: string;
  blurb: string;
  badge: string;
  membersOnly: boolean;
  lessons: CourseLesson[];
};

export const COURSE_TRACKS: CourseTrack[] = [
  {
    id: "startup",
    title: "Startup Foundations",
    blurb:
      "From fuzzy idea to a clear offer people will pay for — clarity, brand, ops, and growth that fit real life.",
    badge: "Start here",
    membersOnly: false,
    lessons: [
      {
        id: "startup-1",
        title: "Your unfair advantage",
        duration: 12,
        membersOnly: false,
        objectives: [
          "Name skills only you combine",
          "Spot market pain you already understand",
          "Pick one edge to build around this month",
        ],
        sections: [
          {
            heading: "Why edge beats hustle",
            body: "Most women don't fail from lack of effort — they fail from building something interchangeable. Your edge is the overlap of what you're great at, what you've lived, and what people will pay to change.",
          },
          {
            heading: "Inventory your advantage",
            body: "List 10 skills, 5 hard seasons you've survived, and 3 compliments you keep hearing. Circle anything that can make someone money, save them time, or change how they feel about themselves.",
          },
          {
            heading: "Choose one lane",
            body: "You don't need a forever niche. You need a sharp starting lane. Pick the circle that feels brave and believable for the next 90 days.",
          },
        ],
        action: "Write your one-sentence edge: 'I help ___ do ___ using ___.'",
        worksheetPrompt:
          "My unfair advantage is… because I've lived / learned… and people need…",
      },
      {
        id: "startup-2",
        title: "Who it's for (and who it's not)",
        duration: 14,
        membersOnly: false,
        objectives: [
          "Define a specific buyer",
          "Write a pain-to-result promise",
          "Draw a hard 'not for' line",
        ],
        sections: [
          {
            heading: "Specific sells",
            body: "'Women who want freedom' is not a customer. 'Working moms who want a $3k/month offer without posting daily' is. Specificity is kindness — it helps the right people self-select.",
          },
          {
            heading: "The promise formula",
            body: "I help [person] go from [painful now] to [desired result] without [common struggle]. If you can't say it in one breath, tighten it.",
          },
        ],
        action: "Fill the promise formula and read it out loud to someone.",
        worksheetPrompt: "I help ___ go from ___ to ___ without ___.",
      },
      {
        id: "startup-3",
        title: "Sketch the first offer",
        duration: 15,
        membersOnly: false,
        objectives: [
          "Define deliverables and timeline",
          "Pick a brave-but-believable price",
          "Ship a draft, not a masterpiece",
        ],
        sections: [
          {
            heading: "Minimum lovable offer",
            body: "Your first offer should be deliverable in under 6 weeks with the tools you already have. Fancy funnels come later. Clarity + proof come first.",
          },
          {
            heading: "Price for outcome",
            body: "Anchor against the cost of staying stuck, not your hourly insecurity. Test one number for 14 days before you discount.",
          },
        ],
        action: "Write offer name, what's included, timeline, and price.",
        worksheetPrompt: "Offer name / includes / timeline / price / how they buy:",
      },
      {
        id: "startup-4",
        title: "Brand that sounds like you",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Pick 3 brand words",
          "Rewrite bio in your voice",
          "Draft a homepage hook",
        ],
        sections: [
          {
            heading: "Personality is strategy",
            body: "Business by Becca works because it sounds like a real woman, not a brochure. Your brand should feel like a text from a sharp friend who wants you winning.",
          },
        ],
        action: "Rewrite your Instagram bio and one homepage sentence today.",
        worksheetPrompt: "3 brand words + new bio + homepage line:",
      },
      {
        id: "startup-5",
        title: "Ops that fit real life",
        duration: 10,
        membersOnly: true,
        objectives: [
          "Pick one work block",
          "Centralize inbox + payments",
          "Remove 2 friction points",
        ],
        sections: [
          {
            heading: "Consistency over complexity",
            body: "One calendar block. One inbox. One payment link. Systems that require a perfect week will fail a real week.",
          },
        ],
        action: "Block 3 CEO hours this week and create one payment link.",
        worksheetPrompt: "Work block / tools I keep / tools I delete:",
      },
      {
        id: "startup-6",
        title: "Boundaries = freedom",
        duration: 11,
        membersOnly: true,
        objectives: [
          "Set client hours",
          "Define response windows",
          "Protect a weekly CEO hour",
        ],
        sections: [
          {
            heading: "Design the life first",
            body: "Freedom is designed, not hoped for. Decide when you work, how fast you reply, and what 'done for the week' means before demand decides for you.",
          },
        ],
        action: "Write your client hours and response policy in one note.",
        worksheetPrompt: "Client hours / response time / weekly CEO hour:",
      },
      {
        id: "startup-7",
        title: "Offers that compound",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Map entry → core → premium",
          "Delay new SKUs until core converts",
          "Plan one continuity path",
        ],
        sections: [
          {
            heading: "Depth beats more",
            body: "Add a continuity offer or upsell only after the core offer converts. More products won't fix an unclear promise.",
          },
        ],
        action: "Sketch your 3-tier offer ladder with prices.",
        worksheetPrompt: "Entry / Core / Premium — promise + price:",
      },
      {
        id: "startup-8",
        title: "Weekly founder rhythm",
        duration: 10,
        membersOnly: true,
        objectives: [
          "Create a repeatable weekly loop",
          "Track leading indicators",
          "Review wins every Friday",
        ],
        sections: [
          {
            heading: "The village rhythm",
            body: "Outreach, content, delivery, CEO review. Same four beats every week. Boring systems create exciting freedom.",
          },
        ],
        action: "Fill this week's CEO scorecard in the toolkit.",
        worksheetPrompt: "This week's outreach / content / revenue goal:",
      },
    ],
  },
  {
    id: "money",
    title: "Money & Margins",
    blurb:
      "Price with confidence, understand cash flow, protect profit, and build a business that funds the life you want.",
    badge: "Financial course",
    membersOnly: true,
    lessons: [
      {
        id: "money-1",
        title: "Money mindset for founders",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Separate worth from price",
          "Spot undercharging patterns",
          "Set a monthly revenue floor",
        ],
        sections: [
          {
            heading: "Price is information",
            body: "Undercharging trains the market to undervalue you and trains you to overwork. Your price teaches people how to treat the offer.",
          },
          {
            heading: "Set a floor",
            body: "What's the minimum monthly revenue that makes this worth your time? That's your floor — not your ceiling.",
          },
        ],
        action: "Write your monthly revenue floor and stretch goal.",
        worksheetPrompt: "Floor $___ / stretch $___ / why those numbers:",
      },
      {
        id: "money-2",
        title: "Pricing psychology that still feels like you",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Anchor to outcome value",
          "Use tiers without sleaze",
          "Test before you discount",
        ],
        sections: [
          {
            heading: "Outcome > hours",
            body: "Clients buy transformation, access, and relief — not your minutes. Price the result and the container that makes it likely.",
          },
        ],
        action: "Run the Pricing Power calculator with real numbers.",
        worksheetPrompt: "Old price / new price / value story I'll say:",
      },
      {
        id: "money-3",
        title: "Cash flow basics",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Map money in vs money out",
          "Spot timing gaps",
          "Create a simple cash habit",
        ],
        sections: [
          {
            heading: "Profit ≠ cash in the account",
            body: "You can be 'profitable on paper' and still stressed if timing is off. Track weekly cash in, cash out, and what's owed to you.",
          },
        ],
        action: "List last 30 days of cash in and cash out.",
        worksheetPrompt: "Cash in / cash out / outstanding invoices:",
      },
      {
        id: "money-4",
        title: "Break-even clarity",
        duration: 12,
        membersOnly: true,
        objectives: [
          "List fixed monthly costs",
          "Calculate contribution margin",
          "Know units needed to break even",
        ],
        sections: [
          {
            heading: "Know your number",
            body: "Break-even is freedom math. Once you know how many sales cover the bills, every sale after that is oxygen.",
          },
        ],
        action: "Complete the Break-even calculator.",
        worksheetPrompt: "Fixed costs / price / variable cost / break-even units:",
      },
      {
        id: "money-5",
        title: "Profit snapshot",
        duration: 11,
        membersOnly: true,
        objectives: [
          "Separate revenue from profit",
          "Identify margin leaks",
          "Set a target margin %",
        ],
        sections: [
          {
            heading: "Margin is the mission",
            body: "Revenue is vanity if expenses eat it. Healthy service businesses often aim for strong contribution margins before lifestyle creep.",
          },
        ],
        action: "Run Profit Snapshot for this month.",
        worksheetPrompt: "Revenue / COGS / expenses / profit / margin %:",
      },
      {
        id: "money-6",
        title: "Taxes-lite for solopreneurs",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Open a separate business account habit",
          "Set aside a tax %",
          "Know when to call a pro",
        ],
        sections: [
          {
            heading: "Don't get surprised",
            body: "This is not tax advice — it's founder hygiene. Separate accounts, save a percentage of every payment, and book a real accountant when revenue gets serious.",
          },
        ],
        action: "Choose your tax set-aside % and automate a transfer habit.",
        worksheetPrompt: "Tax % I'll set aside / account setup next step:",
      },
      {
        id: "money-7",
        title: "Runway & risk",
        duration: 10,
        membersOnly: true,
        objectives: [
          "Calculate months of runway",
          "Plan a buffer",
          "Decide what to cut vs invest",
        ],
        sections: [
          {
            heading: "Runway creates calm",
            body: "Knowing your runway lets you make bold offers without panic decisions. Calm founders sell better.",
          },
        ],
        action: "Use the Runway calculator with honest burn.",
        worksheetPrompt: "Cash / monthly burn / runway months / buffer goal:",
      },
      {
        id: "money-8",
        title: "Reinvest like a CEO",
        duration: 11,
        membersOnly: true,
        objectives: [
          "Split profit into pay / tax / reinvest / save",
          "Fund growth on purpose",
          "Avoid random tool spending",
        ],
        sections: [
          {
            heading: "Pay yourself on purpose",
            body: "A simple split beats vibes: owner pay, tax, reinvest, reserves. Growth spending should have a hypothesis.",
          },
        ],
        action: "Write your profit split percentages.",
        worksheetPrompt: "Pay % / tax % / reinvest % / save %:",
      },
      {
        id: "money-9",
        title: "Revenue goal reverse-engineering",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Start from income goal",
          "Back into sales needed",
          "Build a weekly outreach target",
        ],
        sections: [
          {
            heading: "Math before magic",
            body: "If you need $8k/month at $2k per client, you need 4 clients. If 1 in 5 conversations closes, you need ~20 conversations. Now you have a plan.",
          },
        ],
        action: "Run the Revenue Goal calculator and set this week's outreach number.",
        worksheetPrompt: "Goal / price / sales needed / weekly conversations:",
      },
    ],
  },
  {
    id: "launch",
    title: "Launch & Sales",
    blurb:
      "Package the offer, start conversations, close with personality, and land your first dollars without losing yourself.",
    badge: "Get paid",
    membersOnly: true,
    lessons: [
      {
        id: "launch-1",
        title: "Package the offer so it sells",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Name the transformation",
          "List inclusions clearly",
          "Remove fuzzy deliverables",
        ],
        sections: [
          {
            heading: "Clarity converts",
            body: "Confused buyers don't buy. Your package should answer: what do I get, how long, what happens first, and what does done look like?",
          },
        ],
        action: "Rewrite your offer package in 5 bullets max.",
        worksheetPrompt: "Transformation / includes / timeline / first step / done looks like:",
      },
      {
        id: "launch-2",
        title: "Your 7-day soft launch",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Map warm outreach list",
          "Plan one CTA per day",
          "Track conversations not likes",
        ],
        sections: [
          {
            heading: "Warm before cold",
            body: "Start with people who already trust you. Soft launch is a week of invitations, not a viral moment.",
          },
        ],
        action: "Open the 7-day launch planner and check off Day 1.",
        worksheetPrompt: "20 warm names + Day 1 message draft:",
      },
      {
        id: "launch-3",
        title: "Outreach that feels human",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Write a warm DM opener",
          "Ask before you pitch",
          "Book discovery chats",
        ],
        sections: [
          {
            heading: "Conversation > campaign",
            body: "Lead with care and curiosity. People buy from women who listen, not women who blast.",
          },
        ],
        action: "Send 5 warm messages today using the vault scripts.",
        worksheetPrompt: "My opener / my ask / follow-up line:",
      },
      {
        id: "launch-4",
        title: "Sales chats that close",
        duration: 15,
        membersOnly: true,
        objectives: [
          "Run a simple discovery flow",
          "Mirror pain back",
          "Invite clearly",
        ],
        sections: [
          {
            heading: "Ask more than you pitch",
            body: "Discover the pain, mirror it, then invite them into the offer. Scripts are training wheels — personality closes.",
          },
        ],
        action: "Practice a 10-minute discovery with a friend.",
        worksheetPrompt: "3 discovery questions + my invite sentence:",
      },
      {
        id: "launch-5",
        title: "Handling objections without shrinking",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Normalize common objections",
          "Respond with clarity not apology",
          "Know when to release",
        ],
        sections: [
          {
            heading: "Objections are information",
            body: "Price, timing, and 'I need to think' usually mean unclear value or fear. Answer honestly. Never beg.",
          },
        ],
        action: "Write responses to your top 3 objections.",
        worksheetPrompt: "Objection → response for price / timing / partner:",
      },
      {
        id: "launch-6",
        title: "First $1k sprint",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Define a 14-day $1k plan",
          "Focus on conversations",
          "Celebrate proof over perfection",
        ],
        sections: [
          {
            heading: "Proof changes everything",
            body: "Your first dollars teach more than another week of branding. Sprint for conversations and closes.",
          },
        ],
        action: "Set a 14-day $1k target and daily conversation quota.",
        worksheetPrompt: "Target / daily chats / offer I'll sell:",
      },
      {
        id: "launch-7",
        title: "Onboarding that feels premium",
        duration: 10,
        membersOnly: true,
        objectives: [
          "Send a welcome note",
          "Collect what you need once",
          "Set expectations early",
        ],
        sections: [
          {
            heading: "Delivery is marketing",
            body: "A clean onboarding experience creates testimonials and referrals. Make the first 48 hours feel held.",
          },
        ],
        action: "Draft your welcome + onboarding checklist.",
        worksheetPrompt: "Welcome note / intake questions / week-1 plan:",
      },
      {
        id: "launch-8",
        title: "Retention & referrals",
        duration: 11,
        membersOnly: true,
        objectives: [
          "Ask for the testimonial",
          "Create a referral ask",
          "Design a continuity offer",
        ],
        sections: [
          {
            heading: "Keep the village growing",
            body: "Happy clients are your warmest channel. Ask clearly. Offer continuity when results are landing.",
          },
        ],
        action: "Write your testimonial + referral ask scripts.",
        worksheetPrompt: "Testimonial ask / referral ask / continuity idea:",
      },
      {
        id: "launch-9",
        title: "Content that sells quietly",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Teach one lesson weekly",
          "End with a soft CTA",
          "Build a simple content loop",
        ],
        sections: [
          {
            heading: "Consistency beats virality",
            body: "One useful post and one invitation beats random aesthetic dumps. Teach, then invite.",
          },
        ],
        action: "Plan 4 teaching posts for the next 4 weeks.",
        worksheetPrompt: "4 post topics + CTA for each:",
      },
      {
        id: "launch-10",
        title: "From first sales to system",
        duration: 12,
        membersOnly: true,
        objectives: [
          "Productize what sold",
          "Document FAQ + delivery",
          "Book the next launch window",
        ],
        sections: [
          {
            heading: "Repeat what worked",
            body: "After first sales, turn chaos into a checklist. Same offer, cleaner path, more confidence.",
          },
        ],
        action: "Create a one-page delivery SOP from your last win.",
        worksheetPrompt: "What sold / FAQ / delivery steps / next launch date:",
      },
    ],
  },
];

export function getTrack(trackId: string) {
  return COURSE_TRACKS.find((t) => t.id === trackId);
}

export function getLesson(trackId: string, lessonId: string) {
  const track = getTrack(trackId);
  return track?.lessons.find((l) => l.id === lessonId);
}

export function allLessons() {
  return COURSE_TRACKS.flatMap((t) =>
    t.lessons.map((l) => ({ ...l, trackId: t.id, trackTitle: t.title })),
  );
}

export function trackProgress(trackId: string, completed: string[]) {
  const track = getTrack(trackId);
  if (!track) return { done: 0, total: 0, pct: 0 };
  const total = track.lessons.length;
  const done = track.lessons.filter((l) => completed.includes(l.id)).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function nextLesson(completed: string[]) {
  for (const track of COURSE_TRACKS) {
    for (const lesson of track.lessons) {
      if (!completed.includes(lesson.id)) {
        return { track, lesson };
      }
    }
  }
  return null;
}
