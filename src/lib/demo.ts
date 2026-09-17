export type DemoUser = {
  id: string;
  email: string;
  name: string;
  plan: "none" | "monthly" | "annual";
  createdAt: string;
  completedLessons: string[];
};

const STORAGE_KEY = "bbb_demo_session_v1";

function read(): DemoUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

function write(user: DemoUser | null) {
  if (!user) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export const demoStore = {
  getUser: read,
  signUp(input: { email: string; name: string; password: string }): DemoUser {
    void input.password;
    const user: DemoUser = {
      id: crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.name.trim() || "Member",
      plan: "none",
      createdAt: new Date().toISOString(),
      completedLessons: [],
    };
    write(user);
    return user;
  },
  signIn(input: { email: string; password: string }): DemoUser {
    void input.password;
    const existing = read();
    if (existing && existing.email === input.email.trim().toLowerCase()) {
      return existing;
    }
    const user: DemoUser = {
      id: crypto.randomUUID(),
      email: input.email.trim().toLowerCase(),
      name: input.email.split("@")[0] || "Member",
      plan: existing?.plan ?? "none",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      completedLessons: existing?.completedLessons ?? [],
    };
    write(user);
    return user;
  },
  signOut() {
    write(null);
  },
  update(user: DemoUser) {
    write(user);
    return user;
  },
  setPlan(plan: DemoUser["plan"]) {
    const user = read();
    if (!user) throw new Error("Not signed in");
    return this.update({ ...user, plan });
  },
  toggleLesson(lessonId: string) {
    const user = read();
    if (!user) throw new Error("Not signed in");
    const has = user.completedLessons.includes(lessonId);
    const completedLessons = has
      ? user.completedLessons.filter((id) => id !== lessonId)
      : [...user.completedLessons, lessonId];
    return this.update({ ...user, completedLessons });
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
