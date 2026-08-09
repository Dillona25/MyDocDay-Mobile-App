import { createAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type CreateAppointmentVariables = Parameters<typeof createAppointment>;

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentData, token]: CreateAppointmentVariables) =>
      createAppointment(appointmentData, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    },
  });
}
