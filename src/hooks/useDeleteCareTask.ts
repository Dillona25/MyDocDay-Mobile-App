import { deleteCareTask } from "@/api/tasks/care-tasks";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteCareTaskVariables = Parameters<typeof deleteCareTask>;

export function useDeleteCareTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([taskId, token]: DeleteCareTaskVariables) =>
      deleteCareTask(taskId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careTasksQueryKey });
    },
  });
}
