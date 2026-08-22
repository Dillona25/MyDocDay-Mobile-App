import { ProviderType } from "./provider";

type AppointmentType = "in_person" | "telehealth";
export type AppointmentRecurrenceStatus =
  | "recurring"
  | "not_recurring"
  | "unsure";
export type AppointmentRecurrenceUnit = "weeks" | "months" | "years";

export type AppointmentRecurrenceInput = {
  intervalValue: number;
  intervalUnit: AppointmentRecurrenceUnit;
  reminderLeadDays?: number;
};

export type AppointmentRecurrence = {
  id: number;
  intervalValue: number;
  intervalUnit: AppointmentRecurrenceUnit;
  reminderLeadDays: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

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
  timezone: string | null;
  appointmentType: AppointmentType;
  doctorName: string | null;
  providerType: ProviderType | null;
  location: string | null;
  recurrenceStatus: AppointmentRecurrenceStatus;
  recurrence: AppointmentRecurrence | null;
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
  timezone?: string;
  appointmentType: AppointmentType;
  providerId?: number;
  doctorName?: string;
  location?: string;
  recurrenceStatus?: AppointmentRecurrenceStatus;
  recurrence?: AppointmentRecurrenceInput | null;
  providerVisitWindowDate?: string | null;
};

export type UpdateAppointmentInput = CreateAppointmentInput & {
  appointmentId: number;
};
