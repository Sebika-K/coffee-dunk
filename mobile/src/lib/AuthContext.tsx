// Keeps track of WHO is logged in, and shares it with every screen.

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

type AuthState = {
  user: User | null; // the logged-in user, or null if nobody is logged in
  isLoading: boolean; // true until Firebase has checked the phone for a saved login
};

const AuthContext = createContext<AuthState>({ user: null, isLoading: true });

// Wrap the whole app in this, so every screen can ask "who's logged in?"
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Firebase calls this function right away with the saved login (if any),
    // and again every time someone logs in or out.
    const stopListening = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return stopListening; // clean up if the provider is ever removed
  }, []);

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

// Any screen can call useAuth() to get { user, isLoading }
export function useAuth() {
  return useContext(AuthContext);
}
