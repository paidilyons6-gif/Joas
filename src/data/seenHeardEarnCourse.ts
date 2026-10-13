import type { StudioLesson, StudioTrack } from "../lib/studio";

const IMG = "/course/seen";

function seen(lesson: Omit<StudioLesson, "membersOnly" | "studio" | "videoUrl">): StudioLesson {
  return { ...lesson, membersOnly: true, videoUrl: "", studio: true };
}

/** Day 1 — Seen. chapters come from Becca's "SEEN · The Office" deck. */
export const SEEN_LESSONS: StudioLesson[] = [
  seen({
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
  seen({
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
  seen({
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
  seen({
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
  seen({
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
  seen({
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
  seen({
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
  seen({
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
  seen({
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
    {
      id: "she-day-2",
      title: "Day 2 — Heard.",
      duration: 45,
      membersOnly: true,
      videoUrl: "",
      objectives: ["Shape a message people actually remember"],
      sections: [
        {
          heading: "Welcome to Day 2",
          body: "Today we get you Heard. — voice, offer language, and the words that convert.",
        },
      ],
      action: "Draft your core offer paragraph out loud, then tighten it.",
      worksheetPrompt: "Message and offer notes…",
      studio: true,
    },
    {
      id: "she-day-3",
      title: "Day 3 — Earn.",
      duration: 45,
      membersOnly: true,
      videoUrl: "",
      objectives: ["Connect your brand to paid opportunities"],
      sections: [
        {
          heading: "Welcome to Day 3",
          body: "Today we get you Earn. — pricing confidence and the path from attention to income.",
        },
      ],
      action:
        "Write your next paid ask and who you will send it to this week.",
      worksheetPrompt: "Earn plan notes…",
      studio: true,
    },
  ],
};
