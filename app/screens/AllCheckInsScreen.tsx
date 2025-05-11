import {
  View,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Container } from "../../components/common/Container";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "../../services";
import { router } from "expo-router";
import { LoadingView } from "../../components/common/LoadingView";
import { ErrorView } from "../../components/common/ErrorView";

export default function AllCheckInsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const response = await memberService.getCheckIns();
      console.log("Response data:", response);

      if (response && response.checkIns && Array.isArray(response.checkIns)) {
        setCheckIns(response.checkIns);
      } else if (Array.isArray(response)) {
        setCheckIns(response);
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

  const goBack = () => {
    router.back();
  };

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
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1E90FF"]}
            tintColor="#1E90FF"
            title="Pull to refresh"
            titleColor="#1E90FF"
          />
        }
      >
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <TouchableOpacity onPress={goBack} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#1E90FF" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">
            All Check-Ins
          </Text>
          <View style={{ width: 24 }}>{/* Empty View for alignment */}</View>
        </View>

        {/* All Check-ins List */}
        <View>
          {checkIns.length > 0 ? (
            checkIns.map((checkIn, index) => (
              <View
                key={index}
                className="bg-light-100 rounded-lg p-4 mb-4 flex-row justify-between items-center"
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#1976D2" />
                  <Text className="text-text-primary ml-2">
                    {new Date(checkIn.date).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#1976D2" />
                  <Text className="text-text-primary ml-2">
                    {checkIn.timeIn}
                  </Text>
                </View>
              </View>
            ))
          ) : error ? (
            <View className="bg-light-100 rounded-lg p-4 mb-4 items-center">
              <Text className="text-red-500">{error}</Text>
            </View>
          ) : (
            <View className="bg-light-100 rounded-lg p-4 mb-4 items-center">
              <Text className="text-dark-200 text-lg mb-4">
                No check-ins found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
