/** Turn a YouTube / Vimeo / direct URL into something the lesson player can show. */
export function resolveLessonVideo(url?: string | null): {
  kind: "iframe" | "file";
  src: string;
} | null {
  if (!url?.trim()) return null;
  const raw = url.trim();

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${id}?rel=0`,
        };
      }
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id =
        parsed.searchParams.get("v") ||
        (parsed.pathname.startsWith("/embed/")
          ? parsed.pathname.split("/")[2]
          : parsed.pathname.startsWith("/shorts/")
            ? parsed.pathname.split("/")[2]
            : null);
      if (id) {
        return {
          kind: "iframe",
          src: `https://www.youtube.com/embed/${id}?rel=0`,
        };
      }
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = host === "player.vimeo.com" ? parts[1] : parts[0];
      if (id && /^\d+$/.test(id)) {
        return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
      }
    }

    if (/\.(mp4|webm|ogg)(\?|$)/i.test(parsed.pathname)) {
      return { kind: "file", src: raw };
    }

    // Loom share / embed
    if (host === "loom.com" || host === "www.loom.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id) {
        return { kind: "iframe", src: `https://www.loom.com/embed/${id}` };
      }
    }
  } catch {
    return null;
  }

  // Unknown https URL — try iframe (works for many hosted players)
  if (/^https?:\/\//i.test(raw)) {
    return { kind: "iframe", src: raw };
  }

  return null;
}
