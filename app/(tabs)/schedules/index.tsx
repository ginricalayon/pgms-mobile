import { View, Text, RefreshControl, ScrollView, Platform } from "react-native";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { memberService } from "@/services";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ErrorView } from "@/components/common/ErrorView";
import { LoadingView } from "@/components/common/LoadingView";
import { MembershipStatusHandler } from "@/components/MembershipStatusHandler";
import { onRetry } from "@/utils/onRetry";

export default function Schedules() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [trainerInfo, setTrainerInfo] = useState<TrainerInfo | null>(null);

  const fetchTrainerInfo = async () => {
    try {
      const trainerInfo = await memberService.getTrainerInfo();
      setTrainerInfo(trainerInfo);
    } catch (error) {
      setTrainerInfo(null);
    }
  };

  const fetchMembershipStatus = async () => {
    try {
      const status = await memberService.getMembershipStatus();

      if (Array.isArray(status) && status.length > 0 && status[0].status) {
        setMembershipStatus(status[0].status);
      } else {
        setMembershipStatus(null);
      }
    } catch (error) {
      setMembershipStatus(null);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const schedules = await memberService.getSchedules();
      if (
        schedules &&
        schedules.schedules &&
        Array.isArray(schedules.schedules)
      ) {
        setSchedules(schedules.schedules);
      } else if (Array.isArray(schedules)) {
        setSchedules(schedules);
      } else {
        setSchedules([]);
        setError("Invalid data format received");
      }
    } catch (error: any) {
      setSchedules([]);
      setLoading(false);
      setError(error.message || "Failed to load schedules");
      setRefreshing(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    fetchSchedules();
    fetchTrainerInfo();
    fetchMembershipStatus();
  }, [user]);

  const onRefresh = useCallback(() => {
    setError(null);
    setRefreshing(true);
    fetchSchedules();
    fetchTrainerInfo();
    fetchMembershipStatus();
  }, []);

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchSchedules, error, logout)}
      />
    );
  }

  return (
    <MembershipStatusHandler
      membershipStatus={membershipStatus || "Active"}
      trainerInfo={trainerInfo || undefined}
      onRefresh={onRefresh}
      refreshing={refreshing}
      darkMode={isDarkMode}
    >
      <Container>
        <ScrollView
          className={`flex-1 px-4 py-6 ${
            Platform.OS === "android" ? "mb-24" : "mb-0"
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
          <View className="flex-row justify-between items-center mb-6 mt-4">
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold`}
            >
              Schedules
            </Text>
          </View>

          <View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-6 shadow-sm mb-6 border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            }`}
          >
            <View className="flex-row items-center mb-4">
              <Ionicons
                name="person-outline"
                size={22}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-lg font-bold ml-2`}
              >
                Your Personal Trainer
              </Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-xl font-bold`}
              >
                {trainerInfo?.firstName || "Unknown"}{" "}
                {trainerInfo?.lastName || ""}
              </Text>
              <View className="flex-row items-center">
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={isDarkMode ? "#60A5FA" : "#2563EB"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-text-secondary"
                  }`}
                >
                  {trainerInfo?.phoneNumber || "N/A"}
                </Text>
              </View>
            </View>
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-text-secondary"
              } mb-4`}
            >
              View your upcoming sessions with your personal trainer
            </Text>
          </View>

          <View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-6 shadow-sm mb-6 border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            }`}
          >
            <View className="flex-row items-center mb-4">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-lg font-bold ml-2`}
              >
                Training Schedule
              </Text>
            </View>

            {schedules.length > 0 ? (
              schedules.map((schedule, index) => (
                <View
                  key={index}
                  className={`${
                    isDarkMode ? "bg-gray-700" : "bg-light-100"
                  } rounded-lg p-4 mb-4 flex-row justify-between items-center`}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={isDarkMode ? "#60A5FA" : "#2563EB"}
                    />
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } ml-2`}
                    >
                      {schedule.Day}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={isDarkMode ? "#60A5FA" : "#2563EB"}
                    />
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } ml-2`}
                    >
                      {schedule.StartTime} - {schedule.EndTime}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-light-100"
                } rounded-lg p-4 mb-4 items-center`}
              >
                <MaterialIcons
                  name="event-busy"
                  size={40}
                  color={isDarkMode ? "#60A5FA" : "#2563EB"}
                />
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  } text-lg font-medium mt-2 mb-1`}
                >
                  No sessions scheduled
                </Text>
                <Text
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-text-secondary"
                  } text-center`}
                >
                  You don't have any upcoming sessions with your trainer
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Container>
    </MembershipStatusHandler>
  );
}
