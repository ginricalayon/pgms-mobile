import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Checkbox from "expo-checkbox";
import { Stack, useRouter } from "expo-router";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/common/Button";
import { memberService } from "@/services";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import Decimal from "decimal.js";
import { useTheme } from "@/context/ThemeContext";
import { onRetry } from "@/utils/onRetry";
import { useAuth } from "@/context/AuthContext";

export default function RenewalRateSelection() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Rate[]>([]);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [isWithPT, setIsWithPT] = useState(false);
  const [personalTrainerRates, setPersonalTrainerRates] =
    useState<PersonalTrainerRate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembershipRates();
  }, []);

  useEffect(() => {
    if (selectedRate?.validityId) {
      fetchPersonalTrainerRates(selectedRate.validityId);
    }
  }, [selectedRate]);

  const fetchMembershipRates = async () => {
    try {
      setLoading(true);
      const ratesData = await memberService.getMembershipRates();
      setRates(ratesData);
      setError(null);
    } catch (err) {
      console.error("Error fetching rates:", err);
      setError("Failed to load membership rates. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalTrainerRates = async (validityId: string) => {
    try {
      setLoading(true);
      const ptRates = await memberService.getPersonalTrainerRates(validityId);
      if (ptRates) {
        setPersonalTrainerRates(ptRates);
        setError(null);
      } else {
        setPersonalTrainerRates(null);
      }
    } catch (err) {
      setPersonalTrainerRates(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRateSelection = (rate: Rate) => {
    setSelectedRate(rate);
    setIsWithPT(false);
  };

  const calculateTotalCost = () => {
    if (!selectedRate) return 0;

    let totalCost = Decimal(selectedRate.cost);

    if (
      isWithPT &&
      personalTrainerRates &&
      selectedRate.validityId === personalTrainerRates.validityId
    ) {
      totalCost = totalCost.plus(Decimal(personalTrainerRates.amount));
    }

    return totalCost.toFixed(2);
  };

  const handleNext = () => {
    if (!selectedRate) {
      return;
    }

    if (isWithPT) {
      router.push({
        pathname: "/screens/renew/PTSelection",
        params: {
          rateId: selectedRate.rateId,
          withPT: "true",
          ptRateId: personalTrainerRates?.ptRateId || "",
          totalAmount: calculateTotalCost(),
        },
      });
      return;
    }

    router.push({
      pathname: "/screens/renew/Payment",
      params: {
        rateId: selectedRate.rateId,
        withPT: "false",
        ptRateId: "",
        totalAmount: selectedRate.cost,
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
        onRetry={() => onRetry(fetchMembershipRates, error, logout)}
      />
    );
  }

  return (
    <Container>
      <Stack.Screen
        options={{
          title: "Renew Membership",
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
            Select a Membership Rate
          </Text>
          <Text
            className={`${
              isDarkMode ? "text-gray-300" : "text-text-secondary"
            }`}
          >
            Choose a membership rate that best fits your needs.
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="h-8 w-8 rounded-full bg-accent items-center justify-center mr-2">
            <Text className="text-white font-bold">1</Text>
          </View>
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } font-medium`}
          >
            Step 1 of 4: Rate Selection
          </Text>
        </View>

        <ScrollView className="flex-1">
          {rates.length > 0 ? (
            rates.map((rate) => (
              <TouchableOpacity
                key={rate.rateId}
                className={`mb-4 p-4 rounded-xl border ${
                  selectedRate?.rateId === rate.rateId
                    ? "border-accent bg-accent/10"
                    : isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-light-200 bg-white"
                }`}
                onPress={() => handleRateSelection(rate)}
              >
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } font-bold text-lg`}
                    >
                      {rate.name}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } mt-1`}
                    >
                      {rate.validity}
                    </Text>
                  </View>
                  <Text
                    className={`${
                      isDarkMode ? "text-white" : "text-text-primary"
                    } font-bold text-xl`}
                  >
                    {selectedRate?.rateId === rate.rateId &&
                    isWithPT &&
                    personalTrainerRates?.validityId === rate.validityId
                      ? calculateTotalCost()
                      : Decimal(rate.cost).toFixed(2)}
                  </Text>
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
                No membership rates available at the moment. Please try again
                later.
              </Text>
            </View>
          )}

          {rates.length > 0 && selectedRate && personalTrainerRates && (
            <>
              <View className="flex-row items-center mt-4">
                <Checkbox
                  value={isWithPT}
                  onValueChange={() => setIsWithPT(!isWithPT)}
                  color={isWithPT ? "#2563EB" : undefined}
                  disabled={!selectedRate || !personalTrainerRates}
                />
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  } font-medium ml-2`}
                >
                  Includes Personal Trainer
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View className="mt-6">
          <Button
            title="Next Step"
            onPress={handleNext}
            disabled={!selectedRate}
          />
        </View>
      </View>
    </Container>
  );
}
