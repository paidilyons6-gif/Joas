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
        duration: 14,
        membersOnly: false,
        objectives: [
          "Name the skills and lived experience only you combine",
          "Spot market pain you already understand from the inside",
          "Separate 'interesting' from 'people will pay for this'",
          "Pick one sharp edge to build around for the next 90 days",
        ],
        sections: [
          {
            heading: "Why edge beats hustle",
            body: "Most women don't fail from lack of effort — they fail from building something interchangeable. When your offer looks like everyone else's, you compete on price and exhaustion. Your edge is the overlap of what you're great at, what you've lived, and what someone will pay to change — and that overlap is a business asset, not a vibe.",
          },
          {
            heading: "Inventory your advantage",
            body: "Open a note and list 10 skills you can actually teach or do, 5 hard seasons you've survived, and 3 compliments people keep giving you without being asked. Circle anything that can make someone money, save them time, or change how they feel about themselves. Compliments that sound like personality fluff stay uncircled. Patterns that solve expensive problems stay.",
          },
          {
            heading: "Lived experience is data",
            body: "If you've navigated career pivots with kids, rebuilt after burnout, or figured out sales while working a day job, you already have research most consultants charge for. Don't bury that under a generic 'I help women thrive' line. The specific mess you've cleaned up is often the exact mess your buyer is in right now.",
          },
          {
            heading: "Choose one lane",
            body: "You don't need a forever niche — you need a sharp starting lane. Pick the circle that feels brave and believable for the next 90 days, not the one that sounds impressive at brunch. One lane lets you get proof, and proof lets you expand later without starting from zero again.",
          },
        ],
        action:
          "Write your one-sentence edge: 'I help ___ do ___ using ___.' Say it out loud. If it sounds vague, tighten until a stranger would know who it's for.",
        worksheetPrompt:
          "My unfair advantage is… because I've lived / learned… and people need… My 90-day lane is…",
      },
      {
        id: "startup-2",
        title: "Who it's for (and who it's not)",
        duration: 15,
        membersOnly: false,
        objectives: [
          "Define a specific buyer with real constraints",
          "Write a pain-to-result promise in one breath",
          "Draw a hard 'not for' line you can defend",
          "Name the common struggle your buyer wants to skip",
        ],
        sections: [
          {
            heading: "Specific sells",
            body: "'Women who want freedom' is not a customer — 'Working moms who want a $3k/month offer without posting daily' is. Specificity is kindness: it helps the right people self-select and saves you from clients who were never going to be a fit. Vague attracts curiosity; specific attracts money.",
          },
          {
            heading: "Build a real person, not a persona board",
            body: "Write down her job reality, her time constraints, what she's already tried, and what she's afraid of looking like if this fails. Include the kid schedule, the partner questions, the side-eye from friends. When you can picture her Tuesday afternoon, your marketing stops sounding like a template.",
          },
          {
            heading: "The promise formula",
            body: "I help [person] go from [painful now] to [desired result] without [common struggle]. If you can't say it in one breath, tighten it. The 'without' clause is where your edge shows up — it's the relief that makes her lean in instead of scrolling past.",
          },
          {
            heading: "Who it's not for",
            body: "A clear 'not for' line protects your energy and your reputation. Maybe you're not for people who want overnight riches, or who won't do the homework, or who need a full agency. Saying no early is cheaper than refunding later and resenting the work.",
          },
        ],
        action:
          "Fill the promise formula and read it out loud to someone who will tell you if it sounds fuzzy. Revise once based on their blank stare moments.",
        worksheetPrompt:
          "I help ___ go from ___ to ___ without ___. Not for: ___. Her Tuesday looks like: ___",
      },
      {
        id: "startup-3",
        title: "Sketch the first offer",
        duration: 16,
        membersOnly: false,
        objectives: [
          "Define deliverables, timeline, and what 'done' means",
          "Pick a brave-but-believable price for a first test",
          "Ship a draft offer you could sell this week",
          "Decide how buyers actually pay and start",
        ],
        sections: [
          {
            heading: "Minimum lovable offer",
            body: "Your first offer should be deliverable in under 6 weeks with the tools you already have. Fancy funnels come later. Clarity and proof come first. If you need a new software stack to deliver, the offer is too heavy for right now.",
          },
          {
            heading: "Name the change, then the container",
            body: "Start with the transformation, then wrap it in a simple container: calls, async feedback, templates, a workshop — whatever you can actually run on a school-night schedule. Buyers care about the result and the path. They do not care that you designed a 47-page PDF.",
          },
          {
            heading: "Price for outcome",
            body: "Anchor against the cost of staying stuck, not your hourly insecurity. Ask what this problem is already costing her in time, money, or stress. Test one number for 14 days before you discount. Discounting early teaches people to wait for your self-doubt sale.",
          },
          {
            heading: "Make buying obvious",
            body: "Write how they buy in one sentence: DM you, book a call, pay a link, reply to an email. Friction kills first sales. Your draft offer is not done until a tired mom could purchase it without a scavenger hunt.",
          },
        ],
        action:
          "Write offer name, what's included, timeline, price, and the exact first step to buy. Put it in a note you can paste into a DM tomorrow.",
        worksheetPrompt:
          "Offer name / includes / timeline / price / how they buy / what done looks like:",
      },
      {
        id: "startup-4",
        title: "Brand that sounds like you",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Pick 3 brand words you can actually live up to",
          "Rewrite your bio in your real voice",
          "Draft a homepage or profile hook that names who it's for",
          "Cut corporate filler that makes you sound like every other coach",
        ],
        sections: [
          {
            heading: "Personality is strategy",
            body: "Business by Becca works because it sounds like a real woman, not a brochure. Your brand should feel like a text from a sharp friend who wants you winning. If your copy could sit on any competitor's site after a logo swap, it is not branded yet — it is generic.",
          },
          {
            heading: "Three words that steer everything",
            body: "Choose three words that describe how you show up: warm, direct, ambitious — or whatever is true for you. Use them as a filter, and if a caption, color, or client reply violates those words, rewrite it. Brand is not a moodboard; it is a consistency decision.",
          },
          {
            heading: "Bio that does a job",
            body: "Your bio has one job: help the right person recognize herself and know what to do next. Lead with who you help and the result, then add personality. Save the cute line for after the clarity. Clever without clarity is just noise.",
          },
          {
            heading: "Homepage hook without the brochure voice",
            body: "Write one sentence that could live at the top of a site or pinned post. It should name the buyer and the promise without jargon. Read it out loud. If you would never say it to a friend at pick-up, it does not belong on your brand.",
          },
        ],
        action:
          "Rewrite your Instagram bio and one homepage (or pinned post) sentence today. Read both aloud. Cut anything you would not say in real life.",
        worksheetPrompt:
          "3 brand words + old bio → new bio + homepage/pinned line + one word I'm retiring:",
      },
      {
        id: "startup-5",
        title: "Ops that fit real life",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Pick one recurring work block you can keep on messy weeks",
          "Centralize inbox and payments so nothing lives in five apps",
          "Remove two friction points that slow delivery or sales",
          "Choose a default tool stack you will not expand this month",
        ],
        sections: [
          {
            heading: "Consistency over complexity",
            body: "One calendar block, one inbox, one payment link — systems that require a perfect week will fail a real week of sick kids, late meetings, and an empty fridge. Build for Tuesday-with-chaos, not vacation-with-focus. If your ops only work when life is quiet, they are cosplay, not ops.",
          },
          {
            heading: "Centralize the money path",
            body: "Every unpaid invoice hiding in a DM is a leak. Pick one place clients pay and one place you track it. Same for questions: one inbox you actually check. Context-switching is expensive when you only have ninety minutes before bedtime.",
          },
          {
            heading: "Kill friction on purpose",
            body: "List every step between 'she said yes' and 'money is in / work has started.' Delete two steps this week — maybe the custom proposal, the second confirmation email, the tool she has to download. Speed to start is part of the product.",
          },
          {
            heading: "Tool diet",
            body: "New tools feel like progress. They usually are distraction. Name the three tools you keep for the next 30 days and put everything else on ice. You can upgrade the stack after the offer is proven, not before.",
          },
        ],
        action:
          "Block three CEO hours this week on the calendar, create (or confirm) one payment link, and delete or mute one tool you do not need.",
        worksheetPrompt:
          "Work block day/time / tools I keep / tools I delete / two friction points I'm removing:",
      },
      {
        id: "startup-6",
        title: "Boundaries = freedom",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Set client hours that match your real life",
          "Define response windows so urgency is not the default",
          "Protect a weekly CEO hour that is not client work",
          "Write a short policy you can paste into onboarding",
        ],
        sections: [
          {
            heading: "Design the life first",
            body: "Freedom is designed, not hoped for. Decide when you work, how fast you reply, and what 'done for the week' means before demand decides for you. If you wait until you're overwhelmed to set boundaries, you will set them from resentment instead of leadership.",
          },
          {
            heading: "Client hours that survive school runs",
            body: "Write the days and hours you take calls and do deep work, and be honest about pickup, evenings, and the days that always implode. Publish those hours in your onboarding. People respect what you clearly state and exploit what you leave fuzzy.",
          },
          {
            heading: "Response windows, not always-on",
            body: "Same-day replies feel heroic until they train everyone to expect them. Choose a window — within 24 business hours, twice a week, whatever you can keep. Emergency exceptions are rare by definition. If everything is urgent, nothing is.",
          },
          {
            heading: "CEO hour is non-negotiable",
            body: "One protected hour a week for numbers, outreach planning, and decisions keeps you from becoming an unpaid employee in your own business. Put it on the calendar like a client call. If you cancel it for 'just one more delivery task,' you already know how that story ends.",
          },
        ],
        action:
          "Write your client hours, response policy, and weekly CEO hour in one note. Paste the hours and response line into your welcome message draft.",
        worksheetPrompt:
          "Client hours / response time / weekly CEO hour / sentence I'll share with clients:",
      },
      {
        id: "startup-7",
        title: "Offers that compound",
        duration: 15,
        membersOnly: true,
        objectives: [
          "Map an entry → core → premium ladder",
          "Delay new SKUs until the core offer converts",
          "Plan one continuity path for clients who get results",
          "Price each tier so the middle is the obvious choice",
        ],
        sections: [
          {
            heading: "Depth beats more",
            body: "Add a continuity offer or upsell only after the core offer converts. More products will not fix an unclear promise. Founders often multiply SKUs to feel productive while avoiding the harder work of selling one thing well. Resist that urge.",
          },
          {
            heading: "Build the ladder on purpose",
            body: "Entry gets people a win and proves trust. Core is where most of your revenue and results live. Premium is for buyers who want more access, speed, or done-with-you support. Each rung should solve a deeper version of the same problem — not a random side quest.",
          },
          {
            heading: "Continuity without clinging",
            body: "Once clients get results, some will want to stay. That might be a monthly check-in, a community, or a retainer for ongoing implementation. Design it when you see the pattern, not because Instagram said retainers are hot. Continuity should feel like the next helpful step.",
          },
          {
            heading: "Guard the core",
            body: "Until your core offer has closed a handful of times, do not invent a course, a membership, and a mastermind. Your job is proof. The ladder comes after evidence. Write the sketch now so you know where you're going — then sell the middle first.",
          },
        ],
        action:
          "Sketch your three-tier offer ladder with promise and price for each. Star the core offer you will sell for the next 90 days.",
        worksheetPrompt:
          "Entry / Core / Premium — promise + price. Continuity idea after results: ___",
      },
      {
        id: "startup-8",
        title: "Weekly founder rhythm",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Create a repeatable weekly loop you can run on autopilot",
          "Track leading indicators, not just revenue vibes",
          "Run a Friday review that captures wins and next moves",
          "Protect delivery without letting outreach disappear",
        ],
        sections: [
          {
            heading: "Your weekly rhythm",
            body: "Outreach, content, delivery, CEO review. Same four beats every week. Boring systems create exciting freedom. When the week has a shape, you stop reinventing your job every Monday morning while the dishwasher runs.",
          },
          {
            heading: "Leading indicators beat mood",
            body: "Revenue lags; conversations, invitations sent, and sessions delivered lead. Pick three numbers you will track weekly — for example: warm outreach sent, sales chats booked, invoices paid. Mood is data, but numbers are decisions.",
          },
          {
            heading: "Friday is for the CEO, not the guilt spiral",
            body: "Fifteen minutes: what worked, what stalled, what one thing moves next week. Write the wins even when they feel small. Proof compounds when you notice it. Then set next week's outreach and content targets before the weekend swallows your brain.",
          },
          {
            heading: "Protect the mix",
            body: "Delivery will always try to eat the calendar. Cap client work enough that outreach still happens. A full delivery week with zero conversations is a future dry spell wearing a productive costume. Balance is a schedule choice, not a personality trait.",
          },
        ],
        action:
          "Fill this week's CEO scorecard: outreach number, content plan, revenue goal, and Friday review time on the calendar.",
        worksheetPrompt:
          "This week's outreach / content / revenue goal / Friday review notes:",
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
        duration: 14,
        membersOnly: true,
        objectives: [
          "Separate your worth as a person from the price of an offer",
          "Spot undercharging patterns that show up as overwork",
          "Set a monthly revenue floor that makes the business worth it",
          "Name one money story you are retiring this quarter",
        ],
        sections: [
          {
            heading: "Price is information",
            body: "Undercharging trains the market to undervalue you and trains you to overwork. Your price teaches people how to treat the offer. A low price is not humility — it is often a strategy for avoiding rejection that costs you evenings with your kids.",
          },
          {
            heading: "Worth and price are different rooms",
            body: "You can be a whole, valuable human and still need to raise your rates. Mixing identity with pricing makes every no feel personal. Keep price in the business room: it is a tool for matching buyers who are ready with a container you can deliver well.",
          },
          {
            heading: "Set a floor",
            body: "What's the minimum monthly revenue that makes this worth your time — childcare, tools, taxes, and the mental load included? That is your floor, not your ceiling. If the business cannot clear the floor, something has to change: price, offer, volume, or the model itself.",
          },
          {
            heading: "Catch the undercharging tells",
            body: "You know the tells: adding free extras, apologizing before you name the number, 'friends and family' rates that never end. Write down your pattern. Awareness is not enough on its own — but without it, you will keep negotiating against yourself.",
          },
        ],
        action:
          "Write your monthly revenue floor and stretch goal, then list one undercharging habit you will stop for the next 30 days.",
        worksheetPrompt:
          "Floor $___ / stretch $___ / why those numbers / undercharging habit I'm retiring:",
      },
      {
        id: "money-2",
        title: "Pricing psychology that still feels like you",
        duration: 16,
        membersOnly: true,
        objectives: [
          "Anchor price to outcome value, not hours worked",
          "Use tiers without sleazy pressure tactics",
          "Test a price for a set window before you discount",
          "Write a value story you can say without cringing",
        ],
        sections: [
          {
            heading: "Outcome > hours",
            body: "Clients buy transformation, access, and relief — not your minutes. Price the result and the container that makes it likely. If you sell hours, you will always be arguing with your own calendar. If you sell outcomes, the conversation shifts to whether the change is worth it.",
          },
          {
            heading: "Tiers that help people choose",
            body: "Good tiers make the middle feel obvious: clear difference in access or speed, not fake scarcity theater. Two or three options beat a maze. You are guiding a decision, not tricking a stranger at a timeshare pitch.",
          },
          {
            heading: "Test before you discount",
            body: "Pick a price and hold it for a real test window — two weeks of conversations, not two quiet days. Discounting to soothe anxiety teaches buyers to wait. If no one buys, diagnose clarity and outreach before you slash the number.",
          },
          {
            heading: "Say the number like a CEO",
            body: "Practice the sentence: here's what's included, here's the investment, here's how we start. Warm is allowed; shrinking and apology sandwiches are not. Your nervous system needs reps as much as your pricing page does.",
          },
        ],
        action:
          "Run the Pricing Power calculator with real numbers, then write the one-sentence value story you will say on your next sales chat.",
        worksheetPrompt:
          "Old price / new price / value story I'll say / test window end date:",
      },
      {
        id: "money-3",
        title: "Cash flow basics",
        duration: 15,
        membersOnly: true,
        objectives: [
          "Map money in versus money out for the last 30 days",
          "Spot timing gaps between invoices and payments",
          "Create a simple weekly cash habit you can keep",
          "List what is owed to you and what you owe",
        ],
        sections: [
          {
            heading: "Profit ≠ cash in the account",
            body: "You can be 'profitable on paper' and still stressed if timing is off. A client who pays in 45 days does not fund this week's grocery run. Track weekly cash in, cash out, and what's owed to you. Clarity calms the spiral faster than another motivational post.",
          },
          {
            heading: "Do the 30-day dump",
            body: "Open your bank and payment apps. List every dollar that came in and went out for the last month. Categorize loosely: owner pay, tools, ads, contractors, taxes set-aside. Ugly honesty beats a pretty spreadsheet you never update.",
          },
          {
            heading: "Find the timing gaps",
            body: "Where does money get stuck? Late invoices, payment plans with no reminders, subscriptions that renew on the worst day of the month. Timing gaps are fixable with deposits, clearer due dates, and a weekly chase list. They are not character flaws.",
          },
          {
            heading: "One cash habit",
            body: "Pick a standing 20-minute block each week to update cash in, cash out, and receivables. Same day, same note. Consistency turns money from a mystery into a dashboard you can actually steer.",
          },
        ],
        action:
          "List the last 30 days of cash in and cash out, plus outstanding invoices. Put a recurring 20-minute cash check on your calendar.",
        worksheetPrompt:
          "Cash in / cash out / outstanding invoices / weekly cash check day:",
      },
      {
        id: "money-4",
        title: "Break-even clarity",
        duration: 14,
        membersOnly: true,
        objectives: [
          "List fixed monthly costs without wishful thinking",
          "Calculate contribution margin per sale",
          "Know how many units you need to break even",
          "Use break-even to set a sane sales target",
        ],
        sections: [
          {
            heading: "Know your number",
            body: "Break-even is freedom math. Once you know how many sales cover the bills, every sale after that is oxygen. Guessing keeps you anxious. A number lets you plan outreach like an adult with a calendar.",
          },
          {
            heading: "Fixed costs, honestly",
            body: "Software, phone, contractors on retainer, insurance, that 'tiny' subscription stack — list it all. Include a realistic owner draw if the business is supposed to feed your life. Hiding costs from yourself does not make them cheaper.",
          },
          {
            heading: "Contribution margin in plain English",
            body: "Price minus the variable cost to deliver one sale equals what contributes to covering fixed costs. If delivery eats most of the price in tools, ads, or contractor hours, you do not have a pricing problem only — you have a model problem.",
          },
          {
            heading: "Units to breathe",
            body: "Divide fixed costs by contribution margin per unit. That is your break-even volume. Put it next to your calendar capacity. If break-even requires more clients than you can serve well, raise price, simplify delivery, or cut costs — do not just 'hustle harder.'",
          },
        ],
        action:
          "Complete the Break-even calculator with real fixed costs and your current offer price. Write the unit number somewhere you will see it this week.",
        worksheetPrompt:
          "Fixed costs / price / variable cost / contribution margin / break-even units:",
      },
      {
        id: "money-5",
        title: "Profit snapshot",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Separate revenue from profit in one clear snapshot",
          "Identify margin leaks in tools, scope, and discounts",
          "Set a target margin percentage for this quarter",
          "Choose one leak to plug this month",
        ],
        sections: [
          {
            heading: "Margin is the mission",
            body: "Revenue is vanity if expenses eat it. A busy month that leaves nothing for taxes, savings, or your actual paycheck is not a win — it is a warning. Healthy service businesses protect contribution margin before lifestyle creep and shiny tools take over.",
          },
          {
            heading: "Build the snapshot",
            body: "Revenue minus cost of delivery minus operating expenses equals profit. Do it for this month, even if the numbers are rough. You are looking for direction, not IRS-ready perfection. Direction is enough to change behavior.",
          },
          {
            heading: "Hunt the leaks",
            body: "Common leaks: endless scope creep, discounts that became permanent, overlapping software, ads with no tracking, underpriced 'quick favors.' Circle the biggest one. One plugged leak beats a new income stream that arrives already dripping.",
          },
          {
            heading: "Pick a target margin",
            body: "Choose a margin percentage that funds owner pay, tax set-aside, and a little buffer. Write it down as a quarterly target. Then check offers and expenses against it before you say yes to the next 'small' cost.",
          },
        ],
        action:
          "Run Profit Snapshot for this month and circle one margin leak you will fix in the next 14 days.",
        worksheetPrompt:
          "Revenue / COGS / expenses / profit / margin % / leak I'm plugging:",
      },
      {
        id: "money-6",
        title: "Taxes-lite for solopreneurs",
        duration: 15,
        membersOnly: true,
        objectives: [
          "Open or reinforce a separate business account habit",
          "Set aside a tax percentage from every payment",
          "Know when DIY stops and a pro becomes worth it",
          "Build a simple receipt and income trail you can find in April",
        ],
        sections: [
          {
            heading: "Don't get surprised",
            body: "This is not tax advice — it's founder hygiene. Separate accounts, save a percentage of every payment, and book a real accountant when revenue gets serious. April panic is usually a systems problem that started in January.",
          },
          {
            heading: "Separate the money",
            body: "Business income hits a business account. You pay yourself on purpose. Mixing personal and business spending makes every tax conversation more expensive — in fees and in stress. If you have not separated yet, that is your first move this week.",
          },
          {
            heading: "Set-aside is a transfer, not a mood",
            body: "Pick a percentage and move it when money lands, not when you 'feel ready.' Automate if you can. The goal is that tax money never feels like spending money. Future-you at the kitchen table will not care that present-you wanted new branding.",
          },
          {
            heading: "Know when to call a pro",
            body: "Crossing into consistent revenue, hiring help, selling across borders, or feeling lost in quarterly estimates are all signals. A good accountant costs less than a surprise bill and a week of shame-spiraling. Bring them clean records. That is your job.",
          },
        ],
        action:
          "Choose your tax set-aside percentage, confirm where it lives, and automate or calendar a transfer habit after every payment.",
        worksheetPrompt:
          "Tax % I'll set aside / account setup next step / when I'll talk to a pro:",
      },
      {
        id: "money-7",
        title: "Runway & risk",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Calculate months of runway with honest burn",
          "Plan a cash buffer target that lets you sell without panic",
          "Decide what to cut versus what to invest this quarter",
          "Separate scary feelings from actual risk numbers",
        ],
        sections: [
          {
            heading: "Runway creates calm",
            body: "Knowing your runway lets you make bold offers without panic decisions. Calm founders sell better. Panic founders discount, overpromise, and take bad-fit clients. Math will not erase fear, but it will stop fear from driving the bus alone.",
          },
          {
            heading: "Honest burn",
            body: "Add up what the business (and the life it supports) spends in a typical month. Include the quiet stuff. Cash on hand divided by monthly burn is runway in months. Inflating cash or shrinking burn to feel better is how surprises get made.",
          },
          {
            heading: "Buffer is a goal, not a fantasy",
            body: "Pick a buffer target — often one to three months depending on your situation — and treat contributions like a bill. Buffer is what lets you wait for the right client instead of the loudest one. It is also what lets you sleep.",
          },
          {
            heading: "Cut vs invest",
            body: "List expenses in two columns: keeps the lights on versus grows revenue with a hypothesis, and cut vanity tools first. Invest only where you can name what you expect to happen. 'It might help' is not a hypothesis — 'This should book four extra calls' is.",
          },
        ],
        action:
          "Use the Runway calculator with honest burn, set a buffer goal, and cut or pause one expense that does not earn its keep.",
        worksheetPrompt:
          "Cash / monthly burn / runway months / buffer goal / one cut + one invest:",
      },
      {
        id: "money-8",
        title: "Reinvest like a CEO",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Split profit into pay, tax, reinvest, and save",
          "Fund growth on purpose with a clear hypothesis",
          "Avoid random tool spending dressed up as strategy",
          "Schedule owner pay so it is not leftovers",
        ],
        sections: [
          {
            heading: "Pay yourself on purpose",
            body: "A simple split beats vibes: owner pay, tax, reinvest, reserves. If 'pay yourself' is whatever is left on the 31st, you will always lose to software and impulse ads. CEOs get paid on a schedule. So do you.",
          },
          {
            heading: "Growth spending needs a hypothesis",
            body: "Before you buy a course, contractor, or ad boost, write what you expect it to change and how you will know in 14–30 days. No hypothesis, no spend. This one rule will save you more than most productivity tips.",
          },
          {
            heading: "Reserves are part of the plan",
            body: "Saving a slice of profit is not unambitious — it is how you stay in the game when a client churns or a launch is quiet. Name the percentage. Move it when profit hits, same as tax. Boring money habits fund brave offers.",
          },
          {
            heading: "Stop collecting tools",
            body: "If a tool does not clearly support sales, delivery, or money tracking, it is decoration. Put new subscriptions on a 48-hour pause. Ask whether a process change would beat a purchase. Often the answer is yes and cheaper.",
          },
        ],
        action:
          "Write your profit split percentages and put owner-pay and tax transfers on a recurring reminder.",
        worksheetPrompt:
          "Pay % / tax % / reinvest % / save % / next growth spend hypothesis:",
      },
      {
        id: "money-9",
        title: "Revenue goal reverse-engineering",
        duration: 16,
        membersOnly: true,
        objectives: [
          "Start from a real income goal, not a wish",
          "Back into sales needed at your actual price",
          "Build a weekly outreach target from close-rate math",
          "Turn the plan into this week's conversation quota",
        ],
        sections: [
          {
            heading: "Math before magic",
            body: "If you need $8k/month at $2k per client, you need four clients. If one in five conversations closes, you need about twenty conversations. Now you have a plan instead of a hope. Hope is not a go-to-market strategy.",
          },
          {
            heading: "Start from the life number",
            body: "What does the business need to clear for pay, taxes, and buffer? Work backward from that, not from what feels humble to ask. Humble goals that do not cover childcare and groceries are not virtuous. They are underbuilt.",
          },
          {
            heading: "Use your real close rate",
            body: "If you do not have data yet, start conservative — maybe one close in five or ten warm conversations — and update as you learn. Inflating your close rate to make the outreach number feel smaller is how quiet weeks happen.",
          },
          {
            heading: "Weekly quota or it is not real",
            body: "Divide conversations needed by weeks in the month. That number goes on the CEO scorecard. Missed quota is information: either outreach slipped, messaging is unclear, or the offer needs work. You cannot fix what you will not count.",
          },
        ],
        action:
          "Run the Revenue Goal calculator and set this week's outreach number on your calendar with specific days to send messages or book chats.",
        worksheetPrompt:
          "Goal / price / sales needed / assumed close rate / weekly conversations:",
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
        duration: 15,
        membersOnly: true,
        objectives: [
          "Name the transformation in plain language",
          "List inclusions clearly without fuzzy bonuses",
          "Define timeline, first step, and what done looks like",
          "Remove deliverables you cannot keep on a real week",
        ],
        sections: [
          {
            heading: "Clarity converts",
            body: "Confused buyers don't buy. Your package should answer: what do I get, how long, what happens first, and what does done look like? If she has to decode your offer, she will decode someone else's instead. Clarity is a sales skill.",
          },
          {
            heading: "Transformation first",
            body: "Lead with the change she wants, not the Zoom links. 'Leave with a priced offer and five warm conversations booked' beats 'six modules and a workbook.' Modules are the vehicle. The result is the reason she pays.",
          },
          {
            heading: "Inclusions that fit on one screen",
            body: "Five bullets max. If you need a novel to explain what's included, the offer is either bloated or unclear. Cut the fluff bonuses that dilute the promise. Strong packages feel focused, not stuffed like a gift bag from a conference.",
          },
          {
            heading: "Done looks like…",
            body: "Define the finish line in observable terms. She should know when she has gotten what she paid for. That protects both of you and makes testimonials easier later because you both agree on what success meant.",
          },
        ],
        action:
          "Rewrite your offer package in five bullets max, plus one sentence each for timeline, first step, and done.",
        worksheetPrompt:
          "Transformation / includes (≤5) / timeline / first step / done looks like:",
      },
      {
        id: "launch-2",
        title: "Your 7-day soft launch",
        duration: 16,
        membersOnly: true,
        objectives: [
          "Map a warm outreach list of people who already know you",
          "Plan one clear CTA per day for seven days",
          "Track conversations and replies, not likes",
          "Start Day 1 without waiting for perfect branding",
        ],
        sections: [
          {
            heading: "Warm before cold",
            body: "Start with people who already trust you. Soft launch is a week of invitations, not a viral moment. Your first dollars almost always come from warm rooms — old coworkers, clients-adjacent friends, community members who have watched you show up.",
          },
          {
            heading: "Build the list like a grown-up",
            body: "Write twenty names before you write fancy copy. Include why they might care and how you know them. If you cannot find twenty warm names, your network work starts there — but most women underestimate how many people already respect them.",
          },
          {
            heading: "One CTA a day",
            body: "Each day has one job: invite a conversation, share a proof point, or open spots. Multiple CTAs in one post confuse people. Simple wins. Put the plan in a checklist so Day 4 does not become 'stare at phone and panic.'",
          },
          {
            heading: "Measure what matters",
            body: "Likes are optional. Replies, booked chats, and payments are the scoreboard. If a post got applause but zero conversations, it was entertainment. Adjust toward invitations that ask for a next step.",
          },
        ],
        action:
          "Open the 7-day launch planner, write twenty warm names, and send or schedule Day 1's invitation today.",
        worksheetPrompt:
          "20 warm names + Day 1 message draft + how I'll track conversations:",
      },
      {
        id: "launch-3",
        title: "Outreach that feels human",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Write a warm DM opener that sounds like you",
          "Ask before you pitch so the conversation stays human",
          "Book discovery chats without turning into a billboard",
          "Use a simple follow-up line when people go quiet",
        ],
        sections: [
          {
            heading: "Conversation > campaign",
            body: "Lead with care and curiosity. People buy from women who listen, not women who blast. A soft launch message should feel like a thoughtful text, not a product drop into someone's DMs at dinner.",
          },
          {
            heading: "Opener, then ask",
            body: "Reference something real: their work, a recent post, a shared context. Then ask if they want to hear what you're offering or if a quick chat would help. Consent keeps your reputation clean and your close rate higher.",
          },
          {
            heading: "Invite to a chat, not a dissertation",
            body: "Your job in outreach is to open a door, not close the sale in one paragraph. Offer a short call or a few questions over text. Pressure makes people disappear. Clarity and warmth make people reply.",
          },
          {
            heading: "Follow up once like a pro",
            body: "People are busy. One kind follow-up is leadership, not nagging. Then release. Scripts in the vault are training wheels — edit them until they sound like something you would actually send from the school parking lot.",
          },
        ],
        action:
          "Send five warm messages today using a human opener, a clear ask, and your follow-up line saved for three days later.",
        worksheetPrompt:
          "My opener / my ask / follow-up line / five names I'm messaging:",
      },
      {
        id: "launch-4",
        title: "Sales chats that close",
        duration: 17,
        membersOnly: true,
        objectives: [
          "Run a simple discovery flow without a stiff script voice",
          "Mirror pain back so she feels understood",
          "Invite clearly with price, next step, and silence after the ask",
          "Take notes so delivery starts strong if she says yes",
        ],
        sections: [
          {
            heading: "Ask more than you pitch",
            body: "Discover the pain, mirror it, then invite them into the offer. Scripts are training wheels — personality closes. If you talk for eight minutes straight, you are performing. If you ask questions, you are selling.",
          },
          {
            heading: "A simple discovery flow",
            body: "Where are you now, what have you tried, what would better look like in 90 days, what happens if nothing changes. Those four lanes cover most chats. Listen for language you can use later in the invite so she hears her own words reflected.",
          },
          {
            heading: "Mirror, then invite",
            body: "Summarize what you heard in one tight paragraph, then present the offer as the bridge. Name the investment and how to start, then stop talking. Silence after the ask is not rude — it is respectful space for a decision.",
          },
          {
            heading: "Yes, no, and not yet",
            body: "A clear no is a gift. A maybe needs a next step or a release date. Do not orphan the conversation in polite fog. End every chat with clarity: paid start, scheduled follow-up, or a clean goodbye with the door open.",
          },
        ],
        action:
          "Practice a ten-minute discovery with a friend using three questions and one invite sentence. Record what felt awkward and rewrite those lines.",
        worksheetPrompt:
          "3 discovery questions + mirror sentence + invite sentence + price line:",
      },
      {
        id: "launch-5",
        title: "Handling objections without shrinking",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Normalize common objections so they stop spooking you",
          "Respond with clarity instead of apology",
          "Know when to release a buyer who is not ready",
          "Prepare honest answers for price, timing, and 'I need to think'",
        ],
        sections: [
          {
            heading: "Objections are information",
            body: "Price, timing, and 'I need to think' usually mean unclear value or fear. Answer honestly. Never beg. An objection is a chance to clarify — not a referendum on your worth as a mother, founder, or human.",
          },
          {
            heading: "Price without the shrink",
            body: "Reconnect the number to the outcome and the cost of staying stuck. Offer a payment plan only if you decided that in advance — not as a panic move mid-call. If the offer is wrong for her budget, say so kindly and release.",
          },
          {
            heading: "Timing and partners",
            body: "Busy is real, so ask what would need to be true to start in two weeks. Partner concerns deserve respect, not sales theatrics — offer a three-way chat or a one-pager, then let adults decide.",
          },
          {
            heading: "Release without burning the bridge",
            body: "Not now is allowed. Thank her, leave the door open, and go talk to the next warm lead. Clinging reads as desperation. Clean releases often come back later as yeses — or as referrals — because you stayed classy.",
          },
        ],
        action:
          "Write responses to your top three objections for price, timing, and partner/think-it-over. Practice them out loud once.",
        worksheetPrompt:
          "Objection → response for price / timing / partner-or-think:",
      },
      {
        id: "launch-6",
        title: "First $1k sprint",
        duration: 15,
        membersOnly: true,
        objectives: [
          "Define a 14-day plan aimed at your first $1k",
          "Focus daily energy on conversations that can close",
          "Celebrate proof over perfect branding",
          "Set a daily conversation quota and protect it",
        ],
        sections: [
          {
            heading: "Proof changes everything",
            body: "Your first dollars teach more than another week of branding. Sprint for conversations and closes. A paid client is a curriculum. A mood board is a delay tactic wearing cute fonts.",
          },
          {
            heading: "Build the 14-day plan",
            body: "Pick the offer, the price, the warm list, and the daily chat quota. Put outreach on the calendar before delivery work eats the day. Fourteen days is long enough to learn and short enough to stay honest.",
          },
          {
            heading: "Quota is the strategy",
            body: "Decide how many real conversations you need based on price and likely close rate. Then reverse into daily messages and follow-ups. If the quota feels scary, good — that usually means it is sized for an actual result.",
          },
          {
            heading: "Celebrate the ugly win",
            body: "First sales are rarely aesthetic. Take the screenshot, write the lesson, keep going. Proof lets you raise prices later and market with receipts instead of promises. Perfection can wait in the car.",
          },
        ],
        action:
          "Set a 14-day $1k target, choose the offer you will sell, and write a daily conversation quota on your scorecard starting tomorrow.",
        worksheetPrompt:
          "Target / offer / price / daily chats / Day 1–3 outreach plan:",
      },
      {
        id: "launch-7",
        title: "Onboarding that feels premium",
        duration: 13,
        membersOnly: true,
        objectives: [
          "Send a welcome note that sets tone and next steps",
          "Collect what you need once instead of chasing details",
          "Set expectations early for hours, response time, and homework",
          "Make the first 48 hours feel held and organized",
        ],
        sections: [
          {
            heading: "Delivery is marketing",
            body: "A clean onboarding experience creates testimonials and referrals. Make the first 48 hours feel held. Buyer's remorse loves silence. Confidence loves a clear 'here's what happens next' message that arrives fast.",
          },
          {
            heading: "Welcome with spine",
            body: "Thank her, restate the outcome, share the schedule, and tell her exactly what you need. Warm and structured beats gushy and vague. She hired you to lead. Lead from message one.",
          },
          {
            heading: "One intake, not a scavenger hunt",
            body: "Ask for goals, constraints, logins, and anything else you need in a single form or email. Chasing details across five threads makes you look disorganized and burns your CEO hours. Batch the ask. Confirm when you have everything.",
          },
          {
            heading: "Expectations prevent drama",
            body: "Restate client hours, response windows, and what she owes between sessions. Boundaries delivered early feel professional. Boundaries delivered mid-conflict feel personal. Choose early.",
          },
        ],
        action:
          "Draft your welcome note and onboarding checklist, including intake questions and the week-one plan you will send every new client.",
        worksheetPrompt:
          "Welcome note / intake questions / week-1 plan / expectations I'll state:",
      },
      {
        id: "launch-8",
        title: "Retention & referrals",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Ask for a testimonial while results are fresh",
          "Create a clear referral ask that is easy to say yes to",
          "Design a continuity offer for clients who want to keep going",
          "Time asks around wins, not around your cash anxiety",
        ],
        sections: [
          {
            heading: "Keep momentum growing",
            body: "Happy clients are your warmest channel, so ask clearly and offer continuity when results are landing. Most women wait for the 'perfect moment' and then never ask. Perfect is a shipped ask after a real win.",
          },
          {
            heading: "Testimonials without awkwardness",
            body: "Make it easy: two to three prompts, permission to use her name or initials, and a deadline. You can offer to draft from her words for approval. Reduce friction and you will actually get the quotes.",
          },
          {
            heading: "Referral asks that respect everyone",
            body: "Tell her who you're hoping to meet and what to send. A forwardable blurb beats 'know anyone?' Vague asks get vague results. Specific asks get introductions.",
          },
          {
            heading: "Continuity when it earns it",
            body: "If she is getting results and still has a next mountain, propose the next container. Do not invent retention to rescue your revenue if the work is done. Done well and referred out is also a win.",
          },
        ],
        action:
          "Write your testimonial ask, referral ask, and one continuity offer idea. Send the testimonial ask to a client who has had a win.",
        worksheetPrompt:
          "Testimonial ask / referral ask / continuity idea / who I'll ask first:",
      },
      {
        id: "launch-9",
        title: "Content that sells quietly",
        duration: 14,
        membersOnly: true,
        objectives: [
          "Teach one useful lesson each week in public",
          "End content with a soft CTA that invites a conversation",
          "Build a simple content loop you can repeat",
          "Stop measuring success only by likes and aesthetics",
        ],
        sections: [
          {
            heading: "Consistency beats virality",
            body: "One useful post and one invitation beats random aesthetic dumps. Teach, then invite. You do not need to become an influencer. You need to become findable and clear to people who already trust you.",
          },
          {
            heading: "Teach from the offer",
            body: "Every post can pull from a lesson you already deliver. Share a framework, a mistake, a before-and-after moment, or a decision prompt. Teaching builds authority without shouting 'BUY NOW' into the void every day.",
          },
          {
            heading: "Soft CTAs that still sell",
            body: "End with a next step: DM me 'READY,' book a chat, reply with your biggest stuck point. Soft is not invisible. Soft is specific and low-pressure. Invisible CTAs get invisible revenue.",
          },
          {
            heading: "A loop you can keep",
            body: "Weekly rhythm idea: one teaching post, one proof or story, one invitation. Repeat. Batch on your CEO block so content does not steal delivery time. A loop you keep beats a content calendar you abandon by Wednesday.",
          },
        ],
        action:
          "Plan four teaching posts for the next four weeks, each with one soft CTA tied to your offer.",
        worksheetPrompt:
          "4 post topics + CTA for each + day/time I'll batch them:",
      },
      {
        id: "launch-10",
        title: "From first sales to system",
        duration: 15,
        membersOnly: true,
        objectives: [
          "Productize what actually sold instead of inventing anew",
          "Document FAQ and delivery steps while they are fresh",
          "Book the next launch window on the calendar",
          "Turn one win into a repeatable path for the next buyers",
        ],
        sections: [
          {
            heading: "Repeat what worked",
            body: "After first sales, turn chaos into a checklist. Same offer, cleaner path, more confidence. The goal is not a new identity every month. The goal is a system that still sounds like you when you are tired.",
          },
          {
            heading: "Productize the proof",
            body: "What did buyers actually respond to — the promise, the timeline, the price, the DM script? Keep those. Drop the parts that only existed because you were nervous. Productizing means fewer decisions next time, not a colder personality.",
          },
          {
            heading: "Document while it's messy-fresh",
            body: "Write the FAQ answers you already gave. List delivery steps from payment to completion. Future-you should not have to reconstruct this from memory during nap time. A one-page SOP is enough to start.",
          },
          {
            heading: "Schedule the next launch",
            body: "Put the next soft-launch window on the calendar before the adrenaline fades, because systems need dates. Without a date, 'I'll launch again soon' becomes never. Soon is not a strategy — a week on the calendar is.",
          },
        ],
        action:
          "Create a one-page delivery SOP from your last win and put your next seven-day launch window on the calendar.",
        worksheetPrompt:
          "What sold / FAQ / delivery steps / next launch date / one thing I'm productizing:",
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
