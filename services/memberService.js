import api from "./config/apiConfig";
import { handleApiError } from "./utils/apiUtils";

export const memberService = {
  getProfile: async () => {
    try {
      const response = await api.get("/member/profile");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put("/member/edit-profile", profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
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
      throw handleApiError(error);
    }
  },

  getMembershipDetails: async () => {
    try {
      const response = await api.get("/member/membershipDetails");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getCheckIns: async () => {
    try {
      const response = await api.get("/member/check-ins");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getMembershipStatus: async () => {
    try {
      const response = await api.get("/member/membership-status");
      return response.data.status;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getSchedules: async () => {
    try {
      const response = await api.get("/member/schedules");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getTrainerInfo: async () => {
    try {
      const response = await api.get("/member/trainerInfo");
      return response.data.success && response.data.trainerInfo
        ? response.data.trainerInfo
        : null;
    } catch (error) {
      throw handleApiError(error);
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
      throw handleApiError(error);
    }
  },

  getTransactions: async () => {
    try {
      const response = await api.get("/member/transactions");
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getMembershipRates: async () => {
    try {
      const response = await api.get("/member/membership-rates");
      return response.data.rates;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getPersonalTrainerRates: async (validityId) => {
    try {
      const response = await api.get(
        `/member/personal-trainer-rate?validityId=${validityId}`
      );
      return response.data.rate;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getAvailableTrainers: async () => {
    try {
      const response = await api.get("/member/available-trainers");
      return response.data.trainers;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getTrainerAvailableSchedules: async (trainerId) => {
    try {
      const response = await api.get(
        `/member/trainer-available-schedules?trainerId=${trainerId}`
      );
      return response.data.schedules;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
