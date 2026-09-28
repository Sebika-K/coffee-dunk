// Everything the app needs to talk to YOUR Flask backend.

import Constants from "expo-constants";

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
  photo_ref: string | null;
};

// Ask the backend for cafés near a city
export async function fetchNearbyCafes(city: string): Promise<Cafe[]> {
  const url = `${API_URL}/api/cafes/nearby?city=${encodeURIComponent(city)}`;

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
