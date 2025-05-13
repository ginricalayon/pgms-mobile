import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

interface InputFieldProps extends TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

export function InputField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  label,
  error,
  icon,
  autoCapitalize = "none",
  keyboardType = "default",
  ...props
}: InputFieldProps) {
  const { isDarkMode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text
          className={`${
            isDarkMode ? "text-white" : "text-text-primary"
          } font-medium mb-1 text-sm`}
        >
          {label}
        </Text>
      )}

      <View
        className={`relative ${
          isFocused
            ? "border-2 border-accent rounded-lg"
            : `border ${
                isDarkMode ? "border-gray-700" : "border-light-200"
              } rounded-lg`
        } ${error ? "border-error" : ""}`}
      >
        <View
          className={`flex-row items-center ${
            isDarkMode ? "bg-gray-800" : "bg-light-100"
          } rounded-lg`}
        >
          {icon && <View className="pl-3 py-4">{icon}</View>}

          <TextInput
            placeholder={placeholder}
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#9CA3AF"}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry && !showPassword}
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } p-4 flex-1 ${secureTextEntry ? "pr-12" : ""} ${
              icon ? "pl-1" : ""
            }`}
            autoCapitalize={autoCapitalize}
            keyboardType={keyboardType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            blurOnSubmit={false}
            {...props}
          />

          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4"
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={
                  isFocused ? "#2563EB" : isDarkMode ? "#9CA3AF" : "#9CA3AF"
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <View className="flex-row items-center mt-1">
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text className="text-error ml-1 text-xs">{error}</Text>
        </View>
      )}
    </View>
  );
}
