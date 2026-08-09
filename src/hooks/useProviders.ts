import { getUserProviders } from "@/api/providers/providers";
import { useAuth } from "@/store/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const providersQueryKey = ["providers"] as const;

export function useProviders() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: providersQueryKey,
    queryFn: async () => {
      if (!token) {
        return [];
      }

      const data = await getUserProviders(token);

      return data.providers;
    },
    enabled: Boolean(token),
  });

  return {
    providers: providersQuery.data ?? [],
    isLoading: providersQuery.isLoading,
    error:
      providersQuery.error instanceof Error ? providersQuery.error.message : "",
    refreshProviders: () =>
      queryClient.invalidateQueries({ queryKey: providersQueryKey }),
  };
}
