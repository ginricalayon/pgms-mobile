import {
  View,
  Text,
  ScrollView,
  Platform,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/common/Container";
import { useTheme } from "@/context/ThemeContext";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import { trainerService } from "@/services/trainerService";
import { Ionicons } from "@expo/vector-icons";
import AddScheduleModal from "@/components/AddScheduleModal";
import EditScheduleModal from "@/components/EditScheduleModal";
import { onRetry } from "@/utils/onRetry";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function TrainerSchedules() {
  const { isDarkMode } = useTheme();
  const { logout, user } = useAuth();

  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSlot | null>(
    null
  );
  const [selectedFilter, setSelectedFilter] = useState<
    "All" | "Available" | "Unavailable"
  >("All");

  const loadSchedules = useCallback(async () => {
    try {
      setError(null);
      const response = await trainerService.getSchedules();
      const scheduleData = response || [];
      setSchedules(scheduleData);
    } catch (err: any) {
      setError(err.message || "Failed to load schedules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    loadSchedules();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    loadSchedules();
  }, [loadSchedules]);

  const handleAddSchedule = async (scheduleData: {
    startTime: string;
    endTime: string;
    selectedDays: string[];
  }) => {
    try {
      await trainerService.createScheduleSlot(scheduleData);
      await loadSchedules();
    } catch (error: any) {
      throw new Error(error.message || "Failed to create schedule");
    }
  };

  const handleEditSchedule = (schedule: ScheduleSlot) => {
    if (!schedule.isAvailable) {
      Alert.alert(
        "Cannot Edit",
        "Cannot edit a booked schedule. Please contact an admin if you need to modify a booked session."
      );
      return;
    }
    setSelectedSchedule(schedule);
    setShowEditSchedule(true);
  };

  const handleUpdateSchedule = async (
    scheduleId: string,
    updateData: {
      startTime: string;
      endTime: string;
      scheduleDate: string;
    }
  ) => {
    try {
      await trainerService.updateScheduleSlot(scheduleId, updateData);
      await loadSchedules();
    } catch (error: any) {
      throw new Error(error.message || "Failed to update schedule");
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    Alert.alert(
      "Delete Schedule",
      "Are you sure you want to delete this schedule slot?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await trainerService.deleteScheduleSlot(scheduleId);
              await loadSchedules();
              Alert.alert("Success", "Schedule deleted successfully");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete schedule"
              );
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (isAvailable: boolean) => {
    if (isAvailable) return isDarkMode ? "bg-green-900" : "bg-green-500";
    return isDarkMode ? "bg-red-900" : "bg-red-500";
  };

  const getStatusText = (isAvailable: boolean) => {
    if (isAvailable) return "Available";
    return "Unavailable";
  };

  const getFilteredSchedules = () => {
    switch (selectedFilter) {
      case "Available":
        return schedules.filter((schedule) => schedule.isAvailable);
      case "Unavailable":
        return schedules.filter((schedule) => !schedule.isAvailable);
      default:
        return schedules;
    }
  };

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(loadSchedules, error, logout)}
      />
    );
  }

  return (
    <Container>
      <ScrollView
        className={`flex-1 px-4 py-6 ${
          Platform.OS === "android" ? "mb-24" : "mb-16"
        }`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? "#808080" : "#2563EB"]}
            tintColor={isDarkMode ? "#808080" : "#2563EB"}
            title="Pull to refresh"
            titleColor={isDarkMode ? "#808080" : "#2563EB"}
          />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-2xl font-bold`}
          >
            Schedules
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddSchedule(true)}
            className={`${
              isDarkMode ? "bg-blue-600" : "bg-blue-500"
            } px-4 py-2 rounded-lg flex-row items-center`}
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-medium ml-1">
              Add Slot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mb-6">
          {(["All", "Available", "Unavailable"] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedFilter === filter
                  ? "bg-accent"
                  : isDarkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-light-200"
              }`}
            >
              <Text
                className={`${
                  selectedFilter === filter
                    ? "text-white font-medium"
                    : isDarkMode
                    ? "text-gray-300"
                    : "text-text-secondary"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Schedule Slots */}
        <View className="mb-10 rounded-lg">
          {getFilteredSchedules().length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons
                name="calendar-outline"
                size={48}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                } text-center mt-2`}
              >
                {selectedFilter === "All"
                  ? "No schedules found"
                  : selectedFilter === "Available"
                  ? "No available schedules"
                  : "No unavailable schedules"}
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {getFilteredSchedules().map((schedule) => (
                <View
                  key={schedule.ptScheduleId}
                  className={`${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl p-4 border ${
                    isDarkMode ? "border-gray-700" : "border-light-200"
                  }`}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text
                        className={`${
                          isDarkMode ? "text-white" : "text-text-primary"
                        } font-semibold text-base`}
                      >
                        {schedule.scheduleDate}
                      </Text>
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-text-secondary"
                        } text-sm mt-1`}
                      >
                        {schedule.startTime} - {schedule.endTime}
                      </Text>
                      {!schedule.isAvailable && schedule.clientName && (
                        <Text
                          className={`${
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          } text-sm mt-1`}
                        >
                          Client: {schedule.clientName}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`px-3 py-1 rounded-full ${getStatusColor(
                          schedule.isAvailable
                        )}`}
                      >
                        <Text className={`text-xs font-medium text-gray-100`}>
                          {getStatusText(schedule.isAvailable)}
                        </Text>
                      </View>

                      {/* Action Buttons */}
                      <TouchableOpacity
                        onPress={() => handleEditSchedule(schedule)}
                        className={`p-2 rounded-full ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-200"
                        }`}
                      >
                        <Ionicons
                          name="pencil"
                          size={16}
                          color={isDarkMode ? "white" : "black"}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteSchedule(schedule.ptScheduleId)
                        }
                        className={`p-2 rounded-full ${
                          isDarkMode ? "bg-red-900" : "bg-red-100"
                        }`}
                      >
                        <Ionicons
                          name="trash"
                          size={16}
                          color={isDarkMode ? "white" : "red"}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Schedule Modal */}
      <AddScheduleModal
        visible={showAddSchedule}
        onClose={() => setShowAddSchedule(false)}
        onAdd={handleAddSchedule}
      />

      {/* Edit Schedule Modal */}
      <EditScheduleModal
        visible={showEditSchedule}
        onClose={() => {
          setShowEditSchedule(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        onUpdate={handleUpdateSchedule}
      />
    </Container>
  );
}
