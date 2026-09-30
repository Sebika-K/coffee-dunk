// Everything the app needs to talk to YOUR Flask backend.

import Constants from "expo-constants";
import { User } from "firebase/auth";
import { Recipe } from "@/constants/drinks";

// Where is the backend?
// During development it runs on your Mac. The phone can't use "127.0.0.1"
// (on a phone, that means the phone itself!). Instead we use your Mac's
// address on the Wi-Fi - which Expo already knows, because your phone
// loads the app from your Mac. Later, when the backend is online, we'll
// set EXPO_PUBLIC_API_URL to its real address instead.
function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.23:8081"
  const macAddress = hostUri?.split(":")[0] ?? "localhost";
  return `http://${macAddress}:5001`;
}

export const API_URL = getApiUrl();

// The shape of one café, exactly as /api/cafes/nearby sends it
export type Cafe = {
  name: string;
  place_id: string;
  address: string | null;
  rating: number | null;
  rating_count?: number | null; // how many Google reviews the rating is based on
  photo_ref: string | null;
};

// Ask the backend for cafés near a city
export async function fetchNearbyCafes(city: string): Promise<Cafe[]> {
  return fetchCafes(`${API_URL}/api/cafes/nearby?city=${encodeURIComponent(city)}`);
}

// Ask the backend for cafés near a map point - the phone's location ("Near me")
export async function fetchCafesNearPoint(latitude: number, longitude: number): Promise<Cafe[]> {
  return fetchCafes(`${API_URL}/api/cafes/nearby?lat=${latitude}&lng=${longitude}`);
}

// Shared by both searches above
async function fetchCafes(url: string): Promise<Cafe[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    // fetch itself fails when the server can't be reached at all
    throw new Error("Can't reach the Coffee Dunk server. Is the backend running?");
  }

  const data = await response.json();
  if (!response.ok) {
    // Our backend sends { "error": "..." } with 400 / 502 codes (step 1.2)
    throw new Error(data.error || `Server error (${response.status})`);
  }
  return data.cafes;
}

// Build the address of a café photo. It goes through OUR backend's
// /api/photo route (step 1.2b), so the Google key never reaches the phone.
export function cafePhotoUrl(photoRef: string, width = 400): string {
  return `${API_URL}/api/photo?ref=${encodeURIComponent(photoRef)}&w=${width}`;
}

// The shape of one post, exactly as /api/cafes/<place_id>/posts sends it (step 1.3)
export type Post = {
  id: string;
  image_url: string | null;
  caption: string | null;
  rating: number | null;
  user_id: string | null;
  user: string | null;
  user_avatar: string | null;
  cafe_name: string | null;
  place_id: string | null; // which café (lets a post link back to its café page)
  created_at: string | null; // e.g. "2025-08-12T14:03:22+00:00"
  // Journal fields (Phase 3) - null / [] on older posts
  drink: string | null; // a drink id, e.g. "latte" (see constants/drinks.ts)
  drink_custom: string | null; // the typed name when drink is "other"
  milk: string | null; // e.g. "oat"
  temperature: string | null; // "hot" or "iced"
  notes: string[]; // tasting note ids, e.g. ["nutty", "smooth"]
  // Homemade coffee (Phase 7.3)
  source: "cafe" | "home"; // old posts -> "cafe"
  recipe: Recipe | null; // only for "home" posts
};

// Ask the backend for the posts at one café (newest first).
// Friends only: the backend needs to know who's asking, so we send the login
// token (like fetchRecommendations) and get back only my + my friends' posts.
export async function fetchCafePosts(placeId: string, user: User): Promise<Post[]> {
  const url = `${API_URL}/api/cafes/${encodeURIComponent(placeId)}/posts`;
  const token = await user.getIdToken();

  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error("Can't reach the Coffee Dunk server. Is the backend running?");
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }
  return data.posts;
}

// A café found by name (from /api/cafes/search, step 1.2's original route)
export type CafeSearchResult = {
  name: string;
  place_id: string;
  address: string | null;
  rating: number | null;
};

// Find cafés by name, e.g. "mozart austin" - used when choosing a café for a post
export async function searchCafesByName(query: string): Promise<CafeSearchResult[]> {
  const url = `${API_URL}/api/cafes/search?q=${encodeURIComponent(query)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Can't reach the Coffee Dunk server. Is the backend running?");
  }

  const data = await response.json();
  if (!response.ok || data.error_message) {
    throw new Error(data.error || data.error_message || `Server error (${response.status})`);
  }
  return data.results;
}

// One of a café's best drinks, as /api/cafes/<place_id>/top-drinks sends it (step 5a)
export type TopDrink = {
  drink: string;
  drink_custom: string | null;
  milk: string | null;
  temperature: string | null;
  average: number; // the plain average rating, e.g. 4.5 - what we SHOW
  count: number; // how many ratings
  score: number; // the confidence-weighted score - what the backend RANKED by
};

// Ask the backend for a café's top drinks (best first)
export async function fetchTopDrinks(placeId: string): Promise<TopDrink[]> {
  const url = `${API_URL}/api/cafes/${encodeURIComponent(placeId)}/top-drinks`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Server error (${response.status})`);
  const data = await response.json();
  return data.top_drinks;
}

// A café recommended for you (step 6a)
export type RecommendedCafe = {
  place_id: string;
  cafe_name: string | null;
  average: number; // how others rated your favourite drink THERE
  count: number;
  friends_count: number; // how many of MY friends rated it (Phase 7.6)
  score: number;
};

export type Recommendations = {
  // Your favourite drink, or null if you don't have a clear favourite yet
  favourite: { drink: string; drink_custom: string | null; milk: string | null; temperature: string | null } | null;
  cafes: RecommendedCafe[];
};

// "You love X - try these cafés". This route is PERSONAL, so we prove who we
// are by sending our Firebase ID token - the backend verifies it with Google.
export async function fetchRecommendations(user: User): Promise<Recommendations> {
  const token = await user.getIdToken(); // Firebase refreshes it automatically if it expired

  const response = await fetch(`${API_URL}/api/recommendations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Server error (${response.status})`);
  return response.json();
}

// Delete my account and everything in it (posts, photos, likes, friends...).
// The backend does the work - see backend/routes/account_routes.py.
export async function deleteAccount(user: User): Promise<void> {
  const token = await user.getIdToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/account/delete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error("Can't reach the Coffee Dunk server. Is the backend running?");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Server error (${response.status})`);
  }
}
