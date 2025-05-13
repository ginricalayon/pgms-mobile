import { View, Text, ScrollView, RefreshControl } from "react-native";
import { Container } from "../common/Container";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";
import { router } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

interface ActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

interface MembershipStatusViewProps {
  icon: string;
  iconColor: string;
  title: string;
  message: string;
  actions?: ActionItem[];
  buttonTitle?: string;
  buttonOnPress?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  darkMode?: boolean;
}

export function MembershipStatusView({
  icon,
  iconColor,
  title,
  message,
  actions,
  buttonTitle,
  buttonOnPress,
  onRefresh,
  refreshing = false,
  darkMode,
}: MembershipStatusViewProps) {
  const { isDarkMode } = useTheme();
  // Use provided darkMode prop if available, otherwise use context
  const isDark = darkMode !== undefined ? darkMode : isDarkMode;

  return (
    <Container>
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor={isDark ? "#60A5FA" : "#2563EB"}
            title="Pull to refresh"
            titleColor={isDark ? "#60A5FA" : "#2563EB"}
          />
        }
      >
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text
            className={`${
              isDark ? "text-white" : "text-text-primary"
            } text-2xl font-bold`}
          >
            Schedules
          </Text>
        </View>

        <View
          className={`${
            isDark ? "bg-gray-800" : "bg-white"
          } rounded-xl p-6 shadow-sm mb-6 border ${
            isDark ? "border-gray-700" : "border-light-200"
          }`}
        >
          <View className="flex-row items-center mb-4">
            <View
              style={{
                backgroundColor: `${iconColor}15`,
                borderRadius: 8,
                padding: 8,
                marginRight: 12,
              }}
            >
              <FontAwesome5 name={icon} size={20} color={iconColor} />
            </View>
            <Text
              className={`${
                isDark ? "text-white" : "text-text-primary"
              } text-lg font-bold`}
            >
              {title}
            </Text>
          </View>
          <Text
            className={`${
              isDark ? "text-gray-300" : "text-text-secondary"
            } mb-4`}
          >
            {message}
          </Text>

          {buttonTitle && (
            <View>
              {actions && (
                <Text
                  className={`${
                    isDark ? "text-white" : "text-text-primary"
                  } font-bold mb-2`}
                >
                  What you can do:
                </Text>
              )}

              {actions &&
                actions.map((action, index) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <View
                      style={{
                        backgroundColor: `${iconColor}15`,
                        borderRadius: 6,
                        padding: 6,
                        marginRight: 12,
                        marginTop: 2,
                      }}
                    >
                      <Ionicons
                        name={action.icon}
                        size={18}
                        color={iconColor}
                      />
                    </View>
                    <Text
                      className={`${
                        isDark ? "text-gray-300" : "text-text-secondary"
                      } flex-1`}
                    >
                      {action.text}
                    </Text>
                  </View>
                ))}
            </View>
          )}

          {buttonTitle && (
            <Button
              title={buttonTitle}
              onPress={buttonOnPress || (() => router.push("dashboard" as any))}
              fullWidth
            />
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
