import React from "react";
import { View, Text } from "react-native";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry: () => void;
  iconSize?: number;
  iconColor?: string;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  title = "Something went wrong",
  message,
  onRetry,
  iconSize = 60,
  iconColor = "#FF6347",
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Container>
      <View className="flex-1 justify-center items-center px-4">
        <Ionicons name="alert-circle" size={iconSize} color={iconColor} />
        <Text
          className={`text-lg ${
            isDarkMode ? "text-white" : "text-dark-200"
          } text-center mt-4`}
        >
          {title}
        </Text>
        <Text
          className={`${
            isDarkMode ? "text-gray-300" : "text-dark-100"
          } text-center mt-2 mb-6`}
        >
          {message}
        </Text>
        <Button title="Try Again" onPress={onRetry} fullWidth />
      </View>
    </Container>
  );
};
