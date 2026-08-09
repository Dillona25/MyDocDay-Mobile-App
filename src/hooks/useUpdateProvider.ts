import { updateProvider } from "@/api/providers/providers";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateProviderVariables = Parameters<typeof updateProvider>;

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([providerData, token]: UpdateProviderVariables) =>
      updateProvider(providerData, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: providersQueryKey }),
        queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
      ]);
    },
  });
}
