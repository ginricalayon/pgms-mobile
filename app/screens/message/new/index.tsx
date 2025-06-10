import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import { trainerService } from "@/services/trainerService";
import { onRetry } from "@/utils/onRetry";
import { safeText } from "@/utils/textUtils";

export default function NewMessageScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);

      // Only trainers can see client lists for new messages
      if (user?.role !== "trainer") {
        setError("Only trainers can start new conversations");
        return;
      }

      const data = await trainerService.getClients();
      setClients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchClients();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    // Redirect clients back to messages - they can't start new conversations
    if (user.role === "client") {
      router.replace("/screens/message");
      return;
    }

    fetchClients();
  }, [user]);

  const filteredClients = clients.filter((client) =>
    `${client.firstName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectClient = (client: Client) => {
    router.navigate(`screens/message/chat/${client.membershipId}` as any);
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
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#2563EB"}
            />
          </TouchableOpacity>
          <Text
            className={`${
              isDarkMode ? "text-white" : "text-text-primary"
            } text-2xl font-bold`}
          >
            New Message
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 mb-4">
          <View
            className={`flex-row items-center ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            } rounded-lg px-3 py-2 border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <Ionicons
              name="search"
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#6B7280"}
            />
            <TextInput
              placeholder="Search clients by first name..."
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className={`flex-1 ml-2 ${
                isDarkMode ? "text-white" : "text-text-primary"
              }`}
            />
          </View>
        </View>

        {/* Clients List */}
        <ScrollView
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDarkMode ? "#808080" : "#2563EB"]}
              tintColor={isDarkMode ? "#808080" : "#2563EB"}
            />
          }
        >
          {filteredClients.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons
                name="people-outline"
                size={64}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                } text-lg mt-4 text-center`}
              >
                {searchQuery ? "No clients found" : "No clients available"}
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                } text-sm mt-2 text-center`}
              >
                {searchQuery
                  ? "Try a different search term"
                  : "Add clients to start messaging"}
              </Text>
            </View>
          ) : (
            filteredClients.map((client, index) => (
              <TouchableOpacity
                key={`client-${client.membershipId}-${index}`}
                onPress={() => handleSelectClient(client)}
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl p-4 mb-3 border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } shadow-sm`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 rounded-full ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-200"
                    } items-center justify-center relative`}
                  >
                    <Text
                      className={`${
                        isDarkMode ? "text-white" : "text-text-primary"
                      } font-bold text-lg`}
                    >
                      {safeText(client.firstName?.charAt(0)?.toUpperCase()) ||
                        "?"}
                    </Text>
                  </View>

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`${
                          isDarkMode ? "text-white" : "text-text-primary"
                        } font-semibold text-lg`}
                      >
                        {client.firstName && client.lastName
                          ? `${safeText(client.firstName)} ${safeText(
                              client.lastName
                            )}`
                          : safeText(client.firstName) ||
                            safeText(client.lastName) ||
                            "Unknown Client"}
                      </Text>
                    </View>

                    <Text
                      className={`${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      } text-sm mt-1`}
                    >
                      {safeText(client.phoneNumber) || "No phone number"}
                    </Text>

                    {/* Membership period */}
                    <Text
                      className={`${
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      } text-xs mt-1`}
                    >
                      {client.start && !isNaN(Date.parse(client.start))
                        ? new Date(client.start).toLocaleDateString()
                        : "Unknown"}{" "}
                      -{" "}
                      {client.end && !isNaN(Date.parse(client.end))
                        ? new Date(client.end).toLocaleDateString()
                        : "Unknown"}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isDarkMode ? "#6B7280" : "#9CA3AF"}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Container>
  );
}
