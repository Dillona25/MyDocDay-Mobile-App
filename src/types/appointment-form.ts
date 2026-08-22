export type AppointmentFormData = {
  title: string;
  date: string;
  startTime: string;
  appointmentType: "in_person" | "telehealth" | "";
  providerSelection: "saved" | "other" | "";
  providerId: string;
  doctorName: string;
  location: string;
  providerVisitWindowResponse: "" | "covers" | "separate";
  providerVisitWindowDate: string | null;
  recurrenceStatus: "recurring" | "not_recurring" | "unsure" | "";
  recurrencePattern:
    | "three_months"
    | "six_months"
    | "one_year"
    | "custom"
    | "";
  recurrenceIntervalValue: string;
  recurrenceIntervalUnit: "weeks" | "months" | "years";
  recurrenceReminderLeadDays: "14" | "30" | "60";
};

export type AppointmentProviderSelection = AppointmentFormData["providerSelection"];
