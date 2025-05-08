import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://172.20.10.3:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("pgms_token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      // Store token in AsyncStorage
      if (response.data.token) {
        await AsyncStorage.setItem("pgms_token", response.data.token);
        await AsyncStorage.setItem(
          "pgms_user",
          JSON.stringify(response.data.user)
        );
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
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
      throw error.response?.data || { message: "Network error" };
    }
  },

  updateStoredUser: async (userData) => {
    try {
      await AsyncStorage.setItem("pgms_user", JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Error updating stored user:", error);
      return false;
    }
  },
};

export const memberService = {
  getProfile: async () => {
    try {
      const response = await api.get("/member/profile");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/member/edit-profile", profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put("/member/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  getMembershipDetails: async () => {
    try {
      const response = await api.get("/member/membershipDetails");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  getCheckIns: async () => {
    try {
      const response = await api.get("/member/check-ins");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  getMembershipStatus: async () => {
    try {
      const response = await api.get("/member/membership-status");
      return response.data.status;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  getSchedules: async () => {
    try {
      const response = await api.get("/member/schedules");
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  getTrainerInfo: async () => {
    try {
      const response = await api.get("/member/trainerInfo");
      return response.data.success && response.data.trainerInfo
        ? response.data.trainerInfo
        : null;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  changeUsername: async (currentPassword, newUsername) => {
    try {
      const response = await api.put("/member/change-username", {
        currentPassword,
        newUsername,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Network error" };
    }
  },

  getTransactions: async () => {
    try {
      const response = await api.get("/member/transactions");
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default api;
