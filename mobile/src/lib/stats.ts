// Coffee diary stats, calculated from a list of posts.
//
// These are "pure functions": they only look at what you pass in and return
// an answer - no Firebase, no state, no screen. Same posts in = same stats out.
// That makes them easy to reason about, and easy to test.

import { describeDrink } from "@/constants/drinks";
import { Post } from "@/lib/api";

export type DiaryStats = {
  totalPosts: number;
  cafesTried: number; // how many DIFFERENT cafés
  averageRating: number | null; // null if no post has a rating
  mostOrdered: { name: string; count: number } | null;
  highestRated: { name: string; average: number; count: number } | null;
  favouriteNote: { id: string; count: number } | null;
};

export function calculateStats(posts: Post[]): DiaryStats {
  return {
    totalPosts: posts.length,
    cafesTried: countDifferentCafes(posts),
    averageRating: average(posts.map((p) => p.rating)),
    mostOrdered: findMostOrdered(posts),
    highestRated: findHighestRated(posts),
    favouriteNote: findFavouriteNote(posts),
  };
}

// A Set only keeps ONE of each value - so its size = number of different cafés
function countDifferentCafes(posts: Post[]): number {
  const cafeIds = new Set(posts.map((p) => p.place_id).filter((id) => id !== null));
  return cafeIds.size;
}

// Average of the numbers, ignoring missing ones (null)
function average(values: (number | null)[]): number | null {
  const numbers = values.filter((v): v is number => typeof v === "number");
  if (numbers.length === 0) return null;
  const total = numbers.reduce((sum, n) => sum + n, 0);
  return total / numbers.length;
}

// Group posts by their drink name, e.g. { "Iced oat latte": [post, post], "Cortado": [post] }
// Old posts without a drink are skipped.
function groupByDrink(posts: Post[]): Map<string, Post[]> {
  const groups = new Map<string, Post[]>();
  for (const post of posts) {
    const name = describeDrink(post);
    if (!name) continue;
    const group = groups.get(name) ?? [];
    groups.set(name, [...group, post]);
  }
  return groups;
}

// The drink you've posted the most
function findMostOrdered(posts: Post[]): DiaryStats["mostOrdered"] {
  let best: DiaryStats["mostOrdered"] = null;
  for (const [name, group] of groupByDrink(posts)) {
    if (!best || group.length > best.count) {
      best = { name, count: group.length };
    }
  }
  return best;
}

// The drink with your best AVERAGE rating.
// If two drinks tie, the one you've had more often wins (more reliable).
function findHighestRated(posts: Post[]): DiaryStats["highestRated"] {
  let best: DiaryStats["highestRated"] = null;
  for (const [name, group] of groupByDrink(posts)) {
    const avg = average(group.map((p) => p.rating));
    if (avg === null) continue;
    const isBetter =
      !best || avg > best.average || (avg === best.average && group.length > best.count);
    if (isBetter) {
      best = { name, average: avg, count: group.length };
    }
  }
  return best;
}

// The tasting note you pick most often
function findFavouriteNote(posts: Post[]): DiaryStats["favouriteNote"] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const note of post.notes) {
      counts.set(note, (counts.get(note) ?? 0) + 1);
    }
  }
  let best: DiaryStats["favouriteNote"] = null;
  for (const [id, count] of counts) {
    if (!best || count > best.count) best = { id, count };
  }
  return best;
}

// 4.333 -> "4.3", used when showing ratings
export function formatRating(value: number): string {
  return value.toFixed(1);
}

// ---------------------------------------------------------------------------
// "Where your friends went" (Phase 8.1c)
// ---------------------------------------------------------------------------

export type FriendCafe = {
  place_id: string;
  cafe_name: string;
  photo_url: string | null; // the most recent friend photo there
  friends: { name: string; avatar: string | null }[]; // who went (each friend once)
  last_visit: string | null; // newest post time
};

// Turn friends' posts into a list of cafés, most recently visited first.
// Homemade posts are skipped (no café). Pure function: posts in, cafés out.
export function groupFriendCafes(posts: Post[], limit = 8): FriendCafe[] {
  const cafes = new Map<string, FriendCafe>();
  const seenFriends = new Map<string, Set<string>>(); // place_id -> friend ids already listed

  // Posts arrive newest first, so the FIRST post we see for a café is its latest visit
  for (const post of posts) {
    if (post.source === "home" || !post.place_id) continue;

    let cafe = cafes.get(post.place_id);
    if (!cafe) {
      cafe = {
        place_id: post.place_id,
        cafe_name: post.cafe_name ?? "Café",
        photo_url: post.image_url,
        friends: [],
        last_visit: post.created_at,
      };
      cafes.set(post.place_id, cafe);
      seenFriends.set(post.place_id, new Set());
    }

    const seen = seenFriends.get(post.place_id)!;
    if (post.user_id && !seen.has(post.user_id)) {
      seen.add(post.user_id);
      cafe.friends.push({ name: post.user ?? "a friend", avatar: post.user_avatar });
    }
  }

  // A Map remembers the order things were added = most recent visit first
  return [...cafes.values()].slice(0, limit);
}
