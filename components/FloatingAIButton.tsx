import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

interface FloatingAIButtonProps {
  onPress: () => void;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({
  onPress,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-24 right-4 z-50"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <View
        className={`p-3 rounded-full ${
          isDarkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        <View className="bg-blue-500 p-2 rounded-full">
          <Ionicons name="chatbox-ellipses" size={24} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
