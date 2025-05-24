import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Container } from "../../../components/common/Container";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "../../../services";
import { formatDate } from "../../../utils/dateUtils";
import { LoadingView } from "../../../components/common/LoadingView";
import { ErrorView } from "../../../components/common/ErrorView";
import { Button } from "../../../components/common/Button";
import { FitnessAIDrawer } from "../../../components/common/FitnessAIDrawer";
import { FloatingAIButton } from "../../../components/common/FloatingAIButton";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [membershipDetailsData, setmembershipDetailsData] = useState<{
    user: membershipDetails;
  } | null>(null);
  const { refresh } = useLocalSearchParams();
  const [isAIDrawerVisible, setIsAIDrawerVisible] = useState(false);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchMembershipDetails();
  }, []);

  const navigateToProfile = () => {
    router.navigate("profile" as any);
  };

  const getMembershipStatusHexColor = () => {
    const status = membershipDetailsData?.user?.status || "Active";
    switch (status) {
      case "Active":
        return "#22C55E"; // green-500 hex value
      case "Nearly Expired":
        return "#F97316"; // orange-500 hex value
      case "Expired":
        return "#EF4444"; // red-500 hex value
      case "Freezed":
        return "#3B82F6"; // blue-500 hex value
      case "Cancelled":
        return "#B91C1C"; // red-700 hex value
      default:
        return "#22C55E"; // green-500 hex value
    }
  };

  const calculateMembershipProgress = () => {
    const startDate = membershipDetailsData?.user?.start;
    const endDate = membershipDetailsData?.user?.end;

    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (remainingDays < 0) return 0;
    if (remainingDays > totalDays) return 100;

    return Math.round((remainingDays / totalDays) * 100);
  };

  const getRemainingDays = () => {
    const endDate = membershipDetailsData?.user?.end;
    if (!endDate) return "N/A";

    const end = new Date(endDate);
    const today = new Date();
    const remainingDays = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (remainingDays < 0) return "Expired";
    return `${remainingDays} days remaining`;
  };

  const renderMembershipDates = () => {
    const status = membershipDetailsData?.user?.status || "Active";
    const startDate = membershipDetailsData?.user?.start;
    const endDate = membershipDetailsData?.user?.end;
    const freezeStartDate = membershipDetailsData?.user?.freezeStartDate;
    const freezeEndDate = membershipDetailsData?.user?.freezeEndDate;
    const cancelledDate = membershipDetailsData?.user?.cancelled_date;

    switch (status) {
      case "Active":
      case "Expired":
        return (
          <>
            <View
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-4 mb-4`}
            >
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-bold`}
              >
                Start Date
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                }`}
              >
                {formatDate(startDate ? startDate.toString() : undefined)}
              </Text>
            </View>
            <View
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-4 mb-4`}
            >
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-bold`}
              >
                End Date
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                }`}
              >
                {formatDate(endDate ? endDate.toString() : undefined)}
              </Text>
            </View>
          </>
        );
      case "Freezed":
        return (
          <>
            <View
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-4 mb-4`}
            >
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-bold`}
              >
                Freeze Start Date
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                }`}
              >
                {formatDate(
                  freezeStartDate ? freezeStartDate.toString() : undefined
                )}
              </Text>
            </View>
            <View
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-4 mb-4`}
            >
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-bold`}
              >
                Freeze End Date
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                }`}
              >
                {formatDate(
                  freezeEndDate ? freezeEndDate.toString() : undefined
                )}
              </Text>
            </View>
          </>
        );
      case "Cancelled":
        return (
          <>
            <View
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-4 mb-4`}
            >
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-bold`}
              >
                Cancelled Date
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                }`}
              >
                {formatDate(
                  cancelledDate ? cancelledDate.toString() : undefined
                )}
              </Text>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <LoadingView
        message="Loading membership details..."
        color={isDarkMode ? "#808080" : "#2563EB"}
      />
    );
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        title="We couldn't load your membership details"
        message={error}
        onRetry={logout}
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
            <TouchableOpacity onPress={navigateToProfile} className="p-2">
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
                    backgroundColor: getMembershipStatusHexColor(),
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    color: getMembershipStatusHexColor(),
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
                      {getRemainingDays()}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } text-sm`}
                    >
                      {calculateMembershipProgress()}%
                    </Text>
                  </View>
                  <View
                    className={`h-2 ${
                      isDarkMode ? "bg-gray-600" : "bg-light-200"
                    } rounded-full overflow-hidden`}
                  >
                    <View
                      style={{
                        width: `${calculateMembershipProgress()}%`,
                        backgroundColor: getMembershipStatusHexColor(),
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
            {renderMembershipDates()}

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
