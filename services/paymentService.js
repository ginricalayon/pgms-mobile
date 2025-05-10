import api from "./config/apiConfig";
import { handleApiError } from "./utils/apiUtils";

export const paymentService = {
  getRateDetails: async (rateId) => {
    try {
      const response = await api.get(`/payment/rate-details?rateId=${rateId}`);
      return response.data.rate;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getTrainerDetails: async (trainerId) => {
    try {
      const response = await api.get(
        `/payment/trainer-details?trainerId=${trainerId}`
      );
      return response.data.trainer;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getTrainerRate: async (ptRateId) => {
    try {
      const response = await api.get(
        `/payment/trainer-rate?ptRateId=${ptRateId}`
      );
      return response.data.trainerRate;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getSchedulesDetails: async (scheduleIds) => {
    try {
      if (!scheduleIds) {
        console.error("No scheduleIds provided to getSchedulesDetails");
        return [];
      }

      const response = await api.get(
        `/payment/schedules-details?scheduleIds=${scheduleIds}`
      );

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.schedules)
      ) {
        return response.data.schedules;
      } else {
        console.log("Unexpected response format:", response.data);
        return [];
      }
    } catch (error) {
      console.log("Error in getSchedulesDetails:", error);
      return [];
    }
  },

  renewMembership: async (rateId, trainerId, endDate) => {
    try {
      const response = await api.put("/payment/renew-membership", {
        rateId,
        trainerId,
        endDate,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  insertIntoTransaction: async (rateId, totalAmount) => {
    try {
      const response = await api.post("/payment/insert-into-transaction", {
        rateId,
        totalAmount,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  insertIntoMemberSchedule: async (trainerId, scheduleIds) => {
    try {
      const response = await api.post("/payment/insert-into-member-schedule", {
        trainerId,
        scheduleIds,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updatePtScheduleAvailability: async (scheduleIds, trainerId) => {
    try {
      const response = await api.put(
        "/payment/update-pt-schedule-availability",
        {
          scheduleIds,
          trainerId,
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
