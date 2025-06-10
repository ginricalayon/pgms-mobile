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
import { messageService } from "@/services/messageService";
import { onRetry } from "@/utils/onRetry";

export default function MessagesScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    fetchConversations();

    // Set up real-time updates
    const cleanup = messageService.subscribeToConversations(
      (updatedConversations: Conversation[]) => {
        setConversations(updatedConversations);
      }
    );

    return cleanup;
  }, [user]);

  const filteredConversations = conversations.filter((conv) =>
    (conv.clientName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper function to safely render text
  const safeText = (value: any): string => {
    if (
      value === null ||
      value === undefined ||
      value === "undefined" ||
      value === "null"
    ) {
      return "";
    }
    return String(value);
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Navigate to the chat screen for this conversation
    const chatPath = `screens/message/chat/${conversation.clientId}`;
    router.navigate(chatPath as any);
  };

  const handleNewMessagePress = () => {
    // Only trainers can start new conversations
    if (user?.role === "trainer") {
      router.navigate("screens/message/new" as any);
    }
  };

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchConversations, error, logout)}
      />
    );
  }

  return (
    <Container>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-6 mt-4">
          <View className="flex-row items-center">
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
              Messages
            </Text>
          </View>
          {/* Only show new message button for trainers */}
          {user?.role === "trainer" && (
            <TouchableOpacity onPress={handleNewMessagePress} className="p-2">
              <Ionicons
                name="create-outline"
                size={24}
                color={isDarkMode ? "#FFFFFF" : "#2563EB"}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        {user?.role === "trainer" && (
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
                placeholder="Search conversations..."
                placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className={`flex-1 ml-2 ${
                  isDarkMode ? "text-white" : "text-text-primary"
                }`}
              />
            </View>
          </View>
        )}

        {/* Conversations List */}
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
          {filteredConversations.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                } text-lg mt-4 text-center`}
              >
                No conversations yet
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                } text-sm mt-2 text-center`}
              >
                {user?.role === "trainer"
                  ? "Start chatting with your clients!"
                  : ""}
              </Text>
            </View>
          ) : (
            filteredConversations.map((conversation, index) => (
              <TouchableOpacity
                key={`conversation-${conversation.id}-${index}`}
                onPress={() => handleConversationPress(conversation)}
                className={`${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                } rounded-xl p-4 mb-3 border ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                } shadow-sm`}
              >
                <View className="flex-row items-center">
                  <View className="relative">
                    <View
                      className={`w-12 h-12 rounded-full ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-200"
                      } items-center justify-center`}
                    >
                      <Text
                        className={`${
                          isDarkMode ? "text-white" : "text-text-primary"
                        } font-bold text-lg`}
                      >
                        {safeText(
                          (conversation.clientName || "?")
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </Text>
                    </View>
                    {conversation.isOnline === true && (
                      <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </View>

                  <View className="flex-1 ml-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text
                        className={`${
                          isDarkMode ? "text-white" : "text-text-primary"
                        } font-semibold text-lg`}
                      >
                        {safeText(conversation.clientName) || "Unknown Client"}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <Text
                        className={`${
                          isDarkMode ? "text-gray-300" : "text-gray-600"
                        } flex-1 mr-2`}
                        numberOfLines={1}
                      >
                        {safeText(conversation.lastMessage) ||
                          "No messages yet"}
                      </Text>
                      {conversation.unreadCount > 0 && (
                        <View className="bg-accent rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                          <Text className="text-white text-xs font-bold">
                            {conversation.unreadCount > 99
                              ? "99+"
                              : safeText(conversation.unreadCount)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Container>
  );
}
