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
