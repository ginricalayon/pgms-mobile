import React, { useState, useEffect } from "react";
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
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { InputField } from "../components/common/InputField";
import { memberService } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { ConfirmationModal } from "../components/common/ConfirmationModal";
import { useAuth } from "../context/AuthContext";

export default function ChangeUsernameScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [errors, setErrors] = useState({
    newUsername: "",
    password: "",
  });

  useEffect(() => {
    if (user?.username) {
      setCurrentUsername(user.username);
    } else {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const data = await memberService.getProfile();
      if (data.success && data.user) {
        setCurrentUsername(data.user.username || "");
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
    }
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "newUsername":
        if (!value.trim()) return "New username is required";
        if (value.length < 6) return "Username must be at least 6 characters";

        const hasLetter = /[a-zA-Z]/.test(value);
        if (!hasLetter) return "Username must include at least one letter";

        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(value);
        if (!isAlphanumeric)
          return "Username must contain only letters and numbers";

        if (value === currentUsername)
          return "New username must be different from current username";
        return "";
      case "password":
        return !value.trim()
          ? "Password is required to verify this change"
          : "";
      default:
        return "";
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "newUsername":
        setNewUsername(value);
        break;
      case "password":
        setPassword(value);
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
      newUsername: validateField("newUsername", newUsername),
      password: validateField("password", password),
    };

    setErrors(newErrors);

    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const confirmUsernameChange = async () => {
    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      const response = await memberService.changeUsername(
        password,
        newUsername
      );

      if (response.success) {
        // Update user information in context
        if (refreshUser) {
          await refreshUser();
        }

        Alert.alert("Success", "Your username has been updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", response.message || "Failed to update username");
      }
    } catch (err: any) {
      console.log("Error updating username:", err);
      Alert.alert("Error", err.message || "Failed to update username");
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
              <Ionicons name="arrow-back" size={24} color="#1E90FF" />
            </TouchableOpacity>
            <Text className="text-text-primary text-2xl font-bold mx-auto pr-10">
              Change Username
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-dark-100 mb-4">
              Enter a new username and your password to verify this change.
            </Text>

            <View className="bg-light-100 p-4 rounded-lg mb-4">
              <Text className="text-dark-100 text-sm">Current Username</Text>
              <Text className="text-dark-200 font-medium mt-1">
                {currentUsername}
              </Text>
            </View>

            <InputField
              label="New Username"
              placeholder="Enter new username"
              value={newUsername}
              onChangeText={(text) => handleFieldChange("newUsername", text)}
              error={errors.newUsername}
              icon={<Ionicons name="at" size={20} color="#64B5F6" />}
            />

            <InputField
              label="Password"
              placeholder="Enter your password to verify"
              value={password}
              onChangeText={(text) => handleFieldChange("password", text)}
              secureTextEntry={true}
              error={errors.password}
              icon={<Ionicons name="lock-closed" size={20} color="#64B5F6" />}
            />
          </View>

          <Button
            title={submitting ? "Updating..." : "Update Username"}
            onPress={handleSubmit}
            disabled={submitting}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirmModal}
        title="Confirm Username Change"
        message={`Are you sure you want to change your username from "${currentUsername}" to "${newUsername}"?`}
        confirmText="Update Username"
        onConfirm={confirmUsernameChange}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={submitting}
      />
    </Container>
  );
}
