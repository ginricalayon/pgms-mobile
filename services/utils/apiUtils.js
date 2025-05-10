import AsyncStorage from "@react-native-async-storage/async-storage";

export const handleApiError = (error) => {
  throw error.response?.data || { message: "Network error" };
};

export const getStoredUser = async () => {
  const user = await AsyncStorage.getItem("pgms_user");
  return user ? JSON.parse(user) : null;
};

export const updateStoredUser = async (userData) => {
  try {
    await AsyncStorage.setItem("pgms_user", JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error("Error updating stored user:", error);
    return false;
  }
};
