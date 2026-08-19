export type ProviderType = "provider" | "clinic";

export type NextAppointmentStatus =
  | "scheduled"
  | "not_scheduled"
  | "unsure"
  | "not_needed";

export type CareMemberSummary = {
  id: number;
  firstName: string;
  lastName: string | null;
  relationship: string;
};

export type ProviderVisitSchedule = {
  id: number;
  careMemberId: number | null;
  careMember: CareMemberSummary | null;
  annualMonths: number[];
  nextVisitDueDate: string | null;
  reminderLeadDays: number | null;
  secondReminderLeadDays: number | null;
  configuredNextAppointmentStatus?: NextAppointmentStatus;
  nextAppointmentStatus: NextAppointmentStatus;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProviderVisitScheduleInput = {
  annualMonths: number[];
  reminderLeadDays?: number;
  secondReminderLeadDays?: number;
  nextAppointmentStatus: NextAppointmentStatus;
};

export type Provider = {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  clinicName: string | null;
  specialty: string;
  type: ProviderType;
  phoneNumber: string | null;
  imageUrl: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isForAccountOwner: boolean;
  careMembers: CareMemberSummary[];
  visitSchedule: ProviderVisitSchedule | null;
  visitSchedules: ProviderVisitSchedule[];
  createdAt: string;
  updatedAt: string;
};

export type GetProvidersResponse = {
  message: string;
  providers: Provider[];
};

export type CreateProviderInput = {
  isForAccountOwner: boolean;
  careMemberIds: number[];
  firstName?: string;
  lastName?: string;
  clinicName?: string;
  specialty: string;
  type: ProviderType;
  phoneNumber?: string;
  imageUrl?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  visitSchedule?: ProviderVisitScheduleInput | null;
};

export type UpdateProviderInput = CreateProviderInput & {
  providerId: number;
};
