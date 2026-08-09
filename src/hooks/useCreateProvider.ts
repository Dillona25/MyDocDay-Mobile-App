import { createProvider } from "@/api/providers/providers";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateProviderVariables = Parameters<typeof createProvider>;

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([providerData, token]: CreateProviderVariables) =>
      createProvider(providerData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersQueryKey });
    },
  });
}
