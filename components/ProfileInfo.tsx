import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface ProfileInfoProps {
  label: string;
  value: string | null | undefined;
  isLast?: boolean;
  darkMode?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  label,
  value,
  isLast,
  darkMode,
}) => {
  const { isDarkMode } = useTheme();
  // Use provided darkMode prop if available, otherwise use context
  const isDark = darkMode !== undefined ? darkMode : isDarkMode;

  return (
    <View
      className={`${
        isLast
          ? ""
          : `border-b ${
              isDark ? "border-gray-700" : "border-light-200"
            } pb-4 mb-4`
      }`}
    >
      <Text
        className={`${isDark ? "text-gray-400" : "text-dark-100"} text-sm mb-1`}
      >
        {label}
      </Text>
      <Text
        className={`${isDark ? "text-white" : "text-dark-200"} font-semibold`}
      >
        {value || "N/A"}
      </Text>
    </View>
  );
};

export default ProfileInfo;
