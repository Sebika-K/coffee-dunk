// One café's page: its name and a grid of everyone's posts there.
// The [placeId] in the file name means this screen works for ANY café -
// the id comes from the address, e.g. /search/cafe/ChIJOzVa9gSLj4ARFQqljssXWUI

import { PostModal } from "@/components/PostModal";
import { COLORS } from "@/constants/theme";
import { fetchCafePosts, Post } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); // the post in the popup

  // Load the posts when the screen opens (and again if the café changes)
  useEffect(() => {
    let isActive = true; // becomes false if you leave before the posts arrive

    async function load() {
      try {
        const result = await fetchCafePosts(placeId);
        if (isActive) setPosts(result);
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    load();
    return () => {
      isActive = false; // clean-up: ignore late answers for a screen that's gone
    };
  }, [placeId]);

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
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={<Text style={styles.message}>No posts here yet. Be the first!</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.postCard}
              onPress={() => setSelectedPost(item)} // open the popup with this post
            >
              <Image
                source={
                  item.image_url
                    ? { uri: item.image_url }
                    : require("@/assets/images/cafe-placeholder.jpg")
                }
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
          )}
        />
      )}

      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
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
  grid: {
    padding: 16,
    paddingBottom: 120, // room for the nav pill
    gap: 16,
  },
  gridRow: {
    gap: 16,
  },
  postCard: {
    flex: 1,
    maxWidth: "48%", // keeps a single last post from stretching full width
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: COLORS.card,
  },
  postImage: {
    width: "100%",
    aspectRatio: 4 / 5,
  },
});
