// Your profile: photo, name, stats, bio and all your posts.
// Rebuilt from the web app's profile.html / profile.css.

import { DiaryCard } from "@/components/DiaryCard";
import { PostGrid } from "@/components/PostGrid";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { fetchUserBio, fetchUserPosts } from "@/lib/posts";
import { calculateStats, formatRating } from "@/lib/stats";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, displayName, photoURL } = useAuth();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Post[]>([]);
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Reload every time the profile comes into view (e.g. after posting)
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isActive = true;

      async function load(userId: string) {
        try {
          // Load posts and bio at the SAME time instead of one after the other
          const [myPosts, myBio] = await Promise.all([fetchUserPosts(userId), fetchUserBio(userId)]);
          if (isActive) {
            setPosts(myPosts);
            setBio(myBio);
            setErrorMessage("");
          }
        } catch (error) {
          console.log("Profile load failed:", error);
          if (isActive) setErrorMessage("Couldn't load your posts. Pull down or reopen to try again.");
        } finally {
          if (isActive) setIsLoading(false);
        }
      }

      load(user.uid);
      return () => {
        isActive = false;
      };
    }, [user])
  );

  // Recalculate the stats only when the posts change (not on every redraw)
  const stats = useMemo(() => calculateStats(posts), [posts]);

  const name = displayName || user?.email?.split("@")[0] || "You";
  const avatar = photoURL
    ? { uri: photoURL }
    : require("@/assets/images/default-avatar.jpg");

  // Everything above the grid - scrolls together with the posts
  const header = (
    <View style={styles.headerArea}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Text style={styles.username} numberOfLines={1}>
          {name}
        </Text>
        <Pressable
          style={styles.menuButton}
          onPress={() => router.push("/settings")}
          accessibilityLabel="Settings"
        >
          <Ionicons name="menu" size={22} color={COLORS.plum} />
        </Pressable>
      </View>

      <View style={styles.profileRow}>
        <Image source={avatar} style={styles.avatar} contentFit="cover" />
        <View style={styles.stats}>
          <Stat value={stats.totalPosts} label="POSTS" />
          <Stat value={stats.cafesTried} label="CAFÉS" />
          <Stat
            value={stats.averageRating === null ? "–" : formatRating(stats.averageRating)}
            label="AVG ★"
          />
        </View>
      </View>

      {bio !== "" && <Text style={styles.bio}>{bio}</Text>}
      {!isLoading && posts.length > 0 && <DiaryCard stats={stats} />}
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
        posts={posts}
        onPressPost={(post) =>
          router.push({ pathname: "/post/[postId]", params: { postId: post.id } })
        }
        header={header}
        emptyText={isLoading ? "" : "No posts yet. Tap + to share your first coffee!"}
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

// One number + label, e.g. "12 POSTS"
function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "white",
  },
  stats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.plum,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.plum,
    marginTop: 2,
  },
  bio: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.plum,
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
