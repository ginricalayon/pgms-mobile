export const safeText = (value: any): string => {
  if (
    value === null ||
    value === undefined ||
    value === "undefined" ||
    value === "null"
  ) {
    return "";
  }
  return String(value);
};
