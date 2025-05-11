import Decimal from "decimal.js";

export const formatCurrency = (amount: number) => {
  if (!amount) return "0.00";
  return Decimal(amount).toFixed(2);
};
