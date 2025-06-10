import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import { messageService } from "@/services/messageService";
import { ConnectionTest } from "@/components/debug/ConnectionTest";
import { formatDate, formatTime } from "@/utils/messageUtils";
import { onRetry } from "@/utils/onRetry";

const ChatScreen = React.memo(() => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { clientId } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const previousMessageCount = useRef(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const fetchChatData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Reset message count tracking for initial load
      previousMessageCount.current = 0;

      // Fetch both messages and client info
      const [messagesData, clientInfoData] = await Promise.all([
        messageService.getMessages(clientId as string),
        messageService.getClientInfo(clientId as string),
      ]);

      setMessages(messagesData || []);
      setClientInfo(clientInfoData);

      // Scroll to bottom immediately without animation for initial load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Failed to load chat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchChatData();
  }, []);

  // Create a stable socket message handler using direct state access
  const handleSocketMessage = useCallback((newMessage: Message) => {
    setMessages((prev) => {
      // Check if this is a temp message that should be replaced
      const tempMessageIndex = prev.findIndex(
        (msg) =>
          msg.id.startsWith("temp_") &&
          msg.content === newMessage.content &&
          Math.abs(
            new Date(msg.timestamp).getTime() -
              new Date(newMessage.timestamp).getTime()
          ) < 10000
      );

      if (tempMessageIndex !== -1) {
        const updated = [...prev];
        updated[tempMessageIndex] = newMessage;
        return updated;
      }

      // Check for exact duplicates by ID
      const exists = prev.some((msg) => msg.id === newMessage.id);
      if (exists) {
        return prev;
      }

      // Add new message
      const updated = [...prev, newMessage];
      return updated;
    });
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !clientId) return;

    const messageContent = newMessage.trim();
    const currentUser = user?.role === "trainer" ? "trainer" : "client";
    const tempId = `temp_${Date.now()}`;

    // Create temporary message for immediate UI feedback
    const tempMessage: Message = {
      id: tempId,
      senderId: String(user?.customerId || user?.id || ""),
      senderName:
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : "Unknown User",
      senderType: currentUser,
      content: messageContent,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Add temp message to UI immediately
    setMessages((prev) => {
      const updated = [...prev, tempMessage];
      return updated;
    });
    setNewMessage("");
    setSending(true);

    // Scroll to bottom immediately to show the new message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const sentMessage = await messageService.sendMessage(
        clientId as string,
        messageContent
      );

      // Replace temp message with real message
      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === tempId ? sentMessage : msg
        );
        return updated;
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send message");

      // Remove the temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageContent); // Restore the message content
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!user || !clientId) {
      router.replace("/screens/LoginScreen");
      return;
    }

    fetchChatData();

    const cleanup = messageService.subscribeToMessages(
      clientId as string,
      handleSocketMessage
    );

    return () => {
      cleanup();
    };
  }, [user, clientId]);

  useEffect(() => {
    // Only scroll for new messages (when message count increases)
    if (
      messages.length > previousMessageCount.current &&
      previousMessageCount.current > 0
    ) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }

    // Update the previous count
    previousMessageCount.current = messages.length;
  }, [messages]);

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      if (!message || !message.timestamp || !message.content) return; // Skip invalid messages
      const dateKey = formatDate(message.timestamp);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    return grouped;
  };

  const isMyMessage = (message: Message) => {
    // Get the current user's ID (handle both customerId and id fields)
    const myId = user?.customerId || user?.id;
    const myRole = user?.role;

    // Compare by both ID and role for more accurate matching
    const isMyId =
      message.senderId === myId || message.senderId === String(myId);

    // Map user role to message sender type for comparison
    const myMessageType = myRole === "member" ? "client" : myRole;
    const isMyRole = message.senderType === myMessageType;

    const isMe = isMyId && isMyRole;

    return isMe;
  };

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

  // Helper function to safely get client name
  const getClientName = (): string => {
    const name = clientInfo?.name;
    if (!name || name === "undefined" || name === "null") {
      return "Unknown User";
    }
    return String(name);
  };

  // Helper function to safely get client status
  const getClientStatus = (): string => {
    if (clientInfo?.isOnline === true) {
      return "Online";
    }
    const lastSeen = clientInfo?.lastSeen;
    if (lastSeen && lastSeen !== "undefined" && lastSeen !== "null") {
      return String(lastSeen); // Server already includes "Last seen" prefix
    }
    return "Offline";
  };

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchChatData, error, logout)}
      />
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <Container>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View
          className={`flex-row items-center px-4 py-3 border-b mt-5 ${
            isDarkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? "#FFFFFF" : "#2563EB"}
            />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center">
            <View className="relative mr-3">
              <View
                className={`w-10 h-10 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                } items-center justify-center`}
              >
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  } font-bold`}
                >
                  {safeText(clientInfo?.name?.charAt(0)?.toUpperCase()) || "?"}
                </Text>
              </View>
              {clientInfo?.isOnline === true && (
                <View className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

            <View className="flex-1">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-semibold text-lg`}
              >
                {getClientName()}
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                } text-sm`}
              >
                {getClientStatus()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowDebug(!showDebug)}
            className="p-2 mr-2"
          >
            <Ionicons
              name="bug"
              size={20}
              color={showDebug ? "#10B981" : isDarkMode ? "#FFFFFF" : "#2563EB"}
            />
          </TouchableOpacity>

          <TouchableOpacity className="p-2">
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={isDarkMode ? "#FFFFFF" : "#2563EB"}
            />
          </TouchableOpacity>
        </View>

        {/* Debug Panel */}
        {showDebug && (
          <View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            } p-4 m-4 rounded-lg`}
          >
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-black"
              } font-bold mb-2`}
            >
              Debug Info
            </Text>
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              } text-sm`}
            >
              Messages Count: {messages.length}
            </Text>
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              } text-sm`}
            >
              Client ID: {clientId}
            </Text>
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              } text-sm`}
            >
              User ID: {user?.customerId || user?.id}
            </Text>

            {/* Test Buttons */}
            <View className="flex-row gap-2 mb-2">
              <TouchableOpacity
                onPress={async () => {
                  console.log("🔄 Testing socket connection...");
                  try {
                    const result = await messageService.testConnection();
                    console.log("Socket test result:", result);
                    Alert.alert(
                      "Socket Test",
                      `${result.success ? "✅" : "❌"} ${result.message}`
                    );
                  } catch (error: any) {
                    console.error("Socket test error:", error);
                    Alert.alert("Socket Test", `❌ Error: ${error.message}`);
                  }
                }}
                className={`${
                  isDarkMode ? "bg-blue-600" : "bg-blue-500"
                } px-3 py-2 rounded`}
              >
                <Text className="text-white text-xs">Test Socket</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  console.log("🔄 Force refreshing messages...");
                  fetchChatData();
                }}
                className={`${
                  isDarkMode ? "bg-green-600" : "bg-green-500"
                } px-3 py-2 rounded`}
              >
                <Text className="text-white text-xs">Force Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  console.log("🧪 Testing socket handler...");
                  const testMessage: Message = {
                    id: `test_${Date.now()}`,
                    senderId: "test_sender",
                    senderName: "Test User",
                    senderType: "trainer",
                    content: "This is a test message from socket handler",
                    timestamp: new Date().toISOString(),
                    isRead: false,
                  };
                  handleSocketMessage(testMessage);
                }}
                className={`${
                  isDarkMode ? "bg-purple-600" : "bg-purple-500"
                } px-3 py-2 rounded`}
              >
                <Text className="text-white text-xs">Test Handler</Text>
              </TouchableOpacity>
            </View>

            <ConnectionTest />
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
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
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(groupedMessages).length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons
                name="chatbubble-outline"
                size={64}
                color={isDarkMode ? "#6B7280" : "#9CA3AF"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                } text-lg mt-4 text-center`}
              >
                No messages yet
              </Text>
              <Text
                className={`${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                } text-sm mt-2 text-center`}
              >
                Start the conversation!
              </Text>
            </View>
          ) : (
            Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <View key={`${date}-${messages.length}`} className="mb-4">
                {/* Date separator */}
                <View className="items-center py-2">
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    } text-sm`}
                  >
                    {safeText(date) || "Unknown Date"}
                  </Text>
                </View>

                {/* Messages for this date */}
                {dayMessages.map((message, index) => {
                  const isMe = isMyMessage(message);
                  const isTemp = message.id.startsWith("temp_");

                  return (
                    <View
                      key={`${date}-message-${message.id}-${index}`}
                      className={`flex-row mb-3 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMe && (
                        <View
                          className={`w-8 h-8 rounded-full ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          } items-center justify-center mr-2`}
                        >
                          <Text
                            className={`${
                              isDarkMode ? "text-white" : "text-text-primary"
                            } text-xs font-bold`}
                          >
                            {safeText(
                              message.senderName?.charAt(0)?.toUpperCase()
                            ) || "?"}
                          </Text>
                        </View>
                      )}

                      <View
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? isDarkMode
                              ? "bg-blue-600"
                              : "bg-accent"
                            : isDarkMode
                            ? "bg-gray-700"
                            : "bg-gray-100"
                        }${isTemp ? " opacity-70" : ""}`}
                      >
                        <Text
                          className={`${
                            isMe
                              ? "text-white"
                              : isDarkMode
                              ? "text-white"
                              : "text-text-primary"
                          } text-base`}
                        >
                          {safeText(message.content)}
                        </Text>
                        <View className="flex-row items-center justify-end mt-1">
                          <Text
                            className={`text-xs ${
                              isMe
                                ? "text-blue-100"
                                : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {safeText(formatTime(message.timestamp))}
                          </Text>
                          {isMe && (
                            <View className="ml-1">
                              <Ionicons
                                name={
                                  message.isRead
                                    ? "checkmark-done"
                                    : "checkmark"
                                }
                                size={12}
                                color={message.isRead ? "#10B981" : "#93C5FD"}
                              />
                            </View>
                          )}
                          {isTemp && (
                            <Ionicons
                              name="time"
                              size={12}
                              color="#93C5FD"
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {/* Message Input */}
        <View
          className={`flex-row items-center px-4 py-3 border-t ${
            isDarkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <View
            className={`flex-1 flex-row items-center ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            } rounded-full px-4 py-2 mr-3`}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              className={`flex-1 max-h-24 ${
                isDarkMode ? "text-white" : "text-text-primary"
              }`}
              editable={!sending}
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              !newMessage.trim() || sending
                ? isDarkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
                : isDarkMode
                ? "bg-blue-600"
                : "bg-accent"
            }`}
          >
            {sending ? (
              <Ionicons
                name="hourglass"
                size={20}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={
                  !newMessage.trim()
                    ? isDarkMode
                      ? "#9CA3AF"
                      : "#6B7280"
                    : "white"
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default ChatScreen;
