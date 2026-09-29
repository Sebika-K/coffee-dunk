// A single journal entry, full screen: photo, what you drank, tasting notes,
// rating, café, caption. Replaces the old popup - there's more room here,
// and every post has its own address: /post/<postId>

import { LikeButton } from "@/components/LikeButton";
import { LikedByList } from "@/components/LikedByList";
import { RecipeCard } from "@/components/RecipeCard";
import { fetchLikersOfMyPost, isLikedByMe, setLiked } from "@/lib/likes";
import { PublicProfile } from "@/lib/friends";
import { SaveButton } from "@/components/SaveButton";
import { StarRating } from "@/components/StarRating";
import { brewMethodLabel, describeDrink, tastingNoteLabel } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { avatarSource, formatDate } from "@/lib/format";
import { openUserProfile } from "@/lib/navigation";
import { deletePost, fetchPost } from "@/lib/posts";
import { isPostSaved, savePost, unsavePost } from "@/lib/saved";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
  const [isLiked, setIsLiked] = useState(false); // did I like this friend's post?
  const [likers, setLikers] = useState<PublicProfile[]>([]); // who liked MY post

  // Have I saved this post?
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

  // Load this one post when the page comes into view - also after editing it,
  // so the changes show straight away
  useFocusEffect(
    useCallback(() => {
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
    }, [postId])
  );

  const isMine = post !== null && user !== null && post.user_id === user.uid;

  // Likes: on MY post, load who liked it; on a friend's post, load whether I liked it
  useEffect(() => {
    if (!user || !post) return;
    if (post.user_id === user.uid) {
      fetchLikersOfMyPost(post.id).then(setLikers).catch(() => {});
    } else {
      isLikedByMe(post.id, user.uid).then(setIsLiked).catch(() => {});
    }
  }, [user, post]);

  async function toggleLike() {
    if (!user || !post) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked); // instant
    try {
      await setLiked(post.id, user.uid, !wasLiked);
    } catch (error) {
      console.log("Like failed:", error);
      setIsLiked(wasLiked); // undo
    }
  }

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
        {isMine && (
          <View style={styles.headerActions}>
            <Pressable
              onPress={() =>
                router.push({ pathname: "/upload", params: { editPostId: post.id } })
              }
              style={styles.iconButton}
              accessibilityLabel="Edit post"
            >
              <Ionicons name="create-outline" size={23} color={COLORS.plum} />
            </Pressable>
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
          </View>
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

          {/* Friend's post: ❤️ on the left, 🔖 on the right, like Instagram */}
          {!isMine && (
            <View style={styles.actionRow}>
              <LikeButton isLiked={isLiked} onToggle={toggleLike} size={28} />
              <View style={styles.spacer} />
              <SaveButton isSaved={isSaved} onToggle={toggleSave} size={26} />
            </View>
          )}

          {/* Who and when - tap to open their profile */}
          <Pressable
            onPress={() => openUserProfile(post.user_id, user?.uid)}
            style={styles.userRow}
            hitSlop={6}
          >
            <Image source={avatarSource(post.user_avatar)} style={styles.avatar} />
            <Text style={styles.username}>{post.user ?? "Anon"}</Text>
            {post.created_at && <Text style={styles.date}>{formatDate(post.created_at)}</Text>}
          </Pressable>

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

          {/* My post: who liked it (only I can see this) */}
          {isMine && <LikedByList likers={likers} />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  spacer: {
    flex: 1,
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
