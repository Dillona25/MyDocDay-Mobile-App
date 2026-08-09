import { deleteAppointment } from "@/api/appointments/appointments";
import { appointmentsQueryKey } from "@/hooks/useAppointments";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteAppointmentVariables = Parameters<typeof deleteAppointment>;

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ([appointmentId, token]: DeleteAppointmentVariables) =>
      deleteAppointment(appointmentId, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: appointmentsQueryKey });
    },
  });
}
