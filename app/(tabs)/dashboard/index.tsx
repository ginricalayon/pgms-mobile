import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "@/services";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import { Button } from "@/components/common/Button";
import { FitnessAIDrawer } from "@/components/FitnessAIDrawer";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { getMembershipStatusHexColor } from "@/utils/getMembershipStatusHexColor";
import { calculateMembershipProgress } from "@/utils/calculateMembershipProgress";
import { getRemainingDays } from "@/utils/getRemainingDays";
import { renderMembershipDates } from "@/components/renderMembershipDates";
import { onRetry } from "@/utils/onRetry";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const { refresh } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIDrawerVisible, setIsAIDrawerVisible] = useState(false);
  const [membershipDetailsData, setmembershipDetailsData] = useState<{
    user: membershipDetails;
  } | null>(null);

  const fetchMembershipDetails = async () => {
    try {
      setLoading(true);
      const data = await memberService.getMembershipDetails();
      setmembershipDetailsData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load membership details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchMembershipDetails();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    fetchMembershipDetails();
  }, [user]);

  useEffect(() => {
    if (refresh) {
      fetchMembershipDetails();
    }
  }, [refresh]);

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchMembershipDetails, error, logout)}
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
              onPress={() => router.navigate("/profile" as any)}
              className="p-2"
            >
              <Ionicons
                name="person-circle-outline"
                size={30}
                color={isDarkMode ? "#FFFFFF" : "#2563EB"}
              />
            </TouchableOpacity>
          </View>
        </View>

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
            Welcome,{" "}
            {`${membershipDetailsData?.user?.customerFirstName} ${membershipDetailsData?.user?.customerLastName}` ||
              "Member"}
            !
          </Text>
          <Text
            className={`${
              isDarkMode ? "text-gray-300" : "text-text-secondary"
            } mb-4`}
          >
            You've successfully logged in to your PGMS Membership account.
          </Text>

          <View
            className={`flex-row items-center ${
              isDarkMode ? "bg-gray-700" : "bg-light-100"
            } p-3 rounded-lg`}
          >
            <View className="mr-3 bg-accent rounded-full p-2">
              <Ionicons name="fitness" size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-medium`}
              >
                Membership Status
              </Text>
              <View className="flex-row items-center mt-1">
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: getMembershipStatusHexColor(
                      membershipDetailsData?.user?.status || "Active"
                    ),
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    color: getMembershipStatusHexColor(
                      membershipDetailsData?.user?.status || "Active"
                    ),
                    fontWeight: "600",
                  }}
                >
                  {membershipDetailsData?.user?.status}
                </Text>
              </View>
              {membershipDetailsData?.user?.status !== "Cancelled" && (
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } text-sm`}
                    >
                      {getRemainingDays(
                        membershipDetailsData?.user?.end || new Date()
                      )}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } text-sm`}
                    >
                      {calculateMembershipProgress(
                        membershipDetailsData?.user?.start || new Date(),
                        membershipDetailsData?.user?.end || new Date()
                      )}
                      %
                    </Text>
                  </View>
                  <View
                    className={`h-2 ${
                      isDarkMode ? "bg-gray-600" : "bg-light-200"
                    } rounded-full overflow-hidden`}
                  >
                    <View
                      style={{
                        width: `${calculateMembershipProgress(
                          membershipDetailsData?.user?.start || new Date(),
                          membershipDetailsData?.user?.end || new Date()
                        )}%`,
                        backgroundColor: getMembershipStatusHexColor(
                          membershipDetailsData?.user?.status || "Active"
                        ),
                        height: "100%",
                        borderRadius: 9999,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {membershipDetailsData?.user?.status === "Expired" ||
          membershipDetailsData?.user?.status === "Cancelled" ? (
            <View
              className={`mt-6 ${
                isDarkMode ? "bg-gray-700" : "bg-light-100"
              } rounded-lg p-4`}
            >
              <View className="flex-row items-center mb-3">
                <View className="bg-accent/10 p-2 rounded-lg mr-3">
                  <Ionicons name="refresh-circle" size={24} color="green" />
                </View>
                <View>
                  <Text
                    className={`${
                      isDarkMode ? "text-white" : "text-text-primary"
                    } font-bold text-lg`}
                  >
                    Membership {membershipDetailsData?.user?.status}
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-text-secondary"
                    }`}
                  >
                    Renew your membership to continue enjoying our services
                  </Text>
                </View>
              </View>
              <Button
                title="Renew Membership"
                onPress={() => router.push("/screens/renew/RateSelection")}
                icon={<Ionicons name="arrow-forward" size={20} color="white" />}
                fullWidth
              />
            </View>
          ) : null}
        </View>

        <View
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl p-6 shadow-sm mb-6 border ${
            isDarkMode ? "border-gray-700" : "border-light-200"
          }`}
        >
          <View className="flex-row items-center mb-4">
            <View className="bg-primary/10 p-2 rounded-lg mr-3">
              <Ionicons name="calendar-outline" size={22} color="#2563EB" />
            </View>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-lg font-bold`}
            >
              Membership Details
            </Text>
          </View>

          <View className="space-y-3">
            {renderMembershipDates(
              membershipDetailsData?.user?.status || "Active",
              membershipDetailsData?.user?.start || new Date(),
              membershipDetailsData?.user?.end || new Date(),
              membershipDetailsData?.user?.freezeStartDate || new Date(),
              membershipDetailsData?.user?.freezeEndDate || new Date(),
              membershipDetailsData?.user?.cancelled_date || new Date(),
              isDarkMode
            )}

            <View
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-light-100"
              } rounded-lg p-4`}
            >
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="pricetag-outline"
                  size={18}
                  color="#2563EB"
                  className="mr-2"
                />
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  } font-bold`}
                >
                  Rate Information
                </Text>
              </View>
              <View className="pl-6">
                <View className="mb-3">
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-text-secondary"
                    } text-sm`}
                  >
                    Rate Name
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-white" : "text-text-primary"
                    } font-medium`}
                  >
                    {membershipDetailsData?.user?.rateName}
                  </Text>
                </View>
                <View>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-text-secondary"
                    } text-sm`}
                  >
                    Rate Validity
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-white" : "text-text-primary"
                    } font-medium`}
                  >
                    {membershipDetailsData?.user?.rateValidity}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <FloatingAIButton onPress={() => setIsAIDrawerVisible(true)} />
      <FitnessAIDrawer
        visible={isAIDrawerVisible}
        onClose={() => setIsAIDrawerVisible(false)}
      />
    </Container>
  );
}
