export const formatTime = (timestamp: string) => {
  try {
    if (!timestamp || timestamp === "undefined" || timestamp === "null")
      return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

export const formatDate = (timestamp: string) => {
  try {
    if (!timestamp || timestamp === "undefined" || timestamp === "null")
      return "Unknown";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Unknown";

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return "Unknown";
  }
};
