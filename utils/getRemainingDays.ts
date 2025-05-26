export const getRemainingDays = (endDate: Date) => {
  if (!endDate) return "N/A";

  const end = new Date(endDate);
  const today = new Date();
  const remainingDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (remainingDays < 0) return "Expired";
  return `${remainingDays} days remaining`;
};
