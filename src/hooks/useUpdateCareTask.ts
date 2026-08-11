import { updateCareTask } from "@/api/tasks/care-tasks";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateCareTaskVariables = Parameters<typeof updateCareTask>;

export function useUpdateCareTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([taskData, token]: UpdateCareTaskVariables) =>
      updateCareTask(taskData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careTasksQueryKey });
    },
  });
}
