import { formatDate } from "@/utils/dateUtils";
import { View, Text } from "react-native";

export const renderMembershipDates = (
  status: string,
  startDate: Date,
  endDate: Date,
  freezeStartDate: Date,
  freezeEndDate: Date,
  cancelledDate: Date,
  isDarkMode: boolean
) => {
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
              {formatDate(freezeEndDate ? freezeEndDate.toString() : undefined)}
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
              {formatDate(cancelledDate ? cancelledDate.toString() : undefined)}
            </Text>
          </View>
        </>
      );
    default:
      return null;
  }
};
