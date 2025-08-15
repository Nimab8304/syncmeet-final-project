// client/src/utils/colors.js
export function eventColorsForOwnership(isOwner) {
  if (isOwner) {
    return {
      backgroundColor: "var(--event-owner-bg)",
      borderColor: "var(--event-owner-border)",
      textColor: "#fff",
    };
  }
  return {
    backgroundColor: "var(--event-guest-bg)",
    borderColor: "var(--event-guest-border)",
    textColor: "#fff",
  };
}
