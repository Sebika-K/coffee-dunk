// A single journal entry, full screen: photo, what you drank, tasting notes,
// rating, café, caption. Replaces the old popup - there's more room here,
// and every post has its own address: /post/<postId>

import { RecipeCard } from "@/components/RecipeCard";
import { SaveButton } from "@/components/SaveButton";
import { StarRating } from "@/components/StarRating";
import { brewMethodLabel, describeDrink, tastingNoteLabel } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { avatarSource, formatDate } from "@/lib/format";
import { deletePost, fetchPost } from "@/lib/posts";
import { isPostSaved, savePost, unsavePost } from "@/lib/saved";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Is this post in my "Want to try"?
  useEffect(() => {
    if (!user) return;
    isPostSaved(user.uid, postId)
      .then(setIsSaved)
      .catch(() => {});
  }, [user, postId]);

  async function toggleSave() {
    if (!user) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved); // instant
    try {
      if (wasSaved) await unsavePost(user.uid, postId);
      else await savePost(user.uid, postId);
    } catch (error) {
      console.log("Save failed:", error);
      setIsSaved(wasSaved); // undo
    }
  }

  // Load this one post when the page opens
  useEffect(() => {
    let isActive = true;
    fetchPost(postId)
      .then((result) => {
        if (!isActive) return;
        if (result) setPost(result);
        else setErrorMessage("This post doesn't exist anymore.");
      })
      .catch((error) => {
        console.log("Post load failed:", error);
        if (isActive) setErrorMessage("Couldn't load this post.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [postId]);

  const isMine = post !== null && user !== null && post.user_id === user.uid;

  function confirmDelete() {
    Alert.alert("Delete this post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    if (!post) return;
    setIsDeleting(true);
    try {
      await deletePost(post);
      router.back(); // the screen underneath reloads itself when it comes back into view
    } catch (error) {
      console.log("Delete failed:", error);
      Alert.alert("Couldn't delete", "Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  function openCafe() {
    if (!post?.place_id) return;
    router.push({
      pathname: "/search/cafe/[placeId]",
      params: { placeId: post.place_id, name: post.cafe_name ?? "Café" },
    });
  }

  const drinkName = post ? describeDrink(post) : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        {post && !isMine && (
          <View style={styles.iconButton}>
            <SaveButton isSaved={isSaved} onToggle={toggleSave} size={24} />
          </View>
        )}
        {isMine && (
          <Pressable
            onPress={confirmDelete}
            disabled={isDeleting}
            style={styles.iconButton}
            accessibilityLabel="Delete post"
          >
            {isDeleting ? (
              <ActivityIndicator color={COLORS.plum} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={COLORS.plum} />
            )}
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.plum} style={styles.spinner} />
      ) : !post ? (
        <Text style={styles.message}>{errorMessage}</Text>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
          <Image
            source={
              post.image_url
                ? { uri: post.image_url }
                : require("@/assets/images/cafe-placeholder.jpg")
            }
            style={styles.photo}
            contentFit="cover"
            transition={200}
          />

          {/* Who and when */}
          <View style={styles.userRow}>
            <Image source={avatarSource(post.user_avatar)} style={styles.avatar} />
            <Text style={styles.username}>{post.user ?? "Anon"}</Text>
            {post.created_at && <Text style={styles.date}>{formatDate(post.created_at)}</Text>}
          </View>

          {/* What they drank + how it was */}
          {drinkName && <Text style={styles.drink}>{drinkName}</Text>}
          <View style={styles.ratingRow}>
            <StarRating value={post.rating ?? 0} size={22} />
          </View>
          {post.notes.length > 0 && (
            <View style={styles.notesRow}>
              {post.notes.map((note) => (
                <Text key={note} style={styles.note}>
                  {tastingNoteLabel(note)}
                </Text>
              ))}
            </View>
          )}

          {/* Where: made at home... */}
          {post.source === "home" && (
            <View style={styles.cafeRow}>
              <Ionicons name="home-outline" size={18} color={COLORS.plum} />
              <Text style={styles.cafeName}>
                Made at home
                {post.recipe ? ` · ${brewMethodLabel(post.recipe.method)}` : ""}
              </Text>
            </View>
          )}

          {/* ...or at a café - tap to open the café page */}
          {post.source === "cafe" && post.cafe_name && (
            <Pressable onPress={openCafe} disabled={!post.place_id} style={styles.cafeRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.plum} />
              <Text style={styles.cafeName}>{post.cafe_name}</Text>
              {post.place_id && (
                <Ionicons name="chevron-forward" size={16} color={COLORS.placeholder} />
              )}
            </Pressable>
          )}

          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

          {/* The full recipe for homemade coffee */}
          {post.source === "home" && post.recipe && <RecipeCard recipe={post.recipe} />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginTop: 60,
  },
  message: {
    marginTop: 60,
    textAlign: "center",
    color: COLORS.plum,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 16,
    backgroundColor: COLORS.sand,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  username: {
    flex: 1,
    color: COLORS.plum,
    fontWeight: "600",
    fontSize: 15,
  },
  date: {
    color: COLORS.placeholder,
    fontSize: 13,
  },
  drink: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.plum,
    marginTop: 4,
  },
  ratingRow: {
    alignItems: "flex-start",
  },
  notesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  note: {
    fontSize: 13,
    color: COLORS.plum,
    backgroundColor: COLORS.sand,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  cafeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.15)",
  },
  cafeName: {
    flex: 1,
    color: COLORS.plum,
    fontSize: 15,
    fontWeight: "600",
  },
  caption: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.plum,
  },
});
