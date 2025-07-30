import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { firebaseConfig } from "/static/js/firebase-config.js";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
console.log("Firebase initialized!", app);

// Initialize Auth & Firestore
export const auth = getAuth(app);
console.log("Auth:", auth);

export const db = getFirestore(app);
console.log("Firestore:", db);

// Optional: expose globally
window.app = app;
window.auth = auth;
window.db = db;
