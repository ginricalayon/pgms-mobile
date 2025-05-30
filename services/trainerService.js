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
  getSchedules: async () => {
    try {
      const response = await api.get("/trainer/schedules");
      return response.data.schedules;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create new schedule slot
  createScheduleSlot: async (scheduleData) => {
    try {
      const response = await api.post("/trainer/schedules", scheduleData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete schedule slot
  deleteScheduleSlot: async (scheduleId) => {
    try {
      const response = await api.delete(`/trainer/schedules/${scheduleId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update schedule slot
  updateScheduleSlot: async (scheduleId, updateData) => {
    try {
      const response = await api.put(
        `/trainer/schedules/${scheduleId}`,
        updateData
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
