import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { messageService } from "@/services/messageService";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ConnectionTest: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>("");

  const testConnection = async () => {
    setTesting(true);
    setResult("Testing...");

    try {
      const testResult = await messageService.testConnection();
      const resultText = `
Success: ${testResult.success}
Message: ${testResult.message}
Token: ${testResult.token || "None"}
      `.trim();

      setResult(resultText);

      if (testResult.success) {
        Alert.alert("✅ Connection Success", testResult.message);
      } else {
        Alert.alert("❌ Connection Failed", testResult.message);
      }
    } catch (error) {
      const errorText = `Error: ${
        error instanceof Error ? error.message : "Unknown"
      }`;
      setResult(errorText);
      Alert.alert("❌ Test Error", errorText);
    } finally {
      setTesting(false);
    }
  };

  const testUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem("pgms_token");

      const userInfo = `
USER INFO DEBUG:
- ID: ${user?.id || "undefined"}
- Customer ID: ${user?.customerId || "undefined"}  
- Role: ${user?.role || "undefined"}
- First Name: ${user?.firstName || "undefined"}
- Last Name: ${user?.lastName || "undefined"}
- Token: ${token ? token.substring(0, 20) + "..." : "none"}
      `.trim();

      setResult(userInfo);
      Alert.alert("👤 User Info", userInfo);
    } catch (error) {
      Alert.alert("❌ Error", "Failed to get user info");
    }
  };

  return (
    <View
      className={`p-4 m-4 rounded-lg border ${
        isDarkMode
          ? "bg-gray-800 border-gray-600"
          : "bg-gray-100 border-gray-300"
      }`}
    >
      <Text
        className={`text-lg font-bold mb-2 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Debug: API Connection Test
      </Text>

      <TouchableOpacity
        onPress={testConnection}
        disabled={testing}
        className={`p-3 rounded-lg ${
          testing ? "bg-gray-400" : "bg-blue-500"
        } mb-3`}
      >
        <Text className="text-white text-center font-semibold">
          {testing ? "Testing..." : "Test Connection"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={testUserInfo}
        className="p-3 rounded-lg bg-green-500 mb-3"
      >
        <Text className="text-white text-center font-semibold">
          Show User Info
        </Text>
      </TouchableOpacity>

      {result && (
        <View
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <Text
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {result}
          </Text>
        </View>
      )}
    </View>
  );
};
