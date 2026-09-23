export type ResourceItem = {
  id: string;
  title: string;
  type: string;
  blurb: string;
  membersOnly: boolean;
  content: string;
};

export const RESOURCES: ResourceItem[] = [
  {
    id: "offer-canvas",
    title: "Offer canvas",
    type: "Template",
    blurb: "One-page worksheet to nail customer, promise, and price.",
    membersOnly: true,
    content: `OFFER CANVAS
Who it's for:
Painful now:
Desired result:
Promise sentence:
What's included:
Timeline:
Price:
How they buy:
Not for:`,
  },
  {
    id: "launch-checklist",
    title: "7-day launch checklist",
    type: "Checklist",
    blurb: "Daily actions for a soft launch that actually gets replies.",
    membersOnly: true,
    content: `7-DAY LAUNCH
Day 1: Warm list + 5 invites
Day 2: Teach + CTA
Day 3: Proof + book chats
Day 4: FAQ / objections
Day 5: Close + payment links
Day 6: Onboard + ask feedback
Day 7: Review numbers + next window`,
  },
  {
    id: "sales-scripts",
    title: "Sales chat scripts",
    type: "Scripts",
    blurb: "Warm DM openers, discovery questions, and close lines.",
    membersOnly: true,
    content: `WARM OPENER
"Hey [name] — I've been building something for [who] who want [result]. You popped into my head. Open to a quick chat this week?"

DISCOVERY
1. What's feeling hardest about ___ right now?
2. What have you already tried?
3. If this were handled in 30 days, what would change?

INVITE
"Based on what you shared, I think my [offer] could help you get to [result]. Want me to walk you through how it works?"`,
  },
  {
    id: "pricing-guide",
    title: "Pricing confidence guide",
    type: "Guide",
    blurb: "How to set a number you can say out loud without flinching.",
    membersOnly: true,
    content: `PRICING CONFIDENCE
1. Price the outcome, not your panic.
2. Anchor against cost of staying stuck.
3. Test one number for 14 days.
4. Never discount before you've sold it full-price.
5. Use the Pricing Power calculator before you publish.`,
  },
  {
    id: "discovery-flow",
    title: "Discovery call flow",
    type: "Script",
    blurb: "A simple 20-minute structure that stays human.",
    membersOnly: true,
    content: `DISCOVERY FLOW (20 min)
0–2: Warm hello + agenda
2–10: Their story + pain
10–14: Mirror + desired result
14–18: Offer walkthrough
18–20: Clear invite + next step`,
  },
  {
    id: "onboarding-note",
    title: "Client onboarding note",
    type: "Template",
    blurb: "Welcome message that feels premium in the first 48 hours.",
    membersOnly: true,
    content: `WELCOME
So glad you're here. Here's what happens next:
1) Complete this intake: ___
2) Book your kickoff: ___
3) Bring: ___
You can reply here anytime during [client hours]. Let's build.`,
  },
  {
    id: "testimonial-ask",
    title: "Testimonial & referral ask",
    type: "Scripts",
    blurb: "Ask for proof and introductions without awkwardness.",
    membersOnly: true,
    content: `TESTIMONIAL ASK
"Would you share 2–3 sentences on what shifted for you? I can draft a starter if helpful."

REFERRAL ASK
"If someone in your world needs [result], I'd love an intro. Anyone come to mind?"`,
  },
  {
    id: "ceo-habits",
    title: "CEO weekly habits",
    type: "Checklist",
    blurb: "The boring rhythm that creates exciting freedom.",
    membersOnly: false,
    content: `WEEKLY CEO HABITS
□ Outreach conversations logged
□ One teaching post published
□ Delivery promises kept
□ Money snapshot checked
□ Scorecard filled
□ Next week blocked`,
  },
  {
    id: "boundary-script",
    title: "Boundary & capacity script",
    type: "Scripts",
    blurb: "Say no (or not now) without burning the relationship.",
    membersOnly: true,
    content: `CAPACITY SCRIPT
"I love this — and I'm at capacity for [timeline]. I can either waitlist you for [next window] or recommend [alt]. Which feels better?"

BOUNDARY
"I don't take on [scope] anymore. What I do offer is [offer] — want the details?"`,
  },
  {
    id: "money-date",
    title: "Monthly money date",
    type: "Checklist",
    blurb: "A 45-minute ritual so cash doesn't surprise you.",
    membersOnly: true,
    content: `MONEY DATE (45 min)
1. Open bank + Stripe + unpaid invoices
2. Note cash in / cash out / runway
3. Update break-even + revenue goal calc
4. Move profit % to savings (even $20)
5. One pricing or collections action for next week`,
  },
  {
    id: "content-batch",
    title: "Content batch planner",
    type: "Template",
    blurb: "Plan a week of posts that teach and invite.",
    membersOnly: true,
    content: `CONTENT BATCH
Pillar topic:
Audience pain:
Promise / takeaway:

Mon — Teach
Tue — Story / proof
Wed — Soft invite
Thu — FAQ / myth
Fri — Clear CTA

CTA link / booking:
Offer name:`,
  },
];
