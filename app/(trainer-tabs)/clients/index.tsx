import {
  View,
  Text,
  ScrollView,
  Platform,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { Container } from "@/components/common/Container";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { trainerService } from "@/services/trainerService";
import { ErrorView } from "@/components/common/ErrorView";
import { LoadingView } from "@/components/common/LoadingView";
import { router } from "expo-router";
import { onRetry } from "@/utils/onRetry";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/dateUtils";

export default function TrainerClients() {
  const { isDarkMode } = useTheme();
  const { user, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await trainerService.getClients();
      setClients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load clients");
      console.log(err);
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

    fetchClients();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchClients();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-500";
      case "Expired":
        return "text-red-500";
      default:
        return isDarkMode ? "text-gray-300" : "text-gray-600";
    }
  };

  const handleClientPress = async (membershipId: string) => {
    try {
      setLoadingDetails(true);
      setModalVisible(true);
      const details = await trainerService.getClientDetails(membershipId);
      setSelectedClient(details);
    } catch (err: any) {
      setError(err.message || "Failed to load client details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleMessagePress = (membershipId: string) => {
    setModalVisible(false);
    router.push(`/screens/message/chat/${membershipId}`);
  };

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchClients, error, logout)}
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
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-2xl font-bold`}
          >
            Clients
          </Text>
          <View className="flex-row items-center">
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-text-secondary"
              } text-sm mr-2`}
            >
              {clients.length} clients
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-xl p-4 shadow-sm mb-4 border ${
            isDarkMode ? "border-gray-700" : "border-light-200"
          }`}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="search"
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#6B7280"}
            />
            <TextInput
              className={`flex-1 ml-3 ${
                isDarkMode ? "text-white" : "text-text-primary"
              }`}
              placeholder="Search by first name..."
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Clients List */}
        {clients.length > 0 ? (
          <View className="space-y-3 gap-y-3 mb-10">
            {clients.map((client) => (
              <TouchableOpacity
                key={client.membershipId}
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl p-4 border ${
                  isDarkMode ? "border-gray-700" : "border-light-200"
                }`}
                onPress={() => handleClientPress(client.membershipId)}
              >
                {/* Client Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } text-lg font-bold`}
                    >
                      {client.firstName} {client.lastName}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-300" : "text-text-secondary"
                      } text-sm`}
                    >
                      {client.phoneNumber}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-400" : "text-text-secondary"
                      } text-xs mt-1`}
                    >
                      ID: {client.membershipId}
                    </Text>
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-400" : "text-text-secondary"
                      } text-xs ml-1`}
                    >
                      {client.gender}
                    </Text>
                  </View>
                </View>

                {/* Client Details */}
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-400" : "text-text-secondary"
                        } text-xs ml-1`}
                      >
                        Started: {formatDate(client.start)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-400" : "text-text-secondary"
                        } text-xs ml-1`}
                      >
                        Ends: {formatDate(client.end)}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <TouchableOpacity className="flex-row items-center">
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={isDarkMode ? "#60A5FA" : "#2563EB"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Container>
            <View
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-xl p-8 shadow-sm border ${
                isDarkMode ? "border-gray-700" : "border-light-200"
              } items-center`}
            >
              <Ionicons
                name="people-outline"
                size={48}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-300" : "text-text-secondary"
                } text-center mt-4 text-lg font-medium`}
              >
                No clients found
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-400" : "text-text-secondary"
                } text-center mt-2`}
              >
                {searchQuery && searchQuery.trim() !== ""
                  ? "Try adjusting your search criteria"
                  : "Your clients will appear here once assigned"}
              </Text>
            </View>
          </Container>
        )}

        {/* Client Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedClient(null);
          }}
        >
          <View className="flex-1 bg-black/50 transition-all duration-300">
            <View
              className={`${
                isDarkMode ? "bg-gray-800/95" : "bg-white"
              } absolute bottom-0 w-full rounded-t-3xl p-6`}
              style={{ maxHeight: "85%" }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedClient(null);
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>

              {loadingDetails ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator
                    size="large"
                    color={isDarkMode ? "#808080" : "#2563EB"}
                  />
                </View>
              ) : selectedClient ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="flex-1"
                >
                  <View className="space-y-6">
                    {/* Profile Header */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className={`w-20 h-20 rounded-full overflow-hidden ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-100"
                          } justify-center items-center mr-4`}
                        >
                          {selectedClient.picture ? (
                            <Image
                              source={{
                                uri: `data:image/jpeg;base64,${selectedClient.picture}`,
                              }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <Ionicons
                              name="person"
                              size={40}
                              color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                            />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } text-xl font-bold`}
                          >
                            {selectedClient.firstName} {selectedClient.lastName}
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            } text-sm`}
                          >
                            ID: {selectedClient.membershipId}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className={`${
                          isDarkMode ? "bg-blue-600" : "bg-blue-500"
                        } px-4 py-2 rounded-full flex-row items-center`}
                        onPress={() =>
                          handleMessagePress(selectedClient.membershipId)
                        }
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={16}
                          color="white"
                          style={{ marginRight: 4 }}
                        />
                        <Text className="text-white font-medium">Message</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Personal Information */}
                    <View className="mt-4 mb-5">
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-text-secondary"
                        } text-sm mb-2 font-medium`}
                      >
                        Personal Information
                      </Text>
                      <View
                        className={`${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        } p-4 rounded-xl`}
                      >
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Phone
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium`}
                          >
                            {selectedClient.phoneNumber}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Birth Date
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium`}
                          >
                            {formatDate(selectedClient.birthdate)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Address
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium text-right flex-1 ml-4`}
                          >
                            {selectedClient.address}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Gender
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium text-right flex-1 ml-4`}
                          >
                            {selectedClient.gender}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Membership Information */}
                    <View className="mb-5">
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-text-secondary"
                        } text-sm mb-2 font-medium`}
                      >
                        Membership Information
                      </Text>
                      <View
                        className={`${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        } p-4 rounded-xl`}
                      >
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Status
                          </Text>
                          <Text
                            className={`font-medium ${getStatusColor(
                              selectedClient.status
                            )}`}
                          >
                            {selectedClient.status}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Start Date
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium`}
                          >
                            {formatDate(selectedClient.start)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            End Date
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium`}
                          >
                            {formatDate(selectedClient.end)}
                          </Text>
                        </View>
                        <View className="flex-row justify-between mb-3">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Rate Plan
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium`}
                          >
                            {selectedClient.rateName}
                          </Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text
                            className={`${
                              isDarkMode
                                ? "text-gray-300"
                                : "text-text-secondary"
                            }`}
                          >
                            Rate Cost
                          </Text>
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } font-medium`}
                          >
                            ₱{selectedClient.rateCost.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Client Schedules */}
                    <View className="mb-5">
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-text-secondary"
                        } text-sm mb-2 font-medium`}
                      >
                        Training Schedules
                      </Text>
                      <View
                        className={`${
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        } p-4 rounded-xl`}
                      >
                        {selectedClient.schedules &&
                        selectedClient.schedules.length > 0 ? (
                          selectedClient.schedules.map((schedule, index) => (
                            <View
                              key={index}
                              className={`${
                                index !== selectedClient.schedules.length - 1
                                  ? "mb-4 pb-4 border-b " +
                                    (isDarkMode
                                      ? "border-gray-600"
                                      : "border-gray-200")
                                  : ""
                              }`}
                            >
                              <View className="flex-row justify-between mb-3">
                                <Text
                                  className={`${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  Day
                                </Text>
                                <Text
                                  className={`${
                                    isDarkMode
                                      ? "text-white"
                                      : "text-text-primary"
                                  } font-medium`}
                                >
                                  {schedule.scheduleDate}
                                </Text>
                              </View>
                              <View className="flex-row justify-between mb-3">
                                <Text
                                  className={`${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  Start Time
                                </Text>
                                <Text
                                  className={`${
                                    isDarkMode
                                      ? "text-white"
                                      : "text-text-primary"
                                  } font-medium`}
                                >
                                  {schedule.startTime}
                                </Text>
                              </View>
                              <View className="flex-row justify-between">
                                <Text
                                  className={`${
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-text-secondary"
                                  }`}
                                >
                                  End Time
                                </Text>
                                <Text
                                  className={`${
                                    isDarkMode
                                      ? "text-white"
                                      : "text-text-primary"
                                  } font-medium`}
                                >
                                  {schedule.endTime}
                                </Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text
                            className={`${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            } text-center`}
                          >
                            No schedules found
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </ScrollView>
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-text-secondary"
                    }`}
                  >
                    Failed to load client details
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Container>
  );
}
