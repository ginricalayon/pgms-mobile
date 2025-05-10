import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "../../utils/dateUtils";
import { LoadingView } from "../../components/common/LoadingView";

export default function EditProfileScreen() {
  const router = useRouter();
  const { profileData: profileDataParam } = useLocalSearchParams();
  const { user } = useAuth();

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
    return <LoadingView message="Loading profile data..." />;
  }

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6 mt-4">
          {/* Header with back button */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="#1E90FF" />
            </TouchableOpacity>
            <Text className="text-text-primary text-2xl font-bold mx-auto pr-10">
              Edit Profile
            </Text>
          </View>

          {error && (
            <View className="bg-red-100 p-3 rounded-lg mb-4">
              <Text className="text-red-500">{error}</Text>
            </View>
          )}

          <InputField
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={(text) => handleFieldChange("firstName", text)}
            error={errors.firstName}
            autoCapitalize="words"
          />

          <InputField
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={(text) => handleFieldChange("lastName", text)}
            error={errors.lastName}
            autoCapitalize="words"
          />

          {/* Gender Dropdown */}
          <View className="mb-4">
            <Text className="text-dark-200 font-medium mb-1 text-sm">
              Gender
            </Text>
            <TouchableOpacity
              onPress={() => setShowGenderModal(true)}
              className="bg-light-100 p-4 rounded-lg flex-row justify-between items-center"
            >
              <Text className={gender ? "text-dark-200" : "text-blue-300"}>
                {gender || "Select your gender"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#64B5F6" />
            </TouchableOpacity>
            {errors.gender ? (
              <Text className="text-red-500 mt-1 text-xs">{errors.gender}</Text>
            ) : null}
          </View>

          {/* Gender Selection Modal */}
          <Modal
            visible={showGenderModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="bg-white w-4/5 rounded-lg p-4">
                <Text className="text-dark-200 font-bold text-lg mb-4 text-center">
                  Select Gender
                </Text>

                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() => handleSelectGender(option)}
                    className={`p-3 border-b border-gray-100 ${
                      option === gender ? "bg-blue-50" : ""
                    }`}
                  >
                    <Text
                      className={`${
                        option === gender
                          ? "text-blue-500 font-medium"
                          : "text-dark-200"
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => setShowGenderModal(false)}
                  className="mt-4 p-3 bg-gray-100 rounded-lg"
                >
                  <Text className="text-dark-200 text-center font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Birthdate Field */}
          <View className="mb-4">
            <Text className="text-dark-200 font-medium mb-1 text-sm">
              Birthdate
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-light-100 p-4 rounded-lg flex-row justify-between items-center"
            >
              <Text className="text-dark-200">
                {formatDate(birthdate.toISOString())}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#64B5F6" />
            </TouchableOpacity>
            {errors.birthdate ? (
              <Text className="text-red-500 mt-1 text-xs">
                {errors.birthdate}
              </Text>
            ) : null}
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={birthdate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
              style={{ marginBottom: 10 }}
            />
          )}

          {/* Address Fields */}
          <View className="mb-2">
            <Text className="text-dark-200 font-medium mb-2 text-base">
              Address
            </Text>
          </View>

          <InputField
            label="Street"
            placeholder="Enter your street address (letters and numbers)"
            value={street}
            onChangeText={(text) => handleFieldChange("street", text)}
            error={errors.street}
            autoCapitalize="sentences"
          />

          <InputField
            label="Barangay"
            placeholder="Enter your barangay (letters only)"
            value={barangay}
            onChangeText={(text) => handleFieldChange("barangay", text)}
            error={errors.barangay}
            autoCapitalize="words"
          />

          <InputField
            label="City"
            placeholder="Enter your city (letters only)"
            value={city}
            onChangeText={(text) => handleFieldChange("city", text)}
            error={errors.city}
            autoCapitalize="words"
          />

          <InputField
            label="Phone Number"
            placeholder="Enter your phone number (09XXXXXXXXX)"
            value={phoneNumber}
            onChangeText={(text) => handleFieldChange("phoneNumber", text)}
            error={errors.phoneNumber}
            keyboardType="phone-pad"
          />

          <View className="mt-6 mb-4">
            <Button
              title={submitting ? "Saving..." : "Save Changes"}
              onPress={handleSubmitButton}
              fullWidth
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
