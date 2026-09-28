// The friends feed: what you and your friends have been drinking, newest first.

import { FeedCard } from "@/components/FeedCard";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { fetchFriendIds } from "@/lib/friends";
import { fetchFeed } from "@/lib/posts";
import { fetchSavedIds, savePost, unsavePost } from "@/lib/saved";
import { fetchLikedPostIds, setLiked } from "@/lib/likes";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FeedScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState<Post[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set()); // posts I've saved
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set()); // posts I've liked
  const [isLoading, setIsLoading] = useState(true); // first load
  const [isRefreshing, setIsRefreshing] = useState(false); // pull-to-refresh
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [friendIds, saved] = await Promise.all([
        fetchFriendIds(user.uid),
        fetchSavedIds(user.uid).catch(() => []), // saves are a bonus - never break the feed
      ]);
      setFriendCount(friendIds.length);
      setSavedIds(new Set(saved));
      // My posts + my friends' posts
      const feedPosts = await fetchFeed([user.uid, ...friendIds]);
      setPosts(feedPosts);
      // Which of my FRIENDS' posts have I liked? (likes are a bonus - never break the feed)
      const friendPostIds = feedPosts.filter((p) => p.user_id !== user.uid).map((p) => p.id);
      setLikedIds(await fetchLikedPostIds(friendPostIds, user.uid).catch(() => new Set<string>()));
      setErrorMessage("");
    } catch (error) {
      console.log("Feed load failed:", error);
      setErrorMessage("Couldn't load the feed. Pull down to try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reload whenever the feed comes into view (e.g. after posting)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Save / unsave instantly, then store it (undo if storing fails)
  async function toggleSave(postId: string) {
    if (!user) return;
    const wasSaved = savedIds.has(postId);
    setSavedIds((current) => {
      const next = new Set(current); // a NEW set - never edit the old one
      if (wasSaved) next.delete(postId);
      else next.add(postId);
      return next;
    });
    try {
      if (wasSaved) await unsavePost(user.uid, postId);
      else await savePost(user.uid, postId);
    } catch (error) {
      console.log("Save failed:", error);
      setSavedIds((current) => {
        const undo = new Set(current);
        if (wasSaved) undo.add(postId);
        else undo.delete(postId);
        return undo;
      });
    }
  }

  // Like / unlike instantly, then store it (undo if storing fails)
  async function toggleLike(postId: string) {
    if (!user) return;
    const wasLiked = likedIds.has(postId);
    const setInSet = (liked: boolean) =>
      setLikedIds((current) => {
        const next = new Set(current); // a NEW set - never edit the old one
        if (liked) next.add(postId);
        else next.delete(postId);
        return next;
      });

    setInSet(!wasLiked);
    try {
      await setLiked(postId, user.uid, !wasLiked);
    } catch (error) {
      console.log("Like failed:", error);
      setInSet(wasLiked); // undo
    }
  }

  // Pull down to refresh
  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Friends' coffee</Text>
      {errorMessage !== "" && <Text style={styles.message}>{errorMessage}</Text>}
    </View>
  );

  // Nothing to show yet: invite them to add friends
  const empty = isLoading ? (
    <ActivityIndicator color={COLORS.plum} style={styles.spinner} />
  ) : (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>Your feed is quiet ☕</Text>
      <Text style={styles.emptyText}>
        {friendCount === 0
          ? "Add friends to see what they're drinking and where."
          : "None of your friends have posted yet. Share a coffee to get things started!"}
      </Text>
      {friendCount === 0 && (
        <Pressable style={styles.emptyButton} onPress={() => router.push("/find-friends")}>
          <Text style={styles.emptyButtonText}>Find friends</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require("@/assets/images/background_screen.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            // You can't save your own posts - only friends'
            isSaved={savedIds.has(item.id)}
            onToggleSave={item.user_id === user?.uid ? undefined : () => toggleSave(item.id)}
            isLiked={likedIds.has(item.id)}
            onToggleLike={item.user_id === user?.uid ? undefined : () => toggleLike(item.id)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.plum} />
        }
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120, // room for the nav pill
    gap: 16,
  },
  header: {
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.plum,
  },
  message: {
    marginTop: 8,
    color: COLORS.plum,
  },
  spinner: {
    marginTop: 40,
  },
  emptyBox: {
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.plum,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.plum,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 6,
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.plum,
    justifyContent: "center",
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
