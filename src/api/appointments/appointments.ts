import { GetAppointmentResponse } from "@/types/appointment";

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
