import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { demoStore, hasLiveBackend, type DemoUser } from "./demo";
import { getSupabase } from "./supabase";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  plan: "none" | "monthly" | "annual";
  completedLessons: string[];
  mode: "demo" | "live";
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  mode: "demo" | "live";
  signUp: (input: { email: string; password: string; name: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  activatePlan: (plan: "monthly" | "annual") => Promise<void>;
  toggleLesson: (lessonId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: DemoUser, mode: "demo" | "live"): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    completedLessons: user.completedLessons,
    mode,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const live = hasLiveBackend();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!live) {
      const demo = demoStore.getUser();
      setUser(demo ? toAuthUser(demo, "demo") : null);
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan, completed_lessons")
      .eq("id", sessionUser.id)
      .maybeSingle();

    setUser({
      id: sessionUser.id,
      email: sessionUser.email ?? "",
      name: profile?.full_name || sessionUser.user_metadata?.full_name || "Member",
      plan: (profile?.plan as AuthUser["plan"]) || "none",
      completedLessons: (profile?.completed_lessons as string[]) || [],
      mode: "live",
    });
    setLoading(false);
  }, [live]);

  useEffect(() => {
    void refresh();
    if (!live) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [live, refresh]);

  const signUp = useCallback(
    async (input: { email: string; password: string; name: string }) => {
      if (!live) {
        setUser(toAuthUser(demoStore.signUp(input), "demo"));
        return;
      }
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { full_name: input.name } },
      });
      if (error) throw error;
      await refresh();
    },
    [live, refresh],
  );

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      if (!live) {
        setUser(toAuthUser(demoStore.signIn(input), "demo"));
        return;
      }
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured");
      const { error } = await supabase.auth.signInWithPassword(input);
      if (error) throw error;
      await refresh();
    },
    [live, refresh],
  );

  const signOut = useCallback(async () => {
    if (!live) {
      demoStore.signOut();
      setUser(null);
      return;
    }
    const supabase = getSupabase();
    await supabase?.auth.signOut();
    setUser(null);
  }, [live]);

  const activatePlan = useCallback(
    async (plan: "monthly" | "annual") => {
      // Demo unlock only — live entitlements come from Stripe webhook
      if (!live) {
        setUser(toAuthUser(demoStore.setPlan(plan), "demo"));
        return;
      }
        throw new Error(
          "BodiesByBecca membership is billed in the App Store / Play Store. Use demo mode to preview portal unlock, or link the same email after you subscribe in the app.",
        );
    },
    [live],
  );

  const toggleLesson = useCallback(
    async (lessonId: string) => {
      if (!live) {
        setUser(toAuthUser(demoStore.toggleLesson(lessonId), "demo"));
        return;
      }
      if (!user) throw new Error("Not signed in");
      const has = user.completedLessons.includes(lessonId);
      const completedLessons = has
        ? user.completedLessons.filter((id) => id !== lessonId)
        : [...user.completedLessons, lessonId];
      const supabase = getSupabase();
      const { error } = await supabase!
        .from("profiles")
        .update({ completed_lessons: completedLessons })
        .eq("id", user.id);
      if (error) throw error;
      setUser({ ...user, completedLessons });
    },
    [live, user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      mode: live ? ("live" as const) : ("demo" as const),
      signUp,
      signIn,
      signOut,
      activatePlan,
      toggleLesson,
      refresh,
    }),
    [user, loading, live, signUp, signIn, signOut, activatePlan, toggleLesson, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
