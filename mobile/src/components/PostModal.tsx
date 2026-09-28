// The post popup: tap a post on a café page to see it large,
// with who posted it, their caption and rating.
// Rebuilt from the web app's modal in cafe-detail.js / cafe-detail.css.

import { describeDrink, tastingNoteLabel } from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { deletePost } from "@/lib/posts";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  post: Post | null; // the post to show, or null when the popup is closed
  onClose: () => void;
  onDeleted?: (post: Post) => void; // optional: tells the screen a post was deleted
};

export function PostModal({ post, onClose, onDeleted }: Props) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  // Only the person who posted it can delete it
  const isMine = post !== null && user !== null && post.user_id === user.uid;

  function confirmDelete() {
    if (!post) return;
    // Ask first - deleting can't be undone
    Alert.alert("Delete this post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => handleDelete(post) },
    ]);
  }

  async function handleDelete(postToDelete: Post) {
    setIsDeleting(true);
    try {
      await deletePost(postToDelete);
      onDeleted?.(postToDelete); // let the screen remove it from its grid
      onClose();
    } catch (error) {
      console.log("Delete failed:", error);
      Alert.alert("Couldn't delete", "Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      visible={post !== null}
      transparent // let the dimmed café page show behind the popup
      animationType="fade"
      onRequestClose={onClose} // Android's back button closes it
    >
      {/* Tapping the dark area outside the card closes the popup */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {post && (
          // Tapping INSIDE the card should not close it, so this Pressable
          // "catches" the tap and does nothing with it
          <Pressable style={styles.card} onPress={() => {}}>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={COLORS.plum} />
            </Pressable>

            <Image
              source={
                post.image_url
                  ? { uri: post.image_url }
                  : require("@/assets/images/cafe-placeholder.jpg")
              }
              style={styles.photo}
              contentFit="cover"
            />

            <View style={styles.userRow}>
              <Image source={avatarSource(post.user_avatar)} style={styles.avatar} />
              <Text style={styles.username}>{post.user ?? "Anon"}</Text>
              {post.created_at && <Text style={styles.date}>{formatDate(post.created_at)}</Text>}
            </View>

            {/* Journal details - only on posts made after Phase 3 */}
            {describeDrink(post) && <Text style={styles.drink}>☕ {describeDrink(post)}</Text>}
            {post.notes.length > 0 && (
              <View style={styles.notesRow}>
                {post.notes.map((note) => (
                  <Text key={note} style={styles.note}>
                    {tastingNoteLabel(note)}
                  </Text>
                ))}
              </View>
            )}

            {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
            <Text style={styles.rating}>Rating: {post.rating ?? "–"} ⭐</Text>

            {isMine && (
              <Pressable
                onPress={confirmDelete}
                disabled={isDeleting}
                style={styles.deleteButton}
                accessibilityLabel="Delete post"
              >
                {isDeleting ? (
                  <ActivityIndicator color={COLORS.plum} />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color={COLORS.plum} />
                    <Text style={styles.deleteText}>Delete post</Text>
                  </>
                )}
              </Pressable>
            )}
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

// Old posts from the web app sometimes saved the avatar as a website path
// like "/static/assets/default-avatar.jpg". That only works on the website,
// so on the phone we only trust full "http..." links.
function avatarSource(avatar: string | null) {
  return avatar?.startsWith("http")
    ? { uri: avatar }
    : require("@/assets/images/default-avatar.jpg");
}

// "2025-08-12T14:03:22+00:00" -> "Aug 12, 2025" (in the phone's own language)
function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1, // sit on top of the photo
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 10,
    backgroundColor: COLORS.sand,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  username: {
    flex: 1,
    color: COLORS.plum,
    fontWeight: "600",
  },
  date: {
    color: COLORS.placeholder,
    fontSize: 12,
  },
  drink: {
    marginTop: 10,
    color: COLORS.plum,
    fontSize: 16,
    fontWeight: "700",
  },
  notesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  note: {
    fontSize: 12,
    color: COLORS.plum,
    backgroundColor: COLORS.sand,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: "hidden",
  },
  caption: {
    marginTop: 8,
    color: COLORS.plum,
    fontSize: 15,
  },
  rating: {
    marginTop: 6,
    color: COLORS.plum,
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  deleteText: {
    color: COLORS.plum,
    fontSize: 14,
  },
});
