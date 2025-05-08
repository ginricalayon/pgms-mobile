import { View, Text, Alert, ActivityIndicator, Image } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Container } from "../components/common/Container";
import { InputField } from "../components/common/InputField";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/common/Logo";

export default function LoginScreen() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/(tabs)/dashboard" as any);
    }
  }, [user, router]);

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Username and password are required");
      return;
    }

    try {
      setLoginLoading(true);
      const result = await login(username, password);

      if (result.success) {
        router.replace("/(tabs)/dashboard" as any);
      } else {
        Alert.alert(
          "Login Failed",
          result.error || "Invalid username or password"
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <Container withKeyboardAvoidingView withScrollView>
      <View className="flex-1 justify-between min-h-screen bg-white">
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Logo and Header Section */}
        <View className="items-center mt-16">
          <Logo size="large" />
          <Text className="text-dark-200 text-2xl font-bold text-center mt-6 px-4">
            Welcome Back!
          </Text>
          <Text className="text-dark-100 text-base text-center mt-2 px-4">
            Sign in to continue to your account
          </Text>
        </View>

        {/* Form Section */}
        <View className="flex-1 justify-center px-6 space-y-6">
          <InputField
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <InputField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View className="mt-4">
            {loginLoading ? (
              <ActivityIndicator size="large" color="#1E90FF" />
            ) : (
              <Button title="Sign In" onPress={handleSignIn} fullWidth />
            )}
          </View>
        </View>

        {/* Footer */}
        <View className="items-center mb-8">
          <Text className="text-dark-100 text-sm">
            © 2024 PGMS. All rights reserved.
          </Text>
        </View>
      </View>
    </Container>
  );
}
