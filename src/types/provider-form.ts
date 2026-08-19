import type { NextAppointmentStatus, ProviderType } from "./provider";

export type VisitScheduleAnswer = "" | "annual_months" | "none" | "unsure";

export type ProviderFormData = {
  isForAccountOwner: boolean;
  careMemberIds: number[];
  firstName: string;
  lastName: string;
  clinicName: string;
  specialty: string;
  phoneNumber: string;
  type: ProviderType | "";
  imageUrl: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  scheduleAnswer: VisitScheduleAnswer;
  annualMonths: number[];
  nextAppointmentStatus: NextAppointmentStatus | "";
  reminderLeadDays: number;
  secondReminderLeadDays: number | null;
};
