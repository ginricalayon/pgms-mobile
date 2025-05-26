import { router } from "expo-router";

export const onRetry = (
  fetchData: () => void,
  error: string,
  logout: () => void
) => {
  if (
    error === "No token, authorization denied" ||
    error === "Token is not valid"
  ) {
    logout();
    router.replace("/screens/LoginScreen");
    return;
  }
  fetchData();
};
