import { createCareTask } from "@/api/tasks/care-tasks";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateCareTaskVariables = Parameters<typeof createCareTask>;

export function useCreateCareTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([taskData, token]: CreateCareTaskVariables) =>
      createCareTask(taskData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: careTasksQueryKey });
    },
  });
}
