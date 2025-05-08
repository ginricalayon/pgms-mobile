import { TouchableOpacity, Text, View } from "react-native";
import React, { forwardRef } from "react";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "text" | "outline";
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  color?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(
  (
    {
      title,
      onPress,
      variant = "primary",
      fullWidth = false,
      icon,
      iconPosition = "right",
      color = "text-accent",
      disabled = false,
      size = "md",
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "py-2 px-4",
      md: "py-3 px-6",
      lg: "py-4 px-8",
    };

    const textSizeClasses = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    if (variant === "text") {
      return (
        <TouchableOpacity
          ref={ref}
          onPress={onPress}
          className="flex-row items-center"
          activeOpacity={0.7}
          disabled={disabled}
        >
          {icon && iconPosition === "left" && (
            <View className="mr-2">{icon}</View>
          )}
          <Text
            className={`${color} font-semibold ${textSizeClasses[size]} ${
              disabled ? "opacity-50" : ""
            }`}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <View className="ml-2">{icon}</View>
          )}
        </TouchableOpacity>
      );
    }

    if (variant === "outline") {
      return (
        <TouchableOpacity
          ref={ref}
          onPress={onPress}
          activeOpacity={0.8}
          className={`border-2 border-accent ${sizeClasses[size]} rounded-lg ${
            fullWidth ? "w-full" : ""
          } ${disabled ? "opacity-50" : ""}`}
          disabled={disabled}
        >
          <View className="flex-row items-center justify-center">
            {icon && iconPosition === "left" && (
              <View className="mr-2">{icon}</View>
            )}
            <Text className="text-accent text-center font-semibold ${textSizeClasses[size]}">
              {title}
            </Text>
            {icon && iconPosition === "right" && (
              <View className="ml-2">{icon}</View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        activeOpacity={0.8}
        className={`bg-accent ${sizeClasses[size]} rounded-lg ${
          fullWidth ? "w-full" : ""
        } ${disabled ? "opacity-50" : ""} shadow-sm shadow-accent/50`}
        disabled={disabled}
      >
        <View className="flex-row items-center justify-center">
          {icon && iconPosition === "left" && (
            <View className="mr-2">{icon}</View>
          )}
          <Text className="text-white text-center font-semibold ${textSizeClasses[size]}">
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <View className="ml-2">{icon}</View>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);
