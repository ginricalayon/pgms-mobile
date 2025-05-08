import React from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import { Button } from "./Button";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white w-4/5 rounded-lg p-5">
          <Text className="text-dark-200 font-bold text-lg mb-2 text-center">
            {title}
          </Text>

          <Text className="text-dark-100 mb-5 text-center">{message}</Text>

          <View className="flex-col gap-4 justify-between items-center">
            <Button
              title={isLoading ? "Loading..." : confirmText}
              onPress={onConfirm}
              disabled={isLoading}
              fullWidth
            />
            <Button
              title={cancelText}
              onPress={onCancel}
              variant="text"
              color="text-red-700"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
