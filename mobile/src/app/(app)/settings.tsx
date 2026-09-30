// Settings: change your photo, username and bio, or log out.
// One screen instead of the web app's four separate settings pages.

import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { fetchUserBio, refreshAuthorOnMyPosts } from "@/lib/posts";
import { saveBio, saveProfilePhoto, saveUsername } from "@/lib/profile";
import { USERNAME_MAX, usernameProblem, UsernameTakenError } from "@/lib/usernames";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MAX_BIO = 200; // same limit as the web app

export default function SettingsScreen() {
  const { user, displayName, photoURL, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState(displayName ?? "");
  const [bio, setBio] = useState("");
  const [savedBio, setSavedBio] = useState(""); // what's in the database, to spot changes
  const [isSaving, setIsSaving] = useState(false);
  // A newly picked photo that hasn't been saved yet (null = no new photo)
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);

  // Fill in the current bio when the screen opens
  useEffect(() => {
    if (!user) return;
    fetchUserBio(user.uid)
      .then((current) => {
        setBio(current);
        setSavedBio(current);
      })
      .catch((error) => console.log("Bio load failed:", error));
  }, [user]);

  const usernameChanged = username.trim() !== (displayName ?? "");
  const bioChanged = bio.trim() !== savedBio;
  const photoChanged = newPhotoUri !== null;
  const canSave =
    (usernameChanged || bioChanged || photoChanged) && username.trim() !== "" && !isSaving;

  // Picking a photo only PREVIEWS it - nothing is uploaded until you tap Save,
  // just like the username and bio. Going back without saving = no change.
  async function handleChangePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1], // square, for the round profile picture
      quality: 0.6,
    });
    if (!result.canceled) setNewPhotoUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!user) return;
    // Check a NEW username's format first (older names with e.g. spaces are
    // left alone until you change them)
    const problem = usernameChanged ? usernameProblem(username.trim()) : null;
    if (problem) {
      Alert.alert("Username", problem);
      return;
    }

    setIsSaving(true);
    try {
      // Only save what actually changed. The username goes first: if it's
      // taken, we stop before changing anything else.
      if (usernameChanged) await saveUsername(user, username.trim());
      if (photoChanged) await saveProfilePhoto(user, newPhotoUri);
      if (bioChanged) {
        await saveBio(user.uid, bio.trim());
        setSavedBio(bio.trim());
      }
      // New name or photo -> update the copy stored on your old posts too.
      // If this part fails, your profile is still saved - we just log it.
      if (usernameChanged || photoChanged) {
        await refreshAuthorOnMyPosts(user.uid, user.displayName ?? username.trim(), user.photoURL).catch(
          (error) => console.log("Couldn't refresh name/photo on old posts:", error)
        );
      }
      refreshUser(); // make the nav pill + profile show the new name/photo
      router.back();
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        Alert.alert("Username taken", `"${username.trim()}" is already taken. Try another one.`);
      } else {
        console.log("Save failed:", error);
        Alert.alert("Couldn't save", "Something went wrong. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function confirmLogOut() {
    Alert.alert("Log out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => signOut(auth) },
    ]);
  }

  // Show the new photo if one was picked, otherwise the current one
  const avatar = newPhotoUri
    ? { uri: newPhotoUri }
    : photoURL
    ? { uri: photoURL }
    : require("@/assets/images/default-avatar.jpg");

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Profile photo */}
        <Pressable style={styles.photoArea} onPress={handleChangePhoto} disabled={isSaving}>
          <Image source={avatar} style={styles.avatar} contentFit="cover" />
          <Text style={styles.changePhoto}>
            {photoChanged ? "New photo — tap Save to keep it" : "Change photo"}
          </Text>
        </Pressable>

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={USERNAME_MAX}
          placeholder="Username"
          placeholderTextColor={COLORS.placeholder}
        />

        {/* Bio */}
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={MAX_BIO}
          placeholder="Tell people about your coffee taste ☕"
          placeholderTextColor={COLORS.placeholder}
        />
        <Text style={styles.counter}>
          {bio.length}/{MAX_BIO}
        </Text>

        {/* Account */}
        <Text style={styles.email}>Logged in as {user?.email}</Text>
        <Pressable style={styles.logOutButton} onPress={confirmLogOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.plum} />
          <Text style={styles.logOutText}>Log out</Text>
        </Pressable>

        <Pressable style={styles.deleteAccountButton} onPress={() => router.push("/blocked")}>
          <Text style={styles.blockedText}>Blocked accounts</Text>
        </Pressable>

        {/* Small and quiet on purpose - it's permanent */}
        <Pressable style={styles.deleteAccountButton} onPress={() => router.push("/delete-account")}>
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </Pressable>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.plum,
  },
  saveButton: {
    height: 36,
    minWidth: 64,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.35,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  photoArea: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "white",
  },
  changePhoto: {
    color: COLORS.link,
    fontSize: 15,
  },
  label: {
    marginTop: 8,
    marginBottom: -4,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.plum,
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.2)",
    fontSize: 15,
    color: COLORS.plum,
  },
  bioInput: {
    minHeight: 90,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    marginTop: -6,
    fontSize: 12,
    color: COLORS.placeholder,
  },
  email: {
    marginTop: 24,
    textAlign: "center",
    color: COLORS.placeholder,
    fontSize: 13,
  },
  logOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
  },
  deleteAccountButton: {
    alignSelf: "center",
    padding: 8,
  },
  blockedText: {
    color: COLORS.plum,
    fontSize: 15,
  },
  deleteAccountText: {
    color: COLORS.placeholder,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  logOutText: {
    color: COLORS.plum,
    fontSize: 16,
  },
});
