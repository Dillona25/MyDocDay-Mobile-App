import { updateAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateAppointmentVariables = Parameters<typeof updateAppointment>;

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentData, token]: UpdateAppointmentVariables) =>
      updateAppointment(appointmentData, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: providersQueryKey }),
        queryClient.invalidateQueries({ queryKey: careTasksQueryKey }),
      ]);
    },
  });
}
