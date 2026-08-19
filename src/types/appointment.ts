import { ProviderType } from "./provider";

type AppointmentType = "in_person" | "telehealth";

export type Appointment = {
  id: number;
  userId: number;
  providerId: number | null;
  careMemberId: number | null;
  careMember: {
    id: number;
    firstName: string;
    lastName: string | null;
    relationship: string;
  } | null;
  title: string;
  date: string;
  startTime: string;
  appointmentType: AppointmentType;
  doctorName: string | null;
  providerType: ProviderType | null;
  location: string | null;
  providerVisitWindowDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GetAppointmentResponse = {
  message: string;
  appointments: Appointment[];
};

export type CreateAppointmentInput = {
  careMemberId?: number;
  title: string;
  date: string;
  startTime: string;
  appointmentType: AppointmentType;
  providerId?: number;
  doctorName?: string;
  location?: string;
  providerVisitWindowDate?: string | null;
};

export type UpdateAppointmentInput = CreateAppointmentInput & {
  appointmentId: number;
};
