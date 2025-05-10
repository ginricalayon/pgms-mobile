import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Container } from "../../../components/common/Container";
import { Button } from "../../../components/common/Button";
import { useAuth } from "../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "../../../services";
import ProfileInfo from "../../../components/ProfileInfo";
import { formatDate } from "../../../utils/dateUtils";
import { LoadingView } from "../../../components/common/LoadingView";
import { ErrorView } from "../../../components/common/ErrorView";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{ user: ProfileData } | null>(
    null
  );
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await memberService.getProfile();
      setProfileData(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchProfile();
      }
    }, [user])
  );

  const handleLogoutButton = () => {
    Alert.alert("Logout", "Are you sure you want to log out of your account?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => handleLogout(),
      },
    ]);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/screens/LoginScreen");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEditProfile = () => {
    if (profileData?.user) {
      router.push({
        pathname: "/screens/EditProfileScreen",
        params: { profileData: JSON.stringify(profileData.user) },
      });
    }
  };

  if (loading) {
    return <LoadingView message="Loading profile..." />;
  }

  if (error) {
    return (
      <ErrorView
        title="We couldn't load your profile"
        message={error}
        onRetry={fetchProfile}
      />
    );
  }

  return (
    <Container>
      <ScrollView
        className={`flex-1 px-4 py-6 ${
          Platform.OS === "android" ? "mb-24" : "mb-2"
        }`}
      >
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text className="text-text-primary text-2xl font-bold">Profile</Text>
        </View>

        {/* Profile Image Section */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200 items-center">
          <View className="bg-light-100 rounded-full h-32 w-32 items-center justify-center mb-4">
            {profileData?.user?.picture && (
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${profileData.user.picture}`,
                }}
                style={{ width: 110, height: 110, borderRadius: 70 }}
                resizeMode="cover"
              />
            )}
          </View>
          <View className="flex-row items-center">
            <Text className="text-text-primary text-xl font-bold">
              {profileData?.user?.firstName && profileData?.user?.lastName
                ? `${profileData.user.firstName} ${profileData.user.lastName}`
                : "Member"}
            </Text>
            {profileData?.user?.isRegular === 1 && (
              <TouchableOpacity
                onPress={() => setTooltipVisible(!tooltipVisible)}
                style={{ position: "relative" }}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#22C55E"
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-text-secondary mt-1">
            Member ID: {profileData?.user?.membershipId || "N/A"}
          </Text>
          {tooltipVisible && (
            <View
              className="absolute z-10 bg-white p-2 rounded shadow-lg"
              style={{ top: 170, left: 170 }}
            >
              <Text className="text-text-primary text-xs">Regular Member</Text>
            </View>
          )}
        </View>

        {/* Profile Information */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-light-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="person-circle-outline" size={22} color="#2563EB" />
            <Text className="text-text-primary text-lg font-bold ml-2">
              Personal Information
            </Text>
          </View>
          <ProfileInfo label="Gender" value={profileData?.user?.gender} />
          <ProfileInfo
            label="Birthdate"
            value={formatDate(profileData?.user?.birthdate)}
          />
          <ProfileInfo label="Address" value={profileData?.user?.address} />
          <ProfileInfo
            label="Phone Number"
            value={profileData?.user?.phoneNumber}
            isLast={true}
          />
        </View>

        {/* Actions */}
        <View className="bg-white rounded-xl p-6 shadow-sm mb-20 border border-light-200">
          <View className="flex-row items-center mb-4">
            <Ionicons name="settings-outline" size={22} color="#2563EB" />
            <Text className="text-text-primary text-lg font-bold ml-2">
              Account Settings
            </Text>
          </View>
          <View className="flex-col items-center gap-4">
            <Button
              title="Edit Profile"
              onPress={handleEditProfile}
              fullWidth
            />
            <Button
              title="Change Username"
              onPress={() =>
                router.push({ pathname: "/screens/ChangeUsernameScreen" })
              }
              variant="text"
            />
            <Button
              title="Change Password"
              onPress={() =>
                router.push({ pathname: "/screens/ChangePasswordScreen" })
              }
              variant="text"
            />
            <Button
              title="Logout"
              onPress={handleLogoutButton}
              variant="text"
              color="text-error"
            />
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
