// Recent city searches, remembered ON THIS PHONE (Phase 8.1d).
//
// Why not Firestore? Recent searches are a small convenience for this device,
// not something to share or keep forever. AsyncStorage (the phone's own small
// storage - the same place Firebase keeps you logged in) is simpler, instant,
// and works offline.

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "recentSearches";
const MAX = 5;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const saved = await AsyncStorage.getItem(KEY); // stored as text
    return saved ? JSON.parse(saved) : [];
  } catch {
    return []; // if storage fails, just show none
  }
}

// Put this city first; remove an older copy (ignoring upper/lower case); keep 5
export async function addRecentSearch(city: string): Promise<string[]> {
  const current = await getRecentSearches();
  const updated = [city, ...current.filter((c) => c.toLowerCase() !== city.toLowerCase())].slice(
    0,
    MAX
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(updated)).catch(() => {});
  return updated;
}

export async function clearRecentSearches() {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
