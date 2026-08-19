export type AppointmentFormData = {
  careMemberId: string;
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
};

export type AppointmentProviderSelection = AppointmentFormData["providerSelection"];
