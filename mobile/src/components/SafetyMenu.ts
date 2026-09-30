// The "⋯" menu for someone else: (Remove friend) / Report / Block.
// Used on their profile, on their posts, and in your Friends list.
// Built from the phone's own pop-up alerts, so it looks native on iOS and
// Android - no custom menu component needed.

import { blockUser, REPORT_REASONS, reportContent } from "@/lib/safety";
import { Alert } from "react-native";

type Options = {
  myId: string;
  otherId: string;
  otherName: string;
  postId?: string; // set when opened from a post -> "Report post"
  onBlocked: () => void; // e.g. leave the screen
  onUnfriend?: () => void; // set when you're friends -> adds "Remove friend"
};

export function openSafetyMenu(options: Options) {
  const { otherName, postId, onUnfriend } = options;
  Alert.alert(otherName, undefined, [
    ...(onUnfriend ? [{ text: "Remove friend", onPress: onUnfriend }] : []),
    { text: postId ? "Report post" : "Report", onPress: () => chooseReason(options) },
    { text: `Block ${otherName}`, style: "destructive", onPress: () => confirmBlock(options) },
    { text: "Cancel", style: "cancel" },
  ]);
}

function chooseReason({ myId, otherId, postId }: Options) {
  Alert.alert("Why are you reporting this?", "Your report is private.", [
    ...REPORT_REASONS.map((reason) => ({
      text: reason.label,
      onPress: async () => {
        try {
          await reportContent({
            reporterId: myId,
            reportedUserId: otherId,
            postId: postId ?? null,
            reason: reason.id,
          });
          Alert.alert("Thanks for letting us know", "We'll review it within 24 hours.");
        } catch (error) {
          console.log("Report failed:", error);
          Alert.alert("Couldn't send the report", "Please try again.");
        }
      },
    })),
    { text: "Cancel", style: "cancel" as const },
  ]);
}

function confirmBlock({ myId, otherId, otherName, onBlocked }: Options) {
  Alert.alert(
    `Block ${otherName}?`,
    "You'll stop being friends and won't see each other's coffee. They can't send you requests. They won't be told.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await blockUser(myId, otherId);
            onBlocked();
          } catch (error) {
            console.log("Block failed:", error);
            Alert.alert("Couldn't block", "Please try again.");
          }
        },
      },
    ]
  );
}
