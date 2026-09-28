export type SiteLook = {
  heroImageUrl: string;
  bandImageUrl: string;
  colorSignature: string;
  colorSoft: string;
  colorEnergy: string;
  colorClarity: string;
  colorClean: string;
  colorInk: string;
};

export const DEFAULT_SITE_LOOK: SiteLook = {
  heroImageUrl: "/hero.jpg",
  bandImageUrl: "/band.jpg",
  colorSignature: "#ff2d8b",
  colorSoft: "#ffc1e3",
  colorEnergy: "#ffe600",
  colorClarity: "#a5e8f3",
  colorClean: "#f8f8f6",
  colorInk: "#1a1a1a",
};

const LOOK_KEY = "bbb_site_look_v1";
const EVENT = "bbb-look-updated";

function isHex(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}

export function normalizeLook(partial?: Partial<SiteLook> | null): SiteLook {
  const merged = { ...DEFAULT_SITE_LOOK, ...(partial || {}) };
  for (const key of [
    "colorSignature",
    "colorSoft",
    "colorEnergy",
    "colorClarity",
    "colorClean",
    "colorInk",
  ] as const) {
    if (!isHex(merged[key])) merged[key] = DEFAULT_SITE_LOOK[key];
  }
  if (!merged.heroImageUrl.trim()) merged.heroImageUrl = DEFAULT_SITE_LOOK.heroImageUrl;
  if (!merged.bandImageUrl.trim()) merged.bandImageUrl = DEFAULT_SITE_LOOK.bandImageUrl;
  return merged;
}

function readLocal(): SiteLook {
  try {
    const raw = localStorage.getItem(LOOK_KEY);
    if (!raw) return { ...DEFAULT_SITE_LOOK };
    return normalizeLook(JSON.parse(raw) as Partial<SiteLook>);
  } catch {
    return { ...DEFAULT_SITE_LOOK };
  }
}

export function applySiteLook(look: SiteLook) {
  const root = document.documentElement;
  root.style.setProperty("--signature", look.colorSignature);
  root.style.setProperty("--soft", look.colorSoft);
  root.style.setProperty("--energy", look.colorEnergy);
  root.style.setProperty("--clarity", look.colorClarity);
  root.style.setProperty("--clean", look.colorClean);
  root.style.setProperty("--ink", look.colorInk);
}

export const siteLookStore = {
  get(): SiteLook {
    return readLocal();
  },
  save(look: SiteLook) {
    const next = normalizeLook(look);
    localStorage.setItem(LOOK_KEY, JSON.stringify(next));
    applySiteLook(next);
    window.dispatchEvent(new Event(EVENT));
    return next;
  },
  eventName: EVENT,
};
