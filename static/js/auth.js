import { auth, db } from "./firebase-init.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// LOGIN 
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert(`Welcome back, ${userCredential.user.email}`);
      window.location.href = "/search"; // redirect after login
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}

// SIGNUP
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      alert(`Signup successful! Welcome, ${userCredential.user.email}`);
      window.location.href = "/search";
    } catch (error) {
      alert("Signup failed: " + error.message);
    }
  });
}