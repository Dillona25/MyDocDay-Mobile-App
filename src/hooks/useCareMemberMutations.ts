import {
  archiveCareMember,
  createCareMember,
  updateCareMember,
} from "@/api/care-members/care-members";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { careMembersQueryKey } from "@/hooks/useCareMembers";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const relatedQueryKeys = [
  careMembersQueryKey,
  providersQueryKey,
  appointmentsQueryKey,
  careTasksQueryKey,
] as const;

export function useCreateCareMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Parameters<typeof createCareMember>) =>
      createCareMember(...variables),
    onSuccess: () => invalidateRelatedQueries(queryClient),
  });
}

export function useUpdateCareMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Parameters<typeof updateCareMember>) =>
      updateCareMember(...variables),
    onSuccess: () => invalidateRelatedQueries(queryClient),
  });
}

export function useArchiveCareMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Parameters<typeof archiveCareMember>) =>
      archiveCareMember(...variables),
    onSuccess: () => invalidateRelatedQueries(queryClient),
  });
}

async function invalidateRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all(
    relatedQueryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
