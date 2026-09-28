// The post popup: tap a post on a café page to see it large,
// with who posted it, their caption and rating.
// Rebuilt from the web app's modal in cafe-detail.js / cafe-detail.css.

import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  post: Post | null; // the post to show, or null when the popup is closed
  onClose: () => void;
};

export function PostModal({ post, onClose }: Props) {
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

            {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
            <Text style={styles.rating}>Rating: {post.rating ?? "–"} ⭐</Text>
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
});
