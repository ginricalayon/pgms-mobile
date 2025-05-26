import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { fitnessAIService } from "../services/fitnessAIService";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: string[];
}

interface FitnessAIDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const DRAWER_HEIGHT = Dimensions.get("window").height * 0.94;
const CHAT_STORAGE_KEY = "pgms_fitness_ai_chat";

const saveMessages = async (messages: Message[]) => {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Error saving messages:", e);
  }
};

const loadMessages = async (): Promise<Message[]> => {
  try {
    const data = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    if (data) {
      return JSON.parse(data).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const FitnessAIDrawer: React.FC<FitnessAIDrawerProps> = ({
  visible,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [typing, setTyping] = useState(false);
  const { isDarkMode } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const translateY = useSharedValue(DRAWER_HEIGHT);

  React.useEffect(() => {
    loadMessages().then(setMessages);
  }, []);

  React.useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20 });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
    } else {
      translateY.value = withSpring(DRAWER_HEIGHT, { damping: 20 });
    }
  }, [visible]);

  // Typewriter effect for latest AI message
  React.useEffect(() => {
    if (
      messages.length > 0 &&
      !messages[messages.length - 1].isUser &&
      messages[messages.length - 1].text &&
      typing
    ) {
      const fullText = messages[messages.length - 1].text;
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText(fullText.slice(0, i + 1));
        i++;
        if (i === fullText.length) {
          clearInterval(interval);
          setTyping(false);
        }
      }, 18);
      return () => clearInterval(interval);
    }
  }, [messages, typing]);

  const clearAllMessages = async () => {
    Alert.alert(
      "Clear All Messages",
      "Are you sure you want to clear all messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
              setMessages([]);
              setDisplayedText("");
              setTyping(false);
            } catch (e) {
              console.error("Error clearing messages:", e);
            }
          },
        },
      ]
    );
  };

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    try {
      const response = await fitnessAIService.getResponse(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setTyping(true);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          "What's a good beginner workout?",
          "How can I improve my nutrition?",
          "What exercises are best for weight loss?",
        ],
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTyping(true);
    } finally {
      setIsLoading(false);
    }
  };

  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onActive: (event) => {
        if (event.translationY > 0) {
          translateY.value = event.translationY;
        }
      },
      onEnd: (event) => {
        if (event.translationY > 100) {
          translateY.value = withSpring(DRAWER_HEIGHT, { damping: 20 });
          runOnJS(onClose)();
        } else {
          translateY.value = withSpring(0, { damping: 20 });
        }
      },
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View
            className={`rounded-t-2xl overflow-hidden shadow-2xl ${
              isDarkMode ? "bg-zinc-900" : "bg-white"
            }`}
            style={[animatedStyle, { height: DRAWER_HEIGHT }]}
          >
            <View className="items-center mt-2 mb-2">
              <View
                className={`w-12 h-1.5 rounded bg-gray-400 ${
                  isDarkMode ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </View>
            <View className="flex-row justify-between items-center mb-3 px-2">
              <View className="flex-row items-center pl-2 gap-1">
                <View className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center mr-2">
                  <Ionicons name="chatbox-ellipses" size={24} color="white" />
                </View>
                <Text
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-zinc-900"
                  }`}
                >
                  PGMS AI
                </Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={clearAllMessages} className="mr-4">
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={isDarkMode ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDarkMode ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <KeyboardAwareScrollView
              className="flex-1"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "flex-end",
              }}
              extraScrollHeight={8}
              enableOnAndroid
              keyboardShouldPersistTaps="handled"
            >
              {messages.length > 0 ? (
                messages.map((message, idx) => {
                  const isLast = idx === messages.length - 1;
                  if (!message.isUser && isLast && typing) {
                    return (
                      <View
                        key={message.id}
                        className={`mb-4 mx-3 flex-row ${
                          message.isUser
                            ? "flex-row-reverse justify-end"
                            : "justify-start"
                        }`}
                      >
                        <View
                          className={`max-w-[80%] rounded-2xl p-3 ${
                            isDarkMode ? "bg-zinc-800" : "bg-zinc-200"
                          }`}
                        >
                          <Text
                            className={
                              isDarkMode ? "text-white" : "text-zinc-900"
                            }
                          >
                            {displayedText}
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View
                      key={message.id}
                      className={`mb-4 mx-3 flex-row ${
                        message.isUser
                          ? "flex-row-reverse justify-end"
                          : "justify-start"
                      }`}
                    >
                      <View
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          message.isUser
                            ? "bg-blue-500"
                            : isDarkMode
                            ? "bg-zinc-800"
                            : "bg-zinc-200"
                        }`}
                      >
                        <Text
                          className={`${
                            message.isUser
                              ? "text-white"
                              : isDarkMode
                              ? "text-white"
                              : "text-zinc-900"
                          }`}
                        >
                          {message.text}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="flex-1 items-center justify-center px-6 py-8">
                  {/* Animated Fitness Icon */}
                  <View className="relative mb-6">
                    <View className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-full items-center justify-center shadow-lg">
                      <Ionicons name="fitness" size={36} color="white" />
                    </View>
                    {/* Floating dots animation effect */}
                    <View className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full opacity-80" />
                    <View className="absolute -bottom-1 -left-2 w-3 h-3 bg-yellow-400 rounded-full opacity-60" />
                    <View className="absolute top-1 -left-3 w-2 h-2 bg-pink-400 rounded-full opacity-70" />
                  </View>

                  {/* Welcome Message */}
                  <Text
                    className={`text-2xl font-bold text-center mb-2 ${
                      isDarkMode ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    Hey there, fitness enthusiast! 💪
                  </Text>

                  <Text
                    className={`text-center mb-8 leading-6 ${
                      isDarkMode ? "text-zinc-300" : "text-zinc-600"
                    }`}
                  >
                    I'm your AI fitness companion, ready to help you crush your
                    goals! Ask me anything about workouts, nutrition, or
                    wellness.
                  </Text>

                  {/* Suggestion Cards */}
                  <View className="w-full space-y-3 gap-2">
                    <Text
                      className={`text-sm font-semibold mb-3 text-center ${
                        isDarkMode ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Try asking me about:
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setInputText("Create a beginner workout plan for me");
                        handleSend("Create a beginner workout plan for me");
                      }}
                      className={`p-4 rounded-xl border-2 border-dashed ${
                        isDarkMode
                          ? "border-zinc-700 bg-zinc-800/50"
                          : "border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-blue-500 w-8 h-8 rounded-full items-center justify-center mr-3">
                          <Ionicons name="barbell" size={16} color="white" />
                        </View>
                        <Text
                          className={`flex-1 ${
                            isDarkMode ? "text-zinc-200" : "text-zinc-700"
                          }`}
                        >
                          Create a workout plan for me
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setInputText("What should I eat for muscle building?");
                        handleSend("What should I eat for muscle building?");
                      }}
                      className={`p-4 rounded-xl border-2 border-dashed ${
                        isDarkMode
                          ? "border-zinc-700 bg-zinc-800/50"
                          : "border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-green-500 w-8 h-8 rounded-full items-center justify-center mr-3">
                          <Ionicons name="nutrition" size={16} color="white" />
                        </View>
                        <Text
                          className={`flex-1 ${
                            isDarkMode ? "text-zinc-200" : "text-zinc-700"
                          }`}
                        >
                          Nutrition advice for my goals
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setInputText("How can I improve my form for squats?");
                        handleSend("How can I improve my form for squats?");
                      }}
                      className={`p-4 rounded-xl border-2 border-dashed ${
                        isDarkMode
                          ? "border-zinc-700 bg-zinc-800/50"
                          : "border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-purple-500 w-8 h-8 rounded-full items-center justify-center mr-3">
                          <Ionicons name="body" size={16} color="white" />
                        </View>
                        <Text
                          className={`flex-1 ${
                            isDarkMode ? "text-zinc-200" : "text-zinc-700"
                          }`}
                        >
                          Exercise form and technique tips
                        </Text>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Fun motivational element */}
                  <View className="mt-6 flex-row items-center">
                    <Text
                      className={`text-xs ${
                        isDarkMode ? "text-zinc-500" : "text-zinc-400"
                      }`}
                    >
                      Ready to transform your fitness journey?
                    </Text>
                    <Text className="text-xs ml-1">🚀</Text>
                  </View>
                </View>
              )}

              {isLoading && (
                <View className="flex-row items-center mb-3 mx-3">
                  <View
                    className={`rounded-2xl p-3 ${
                      isDarkMode ? "bg-zinc-800" : "bg-zinc-200"
                    }`}
                  >
                    <ActivityIndicator color={isDarkMode ? "#fff" : "#000"} />
                  </View>
                </View>
              )}

              <View className="flex-row items-center gap-2 mb-4 mx-3">
                <TextInput
                  ref={inputRef}
                  className={`flex-1 p-3 rounded-full ${
                    isDarkMode
                      ? "bg-zinc-800 text-white"
                      : "bg-zinc-200 text-zinc-900"
                  }`}
                  placeholder="Ask about fitness, workouts, or nutrition..."
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => handleSend()}
                  editable={!isLoading}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={() => handleSend()}
                  className={`p-2 rounded-full ${
                    isLoading ? "bg-gray-400" : "bg-blue-500"
                  }`}
                  disabled={isLoading}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
};
