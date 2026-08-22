import { updateAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { careTasksQueryKey } from "@/hooks/useCareTasks";
import { providersQueryKey } from "@/hooks/useProviders";
import type { Appointment } from "@/types/appointment";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateAppointmentVariables = Parameters<typeof updateAppointment>;

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentData, token]: UpdateAppointmentVariables) =>
      updateAppointment(appointmentData, token),
    onSuccess: async (result) => {
      queryClient.setQueriesData(
        { queryKey: appointmentsQueryKey },
        (current: Appointment[] | undefined) =>
          current?.map((appointment) =>
            appointment.id === result.appointment.id
              ? result.appointment
              : appointment,
          ),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentsQueryKey }),
        queryClient.invalidateQueries({ queryKey: providersQueryKey }),
        queryClient.invalidateQueries({ queryKey: careTasksQueryKey }),
      ]);
    },
  });
}
