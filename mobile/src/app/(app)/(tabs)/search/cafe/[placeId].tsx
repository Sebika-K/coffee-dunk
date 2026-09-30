// One café's page: its details (photo, address, hours, directions...), top drinks,
// and a grid of YOUR + your FRIENDS' posts there.
// The [placeId] in the file name means this screen works for ANY café -
// the id comes from the address, e.g. /search/cafe/ChIJOzVa9gSLj4ARFQqljssXWUI

import { CafeInfo } from "@/components/CafeInfo";
import { PostGrid } from "@/components/PostGrid";
import { TopDrinks } from "@/components/TopDrinks";
import { COLORS } from "@/constants/theme";
import { CafeDetails, fetchCafeDetails, fetchCafePosts, fetchTopDrinks, Post, TopDrink } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { User } from "firebase/auth";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CafeScreen() {
  // Read the café's id and name from the address
  const { placeId, name } = useLocalSearchParams<{ placeId: string; name?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [topDrinks, setTopDrinks] = useState<TopDrink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [details, setDetails] = useState<CafeDetails | null>(null);

  // The café's details from Google. Loaded once (they don't change while you're
  // here), separately from the posts, so a slow or failed answer never hides the posts.
  useEffect(() => {
    let isActive = true;
    fetchCafeDetails(placeId)
      .then((result) => {
        if (isActive) setDetails(result);
      })
      .catch((error) => console.log("Café details failed:", error)); // the page still works with just the name
    return () => {
      isActive = false;
    };
  }, [placeId]);

  // Load the posts whenever this screen comes into view - when it first opens,
  // AND when you come back to it (e.g. after posting, so your new post shows up)
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isActive = true; // becomes false if you leave before the posts arrive

      async function load(signedInUser: User) {
        try {
          // Load posts and top drinks at the same time.
          // If top drinks fail, just show none - the posts still matter most.
          const [postsResult, drinksResult] = await Promise.all([
            fetchCafePosts(placeId, signedInUser),
            fetchTopDrinks(placeId).catch(() => []),
          ]);
          if (isActive) {
            setPosts(postsResult);
            setTopDrinks(drinksResult);
          }
        } catch (error) {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
          }
        } finally {
          if (isActive) setIsLoading(false);
        }
      }

      load(user);
      return () => {
        isActive = false; // clean-up: ignore late answers for a screen that's gone
      };
    }, [placeId, user])
  );

  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <PostGrid
        posts={posts}
        onPressPost={(post) => router.push({ pathname: "/post/[postId]", params: { postId: post.id } })}
        emptyText={isLoading || errorMessage !== "" ? "" : "No posts from you or your friends here yet. Be the first!"}
        header={
          // Everything above the grid scrolls together with it
          <View style={{ paddingTop: insets.top - 8 }}>
            <CafeInfo name={name ?? "Café"} details={details} />
            <TopDrinks drinks={topDrinks} />
            {posts.length > 0 && (
              <Text style={styles.sectionTitle}>
                From you & your friends · {posts.length}
              </Text>
            )}
            {isLoading && <ActivityIndicator color={COLORS.plum} style={styles.spinner} />}
            {errorMessage !== "" && <Text style={styles.message}>{errorMessage}</Text>}
          </View>
        }
      />

      {/* Back button floats over the photo and stays put while you scroll */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 16 }]}
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={22} color={COLORS.plum} />
      </Pressable>

      {/* Floating "+" button: post at this café */}
      <Pressable
        style={[styles.addButton, { bottom: insets.bottom + 84 }]}
        onPress={() => router.push({ pathname: "/upload", params: { placeId, name } })}
        accessibilityLabel="New post at this café"
      >
        <Ionicons name="add" size={30} color="white" />
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    left: 28, // inside the photo's corner (16 page margin + 12)
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.plum,
    marginBottom: 12,
  },
  spinner: {
    marginTop: 24,
  },
  message: {
    textAlign: "center",
    color: COLORS.plum,
    marginTop: 24,
  },
  addButton: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
  },
});
