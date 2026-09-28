// Sets up Firebase ONCE for the whole app.
// Every screen imports `auth` (and later `db`, `storage`) from this file.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";

// Values come from mobile/.env.local (not committed to git)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Only create the Firebase app the first time this file runs.
// (Fast Refresh can re-run files while you develop.)
const isFirstRun = getApps().length === 0;
const app = isFirstRun ? initializeApp(firebaseConfig) : getApp();

// Auth that REMEMBERS the logged-in user on the phone (via AsyncStorage),
// so people stay logged in after closing the app.
export const auth = isFirstRun
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
