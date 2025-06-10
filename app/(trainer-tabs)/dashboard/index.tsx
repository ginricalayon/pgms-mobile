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
import { messageService } from "@/services/messageService";
import { onRetry } from "@/utils/onRetry";

export default function TrainerDashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const fetchUnreadCount = async () => {
    try {
      const conversations = await messageService.getConversations();
      const totalUnread = conversations.reduce(
        (total, conv) => total + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      // Silently fail to avoid disrupting the main dashboard
      console.log("Failed to fetch unread count:", err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchTrainerData();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    fetchTrainerData();
    fetchUnreadCount();

    // Subscribe to conversation updates for real-time unread count
    const cleanup = messageService.subscribeToConversations((conversations) => {
      const totalUnread = conversations.reduce(
        (total, conv) => total + (conv.unreadCount || 0),
        0
      );
      setUnreadCount(totalUnread);
    });

    return cleanup;
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
          Platform.OS === "android" ? "mb-16" : "mb-16"
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
              onPress={() => router.push("screens/message" as any)}
              className="p-2 relative"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={30}
                color={isDarkMode ? "#FFFFFF" : "#2563EB"}
              />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                  <Text className="text-white text-xs font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount.toString()}
                  </Text>
                </View>
              )}
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
              <View className="flex-1">
                <Text
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-text-secondary"
                  } text-sm ml-2`}
                >
                  Available Sessions
                </Text>
              </View>
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
          } mb-16`}
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
