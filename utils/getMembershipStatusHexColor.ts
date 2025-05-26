export const getMembershipStatusHexColor = (status: string) => {
  switch (status) {
    case "Active":
      return "#22C55E"; // green-500 hex value
    case "Nearly Expired":
      return "#F97316"; // orange-500 hex value
    case "Expired":
      return "#EF4444"; // red-500 hex value
    case "Freezed":
      return "#3B82F6"; // blue-500 hex value
    case "Cancelled":
      return "#B91C1C"; // red-700 hex value
    default:
      return "#22C55E"; // green-500 hex value
  }
};
