import { deleteAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteAppointmentVariables = Parameters<typeof deleteAppointment>;

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentId, token]: DeleteAppointmentVariables) =>
      deleteAppointment(appointmentId, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: providersQueryKey }),
        queryClient.invalidateQueries({ queryKey: careTasksQueryKey }),
      ]);
    },
  });
}
