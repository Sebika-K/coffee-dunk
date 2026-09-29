// New post screen: photo, café, caption and rating -> posted to Firebase.
// Quick by default: photo, where, drink, rating (+ optional caption).
// Milk, hot/iced, tasting notes and the recipe live under "+ Add details".
// The SAME screen edits a post: open it with ?editPostId=... and the form
// starts filled in. The photo can't be changed when editing (like Instagram).

import { CafePicker, ChosenCafe } from "@/components/CafePicker";
import { ChoiceChips, MultiChoiceChips } from "@/components/Chips";
import { StarRating } from "@/components/StarRating";
import {
  BREW_METHODS,
  BrewMethodId,
  DRINKS,
  DrinkId,
  MILKS,
  MilkId,
  SOURCES,
  SourceId,
  TASTING_NOTES,
  TastingNoteId,
  TEMPERATURES,
  TemperatureId,
} from "@/constants/drinks";
import { COLORS } from "@/constants/theme";
import { useAuth } from "@/lib/AuthContext";
import { createPost, fetchPost, PostDetails, updatePost } from "@/lib/posts";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  // When editing, we get the post's id instead
  const { placeId, name, editPostId } = useLocalSearchParams<{
    placeId?: string;
    name?: string;
    editPostId?: string;
  }>();
  const isEditing = editPostId !== undefined;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [photoUri, setPhotoUri] = useState<string | null>(null); // the chosen photo on the phone
  const [cafe, setCafe] = useState<ChosenCafe | null>(
    // Start with the café we came from, if any
    placeId && name ? { placeId, name } : null
  );
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0); // 0 = not rated yet
  const [isPosting, setIsPosting] = useState(false);
  // Edit mode: the photo that's already online, and "still loading the post"
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(isEditing);

  // Journal fields (Phase 3)
  const [drink, setDrink] = useState<DrinkId | null>(null);
  const [drinkCustom, setDrinkCustom] = useState(""); // typed name for "Other"
  const [milk, setMilk] = useState<MilkId | null>(null);
  const [temperature, setTemperature] = useState<TemperatureId | null>(null);
  const [notes, setNotes] = useState<TastingNoteId[]>([]);

  // Café or homemade (Phase 7.3) - opened from a café page means café
  const [source, setSource] = useState<SourceId>("cafe");
  // Recipe fields (only used for homemade). Numbers are typed as text, converted when posting.
  const [method, setMethod] = useState<BrewMethodId | null>(null);
  const [beans, setBeans] = useState("");
  const [coffeeGrams, setCoffeeGrams] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [milkMl, setMilkMl] = useState("");
  const [sweetener, setSweetener] = useState("");
  const [steps, setSteps] = useState("");
  const isHome = source === "home";

  // "+ Add details" folds away the optional extras so a quick post is 4 taps
  const [showDetails, setShowDetails] = useState(false);
  // How many extras are filled in (shown on the folded button, so nothing feels lost)
  const recipeFilled = [beans, coffeeGrams, waterMl, milkMl, sweetener, steps].some(
    (text) => text.trim() !== ""
  );
  const detailsCount =
    (milk ? 1 : 0) +
    (temperature ? 1 : 0) +
    (notes.length > 0 ? 1 : 0) +
    (isHome && recipeFilled ? 1 : 0);

  // Edit mode: load the post once and fill in the form with what it says now
  useEffect(() => {
    if (!editPostId) return;
    fetchPost(editPostId)
      .then((post) => {
        if (!post) {
          Alert.alert("Post not found", "It may have been deleted.");
          router.back();
          return;
        }
        setExistingPhotoUrl(post.image_url);
        setSource(post.source);
        setCafe(post.place_id && post.cafe_name ? { placeId: post.place_id, name: post.cafe_name } : null);
        setCaption(post.caption ?? "");
        setRating(post.rating ?? 0);
        // Saved as plain text in the database -> tell TypeScript which kind of id it is
        setDrink(post.drink as DrinkId | null);
        setDrinkCustom(post.drink_custom ?? "");
        setMilk(post.milk as MilkId | null);
        setTemperature(post.temperature as TemperatureId | null);
        setNotes(post.notes as TastingNoteId[]);
        const r = post.recipe;
        if (r) {
          setMethod(r.method);
          setBeans(r.beans ?? "");
          setCoffeeGrams(r.coffee_g?.toString() ?? "");
          setWaterMl(r.water_ml?.toString() ?? "");
          setMilkMl(r.milk_ml?.toString() ?? "");
          setSweetener(r.sweetener ?? "");
          setSteps(r.steps ?? "");
        }
        // Open the details section if the post has any, so you can see them
        if (post.milk || post.temperature || post.notes.length > 0 || r) setShowDetails(true);
      })
      .catch((error) => {
        console.log("Loading post to edit failed:", error);
        Alert.alert("Couldn't load this post", "Please try again.");
        router.back();
      })
      .finally(() => setIsLoadingPost(false));
  }, [editPostId]);

  // A drink is required - and if it's "Other", it needs a typed name
  const hasDrink = drink !== null && (drink !== "other" || drinkCustom.trim() !== "");

  // Everything a post needs (caption, milk, hot/iced and notes are optional)
  // At a café -> needs the café. Made at home -> needs the brew method.
  const hasWhere = isHome ? method !== null : cafe !== null;
  // (When editing, the photo is already there)
  const hasPhoto = isEditing || photoUri !== null;
  const canPost = hasPhoto && hasWhere && hasDrink && rating > 0 && !isPosting && !isLoadingPost;

  async function handlePost() {
    // These checks also tell TypeScript the values can't be null below
    if (!user || !drink) return;
    if (isHome ? !method : !cafe) return;

    // Everything from the form, in one object (same for new and edited posts)
    const details: PostDetails = {
      placeId: isHome ? null : cafe?.placeId ?? null,
      cafeName: isHome ? null : cafe?.name ?? null,
      caption: caption.trim(),
      rating,
      drink,
      drinkCustom: drinkCustom.trim(),
      milk,
      temperature,
      notes,
      source,
      recipe:
        isHome && method
          ? {
              method,
              beans: beans.trim() || null, // empty text -> null
              coffee_g: toNumber(coffeeGrams),
              water_ml: toNumber(waterMl),
              milk_ml: toNumber(milkMl),
              sweetener: sweetener.trim() || null,
              steps: steps.trim() || null,
            }
          : null,
    };

    setIsPosting(true);
    try {
      if (editPostId) {
        await updatePost(editPostId, details);
      } else {
        if (!photoUri) return;
        await createPost({ photoUri, user, ...details });
      }
      router.back(); // close this screen - the screen underneath reloads when it comes back into view
    } catch (error) {
      console.log(isEditing ? "Edit failed:" : "Post failed:", error);
      Alert.alert(
        isEditing ? "Couldn't save" : "Couldn't post",
        "Something went wrong. Please try again."
      );
      setIsPosting(false);
    }
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
        <Text style={styles.title}>{isEditing ? "Edit Post" : "New Post"}</Text>
        <Pressable
          onPress={handlePost}
          disabled={!canPost}
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
        >
          {isPosting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.postButtonText}>{isEditing ? "Save" : "Post"}</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled" // taps on café results work even while typing
        automaticallyAdjustKeyboardInsets // scroll so the keyboard doesn't cover the caption
      >
        {isEditing ? (
          // Editing: show the photo that's already posted (it can't be changed)
          <View style={styles.photoStage}>
            {existingPhotoUrl && (
              <Image source={{ uri: existingPhotoUrl }} style={styles.photo} contentFit="cover" />
            )}
            {isLoadingPost && <ActivityIndicator color={COLORS.plum} style={styles.photoSpinner} />}
          </View>
        ) : (
          <>
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
          </>
        )}

        {/* ---- QUICK PART: the few things every post needs ---- */}
        <Text style={styles.label}>Where's it from?</Text>
        <ChoiceChips
          options={SOURCES}
          selected={source}
          onChange={(value) => value && setSource(value)} // one must always be chosen
        />

        {isHome ? (
          <>
            <Text style={styles.label}>How did you make it?</Text>
            <ChoiceChips options={BREW_METHODS} selected={method} onChange={setMethod} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Café</Text>
            <CafePicker selected={cafe} onSelect={setCafe} onClear={() => setCafe(null)} />
          </>
        )}

        <Text style={styles.label}>What did you drink?</Text>
        <ChoiceChips options={DRINKS} selected={drink} onChange={setDrink} />
        {drink === "other" && (
          <TextInput
            style={styles.otherInput}
            placeholder="e.g. Lavender honey latte"
            placeholderTextColor={COLORS.placeholder}
            value={drinkCustom}
            onChangeText={setDrinkCustom}
            maxLength={40}
          />
        )}

        <Text style={styles.label}>Your rating</Text>
        <StarRating value={rating} onChange={setRating} />

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

        {/* ---- DETAILS: optional extras, folded away until you want them ---- */}
        <Pressable
          style={styles.detailsToggle}
          onPress={() => setShowDetails((open) => !open)}
          accessibilityRole="button"
        >
          <Ionicons
            name={showDetails ? "remove-circle-outline" : "add-circle-outline"}
            size={20}
            color={COLORS.plum}
          />
          <Text style={styles.detailsToggleText}>
            {showDetails ? "Hide details" : isHome ? "Add details & recipe" : "Add details"}
          </Text>
          {/* When folded, show how many extras are already filled in */}
          {!showDetails && detailsCount > 0 && (
            <Text style={styles.detailsCount}>{detailsCount} added</Text>
          )}
        </Pressable>

        {showDetails && (
          <>
            <Text style={styles.label}>Milk</Text>
            <ChoiceChips options={MILKS} selected={milk} onChange={setMilk} />

            <Text style={styles.label}>Hot or iced?</Text>
            <ChoiceChips options={TEMPERATURES} selected={temperature} onChange={setTemperature} />

            <Text style={styles.label}>Tasting notes</Text>
            <MultiChoiceChips options={TASTING_NOTES} selected={notes} onChange={setNotes} />

            {isHome && (
              <>
                <Text style={styles.label}>Recipe</Text>
                <TextInput
                  style={styles.otherInput}
                  placeholder="Beans, e.g. Onyx Southern Weather"
                  placeholderTextColor={COLORS.placeholder}
                  value={beans}
                  onChangeText={setBeans}
                  maxLength={60}
                />
                <View style={styles.amountRow}>
                  <AmountInput label="Coffee" unit="g" value={coffeeGrams} onChange={setCoffeeGrams} />
                  <AmountInput label="Water" unit="ml" value={waterMl} onChange={setWaterMl} />
                  <AmountInput label="Milk" unit="ml" value={milkMl} onChange={setMilkMl} />
                </View>
                <TextInput
                  style={styles.otherInput}
                  placeholder="Sweetener, e.g. 1 tsp vanilla syrup"
                  placeholderTextColor={COLORS.placeholder}
                  value={sweetener}
                  onChangeText={setSweetener}
                  maxLength={60}
                />
                <TextInput
                  style={styles.captionInput}
                  placeholder={"Steps, e.g.\n1. Bloom 30s with 40ml water\n2. Pour the rest slowly"}
                  placeholderTextColor={COLORS.placeholder}
                  value={steps}
                  onChangeText={setSteps}
                  multiline
                  maxLength={600}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// "18" -> 18, "" or "abc" -> null
function toNumber(text: string): number | null {
  const n = parseFloat(text.replace(",", ".")); // allow "12,5" as well as "12.5"
  return Number.isFinite(n) && n > 0 ? n : null;
}

// A small labelled number box, e.g.  Coffee [ 18 ] g
function AmountInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <View style={styles.amountBox}>
      <Text style={styles.amountLabel}>{label}</Text>
      <View style={styles.amountInputRow}>
        <TextInput
          style={styles.amountInput}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad" // number keyboard
          placeholder="–"
          placeholderTextColor={COLORS.placeholder}
          maxLength={5}
        />
        <Text style={styles.amountUnit}>{unit}</Text>
      </View>
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
  otherInput: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.2)",
    fontSize: 15,
    color: COLORS.plum,
  },
  amountRow: {
    flexDirection: "row",
    gap: 10,
  },
  amountBox: {
    flex: 1,
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.placeholder,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.2)",
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.plum,
  },
  amountUnit: {
    color: COLORS.placeholder,
    fontSize: 14,
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
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(125, 46, 77, 0.35)",
  },
  detailsToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.plum,
  },
  detailsCount: {
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
  photoSpinner: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
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
