export const calculateEndDate = (rateValidity: string) => {
  const startDate = new Date();
  let endDate = new Date(startDate);

  if (!rateValidity) return endDate;

  const validityString = rateValidity.trim();
  const parts = validityString.split(" ");

  for (let i = 0; i < parts.length - 1; i += 2) {
    const validityValue = parseInt(parts[i], 10);
    const validityUnit = parts[i + 1].toLowerCase();

    if (isNaN(validityValue)) continue;

    if (validityUnit.startsWith("day")) {
      endDate.setDate(endDate.getDate() + validityValue);
    } else if (validityUnit.startsWith("month")) {
      endDate.setMonth(endDate.getMonth() + validityValue);
    } else if (validityUnit.startsWith("year")) {
      endDate.setFullYear(endDate.getFullYear() + validityValue);
    } else if (validityUnit.startsWith("week")) {
      endDate.setDate(endDate.getDate() + validityValue * 7);
    }
  }

  return endDate;
};
