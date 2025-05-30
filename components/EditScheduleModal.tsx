import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import {
  daysOfWeekEdit,
  generateTimeSlots,
  calculateEndTime,
  normalizeTimeFormat,
} from "@/utils/scheduleUtils";

interface ScheduleSlot {
  ptScheduleId: string;
  ptId: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  clientName?: string;
  isAvailable: boolean;
}

interface EditScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: ScheduleSlot | null;
  onUpdate: (
    scheduleId: string,
    updateData: {
      startTime: string;
      endTime: string;
      scheduleDate: string;
    }
  ) => Promise<void>;
}

export default function EditScheduleModal({
  visible,
  onClose,
  schedule,
  onUpdate,
}: EditScheduleModalProps) {
  const { isDarkMode } = useTheme();
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const resetForm = () => {
    setSelectedDay("");
    setSelectedStartTime("");
    setCalculatedEndTime("");
  };

  const handleUpdate = async () => {
    if (!schedule) {
      Alert.alert("Error", "No schedule selected");
      return;
    }

    if (!selectedDay) {
      Alert.alert("Select Day", "Please select a day");
      return;
    }

    if (!selectedStartTime) {
      Alert.alert("Select Time", "Please select a start time");
      return;
    }

    setLoading(true);
    try {
      await onUpdate(schedule.ptScheduleId, {
        startTime: selectedStartTime,
        endTime: calculatedEndTime,
        scheduleDate: selectedDay,
      });
      resetForm();
      onClose();
      Alert.alert("Success", "Schedule updated successfully");
    } catch (error: any) {
      Alert.alert(
        "Failed to update schedule",
        error.message || "Failed to update schedule"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (visible && schedule) {
      const normalizedStartTime = normalizeTimeFormat(schedule.startTime);

      setSelectedDay(schedule.scheduleDate);
      setSelectedStartTime(normalizedStartTime);
    } else if (!visible) {
      resetForm();
    }
  }, [visible, schedule]);

  useEffect(() => {
    if (selectedStartTime) {
      const calculated = calculateEndTime(selectedStartTime);
      setCalculatedEndTime(calculated);
    }
  }, [selectedStartTime]);

  if (!schedule) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View
          className={`${
            isDarkMode ? "bg-gray-900" : "bg-white"
          } rounded-t-3xl p-6 max-h-[90%]`}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-xl font-bold`}
            >
              Edit Schedule Slot
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className={`p-2 rounded-full ${
                isDarkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDarkMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Day Selection */}
            <View className="mb-6">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-sm font-medium mb-3`}
              >
                Select Day
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
              >
                <View className="flex-row gap-x-2">
                  {daysOfWeekEdit.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => setSelectedDay(day.value)}
                      className={`px-3 py-2 rounded-lg border ${
                        selectedDay === day.value
                          ? "bg-blue-500 border-blue-500"
                          : isDarkMode
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedDay === day.value
                            ? "text-white font-medium"
                            : isDarkMode
                            ? "text-gray-300"
                            : "text-gray-600"
                        }`}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Start Time Selection */}
            <View className="mb-6">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-sm font-medium mb-3`}
              >
                Start Time
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
              >
                <View className="flex-row gap-x-2">
                  {timeSlots.map((time) => (
                    <TouchableOpacity
                      key={time}
                      onPress={() => setSelectedStartTime(time)}
                      className={`px-3 py-2 rounded-lg border ${
                        selectedStartTime === time
                          ? "bg-blue-500 border-blue-500"
                          : isDarkMode
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          selectedStartTime === time
                            ? "text-white font-medium"
                            : isDarkMode
                            ? "text-gray-300"
                            : "text-gray-600"
                        }`}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* End Time Display */}
            <View className="mb-6">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-sm font-medium mb-2`}
              >
                End Time (Automatically calculated - 2 hours after start time)
              </Text>
              <View
                className={`${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                } border rounded-lg p-4`}
              >
                <Text
                  className={`${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  } text-base`}
                >
                  {calculatedEndTime || "Select start time first"}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-col gap-y-3 mt-4">
            <Button
              title={loading ? "Updating..." : "Update Schedule"}
              onPress={handleUpdate}
              disabled={loading}
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              fullWidth
              color={isDarkMode ? "text-white" : "text-text-primary"}
              borderColor={isDarkMode ? "border-gray-700" : "border-light-200"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
