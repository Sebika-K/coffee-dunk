import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Keep the splash screen up until we know whether someone is logged in
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  // Still checking for a saved login - show nothing (the splash screen is up)
  if (isLoading) return null;

  const isLoggedIn = user !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only reachable when logged IN */}
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      {/* Only reachable when logged OUT */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
    </Stack>
  );
}
