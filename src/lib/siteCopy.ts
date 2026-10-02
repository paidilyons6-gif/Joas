export type SiteCopy = {
  heroHeadline: string;
  heroLede: string;
  heroCtaGuest: string;
  heroCtaMember: string;
  heroCtaSecondary: string;
  manifestoEyebrow: string;
  manifestoTitle: string;
  manifestoAccent: string;
  manifestoCopy: string;
  checklist: string[];
  pillarsEyebrow: string;
  pillarsTitle: string;
  pillarsTitleEm: string;
  pillarsCopy: string;
  bandTitle: string;
  bandTitleEm: string;
  bandCopy: string;
  offerEyebrow: string;
  offerTitle: string;
  offerTitleEm: string;
  offerCopy: string;
};

export const DEFAULT_SITE_COPY: SiteCopy = {
  heroHeadline: "Welcome to The Office.",
  heroLede:
    "The support system for women building companies — training, community, and a portal that helps you ship, not just dream.",
  heroCtaGuest: "Let's do this →",
  heroCtaMember: "Open your portal →",
  heroCtaSecondary: "Programs",
  manifestoEyebrow: "Becky Lyons",
  manifestoTitle: "Build the damn business.",
  manifestoAccent: "Your seat at The Office ♡",
  manifestoCopy:
    "Practical tools. Real conversations. Big results. This is where you get help with offers, launches, and growth — so you don't have to figure it out alone.",
  checklist: [
    "Bigger income",
    "A life I love",
    "Helping others",
    "Proud of me",
    "Freedom",
    "Same girl, bigger plans ♡",
  ],
  pillarsEyebrow: "The mix",
  pillarsTitle: "Ambitious. Unfiltered.",
  pillarsTitleEm: "Yours.",
  pillarsCopy:
    "Sign up free, buy the program, and get in — courses with video, tools, and Business Meeting (your program community).",
  bandTitle: "Bigger plans start in",
  bandTitleEm: "The Office.",
  bandCopy:
    "Create your account, pick a program on the site, and unlock your seat. Becca edits the program and adds videos in Studio.",
  offerEyebrow: "Inside The Office",
  offerTitle: "Progress over",
  offerTitleEm: "perfection.",
  offerCopy:
    "Program courses (with video lessons), financial calculators, worksheets, and Business Meeting — unlocked when you buy.",
};

const COPY_KEY = "bbb_site_copy_v1";

function readLocal(): SiteCopy {
  try {
    const raw = localStorage.getItem(COPY_KEY);
    if (!raw) return { ...DEFAULT_SITE_COPY };
    const parsed = JSON.parse(raw) as Partial<SiteCopy>;
    return {
      ...DEFAULT_SITE_COPY,
      ...parsed,
      checklist: Array.isArray(parsed.checklist)
        ? parsed.checklist
        : DEFAULT_SITE_COPY.checklist,
    };
  } catch {
    return { ...DEFAULT_SITE_COPY };
  }
}

export const siteCopyStore = {
  get(): SiteCopy {
    return readLocal();
  },
  save(copy: SiteCopy) {
    localStorage.setItem(COPY_KEY, JSON.stringify(copy));
    window.dispatchEvent(new Event("bbb-copy-updated"));
    return copy;
  },
};
