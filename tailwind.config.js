/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FAFAFA", // Softer off-white background
        accent: "#3B82F6", // Softer blue for primary actions
        secondary: "#F8FAFC", // Very light gray for secondary backgrounds
        light: {
          100: "#F0F9FF", // Very soft light blue
          200: "#BAE6FD", // Gentle light blue
          300: "#7DD3FC", // Soft medium blue
        },
        dark: {
          100: "#3B82F6", // Softer blue
          200: "#2563EB", // Medium blue
        },
        success: "#34D399", // Softer green for success states
        warning: "#FBBF24", // Softer yellow/orange for warnings
        error: "#F87171", // Softer red for errors
        text: {
          primary: "#374151", // Softer dark gray for primary text
          secondary: "#6B7280", // Medium gray for secondary text
          light: "#9CA3AF", // Light gray for tertiary text
        },
      },
    },
  },
  plugins: [],
};
