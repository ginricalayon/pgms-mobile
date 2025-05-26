import { useCallback } from "react";
import { clientAuthMiddleware } from "@/middleware/authMiddleware";

export const useAuthGuard = () => {
  const requireAuth = useCallback(async (onSuccess, customMessage) => {
    return await clientAuthMiddleware.requireAuth(onSuccess, customMessage);
  }, []);

  const checkAuth = useCallback(async () => {
    return await clientAuthMiddleware.checkAuth();
  }, []);

  return {
    requireAuth,
    checkAuth,
    withAuth: clientAuthMiddleware.withAuth,
  };
};

export default useAuthGuard;
