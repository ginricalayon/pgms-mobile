import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from "react-native";

interface ContainerProps {
  children: React.ReactNode;
  withScrollView?: boolean;
  withKeyboardAvoidingView?: boolean;
  style?: ViewStyle;
}

export function Container({
  children,
  withScrollView = false,
  withKeyboardAvoidingView = false,
  style,
}: ContainerProps) {
  const content = (
    <View className="flex-1 bg-primary p-4" style={style}>
      {children}
    </View>
  );

  if (withScrollView && withKeyboardAvoidingView) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (withScrollView) {
    return (
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  if (withKeyboardAvoidingView) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}
