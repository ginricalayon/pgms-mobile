import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, Alert, Linking, AppState } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Container } from "../../../components/common/Container";
import { Button } from "../../../components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import { paymentService } from "../../../services";
import {
  createPayPalOrder,
  capturePayPalPayment,
} from "../../../services/paypal";
import { ErrorView } from "../../../components/common/ErrorView";
import { LoadingView } from "../../../components/common/LoadingView";
import { formatCurrency } from "../../../utils/formatCurrency";
import { calculateEndDate } from "../../../utils/calculateEndDate";
// import * as Linking from "expo-linking";

export default function PaymentScreen() {
  const { rateId, trainerId, scheduleIds, withPT, ptRateId, totalAmount } =
    useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [rateDetails, setRateDetails] = useState<RateDetails | null>(null);
  const [trainerDetails, setTrainerDetails] = useState<TrainerDetails | null>(
    null
  );
  const [trainerRate, setTrainerRate] = useState<TrainerRate | null>(null);
  const [scheduleDetails, setScheduleDetails] = useState<ScheduleDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    fetchOrderSummary();
    // Handle deep linking
    // const subscription = Linking.addEventListener("url", handleDeepLink);
    // return () => {
    //   subscription.remove();
    // };

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        paymentInitiated
      ) {
        // User returned to app after PayPal
        setPaymentInitiated(false);
        renewMembership();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [paymentInitiated]);

  const fetchOrderSummary = async () => {
    try {
      setLoading(true);

      const rateData = await paymentService.getRateDetails(rateId);
      setRateDetails(rateData);

      if (withPT === "true" && trainerId) {
        const trainerData = await paymentService.getTrainerDetails(trainerId);
        setTrainerDetails(trainerData);
      }

      if (withPT === "true" && ptRateId) {
        const trainerRateData = await paymentService.getTrainerRate(ptRateId);
        setTrainerRate(trainerRateData);
      }

      if (withPT === "true" && scheduleIds) {
        try {
          const response = await paymentService.getSchedulesDetails(
            scheduleIds
          );

          let parsedSchedules = [];

          if (typeof response === "string") {
            try {
              parsedSchedules = JSON.parse(response);
            } catch (parseErr) {
              console.error("Error parsing schedule data:", parseErr);
            }
          } else if (Array.isArray(response)) {
            parsedSchedules = response;
          } else if (response && typeof response === "object") {
            parsedSchedules = Array.isArray(response.schedules)
              ? response.schedules
              : [response];
          }

          setScheduleDetails(parsedSchedules);
        } catch (err) {
          console.error("Error fetching schedules:", err);
          setScheduleDetails([]);
        }
      }

      const summaryData = {
        rateName: rateData?.name || "Unknown Rate",
        rateValidity: rateData?.validity || "",
        rateCost: rateData?.cost || 0,
        trainerName: trainerDetails
          ? `${trainerDetails.firstName || ""} ${
              trainerDetails.lastName || ""
            }`.trim() || "Unknown Trainer"
          : null,
        trainerRate: trainerRate?.amount || 0,
        schedules: scheduleDetails,
        total:
          totalAmount ||
          (withPT === "true"
            ? parseFloat(rateData?.cost || 0) +
              (withPT === "true" ? trainerRate?.amount || 0 : 0)
            : parseFloat(rateData?.cost || 0)),
      };

      setOrderSummary(summaryData as OrderSummary);
      setError(null);
    } catch (err) {
      console.error("Error fetching order summary:", err);
      setError("Failed to load order summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const insertIntoTransaction = async () => {
    try {
      const response = await paymentService.insertIntoTransaction(
        rateId,
        totalAmount
      );
      console.log(response);
    } catch (err) {
      console.error("Error inserting into transaction:", err);
    }
  };

  const insertIntoMemberSchedule = async () => {
    try {
      const response = await paymentService.insertIntoMemberSchedule(
        trainerId,
        scheduleIds
      );
      console.log(response);
    } catch (err) {
      console.error("Error inserting into member schedule:", err);
    }
  };

  const updatePtScheduleAvailability = async () => {
    try {
      const response = await paymentService.updatePtScheduleAvailability(
        scheduleIds,
        trainerId
      );
      console.log(response);
    } catch (err) {
      console.error("Error updating pt schedule availability:", err);
    }
  };

  const renewMembership = async () => {
    try {
      const endDate = calculateEndDate(rateDetails?.validity || "");
      const formattedEndDate = endDate.toISOString().split("T")[0];

      const response = await paymentService.renewMembership(
        rateId,
        trainerId,
        formattedEndDate
      );

      if (response.success) {
        insertIntoTransaction();
        if (withPT === "true" && scheduleIds) {
          await insertIntoMemberSchedule();
          await updatePtScheduleAvailability();
        }
      }

      Alert.alert("Success", "Your membership has been renewed.", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(tabs)/dashboard" as any);
          },
        },
      ]);
    } catch (err) {
      console.error("Error renewing membership:", err);
      Alert.alert("Error", "Failed to renew membership. Please try again.");
    }
  };

  // const handleDeepLink = async (event: { url: string }) => {
  //   const { url } = event;
  //   if (url.includes("payment/success")) {
  //     // Payment was successful
  //     await handlePaymentSuccess();
  //   } else if (url.includes("payment/cancel")) {
  //     // Payment was cancelled
  //     Alert.alert("Payment Cancelled", "Your payment was cancelled.");
  //   }
  // };

  // const handlePaymentSuccess = async () => {
  //   try {
  //     setLoading(true);
  //     await renewMembership();
  //     Alert.alert("Success", "Payment completed successfully!", [
  //       {
  //         text: "OK",
  //         onPress: () => router.push("/dashboard"),
  //       },
  //     ]);
  //   } catch (error) {
  //     console.error("Error handling payment success:", error);
  //     Alert.alert("Error", "Failed to complete the payment process.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePayPalPayment = async () => {
    try {
      setLoading(true);
      setPaymentInitiated(true);

      // Create PayPal order
      const order = await createPayPalOrder(Number(totalAmount));

      // Open PayPal checkout in browser
      const checkoutUrl = order.links.find(
        (link: any) => link.rel === "approve"
      )?.href;
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
      } else {
        throw new Error("Could not find PayPal checkout URL");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      Alert.alert(
        "Payment Error",
        "Failed to initiate payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingView message="Loading..." />;
  }

  if (error) {
    return (
      <ErrorView
        title="We couldn't load membership details"
        message={error}
        onRetry={fetchOrderSummary}
      />
    );
  }

  return (
    <Container>
      <Stack.Screen
        options={{
          title: "Payment",
          headerShown: true,
          headerBackTitle: "Back",
        }}
      />

      <ScrollView className="flex-1 px-4 py-6">
        <View className="mb-6">
          <Text className="text-text-primary text-2xl font-bold mb-2">
            Complete Your Payment
          </Text>
          <Text className="text-text-secondary">
            Review your membership details and select a payment method to
            complete your membership renewal.
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="h-8 w-8 rounded-full bg-accent items-center justify-center mr-2">
            <Text className="text-white font-bold">4</Text>
          </View>
          <Text className="text-text-primary font-medium">
            Step 4 of 4: Payment
          </Text>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-xl p-5 border border-light-200 mb-6">
          <Text className="text-text-primary font-bold text-lg mb-4">
            Membership Details
          </Text>

          <View className="space-y-3">
            {/* Rate Details */}
            <View className="bg-light-50 p-3 rounded-lg">
              <Text className="text-text-primary font-bold mb-2">
                Rate Details
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-text-secondary">Rate Name</Text>
                <Text className="text-text-primary font-medium">
                  {orderSummary?.rateName}
                </Text>
              </View>

              <View className="flex-row justify-between mt-1">
                <Text className="text-text-secondary">Validity</Text>
                <Text className="text-text-primary font-medium">
                  {orderSummary?.rateValidity}
                </Text>
              </View>

              <View className="flex-row justify-between mt-1">
                <Text className="text-text-secondary">Amount</Text>
                <Text className="text-text-primary font-medium">
                  {formatCurrency(orderSummary?.rateCost || 0)}
                </Text>
              </View>
            </View>

            {/* Trainer Details */}
            {withPT === "true" && (
              <View className="bg-light-50 p-3 rounded-lg">
                <Text className="text-text-primary font-bold mb-2">
                  Personal Trainer
                </Text>
                <View className="flex-row justify-between">
                  <Text className="text-text-secondary">Trainer Name</Text>
                  <Text className="text-text-primary font-medium">
                    {orderSummary?.trainerName || trainerDetails
                      ? `${trainerDetails?.firstName || ""} ${
                          trainerDetails?.lastName || ""
                        }`.trim() || "Not specified"
                      : "Not specified"}
                  </Text>
                </View>

                <View className="flex-row justify-between mt-1">
                  <Text className="text-text-secondary">Trainer Fee</Text>
                  <Text className="text-text-primary font-medium">
                    {formatCurrency(trainerRate?.amount || 0)}
                  </Text>
                </View>
              </View>
            )}

            {/* Schedule Details */}
            {withPT === "true" && scheduleDetails.length > 0 && (
              <View className="bg-light-50 p-3 rounded-lg">
                <Text className="text-text-primary font-bold mb-2">
                  Training Schedule{scheduleDetails.length > 1 ? "s" : ""}
                </Text>
                {scheduleDetails.map((schedule, index) => (
                  <View
                    key={index}
                    className="mt-1 border-b border-light-200 pb-2 last:border-b-0"
                  >
                    <Text className="text-text-primary">
                      {schedule.scheduleDate}: {schedule.startTime} -{" "}
                      {schedule.endTime}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="border-t border-light-200 my-2" />

            {/* Total */}
            <View className="flex-row justify-between">
              <Text className="text-text-primary font-bold">Total Amount</Text>
              <Text className="text-accent font-bold text-lg">
                {formatCurrency(orderSummary?.total || 0)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between">
          <Button
            title="Pay with Paypal"
            icon={<Ionicons name="logo-paypal" size={24} color="white" />}
            onPress={handlePayPalPayment}
            variant="primary"
            fullWidth
          />
        </View>
      </ScrollView>
    </Container>
  );
}
