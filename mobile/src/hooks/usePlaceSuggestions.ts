// Autocomplete suggestions for whatever is typed in a search box.
//
// To avoid sending Google a (paid) request on every single keystroke, it waits
// until typing pauses for 300 ms, and only asks once there are 2+ letters.

import { PlaceSuggestion } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";

const PAUSE_MS = 300;
const MIN_LETTERS = 2;

// A random id for one "typing session" (Google only needs it to be unique-ish)
function newSessionToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function usePlaceSuggestions(
  query: string, // what's typed; pass "" to hide suggestions
  fetchSuggestions: (query: string, sessionToken: string) => Promise<PlaceSuggestion[]>
) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  // useRef: remembered between redraws, but changing it doesn't redraw the screen
  const sessionToken = useRef(newSessionToken());

  useEffect(() => {
    const text = query.trim();
    if (text.length < MIN_LETTERS) {
      setSuggestions([]);
      return;
    }

    // "stale" = the person kept typing, so this answer is for old text. Ignore it,
    // otherwise a slow answer for "Da" could replace the newer one for "Dal".
    let stale = false;
    const timer = setTimeout(() => {
      fetchSuggestions(text, sessionToken.current)
        .then((found) => {
          if (!stale) setSuggestions(found);
        })
        .catch((error) => console.log("Suggestions failed:", error)); // just show none
    }, PAUSE_MS);

    // Runs when the text changes again (or the screen closes): cancel the old wait
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, fetchSuggestions]);

  // Call after someone picks a suggestion: that session is finished
  const endSession = useCallback(() => {
    sessionToken.current = newSessionToken();
    setSuggestions([]);
  }, []);

  return { suggestions, endSession };
}
