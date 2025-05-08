import React from "react";
import { View, Text } from "react-native";

interface FooterProps {
  companyName?: string;
  version?: string;
  year?: number;
}

export function Footer({
  companyName = "Praktisado Gym Management System",
  version = "1.0.0",
  year = new Date().getFullYear(),
}: FooterProps) {
  return (
    <View className="border-t border-light-100/20 pt-4 pb-2">
      <Text className="text-light-300 text-center text-sm font-medium">
        {companyName}
      </Text>
      <Text className="text-light-300/60 text-center text-xs mt-1">
        Version {version} • © {year} PGMS
      </Text>
    </View>
  );
}
