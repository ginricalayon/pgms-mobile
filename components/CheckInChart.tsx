import { useTheme } from "@/context/ThemeContext";
import { View, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BarChart } from "react-native-chart-kit";
import { processCheckInsForChart } from "@/utils/processCheckInsForChart";
import { chartConfig } from "@/utils/chartConfig";

const screenWidth = Dimensions.get("window").width;

export const CheckInChart = ({ data }: { data: CheckIn[] }) => {
  const { isDarkMode } = useTheme();

  if (data.length === 0) {
    return (
      <View
        style={{
          width: "100%",
          height: 240,
          backgroundColor: isDarkMode ? "#1F2937" : "white",
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="bar-chart-outline"
          size={60}
          color={isDarkMode ? "#60A5FA" : "#1976D2"}
        />
        <Text
          className={`${
            isDarkMode ? "text-gray-300" : "text-dark-100"
          } mt-2 text-center`}
        >
          No check-in data available yet
        </Text>
      </View>
    );
  }

  const chartData = processCheckInsForChart(data);

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: isDarkMode ? "#1F2937" : "white",
        width: "100%",
      }}
    >
      <BarChart
        style={{
          paddingRight: 0,
        }}
        data={chartData}
        width={screenWidth - 96}
        height={220}
        chartConfig={chartConfig()}
        fromZero
        showBarTops
        showValuesOnTopOfBars
        withInnerLines={false}
        yAxisLabel=""
        yAxisSuffix=""
        withHorizontalLabels={true}
        horizontalLabelRotation={0}
        verticalLabelRotation={0}
      />
    </View>
  );
};
