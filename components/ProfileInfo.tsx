import React from "react";
import { View, Text } from "react-native";

interface ProfileInfoProps {
  label: string;
  value: string | null | undefined;
  isLast?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ label, value, isLast }) => {
  return (
    <View className={`${isLast ? "" : "border-b border-light-200 pb-4 mb-4"}`}>
      <Text className="text-dark-100 text-sm mb-1">{label}</Text>
      <Text className="text-dark-200 font-semibold">{value || "N/A"}</Text>
    </View>
  );
};

export default ProfileInfo;
