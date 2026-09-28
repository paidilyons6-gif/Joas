import { useCallback, useEffect, useState } from "react";

const BYPASS_KEY = "bbb_waitlist_bypass";
const EVENT = "bbb-waitlist-bypass";

/** Gate is on unless explicitly disabled with VITE_WAITLIST_MODE=false */
export function isWaitlistMode() {
  const flag = (import.meta.env.VITE_WAITLIST_MODE as string | undefined)
    ?.trim()
    .toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  // Default ON so the site stays blocked until launch announce.
  return true;
}

export function hasWaitlistBypass() {
  try {
    return sessionStorage.getItem(BYPASS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWaitlistBypass(on: boolean) {
  try {
    if (on) sessionStorage.setItem(BYPASS_KEY, "1");
    else sessionStorage.removeItem(BYPASS_KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useWaitlistBypass() {
  const [bypassed, setBypassed] = useState(hasWaitlistBypass);

  useEffect(() => {
    const sync = () => setBypassed(hasWaitlistBypass());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((on: boolean) => {
    setWaitlistBypass(on);
    setBypassed(on);
  }, []);

  return { bypassed, setBypass: set };
}

const LOCAL_WAITLIST_KEY = "bbb_waitlist_local_v1";

function saveLocalWaitlist(email: string): { ok: true; already?: boolean } {
  const normalized = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(LOCAL_WAITLIST_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (list.includes(normalized)) return { ok: true, already: true };
    list.push(normalized);
    localStorage.setItem(LOCAL_WAITLIST_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return { ok: true };
}

export async function joinWaitlist(email: string) {
  const res = await fetch("/.netlify/functions/join-waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "gate" }),
  });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  // Pure Vite SPA fallback returns HTML 200 for missing functions — use local store.
  if (
    res.status === 404 ||
    contentType.includes("text/html") ||
    text.trimStart().startsWith("<!")
  ) {
    return saveLocalWaitlist(email);
  }
  if (!res.ok) {
    throw new Error(text || "Could not join the list");
  }
  try {
    return JSON.parse(text) as { ok: boolean; already?: boolean };
  } catch {
    return saveLocalWaitlist(email);
  }
}

export type WaitlistRow = {
  email: string;
  source: string;
  created_at: string;
};

export async function sendWaitlistAnnounce(input: {
  email: string;
  secret: string;
  subject?: string;
  body?: string;
}): Promise<{ sent: number; total: number; failures?: string[] }> {
  const res = await fetch("/.netlify/functions/send-waitlist-announce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Could not send announce");
  return JSON.parse(text) as {
    sent: number;
    total: number;
    failures?: string[];
  };
}

export async function fetchWaitlist(input: {
  email: string;
  secret: string;
}): Promise<WaitlistRow[]> {
  const res = await fetch("/.netlify/functions/list-waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (
    res.status === 404 ||
    contentType.includes("text/html") ||
    text.trimStart().startsWith("<!")
  ) {
    // Local Vite: surface emails captured in this browser only.
    try {
      const raw = localStorage.getItem(LOCAL_WAITLIST_KEY);
      const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      return list.map((email) => ({
        email,
        source: "local",
        created_at: new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }
  if (!res.ok) {
    throw new Error(text || "Could not load waitlist");
  }
  const data = JSON.parse(text) as { emails: WaitlistRow[] };
  return data.emails || [];
}

/** True when a Netlify function response is actually the Vite SPA HTML shell. */
export function isSpaFallbackResponse(res: Response, body: string) {
  const contentType = res.headers.get("content-type") || "";
  return (
    res.status === 404 ||
    contentType.includes("text/html") ||
    body.trimStart().startsWith("<!")
  );
}
