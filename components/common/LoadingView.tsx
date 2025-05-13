import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Container } from "./Container";
import { useTheme } from "../../context/ThemeContext";

interface LoadingViewProps {
  message?: string;
  color?: string;
  size?: "small" | "large";
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = "Loading...",
  color = "#1E90FF",
  size = "large",
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Container>
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size={size} color={color} />
        <Text className={`mt-4 ${isDarkMode ? "text-white" : "text-dark-200"}`}>
          {message}
        </Text>
      </View>
    </Container>
  );
};
