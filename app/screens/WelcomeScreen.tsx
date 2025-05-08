import { Text, View, Image } from "react-native";
import { Link } from "expo-router";
import { Container } from "../components/common/Container";
import { Button } from "../components/common/Button";
import { Logo } from "../components/common/Logo";
import { Footer } from "../components/common/Footer";
import { Ionicons } from "@expo/vector-icons";

export default function WelcomeScreen() {
  return (
    <Container>
      <View className="flex-1 bg-white">
        {/* Main Content Section */}
        <View className="flex-1 justify-center items-center px-6">
          {/* Logo section */}
          <View className="mb-12">
            <Logo size="large" />
          </View>

          {/* Welcome Text Section */}
          <View className="space-y-4 items-center">
            <Text className="text-dark-200 font-bold text-4xl text-center leading-tight">
              Welcome to Praktisado {"\n"} Gym Mobile App
            </Text>
            <Text className="text-dark-100 text-lg text-center">
              Your Fitness Journey Starts Here
            </Text>
          </View>

          {/* Features Section */}
          <View className="mt-12 w-full space-y-6">
            <View className="flex-row items-center space-x-4">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                <Ionicons name="fitness" size={20} color="#1E90FF" />
              </View>
              <Text className="text-dark-200 text-base flex-1">
                Track your membership status and remaining days
              </Text>
            </View>

            <View className="flex-row items-center space-x-4">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                <Ionicons name="calendar" size={20} color="#1E90FF" />
              </View>
              <Text className="text-dark-200 text-base flex-1">
                See your schedule to your Personal Trainer
              </Text>
            </View>

            <View className="flex-row items-center space-x-4">
              <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                <Ionicons name="stats-chart" size={20} color="#1E90FF" />
              </View>
              <Text className="text-dark-200 text-base flex-1">
                Monitor your recent check-ins
              </Text>
            </View>
          </View>
        </View>

        {/* Button Section */}
        <View className="px-6 pb-8">
          <Link href="/screens/LoginScreen" asChild>
            <Button
              title="Get Started"
              onPress={() => {}}
              fullWidth
              icon={<Ionicons name="arrow-forward" size={24} color="white" />}
            />
          </Link>
        </View>
      </View>
    </Container>
  );
}
