import { auth, db } from "./firebase-init.js";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Prefill saved email
const savedEmail = localStorage.getItem("rememberEmail");
if (savedEmail) {
  const emailEl = document.getElementById("login-email");
  const rmEl = document.getElementById("remember-me");
  if (emailEl) emailEl.value = savedEmail;
  if (rmEl) rmEl.checked = true;
}

// LOGIN 
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const remember = document.getElementById("remember-me")?.checked;
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );

    if (remember) {
      localStorage.setItem("rememberEmail", email);
    } else {
      localStorage.removeItem("rememberEmail");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (remember) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }
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

//passowrd reset
const forgotLink = document.getElementById("forgot-link");
if (forgotLink) {
  forgotLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("login-email")?.value || "").trim();

    if (!email) {
      alert("Enter your email in the Email field first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent. Check your inbox.");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        alert("No account found with that email.");
      } else if (err.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else {
        alert("Couldn’t send reset email: " + err.message);
      }
    }
  });
}
