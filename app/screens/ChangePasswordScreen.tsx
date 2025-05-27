import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { InputField } from "@/components/common/InputField";
import { memberService, trainerService } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { userRole } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "currentPassword":
        return !value.trim() ? "Current password is required" : "";
      case "newPassword":
        if (!value.trim()) return "New password is required";
        if (value.length < 8) return "Password must be at least 8 characters";

        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
          value
        );

        if (!hasUpperCase)
          return "Password must include at least one uppercase letter";
        if (!hasLowerCase)
          return "Password must include at least one lowercase letter";
        if (!hasNumber) return "Password must include at least one number";
        if (!hasSpecialChar)
          return "Password must include at least one special character";

        if (value === currentPassword)
          return "New password cannot be the same as current password";

        return "";
      case "confirmPassword":
        if (!value.trim()) return "Please confirm your new password";
        if (value !== newPassword) return "Passwords do not match";
        return "";
      default:
        return "";
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "currentPassword":
        setCurrentPassword(value);
        break;
      case "newPassword":
        setNewPassword(value);
        if (confirmPassword) {
          const confirmError =
            confirmPassword !== value ? "Passwords do not match" : "";
          setErrors((prev) => ({
            ...prev,
            confirmPassword: confirmError,
          }));
        }
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      default:
        break;
    }

    const errorMessage = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      currentPassword: validateField("currentPassword", currentPassword),
      newPassword: validateField("newPassword", newPassword),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      "Change Password",
      "Are you sure you want to change your password?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: () => confirmPasswordChange(),
        },
      ]
    );
  };

  const confirmPasswordChange = async () => {
    try {
      setSubmitting(true);

      const response =
        userRole === "member"
          ? await memberService.changePassword(currentPassword, newPassword)
          : await trainerService.changePassword(currentPassword, newPassword);

      if (response.success) {
        Alert.alert("Success", "Your password has been updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to update password");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView className="flex-1 px-4 py-6 mt-4">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#1E90FF"}
              />
            </TouchableOpacity>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold mx-auto pr-10`}
            >
              Change Password
            </Text>
          </View>

          <View className="mb-6">
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-dark-100"
              } mb-4`}
            >
              Please enter your current password and a new password.
            </Text>

            <InputField
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={(text) =>
                handleFieldChange("currentPassword", text)
              }
              secureTextEntry={true}
              error={errors.currentPassword}
              icon={<Ionicons name="lock-closed" size={20} color="#64B5F6" />}
            />

            <InputField
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(text) => handleFieldChange("newPassword", text)}
              secureTextEntry={true}
              error={errors.newPassword}
              icon={<Ionicons name="key" size={20} color="#64B5F6" />}
            />

            <InputField
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) =>
                handleFieldChange("confirmPassword", text)
              }
              secureTextEntry={true}
              error={errors.confirmPassword}
              icon={
                <Ionicons name="checkmark-circle" size={20} color="#64B5F6" />
              }
            />
          </View>

          <Button
            title={submitting ? "Updating..." : "Update Password"}
            onPress={handleSubmit}
            disabled={submitting}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
