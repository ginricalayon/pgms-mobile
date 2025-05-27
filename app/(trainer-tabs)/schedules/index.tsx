import { View, Text, ScrollView, Platform } from "react-native";
import React from "react";
import { Container } from "@/components/common/Container";
import { useTheme } from "@/context/ThemeContext";

export default function TrainerSchedules() {
  const { isDarkMode } = useTheme();

  return (
    <Container>
      <ScrollView
        className={`flex-1 px-4 py-6 ${
          Platform.OS === "android" ? "mb-24" : "mb-16"
        }`}
      >
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-2xl font-bold`}
          >
            Training Schedules
          </Text>
        </View>

        <View
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl p-6 shadow-sm border ${
            isDarkMode ? "border-gray-700" : "border-light-200"
          }`}
        >
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-lg font-bold mb-4`}
          >
            Schedule Management
          </Text>
          <Text
            className={`${
              isDarkMode ? "text-gray-300" : "text-text-secondary"
            }`}
          >
            This screen will show your training schedules, upcoming sessions,
            and allow you to manage your availability.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}
