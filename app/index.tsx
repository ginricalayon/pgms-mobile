import { Redirect } from "expo-router";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useEffect, useState } from "react";
import { LoadingView } from "@/components/common/LoadingView";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { checkAuth } = useAuthGuard();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setLoading(true);
        const authResult = await checkAuth();
        setIsAuthenticated(authResult.isAuthenticated);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (loading) {
    return <LoadingView message="Checking authentication..." />;
  }

  if (isAuthenticated) {
    if (userRole === "trainer") {
      return <Redirect href="/(trainer-tabs)/dashboard" />;
    } else {
      return <Redirect href="/(tabs)/dashboard" />;
    }
  }

  return <Redirect href="/screens/WelcomeScreen" />;
}
