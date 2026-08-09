import { updateAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type UpdateAppointmentVariables = Parameters<typeof updateAppointment>;

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentData, token]: UpdateAppointmentVariables) =>
      updateAppointment(appointmentData, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    },
  });
}
