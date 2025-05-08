import React from "react";
import { Image, View, ImageStyle } from "react-native";

interface LogoProps {
  size?: "small" | "medium" | "large";
  style?: ImageStyle;
}

export function Logo({ size = "medium", style }: LogoProps) {
  const sizeClass = {
    small: "w-16 h-16",
    medium: "w-32 h-32",
    large: "w-48 h-48",
  };

  return (
    <View>
      <Image
        source={require("../../../assets/images/logo.png")}
        className={sizeClass[size]}
        style={style}
        resizeMode="contain"
      />
    </View>
  );
}
