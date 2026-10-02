import type { StudioTrack } from "../lib/studio";

/** Scaffold for Seen. Heard. Earn. — published; portal gates until Oct 14 for buyers. */
export const SEEN_HEARD_EARN_TRACK: StudioTrack = {
  id: "seen-heard-earn",
  title: "Seen. Heard. Earn.",
  blurb:
    "Your 3-day brand workshop — lifetime access in The Office. Opens October 14th.",
  badge: "3-day workshop",
  membersOnly: true,
  published: true,
  studio: true,
  lessons: [
    {
      id: "she-day-1",
      title: "Day 1 — Seen.",
      duration: 45,
      membersOnly: true,
      videoUrl: "",
      objectives: ["Get clear on how you want to be seen as a brand"],
      sections: [
        {
          heading: "Welcome to Day 1",
          body: "Today we get you Seen. — the brand presence that makes people stop scrolling and pay attention. Becca can replace this teaching and add video in Studio before October 14.",
        },
      ],
      action:
        "Write one sentence that says who you help and what they walk away with.",
      worksheetPrompt: "Brand visibility notes…",
      studio: true,
    },
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
          body: "Today we get you Heard. — voice, offer language, and the words that convert. Full lesson content can be edited in Studio before October 14.",
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
          body: "Today we get you Earn. — pricing confidence and the path from attention to income. Full lesson content can be edited in Studio before October 14.",
        },
      ],
      action:
        "Write your next paid ask and who you will send it to this week.",
      worksheetPrompt: "Earn plan notes…",
      studio: true,
    },
  ],
};
