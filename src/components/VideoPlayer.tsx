import { resolveLessonVideo } from "../lib/videoEmbed";

export function VideoPlayer({
  url,
  title = "Video",
  className = "lesson-video",
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const video = resolveLessonVideo(url);
  if (!video) return null;
  return (
    <div className={className}>
      {video.kind === "file" ? (
        <video controls playsInline src={video.src} preload="metadata" />
      ) : (
        <iframe
          src={video.src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      )}
    </div>
  );
}
