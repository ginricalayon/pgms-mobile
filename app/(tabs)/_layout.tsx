import React from "react";
import { Tabs } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          height: 60,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          borderRadius: 15,
          paddingBottom: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          href: "/dashboard",
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <AntDesign
              name="appstore1"
              size={24}
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="check-ins/index"
        options={{
          href: "/check-ins",
          title: "Check-Ins",
          tabBarLabel: "Check-Ins",
          tabBarIcon: ({ color, focused }) => (
            <AntDesign
              name="barschart"
              size={24}
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedules/index"
        options={{
          href: "/schedules",
          title: "Schedules",
          tabBarLabel: "Schedules",
          tabBarIcon: ({ color, focused }) => (
            <AntDesign
              name="calendar"
              size={24}
              color={color}
              style={{ opacity: focused ? 1 : 0.7 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions/index"
        options={{
          href: "/(tabs)/transactions",
          title: "Transactions",
          tabBarLabel: "Transactions",
          tabBarIcon: ({ color }) => (
            <AntDesign name="wallet" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          href: "/profile",
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <AntDesign name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
