import { ProviderType } from "./provider";

type AppointmentType = "in_person" | "telehealth";

export type Appointment = {
  id: number;
  userId: number;
  providerId: number | null;
  title: string;
  date: string;
  startTime: string;
  appointmentType: AppointmentType;
  doctorName: string | null;
  providerType: ProviderType | null;
  createdAt: string;
  updatedAt: string;
};

export type GetAppointmentResponse = {
  message: string;
  appointments: Appointment[];
};
