// Keeps track of WHO is logged in, and shares it with every screen.

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

type AuthState = {
  user: User | null; // the logged-in user, or null if nobody is logged in
  isLoading: boolean; // true until Firebase has checked the phone for a saved login
  // Name and photo as plain values. Screens should DISPLAY these, not
  // user.displayName / user.photoURL - see refreshUser() below for why.
  displayName: string | null;
  photoURL: string | null;
  refreshUser: () => void; // call after changing the user's name or photo
};

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  displayName: null,
  photoURL: null,
  refreshUser: () => {},
});

// Wrap the whole app in this, so every screen can ask "who's logged in?"
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  useEffect(() => {
    // Firebase calls this function right away with the saved login (if any),
    // and again every time someone logs in or out.
    const stopListening = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setDisplayName(firebaseUser?.displayName ?? null);
      setPhotoURL(firebaseUser?.photoURL ?? null);
      setIsLoading(false);
    });
    return stopListening; // clean up if the provider is ever removed
  }, []);

  // Firebase's updateProfile() changes the user object IN PLACE - it's still
  // the same object, so React (and the React Compiler) can't tell anything
  // changed. So after a change, we copy the new name and photo into state as
  // brand-new values. New values = React notices = every screen updates.
  function refreshUser() {
    setDisplayName(auth.currentUser?.displayName ?? null);
    setPhotoURL(auth.currentUser?.photoURL ?? null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, displayName, photoURL, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Any screen can call useAuth() to get the values above
export function useAuth() {
  return useContext(AuthContext);
}
