import { createAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { providersQueryKey } from "@/hooks/useProviders";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateAppointmentVariables = Parameters<typeof createAppointment>;

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentData, token]: CreateAppointmentVariables) =>
      createAppointment(appointmentData, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: providersQueryKey }),
        queryClient.invalidateQueries({ queryKey: careTasksQueryKey }),
      ]);
    },
  });
}
