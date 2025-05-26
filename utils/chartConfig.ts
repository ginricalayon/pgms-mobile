import { useTheme } from "@/context/ThemeContext";

export const chartConfig = () => {
  const { isDarkMode } = useTheme();
  return {
    backgroundGradientFrom: isDarkMode ? "#1F2937" : "#ffffff",
    backgroundGradientTo: isDarkMode ? "#1F2937" : "#ffffff",
    color: (opacity = 1) =>
      `rgba(${isDarkMode ? "96, 165, 250" : "25, 118, 210"}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) =>
      `rgba(${isDarkMode ? "255, 255, 255" : "0, 0, 0"}, ${opacity})`,
    propsForLabels: {
      fontSize: 10,
      fill: isDarkMode ? "#FFFFFF" : "#000000",
    },
    style: {
      borderRadius: 16,
    },
  };
};
