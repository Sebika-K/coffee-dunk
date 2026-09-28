import { FirebaseError } from "firebase/app";

// Turn Firebase's error codes into messages a person can understand.
// Used by the login and signup screens.
export function friendlyError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email or password is incorrect.";
      case "auth/invalid-email":
        return "That doesn't look like a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a bit and try again.";
      case "auth/network-request-failed":
        return "No internet connection. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}
