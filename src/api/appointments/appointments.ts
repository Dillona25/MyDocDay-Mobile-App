import type {
  Appointment,
  CreateAppointmentInput,
  GetAppointmentResponse,
  UpdateAppointmentInput,
} from "@/types/appointment";

export async function getUserAppointments(
  token: string,
): Promise<GetAppointmentResponse> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/appointments`, {
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
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appointmentData),
  });

  const data = await response.json();

  if (!response.ok) {
    const validationMessage = Object.values(
      (data.errors ?? {}) as Record<string, string[]>,
    )
      .flat()
      .find(Boolean);

    throw new Error(
      validationMessage ?? data.message ?? "Unable to create appointment",
    );
  }

  return data;
}

type UpdateAppointmentResponse = {
  message: string;
  appointment: Appointment;
};

export async function updateAppointment(
  appointmentData: UpdateAppointmentInput,
  token: string,
): Promise<UpdateAppointmentResponse> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/appointments`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(appointmentData),
  });

  const data = await response.json();

  if (!response.ok) {
    const validationMessage = Object.values(
      (data.errors ?? {}) as Record<string, string[]>,
    )
      .flat()
      .find(Boolean);

    throw new Error(
      validationMessage ?? data.message ?? "Unable to update appointment",
    );
  }

  return data;
}

type DeleteAppointmentResponse = {
  message: string;
};

export async function deleteAppointment(
  appointmentId: number,
  token: string,
): Promise<DeleteAppointmentResponse> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/appointments`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ appointmentId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to delete appointment");
  }

  return data;
}
