import { View, Text, ScrollView, RefreshControl } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "@/services";
import { formatDate } from "@/utils/dateUtils";
import { router } from "expo-router";
import { LoadingView } from "@/components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";
import { onRetry } from "@/utils/onRetry";

export default function Transactions() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await memberService.getTransactions();
      if (response.success) {
        setTransactions(response.transactions);
        setError(null);
      } else {
        setError(response.message || "Failed to load transactions");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
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

    fetchTransactions();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setError(null);
    fetchTransactions();
  }, []);

  if (loading && !refreshing) {
    return <LoadingView color={isDarkMode ? "#808080" : "#2563EB"} />;
  }

  if (error && !refreshing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => onRetry(fetchTransactions, error, logout)}
      />
    );
  }

  if (transactions.length === 0) {
    return (
      <Container>
        <View className="flex-1 justify-center items-center px-4">
          <View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-6 shadow-sm mb-6 border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            } items-center`}
          >
            <View
              className={`${
                isDarkMode ? "bg-gray-700" : "bg-light-100"
              } rounded-full p-4 mb-4`}
            >
              <Ionicons
                name="receipt-outline"
                size={32}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
            </View>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-xl font-bold mb-2`}
            >
              No transactions yet
            </Text>
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-text-secondary"
              } text-center`}
            >
              Your payment history will appear here once you make transactions.
            </Text>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView
        className="flex-1 px-4 py-6 mb-16"
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
        <View className="flex-1 mb-12">
          <View className="flex-row justify-between items-center mb-6 mt-4">
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold`}
            >
              Transactions
            </Text>
          </View>

          <View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-xl p-6 shadow-sm mb-6 border ${
              isDarkMode ? "border-gray-700" : "border-light-200"
            }`}
          >
            <View className="flex-row items-center mb-4">
              <Ionicons
                name="wallet-outline"
                size={22}
                color={isDarkMode ? "#60A5FA" : "#2563EB"}
              />
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-lg font-bold ml-2`}
              >
                Payment History
              </Text>
            </View>
            <Text
              className={`${
                isDarkMode ? "text-gray-300" : "text-text-secondary"
              } mb-4`}
            >
              View your recent transactions and payment details
            </Text>
          </View>

          {transactions.map((transaction) => (
            <View
              key={transaction.transactionId}
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-xl p-6 shadow-sm mb-4 border ${
                isDarkMode ? "border-gray-700" : "border-light-200"
              }`}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text
                    className={`${
                      isDarkMode ? "text-white" : "text-text-primary"
                    } font-medium text-lg`}
                  >
                    {transaction.rateName}
                  </Text>
                  <Text
                    className={`${
                      isDarkMode ? "text-gray-300" : "text-text-secondary"
                    } text-sm`}
                  >
                    {formatDate(transaction.date)}
                  </Text>
                </View>
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  } font-bold`}
                >
                  ₱{Number(transaction.totalCost || 0).toFixed(2)}
                </Text>
              </View>
              <View className="flex-row items-center mt-2">
                <View className="h-2 w-2 rounded-full mr-2 bg-accent" />
                <Text
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-text-secondary"
                  }`}
                >
                  {transaction.paymentType}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}
