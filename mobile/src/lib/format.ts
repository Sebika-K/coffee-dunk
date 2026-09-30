// Small helpers for displaying data, shared by several screens.

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

// Coffee-to-water ratio, e.g. 18 g coffee + 250 ml water -> "1:13.9"
// (baristas describe recipes this way). null if either amount is missing.
export function formatRatio(coffeeGrams: number | null, waterMl: number | null): string | null {
  if (!coffeeGrams || !waterMl) return null;
  const ratio = (waterMl / coffeeGrams).toFixed(1).replace(/\.0$/, ""); // "15.0" -> "15"
  return `1:${ratio}`;
}
