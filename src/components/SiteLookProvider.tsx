import { useEffect, type ReactNode } from "react";
import { applySiteLook, siteLookStore } from "../lib/siteLook";
import { fetchSiteLook } from "../lib/coursesRepo";

/** Loads Studio look (colours + photos) and applies CSS variables site-wide. */
export function SiteLookProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applySiteLook(siteLookStore.get());
    void fetchSiteLook().then(applySiteLook);
    const refresh = () => {
      void fetchSiteLook().then(applySiteLook);
    };
    window.addEventListener(siteLookStore.eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(siteLookStore.eventName, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return children;
}
