// Someone else's profile: their photo, stats, bio and posts.
// Opened by tapping a name or photo anywhere in the app.
//
// PRIVACY (friends-only): you only see their posts once you're friends.
// Until then you see who they are + a button to add them.
// Their coffee diary is PRIVATE - it only ever shows on your own Profile tab.

import { PostGrid } from "@/components/PostGrid";
import { ProfileSummary } from "@/components/ProfileSummary";
import { openSafetyMenu } from "@/components/SafetyMenu";
import { COLORS } from "@/constants/theme";
import { Post } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import {
  acceptFriendRequest,
  fetchProfile,
  FriendState,
  getFriendState,
  PublicProfile,
  removeFriendship,
  sendFriendRequest,
} from "@/lib/friends";
import { fetchUserBio, fetchUserPosts } from "@/lib/posts";
import { calculateStats } from "@/lib/stats";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [bio, setBio] = useState("");
  const [friendState, setFriendState] = useState<FriendState>("none");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false); // friend button is working
  const [errorMessage, setErrorMessage] = useState("");

  const myId = user?.uid;

  // Load who they are + how we're connected. Posts ONLY if we're friends.
  const load = useCallback(async () => {
    if (!myId || !userId) return;
    try {
      const [theirProfile, theirBio, state] = await Promise.all([
        fetchProfile(userId),
        fetchUserBio(userId),
        getFriendState(myId, userId),
      ]);
      setProfile(theirProfile);
      setBio(theirBio);
      setFriendState(state);
      setPosts(state === "friends" ? await fetchUserPosts(userId) : []);
      setErrorMessage("");
    } catch (error) {
      console.log("User profile load failed:", error);
      setErrorMessage("Couldn't load this profile. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, [myId, userId]);

  // Reload when the page comes into view (e.g. back from one of their posts)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = useMemo(() => calculateStats(posts), [posts]);
  const isFriend = friendState === "friends";

  // Run a friend action, then reload so the page matches the new state
  async function act(action: () => Promise<void>) {
    setIsBusy(true);
    try {
      await action();
      await load();
    } catch (error) {
      console.log("Friend action failed:", error);
      Alert.alert("Something went wrong", "Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleFriendButton() {
    if (!myId || !userId) return;
    if (friendState === "none") act(() => sendFriendRequest(myId, userId));
    else if (friendState === "incoming") act(() => acceptFriendRequest(myId, userId));
    else if (friendState === "requested") {
      Alert.alert("Cancel friend request?", undefined, [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: () => act(() => removeFriendship(myId, userId)),
        },
      ]);
    }
    // "friends": nothing to do here - unfriending lives in your Friends list
  }

  const name = profile?.username ?? "";

  function confirmUnfriend() {
    if (!myId || !userId) return;
    Alert.alert(`Remove ${name}?`, "You'll stop seeing each other's coffee.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => act(() => removeFriendship(myId, userId)),
      },
    ]);
  }

  function openMenu() {
    if (!myId || !userId) return;
    openSafetyMenu({
      myId,
      otherId: userId,
      otherName: name,
      onBlocked: () => router.back(),
      onUnfriend: isFriend ? confirmUnfriend : undefined,
    });
  }

  // Everything above the grid - scrolls together with the posts
  const header = (
    <View style={styles.headerArea}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.username} numberOfLines={1}>
          {name}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={COLORS.plum} style={styles.spinner} />
      ) : profile ? (
        <>
          <ProfileSummary
            photoUrl={profile.photo_url}
            name={name}
            stats={isFriend ? stats : null}
            bio={bio}
          />

          {/* The friend button, with a small ⋯ pill next to it for
              Remove friend / Report / Block */}
          <View style={styles.actionRow}>
            <FriendButton state={friendState} busy={isBusy} onPress={handleFriendButton} />
            <Pressable
              onPress={openMenu}
              style={styles.morePill}
              accessibilityLabel={`More options for ${name}`}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.plum} />
            </Pressable>
          </View>

          {/* Not friends yet: a friendly locked message instead of their posts */}
          {!isFriend && (
            <View style={styles.locked}>
              <Ionicons name="lock-closed-outline" size={22} color={COLORS.plum} />
              <Text style={styles.lockedText}>
                {friendState === "incoming"
                  ? `Accept ${name}'s request to see their coffee.`
                  : `Add ${name} as a friend to see their coffee.`}
              </Text>
            </View>
          )}
        </>
      ) : null}

      {errorMessage !== "" && <Text style={styles.error}>{errorMessage}</Text>}
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
        emptyText={isLoading || !isFriend ? "" : `${name} hasn't posted any coffee yet.`}
      />
    </ImageBackground>
  );
}

// The one button under their photo. Its look depends on how we're connected.
function FriendButton({
  state,
  busy,
  onPress,
}: {
  state: FriendState;
  busy: boolean;
  onPress: () => void;
}) {
  const labels: Record<FriendState, string> = {
    none: "Add friend",
    requested: "Requested",
    incoming: "Accept request",
    friends: "Friends ✓",
  };
  // Filled plum = something you can do; outlined = already done
  const isAction = state === "none" || state === "incoming";

  return (
    <Pressable
      onPress={onPress}
      disabled={busy || state === "friends"}
      style={[styles.friendButton, isAction ? styles.friendButtonFilled : styles.friendButtonOutline]}
    >
      {busy ? (
        <ActivityIndicator color={isAction ? "white" : COLORS.plum} />
      ) : (
        <Text style={isAction ? styles.friendTextFilled : styles.friendTextOutline}>
          {labels[state]}
        </Text>
      )}
    </Pressable>
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
    gap: 4,
    marginLeft: -8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.plum,
  },
  spinner: {
    marginTop: 32,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  morePill: {
    width: 44,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  friendButton: {
    flex: 1, // takes the row's width, next to the ⋯ pill
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  friendButtonFilled: {
    backgroundColor: COLORS.plum,
  },
  friendButtonOutline: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
  },
  friendTextFilled: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  friendTextOutline: {
    color: COLORS.plum,
    fontWeight: "600",
    fontSize: 15,
  },
  locked: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    gap: 8,
  },
  lockedText: {
    fontSize: 15,
    color: COLORS.plum,
    textAlign: "center",
  },
  error: {
    marginTop: 12,
    color: COLORS.plum,
  },
});
