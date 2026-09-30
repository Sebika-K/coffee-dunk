// Links and contact details that Apple requires to be easy to find in the app:
// the Terms of Use, the Privacy Policy and a way to contact us.
// Kept in one place so Signup and Settings always point to the same pages.

import * as WebBrowser from "expo-web-browser";

export const TERMS_URL = "https://coffee-dunk.web.app/terms";
export const PRIVACY_URL = "https://coffee-dunk.web.app/privacy";
export const CONTACT_EMAIL = "sebikakhulal07@gmail.com";

// Opens a page in a browser that slides up INSIDE the app (with a "Done"
// button), so people don't get thrown out of Coffee Dunk into Safari.
export function openPage(url: string) {
  return WebBrowser.openBrowserAsync(url);
}
