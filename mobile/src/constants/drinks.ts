// The choices for a journal entry: what you drank, the milk, hot or iced,
// and tasting notes.
//
// Each choice has:
//   id    - what gets SAVED in the database. Never change an id once posts use it!
//   label - what people SEE. Safe to change any time (e.g. fix a typo, translate).
// Saving ids instead of labels keeps the data clean: every latte is "latte",
// never "Latte" / "latte " / "LATTE" - so stats and recommendations can count them.

export const DRINKS = [
  { id: "espresso", label: "Espresso" },
  { id: "americano", label: "Americano" },
  { id: "drip", label: "Drip coffee" },
  { id: "latte", label: "Latte" },
  { id: "cappuccino", label: "Cappuccino" },
  { id: "flat_white", label: "Flat white" },
  { id: "cortado", label: "Cortado" },
  { id: "macchiato", label: "Macchiato" },
  { id: "mocha", label: "Mocha" },
  { id: "cold_brew", label: "Cold brew" },
  { id: "matcha", label: "Matcha" },
  { id: "chai", label: "Chai" },
  { id: "other", label: "Other" }, // lets people type something not on the list
] as const;

export const MILKS = [
  { id: "none", label: "No milk" },
  { id: "whole", label: "Whole" },
  { id: "oat", label: "Oat" },
  { id: "almond", label: "Almond" },
  { id: "soy", label: "Soy" },
] as const;

export const TEMPERATURES = [
  { id: "hot", label: "Hot" },
  { id: "iced", label: "Iced" },
] as const;

export const TASTING_NOTES = [
  { id: "sweet", label: "Sweet" },
  { id: "bitter", label: "Bitter" },
  { id: "nutty", label: "Nutty" },
  { id: "fruity", label: "Fruity" },
  { id: "chocolatey", label: "Chocolatey" },
  { id: "smooth", label: "Smooth" },
  { id: "strong", label: "Strong" },
  { id: "creamy", label: "Creamy" },
] as const;

// TypeScript types built FROM the lists above, e.g. DrinkId = "espresso" | "americano" | ...
// Add a drink to the list and the type updates by itself.
export type DrinkId = (typeof DRINKS)[number]["id"];
export type MilkId = (typeof MILKS)[number]["id"];
export type TemperatureId = (typeof TEMPERATURES)[number]["id"];
export type TastingNoteId = (typeof TASTING_NOTES)[number]["id"];

// Find the label to show for a saved id (falls back to the id itself if unknown)
function labelFor(list: readonly { id: string; label: string }[], id: string): string {
  return list.find((item) => item.id === id)?.label ?? id;
}

// Build a readable name for a post's drink, e.g. "Iced oat latte"
export function describeDrink(post: {
  drink: string | null;
  drink_custom: string | null;
  milk: string | null;
  temperature: string | null;
}): string | null {
  if (!post.drink) return null; // old posts from before Phase 3 have no drink

  const drinkName =
    post.drink === "other" ? post.drink_custom || "Other" : labelFor(DRINKS, post.drink);

  const parts: string[] = [];
  if (post.temperature === "iced") parts.push("Iced");
  if (post.milk && post.milk !== "none") parts.push(labelFor(MILKS, post.milk));
  parts.push(drinkName);

  // "Iced Oat Latte" -> "Iced oat latte" (only the first letter capitalised)
  const text = parts.join(" ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function tastingNoteLabel(id: string): string {
  return labelFor(TASTING_NOTES, id);
}
