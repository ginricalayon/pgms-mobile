import api from "./config/apiConfig";
import { handleApiError } from "./utils/apiUtils";

export const trainerService = {
  // Get trainer dashboard data
  getDashboardData: async () => {
    try {
      const response = await api.get("/trainer/dashboard");
      return response.data.stats;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get trainer profile
  getProfile: async () => {
    try {
      const response = await api.get("/trainer/profile");
      return response.data.profile;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update trainer profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/trainer/profile", profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get trainer's clients
  getClients: async () => {
    try {
      const response = await api.get("/trainer/clients");
      return response.data.clients;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get client details
  getClientDetails: async (clientId) => {
    try {
      const response = await api.get(`/trainer/clients/${clientId}`);
      return response.data.details;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Change trainer username
  changeUsername: async (currentPassword, newUsername) => {
    try {
      const response = await api.put("/trainer/change-username", {
        currentPassword,
        newUsername,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Change trainer password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put("/trainer/change-password", {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get trainer schedules
  getSchedules: async (date = null) => {
    try {
      const url = date
        ? `/trainer/schedules?date=${date}`
        : "/trainer/schedules";
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create a new training session
  createSession: async (sessionData) => {
    try {
      const response = await api.post("/trainer/sessions", sessionData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update session status
  updateSessionStatus: async (sessionId, status) => {
    try {
      const response = await api.patch(
        `/trainer/sessions/${sessionId}/status`,
        {
          status,
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get earnings data
  getEarnings: async (period = "month") => {
    try {
      const response = await api.get(`/trainer/earnings?period=${period}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get trainer availability
  getAvailability: async () => {
    try {
      const response = await api.get("/trainer/availability");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update trainer availability
  updateAvailability: async (availabilityData) => {
    try {
      const response = await api.put("/trainer/availability", availabilityData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get session statistics
  getSessionStats: async (period = "month") => {
    try {
      const response = await api.get(
        `/trainer/stats/sessions?period=${period}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
