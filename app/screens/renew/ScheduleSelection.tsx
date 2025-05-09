import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Container } from "../../components/common/Container";
import { Button } from "../../components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "../../services/api";
import { ErrorView } from "@/app/components/common/ErrorView";
import { LoadingView } from "@/app/components/common/LoadingView";

interface Schedule {
  ptScheduleId: string;
  ptId: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
}

export default function SelectSchedule() {
  const router = useRouter();
  const { rateId, trainerId, totalAmount, withPT, ptRateId } =
    useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<{
    [date: string]: Schedule;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableSchedules();
  }, []);

  const fetchAvailableSchedules = async () => {
    try {
      setLoading(true);
      const schedulesData = await memberService.getTrainerAvailableSchedules(
        trainerId as string
      );
      setSchedules(schedulesData);

      // Extract all unique dates
      const dates = schedulesData.map(
        (schedule: Schedule) => schedule.scheduleDate
      );
      const uniqueDatesSet = new Set<string>(dates);
      const uniqueDates = Array.from(uniqueDatesSet);

      if (uniqueDates.length > 0) {
        setSelectedDay(uniqueDates[0]);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setError("Failed to load available schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelection = (slot: Schedule) => {
    if (!selectedDay) return;

    setSelectedSlots((prev) => ({
      ...prev,
      [selectedDay]: slot,
    }));
  };

  const handleDaySelection = (day: string | null) => {
    setSelectedDay(day);
  };

  const handleNext = () => {
    const selectedSchedules = Object.values(selectedSlots);

    if (selectedSchedules.length === 0) {
      return;
    }

    // Convert selected schedules to a format suitable for URL params
    const scheduleIds = selectedSchedules.map((s) => s.ptScheduleId).join(",");

    router.push({
      pathname: "/screens/renew/Payment",
      params: {
        rateId,
        withPT,
        trainerId,
        ptRateId,
        totalAmount,
        scheduleIds: scheduleIds,
      },
    });
  };

  // Get unique dates from schedules
  const getUniqueDates = (): string[] => {
    const dates = schedules.map((schedule) => schedule.scheduleDate);
    const uniqueDatesSet = new Set<string>(dates);
    return Array.from(uniqueDatesSet);
  };

  // Filter schedules by selected date
  const getSchedulesForSelectedDay = () => {
    if (!selectedDay) return [];
    return schedules.filter(
      (schedule) => schedule.scheduleDate === selectedDay
    );
  };

  // Check if a date has a selected slot
  const hasSelectedSlot = (date: string): boolean => {
    return !!selectedSlots[date];
  };

  // Count how many days have selected slots
  const getSelectedDaysCount = (): number => {
    return Object.keys(selectedSlots).length;
  };

  if (loading) {
    return <LoadingView message="Loading available schedules..." />;
  }

  if (error) {
    return (
      <ErrorView
        title="We couldn't load available schedules"
        message={error}
        onRetry={fetchAvailableSchedules}
      />
    );
  }

  return (
    <Container>
      <Stack.Screen
        options={{
          title: "Select Schedule",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      <View className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-text-primary text-2xl font-bold mb-2">
            Choose Your Schedule
          </Text>
          <Text className="text-text-secondary">
            Select one time slot for each available day.
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="h-8 w-8 rounded-full bg-accent items-center justify-center mr-2">
            <Text className="text-white font-bold">3</Text>
          </View>
          <Text className="text-text-primary font-medium">
            Step 3 of 4: Schedule Selection
          </Text>
        </View>

        {schedules.length > 0 ? (
          <>
            <View className="mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-2"
              >
                <View className="flex-row h-12">
                  {getUniqueDates().map((date) => (
                    <TouchableOpacity
                      key={date}
                      className={`mr-3 px-6 py-3 rounded-lg ${
                        selectedDay === date
                          ? "bg-accent"
                          : hasSelectedSlot(date)
                          ? "bg-accent/30"
                          : "bg-light-100"
                      }`}
                      onPress={() => handleDaySelection(date)}
                    >
                      <Text
                        className={`font-medium ${
                          selectedDay === date || hasSelectedSlot(date)
                            ? "text-white"
                            : "text-text-primary"
                        }`}
                      >
                        {date} {hasSelectedSlot(date) ? "✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <ScrollView className="flex-1 bg-white">
              <View className="space-y-3">
                {getSchedulesForSelectedDay().length > 0 ? (
                  getSchedulesForSelectedDay().map((slot) => (
                    <TouchableOpacity
                      key={slot.ptScheduleId}
                      className={`p-4 rounded-xl border ${
                        selectedSlots[selectedDay as string]?.ptScheduleId ===
                        slot.ptScheduleId
                          ? "border-accent bg-accent/10"
                          : "border-light-200 bg-white"
                      }`}
                      onPress={() => handleSlotSelection(slot)}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#2563EB"
                          />
                          <Text className="text-text-primary font-medium ml-2">
                            {slot.startTime} - {slot.endTime}
                          </Text>
                        </View>
                        {selectedSlots[selectedDay as string]?.ptScheduleId ===
                          slot.ptScheduleId && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#2563EB"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="py-8 items-center bg-white">
                    <Text className="text-text-secondary text-center">
                      No time slots available for this day. Please select
                      another day.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </>
        ) : (
          <View className="flex-1 justify-center items-center p-8 bg-white">
            <Text className="text-text-secondary text-center">
              No schedules available at the moment. Please try again later.
            </Text>
          </View>
        )}

        <View className="mt-6">
          <View className="mb-4">
            <Text className="text-center text-text-secondary">
              {getSelectedDaysCount()} day
              {getSelectedDaysCount() !== 1 ? "s" : ""} selected
            </Text>
          </View>
          <Button
            title="Next Step"
            onPress={handleNext}
            disabled={getSelectedDaysCount() === 0}
          />
        </View>
      </View>
    </Container>
  );
}
