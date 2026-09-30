// A two-column grid of post photos. Used by BOTH the café page and
// the profile page, so they always look the same.

import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { Image } from "expo-image";
import { ReactElement, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

const PLACEHOLDER = require("@/assets/images/cafe-placeholder.jpg");

type Props = {
  posts: Post[];
  onPressPost: (post: Post) => void;
  emptyText: string;
  header?: ReactElement; // optional content that scrolls ABOVE the grid (e.g. profile info)
};

export function PostGrid({ posts, onPressPost, emptyText, header }: Props) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => post.id}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.grid}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
      renderItem={({ item }) => (
        <PostTile post={item} onPress={() => onPressPost(item)} />
      )}
    />
  );
}

// One photo in the grid. If the photo can't load (a broken link, a deleted
// file...), switch to the placeholder instead of leaving an empty tile.
function PostTile({ post, onPress }: { post: Post; onPress: () => void }) {
  const [failed, setFailed] = useState(false);
  // Only real web links are photos (a very old post may hold a website path)
  const hasPhoto = post.image_url?.startsWith("http") && !failed;

  return (
    <Pressable style={styles.postCard} onPress={onPress}>
      <Image
        source={hasPhoto ? { uri: post.image_url! } : PLACEHOLDER}
        onError={(event) => {
          console.log("Post photo failed:", post.id, event.error);
          setFailed(true);
        }}
        style={styles.postImage}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  emptyText: {
    textAlign: "center",
    color: COLORS.plum,
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
