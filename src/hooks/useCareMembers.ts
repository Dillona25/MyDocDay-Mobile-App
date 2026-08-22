import {
  CareMemberApiError,
  getCareMembers,
} from "@/api/care-members/care-members";
import { useAuth } from "@/store/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const careMembersQueryKey = ["care-members"] as const;

export function useCareMembers() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...careMembersQueryKey, user?.id],
    queryFn: async () => {
      if (!token) return [];
      return (await getCareMembers(token)).careMembers;
    },
    enabled: Boolean(token && user),
    retry: (failureCount, error) => {
      if (error instanceof CareMemberApiError && error.statusCode < 500) {
        return false;
      }

      return failureCount < 2;
    },
  });

  return {
    careMembers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : "",
    refreshCareMembers: () =>
      queryClient.invalidateQueries({ queryKey: careMembersQueryKey }),
  };
}
