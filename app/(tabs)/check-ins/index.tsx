import {
  View,
  Text,
  Dimensions,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Container } from "../../../components/common/Container";
import { useAuth } from "../../../context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { memberService } from "../../../services";
import { router } from "expo-router";
import { BarChart } from "react-native-chart-kit";
import { ErrorView } from "../../../components/common/ErrorView";
import { LoadingView } from "../../../components/common/LoadingView";

interface CheckIn {
  date: string;
  timeIn: string;
  timeOut?: string;
}

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForLabels: {
    fontSize: 10,
  },
  style: {
    borderRadius: 16,
  },
};

const CheckInChart = ({ data }: { data: CheckIn[] }) => {
  const processCheckInsForChart = () => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCount = Array(7).fill(0);

    data.forEach((checkIn) => {
      const date = new Date(checkIn.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      dayCount[dayOfWeek] += 1;
    });

    return {
      labels: dayLabels,
      datasets: [
        {
          data: dayCount,
          color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
        },
      ],
    };
  };

  if (data.length === 0) {
    return (
      <View
        style={{
          width: "100%",
          height: 240,
          backgroundColor: "white",
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="bar-chart-outline" size={60} color="#1976D2" />
        <Text className="text-dark-100 mt-2 text-center">
          No check-in data available yet
        </Text>
      </View>
    );
  }

  const chartData = processCheckInsForChart();

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "white",
        width: "100%",
      }}
    >
      <BarChart
        style={{
          paddingRight: 0,
        }}
        data={chartData}
        width={screenWidth - 96}
        height={220}
        chartConfig={chartConfig}
        fromZero
        showBarTops
        showValuesOnTopOfBars
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
        withHorizontalLabels={true}
        horizontalLabelRotation={0}
        verticalLabelRotation={0}
      />
    </View>
  );
};

export default function CheckIns() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const response = await memberService.getCheckIns();

      if (response && response.checkIns && Array.isArray(response.checkIns)) {
        setCheckIns(response.checkIns);
        setError(null);
      } else if (Array.isArray(response)) {
        setCheckIns(response);
        setError(null);
      } else {
        console.log("Received non-array data:", response);
        setCheckIns([]);
        setError("Invalid data format received");
      }
    } catch (err: any) {
      console.log("Error fetching check ins:", err);
      setError(err.message || "Failed to load check-ins");
      setCheckIns([]);
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

    fetchCheckIns();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchCheckIns();
  }, []);

  const navigateToAllCheckIns = () => {
    router.push("/screens/AllCheckInsScreen" as any);
  };

  const recentCheckIns = checkIns.slice(0, 4);

  if (loading && !refreshing) {
    return <LoadingView message="Loading check-in data..." />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        title="We couldn't load your check-in data"
        message={error}
        onRetry={fetchCheckIns}
      />
    );
  }

  return (
    <Container>
      <ScrollView
        className={`flex-1 px-4 py-6 ${
          Platform.OS === "android" ? "mb-24" : "mb-2"
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
            Check-Ins
          </Text>
        </View>

        <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="bar-chart-outline" size={22} color="#2563EB" />
            <Text className="text-text-primary text-lg font-bold ml-2">
              Gym Attendance Overview
            </Text>
          </View>
          <Text className="text-text-secondary mb-4">
            Track your gym visits and workout patterns
          </Text>
        </View>

        {/* Chart Section */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="calendar-outline" size={22} color="#2563EB" />
            <Text className="text-text-primary text-lg font-bold ml-2">
              Weekly Attendance
            </Text>
          </View>
          <CheckInChart data={checkIns} />
        </View>

        {/* Recent Check-ins List */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-20 border border-light-200">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={22} color="#2563EB" />
              <Text className="text-text-primary text-lg font-bold ml-2">
                Recent Check-Ins
              </Text>
            </View>
            {checkIns.length > 4 && (
              <TouchableOpacity onPress={navigateToAllCheckIns}>
                <Text className="text-accent font-medium">See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {checkIns.length > 0 ? (
            recentCheckIns.map((checkIn, index) => (
              <View
                key={index}
                className="bg-light-100 rounded-lg p-4 mb-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                  <Text className="text-text-primary ml-2">
                    {new Date(checkIn.date).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#2563EB" />
                  <Text className="text-text-primary ml-2">
                    {checkIn.timeIn}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-light-100 rounded-lg p-4 mb-4 items-center">
              <MaterialIcons name="history" size={40} color="#2563EB" />
              <Text className="text-text-primary text-lg font-medium mt-2 mb-1">
                No check-ins yet
              </Text>
              <Text className="text-text-secondary text-center">
                Your gym visits will appear here once you check in
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
