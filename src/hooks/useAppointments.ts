import { getUserAppointments } from "@/api/appointments/appointments";
import { useAuth } from "@/store/auth/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const appointmentsQueryKey = ["appointments"] as const;

export function useAppointments() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: [...appointmentsQueryKey, user?.id],
    queryFn: async () => {
      if (!token) {
        return [];
      }

      const data = await getUserAppointments(token);

      return data.appointments;
    },
    enabled: Boolean(token && user),
  });

  return {
    appointments: appointmentsQuery.data ?? [],
    isLoadingApt: appointmentsQuery.isLoading,
    aptError:
      appointmentsQuery.error instanceof Error
        ? appointmentsQuery.error.message
        : "",
    refreshAppointments: () =>
      queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
  };
}
