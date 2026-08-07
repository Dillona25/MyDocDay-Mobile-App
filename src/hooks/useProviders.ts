import { getUserProviders } from "@/api/providers/get-providers";
import { useAuth } from "@/auth/AuthContext";
import type { Provider } from "@/types/provider";
import { useCallback, useEffect, useState } from "react";

export function useProviders() {
  const { token } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProviders = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await getUserProviders(token);
      setProviders(data.providers);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Unable to load providers.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return {
    providers,
    isLoading,
    error,
    refreshProviders: loadProviders,
  };
}
