// One café's page: its name, top drinks, and a grid of YOUR + your FRIENDS' posts there.
// The [placeId] in the file name means this screen works for ANY café -
// the id comes from the address, e.g. /search/cafe/ChIJOzVa9gSLj4ARFQqljssXWUI

import { PostGrid } from "@/components/PostGrid";
import { TopDrinks } from "@/components/TopDrinks";
import { COLORS } from "@/constants/theme";
import { fetchCafePosts, fetchTopDrinks, Post, TopDrink } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { User } from "firebase/auth";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          ~ {name ?? "Café"} ~
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.plum} style={styles.spinner} />
      ) : errorMessage !== "" ? (
        <Text style={styles.message}>{errorMessage}</Text>
      ) : (
        <PostGrid
          posts={posts}
          onPressPost={(post) =>
            router.push({ pathname: "/post/[postId]", params: { postId: post.id } })
          }
          emptyText="No posts from you or your friends here yet. Be the first!"
          header={<TopDrinks drinks={topDrinks} />}
        />
      )}

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    marginRight: 52, // balance the back button so the title stays centred
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    overflow: "hidden",
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontWeight: "700",
    fontSize: 18,
    color: COLORS.plum,
  },
  spinner: {
    marginTop: 40,
  },
  message: {
    textAlign: "center",
    color: COLORS.plum,
    marginTop: 40,
    paddingHorizontal: 24,
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
