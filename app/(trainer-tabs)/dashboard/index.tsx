import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import { trainerService } from "@/services/trainerService";
import { onRetry } from "@/utils/onRetry";

export default function TrainerDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trainerStats, setTrainerStats] = useState<TrainerStats | null>(null);

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      const data = await trainerService.getDashboardData();
      setTrainerStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load trainer data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchTrainerData();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    fetchTrainerData();
  }, [user]);

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchTrainerData, error, logout)}
      />
    );
  }

  return (
    <Container>
      <ScrollView
        className={`flex-1 px-4 py-6 ${
          Platform.OS === "android" ? "mb-24" : "mb-16"
        }`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? "#808080" : "#2563EB"]}
            tintColor={isDarkMode ? "#808080" : "#2563EB"}
            title="Pull to refresh"
            titleColor={isDarkMode ? "#808080" : "#2563EB"}
          />
        }
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-2xl font-bold`}
          >
            Dashboard
          </Text>
          <View className="flex-row">
            <TouchableOpacity onPress={toggleTheme} className="p-2 mr-2">
              <Ionicons
                name={isDarkMode ? "sunny-outline" : "moon-outline"}
                size={30}
                color={isDarkMode ? "#FCD34D" : "#2563EB"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.navigate("/(trainer-tabs)/profile" as any)}
              className="p-2"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={30}
                color={isDarkMode ? "#FFFFFF" : "#2563EB"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Card */}
        <View
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl p-6 shadow-sm mb-6 border ${
            isDarkMode ? "border-gray-700" : "border-light-200"
          }`}
        >
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-xl font-bold mb-2`}
          >
            Welcome, {user?.firstName || "Trainer"}!
          </Text>
          <Text
            className={`${
              isDarkMode ? "text-gray-300" : "text-text-secondary"
            } mb-4`}
          >
            Ready to train your clients today?
          </Text>

          <View
            className={`flex-row items-center ${
              isDarkMode ? "bg-gray-700" : "bg-light-100"
            } p-3 rounded-lg`}
          >
            <View className="mr-3 bg-accent rounded-full p-2">
              <Ionicons name="barbell" size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-medium`}
              >
                Today's Sessions
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-sm`}
              >
                {trainerStats?.sessionsToday || 0} sessions scheduled
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.navigate("/(trainer-tabs)/clients" as any)}
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-4 shadow-sm border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            } w-[48%] mb-4`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="people"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-sm ml-2`}
              >
                Total Clients
              </Text>
            </View>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold`}
            >
              {trainerStats?.totalClients || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate("/(trainer-tabs)/schedules" as any)}
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-4 shadow-sm border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            } w-[48%] mb-4`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="fitness"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-sm ml-2`}
              >
                Today
              </Text>
            </View>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold`}
            >
              {trainerStats?.sessionsToday || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate("/(trainer-tabs)/schedules" as any)}
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-4 shadow-sm border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            } w-[48%] mb-4`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="calendar-clear-outline"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-sm ml-2`}
              >
                Upcoming
              </Text>
            </View>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold`}
            >
              {trainerStats?.upcomingSessions || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.navigate("/(trainer-tabs)/schedules" as any)}
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-4 shadow-sm border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            } w-[48%] mb-4`}
          >
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="calendar-outline"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-sm ml-2`}
              >
                Available Sessions
              </Text>
            </View>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold`}
            >
              {trainerStats?.availableSessions || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl p-6 shadow-sm border ${
            isDarkMode ? "border-gray-700" : "border-light-200"
          }`}
        >
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-lg font-bold mb-4`}
          >
            Quick Actions
          </Text>

          <View className="space-y-3 gap-2">
            <TouchableOpacity
              onPress={() =>
                router.navigate("/(trainer-tabs)/schedules" as any)
              }
              className={`flex-row items-center p-3 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-light-100"
              }`}
            >
              <Ionicons
                name="calendar"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } ml-3 font-medium`}
              >
                Manage Schedules
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.navigate("/(trainer-tabs)/clients" as any)}
              className={`flex-row items-center p-3 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-light-100"
              }`}
            >
              <Ionicons
                name="people"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } ml-3 font-medium`}
              >
                View Clients
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.navigate("/(trainer-tabs)/clients" as any)}
              className={`flex-row items-center p-3 rounded-lg ${
                isDarkMode ? "bg-gray-700" : "bg-light-100"
              }`}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } ml-3 font-medium`}
              >
                Message Clients
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
