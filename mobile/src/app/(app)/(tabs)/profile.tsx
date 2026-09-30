// Your profile: photo, name, stats, bio and all your posts.
// Rebuilt from the web app's profile.html / profile.css.

import { ChoiceChips } from "@/components/Chips";
import { DiaryCard } from "@/components/DiaryCard";
import { PostGrid } from "@/components/PostGrid";
import { ProfileSummary } from "@/components/ProfileSummary";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { fetchMyFriends } from "@/lib/friends";
import { fetchUserBio, fetchUserPosts } from "@/lib/posts";
import { fetchSavedPosts } from "@/lib/saved";
import { calculateStats } from "@/lib/stats";
import { Ionicons } from "@expo/vector-icons";
import { User } from "firebase/auth";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, displayName, photoURL } = useAuth();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Post[]>([]);
  const [bio, setBio] = useState("");
  const [requestCount, setRequestCount] = useState(0); // friend requests waiting for me
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [view, setView] = useState<"mine" | "saved">("mine"); // which grid to show
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Reload every time the profile comes into view (e.g. after posting)
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isActive = true;

      async function load(signedInUser: User) {
        const userId = signedInUser.uid;
        try {
          // Load everything at the SAME time. The extras (friends badge, saved)
          // can fail on their own without breaking the profile.
          const [myPosts, myBio, myFriends, mySaved] = await Promise.all([
            fetchUserPosts(userId),
            fetchUserBio(userId),
            fetchMyFriends(userId).catch(() => null), // only for the request badge
            fetchSavedPosts(userId).catch(() => []), // your saved posts
          ]);
          if (isActive) {
            setPosts(myPosts);
            setBio(myBio);
            setRequestCount(myFriends?.incoming.length ?? 0);
            setSavedPosts(mySaved);
            setErrorMessage("");
          }
        } catch (error) {
          console.log("Profile load failed:", error);
          if (isActive) setErrorMessage("Couldn't load your posts. Pull down or reopen to try again.");
        } finally {
          if (isActive) setIsLoading(false);
        }
      }

      load(user);
      return () => {
        isActive = false;
      };
    }, [user])
  );

  // Recalculate the stats only when the posts change (not on every redraw)
  const stats = useMemo(() => calculateStats(posts), [posts]);

  const name = displayName || user?.email?.split("@")[0] || "You";

  // Everything above the grid - scrolls together with the posts
  const header = (
    <View style={styles.headerArea}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Text style={styles.username} numberOfLines={1}>
          {name}
        </Text>
        <Pressable
          style={styles.menuButton}
          onPress={() => router.push("/friends")}
          accessibilityLabel={requestCount > 0 ? `Friends, ${requestCount} new requests` : "Friends"}
        >
          <Ionicons name="people-outline" size={21} color={COLORS.plum} />
          {/* Little plum badge when someone wants to be friends */}
          {requestCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requestCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={styles.menuButton}
          onPress={() => router.push("/settings")}
          accessibilityLabel="Settings"
        >
          <Ionicons name="menu" size={22} color={COLORS.plum} />
        </Pressable>
      </View>

      <ProfileSummary photoUrl={photoURL} name={name} stats={stats} bio={bio} />

      {!isLoading && posts.length > 0 && <DiaryCard stats={stats} />}

      {/* Switch the grid below between my posts and my saved ones */}
      <View style={styles.viewSwitch}>
        <ChoiceChips
          options={[
            { id: "mine", label: `My coffee (${posts.length})` },
            { id: "saved", label: `🔖 Saved (${savedPosts.length})` },
          ]}
          selected={view}
          onChange={(value) => value && setView(value)}
        />
      </View>
      {errorMessage !== "" && <Text style={styles.error}>{errorMessage}</Text>}
      {isLoading && <ActivityIndicator color={COLORS.plum} style={styles.spinner} />}
    </View>
  );

  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <PostGrid
        posts={view === "mine" ? posts : savedPosts}
        onPressPost={(post) =>
          router.push({ pathname: "/post/[postId]", params: { postId: post.id } })
        }
        header={header}
        emptyText={
          isLoading
            ? ""
            : view === "mine"
            ? "No posts yet. Tap + to share your first coffee!"
            : "Nothing saved yet. Tap 🔖 on a friend's coffee you want to try."
        }
      />

      {/* Floating "+" button: new post (you'll choose the café on the upload screen) */}
      <Pressable
        style={[styles.addButton, { bottom: insets.bottom + 84 }]}
        onPress={() => router.push("/upload")}
        accessibilityLabel="New post"
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
  headerArea: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  username: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.plum,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewSwitch: {
    marginTop: 16,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  error: {
    marginTop: 12,
    color: COLORS.plum,
  },
  spinner: {
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
