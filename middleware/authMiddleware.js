import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/config/apiConfig";

let authContextLogout = null;

export const setAuthLogout = (logoutFn) => {
  authContextLogout = logoutFn;
};

export const clientAuthMiddleware = {
  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem("pgms_token");

      if (!token) {
        return {
          isAuthenticated: false,
          error: "No authentication token found",
        };
      }

      try {
        const response = await api.get("/auth/verify", {
          headers: {
            "x-auth-token": token,
          },
        });

        return {
          isAuthenticated: true,
          user: response.data.user,
        };
      } catch (error) {
        await AsyncStorage.removeItem("pgms_token");
        await AsyncStorage.removeItem("pgms_user");

        return {
          isAuthenticated: false,
          error: "Invalid or expired token",
        };
      }
    } catch (error) {
      return {
        isAuthenticated: false,
        error: "Authentication check failed",
      };
    }
  },

  requireAuth: async (onSuccess, customMessage) => {
    const authResult = await clientAuthMiddleware.checkAuth();

    if (!authResult.isAuthenticated) {
      const message =
        customMessage ||
        "You need to be logged in to access this feature. Please log in to continue.";

      Alert.alert(
        "Authentication Required",
        message,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/screens/LoginScreen");
            },
          },
        ],
        { cancelable: false }
      );

      return false;
    }

    if (onSuccess) {
      onSuccess(authResult.user);
    }

    return true;
  },

  withAuth: (WrappedComponent, customMessage) => {
    return function AuthenticatedComponent(props) {
      const [isChecking, setIsChecking] = React.useState(true);
      const [isAuthenticated, setIsAuthenticated] = React.useState(false);

      React.useEffect(() => {
        const checkAuthentication = async () => {
          const authResult = await clientAuthMiddleware.checkAuth();

          if (!authResult.isAuthenticated) {
            const message =
              customMessage ||
              "You need to be logged in to access this screen. Please log in to continue.";

            Alert.alert(
              "Authentication Required",
              message,
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.replace("/screens/LoginScreen");
                  },
                },
              ],
              { cancelable: false }
            );
          } else {
            setIsAuthenticated(true);
          }

          setIsChecking(false);
        };

        checkAuthentication();
      }, []);

      if (isChecking) {
        return null;
      }

      if (!isAuthenticated) {
        return null;
      }

      return <WrappedComponent {...props} />;
    };
  },

  withRealtimeAuth: (
    WrappedComponent,
    customMessage,
    checkInterval = 30000
  ) => {
    return function RealtimeAuthenticatedComponent(props) {
      const [isChecking, setIsChecking] = React.useState(true);
      const [isAuthenticated, setIsAuthenticated] = React.useState(false);
      const [showingExpiredAlert, setShowingExpiredAlert] =
        React.useState(false);
      const intervalRef = React.useRef(null);
      const alertShownRef = React.useRef(false);

      const performLogout = async () => {
        try {
          await AsyncStorage.removeItem("pgms_token");
          await AsyncStorage.removeItem("pgms_user");

          if (authContextLogout) {
            await authContextLogout();
          }
        } catch (error) {
          console.log("Logout error:", error);
        }
      };

      const checkAuthentication = async (showAlert = true) => {
        if (alertShownRef.current) {
          return false;
        }

        const authResult = await clientAuthMiddleware.checkAuth();

        if (!authResult.isAuthenticated) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          if (showAlert && !alertShownRef.current) {
            alertShownRef.current = true;
            setShowingExpiredAlert(true);

            const message =
              customMessage ||
              "Your session has expired. Please log in again to continue.";

            Alert.alert(
              "Session Expired",
              message,
              [
                {
                  text: "OK",
                  onPress: async () => {
                    try {
                      await performLogout();
                      router.replace("/screens/LoginScreen");
                    } catch (error) {
                      console.log("Navigation error:", error);
                      router.replace("/screens/LoginScreen");
                    }
                  },
                },
              ],
              { cancelable: false }
            );
          }

          setIsAuthenticated(false);
          return false;
        } else {
          setIsAuthenticated(true);
          return true;
        }
      };

      React.useEffect(() => {
        const initialCheck = async () => {
          const isValid = await checkAuthentication(true);
          setIsChecking(false);

          if (isValid) {
            intervalRef.current = setInterval(() => {
              checkAuthentication(true);
            }, checkInterval);
          }
        };

        initialCheck();

        return () => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          alertShownRef.current = false;
        };
      }, []);

      React.useEffect(() => {
        if (!isAuthenticated && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, [isAuthenticated]);

      if (isChecking) {
        return null;
      }

      if (!isAuthenticated && !showingExpiredAlert) {
        return null;
      }

      return <WrappedComponent {...props} />;
    };
  },
};

export default clientAuthMiddleware;
