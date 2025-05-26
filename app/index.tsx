import { Redirect } from "expo-router";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useEffect, useState } from "react";
import { LoadingView } from "@/components/common/LoadingView";

export default function Index() {
  const { checkAuth } = useAuthGuard();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
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
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/screens/WelcomeScreen" />;
}
