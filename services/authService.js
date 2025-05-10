import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./config/apiConfig";
import { handleApiError, updateStoredUser } from "./utils/apiUtils";

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      if (response.data.token) {
        await AsyncStorage.setItem("pgms_token", response.data.token);
        await AsyncStorage.setItem(
          "pgms_user",
          JSON.stringify(response.data.user)
        );
      }
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem("pgms_token");
    await AsyncStorage.removeItem("pgms_user");
  },

  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem("pgms_user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem("pgms_token");
    return !!token;
  },

  refreshUserData: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateStoredUser,
};
