import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Container } from "../../components/common/Container";
import { Button } from "../../components/common/Button";
import { InputField } from "../../components/common/InputField";
import { Ionicons } from "@expo/vector-icons";
import { memberService } from "../../services";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "../../utils/dateUtils";
import { LoadingView } from "../../components/common/LoadingView";
import { ErrorView } from "@/components/common/ErrorView";

export default function EditProfileScreen() {
  const router = useRouter();
  const { profileData: profileDataParam } = useLocalSearchParams();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [showGenderModal, setShowGenderModal] = useState(false);

  const genderOptions = ["Male", "Female"];

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    birthdate: "",
    street: "",
    barangay: "",
    city: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (!user) {
      router.replace("/screens/LoginScreen");
      return;
    }

    if (profileDataParam) {
      try {
        const parsedData = JSON.parse(
          profileDataParam as string
        ) as ProfileData;
        setFirstName(parsedData.firstName || "");
        setLastName(parsedData.lastName || "");

        const formattedGender = parsedData.gender
          ? parsedData.gender.charAt(0).toUpperCase() +
            parsedData.gender.slice(1).toLowerCase()
          : "";
        setGender(formattedGender);

        if (parsedData.birthdate) {
          setBirthdate(new Date(parsedData.birthdate));
        }

        const addressParts = (parsedData.address || "")
          .split(",")
          .map((part: string) => part.trim());
        setStreet(addressParts[0] || "");
        setBarangay(addressParts[1] || "");
        setCity(addressParts[2] || "");

        setPhoneNumber(parsedData.phoneNumber || "");
      } catch (err) {
        console.log("Error parsing profile data:", err);
        setError("Failed to load profile data");
      }
    } else {
      fetchProfile();
    }
  }, [profileDataParam]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await memberService.getProfile();
      if (data.success && data.user) {
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");

        const formattedGender = data.user.gender
          ? data.user.gender.charAt(0).toUpperCase() +
            data.user.gender.slice(1).toLowerCase()
          : "";
        setGender(formattedGender);

        if (data.user.birthdate) {
          setBirthdate(new Date(data.user.birthdate));
        }

        const addressParts = (data.user.address || "")
          .split(",")
          .map((part: string) => part.trim());
        setStreet(addressParts[0] || "");
        setBarangay(addressParts[1] || "");
        setCity(addressParts[2] || "");

        setPhoneNumber(data.user.phoneNumber || "");
      }
    } catch (err: any) {
      console.log("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const lettersOnlyPattern = /^[A-Za-z\s]+$/;
  const alphanumericPattern = /^[A-Za-z0-9\s.,#-]+$/;

  const validateField = (field: string, value: string | Date) => {
    let errorMessage = "";

    switch (field) {
      case "firstName":
        if (!value) {
          errorMessage = "First name is required";
        } else if (!lettersOnlyPattern.test(value as string)) {
          errorMessage = "First name should contain only letters";
        }
        break;
      case "lastName":
        if (!value) {
          errorMessage = "Last name is required";
        } else if (!lettersOnlyPattern.test(value as string)) {
          errorMessage = "Last name should contain only letters";
        }
        break;
      case "gender":
        if (!value) {
          errorMessage = "Gender is required";
        }
        break;
      case "birthdate":
        if (value && (value as Date) > new Date()) {
          errorMessage = "Birthdate cannot be in the future";
        }

        const minAge = 16;
        const maxAge = 59;
        const today = new Date();
        const minDateAllowed = new Date(
          today.getFullYear() - minAge,
          today.getMonth(),
          today.getDate()
        );
        const maxDateAllowed = new Date(
          today.getFullYear() - maxAge,
          today.getMonth(),
          today.getDate()
        );

        if (value && (value as Date) > minDateAllowed) {
          errorMessage = `You must be at least ${minAge} years old`;
        } else if (value && (value as Date) < maxDateAllowed) {
          errorMessage = `You cannot be older than ${maxAge} years old`;
        }
        break;
      case "street":
        if (!value) {
          errorMessage = "Street address is required";
        } else if (!alphanumericPattern.test(value as string)) {
          errorMessage =
            "Street should contain only letters, numbers, and basic punctuation";
        }
        break;
      case "barangay":
        if (!value) {
          errorMessage = "Barangay is required";
        } else if (!lettersOnlyPattern.test(value as string)) {
          errorMessage = "Barangay should contain only letters";
        }
        break;
      case "city":
        if (!value) {
          errorMessage = "City is required";
        } else if (!lettersOnlyPattern.test(value as string)) {
          errorMessage = "City should contain only letters";
        }
        break;
      case "phoneNumber":
        if (!value) {
          errorMessage = "Phone number is required";
        } else if ((value as string).length !== 11) {
          errorMessage = "Phone number must be exactly 11 digits";
        } else if (!(value as string).startsWith("09")) {
          errorMessage = "Phone number must start with 09";
        } else if (!/^\d+$/.test(value as string)) {
          errorMessage = "Phone number must contain only digits";
        }
        break;
      default:
        break;
    }

    return errorMessage;
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "firstName":
        if (value === "" || lettersOnlyPattern.test(value)) {
          setFirstName(value);
        }
        break;
      case "lastName":
        if (value === "" || lettersOnlyPattern.test(value)) {
          setLastName(value);
        }
        break;
      case "gender":
        setGender(value);
        break;
      case "street":
        if (value === "" || alphanumericPattern.test(value)) {
          setStreet(value);
        }
        break;
      case "barangay":
        if (value === "" || lettersOnlyPattern.test(value)) {
          setBarangay(value);
        }
        break;
      case "city":
        if (value === "" || lettersOnlyPattern.test(value)) {
          setCity(value);
        }
        break;
      case "phoneNumber":
        if (value === "" || /^\d+$/.test(value)) {
          setPhoneNumber(value);
        }
        break;
      default:
        break;
    }

    // Validate and update error message
    const errorMessage = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
  };

  const handleSelectGender = (selectedGender: string) => {
    handleFieldChange("gender", selectedGender);
    setShowGenderModal(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || birthdate;
    setShowDatePicker(Platform.OS === "ios");
    setBirthdate(currentDate);

    const errorMessage = validateField("birthdate", currentDate);
    setErrors((prev) => ({
      ...prev,
      birthdate: errorMessage,
    }));
  };

  const validateForm = () => {
    const newErrors = {
      firstName: validateField("firstName", firstName),
      lastName: validateField("lastName", lastName),
      gender: validateField("gender", gender),
      birthdate: validateField("birthdate", birthdate),
      street: validateField("street", street),
      barangay: validateField("barangay", barangay),
      city: validateField("city", city),
      phoneNumber: validateField("phoneNumber", phoneNumber),
    };

    setErrors(newErrors);

    // Check if there are any error messages
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmitButton = () => {
    if (!validateForm()) {
      return;
    }

    Alert.alert(
      "Save Changes",
      "Are you sure you want to save these changes to your profile?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
          onPress: () => handleSubmit(),
        },
      ]
    );
  };

  const handleSubmit = async () => {
    const formattedAddress = `${street}, ${barangay}, ${city}`;

    try {
      setSubmitting(true);

      const localDate = new Date(birthdate);
      const formattedDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];

      const response = await memberService.updateProfile({
        firstName,
        lastName,
        gender,
        birthdate: formattedDate,
        address: formattedAddress,
        phoneNumber,
      });

      if (response.success) {
        Alert.alert("Success", "Your profile has been updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingView
        message="Loading profile data..."
        color={isDarkMode ? "#808080" : "#2563EB"}
      />
    );
  }

  if (error) {
    return (
      <ErrorView
        title="Error loading profile data"
        message={error}
        onRetry={fetchProfile}
      />
    );
  }

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? "#60A5FA" : "#1E90FF"}
              />
            </TouchableOpacity>
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-2xl font-bold mx-auto pr-10`}
            >
              Edit Profile
            </Text>
          </View>

          <View className="space-y-4">
            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-xl font-bold`}
            >
              Personal Information
            </Text>

            <InputField
              label="First Name"
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={(text) => handleFieldChange("firstName", text)}
              error={errors.firstName}
            />

            <InputField
              label="Last Name"
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={(text) => handleFieldChange("lastName", text)}
              error={errors.lastName}
            />

            <View className="mb-4">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-medium mb-1 text-sm`}
              >
                Gender
              </Text>
              <TouchableOpacity
                onPress={() => setShowGenderModal(true)}
                className={`flex-row items-center justify-between ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-light-100 border-light-200"
                } border rounded-lg p-4 ${errors.gender ? "border-error" : ""}`}
              >
                <Text
                  className={`${
                    isDarkMode
                      ? gender
                        ? "text-white"
                        : "text-gray-500"
                      : gender
                      ? "text-text-primary"
                      : "text-gray-400"
                  }`}
                >
                  {gender || "Select your gender"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={isDarkMode ? "#60A5FA" : "#2563EB"}
                />
              </TouchableOpacity>
              {errors.gender ? (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text className="text-error ml-1 text-xs">
                    {errors.gender}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mb-4">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } font-medium mb-1 text-sm`}
              >
                Birthdate
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className={`flex-row items-center justify-between ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-light-100 border-light-200"
                } border rounded-lg p-4 ${
                  errors.birthdate ? "border-error" : ""
                }`}
              >
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  }`}
                >
                  {formatDate(birthdate.toString())}
                </Text>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={isDarkMode ? "#60A5FA" : "#2563EB"}
                />
              </TouchableOpacity>
              {errors.birthdate ? (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text className="text-error ml-1 text-xs">
                    {errors.birthdate}
                  </Text>
                </View>
              ) : null}
              {showDatePicker && (
                <DateTimePicker
                  value={birthdate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-xl font-bold mt-4`}
            >
              Address Information
            </Text>

            <InputField
              label="Street Address"
              placeholder="Enter your street address"
              value={street}
              onChangeText={(text) => handleFieldChange("street", text)}
              error={errors.street}
            />

            <InputField
              label="Barangay"
              placeholder="Enter your barangay"
              value={barangay}
              onChangeText={(text) => handleFieldChange("barangay", text)}
              error={errors.barangay}
            />

            <InputField
              label="City"
              placeholder="Enter your city"
              value={city}
              onChangeText={(text) => handleFieldChange("city", text)}
              error={errors.city}
            />

            <Text
              className={`${
                isDarkMode ? "text-white" : "text-text-primary"
              } text-xl font-bold mt-4`}
            >
              Contact Information
            </Text>

            <InputField
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={(text) => handleFieldChange("phoneNumber", text)}
              keyboardType="phone-pad"
              error={errors.phoneNumber}
            />
          </View>

          <View className="mt-8 mb-10">
            <Button
              title={submitting ? "Saving Changes..." : "Save Changes"}
              onPress={handleSubmitButton}
              disabled={submitting}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showGenderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className={`${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } rounded-t-3xl p-6`}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className={`${
                  isDarkMode ? "text-white" : "text-text-primary"
                } text-xl font-bold`}
              >
                Select Gender
              </Text>
              <TouchableOpacity
                onPress={() => setShowGenderModal(false)}
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-light-100"
                } rounded-full p-2`}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#FFFFFF" : "#1E90FF"}
                />
              </TouchableOpacity>
            </View>

            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-light-100"
                } p-4 rounded-lg mb-3 flex-row justify-between items-center`}
                onPress={() => handleSelectGender(option)}
              >
                <Text
                  className={`${
                    isDarkMode ? "text-white" : "text-text-primary"
                  } text-lg`}
                >
                  {option}
                </Text>
                {gender === option && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={isDarkMode ? "#60A5FA" : "#2563EB"}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </Container>
  );
}
