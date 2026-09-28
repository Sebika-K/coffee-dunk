// Small helpers for displaying data, shared by several screens.

// Old posts from the web app sometimes saved the avatar as a website path
// like "/static/assets/default-avatar.jpg". That only works on the website,
// so on the phone we only trust full "http..." links.
export function avatarSource(avatar: string | null) {
  return avatar?.startsWith("http")
    ? { uri: avatar }
    : require("@/assets/images/default-avatar.jpg");
}

// "2025-08-12T14:03:22+00:00" -> "Aug 12, 2025" (in the phone's own language)
export function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "2h ago"-style times for the feed. Older than a week -> the date.
export function formatTimeAgo(isoDate: string): string {
  const seconds = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(isoDate);
}
