// Coffee Dunk's colours, taken from the web app's CSS.
// Every screen imports from here, so a colour only ever changes in one place.
export const COLORS = {
  plum: "#7D2E4D", // cards, main brand colour
  sand: "#D8D0CB", // input backgrounds, button borders
  fadedWhite: "rgba(252, 251, 251, 0.57)", // soft text on plum
  placeholder: "rgba(114, 35, 35, 0.57)", // hint text inside inputs
  link: "#0a58ff", // links on plum cards
  linkPurple: "#551A8B", // links on the landing screen
  error: "#FFD6D6", // error messages on plum cards
  cream: "rgba(255, 255, 255, 0.85)", // floating pills (nav pill, search bar)
  card: "#fdf3e7", // café cards (from result.css)
  heart: "#E0445E", // a liked ❤️
  latte: "#CBA781", // the background colour of the "Spill The City" illustration
};

// Shared look for floating pills, so the nav pill and search bar match
export const PILL = {
  height: 56,
  shadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
};
