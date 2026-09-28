// New post screen: photo, café, caption and rating.
// (Actually posting to Firebase comes in step 2.7c.)

import { CafePicker, ChosenCafe } from "@/components/CafePicker";
import { StarRating } from "@/components/StarRating";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Settings shared by the camera and the gallery
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true, // let the user crop...
  aspect: [4, 5], // ...to the same 4:5 shape our posts use
  quality: 0.7, // a little compression = faster uploads, less storage
};

export default function UploadScreen() {
  // When opened from a café page, we already know which café
  const { placeId, name } = useLocalSearchParams<{ placeId?: string; name?: string }>();
  const insets = useSafeAreaInsets();

  const [photoUri, setPhotoUri] = useState<string | null>(null); // the chosen photo on the phone
  const [cafe, setCafe] = useState<ChosenCafe | null>(
    // Start with the café we came from, if any
    placeId && name ? { placeId, name } : null
  );
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0); // 0 = not rated yet

  // Everything a post needs (caption is optional)
  const canPost = photoUri !== null && cafe !== null && rating > 0;

  function handlePost() {
    // Step 2.7c will upload to Firebase here. For now, prove we have everything.
    console.log("Ready to post:", { photoUri, cafe, caption: caption.trim(), rating });
    Alert.alert("Almost there!", "Posting to Firebase comes in the next step.");
  }

  async function takePhoto() {
    // The camera needs the user's permission first
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "To take a photo, allow camera access for this app in your phone's Settings."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityLabel="Cancel">
          <Ionicons name="close" size={24} color={COLORS.plum} />
        </Pressable>
        <Text style={styles.title}>New Post</Text>
        <Pressable
          onPress={handlePost}
          disabled={!canPost}
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" // taps on café results work even while typing
        automaticallyAdjustKeyboardInsets // scroll so the keyboard doesn't cover the caption
      >
        {/* The photo area: tap it to pick from the gallery */}
        <Pressable style={styles.photoStage} onPress={pickFromGallery}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.emptyStage}>
              <Ionicons name="image-outline" size={48} color={COLORS.placeholder} />
              <Text style={styles.emptyText}>Add a photo of your coffee</Text>
            </View>
          )}

          {photoUri && (
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={styles.removeButton}
              accessibilityLabel="Remove photo"
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </Pressable>
          )}
        </Pressable>

        <View style={styles.pickerRow}>
          <Pressable style={styles.pickerButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={22} color={COLORS.plum} />
            <Text style={styles.pickerText}>Camera</Text>
          </Pressable>
          <Pressable style={styles.pickerButton} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={22} color={COLORS.plum} />
            <Text style={styles.pickerText}>Gallery</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Café</Text>
        <CafePicker selected={cafe} onSelect={setCafe} onClear={() => setCafe(null)} />

        <Text style={styles.label}>Your rating</Text>
        <StarRating value={rating} onChange={setRating} />

        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="How was it? (optional)"
          placeholderTextColor={COLORS.placeholder}
          value={caption}
          onChangeText={setCaption}
          multiline // lets the caption be several lines
          maxLength={300}
        />
        <Text style={styles.counter}>{caption.length}/300</Text>
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
    gap: 16,
  },
  postButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: COLORS.plum,
    alignItems: "center",
    justifyContent: "center",
  },
  postButtonDisabled: {
    opacity: 0.35,
  },
  postButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  label: {
    marginTop: 8,
    marginBottom: -6,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.plum,
  },
  captionInput: {
    minHeight: 90,
    borderRadius: 12,
    padding: 14,
    paddingTop: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.2)",
    fontSize: 15,
    color: COLORS.plum,
    textAlignVertical: "top", // Android: start typing at the top, not the middle
  },
  counter: {
    alignSelf: "flex-end",
    marginTop: -10,
    fontSize: 12,
    color: COLORS.placeholder,
  },
  photoStage: {
    width: "100%",
    aspectRatio: 4 / 5,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.sand,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  emptyStage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: COLORS.placeholder,
    fontSize: 15,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pickerText: {
    color: COLORS.plum,
    fontSize: 16,
  },
});
