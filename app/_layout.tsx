import { Stack } from "expo-router";
import "./global.css";
import { AuthProvider } from "../context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen
            name="screens/WelcomeScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="screens/LoginScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/Dashboard"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/ProfileScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/EditProfileScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/AllCheckInsScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/TransactionsScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/ChangePasswordScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/ChangeUsernameScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/VerifyPhoneScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="screens/renew/RateSelection"
            options={{ headerShown: true, title: "Renew Membership" }}
          />
          <Stack.Screen
            name="screens/renew/PTSelection"
            options={{ headerShown: true, title: "Select Trainer" }}
          />
          <Stack.Screen
            name="screens/renew/ScheduleSelection"
            options={{ headerShown: true, title: "Select Schedule" }}
          />
          <Stack.Screen
            name="screens/renew/Payment"
            options={{ headerShown: true, title: "Payment" }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
