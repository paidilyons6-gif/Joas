import { useCallback, useEffect, useState } from "react";

const KEY = "bbb_view_as_client";
const EVENT = "bbb-client-preview";

export function isClientPreview(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setClientPreview(on: boolean) {
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Admin bypass is off when View as client is on. */
export function useClientPreview() {
  const [preview, setPreview] = useState(isClientPreview);

  useEffect(() => {
    const sync = () => setPreview(isClientPreview());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((on: boolean) => {
    setClientPreview(on);
    setPreview(on);
  }, []);

  const toggle = useCallback(() => {
    set(!isClientPreview());
  }, [set]);

  return { preview, setPreview: set, toggle };
}
