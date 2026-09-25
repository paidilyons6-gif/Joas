export type DemoUser = {
  id: string;
  email: string;
  name: string;
  /** @deprecated Office membership — prefer programs */
  plan: "none" | "monthly" | "annual";
  /** Program slugs the user has purchased */
  programs: string[];
  createdAt: string;
  completedLessons: string[];
};

export type ToolDrafts = {
  "offer-builder"?: Record<string, string>;
  "ideal-client"?: Record<string, string>;
  "launch-planner"?: { checked: string[] };
  "ceo-scorecard"?: Record<string, string>;
};

export type CalcState = Record<string, Record<string, number | string>>;

const SESSION_KEY = "bbb_demo_session_v1";
const DRAFTS_KEY = "bbb_tool_drafts_v1";
const CALC_KEY = "bbb_calc_state_v1";

function normalizeUser(raw: Partial<DemoUser> & { email: string }): DemoUser {
  const programs = Array.isArray(raw.programs) ? raw.programs : [];
  // Migrate old Office plan → treat as owning a legacy "office" entitlement only if needed
  return {
    id: raw.id || crypto.randomUUID(),
    email: raw.email,
    name: raw.name || "Member",
    plan: raw.plan || "none",
    programs,
    createdAt: raw.createdAt || new Date().toISOString(),
    completedLessons: Array.isArray(raw.completedLessons)
      ? raw.completedLessons
      : [],
  };
}

function readUser(): DemoUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoUser> & { email: string };
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

function writeUser(user: DemoUser | null) {
  if (!user) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const demoStore = {
  getUser: readUser,
  signUp(input: { email: string; name: string; password: string }): DemoUser {
    void input.password;
    const user = normalizeUser({
      id: crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.name.trim() || "Member",
      plan: "none",
      programs: [],
      createdAt: new Date().toISOString(),
      completedLessons: [],
    });
    writeUser(user);
    return user;
  },
  signIn(input: { email: string; password: string }): DemoUser {
    void input.password;
    const existing = readUser();
    if (existing && existing.email === input.email.trim().toLowerCase()) {
      return existing;
    }
    const user = normalizeUser({
      id: crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.email.split("@")[0] || "Member",
      plan: existing?.plan ?? "none",
      programs: existing?.programs ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      completedLessons: existing?.completedLessons ?? [],
    });
    writeUser(user);
    return user;
  },
  signOut() {
    writeUser(null);
  },
  update(user: DemoUser) {
    writeUser(normalizeUser(user));
    return readUser()!;
  },
  setPlan(plan: DemoUser["plan"]) {
    const user = readUser();
    if (!user) throw new Error("Not signed in");
    return this.update({ ...user, plan });
  },
  grantProgram(slug: string) {
    const user = readUser();
    if (!user) throw new Error("Not signed in");
    const id = slug.trim().toLowerCase();
    if (!id) return user;
    if (user.programs.includes(id)) return user;
    return this.update({ ...user, programs: [...user.programs, id] });
  },
  hasProgram(slug: string) {
    const user = readUser();
    return Boolean(user?.programs.includes(slug.trim().toLowerCase()));
  },
  toggleLesson(lessonId: string) {
    const user = readUser();
    if (!user) throw new Error("Not signed in");
    const has = user.completedLessons.includes(lessonId);
    const completedLessons = has
      ? user.completedLessons.filter((id) => id !== lessonId)
      : [...user.completedLessons, lessonId];
    return this.update({ ...user, completedLessons });
  },
  getToolDrafts(): ToolDrafts {
    return readJson(DRAFTS_KEY, {});
  },
  saveToolDraft<K extends keyof ToolDrafts>(key: K, value: ToolDrafts[K]) {
    const drafts = this.getToolDrafts();
    drafts[key] = value;
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return drafts;
  },
  getCalcState(): CalcState {
    return readJson(CALC_KEY, {});
  },
  saveCalcState(id: string, values: Record<string, number | string>) {
    const state = this.getCalcState();
    state[id] = values;
    localStorage.setItem(CALC_KEY, JSON.stringify(state));
    return state;
  },
};

export function hasLiveBackend() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
}

export function hasStripe() {
  return Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
}
