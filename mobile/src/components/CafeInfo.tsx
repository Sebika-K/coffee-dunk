// The top of a café page: photo, name, address, rating, open/closed,
// and buttons for Directions / Call / Website.
// Shows the name straight away, then fills in the rest once Google answers.

import { COLORS } from "@/constants/theme";
import { CafeDetails, cafePhotoUrl } from "@/lib/api";
import { formatRating } from "@/lib/stats";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  name: string; // known right away (passed in when the page opened)
  details: CafeDetails | null; // null while loading, or if it failed
};

export function CafeInfo({ name, details }: Props) {
  const [showHours, setShowHours] = useState(false);

  const photo = details?.photo_ref ? { uri: cafePhotoUrl(details.photo_ref, 800) } : null;

  // Directions: Apple Maps on iPhone, Google Maps on Android
  function openDirections() {
    if (!details) return;
    const label = encodeURIComponent(details.name ?? name);
    if (Platform.OS === "ios" && details.latitude != null && details.longitude != null) {
      Linking.openURL(`https://maps.apple.com/?q=${label}&ll=${details.latitude},${details.longitude}`);
    } else if (details.maps_url) {
      Linking.openURL(details.maps_url);
    }
  }

  return (
    <View style={styles.card}>
      {/* Photo (or a soft coloured block while loading / if there's none) */}
      {photo ? (
        <Image source={photo} style={styles.photo} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.photo, styles.photoEmpty]}>
          <Ionicons name="cafe-outline" size={40} color="rgba(125, 46, 77, 0.35)" />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name}>{details?.name ?? name}</Text>

        {/* The address is what tells two cafés with the same name apart */}
        {details?.address && (
          <Text style={styles.address} numberOfLines={2}>
            {details.address}
          </Text>
        )}

        {/* ★ 4.6 · 1.2k Google reviews · Open now */}
        {details && (
          <View style={styles.metaRow}>
            {details.rating != null && (
              <>
                <Ionicons name="star" size={14} color={COLORS.plum} />
                <Text style={styles.metaStrong}>{formatRating(details.rating)}</Text>
                {details.rating_count ? (
                  <Text style={styles.meta}>({details.rating_count.toLocaleString()})</Text>
                ) : null}
              </>
            )}
            {details.open_now != null && (
              <Pressable
                onPress={() => setShowHours(!showHours)}
                disabled={!details.weekly_hours}
                hitSlop={8}
                style={styles.openStatus}
              >
                <Text style={[styles.metaStrong, details.open_now ? styles.open : styles.closed]}>
                  {details.rating != null ? "· " : ""}
                  {details.open_now ? "Open now" : "Closed"}
                </Text>
                {details.weekly_hours && (
                  <Ionicons name={showHours ? "chevron-up" : "chevron-down"} size={14} color={COLORS.plum} />
                )}
              </Pressable>
            )}
          </View>
        )}

        {/* The week's opening hours, shown when "Open now / Closed" is tapped */}
        {showHours && details?.weekly_hours && (
          <View style={styles.hours}>
            {details.weekly_hours.map((line) => (
              <Text key={line} style={styles.hoursLine}>
                {line}
              </Text>
            ))}
          </View>
        )}

        {/* Action buttons - each only appears if Google has that information */}
        {details && (
          <View style={styles.actions}>
            {(details.maps_url || details.latitude != null) && (
              <ActionButton icon="navigate" label="Directions" onPress={openDirections} primary />
            )}
            {details.phone && (
              <ActionButton
                icon="call"
                label="Call"
                // tel: numbers must be digits only (and a leading +)
                onPress={() => Linking.openURL(`tel:${details.phone!.replace(/[^\d+]/g, "")}`)}
              />
            )}
            {details.website && (
              <ActionButton icon="globe-outline" label="Website" onPress={() => Linking.openURL(details.website!)} />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// One rounded button. "primary" = filled plum (the main action), others are outlined.
function ActionButton({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, primary && styles.actionPrimary, pressed && styles.actionPressed]}
    >
      <Ionicons name={icon} size={16} color={primary ? "white" : COLORS.plum} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const FADED = "rgba(125, 46, 77, 0.6)";

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: "hidden", // round the photo's top corners with the card
    marginBottom: 16,
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
  },
  photo: {
    width: "100%",
    aspectRatio: 16 / 10,
  },
  photoEmpty: {
    backgroundColor: COLORS.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
    gap: 6,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.plum,
  },
  address: {
    fontSize: 14,
    color: FADED,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  meta: {
    fontSize: 14,
    color: FADED,
  },
  metaStrong: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.plum,
  },
  openStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  open: {
    color: "#2E7D4F", // soft green: the one place green means "good to go"
  },
  closed: {
    color: "#B3261E", // soft red
  },
  hours: {
    marginTop: 4,
    gap: 2,
  },
  hoursLine: {
    fontSize: 13,
    color: FADED,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19, // pill shape
    borderWidth: 1,
    borderColor: "rgba(125, 46, 77, 0.3)",
  },
  actionPrimary: {
    backgroundColor: COLORS.plum,
    borderColor: COLORS.plum,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.plum,
  },
  actionTextPrimary: {
    color: "white",
  },
});
