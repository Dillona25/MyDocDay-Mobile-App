import { deleteProvider } from "@/api/providers/providers";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteProviderVariables = Parameters<typeof deleteProvider>;

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([providerId, token]: DeleteProviderVariables) =>
      deleteProvider(providerId, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: providersQueryKey }),
        queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
      ]);
    },
  });
}
