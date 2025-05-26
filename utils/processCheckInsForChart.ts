import { useTheme } from "@/context/ThemeContext";

export const processCheckInsForChart = (data: CheckIn[]) => {
  const { isDarkMode } = useTheme();
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCount = Array(7).fill(0);

  data.forEach((checkIn) => {
    const date = new Date(checkIn.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    dayCount[dayOfWeek] += 1;
  });

  return {
    labels: dayLabels,
    datasets: [
      {
        data: dayCount,
        color: (opacity = 1) =>
          `rgba(${isDarkMode ? "96, 165, 250" : "25, 118, 210"}, ${opacity})`,
      },
    ],
  };
};
