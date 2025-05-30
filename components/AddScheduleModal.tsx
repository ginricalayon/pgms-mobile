import React, { useState, useEffect } from "react";
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
  daysOfWeek,
  generateTimeSlots,
  calculateEndTime,
} from "@/utils/scheduleUtils";

interface AddScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (scheduleData: {
    startTime: string;
    endTime: string;
    selectedDays: string[];
  }) => Promise<void>;
}

export default function AddScheduleModal({
  visible,
  onClose,
  onAdd,
}: AddScheduleModalProps) {
  const { isDarkMode } = useTheme();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedStartTime) {
      setCalculatedEndTime(calculateEndTime(selectedStartTime));
    }
  }, [selectedStartTime]);

  const timeSlots = generateTimeSlots();

  const resetForm = () => {
    setSelectedDays([]);
    setSelectedStartTime("");
    setCalculatedEndTime("");
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAdd = async () => {
    if (selectedDays.length === 0) {
      Alert.alert("Select Days", "Please select at least one day");
      return;
    }

    if (!selectedStartTime) {
      Alert.alert("Select Time", "Please select a start time");
      return;
    }

    setLoading(true);
    try {
      const formattedDays = selectedDays.map(
        (day) => day.charAt(0).toUpperCase() + day.slice(1)
      );

      await onAdd({
        startTime: selectedStartTime,
        endTime: calculatedEndTime,
        selectedDays: formattedDays,
      });
      resetForm();
      onClose();
      Alert.alert("Success", "Schedule added successfully");
    } catch (error: any) {
      Alert.alert(
        "Failed to add schedule",
        error.message || "Failed to add schedule"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
              Add Schedule Slot
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
            {/* Days Selection */}
            <View className="mb-6">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-sm font-medium mb-3`}
              >
                Select Days
              </Text>
              <View className="space-y-2">
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    className="flex-row items-center py-2"
                  >
                    <View
                      className={`w-5 h-5 rounded border-2 mr-3 ${
                        selectedDays.includes(day.value)
                          ? "bg-blue-500 border-blue-500"
                          : isDarkMode
                          ? "border-gray-600"
                          : "border-gray-300"
                      } flex items-center justify-center`}
                    >
                      {selectedDays.includes(day.value) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } text-base`}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              title={loading ? "Adding..." : "Add Schedule"}
              onPress={handleAdd}
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
