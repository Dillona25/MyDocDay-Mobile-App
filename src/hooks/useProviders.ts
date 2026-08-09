import { getUserProviders } from "@/api/providers/providers";
import { useAuth } from "@/store/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const providersQueryKey = ["providers"] as const;

export function useProviders() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: [...providersQueryKey, user?.id],
    queryFn: async () => {
      if (!token) {
        return [];
      }

      const data = await getUserProviders(token);

      return data.providers;
    },
    enabled: Boolean(token && user),
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
