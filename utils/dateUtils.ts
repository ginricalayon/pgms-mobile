export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A"; // Return "N/A" if no date is provided
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
