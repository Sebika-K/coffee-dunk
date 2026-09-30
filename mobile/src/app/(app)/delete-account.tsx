// Delete account: explains what will be deleted, asks for your password,
// then asks the backend to delete everything.

import { COLORS } from "@/constants/theme";
import { deleteAccount } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { FirebaseError } from "firebase/app";
import { EmailAuthProvider, reauthenticateWithCredential, signOut } from "firebase/auth";
import { router } from "expo-router";
import { useState } from "react";
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

const WHAT_GETS_DELETED = [
  "All your posts and their photos",
  "Likes you gave and got",
  "Your friends and friend requests",
  "Your saved coffees",
  "Your username, photo and bio",
];

export default function DeleteAccountScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    if (!user?.email) return;
    setErrorMessage("");
    setIsDeleting(true);
    try {
      // 1) Prove it's really you: check the password again. This stops anyone
      //    who picks up your unlocked phone from deleting your account.
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

      // 2) The backend deletes all your data, then the account itself
      await deleteAccount(user);

      // 3) Clear the login on this phone -> the app goes back to the start screen
      await signOut(auth);
      Alert.alert("Account deleted", "Thanks for sharing your coffee with us ☕");
    } catch (error) {
      console.log("Delete account failed:", error);
      if (
        error instanceof FirebaseError &&
        (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password")
      ) {
        setErrorMessage("That password isn't right.");
      } else if (error instanceof FirebaseError && error.code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Please wait a bit and try again.");
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
      }
      setIsDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete your account?", "This is permanent and can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete forever", style: "destructive", onPress: handleDelete },
    ]);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title}>Delete account</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.lead}>This permanently deletes:</Text>
        {WHAT_GETS_DELETED.map((item) => (
          <View key={item} style={styles.item}>
            <Ionicons name="close-circle-outline" size={18} color={COLORS.plum} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
        <Text style={styles.note}>It can't be undone.</Text>

        <Text style={styles.label}>Type your password to confirm</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          placeholder="Password"
          placeholderTextColor={COLORS.placeholder}
          editable={!isDeleting}
        />
        {errorMessage !== "" && <Text style={styles.error}>{errorMessage}</Text>}

        <Pressable
          style={[styles.deleteButton, (password === "" || isDeleting) && styles.disabled]}
          onPress={confirmDelete}
          disabled={password === "" || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.deleteText}>Delete my account</Text>
          )}
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
  content: {
    padding: 20,
    gap: 10,
  },
  lead: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.plum,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemText: {
    fontSize: 15,
    color: COLORS.plum,
  },
  note: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.placeholder,
  },
  label: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.plum,
  },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.2)",
    fontSize: 15,
    color: COLORS.plum,
  },
  error: {
    color: "#B3261E",
    fontSize: 14,
  },
  deleteButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#B3261E", // red: this one is dangerous
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  deleteText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
