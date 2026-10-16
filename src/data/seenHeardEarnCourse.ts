import type { StudioLesson, StudioTrack } from "../lib/studio";

const IMG = "/course/seen";
const HEARD_IMG = "/course/heard";
const EARN_IMG = "/course/earn";

function chapter(lesson: Omit<StudioLesson, "membersOnly" | "studio" | "videoUrl">): StudioLesson {
  return { ...lesson, membersOnly: true, videoUrl: "", studio: true };
}

/** Day 1 — Seen. chapters come from Becca's "SEEN · The Office" deck. */
export const SEEN_LESSONS: StudioLesson[] = [
  chapter({
    id: "she-seen-1",
    title: "Day 1 · Seen — Welcome in",
    duration: 5,
    objectives: [
      "Know what the next three days look like: Seen, Heard, Earn",
      "Understand why getting seen comes first",
    ],
    sections: [
      {
        heading: "Welcome to Day 1 · Seen. Heard. Earn.",
        body: "Welcome in, girls! I'm so delighted you're here. Over the next three days we're going to get you SEEN, HEARD, and then EARNING.\n\nToday is all about getting seen, because nobody can buy from you if they've never seen you. Today's topic: how to get seen on Instagram.",
        images: [{ src: `${IMG}/cover.jpg`, caption: "Day 1 · SEEN. How to get seen on Instagram" }],
      },
    ],
    action: "Tick this chapter off, then move straight on to “What are you building?”",
    worksheetPrompt: "What do you want to have by the end of these three days?",
  }),
  chapter({
    id: "she-seen-2",
    title: "Day 1 · Seen — What are you building?",
    duration: 10,
    objectives: [
      "Name what you want to sell, even if it's half-formed",
      "Decide who your community is (it can't be everyone)",
      "Be honest about what's been stopping you",
    ],
    sections: [
      {
        heading: "Tell us three things",
        body: "1. What do you want to sell?\nYour product, service or idea, even if it's only half-formed.\n\n2. Who is your community?\nYour target audience: the woman you want buying from you. It can't be everyone.\n\n3. What's stopping you?\nTime, confidence, money, or no idea where to start.",
      },
      {
        heading: "No judgement here",
        body: "I want to hear every single idea, big or small, finished or not. And the big one: who is your community? Who's the woman you want buying from you? Your community has to be women who are alike. It can't be everyone, so who is she? We've all been there.",
      },
      {
        heading: "No idea yet? Start here",
        body: "Here's a menu of what you can sell online once you've got a social media following:\n\n• Coaching: 1:1 online coaching, group programmes and challenges\n• Digital products: ebooks, guides, recipe books, plans, templates, courses\n• Community: paid memberships, subscription apps, live workshops\n• Brand work: brand deals, affiliate links and UGC content\n• Services: social media management for local businesses\n• Something else? Shout it out. There's room for every idea here.\n\nHave a think about which one lights you up, and we'll use it for the rest of today.",
      },
    ],
    action: "Write down your answers to the three questions: what you want to sell, who your community is, and what's stopping you.",
    worksheetPrompt: "I want to sell… My community is… What's stopping me is…",
  }),
  chapter({
    id: "she-seen-3",
    title: "Day 1 · Seen — Meet your girl",
    duration: 10,
    objectives: [
      "Picture the one woman you're talking to",
      "Remember: people buy results, not products",
    ],
    sections: [
      {
        heading: "Meet your girl",
        body: "This is your client, your customer, the one woman you're talking to. Nobody can buy from you if they've never seen you, and you can't be seen by the right women until you know who she is. Give her a name if it helps.",
      },
      {
        heading: "Four questions about her",
        body: "• Who is she? Her age, her stage of life, what her days look like.\n• What's keeping her up? The problem she'd happily pay to fix.\n• How's her life better? The result she's dreaming about, and what changes for her.\n• What would she search? The exact words she'd type into Instagram.",
      },
      {
        heading: "People don't buy products or coaching. They buy results.",
        body: "So show her how her life gets better. Every time, focus on how what you do is going to make her life better.",
      },
    ],
    action: "Give your girl a name and answer the four questions about her.",
    worksheetPrompt: "Her name… Who she is… What keeps her up… How her life gets better… What she'd search…",
  }),
  chapter({
    id: "she-seen-4",
    title: "Day 1 · Seen — Anatomy of a profile",
    duration: 10,
    objectives: [
      "Set up the five parts of your profile so she instantly gets what you do",
      "See how Becca's own page does it",
    ],
    sections: [
      {
        heading: "Top to bottom",
        body: "1. Profile photo. Your face, close up, good light. People follow people, so not a logo.\n2. Name field. Short, simple and catchy, so people recognise it as you every time.\n3. Bio. One strong sentence: who you are, what you do, how you can help. Catchy or straight to the point, both work.\n4. Link. One clear next step. Not ten options.\n5. Highlights. Keep them simple. Your business, not your holiday in Madagascar.",
      },
      {
        heading: "A mistake I made myself",
        body: "You think people want to see your holiday in Madagascar or your trip to Australia. They don't. They'll think the photos are lovely, but your business, your products and your coaching get lost in the mess. When she lands on your page, she should see you, what you do, and how you can help her.\n\nQuick test: hand your phone to someone for three seconds. Can they tell?",
      },
      {
        heading: "Here's mine",
        body: "• Name: just Becca. Short, simple, recognisable.\n• Bio: who I am, what I do and how I help, in one go, with an arrow pointing straight to my link.\n• Highlights: The Office, The Village, 1-1 Coaching, HOTMESS. Business only. No holidays.\n\nAnd on one of my posts, the hook is right there on screen from the first frame: “How do you not feel silly?” Everything on my page points her to what I do and how I can help her.",
        images: [
          { src: `${IMG}/becca-profile.jpg`, caption: "My profile: name, bio, one link, business-only highlights" },
          { src: `${IMG}/becca-best-post.jpg`, caption: "Hook on screen from the first frame" },
        ],
      },
    ],
    action: "Do the three-second test on your own profile, then fix your photo, name, bio, link and highlights.",
    worksheetPrompt: "My new bio (one sentence: who I am, what I do, how I help)…",
  }),
  chapter({
    id: "she-seen-5",
    title: "Day 1 · Seen — What gets you shown more",
    duration: 10,
    objectives: [
      "Know the four signals that grow you",
      "Know the job of each content format",
    ],
    sections: [
      {
        heading: "The signals Instagram rewards",
        body: "• Watch time: they watch to the end, or watch it twice.\n• Shares: they send it to a friend. A big sign it's worth showing to new people.\n• Saves: they save it to come back to later.\n• Comments: they stop and talk back to you.\n\nLikes are lovely. Shares, saves and watch time are what grow you. When someone watches to the end, sends your post to a friend, or saves it, that tells Instagram: show this to more people. So every post should make her want to do one of those.",
      },
      {
        heading: "Each format has a job",
        body: "Don't just post whatever.\n\n• Reels = REACH. Gets you in front of women who don't follow you yet.\n• Carousels = SAVES. Teach something so useful she keeps it.\n• Stories = TRUST. Show up most days for the women who already follow.\n• Collabs & Lives = SHARED REACH. Puts you in front of someone else's audience.",
      },
    ],
    action: "Look at your last five posts. Which signal was each one built for, and which format did it use?",
    worksheetPrompt: "A post she'd share… A post she'd save… A post she'd watch twice…",
  }),
  chapter({
    id: "she-seen-6",
    title: "Day 1 · Seen — Win the first 3 seconds",
    duration: 10,
    objectives: [
      "Write hooks that stop the scroll",
      "Put your hook on screen the clean, recognisable way",
    ],
    sections: [
      {
        heading: "The hook decides whether anyone sees the rest",
        body: "If the first three seconds don't grab her, she's gone and so is your reach. Say it out loud AND put it on screen from the very first frame, because loads of women are scrolling with the sound off.",
      },
      {
        heading: "Four hooks to steal",
        body: "• “Stop doing ___ if you want ___”\n• “Life got more fun when I did ___”\n• “The real reason your ___ isn't working”\n• “POV: you finally ___”",
      },
      {
        heading: "My hooks on screen",
        body: "Notice anything? Why they work:\n\n✓ Same font, every time, so when you see it you know it's me\n✓ Small and easy to read\n✓ Centred\n✓ Clean, not messy. No ten different colours, no giant text covering my face.\n\nClean, simple, and it does the job.",
        images: [
          { src: `${IMG}/hook-1.jpg`, caption: "180K views" },
          { src: `${IMG}/hook-2.jpg`, caption: "67.9K views" },
          { src: `${IMG}/hook-3.jpg`, caption: "316K views" },
          { src: `${IMG}/hook-4.jpg`, caption: "204K views" },
        ],
      },
    ],
    action: "Fill in all four hooks for your own business.",
    worksheetPrompt: "Stop doing ___ if you want ___… Life got more fun when I did ___… The real reason your ___ isn't working… POV: you finally ___…",
  }),
  chapter({
    id: "she-seen-7",
    title: "Day 1 · Seen — Get seen beyond your page",
    duration: 5,
    objectives: ["Use four ways to reach women who don't follow you yet"],
    sections: [
      {
        heading: "Your own page is only half of it",
        body: "• Collab posts: post together with someone whose followers are your kind of woman. It lands on both pages.\n• Comment like a human: leave real, thoughtful comments on the bigger accounts she already follows.\n• Keywords, not just hashtags: use the words she'd search in your captions, on-screen text and name field.\n• Go local: tag your location and team up with local businesses she already uses.\n\nAnd don't sleep on local.",
      },
    ],
    action: "Pick one account for a collab and leave three thoughtful comments on bigger accounts she follows.",
    worksheetPrompt: "Collab ideas… Accounts she follows… Keywords she'd search… Local businesses…",
  }),
  chapter({
    id: "she-seen-8",
    title: "Day 1 · Seen — Show up every day",
    duration: 5,
    objectives: ["Post every day and let the idea decide the format"],
    sections: [
      {
        heading: "Forget “Reel on a Monday, carousel on a Tuesday”",
        body: "1. Get the light bulb. “I feel like talking about that today.” That's your idea.\n2. Pick the format. Reel, carousel or stories. Whatever suits that idea best.\n3. Post it. Every single day. A Reel every day is grand too.\n\nNo rest days, no rigid plan. Show up every day and follow your creative side. Do what feels right that day.",
      },
    ],
    action: "Post something today, in whatever format suits your idea.",
    worksheetPrompt: "Today's light bulb… The format that suits it…",
  }),
  chapter({
    id: "she-seen-9",
    title: "Day 1 · Seen — Homework before Day 2",
    duration: 10,
    objectives: ["Finish your Day 1 homework and send it to Becca for review"],
    sections: [
      {
        heading: "Your homework",
        body: "☐ Describe your ideal client in half an A4 page. Who is she? What does she do? Where does she go? What does she wear? What does her world look like? What would she search for online, and what problems does she have?\n\n☐ Redecorate your Instagram and send it to me for review.\n\n☐ Give me three content ideas, like a funny Reel that hints at your business, or a straight-to-the-point carousel of tips and tricks.\n\n☐ The challenge: film and post one Reel with your hook on screen from the very first frame, write your own caption underneath, and send it to me for review.",
      },
      {
        heading: "Tomorrow: HEARD.",
        body: "Seen gets them to stop. Heard gets them to stay. Today was about getting them to stop scrolling. Tomorrow is HEARD: how to make them stay. See you then!",
      },
    ],
    action: "Do all four, send your profile and your Reel to Becca for review, then tick this chapter off.",
    worksheetPrompt: "My ideal client (half an A4 page)… My three content ideas…",
  }),
];

/** Day 2 — Heard. chapters come from Becca's "HEARD · The Office" deck. */
export const HEARD_LESSONS: StudioLesson[] = [
  chapter({
    id: "she-heard-1",
    title: "Day 2 · Heard — Welcome back",
    duration: 10,
    objectives: [
      "Know today's goal: make them stay and listen",
      "Share what you made for yesterday's homework",
    ],
    sections: [
      {
        heading: "Welcome to Day 2 · Seen. Heard. Earn.",
        body: "HEARD. How to make them stay and listen.",
        images: [{ src: `${HEARD_IMG}/cover.jpg`, caption: "Day 2 · HEARD. How to make them stay and listen" }],
      },
      {
        heading: "Show us what you made",
        body: "Let's go round and see yesterday's homework. Tell us:\n\n1. Your new profile\nWhat did you change, and why?\n\n2. Your challenge Reel\nWhat was your hook, and how did it do?\n\n3. Your content ideas\nWhich one are you most excited to make?",
      },
    ],
    action: "Share your new profile, your challenge Reel and your content ideas with the group.",
    worksheetPrompt: "What I changed on my profile… My hook and how it did… The idea I'm most excited to make…",
  }),
  chapter({
    id: "she-heard-2",
    title: "Day 2 · Heard — Seen vs heard",
    duration: 5,
    objectives: ["Know the difference between being seen and being heard"],
    sections: [
      {
        heading: "SEEN. She watched. She scrolled on.",
        body: "• A view\n• A like\n• Maybe a follow",
      },
      {
        heading: "HEARD. She stopped and listened.",
        body: "• She saves it\n• She sends it to a friend\n• She DMs you\n• She buys from you",
      },
      {
        heading: "Seen gets them to stop. Heard gets them to stay.",
        body: "",
      },
    ],
    action: "Look at your last few posts. Which ones got her to save, share or DM, not just like?",
    worksheetPrompt: "Posts that got me seen… Posts that got me heard…",
  }),
  chapter({
    id: "she-heard-3",
    title: "Day 2 · Heard — Find your voice",
    duration: 10,
    objectives: ["Write and speak in a voice that's unmistakably yours"],
    sections: [
      {
        heading: "Your voice is the one thing nobody can copy.",
        body: "Write it the way you'd say it out loud.",
      },
      {
        heading: "Four rules",
        body: "• Talk like you talk. Your words, your accent, your sayings.\n• Say what you think. Have opinions. Safe and bland gets scrolled past.\n• Show the real you. The messy kitchen, the bad days, the wins.\n• Be the same everywhere. Same you in Reels, captions, stories and DMs.",
      },
    ],
    action: "Write down three sayings or phrases you use all the time, and one opinion you hold about your topic.",
    worksheetPrompt: "Things I always say… An opinion I'm not afraid to share…",
  }),
  chapter({
    id: "she-heard-4",
    title: "Day 2 · Heard — Your story sells",
    duration: 10,
    objectives: ["Shape your story into a before, a turning point and a why"],
    sections: [
      {
        heading: "Your story in three parts",
        body: "01 Your before: where were you? What was hard?\n02 Your turning point: what changed? What did you learn?\n03 Your why: why do you do this now, and who for?",
      },
      {
        heading: "My story",
        body: "Built my business as a coach. Gained weight and lost 30kg. Had my baby, and lost 30kg again postpartum. Did it twice. Then all of a sudden I was a single mom, and I overcame that too.\n\nTurn your disasters into positives. Your story can inspire people you've never met.",
      },
    ],
    action: "Jot down your before, your turning point and your why in a few lines each.",
    worksheetPrompt: "My before… My turning point… My why…",
  }),
  chapter({
    id: "she-heard-5",
    title: "Day 2 · Heard — Your content pillars",
    duration: 5,
    objectives: ["Make every post you, then educational, entertaining or both"],
    sections: [
      {
        heading: "BE YOU.",
        body: "Always. Your voice, your face, your story in every single post.",
      },
      {
        heading: "Then make it…",
        body: "• EDUCATIONAL: be her problem solver. Show her a problem she didn't know she had, then fix it for her.\n• ENTERTAINING: funny, relatable, real life. She laughs or feels seen.\n• BOTH: teach her something in a way that makes her smile. The sweet spot.",
      },
    ],
    action: "Write one post idea for each pillar: educational, entertaining and both.",
    worksheetPrompt: "Educational idea… Entertaining idea… Both…",
  }),
  chapter({
    id: "she-heard-6",
    title: "Day 2 · Heard — Write captions like you talk",
    duration: 15,
    objectives: [
      "Write captions in your own voice, talking straight to her",
      "Make the first line do the work",
    ],
    sections: [
      {
        heading: "Example caption",
        body: "People know you're selling to them.\n\nSo what are you selling?\nAnd do you actually care about it?\n\nTalk as you.\nTo her.\n\nThat's how the right clients find you.",
      },
      {
        heading: "Five caption rules",
        body: "• First line stops the scroll. Like your friend just said it to you. Not an ad.\n• Talk to her, as you. Write it yourself. Not ChatGPT.\n• Short and spaced out. Short paragraphs. One-liners. Full stops.\n• Go easy on the emojis. Clean and easy to read wins.\n• Straight to the point. No humming and hawing.",
      },
      {
        heading: "The first line does the work",
        body: "This is what she sees before she taps 'more'. Your first line is:\n\n✓ One eye-catching line\n✓ Easy to read\n✓ Straight to the point\n✓ Makes her tap 'more'",
        images: [
          { src: `${HEARD_IMG}/caption-october-challenge.jpg`, caption: "“The October Challenge is now LIVE and only €15 for the next 3 days…”" },
          { src: `${HEARD_IMG}/caption-pre-baby-clothes.jpg`, caption: "“I'm so happy I kept my pre baby clothes…”" },
        ],
      },
      {
        heading: "Then when she taps in",
        body: "Clear. Easy to read. Direct. Talking straight to her.",
        images: [
          { src: `${HEARD_IMG}/caption-gym-nanny.jpg`, caption: "“Gym? Nope! Did I have a nanny? Nope.”" },
          { src: `${HEARD_IMG}/caption-bother-yourself.jpg`, caption: "“Bother yourself with exercise…”" },
        ],
      },
    ],
    action: "Rewrite the first line of your next caption so it sounds like a friend talking, not an ad.",
    worksheetPrompt: "My new first line… The rest of my caption, short and spaced out…",
  }),
  chapter({
    id: "she-heard-7",
    title: "Day 2 · Heard — Stories build trust",
    duration: 5,
    objectives: ["Use stories most days so she starts looking for you"],
    sections: [
      {
        heading: "Four ways to use your stories",
        body: "• Behind the scenes: your day, your work, your real life.\n• Polls and questions: ask her opinion. She'll tell you.\n• Show your face: talk to camera, even for 15 seconds.\n• Most days: show up often, so she starts looking for you.",
      },
      {
        heading: "Reels get you seen. Stories get you trusted.",
        body: "",
      },
    ],
    action: "Post a story today with your face to camera and a poll or question box.",
    worksheetPrompt: "Poll and question ideas for this week…",
  }),
  chapter({
    id: "she-heard-8",
    title: "Day 2 · Heard — Talk back",
    duration: 5,
    objectives: ["Turn comments and DMs into real conversations"],
    sections: [
      {
        heading: "What it looks like",
        body: "Her: “This is literally me after my second baby”\nYou: “Ah I hear you! How old is your youngest?”\nHer: “8 months. I've no energy at all”\nYou: “Okay, let's fix that. Can I ask you a few things?”",
      },
      {
        heading: "Four rules",
        body: "1. Reply to every comment. She took the time. Take it back.\n2. Ask a question back. Keep the conversation going.\n3. DM like a friend. Not a sales script. A real chat.\n4. Remember her. Use her name. Remember her story.",
      },
    ],
    action: "Reply to every comment from your last three posts and ask a question back.",
    worksheetPrompt: "Questions I can ask back…",
  }),
  chapter({
    id: "she-heard-9",
    title: "Day 2 · Heard — Give them a home",
    duration: 5,
    objectives: ["Turn followers into a community with a name, a place and a reason to stay"],
    sections: [
      {
        heading: "Build your community",
        body: "• Give it a name. The Village. HOTMESS. A name makes her feel part of something.\n• Give it a place. A broadcast channel, a group chat or an app, like my Girls Group Chat.\n• Give her a reason to stay. Wins, check-ins, lives and the inside jokes only you lot get.",
      },
      {
        heading: "Followers watch you. A community shows up for you.",
        body: "",
      },
    ],
    action: "Pick a name and a place for your community.",
    worksheetPrompt: "My community's name… Where it lives… Why she'll stay…",
  }),
  chapter({
    id: "she-heard-10",
    title: "Day 2 · Heard — Homework before Day 3",
    duration: 10,
    objectives: ["Finish your Day 2 homework and send it to Becca for review"],
    sections: [
      {
        heading: "Your homework",
        body: "☐ Write your story in half an A4 page. Your before, your turning point and your why.\n\n☐ Rewrite one old caption. New first line, short and spaced out, talking straight to her.\n\n☐ Show up on your stories every day, with at least one poll or question box.\n\n☐ The challenge: post your story as a Reel or carousel, with a caption written by you, and send it to me for review.",
      },
      {
        heading: "Tomorrow: EARN.",
        body: "Heard gets them to stay. Earn gets them to buy.",
      },
    ],
    action: "Do all four, send your story post to Becca for review, then tick this chapter off.",
    worksheetPrompt: "My story (half an A4 page)… My rewritten caption…",
  }),
];

/** Day 3 — Earn. chapters come from Becca's "EARN · Day 3" deck. */
export const EARN_LESSONS: StudioLesson[] = [
  chapter({
    id: "she-earn-1",
    title: "Day 3 · Earn — Welcome back",
    duration: 10,
    objectives: [
      "Know today's goal: turn followers into paying clients",
      "Share what you made for yesterday's homework",
    ],
    sections: [
      {
        heading: "Welcome to Day 3 · Seen. Heard. Earn.",
        body: "EARN. How to turn followers into paying clients.",
        images: [{ src: `${EARN_IMG}/cover.jpg`, caption: "Day 3 · EARN. How to turn followers into paying clients" }],
      },
      {
        heading: "Show us what you made",
        body: "Let's go round and see yesterday's homework. Tell us:\n\n1. Your story post\nHow did it feel to share it? What did people say?\n\n2. Your new caption\nRead us your first line.\n\n3. Your stories\nWhat did your poll or question box tell you?",
      },
      {
        heading: "Before we start: you're allowed to make money.",
        body: "If you're genuinely helping her, charging for it isn't greedy. It's a business.",
      },
    ],
    action: "Share your story post, your new first line and what your stories told you.",
    worksheetPrompt: "How sharing my story felt… What my poll or question box told me…",
  }),
  chapter({
    id: "she-earn-2",
    title: "Day 3 · Earn — Build your offer ladder",
    duration: 10,
    objectives: ["Give her a way in at every level"],
    sections: [
      {
        heading: "Every follower is at a different step",
        body: "Give her a way in at every level.\n\n• FREE: your content, stories and group chat\n• LOW PRICE: a challenge, like my €15 October Challenge\n• MONTHLY: a subscription, like The Village app\n• PREMIUM: 1-1 coaching, the full you",
      },
    ],
    action: "Fill in one offer for each step of your ladder.",
    worksheetPrompt: "Free… Low price… Monthly… Premium…",
  }),
  chapter({
    id: "she-earn-3",
    title: "Day 3 · Earn — Your offer in one sentence",
    duration: 10,
    objectives: ["Say who it's for, the result and the pain it removes, in one sentence"],
    sections: [
      {
        heading: "The formula",
        body: "I help [her] get [result] without [the pain].",
      },
      {
        heading: "Mine",
        body: "I help moms get fit at home in 20-30 minutes a day, without a gym or a nanny.\n\n✓ Who it's for. Your girl, not everyone.\n✓ The result. People buy results, remember.\n✓ The pain it removes. What she won't have to do.",
      },
    ],
    action: "Write your offer in one sentence using the formula.",
    worksheetPrompt: "I help ___ get ___ without ___.",
  }),
  chapter({
    id: "she-earn-4",
    title: "Day 3 · Earn — Price it with confidence",
    duration: 5,
    objectives: ["Set a price you can stand behind"],
    sections: [
      {
        heading: "Three steps",
        body: "• Know your numbers. What does it cost you in time and money to deliver it?\n• Look at the market. What do others charge? Decide where you fit.\n• Start, then raise. A launch price gets you started. Raise it as the results come in.",
      },
      {
        heading: "Cheap doesn't mean more sales. Clear value does.",
        body: "",
      },
    ],
    action: "Work out what your offer costs you to deliver and set your launch price.",
    worksheetPrompt: "My cost in time and money… What others charge… My launch price…",
  }),
  chapter({
    id: "she-earn-5",
    title: "Day 3 · Earn — Sell like you talk",
    duration: 5,
    objectives: ["Sell in your own voice, with proof and a clear ask"],
    sections: [
      {
        heading: "Four things every sales post does",
        body: "• Show results. Client wins and your own journey. Proof sells.\n• Show the inside. What's in it? What does a week look like?\n• Answer her doubts. No time? No money? Will it work for me?\n• Ask clearly. Tell her exactly what to do. Link in bio. DM me.",
      },
      {
        heading: "People know you're selling. Just be you while you do it.",
        body: "",
      },
    ],
    action: "List the three doubts your girl has, and how you'd answer each.",
    worksheetPrompt: "Her doubts… My answers…",
  }),
  chapter({
    id: "she-earn-6",
    title: "Day 3 · Earn — Give her a reason to act now",
    duration: 10,
    objectives: ["Use real deadlines, launch prices and bonuses"],
    sections: [
      {
        heading: "Three reasons to act now",
        body: "• A deadline: “You have 24 hours left to join me for September.”\n• A launch price: “The October Challenge is now LIVE and only €15 for the next 3 days.”\n• A bonus: “…and a chance to win €150!”",
        images: [
          { src: `${HEARD_IMG}/caption-gym-nanny.jpg`, caption: "A deadline: “You have 24 hours left to join me for September”" },
          { src: `${HEARD_IMG}/caption-october-challenge.jpg`, caption: "A launch price: “only €15 for the next 3 days”" },
          { src: `${HEARD_IMG}/caption-bother-yourself.jpg`, caption: "A bonus: “a chance to win €150”" },
        ],
      },
      {
        heading: "The one rule: only say it if it's true.",
        body: "Fake deadlines break the trust you built on Day 2.\n\nWithout a reason to act now, 'I'll do it later' becomes never.",
      },
    ],
    action: "Decide your real reason to act now: a deadline, a launch price or a bonus.",
    worksheetPrompt: "My deadline… My launch price… My bonus…",
  }),
  chapter({
    id: "she-earn-7",
    title: "Day 3 · Earn — A simple launch",
    duration: 10,
    objectives: ["Run a four-step launch you can repeat every month"],
    sections: [
      {
        heading: "Four steps",
        body: "1. Tease. Talk about the problem. Polls and questions on stories.\n2. Open. Doors open. Tell her what it is and the launch price.\n3. Prove. Results, wins and behind the scenes, every day.\n4. Last call. 48 hours left. 24 hours left. Doors closing.",
      },
      {
        heading: "Then do it again next month. Every launch gets easier.",
        body: "",
      },
    ],
    action: "Put dates on your tease, open, prove and last call.",
    worksheetPrompt: "Tease… Open… Prove… Last call…",
  }),
  chapter({
    id: "she-earn-8",
    title: "Day 3 · Earn — Turn DMs into clients",
    duration: 5,
    objectives: ["Turn a DM into a sale without a sales script"],
    sections: [
      {
        heading: "What it looks like",
        body: "Her: “Is the challenge good if I've never trained before?”\nYou: “Love that you asked! What's your goal right now?”\nHer: “Just to feel like myself again after my baby”\nYou: “That's exactly who it's for! Here's the link.”",
      },
      {
        heading: "Four steps",
        body: "1. Start the chat. Ask them to comment or DM you a word.\n2. Listen first. Ask about her and her goal before you pitch.\n3. Match her to the right offer. Use your ladder.\n4. Send the link. Then follow up once, kindly.",
      },
    ],
    action: "Pick the word you'll ask people to comment or DM you.",
    worksheetPrompt: "My DM word… The questions I'll ask before I pitch…",
  }),
  chapter({
    id: "she-earn-9",
    title: "Day 3 · Earn — Make it easy to pay",
    duration: 5,
    objectives: ["Make paying take a few taps"],
    sections: [
      {
        heading: "Three checks",
        body: "• One clear link. Your bio link goes straight to your offer. No hunting.\n• A few taps. Test it on your phone. If it's fiddly, she'll give up.\n• Tell her where. 'Link in bio.' 'Tap the link.' Say it every time.",
      },
      {
        heading: "She's ready to buy. Don't make her work for it.",
        body: "",
      },
    ],
    action: "Test your bio link on your phone, from tap to paid.",
    worksheetPrompt: "How many taps it took… What I'll fix…",
  }),
  chapter({
    id: "she-earn-10",
    title: "Day 3 · Earn — Results keep them coming back",
    duration: 5,
    objectives: ["Turn happy clients into your best marketing"],
    sections: [
      {
        heading: "Three habits",
        body: "• Deliver what you promised. Then a little more. Over-deliver.\n• Celebrate her wins. Share them, with her permission. That's your proof.\n• Offer the next step. Challenge, then app, then 1-1. Your ladder again.",
      },
      {
        heading: "Happy clients are your best marketing.",
        body: "",
      },
    ],
    action: "Plan one way you'll over-deliver for your first clients.",
    worksheetPrompt: "How I'll over-deliver… How I'll share her wins… Her next step…",
  }),
  chapter({
    id: "she-earn-11",
    title: "Day 3 · Earn — Your next 7 days",
    duration: 10,
    objectives: ["Make your first sale, or your next one"],
    sections: [
      {
        heading: "Your next 7 days",
        body: "☐ Write your offer in one sentence. I help [her] get [result] without [the pain].\n\n☐ Set your price and make sure your link takes her straight to it.\n\n☐ Run a mini launch: tease, open, prove, last call.\n\n☐ The challenge: make your first sale, or your next one, and send me your launch post for review.",
      },
      {
        heading: "SEEN. HEARD. NOW GO EARN.",
        body: "You've got this, girls.",
      },
    ],
    action: "Do all four, send your launch post to Becca for review, then tick this chapter off.",
    worksheetPrompt: "My offer sentence… My price… My launch dates…",
  }),
];

/** Scaffold for Seen. Heard. Earn. — published; portal gates until courses open for buyers. */
export const SEEN_HEARD_EARN_TRACK: StudioTrack = {
  id: "seen-heard-earn",
  title: "Seen. Heard. Earn.",
  blurb:
    "Your 3-day brand workshop — lifetime access in The Office.",
  badge: "3-day workshop",
  membersOnly: true,
  published: true,
  studio: true,
  lessons: [
    ...SEEN_LESSONS,
    ...HEARD_LESSONS,
    ...EARN_LESSONS,
  ],
};
