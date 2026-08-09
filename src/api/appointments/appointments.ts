import type {
  Appointment,
  CreateAppointmentInput,
  GetAppointmentResponse,
} from "@/types/appointment";

export async function getUserAppointments(
  token: string,
): Promise<GetAppointmentResponse> {
  const response = await fetch("https://www.mydocday.com/api/appointments", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load appointments");
  }

  return data;
}

type CreateAppointmentResponse = {
  message: string;
  appointment: Appointment;
};

export async function createAppointment(
  appointmentData: CreateAppointmentInput,
  token: string,
): Promise<CreateAppointmentResponse> {
  const response = await fetch("https://www.mydocday.com/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appointmentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to create appointment");
  }

  return data;
}
