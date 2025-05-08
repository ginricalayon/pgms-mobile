/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF", // White background
        accent: "#2563EB", // More vibrant blue for primary actions
        secondary: "#F8F9FA", // Light gray for secondary backgrounds
        light: {
          100: "#EFF6FF", // Very light blue
          200: "#93C5FD", // Light blue
          300: "#60A5FA", // Medium blue
        },
        dark: {
          100: "#1E40AF", // Darker blue
          200: "#1E3A8A", // Navy blue
        },
        success: "#22C55E", // Green for success states
        warning: "#F97316", // Orange for warnings
        error: "#EF4444", // Red for errors
        text: {
          primary: "#1F2937", // Dark gray for primary text
          secondary: "#4B5563", // Medium gray for secondary text
          light: "#9CA3AF", // Light gray for tertiary text
        },
      },
    },
  },
  plugins: [],
};
