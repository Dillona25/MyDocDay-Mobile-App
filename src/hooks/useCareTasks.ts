import { getCareTasks } from "@/api/tasks/care-tasks";
import { useAuth } from "@/store/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const careTasksQueryKey = ["care-tasks"] as const;

export function useCareTasks() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const careTasksQuery = useQuery({
    queryKey: [...careTasksQueryKey, user?.id],
    queryFn: async () => {
      if (!token) {
        return [];
      }

      const data = await getCareTasks(token);

      return data.tasks;
    },
    enabled: Boolean(token && user),
  });

  return {
    tasks: careTasksQuery.data ?? [],
    isLoading: careTasksQuery.isLoading,
    error:
      careTasksQuery.error instanceof Error
        ? careTasksQuery.error.message
        : "",
    refreshTasks: () =>
      queryClient.invalidateQueries({ queryKey: careTasksQueryKey }),
  };
}
