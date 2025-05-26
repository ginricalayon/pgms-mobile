import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { memberService } from "@/services";
import { ErrorView } from "@/components/common/ErrorView";
import { LoadingView } from "@/components/common/LoadingView";
import { useTheme } from "@/context/ThemeContext";
import { onRetry } from "@/utils/onRetry";
import { useAuth } from "@/context/AuthContext";

export default function SelectPersonalTrainer() {
  const router = useRouter();
  const { logout } = useAuth();
  const { isDarkMode } = useTheme();
  const { rateId, ptRateId, totalAmount, withPT } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalTrainers();
  }, []);

  const fetchPersonalTrainers = async () => {
    try {
      setLoading(true);
      const trainersData = await memberService.getAvailableTrainers();
      setTrainers(trainersData);
      setError(null);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainerSelection = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
  };

  const handleNext = () => {
    if (!selectedTrainer) {
      return;
    }

    router.push({
      pathname: "/screens/renew/ScheduleSelection",
      params: {
        rateId: rateId,
        trainerId: selectedTrainer.ptId,
        totalAmount: totalAmount,
        withPT: withPT,
        ptRateId: ptRateId,
      },
    });
  };

  if (loading) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchPersonalTrainers, error, logout)}
      />
    );
  }

  return (
    <Container>
      <Stack.Screen
        options={{
          title: "Select Trainer",
          headerShown: true,
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: isDarkMode ? "#111827" : "#fff",
          },
          headerTitleStyle: {
            color: isDarkMode ? "#fff" : "#000",
          },
        }}
      />

      <View className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-2xl font-bold mb-2`}
          >
            Choose Your Personal Trainer
          </Text>
          <Text
            className={`${
              isDarkMode ? "text-gray-300" : "text-text-secondary"
            }`}
          >
            Select a personal trainer who will guide you through your fitness
            journey.
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="h-8 w-8 rounded-full bg-accent items-center justify-center mr-2">
            <Text className="text-white font-bold">2</Text>
          </View>
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } font-medium`}
          >
            Step 2 of 4: Trainer Selection
          </Text>
        </View>

        <ScrollView className="flex-1">
          {trainers.length > 0 ? (
            trainers.map((trainer) => (
              <TouchableOpacity
                key={trainer.ptId}
                className={`mb-4 p-4 rounded-xl border ${
                  selectedTrainer?.ptId === trainer.ptId
                    ? "border-accent bg-accent/10"
                    : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-light-200 bg-white"
                }`}
                onPress={() => handleTrainerSelection(trainer)}
              >
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } font-bold text-lg`}
                    >
                      {trainer.firstName} {trainer.lastName}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } mt-1`}
                    >
                      {trainer.gender}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } mt-1`}
                    >
                      {trainer.address}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } mt-1`}
                    >
                      {trainer.phoneNumber}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="flex-1 justify-center items-center p-8">
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-center`}
              >
                No trainers available at the moment. Please try again later.
              </Text>
            </View>
          )}
        </ScrollView>

        <View className="mt-6 space-y-3">
          <Button
            title="Next Step"
            onPress={handleNext}
            disabled={!selectedTrainer}
          />
        </View>
      </View>
    </Container>
  );
}
