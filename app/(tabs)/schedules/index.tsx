import { View, Text, RefreshControl, ScrollView, Platform } from "react-native";
import { Container } from "../../components/common/Container";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { memberService } from "@/app/services/api";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Button } from "@/app/components/common/Button";
import { ErrorView } from "@/app/components/common/ErrorView";
import { LoadingView } from "@/app/components/common/LoadingView";
import { MembershipStatusView } from "@/app/components/common/MembershipStatusView";

interface Schedule {
  ID: number;
  Day: string;
  StartTime: string;
  EndTime: string;
}

interface TrainerInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export default function Schedules() {
  const { user } = useAuth();
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
      console.log("Error fetching trainer info:", error);
      setTrainerInfo(null);
    }
  };

  const fetchMembershipStatus = async () => {
    try {
      const status = await memberService.getMembershipStatus();
      console.log("Raw membership status response:", status);

      if (Array.isArray(status) && status.length > 0 && status[0].status) {
        setMembershipStatus(status[0].status);
      } else {
        console.log("Invalid membership status format:", status);
        setMembershipStatus(null);
      }
    } catch (error) {
      console.log("Error fetching membership status:", error);
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
        console.log("Received non-array data:", schedules);
        setSchedules([]);
        setError("Invalid data format received");
      }
    } catch (error: any) {
      console.log("Error fetching schedules:", error);
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
    return <LoadingView message="Loading schedules..." />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        title="We couldn't load your schedules"
        message={error}
        onRetry={fetchSchedules}
      />
    );
  }

  if (membershipStatus === "Freezed" && trainerInfo?.firstName) {
    return (
      <MembershipStatusView
        icon="snowflake"
        iconColor="#64B5F6"
        title="Membership Frozen"
        message="Your account is currently frozen. Please unfreeze your membership at the gym to resched your schedule to your Personal Trainer"
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    );
  } else if (membershipStatus === "Cancelled") {
    return (
      <MembershipStatusView
        icon="times-circle"
        iconColor="#DC2626"
        title="Membership Cancelled"
        message="Your membership has been cancelled. Please renew your membership to continue."
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    );
  }

  if (!trainerInfo?.firstName) {
    return (
      <Container>
        <ScrollView
          className="flex-1 px-4 py-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
              title="Pull to refresh"
              titleColor="#2563EB"
            />
          }
        >
          <View className="flex-row justify-between items-center mb-6 mt-4">
            <Text className="text-text-primary text-2xl font-bold">
              Schedules
            </Text>
          </View>

          <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200">
            <View className="flex-row items-center mb-4">
              <Ionicons name="person-outline" size={22} color="#2563EB" />
              <Text className="text-text-primary text-lg font-bold ml-2">
                No Personal Trainer
              </Text>
            </View>
            <Text className="text-text-secondary mb-4">
              Your membership doesn't include a personal trainer.
            </Text>

            {/* <View className="mt-4">
              <Text className="text-text-primary font-bold mb-2">
                Benefits of having a Personal Trainer:
              </Text>

              <View className="flex-row items-start mb-2">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#22C55E"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text className="text-text-secondary flex-1">
                  Custom workout plans tailored to your goals
                </Text>
              </View>

              <View className="flex-row items-start mb-2">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#22C55E"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text className="text-text-secondary flex-1">
                  One-on-one guidance during your sessions
                </Text>
              </View>

              <View className="flex-row items-start mb-2">
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#22C55E"
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text className="text-text-secondary flex-1">
                  Nutrition advice and progress tracking
                </Text>
              </View>
            </View>

            <Button
              title="Avail Personal Trainer"
              onPress={() => router.push("dashboard" as any)}
              fullWidth
            /> */}
          </View>
        </ScrollView>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView
        className={`flex-1 px-4 py-6 ${
          Platform.OS === "android" ? "mb-24" : "mb-0"
        }`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
            title="Pull to refresh"
            titleColor="#2563EB"
          />
        }
      >
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text className="text-text-primary text-2xl font-bold">
            Schedules
          </Text>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-outline" size={22} color="#2563EB" />
            <Text className="text-text-primary text-lg font-bold ml-2">
              Your Personal Trainer
            </Text>
          </View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-text-primary text-xl font-bold">
              {trainerInfo?.firstName || "Unknown"}{" "}
              {trainerInfo?.lastName || ""}
            </Text>
            <View className="flex-row items-center">
              <Ionicons
                name="call-outline"
                size={18}
                color="#2563EB"
                style={{ marginRight: 4 }}
              />
              <Text className="text-text-secondary">
                {trainerInfo?.phoneNumber || "N/A"}
              </Text>
            </View>
          </View>
          <Text className="text-text-secondary mb-4">
            View your upcoming sessions with your personal trainer
          </Text>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={22} color="#2563EB" />
            <Text className="text-text-primary text-lg font-bold ml-2">
              Training Schedule
            </Text>
          </View>

          {schedules.length > 0 ? (
            schedules.map((schedule, index) => (
              <View
                key={index}
                className="bg-light-100 rounded-lg p-4 mb-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                  <Text className="text-text-primary ml-2">{schedule.Day}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#2563EB" />
                  <Text className="text-text-primary ml-2">
                    {schedule.StartTime} - {schedule.EndTime}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-light-100 rounded-lg p-4 mb-4 items-center">
              <MaterialIcons name="event-busy" size={40} color="#2563EB" />
              <Text className="text-text-primary text-lg font-medium mt-2 mb-1">
                No sessions scheduled
              </Text>
              <Text className="text-text-secondary text-center">
                You don't have any upcoming sessions with your trainer
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
